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
import { CATEGORY } from "@/constants/categories";

import { Sparkles, Info, IdCard } from "lucide-react-native";

const SuggestedJobs = () => {
	const { user, userProfile } = useAuth();
	const { getAll } = useDataContext();
	const router = useRouter();

	const [suggestedJobs, setSuggestedJobs] = useState([]);
	const [eligibleCategories, setEligibleCategories] = useState([]);
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
					`&user_id=eq.${user.id}`,
					1,
					100,
				),
				getAll(
					"user_certifications",
					"type",
					`&user_id=eq.${user.id}`,
					1,
					100,
				),
			]);

			const userCnaps = new Set(
				(cnapsRes.data || [])
					.map((r) => r.type?.toUpperCase())
					.filter(Boolean),
			);
			const userDiplomas = new Set(
				(diplomasRes.data || [])
					.map((r) => r.type?.toUpperCase())
					.filter(Boolean),
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

				const hasCerts =
					req.certifications.length === 0 ||
					req.certifications.every((c) =>
						userCerts.has(c.toUpperCase()),
					);

				if (hasCnaps && hasDiploma && hasCerts) {
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
				10,
				"created_at.desc",
			);

			setSuggestedJobs(jobs || []);
		} catch (err) {
			console.error("SuggestedJobs error:", err);
			setSuggestedJobs([]);
			setEligibleCategories([]);
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

			{eligibleCategories.length > 0 && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
					{eligibleCategories.map((key) => {
						const cat = CATEGORY.find((c) => c.id === key);
						return (
							<Badge
								key={key}
								size='sm'
								variant='solid'
								action='info'>
								<BadgeIcon as={IdCard} className='mr-1' />
								<BadgeText>{cat?.acronym ?? key}</BadgeText>
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
