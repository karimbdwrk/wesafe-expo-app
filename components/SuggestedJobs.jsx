import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";

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
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

import {
	Sparkles,
	Info,
	IdCard,
	MapPin,
	ChevronRight,
} from "lucide-react-native";

const REGION_NAMES = {
	11: "Île-de-France",
	24: "Centre-Val de Loire",
	27: "Bourgogne-Franche-Comté",
	28: "Normandie",
	32: "Hauts-de-France",
	44: "Grand Est",
	52: "Pays de la Loire",
	53: "Bretagne",
	75: "Nouvelle-Aquitaine",
	76: "Occitanie",
	84: "Auvergne-Rhône-Alpes",
	93: "Provence-Alpes-Côte d'Azur",
	94: "Corse",
	"01": "Guadeloupe",
	"02": "Martinique",
	"03": "Guyane",
	"04": "La Réunion",
	"06": "Mayotte",
};

const SuggestedJobs = () => {
	const { user, userProfile } = useAuth();
	const { getAll } = useDataContext();
	const router = useRouter();
	const { isDark } = useTheme();

	const [suggestedJobs, setSuggestedJobs] = useState([]);
	const [eligibleCategories, setEligibleCategories] = useState([]);
	const [userCnapsList, setUserCnapsList] = useState([]);
	const [userDiplomasList, setUserDiplomasList] = useState([]);
	const [loading, setLoading] = useState(false);

	const loadSuggestedJobs = useCallback(async () => {
		if (!user?.id) return;
		setLoading(true);
		try {
			// 1. Récupérer les documents du candidat en parallèle
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

			const userCnapsRaw = (cnapsRes.data || [])
				.map((r) => r.type)
				.filter(Boolean);
			const userDiplomasRaw = (diplomasRes.data || [])
				.map((r) => r.type)
				.filter(Boolean);

			setUserCnapsList(userCnapsRaw);
			setUserDiplomasList(userDiplomasRaw);

			const userCnaps = new Set(
				userCnapsRaw.map(
					(t) =>
						CNAPS_CARDS[t.toLowerCase()]?.acronym ??
						t.toUpperCase(),
				),
			);
			const userDiplomas = new Set(
				userDiplomasRaw.map((t) => t.toUpperCase()),
			);
			const userCerts = new Set(
				(certsRes.data || [])
					.map((r) => r.type?.toUpperCase())
					.filter(Boolean),
			);

			// 2. Calculer les catégories d'emploi accessibles
			const eligibleCategories = [];
			for (const [jobKey, req] of Object.entries(JOB_REQUIREMENTS)) {
				const hasCnaps =
					req.cnaps.length === 0 ||
					req.cnaps.every((c) => userCnaps.has(c.toUpperCase()));

				const hasDiploma =
					req.diplomas.length === 0 ||
					req.diplomas.some((d) => userDiplomas.has(d.toUpperCase()));

				if (hasCnaps && hasDiploma) {
					eligibleCategories.push(jobKey);
				}
			}

			setEligibleCategories(eligibleCategories);

			if (eligibleCategories.length === 0) {
				setSuggestedJobs([]);
				return;
			}

			// 3. Récupérer les offres actives correspondantes
			const inList = eligibleCategories.map((c) => `"${c}"`).join(",");
			const regionFilter = userProfile?.region_code
				? `&region_code=eq.${userProfile.region_code}`
				: "";
			const { data: jobs } = await getAll(
				"jobs",
				"*, companies(name, logo_url)",
				`&is_archived=eq.false&category=in.(${inList})${regionFilter}&isLastMinute=eq.false`,
				1,
				3,
				"created_at.desc",
			);

			setSuggestedJobs(jobs || []);
		} catch (err) {
			console.error("SuggestedJobs error:", err);
			setSuggestedJobs([]);
			setEligibleCategories([]);
			setUserCnapsList([]);
			setUserDiplomasList([]);
		} finally {
			setLoading(false);
		}
	}, [user?.id, userProfile?.region_code, getAll]);

	useEffect(() => {
		loadSuggestedJobs();
	}, [loadSuggestedJobs]);

	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textMuted = isDark ? Colors.dark.muted : Colors.light.muted;
	const cardBg = isDark
		? Colors.dark.background
		: Colors.light.cardBackground;
	const borderColor = isDark ? Colors.dark.border : Colors.light.border;

	if (loading) {
		return (
			<Box
				style={{
					backgroundColor: cardBg,
					borderRadius: 12,
					borderWidth: 1,
					borderColor,
					padding: 14,
					alignItems: "center",
					minHeight: 80,
					justifyContent: "center",
				}}>
				<Spinner size='small' />
			</Box>
		);
	}

	return (
		<Box
			style={{
				backgroundColor: cardBg,
				borderRadius: 12,
				borderWidth: 1,
				borderColor,
				padding: 14,
			}}>
			<VStack space='sm'>
				{/* Header */}
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 28,
								height: 28,
								borderRadius: 8,
								backgroundColor: isDark ? "#2e1065" : "#f5f3ff",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Sparkles size={14} color='#7c3aed' />
						</Box>
						<Text
							size='md'
							style={{
								fontWeight: "700",
								color: textPrimary,
								fontFamily: "Inter_700Bold",
							}}>
							Offres suggérées
						</Text>
					</HStack>
					{/* <TouchableOpacity
						onPress={() => router.push("suggestions")}
						activeOpacity={0.7}>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Text
								size='sm'
								style={{ color: tint, fontWeight: "500" }}>
								Voir tout
							</Text>
							<ChevronRight size={14} color={tint} />
						</HStack>
					</TouchableOpacity> */}
				</HStack>

				{/* Badges : région + métiers éligibles */}
				{(eligibleCategories.length > 0 ||
					userProfile?.region_code) && (
					<VStack space='xs'>
						<HStack>
							{userProfile?.region_code && (
								<Badge size='sm' variant='solid' action='muted'>
									<BadgeIcon as={MapPin} className='mr-1' />
									<BadgeText>
										{REGION_NAMES[
											userProfile.region_code
										] ?? userProfile.region_code}
									</BadgeText>
								</Badge>
							)}
						</HStack>
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
				{suggestedJobs.length === 0 ? (
					<Text
						size='sm'
						style={{
							color: textMuted,
							paddingVertical: 8,
							textAlign: "center",
						}}>
						Aucune offre suggérée pour votre profil
					</Text>
				) : (
					<VStack style={{ gap: 8, marginTop: 15 }}>
						{suggestedJobs.map((job) => (
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

				{/* CTA */}
				<TouchableOpacity
					onPress={() =>
						router.push({
							pathname: "suggestions",
							params: { region_code: userProfile?.region_code },
						})
					}
					activeOpacity={0.75}
					style={{
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 10,
						paddingVertical: 11,
						alignItems: "center",
						borderWidth: 1,
						borderColor: isDark
							? Colors.dark.border
							: Colors.light.border,
						marginTop: 4,
					}}>
					<Text
						size='sm'
						style={{
							fontWeight: "600",
							fontSize: 14,
							color: textPrimary,
						}}>
						Voir toutes les offres suggérées
					</Text>
				</TouchableOpacity>
			</VStack>
		</Box>
	);
};

export default SuggestedJobs;
