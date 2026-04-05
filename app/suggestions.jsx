import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import JobCard from "@/components/JobCard";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { JOB_REQUIREMENTS } from "@/constants/jobrequirements";
import { CNAPS_CARDS } from "@/constants/cnapscards";
import { DIPLOMAS } from "@/constants/diplomas";
import { CATEGORY } from "@/constants/categories";
import { regions } from "@/constants/regions";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

import { Sparkles, IdCard, MapPin, ChevronLeft } from "lucide-react-native";

const getRegionName = (code) =>
	regions.find((r) => r.code === String(code))?.nom ?? String(code);

const SuggestionsScreen = () => {
	const { user, userProfile } = useAuth();
	const { getAll } = useDataContext();
	const router = useRouter();
	const { isDark } = useTheme();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const borderColor = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textMuted = isDark ? Colors.dark.muted : Colors.light.muted;

	const [jobs, setJobs] = useState([]);
	const [eligibleCategories, setEligibleCategories] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const load = useCallback(async () => {
		if (!user?.id) return;
		setLoading(true);
		try {
			const [cnapsRes, diplomasRes, certsRes] = await Promise.all([
				getAll(
					"user_cnaps_cards",
					"type",
					`&user_id=eq.${user.id}&status=eq.verified`,
					1,
					100,
				),
				getAll(
					"user_diplomas",
					"type",
					`&user_id=eq.${user.id}&status=eq.verified`,
					1,
					100,
				),
				getAll(
					"user_certifications",
					"type",
					`&user_id=eq.${user.id}&status=eq.verified`,
					1,
					100,
				),
			]);

			const userCnaps = new Set(
				(cnapsRes.data || [])
					.map(
						(r) =>
							CNAPS_CARDS[r.type?.toLowerCase()]?.acronym ??
							r.type?.toUpperCase(),
					)
					.filter(Boolean),
			);
			const userDiplomas = new Set(
				(diplomasRes.data || [])
					.map((r) => r.type?.toUpperCase())
					.filter(Boolean),
			);

			const eligible = [];
			for (const [jobKey, req] of Object.entries(JOB_REQUIREMENTS)) {
				const hasCnaps =
					req.cnaps.length === 0 ||
					req.cnaps.every((c) => userCnaps.has(c.toUpperCase()));
				const hasDiploma =
					req.diplomas.length === 0 ||
					req.diplomas.some((d) => userDiplomas.has(d.toUpperCase()));
				if (hasCnaps && hasDiploma) eligible.push(jobKey);
			}
			setEligibleCategories(eligible);

			if (eligible.length === 0) {
				setJobs([]);
				return;
			}

			const inList = eligible.map((c) => `"${c}"`).join(",");
			const regionFilter = userProfile?.region_code
				? `&region_code=eq.${userProfile.region_code}`
				: "";
			const { data } = await getAll(
				"jobs",
				"*, companies(name, logo_url)",
				`&is_archived=eq.false&category=in.(${inList})${regionFilter}&isLastMinute=eq.false`,
				1,
				100,
				"sponsorship_date.desc.nullslast,created_at.desc",
			);

			const now = new Date();
			const sorted = (data || []).sort((a, b) => {
				const aS =
					a.sponsorship_date && new Date(a.sponsorship_date) >= now;
				const bS =
					b.sponsorship_date && new Date(b.sponsorship_date) >= now;
				if (aS && !bS) return -1;
				if (!aS && bS) return 1;
				return 0;
			});
			setJobs(sorted);
		} catch (err) {
			console.error("SuggestionsScreen error:", err);
			setJobs([]);
		} finally {
			setLoading(false);
		}
	}, [user?.id, userProfile?.region_code, getAll]);

	useEffect(() => {
		load();
	}, [load]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	}, [load]);

	return (
		<Box style={{ flex: 1, backgroundColor: bg }}>
			<ScrollView
				contentContainerStyle={{ padding: 16, gap: 12 }}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				{/* Badges région + métiers */}
				{(eligibleCategories.length > 0 ||
					userProfile?.region_code) && (
					<VStack space='xs' style={{ marginBottom: 4 }}>
						{userProfile?.region_code && (
							<HStack>
								<Badge size='sm' variant='solid' action='muted'>
									<BadgeIcon as={MapPin} className='mr-1' />
									<BadgeText>
										{getRegionName(userProfile.region_code)}
									</BadgeText>
								</Badge>
							</HStack>
						)}
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								gap: 8,
								paddingVertical: 2,
							}}>
							{eligibleCategories.map((key) => {
								const cat = CATEGORY.find((c) => c.id === key);
								return (
									<Badge
										key={key}
										size='sm'
										variant='solid'
										action='info'>
										<BadgeIcon
											as={IdCard}
											className='mr-1'
										/>
										<BadgeText>
											{cat?.acronym ?? key.toUpperCase()}
										</BadgeText>
									</Badge>
								);
							})}
						</ScrollView>
					</VStack>
				)}

				{/* Contenu */}
				{loading ? (
					<Box style={{ alignItems: "center", paddingVertical: 40 }}>
						<Spinner size='small' />
					</Box>
				) : jobs.length === 0 ? (
					<Text
						size='sm'
						style={{
							color: textMuted,
							textAlign: "center",
							paddingVertical: 40,
						}}>
						Aucune offre suggérée pour votre profil
					</Text>
				) : (
					<VStack style={{ gap: 8 }}>
						{jobs.map((job) => (
							<JobCard
								key={job.id}
								id={job.id}
								title={job.title}
								category={job.category}
								company_id={job.company_id}
								company_name={job.companies?.name}
								city={job.city}
								postcode={job.postcode}
								department={job.department_code}
								isLastMinute={job.isLastMinute}
								logo={job.companies?.logo_url}
								contract_type={job?.contract_type}
								working_time={job?.work_time}
								salary_hourly={job?.salary_hourly}
								salary_amount={job?.salary_amount}
								salary_min={job?.salary_min}
								salary_max={job?.salary_max}
								salary_type={job?.salary_type}
								salary_monthly_fixed={job?.salary_monthly_fixed}
								salary_monthly_min={job?.salary_monthly_min}
								salary_monthly_max={job?.salary_monthly_max}
								salary_annual_fixed={job?.salary_annual_fixed}
								salary_annual_min={job?.salary_annual_min}
								salary_annual_max={job?.salary_annual_max}
								vacations={job?.vacations}
								date_mode={job?.date_mode}
								start_date_asap={job?.start_date_asap}
								start_date={job?.start_date}
								end_date={job?.end_date}
								sponsorship_date={job?.sponsorship_date}
							/>
						))}
					</VStack>
				)}
			</ScrollView>
		</Box>
	);
};

export default SuggestionsScreen;
