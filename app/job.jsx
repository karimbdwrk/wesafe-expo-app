import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { toast } from "sonner-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import {
	Bookmark,
	BookmarkCheck,
	Timer,
	Check,
	MapPin,
	IdCard,
} from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const JobScreen = () => {
	const { id, title, company_id, category } = useLocalSearchParams();
	const { user, role, userProfile, accessToken } = useAuth();
	const {
		toggleWishlistJob,
		getWishlistJobs,
		isJobInWishlist,
		isJobApplied,
		applyToJob,
		archiveJob,
		isJobArchived,
		getById,
	} = useDataContext();

	const router = useRouter();

	const [job, setJob] = useState(null);
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isApplied, setIsApplied] = useState(false);
	const [isArchived, setIsArchived] = useState(false);

	const loadJob = async () => {
		const data = await getById(
			"jobs",
			id,
			`*, companies(name, email), applies(id, candidate_id, profiles(firstname, lastname))`,
		);
		setJob(data);
	};

	useFocusEffect(
		useCallback(() => {
			id && loadJob();
		}, []),
	);

	const handleToggle = async () => {
		const isNowInWishlist = await toggleWishlistJob(id, user.id);
		setIsInWishlist(isNowInWishlist);
		toast.success(`Operation sur wishlist! ${isNowInWishlist}`, {
			// style: { backgroundColor: "blue" },
			description: "Everything worked as expected.",
			duration: 2500,
			icon: <Check />,
		});
	};

	const handleApply = async () => {
		const edgeFunctionUrl = `https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-push-notification`;

		const isNowApplied = await applyToJob(
			user.id,
			id,
			company_id,
			job.companies.name,
			job.companies.email,
			job.title,
			userProfile.lastname,
			userProfile.email,
		);

		const notificationPayload = {
			offer_id: id,
			candidate_id: user.id,
			company_id: company_id, // L'ID de l'entreprise destinataire
			application_id: isNowApplied[0].id, // L'ID de la candidature créée
		};

		const notificationResponse = await axios.post(
			edgeFunctionUrl,
			notificationPayload,
			{
				headers: {
					"Content-Type": "application/json",
					apikey: SUPABASE_API_KEY,
					Authorization: `Bearer ${accessToken}`, // Assurez-vous que l'utilisateur a un accessToken valide
				},
			},
		);

		setIsApplied(isNowApplied);
		toast.success(`Vous avez postulé à l'offre d'emploi avec succés!`, {
			// style: { backgroundColor: "blue" },
			description:
				"Vous recevrez une notification pour vous tenir informer de l'avancée",
			duration: 2500,
			icon: <Check />,
		});
	};

	const handleArchive = async () => {
		const isNowArchived = await archiveJob(id);
		setIsArchived(isNowArchived);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	const checkApplication = async () => {
		const applied = await isJobApplied(user.id, id);
		setIsApplied(applied);
	};

	const checkArchive = async () => {
		const archived = await isJobArchived(id);
		setIsArchived(archived);
	};

	useFocusEffect(
		useCallback(() => {
			checkWishlist();
		}, []),
	);

	useFocusEffect(
		useCallback(() => {
			checkApplication();
			checkArchive();
		}, [user, id]),
	);

	return (
		<VStack style={{ padding: 15 }}>
			<HStack space='md'>
				<Heading>{job?.title}</Heading>
				{job?.isLastMinute && <Timer />}
			</HStack>
			<Text size='xs'>{id}</Text>
			{job?.city && (
				<HStack
					style={{
						gap: 5,
						alignItems: "center",
						paddingVertical: 5,
					}}>
					<MapPin size={16} />
					<Text size='md'>
						{job?.city +
							" (" +
							job?.department +
							" | " +
							job?.department_code +
							")"}
					</Text>
				</HStack>
			)}
			<HStack style={{ paddingVertical: 15, gap: 15 }}>
				<Badge size='md' variant='solid' action='info'>
					<BadgeIcon as={IdCard} className='mr-2' />
					<BadgeText>{job?.category}</BadgeText>
				</Badge>
				{job?.isArchived && (
					<Badge size='md' variant='solid' action='warning'>
						<BadgeText>Archivé</BadgeText>
					</Badge>
				)}
			</HStack>
			{role === "candidat" && (
				<Button
					size='lg'
					variant='link'
					style={{ position: "absolute", right: 15, top: 10 }}
					onPress={handleToggle}>
					<ButtonIcon as={isInWishlist ? BookmarkCheck : Bookmark} />
				</Button>
			)}
			{role === "candidat" && (
				<Button
					disabled={isApplied ? true : false}
					variant={isApplied ? "outline" : "solid"}
					onPress={handleApply}>
					<ButtonText>
						{isApplied ? "Vous avez déjà postulé" : "Postuler"}
					</ButtonText>
				</Button>
			)}
			{role === "pro" && user.id === company_id && (
				<Button
					disabled={isArchived ? true : false}
					variant={isArchived ? "outline" : "solid"}
					onPress={handleArchive}>
					<ButtonText>
						{isArchived ? "Job archivé" : "Archiver"}
					</ButtonText>
				</Button>
			)}
			{role === "pro" && user.id === company_id && (
				<VStack style={{ marginTop: 30 }}>
					<Heading>Candidats</Heading>
					{job?.applies.length > 0 ? (
						job.applies.map((apply) => (
							<HStack
								key={apply.id}
								style={{
									paddingVertical: 10,
									gap: 10,
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<Text size='md'>
									{apply.profiles.firstname}{" "}
									{apply.profiles.lastname}
								</Text>
								<Button
									onPress={() =>
										router.push({
											pathname: "/application",
											params: {
												id: job.id,
												company_id: job.company_id,
												apply_id: apply.id,
											},
										})
									}>
									<ButtonText>Voir candidature</ButtonText>
								</Button>
							</HStack>
						))
					) : (
						<Text>Aucun candidat pour cette offre.</Text>
					)}
				</VStack>
			)}
		</VStack>
	);
};

export default JobScreen;
