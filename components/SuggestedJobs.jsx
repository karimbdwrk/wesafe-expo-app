import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import JobCard from "@/components/JobCard";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { JOB_REQUIREMENTS } from "@/constants/jobrequirements";
import { CNAPS_CARDS } from "@/constants/cnapscards";
import { DIPLOMAS } from "@/constants/diplomas";

import { Sparkles, Info, IdCard, MapPin } from "lucide-react-native";

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
				`&is_archived=eq.false&category=in.(${inList})${regionFilter}`,
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

	if (loading) {
		return (
			<VStack style={{ padding: 20, alignItems: "center" }}>
				<Spinner size='small' />
			</VStack>
		);
	}

	return (
		<VStack style={{ gap: 12 }}>
			<VStack style={{ alignItems: "flex-start", gap: 4 }}>
				<HStack
					space='sm'
					alignItems='center'
					justifyContent='flex-start'
					width='100%'>
					<Sparkles size={18} color='#7c3aed' />
					<Heading size='sm'>Offres suggérées</Heading>
				</HStack>
				<Text size='xs' color='muted' style={{ fontStyle: "italic" }}>
					Suggestions d'emplois basées sur votre région et vos
					qualifications.
				</Text>
			</VStack>

			{(userCnapsList.length > 0 ||
				userDiplomasList.length > 0 ||
				userProfile?.region_code) && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
					{userProfile?.region_code && (
						<Badge size='sm' variant='solid' action='info'>
							<BadgeIcon as={MapPin} className='mr-1' />
							<BadgeText>
								{REGION_NAMES[userProfile.region_code] ??
									userProfile.region_code}
							</BadgeText>
						</Badge>
					)}
					{userCnapsList.map((type, id) => {
						const card = CNAPS_CARDS[type?.toLowerCase()];
						return (
							<Badge
								key={`cnaps-${id}-${type}`}
								size='sm'
								variant='solid'
								action='info'>
								<BadgeIcon as={IdCard} className='mr-1' />
								<BadgeText>{card?.acronym ?? type}</BadgeText>
							</Badge>
						);
					})}
					{userDiplomasList.map((type) => {
						const diploma = DIPLOMAS[type?.toLowerCase()];
						return (
							<Badge
								key={`diploma-${type}`}
								size='sm'
								variant='solid'
								action='success'>
								<BadgeIcon as={IdCard} className='mr-1' />
								<BadgeText>
									{diploma?.acronym ?? type}
								</BadgeText>
							</Badge>
						);
					})}
				</ScrollView>
			)}

			{suggestedJobs.length === 0 ? (
				<Badge size='md' variant='solid' action='muted'>
					<BadgeIcon as={Info} className='mr-2' />
					<BadgeText>
						Aucune offre correspondant à votre profil
					</BadgeText>
				</Badge>
			) : (
				<VStack style={{ gap: 12 }}>
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
			<Button
				onPress={() => router.push("suggestions")}
				variant='outline'>
				<ButtonText>Voir toutes les offres</ButtonText>
			</Button>
		</VStack>
	);
};

export default SuggestedJobs;
