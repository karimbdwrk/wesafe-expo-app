import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

import {
	Bookmark,
	BookmarkCheck,
	Check,
	Hourglass,
	X,
	CircleSlash,
	MapPin,
	CalendarClock,
	CircleCheckIcon,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import JobCard from "@/components/JobCard";
import { width } from "dom-helpers";

const STATUS_ORDER = [
	"applied",
	"selected",
	"contract_sent",
	"contract_signed_candidate",
	"contract_signed_pro",
];

const STATUS_CONFIG = {
	applied: {
		title: "Candidature envoyée",
		description: "Votre candidature a été envoyée avec succès.",
		color: "#16a34a",
	},
	selected: {
		title: "Profil sélectionné",
		description: "Le recruteur étudie votre profil.",
		color: "#2563eb",
	},
	contract_sent: {
		title: "Contrat envoyé",
		description: "Un contrat vous a été transmis.",
		color: "#f59e0b",
	},
	contract_signed_candidate: {
		title: "Contrat signé",
		description: "Vous avez signé le contrat.",
		color: "#16a34a",
	},
	contract_signed_pro: {
		title: "Contrat finalisé",
		description: "Le recruteur a signé le contrat.",
		color: "#16a34a",
		isFinal: true,
	},
	rejected: {
		title: "Candidature refusée",
		description: "Votre candidature n’a pas été retenue.",
		color: "#dc2626",
		isFinal: true,
	},

	// 🟡 PENDING (fictif)
	pending: {
		color: "#9ca3af", // gray
	},
};

const ApplicationScreen = () => {
	const router = useRouter();
	const { id, title, company_id, category, apply_id, name } =
		useLocalSearchParams();
	const { user, role } = useAuth();
	const {
		toggleWishlistJob,
		getWishlistJobs,
		isJobInWishlist,
		isJobApplied,
		applyToJob,
		getById,
		getAll,
		confirmApplication,
		selectApplication,
		refuseApplication,
	} = useDataContext();

	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isApplied, setIsApplied] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isSelected, setIsSelected] = useState(false);
	const [isRefused, setIsRefused] = useState(false);

	const [application, setApplication] = useState([]);
	const [applicationStatus, setApplicationStatus] = useState([]);
	// const [totalCount, setTotalCount] = useState(0);

	const loadData = async () => {
		const data = await getById(
			"applies",
			apply_id,
			"*,jobs(*), profiles(*)",
		);
		setApplication(data);
		setIsConfirmed(data.isConfirmed);
		setIsSelected(data.isSelected);
		setIsRefused(data.isRefused);
		// setTotalCount(totalCount);
	};

	const loadApplicationStatus = async () => {
		const data = await getAll(
			"application_status_events",
			"*",
			`&application_id=eq.${apply_id}`,
			1,
			10,
			"created_at.asc",
		);
		setApplicationStatus(data.data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
			loadApplicationStatus();
		}, []),
	);

	useEffect(() => {
		console.log("ApplicationStatus data:", applicationStatus);
	}, [applicationStatus]);

	// const handleToggle = async () => {
	// 	const isNowInWishlist = await toggleWishlistJob(id, user.id);
	// 	setIsInWishlist(isNowInWishlist);
	// };

	const handleSelect = async (bool) => {
		const isNowSelected = await selectApplication(apply_id, bool);
		setIsSelected(bool);
	};

	const handleConfirm = async () => {
		const isNowConfirmed = await confirmApplication(apply_id);
		setIsConfirmed(true);
		setIsRefused(false);
	};

	const handleRefuse = async () => {
		const isNowRefused = await refuseApplication(apply_id);
		setIsRefused(true);
		setIsConfirmed(false);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	const checkApplication = async () => {
		const applied = await isJobApplied(user.id, id);
		setIsApplied(applied);
	};

	// useEffect(() => {
	// 	checkApplication();
	// }, [user, id]);

	useFocusEffect(
		useCallback(() => {
			checkWishlist();
		}, []),
	);

	useFocusEffect(
		useCallback(() => {
			role === "candidat" && checkApplication();
		}, [user, id]),
	);

	const formatDate = (date) => {
		const d = new Date(date);

		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();

		const hours = String(d.getHours()).padStart(2, "0");
		const minutes = String(d.getMinutes()).padStart(2, "0");

		return `${day}/${month}/${year} - ${hours}:${minutes}`;
	};

	const buildTimelineSteps = (events) => {
		if (!events || events.length === 0) return [];

		const steps = [...events];

		const lastEvent = events[events.length - 1];
		const lastStatus = lastEvent.status;

		const lastConfig = STATUS_CONFIG[lastStatus];

		// ⛔ Cas finaux : on n’ajoute rien
		if (lastConfig?.isFinal) {
			return steps;
		}

		// Trouver le statut suivant
		const currentIndex = STATUS_ORDER.indexOf(lastStatus);
		const nextStatus = STATUS_ORDER[currentIndex + 1];

		if (!nextStatus) return steps;

		// Ajouter un step pending fictif
		steps.push({
			status: nextStatus,
			isPending: true,
		});

		return steps;
	};

	const StepCard = ({ status, date, isLast, isPending }) => {
		const config = STATUS_CONFIG[status];
		if (!config) return null;

		const color = isPending ? STATUS_CONFIG.pending.color : config.color;

		return (
			<HStack style={{ gap: 15 }}>
				{/* Timeline */}
				<VStack style={{ alignItems: "center", gap: 5 }}>
					<Center
						style={{
							height: 30,
							width: 30,
							backgroundColor: color,
							borderRadius: 15,
						}}>
						{!isPending && (
							<CircleCheckIcon size={12} color='white' />
						)}
					</Center>

					{!isLast && (
						<Divider
							orientation='vertical'
							style={{
								height: 30,
								backgroundColor: color,
								width: 2,
							}}
						/>
					)}
				</VStack>

				{/* Content */}
				<VStack>
					<Heading
						size='md'
						style={{ color: isPending ? "gray" : "#303030" }}>
						{config.title}
					</Heading>

					<Text
						size='sm'
						style={{ color: isPending ? "gray" : "#303030" }}>
						{isPending
							? "Cette étape est en attente."
							: config.description}
					</Text>

					{!isPending && date && (
						<HStack style={{ alignItems: "center", gap: 3 }}>
							<CalendarClock size={10} color='gray' />
							<Text size='xs' style={{ color: "gray" }}>
								{formatDate(date)}
							</Text>
						</HStack>
					)}
				</VStack>
			</HStack>
		);
	};

	const timelineSteps = buildTimelineSteps(applicationStatus);

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "white" }}>
			<VStack style={{ padding: 15, gap: 15, paddingBottom: 90 }}>
				<VStack
					style={{
						justifyContent: "center",
						alignItems: "flex-start",
						gap: 5,
						marginBottom: 15,
					}}>
					<Heading>Candidature</Heading>
					<Text size='xs' italic>
						ID : {application.id}
					</Text>
				</VStack>
				<JobCard
					id={application?.jobs?.id}
					title={application?.jobs?.title}
					category={application?.jobs?.category}
					company_id={application?.jobs?.company_id}
					city={application?.jobs?.city}
					department={application?.jobs?.departmentcode}
				/>
				{role === "pro" && (
					<VStack>
						<Heading size='md' className='mb-1'>
							{application?.profiles?.lastname +
								" " +
								application?.profiles?.firstname}
						</Heading>
						<Button
							onPress={() =>
								router.push({
									pathname: "/profile",
									params: {
										profile_id: application.candidate_id,
									},
								})
							}>
							<ButtonText>Voir profil</ButtonText>
						</Button>
					</VStack>
				)}
				<VStack
					style={{
						// backgroundColor: "lightgray",
						padding: 10,
						marginTop: 15,
						justifyContent: "flex-start",
						// alignItems: "center",
						gap: 10,
					}}>
					<VStack
						style={{
							alignItems: "flex-start",
							gap: 10,
							// backgroundColor: "pink",
						}}>
						{/* <StepCard
							status={"applied"}
							title='Envoyé'
							description='Votre candidature a été envoyée avec succès.'
							color='green'
						/>
						<StepCard
							status={"selected"}
							title='Sélectionné'
							description='Vous avez été sélectionné pour cette offre.'
							color='green'
						/>
						<StepCard
							status={"contract_sent"}
							title='Contrat envoyé'
							description='Le contrat a été envoyé pour signature.'
							color='green'
						/>
						<StepCard
							status={"contract_signed_candidate"}
							title='Contrat signé par le candidat'
							description='Le contrat a été signé par le candidat.'
							color='green'
						/>
						<StepCard
							status={"contract_signed_pro"}
							title='Signature du contrat par le pro'
							description='En attente de la signature du pro.'
							color='gray'
						/> */}
						{applicationStatus &&
							timelineSteps.map((step, index) => (
								<StepCard
									key={`${step.status}-${index}`}
									status={step.status}
									date={step.created_at}
									isPending={step.isPending}
									isLast={index === timelineSteps.length - 1}
								/>
							))}
					</VStack>
				</VStack>
				{role === "pro" && (
					<VStack space='md'>
						{isSelected === null && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={() => handleSelect(true)}
									isDisabled={isSelected ? true : false}>
									<ButtonText>Sélectionner</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={() => handleSelect(false)}
									isDisabled={isSelected ? true : false}>
									<ButtonText>Refuser</ButtonText>
								</Button>
							</HStack>
						)}
						{isSelected === true && isConfirmed === null && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={handleConfirm}
									isDisabled={isConfirmed ? true : false}>
									<ButtonText>
										{isConfirmed ? "Confirmé" : "Confirmer"}
									</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={handleRefuse}
									isDisabled={isRefused ? true : false}>
									<ButtonText>
										{isRefused ? "Refusé" : "Refuser"}
									</ButtonText>
								</Button>
							</HStack>
						)}
					</VStack>
				)}
				{isConfirmed && (
					<Button
						onPress={() =>
							router.push({
								pathname: "/contract",
								params: {
									apply_id: application.id,
									candidate_id: application.candidate_id,
									company_id: application.company_id,
									job_id: application.job_id,
								},
							})
						}>
						<ButtonText>
							{role === "pro"
								? "Voir le contrat"
								: "Voir & signer mon contrat"}
						</ButtonText>
					</Button>
				)}
				{/* {role === "candidat" && (
				<Button
					size='lg'
					variant='link'
					className='rounded-full p-3.5'
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
			)} */}
			</VStack>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default ApplicationScreen;
