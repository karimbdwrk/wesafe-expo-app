import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	StyleSheet,
	ScrollView,
	Animated,
	Easing,
	Platform,
	Keyboard,
	KeyboardAvoidingView,
	Pressable,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { createSupabaseClient } from "@/lib/supabase";

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
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
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import { Spinner } from "@/components/ui/spinner";

import MessageThread from "@/components/MessageThread";

import {
	Bookmark,
	BookmarkCheck,
	Check,
	Hourglass,
	X,
	CircleSlash,
	MapPin,
	CalendarClock,
	CheckCircle,
	XCircle,
	FileCheck,
	CircleCheckIcon,
	MessageCircle,
	FileText,
	ChevronRight,
	User,
	Briefcase,
	IdCard,
	Building2,
	BadgeEuro,
	Clock,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

import { sendApplicationSelectedEmail } from "@/utils/sendApplicationSelectedEmail";
import { sendRecruitmentStatusEmail } from "@/utils/sendRecruitmentStatusEmail";
import { getCategoryLabel } from "@/constants/categories";
import { formatSalary } from "@/constants/salary";

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
	const navigation = useNavigation();
	const { id, title, company_id, category, apply_id, name, openMessaging } =
		useLocalSearchParams();
	const { user, role, accessToken } = useAuth();
	const { isDark } = useTheme();
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
		createNotification,
	} = useDataContext();

	const [isLoading, setIsLoading] = useState(false);

	const [showModal, setShowModal] = useState(false);
	const [showSelectModal, setShowSelectModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [showGenerateContractModal, setShowGenerateContractModal] =
		useState(false);
	const [showMessaging, setShowMessaging] = useState(false);
	const [isOtherPartyTyping, setIsOtherPartyTyping] = useState(false);
	const [keyboardPadding, setKeyboardPadding] = useState(0);
	const [isOtherPartyOnline, setIsOtherPartyOnline] = useState(false);

	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isSelected, setIsSelected] = useState(false);
	const [isRefused, setIsRefused] = useState(false);
	const [currentStatus, setCurrentStatus] = useState("");

	const [application, setApplication] = useState([]);
	const [applicationStatus, setApplicationStatus] = useState([]);
	const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

	const [contractGenerated, setContractGenerated] = useState(false);
	const presenceIntervalRef = React.useRef(null);
	const hasAutoOpenedMessaging = React.useRef(false);
	const hasLoadedOnce = React.useRef(false);

	const loadData = async (showLoading = true) => {
		if (showLoading) {
			setIsLoading(true);
		}
		const data = await getById(
			"applications",
			apply_id,
			"*,jobs(*), profiles(*), companies(*)",
		);
		setApplication(data);
		setCurrentStatus(data.current_status);
		hasLoadedOnce.current = true;
		if (showLoading) {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		console.log("application data:", application);
	}, [application]);

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
	};

	const loadUnreadMessagesCount = async () => {
		if (!user?.id || !apply_id) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			const { count, error } = await supabase
				.from("messages")
				.select("*", { count: "exact", head: true })
				.eq("apply_id", apply_id)
				.neq("sender_id", user.id)
				.eq("is_read", false);

			if (!error) {
				setUnreadMessagesCount(count || 0);
			}
		} catch (error) {
			console.error("Error loading unread messages count:", error);
		}
	};

	const updatePresence = async () => {
		if (!user?.id || !apply_id || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			await supabase.from("user_presence").upsert({
				user_id: user.id,
				apply_id: apply_id,
				last_seen: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error updating presence:", error);
		}
	};

	const markApplicationNotificationsAsRead = async () => {
		if (!user?.id || !apply_id || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			await supabase
				.from("notifications")
				.update({ is_read: true, read_at: new Date().toISOString() })
				.eq("recipient_id", user.id)
				.eq("entity_id", apply_id)
				.eq("entity_type", "application")
				.eq("is_read", false);
			console.log("✅ Notifications de candidature marquées comme lues");
		} catch (error) {
			console.error("Error marking notifications as read:", error);
		}
	};

	const resetApplicationNotification = async () => {
		console.log(
			"🔄 resetApplicationNotification appelée - role:",
			role,
			"user:",
			user?.id,
			"apply_id:",
			apply_id,
		);

		if (!user?.id || !apply_id || !accessToken) {
			console.warn("⚠️ resetApplicationNotification: données manquantes");
			return;
		}

		try {
			const supabase = createSupabaseClient(accessToken);
			// Si pro, on met company_notification à false
			// Si candidat, on met candidate_notification à false
			const updateField =
				role === "pro"
					? { company_notification: false }
					: { candidate_notification: false };

			console.log("📝 Update field:", updateField);

			const { data, error } = await supabase
				.from("applications")
				.update(updateField)
				.eq("id", apply_id)
				.select();

			if (error) {
				console.error("❌ Erreur resetApplicationNotification:", error);
			} else {
				console.log(
					`✅ Notification application réinitialisée pour ${role}`,
					data,
				);
			}
		} catch (error) {
			console.error("Error resetting application notification:", error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			console.warn("openMessaging on useFocusEffect :", openMessaging);
			// Ne pas afficher le spinner si on a déjà chargé les données (retour depuis contract)
			loadData(!hasLoadedOnce.current);
			loadApplicationStatus();
			loadUnreadMessagesCount();
			markApplicationNotificationsAsRead();
			resetApplicationNotification();

			// Ouvrir automatiquement l'ActionSheet si on vient d'une notification de message
			const shouldOpenMessaging =
				openMessaging === "true" && !hasAutoOpenedMessaging.current;

			// Nettoyer le paramètre immédiatement pour éviter les réouvertures
			if (openMessaging === "true") {
				router.setParams({ openMessaging: undefined });
			}

			if (shouldOpenMessaging) {
				hasAutoOpenedMessaging.current = true;
				setTimeout(() => {
					setShowMessaging(true);
				}, 600);
			}

			// Mettre à jour la présence immédiatement
			updatePresence();

			// Démarrer l'intervalle de présence
			presenceIntervalRef.current = setInterval(updatePresence, 3000);

			// Abonnement real-time pour les messages
			const supabase = createSupabaseClient(accessToken);
			const channel = supabase
				.channel(`messages-${apply_id}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "messages",
						filter: `apply_id=eq.${apply_id}`,
					},
					() => {
						// Recharger le compteur quand un message est ajouté/modifié
						loadUnreadMessagesCount();
					},
				)
				.subscribe();

			return () => {
				// Fermer l'ActionSheet quand on quitte la page
				setShowMessaging(false);

				if (presenceIntervalRef.current) {
					clearInterval(presenceIntervalRef.current);
				}
				supabase.removeChannel(channel);
			};
		}, [openMessaging, apply_id]),
	);

	// Réinitialiser le flag quand on change de candidature
	useEffect(() => {
		hasAutoOpenedMessaging.current = false;
	}, [apply_id]);

	// useEffect(() => {
	// 	if (title) {
	// 		navigation.setOptions({
	// 			headerTitle: `Candidature - ${title}`,
	// 		});
	// 	}
	// }, [title, navigation]);

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			"keyboardDidShow",
			() => {
				setKeyboardPadding(90);
			},
		);
		const keyboardDidHideListener = Keyboard.addListener(
			"keyboardDidHide",
			() => {
				setKeyboardPadding(0);
			},
		);

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);
	// Surveiller la présence de l'interlocuteur
	useEffect(() => {
		if (
			!apply_id ||
			!accessToken ||
			!application?.candidate_id ||
			!application?.company_id
		)
			return;

		const otherUserId =
			role === "pro" ? application.candidate_id : application.company_id;

		const checkPresence = async () => {
			const supabase = createSupabaseClient(accessToken);
			const { data } = await supabase
				.from("user_presence")
				.select("last_seen")
				.eq("user_id", otherUserId)
				.eq("apply_id", apply_id)
				.single();

			if (data) {
				const lastSeen = new Date(data.last_seen);
				const now = new Date();
				const diffMs = now - lastSeen;
				// Considérer en ligne si vu dans les 5 dernières secondes
				setIsOtherPartyOnline(diffMs < 5000);
			} else {
				setIsOtherPartyOnline(false);
			}
		};

		// Vérifier immédiatement
		checkPresence();

		// Vérifier toutes les 3 secondes
		const interval = setInterval(checkPresence, 3000);

		// Abonnement real-time pour les changements de présence
		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`presence-${apply_id}-${otherUserId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_presence",
					filter: `user_id=eq.${otherUserId}`,
				},
				() => {
					checkPresence();
				},
			)
			.subscribe();

		return () => {
			clearInterval(interval);
			supabase.removeChannel(channel);
		};
	}, [
		apply_id,
		accessToken,
		application?.candidate_id,
		application?.company_id,
		role,
	]);
	useEffect(() => {
		currentStatus &&
			console.log("Current application status:", currentStatus);
		if (
			currentStatus === "contract_sent" ||
			currentStatus === "contract_signed_candidate" ||
			currentStatus === "contract_signed_pro"
		) {
			setContractGenerated(true);
		} else {
			setContractGenerated(false);
		}
	}, [currentStatus]);

	useEffect(() => {
		if (!apply_id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);

		const channel = supabase
			.channel(`application_status`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "application_status_events",
					filter: `application_id=eq.${apply_id}`, // adapte le nom de la colonne
				},
				(payload) => {
					console.log(
						"🟢 STATUS EVENT",
						payload.eventType,
						payload.new,
					);

					if (payload.eventType === "INSERT") {
						// Comme tu es en created_at.asc, on ajoute en bas
						setApplicationStatus((prev) =>
							[...prev, payload.new].sort(
								(a, b) =>
									new Date(a.created_at) -
									new Date(b.created_at),
							),
						);
						setCurrentStatus(payload.new.status);
					} else if (payload.eventType === "UPDATE") {
						// Si jamais tu modifies un event existant
						setApplicationStatus((prev) =>
							prev.map((s) =>
								s.id === payload.new.id ? payload.new : s,
							),
						);
						setCurrentStatus(payload.new.status);
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [apply_id, accessToken]);

	const confirmSelect = async () => {
		const isNowSelected = await updateApplicationStatus(
			apply_id,
			"selected",
			"company",
		);
		// setIsSelected(bool);
		console.log("Candidat sélectionné :", isNowSelected);
		setCurrentStatus("selected");

		// Mettre à jour updated_at
		const supabase = createSupabaseClient(accessToken);
		await supabase
			.from("applications")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", apply_id);

		setShowSelectModal(false);

		// Vérifier si le destinataire est actif sur le screen
		const { data: presenceData } = await supabase
			.from("user_presence")
			.select("apply_id")
			.eq("user_id", application.candidate_id)
			.eq("apply_id", apply_id)
			.gte("last_seen", new Date(Date.now() - 5000).toISOString())
			.single();

		if (presenceData) {
			console.log(
				"⏩ Notification ignorée - candidat actif sur le screen",
			);
		} else {
			await createNotification({
				recipientId: application.candidate_id,
				actorId: application.company_id,
				type: "application_selected",
				title: application.jobs.title,
				body: "Le recruteur souhaite poursuivre avec vous.",
				entityType: "application",
				entityId: apply_id,
			});
		}

		// Envoyer l'email au candidat
		await sendRecruitmentStatusEmail(
			application.profiles.email,
			`${application.profiles.firstname} ${application.profiles.lastname}`,
			application.companies?.name || application.jobs.company_name,
			"selected",
			application.jobs.title,
			"candidate",
			accessToken,
		);

		console.log(
			"application after select email content :",
			`${application.profiles.firstname} ${application.profiles.lastname}`,
			application.profiles.email,
			application.jobs.title,
			application.companies?.name,
		);
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

		// Mettre à jour updated_at
		const supabase = createSupabaseClient(accessToken);
		await supabase
			.from("applications")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", apply_id);

		setContractGenerated(true);
		setShowGenerateContractModal(false);

		// Vérifier si le destinataire est actif sur le screen
		const { data: presenceData } = await supabase
			.from("user_presence")
			.select("apply_id")
			.eq("user_id", application.candidate_id)
			.eq("apply_id", apply_id)
			.gte("last_seen", new Date(Date.now() - 5000).toISOString())
			.single();

		if (presenceData) {
			console.log(
				"⏩ Notification ignorée - candidat actif sur le screen",
			);
		} else {
			await createNotification({
				recipientId: application.candidate_id,
				actorId: application.company_id,
				type: "contract_sent",
				title: "Contrat envoyé",
				body: "Le recruteur a envoyé un contrat pour votre candidature.",
				entityType: "application",
				entityId: apply_id,
			});
		}

		// Envoyer l'email au candidat
		await sendRecruitmentStatusEmail(
			application.profiles.email,
			`${application.profiles.firstname} ${application.profiles.lastname}`,
			application.companies?.name || application.jobs.company_name,
			"contract_sent",
			application.jobs.title,
			"candidate",
			accessToken,
		);
	};

	const handleGenerateContract = () => {
		setShowGenerateContractModal(true);
	};

	const confirmReject = async () => {
		const isNowRejected = await updateApplicationStatus(
			apply_id,
			"rejected",
			"company",
		);
		console.log("Candidat refusé :", isNowRejected);
		setCurrentStatus("rejected");

		// Mettre à jour updated_at
		const supabase = createSupabaseClient(accessToken);
		await supabase
			.from("applications")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", apply_id);

		setShowRejectModal(false);

		// Vérifier si le destinataire est actif sur le screen
		const { data: presenceData } = await supabase
			.from("user_presence")
			.select("apply_id")
			.eq("user_id", application.candidate_id)
			.eq("apply_id", apply_id)
			.gte("last_seen", new Date(Date.now() - 5000).toISOString())
			.single();

		if (presenceData) {
			console.log(
				"⏩ Notification ignorée - candidat actif sur le screen",
			);
		} else {
			await createNotification({
				recipientId: application.candidate_id,
				actorId: application.company_id,
				type: "application_rejected",
				title: "Profil refusé",
				body: "Le recruteur a refusé votre candidature.",
				entityType: "application",
				entityId: apply_id,
			});
		}

		// Envoyer l'email au candidat
		await sendRecruitmentStatusEmail(
			application.profiles.email,
			`${application.profiles.firstname} ${application.profiles.lastname}`,
			application.companies?.name || application.jobs.company_name,
			"rejected",
			application.jobs.title,
			"candidate",
			accessToken,
		);
	};

	const handleReject = () => {
		setShowRejectModal(true);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	useFocusEffect(
		useCallback(() => {
			checkWishlist();
		}, []),
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

	if (isLoading) {
		return (
			<Box
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}>
				<Spinner size='large' />
			</Box>
		);
	}

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView style={{ flex: 1 }}>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 90 }}>
					{/* Job Card */}
					<Pressable
						onPress={() =>
							router.push({
								pathname: "/job",
								params: { id: application?.jobs?.id },
							})
						}>
						<Card
							style={{
								padding: 20,
								// paddingRight: 10,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<VStack style={{ flex: 1 }} space='xs'>
									<Heading
										size='xl'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{application?.jobs?.title}
									</Heading>
									<VStack space='md' style={{ marginTop: 5 }}>
										{application?.jobs?.city && (
											<HStack
												space='xs'
												className='items-center'>
												<MapPin
													size={12}
													color='gray'
												/>
												<Text
													size='sm'
													style={{ color: "gray" }}>
													{application?.jobs?.city +
														" (" +
														application?.jobs
															?.department_code +
														")"}
												</Text>
											</HStack>
										)}
										<HStack>
											<Badge
												size='sm'
												// variant='outline'
												action='info'>
												<BadgeIcon
													as={IdCard}
													className='mr-2'
												/>
												<BadgeText>
													{getCategoryLabel(
														application?.jobs
															?.category,
													)}
												</BadgeText>
											</Badge>
										</HStack>
										<HStack space='sm'>
											{application?.jobs
												?.contract_type && (
												<Badge
													size='sm'
													variant='solid'
													action='success'>
													<BadgeIcon
														as={FileText}
														className='mr-2'
													/>
													<BadgeText>
														{
															application?.jobs
																?.contract_type
														}
													</BadgeText>
												</Badge>
											)}
											{application?.jobs?.work_time && (
												<Badge
													size='sm'
													variant='solid'
													action='muted'>
													<BadgeIcon
														as={Clock}
														className='mr-2'
													/>
													<BadgeText>
														{application?.jobs?.work_time
															.toLowerCase()
															.includes("part")
															? "Temps partiel"
															: "Temps plein"}
													</BadgeText>
												</Badge>
											)}
											{application?.jobs?.salary_type && (
												<Badge
													size='sm'
													variant='solid'
													action='warning'>
													<BadgeIcon
														as={BadgeEuro}
														className='mr-2'
													/>
													<BadgeText>
														{formatSalary(
															application?.jobs,
														)}
													</BadgeText>
												</Badge>
											)}
										</HStack>
									</VStack>
									{role === "candidat" && (
										<HStack
											space='md'
											className='items-center mt-4'>
											{application?.companies
												?.logo_url && (
												<Avatar size='md'>
													<AvatarFallbackText>
														{application?.companies
															?.name ||
															application?.jobs
																?.company_name}
													</AvatarFallbackText>
													<AvatarImage
														source={{
															uri: application
																?.companies
																?.logo_url,
														}}
													/>
												</Avatar>
											)}
											<VStack>
												<Heading
													size='md'
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{application?.companies
														?.name ||
														application?.jobs
															?.company_name}
												</Heading>
												<Text size='sm'>
													Nursing Assistant
												</Text>
											</VStack>
										</HStack>
									)}
								</VStack>
								<Icon
									as={ChevronRight}
									size='lg'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}
								/>
							</HStack>
						</Card>
					</Pressable>

					{/* Candidat Card (si pro) */}
					{role === "pro" && application?.profiles && (
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<Button
								variant='link'
								style={{ padding: 0 }}
								onPress={() =>
									router.push({
										pathname: "/profile",
										params: {
											profile_id:
												application.candidate_id,
										},
									})
								}>
								<HStack
									style={{
										justifyContent: "space-between",
										alignItems: "center",
										width: "100%",
									}}>
									<HStack
										space='md'
										style={{
											alignItems: "center",
										}}>
										<Avatar size='md'>
											<AvatarFallbackText>
												{application?.profiles
													?.lastname +
													" " +
													application?.profiles
														?.firstname}
											</AvatarFallbackText>
											<AvatarImage
												source={{
													uri: application?.profiles
														?.avatar_url,
												}}
											/>
										</Avatar>
										<VStack>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{application?.profiles
													?.lastname +
													" " +
													application?.profiles
														?.firstname}
											</Heading>
											<Text size='sm'>
												Voir le profil du candidat
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</Button>
						</Card>
					)}

					{/* Timeline Card */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='lg'>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Suivi de la candidature
							</Heading>
							<VStack space='md'>
								{timelineSteps.map((step, index) => {
									const config = STATUS_CONFIG[step.status];
									if (!config) return null;

									const isPending = step.isPending;
									const description = isPending
										? "Cette étape est en attente."
										: role === "pro"
											? config.descriptionPro
											: config.descriptionCandidate;

									return (
										<HStack
											key={`${step.status}-${index}`}
											style={{ gap: 15 }}>
											<VStack
												style={{
													alignItems: "center",
													minWidth: 10,
												}}>
												<Box
													style={{
														width: 10,
														height: 10,
														borderRadius: 5,
														backgroundColor:
															isPending
																? isDark
																	? "#6b7280"
																	: "#9ca3af"
																: config.color,
													}}
												/>
												{index !==
													timelineSteps.length -
														1 && (
													<Box
														style={{
															width: 2,
															flex: 1,
															minHeight: 40,
															backgroundColor:
																isDark
																	? "#4b5563"
																	: "#e5e7eb",
															marginTop: 4,
														}}
													/>
												)}
											</VStack>
											<VStack
												style={{
													flex: 1,
													paddingBottom:
														index ===
														timelineSteps.length - 1
															? 0
															: 8,
												}}
												space='xs'>
												<Heading
													size='sm'
													style={{
														color: isPending
															? isDark
																? "#6b7280"
																: "#9ca3af"
															: isDark
																? "#f3f4f6"
																: "#111827",
													}}>
													{config.title}
												</Heading>
												<Text
													size='sm'
													style={{
														color: isPending
															? isDark
																? "#6b7280"
																: "#9ca3af"
															: isDark
																? "#d1d5db"
																: "#374151",
													}}>
													{description}
												</Text>
												{!isPending &&
													step.created_at && (
														<HStack
															space='xs'
															style={{
																alignItems:
																	"center",
															}}>
															<Icon
																as={
																	CalendarClock
																}
																size='xs'
																style={{
																	color: isDark
																		? "#6b7280"
																		: "#9ca3af",
																}}
															/>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? "#6b7280"
																		: "#9ca3af",
																}}>
																{formatDate(
																	step.created_at,
																)}
															</Text>
														</HStack>
													)}
											</VStack>
										</HStack>
									);
								})}
							</VStack>
						</VStack>
					</Card>

					{/* Messagerie Card */}
					{currentStatus !== "applied" && currentStatus !== "" && (
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<Button
								variant='link'
								style={{ padding: 0 }}
								onPress={() => setShowMessaging(true)}>
								<HStack
									space='md'
									style={{
										alignItems: "center",
										width: "100%",
									}}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#fef3c7",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={MessageCircle}
											size='xl'
											style={{ color: "#f59e0b" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Messagerie
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Échanger avec{" "}
											{role === "pro"
												? "le candidat"
												: "le recruteur"}
										</Text>
									</VStack>
									{unreadMessagesCount > 0 && (
										<Badge
											size='md'
											variant='solid'
											action='error'
											style={{ marginRight: 8 }}>
											<BadgeText>
												{unreadMessagesCount}
											</BadgeText>
										</Badge>
									)}
									<Icon
										as={ChevronRight}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</Button>
						</Card>
					)}

					{/* Contrat Card */}
					{contractGenerated && (
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<Button
								variant='link'
								style={{ padding: 0 }}
								onPress={() =>
									router.push({
										pathname: "/contract",
										params: {
											apply_id: application.id,
											candidate_id:
												application.candidate_id,
											company_id: application.company_id,
											job_id: application.job_id,
										},
									})
								}>
								<HStack
									space='md'
									style={{
										alignItems: "center",
										width: "100%",
									}}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#dcfce7",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={FileText}
											size='xl'
											style={{ color: "#16a34a" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Contrat de mission
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											{role === "pro"
												? currentStatus ===
													"contract_signed_pro"
													? "Voir le contrat"
													: "Voir & signer le contrat"
												: currentStatus ===
															"contract_signed_candidate" ||
													  currentStatus ===
															"contract_signed_pro"
													? "Voir le contrat"
													: "Voir & signer mon contrat"}
										</Text>
									</VStack>
									<Icon
										as={ChevronRight}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</Button>
						</Card>
					)}

					{/* Actions pour Pro */}
					{role === "pro" && (
						<VStack space='sm'>
							{currentStatus === "applied" && (
								<>
									<Button
										action='positive'
										onPress={() => handleSelect()}>
										<ButtonText>
											Sélectionner le candidat
										</ButtonText>
									</Button>
									<Button
										variant='outline'
										action='negative'
										onPress={() => handleReject()}>
										<ButtonText>
											Refuser la candidature
										</ButtonText>
									</Button>
								</>
							)}
							{currentStatus === "selected" && (
								<>
									<Button
										action='positive'
										onPress={() =>
											handleGenerateContract()
										}>
										<ButtonText>
											Générer le contrat
										</ButtonText>
									</Button>
									<Button
										variant='outline'
										action='negative'
										onPress={() => handleReject()}>
										<ButtonText>
											Refuser la candidature
										</ButtonText>
									</Button>
								</>
							)}
						</VStack>
					)}
				</VStack>
			</ScrollView>

			{/* Modal de confirmation pour sélectionner */}
			<Modal
				isOpen={showSelectModal}
				onClose={() => setShowSelectModal(false)}>
				<ModalBackdrop />
				<ModalContent
					style={{
						maxWidth: 400,
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 16,
						padding: 24,
					}}>
					<VStack space='lg' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								backgroundColor: "#dcfce7",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={CheckCircle}
								size='2xl'
								style={{ color: "#16a34a" }}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Confirmer la sélection
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#d1d5db" : "#6b7280",
									textAlign: "center",
								}}>
								Êtes-vous sûr de vouloir sélectionner ce
								candidat pour la suite du processus de
								recrutement ?
							</Text>
						</VStack>
						<HStack
							space='md'
							style={{ width: "100%", marginTop: 8 }}>
							<Button
								variant='outline'
								action='secondary'
								onPress={() => setShowSelectModal(false)}
								style={{ flex: 1 }}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								action='positive'
								onPress={confirmSelect}
								style={{ flex: 1 }}>
								<ButtonText>Confirmer</ButtonText>
							</Button>
						</HStack>
					</VStack>
				</ModalContent>
			</Modal>

			{/* Modal de confirmation pour refuser */}
			<Modal
				isOpen={showRejectModal}
				onClose={() => setShowRejectModal(false)}>
				<ModalBackdrop />
				<ModalContent
					style={{
						maxWidth: 400,
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 16,
						padding: 24,
					}}>
					<VStack space='lg' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								backgroundColor: "#fee2e2",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={XCircle}
								size='2xl'
								style={{ color: "#dc2626" }}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Confirmer le refus
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#d1d5db" : "#6b7280",
									textAlign: "center",
								}}>
								Êtes-vous sûr de vouloir refuser cette
								candidature ? Cette action est définitive.
							</Text>
						</VStack>
						<HStack
							space='md'
							style={{ width: "100%", marginTop: 8 }}>
							<Button
								variant='outline'
								action='secondary'
								onPress={() => setShowRejectModal(false)}
								style={{ flex: 1 }}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								action='negative'
								onPress={confirmReject}
								style={{ flex: 1 }}>
								<ButtonText>Refuser</ButtonText>
							</Button>
						</HStack>
					</VStack>
				</ModalContent>
			</Modal>

			{/* Modal de confirmation pour générer le contrat */}
			<Modal
				isOpen={showGenerateContractModal}
				onClose={() => setShowGenerateContractModal(false)}>
				<ModalBackdrop />
				<ModalContent
					style={{
						maxWidth: 400,
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 16,
						padding: 24,
					}}>
					<VStack space='lg' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								backgroundColor: "#dbeafe",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={FileCheck}
								size='2xl'
								style={{ color: "#2563eb" }}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Confirmer la génération du contrat
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#d1d5db" : "#6b7280",
									textAlign: "center",
								}}>
								Êtes-vous sûr de vouloir générer et envoyer le
								contrat à ce candidat ?
							</Text>
						</VStack>
						<HStack
							space='md'
							style={{ width: "100%", marginTop: 8 }}>
							<Button
								variant='outline'
								action='secondary'
								onPress={() =>
									setShowGenerateContractModal(false)
								}
								style={{ flex: 1 }}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								action='positive'
								onPress={confirmGenerateContract}
								style={{ flex: 1 }}>
								<ButtonText>Confirmer</ButtonText>
							</Button>
						</HStack>
					</VStack>
				</ModalContent>
			</Modal>

			{/* ActionSheet Messagerie */}
			<Actionsheet
				isOpen={showMessaging}
				onClose={() => setShowMessaging(false)}
				snapPoints={[90]}>
				<ActionsheetBackdrop />
				<ActionsheetContent style={{ padding: 0 }}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<KeyboardAvoidingView
						style={{ flex: 1, width: "100%" }}
						behavior={Platform.OS === "ios" ? "padding" : "height"}>
						<VStack
							className='flex-1 w-full pt-2'
							style={{ paddingBottom: keyboardPadding }}>
							{/* Header avec avatar et bouton fermer */}
							<HStack
								space='md'
								className='items-center px-4 pb-3 border-b border-outline-200'
								style={{ justifyContent: "space-between" }}>
								<HStack
									space='md'
									style={{ alignItems: "center", flex: 1 }}>
									<Avatar size='md'>
										{role === "pro" ? (
											application?.profiles
												?.avatar_url ? (
												<AvatarImage
													source={{
														uri: application
															.profiles
															.avatar_url,
													}}
												/>
											) : (
												<AvatarFallbackText>
													{`${application?.profiles?.firstname} ${application?.profiles?.lastname}`}
												</AvatarFallbackText>
											)
										) : application?.companies?.logo_url ? (
											<AvatarImage
												source={{
													uri: application.companies
														.logo_url,
												}}
											/>
										) : (
											<AvatarFallbackText>
												{application?.companies?.name ||
													application?.jobs
														?.company_name}
											</AvatarFallbackText>
										)}
									</Avatar>
									<VStack style={{ flex: 1 }}>
										<HStack
											space='xs'
											style={{ alignItems: "center" }}>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{role === "pro"
													? `${application?.profiles?.firstname} ${application?.profiles?.lastname}`
													: application?.companies
															?.name ||
														application?.jobs
															?.company_name}
											</Heading>
											{isOtherPartyOnline && (
												<View
													style={{
														width: 8,
														height: 8,
														borderRadius: 4,
														backgroundColor:
															"#22c55e",
													}}
												/>
											)}
										</HStack>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											{application?.jobs?.title}
										</Text>
									</VStack>
								</HStack>
								<Pressable
									onPress={() => setShowMessaging(false)}
									style={{
										padding: 8,
									}}>
									<Icon
										as={X}
										size='xl'
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</Pressable>
							</HStack>
							<MessageThread
								applyId={apply_id}
								otherPartyName={
									role === "pro"
										? `${application?.profiles?.firstname} ${application?.profiles?.lastname}`
										: application?.companies?.name ||
											application?.jobs?.company_name
								}
								isReadOnly={currentStatus === "rejected"}
								onTypingChange={(typing) =>
									setIsOtherPartyTyping(typing)
								}
							/>
						</VStack>
					</KeyboardAvoidingView>
				</ActionsheetContent>
			</Actionsheet>
		</Box>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default ApplicationScreen;

// nom du poste, lieu, competences attendues, salaire, type de contrat (CDI CDD MITEMPS ...), temps de travail (nuit, journée), description du poste (c'est la fiche de poste), avantages (tickets resto, formation etc...)
