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
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";

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
		descriptionCandidate: "Votre candidature a été envoyée avec succès.",
		descriptionPro: "Un candidat a postulé à cette annonce.",
		color: "#16a34a",
	},

	selected: {
		title: "Profil sélectionné",
		descriptionCandidate: "Le recruteur étudie votre profil.",
		descriptionPro: "Vous avez sélectionné ce candidat pour la suite.",
		color: "#2563eb",
	},

	contract_sent: {
		title: "Contrat envoyé",
		descriptionCandidate: "Un contrat vous a été transmis.",
		descriptionPro: "Vous avez envoyé un contrat au candidat.",
		color: "#f59e0b",
	},

	contract_signed_candidate: {
		title: "Contrat signé",
		descriptionCandidate: "Vous avez signé le contrat.",
		descriptionPro: "Le candidat a signé le contrat.",
		color: "#16a34a",
	},

	contract_signed_pro: {
		title: "Contrat finalisé",
		descriptionCandidate:
			"Le recruteur a signé le contrat. \nLa mission est confirmée.",
		descriptionPro:
			"Vous avez signé le contrat. \nLa mission est confirmée.",
		color: "#16a34a",
		isFinal: true,
	},

	rejected: {
		title: "Candidature refusée",
		descriptionCandidate: "Votre candidature n’a pas été retenue.",
		descriptionPro: "Vous avez refusé cette candidature.",
		color: "#dc2626",
		isFinal: true,
	},

	// 🟡 PENDING (fictif)
	pending: {
		color: "#9ca3af",
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
		updateApplicationStatus,
	} = useDataContext();

	const [showModal, setShowModal] = useState(false);
	const [showSelectModal, setShowSelectModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [showGenerateContractModal, setShowGenerateContractModal] =
		useState(false);

	const [isInWishlist, setIsInWishlist] = useState(false);
	// const [isApplied, setIsApplied] = useState(false);
	// const [isConfirmed, setIsConfirmed] = useState(false);
	const [isSelected, setIsSelected] = useState(false);
	const [isRefused, setIsRefused] = useState(false);
	const [currentStatus, setCurrentStatus] = useState("");

	const [application, setApplication] = useState([]);
	const [applicationStatus, setApplicationStatus] = useState([]);
	// const [totalCount, setTotalCount] = useState(0);

	const [contractGenerated, setContractGenerated] = useState(false);

	const loadData = async () => {
		const data = await getById(
			"applies",
			apply_id,
			"*,jobs(*), profiles(*)",
		);
		setApplication(data);
		setCurrentStatus(data.current_status);

		// Vérifier si un contrat a été généré
		if (
			data.current_status === "contract_sent" ||
			data.current_status === "contract_signed_candidate" ||
			data.current_status === "contract_signed_pro"
		) {
			setContractGenerated(true);
		}
		// setIsConfirmed(data.isConfirmed);
		// setIsSelected(data.isSelected);
		// setIsRefused(data.isRefused);
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
		console.log("Current status:", currentStatus);
		console.log("Contract generated:", contractGenerated);
	}, [applicationStatus, currentStatus, contractGenerated]);

	// const handleToggle = async () => {
	// 	const isNowInWishlist = await toggleWishlistJob(id, user.id);
	// 	setIsInWishlist(isNowInWishlist);
	// };

	const confirmSelect = async () => {
		const isNowSelected = await updateApplicationStatus(
			apply_id,
			"selected",
			"company",
		);
		// setIsSelected(bool);
		console.log("Candidat sélectionné :", isNowSelected);
		setCurrentStatus("selected");
		setApplicationStatus((prev) => [
			...prev,
			{ status: "selected", created_at: new Date().toISOString() },
		]);
		setShowSelectModal(false);
	};

	const handleSelect = () => {
		setShowSelectModal(true);
	};

	const confirmGenerateContract = async () => {
		const isNowSelected = await updateApplicationStatus(
			apply_id,
			"contract_sent",
			"company",
		);
		// setIsSelected(bool);
		console.log("Candidat sélectionné :", isNowSelected);
		setCurrentStatus("contract_sent");
		setApplicationStatus((prev) => [
			...prev,
			{ status: "contract_sent", created_at: new Date().toISOString() },
		]);

		setContractGenerated(true);
		setShowGenerateContractModal(false);
	};

	const handleGenerateContract = () => {
		setShowGenerateContractModal(true);
	};

	// const handleConfirm = async () => {
	// 	const isNowConfirmed = await confirmApplication(apply_id);
	// 	setIsConfirmed(true);
	// 	setIsRefused(false);
	// };

	const confirmReject = async () => {
		const isNowRejected = await updateApplicationStatus(
			apply_id,
			"rejected",
			"company",
		);
		console.log("Candidat refusé :", isNowRejected);
		setCurrentStatus("rejected");
		setApplicationStatus((prev) => [
			...prev,
			{ status: "rejected", created_at: new Date().toISOString() },
		]);
		setShowRejectModal(false);
	};

	const handleReject = () => {
		setShowRejectModal(true);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	// const checkApplication = async () => {
	// 	const applied = await isJobApplied(user.id, id);
	// 	setIsApplied(applied);
	// };

	// useEffect(() => {
	// 	checkApplication();
	// }, [user, id]);

	useFocusEffect(
		useCallback(() => {
			checkWishlist();
		}, []),
	);

	// useFocusEffect(
	// 	useCallback(() => {
	// 		role === "candidat" && checkApplication();
	// 	}, [user, id]),
	// );

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

		const description = isPending
			? "Cette étape est en attente."
			: role === "pro"
				? config.descriptionPro
				: config.descriptionCandidate;

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
								height: 35,
								backgroundColor: "lightgray",
								width: 2,
								marginTop: 5,
							}}
						/>
					)}
				</VStack>

				{/* Content */}
				<VStack>
					<Heading
						size='md'
						style={{ color: isPending ? "gray" : "#303030 " }}>
						{config.title}
					</Heading>

					<Text
						size='sm'
						style={{ color: isPending ? "gray" : "#303030" }}>
						{isPending
							? "Cette étape est en attente."
							: description}
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
						padding: 10,
						marginTop: 15,
						justifyContent: "flex-start",
						gap: 10,
					}}>
					<VStack
						style={{
							alignItems: "flex-start",
							gap: 10,
						}}>
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
						{currentStatus === "applied" && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={() => handleSelect()}
									// isDisabled={isSelected ? true : false}
								>
									<ButtonText>Sélectionner</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={() => handleReject()}
									// isDisabled={isSelected ? true : false}
								>
									<ButtonText>Refuser</ButtonText>
								</Button>
							</HStack>
						)}
						{currentStatus === "selected" && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={() => handleGenerateContract()}
									// isDisabled={isSelected ? true : false}
								>
									<ButtonText>Générer le contrat</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={() => handleReject()}
									// isDisabled={isSelected ? true : false}
								>
									<ButtonText>Refuser</ButtonText>
								</Button>
							</HStack>
						)}
					</VStack>
				)}
				{contractGenerated && (
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
								? "Voir & signer le contrat"
								: "Voir & signer mon contrat"}
						</ButtonText>
					</Button>
				)}
			</VStack>

			{/* Modal de confirmation pour sélectionner */}
			<Modal
				isOpen={showSelectModal}
				onClose={() => setShowSelectModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>Confirmer la sélection</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							Êtes-vous sûr de vouloir sélectionner ce candidat
							pour la suite du processus de recrutement ?
						</Text>
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowSelectModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							action='positive'
							onPress={confirmSelect}
							className='flex-1'>
							<ButtonText>Confirmer</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Modal de confirmation pour refuser */}
			<Modal
				isOpen={showRejectModal}
				onClose={() => setShowRejectModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>Confirmer le refus</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							Êtes-vous sûr de vouloir refuser cette candidature ?
							Cette action est définitive.
						</Text>
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowRejectModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							action='negative'
							onPress={confirmReject}
							className='flex-1'>
							<ButtonText>Refuser</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Modal de confirmation pour générer le contrat */}
			<Modal
				isOpen={showGenerateContractModal}
				onClose={() => setShowGenerateContractModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>
							Confirmer la génération du contrat
						</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							Êtes-vous sûr de vouloir générer et envoyer le
							contrat à ce candidat ?
						</Text>
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowGenerateContractModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							action='positive'
							onPress={confirmGenerateContract}
							className='flex-1'>
							<ButtonText>Confirmer</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default ApplicationScreen;
