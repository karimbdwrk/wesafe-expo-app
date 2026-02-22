import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { toast } from "sonner-native";
import { ScrollView, TouchableOpacity } from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionTitleText,
	AccordionIcon,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

import {
	Bookmark,
	BookmarkCheck,
	Timer,
	Check,
	MapPin,
	IdCard,
	Briefcase,
	Building2,
	BadgeEuro,
	FileText,
	Users,
	Clock,
	Mail,
	Phone,
	ChevronDown,
	ChevronUp,
	CheckCircle,
} from "lucide-react-native";
import { position } from "dom-helpers";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

// Tableau des catégories métiers
import { CATEGORY, getCategoryLabel } from "@/constants/categories";

const mapWorkTime = (value) => {
	if (value === "fulltime") return "Temps plein";
	if (value === "parttime") return "Temps partiel";
	return value;
};

const mapWorkSchedule = (value) => {
	if (value === "daily") return "Jour";
	if (value === "nightly") return "Nuit";
	if (value === "variable") return "Variable";
	return value;
};

const mapWorkHoursType = (value) => {
	if (value === "weekly") return "semaine";
	if (value === "daily") return "jour";
	return value;
};

const formatSalary = (job) => {
	if (!job?.salary_type) return "Non spécifié";

	switch (job.salary_type) {
		case "selon_profil":
			return "Selon profil";
		case "hourly":
			return job.salary_hourly
				? `${job.salary_hourly}€/h`
				: "Non spécifié";
		case "monthly_fixed":
			return job.salary_monthly_fixed
				? `${job.salary_monthly_fixed}€/mois`
				: "Non spécifié";
		case "annual_fixed":
			return job.salary_annual_fixed
				? `${job.salary_annual_fixed}€/an`
				: "Non spécifié";
		case "monthly_range":
			return job.salary_monthly_min && job.salary_monthly_max
				? `${job.salary_monthly_min}€ - ${job.salary_monthly_max}€/mois`
				: "Non spécifié";
		case "annual_range":
			return job.salary_annual_min && job.salary_annual_max
				? `${job.salary_annual_min}€ - ${job.salary_annual_max}€/an`
				: "Non spécifié";
		default:
			return "Non spécifié";
	}
};

const JobScreen = () => {
	const { id, title, company_id, category } = useLocalSearchParams();
	const { user, role, userProfile, accessToken } = useAuth();
	const { isDark } = useTheme();
	const navigation = useNavigation();
	const {
		toggleWishlistJob,
		getWishlistJobs,
		isJobInWishlist,
		isJobApplied,
		applyToJob,
		archiveJob,
		isJobArchived,
		getById,
		createNotification,
	} = useDataContext();

	// Fonctions helper pour parser et mapper les données
	const parseJsonField = (field) => {
		if (!field) return [];
		try {
			return JSON.parse(field);
		} catch (e) {
			return [];
		}
	};

	const mapWorkTime = (value) => {
		if (value === "fulltime") return "Temps plein";
		if (value === "parttime") return "Temps partiel";
		return value;
	};

	const mapWorkSchedule = (value) => {
		if (value === "daily") return "Jour";
		if (value === "nightly") return "Nuit";
		if (value === "variable") return "Variable";
		return value;
	};

	const mapWorkHoursType = (value) => {
		if (value === "weekly") return "semaine";
		if (value === "daily") return "jour";
		return value;
	};

	const formatSalary = (job) => {
		if (!job?.salary_type) return "Non spécifié";

		switch (job.salary_type) {
			case "selon_profil":
				return "Selon profil";
			case "hourly":
				return job.salary_hourly
					? `${job.salary_hourly}€/h`
					: "Non spécifié";
			case "monthly_fixed":
				return job.salary_monthly_fixed
					? `${job.salary_monthly_fixed}€/mois`
					: "Non spécifié";
			case "annual_fixed":
				return job.salary_annual_fixed
					? `${job.salary_annual_fixed}€/an`
					: "Non spécifié";
			case "monthly_range":
				return job.salary_monthly_min && job.salary_monthly_max
					? `${job.salary_monthly_min}€ - ${job.salary_monthly_max}€/mois`
					: "Non spécifié";
			case "annual_range":
				return job.salary_annual_min && job.salary_annual_max
					? `${job.salary_annual_min}€ - ${job.salary_annual_max}€/an`
					: "Non spécifié";
			default:
				return "Non spécifié";
		}
	};

	const router = useRouter();
	const scrollViewRef = React.useRef(null);

	const [job, setJob] = useState(null);
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isApplied, setIsApplied] = useState(false);
	const [isArchived, setIsArchived] = useState(false);
	const [showApplyModal, setShowApplyModal] = useState(false);

	// useEffect(() => {
	// 	console.warn("user data :", user);
	// 	console.warn("job is applied ?", isApplied);
	// }, [isApplied, user]);

	const loadJob = async () => {
		const data = await getById(
			"jobs",
			id,
			`*, companies(name, email, logo_url), applications(id, candidate_id, current_status, profiles(firstname, lastname))`,
		);
		console.log("Fetched job data:", data);
		setJob(data);
	};

	useEffect(() => {
		if (job?.title) {
			navigation.setOptions({
				headerTitle: job.title,
			});
		}
	}, [job?.title, navigation]);

	useFocusEffect(
		useCallback(() => {
			id && loadJob();
		}, []),
	);

	const handleToggle = async () => {
		const isNowInWishlist = await toggleWishlistJob(id, user.id);
		setIsInWishlist(isNowInWishlist);
		toast.success(
			isNowInWishlist ? "Ajouté aux favoris" : "Retiré des favoris",
			{
				description: isNowInWishlist
					? "Cette offre a été ajoutée à votre liste de favoris"
					: "Cette offre a été retirée de votre liste de favoris",
				duration: 2000,
				icon: <Check />,
			},
		);
	};

	const confirmApply = async () => {
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
		setShowApplyModal(false);
		toast.success(`Vous avez postulé à l'offre d'emploi avec succés!`, {
			// style: { backgroundColor: "blue" },
			description:
				"Vous recevrez une notification pour vous tenir informer de l'avancée",
			duration: 2500,
			icon: <Check />,
		});
		await createNotification({
			recipientId: company_id,
			actorId: user.id,
			type: "application_submitted",
			title: "Candidature soumise",
			body: "Un candidat vient de postuler à votre offre d'emploi.",
			entityType: "application",
			entityId: isNowApplied[0].id,
		});
	};

	const handleApply = () => {
		setShowApplyModal(true);
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
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView ref={scrollViewRef}>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 100 }}>
					{/* Card Principale - Informations du poste */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack
								style={{
									justifyContent: "space-between",
									alignItems: "flex-start",
								}}>
								<VStack style={{ flex: 1 }}>
									<HStack
										space='sm'
										style={{
											alignItems: "center",
											flexWrap: "wrap",
										}}>
										<Heading
											size='xl'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
												paddingRight: 30,
											}}>
											{job?.title}
										</Heading>
										{job?.isLastMinute && (
											<Icon
												as={Timer}
												size='lg'
												style={{ color: "#ef4444" }}
											/>
										)}
									</HStack>
								</VStack>
								{role === "candidat" && (
									<TouchableOpacity
										onPress={handleToggle}
										style={{
											position: "absolute",
											right: -5,
											top: -5,
										}}>
										<Icon
											as={
												isInWishlist
													? BookmarkCheck
													: Bookmark
											}
											size='xl'
											style={{
												color: isInWishlist
													? "#3b82f6"
													: isDark
														? "#9ca3af"
														: "#6b7280",
											}}
										/>
									</TouchableOpacity>
								)}
							</HStack>

							{/* Localisation */}
							{/* {job?.city && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: "#fef3c7",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={MapPin}
											size='lg'
											style={{ color: "#f59e0b" }}
										/>
									</Box>
									<Text
										size='md'
										style={{
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										{job?.city} ({job?.department} |{" "}
										{job?.department_code})
									</Text>
								</HStack>
							)} */}

							<HStack space='md' style={{ alignItems: "center" }}>
								<Avatar size='md'>
									<AvatarFallbackText>
										{job?.companies?.name || "Company"}
									</AvatarFallbackText>
									{job?.companies?.logo_url && (
										<AvatarImage
											source={{
												uri: job?.companies?.logo_url,
											}}
										/>
									)}
								</Avatar>
								<VStack style={{ flex: 1 }}>
									<HStack
										space='xs'
										style={{
											alignItems: "center",
											marginTop: 2,
										}}>
										{/* <Building2
																size={14}
																color={isDark ? "#f3f4f6" : "#111827"}
															/> */}
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
												fontWeight: "500",
											}}>
											{job?.companies?.name ||
												"Entreprise"}
										</Text>
									</HStack>
									{job?.city && (
										<HStack
											space='xs'
											style={{
												alignItems: "center",
												marginTop: 2,
											}}>
											<MapPin
												size={12}
												color={
													isDark
														? "#9ca3af"
														: "#6b7280"
												}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												{job?.city +
													" (" +
													job?.postcode +
													")"}
											</Text>
										</HStack>
									)}
								</VStack>
							</HStack>

							{/* Badges */}
							<HStack
								space='sm'
								style={{ flexWrap: "wrap", marginTop: 10 }}>
								<Badge size='md' variant='solid' action='info'>
									<BadgeIcon as={IdCard} className='mr-2' />
									<BadgeText>
										{getCategoryLabel(job?.category)}
									</BadgeText>
								</Badge>
								<Badge
									size='sm'
									variant='solid'
									action='success'>
									<BadgeIcon as={FileText} className='mr-2' />
									<BadgeText>
										{job?.contract_type || "Non spécifié"}
									</BadgeText>
								</Badge>
								<Badge size='sm' variant='solid' action='muted'>
									<BadgeIcon as={Clock} className='mr-2' />
									<BadgeText>
										{mapWorkTime(job?.work_time) ||
											"Non spécifié"}
									</BadgeText>
								</Badge>
								<Badge
									size='sm'
									variant='solid'
									action='warning'>
									<BadgeIcon
										as={BadgeEuro}
										className='mr-2'
									/>
									<BadgeText>{formatSalary(job)}</BadgeText>
								</Badge>
								{job?.isLastMinute && (
									<Badge
										size='md'
										variant='solid'
										action='error'>
										<BadgeIcon as={Clock} />
										<BadgeText>Dernière minute</BadgeText>
									</Badge>
								)}
								{job?.isArchived && (
									<Badge
										size='md'
										variant='solid'
										action='warning'>
										<BadgeText>Archivé</BadgeText>
									</Badge>
								)}
							</HStack>
						</VStack>
					</Card>

					{/* Card Description du poste */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: "#dbeafe",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={Briefcase}
										size='xl'
										style={{ color: "#2563eb" }}
									/>
								</Box>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Description du poste
								</Heading>
							</HStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							<Text
								size='md'
								style={{
									color: isDark ? "#d1d5db" : "#374151",
									lineHeight: 22,
								}}>
								{job?.description ||
									"Aucune description disponible"}
							</Text>

							{parseJsonField(job?.missions).length > 0 && (
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Missions principales :
									</Text>
									<VStack
										space='xs'
										style={{ paddingLeft: 8 }}>
										{parseJsonField(job?.missions).map(
											(mission, index) => (
												<HStack
													key={index}
													space='sm'
													style={{
														alignItems:
															"flex-start",
													}}>
													<Text
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														•
													</Text>
													<Text
														size='sm'
														style={{
															flex: 1,
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														{mission}
													</Text>
												</HStack>
											),
										)}
									</VStack>
								</VStack>
							)}
						</VStack>
					</Card>

					{/* Card Profil recherché */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
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
										as={Users}
										size='xl'
										style={{ color: "#16a34a" }}
									/>
								</Box>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Profil recherché
								</Heading>
							</HStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							<VStack space='sm'>
								{parseJsonField(job?.searched_profile).length >
									0 && (
									<VStack space='sm'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Profil recherché :
										</Text>
										<VStack
											space='xs'
											style={{ paddingLeft: 8 }}>
											{parseJsonField(
												job?.searched_profile,
											).map((profile, index) => (
												<HStack
													key={index}
													space='sm'
													style={{
														alignItems:
															"flex-start",
													}}>
													<Text
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														✓
													</Text>
													<Text
														size='sm'
														style={{
															flex: 1,
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														{profile}
													</Text>
												</HStack>
											))}
										</VStack>
									</VStack>
								)}
								{parseJsonField(job?.diplomas_required).length >
									0 && (
									<VStack space='sm'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Diplômes requis :
										</Text>
										<VStack
											space='xs'
											style={{ paddingLeft: 8 }}>
											{parseJsonField(
												job?.diplomas_required,
											).map((diploma, index) => (
												<HStack
													key={index}
													space='sm'
													style={{
														alignItems:
															"flex-start",
													}}>
													<Text
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														✓
													</Text>
													<Text
														size='sm'
														style={{
															flex: 1,
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														{diploma}
													</Text>
												</HStack>
											))}
										</VStack>
									</VStack>
								)}
								{parseJsonField(job?.driving_licenses).length >
									0 && (
									<VStack space='sm'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Permis requis :
										</Text>
										<VStack
											space='xs'
											style={{ paddingLeft: 8 }}>
											{parseJsonField(
												job?.driving_licenses,
											).map((license, index) => (
												<HStack
													key={index}
													space='sm'
													style={{
														alignItems:
															"flex-start",
													}}>
													<Text
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														✓
													</Text>
													<Text
														size='sm'
														style={{
															flex: 1,
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														{license}
													</Text>
												</HStack>
											))}
										</VStack>
									</VStack>
								)}
								{parseJsonField(job?.languages).length > 0 && (
									<VStack space='sm'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Langues requises :
										</Text>
										<VStack
											space='xs'
											style={{ paddingLeft: 8 }}>
											{parseJsonField(job?.languages).map(
												(language, index) => (
													<HStack
														key={index}
														space='sm'
														style={{
															alignItems:
																"flex-start",
														}}>
														<Text
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? "#d1d5db"
																	: "#374151",
															}}>
															{language}
														</Text>
													</HStack>
												),
											)}
										</VStack>
									</VStack>
								)}
							</VStack>
						</VStack>
					</Card>

					{/* Card Conditions */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
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
										as={Clock}
										size='xl'
										style={{ color: "#f59e0b" }}
									/>
								</Box>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Conditions
								</Heading>
							</HStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							<VStack space='sm'>
								<HStack
									style={{
										justifyContent: "space-between",
										paddingVertical: 8,
									}}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Type de contrat
									</Text>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{job?.contract_type || "Non spécifié"}
									</Text>
								</HStack>
								<Divider
									style={{
										backgroundColor: isDark
											? "#374151"
											: "#f3f4f6",
									}}
								/>
								<HStack
									style={{
										justifyContent: "space-between",
										paddingVertical: 8,
									}}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Temps de travail
									</Text>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{mapWorkTime(job?.work_time) ||
											"Non spécifié"}
									</Text>
								</HStack>
								<Divider
									style={{
										backgroundColor: isDark
											? "#374151"
											: "#f3f4f6",
									}}
								/>
								<HStack
									style={{
										justifyContent: "space-between",
										paddingVertical: 8,
									}}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Salaire
									</Text>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{formatSalary(job)}
									</Text>
								</HStack>
								<Divider
									style={{
										backgroundColor: isDark
											? "#374151"
											: "#f3f4f6",
									}}
								/>
								<HStack
									style={{
										justifyContent: "space-between",
										paddingVertical: 8,
									}}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Horaires
									</Text>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{mapWorkSchedule(job?.work_schedule) ||
											"Non spécifié"}
									</Text>
								</HStack>
								{(job?.start_date || job?.end_date) && (
									<>
										<Divider
											style={{
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
											}}
										/>
										<HStack
											style={{
												justifyContent: "space-between",
												paddingVertical: 8,
											}}>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Dates
											</Text>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{job?.start_date &&
													new Date(
														job.start_date,
													).toLocaleDateString(
														"fr-FR",
													)}
												{job?.start_date &&
													job?.end_date &&
													" - "}
												{job?.end_date &&
													new Date(
														job.end_date,
													).toLocaleDateString(
														"fr-FR",
													)}
											</Text>
										</HStack>
									</>
								)}
								{(job?.start_time || job?.end_time) && (
									<>
										<Divider
											style={{
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
											}}
										/>
										<HStack
											style={{
												justifyContent: "space-between",
												paddingVertical: 8,
											}}>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Heures
											</Text>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{job?.start_time &&
													job.start_time.slice(0, 5)}
												{job?.start_time &&
													job?.end_time &&
													" - "}
												{job?.end_time &&
													job.end_time.slice(0, 5)}
											</Text>
										</HStack>
									</>
								)}
								{(job?.packed_lunch ||
									job?.accommodations ||
									parseJsonField(job?.reimbursements).length >
										0) && (
									<>
										<Divider
											style={{
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
											}}
										/>
										<HStack
											style={{
												justifyContent: "space-between",
												paddingVertical: 8,
												alignItems: "flex-start",
											}}>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Avantages
											</Text>
											<VStack
												space='xs'
												style={{
													alignItems: "flex-end",
												}}>
												{job?.packed_lunch && (
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Panier repas
													</Text>
												)}
												{job?.accommodations && (
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Hébergement
													</Text>
												)}
												{parseJsonField(
													job?.reimbursements,
												).map(
													(reimbursement, index) => (
														<Text
															key={index}
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}>
															{reimbursement}
														</Text>
													),
												)}
											</VStack>
										</HStack>
									</>
								)}
							</VStack>
						</VStack>
					</Card>

					{/* Card Entreprise avec Accordion */}
					{job?.companies &&
						!(role === "pro" && user.id === company_id) && (
							<Card
								style={{
									padding: 0,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
									overflow: "hidden",
								}}>
								<Accordion type='single' variant='unfilled'>
									<AccordionItem value='company'>
										<AccordionHeader>
											<AccordionTrigger
												style={{
													padding: 20,
													backgroundColor:
														"transparent",
												}}
												onPress={() => {
													setTimeout(() => {
														scrollViewRef.current?.scrollToEnd(
															{
																animated: true,
															},
														);
													}, 300);
												}}>
												{({ isExpanded }) => (
													<>
														<HStack
															space='sm'
															style={{
																alignItems:
																	"center",
																flex: 1,
															}}>
															<Avatar size='md'>
																<AvatarFallbackText>
																	{job
																		?.companies
																		?.name?.[0] ||
																		"?"}
																</AvatarFallbackText>
																{job?.companies
																	?.logo_url && (
																	<AvatarImage
																		source={{
																			uri: job
																				?.companies
																				?.logo_url,
																		}}
																	/>
																)}
															</Avatar>
															<VStack
																style={{
																	flex: 1,
																}}>
																<Text
																	size='xs'
																	style={{
																		color: isDark
																			? "#9ca3af"
																			: "#6b7280",
																	}}>
																	Entreprise
																</Text>
																<Text
																	size='lg'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? "#f3f4f6"
																			: "#111827",
																	}}>
																	{
																		job
																			.companies
																			.name
																	}
																</Text>
															</VStack>
															<Icon
																as={
																	isExpanded
																		? ChevronUp
																		: ChevronDown
																}
																size='lg'
																style={{
																	color: isDark
																		? "#9ca3af"
																		: "#6b7280",
																}}
															/>
														</HStack>
													</>
												)}
											</AccordionTrigger>
										</AccordionHeader>
										<AccordionContent
											style={{
												paddingHorizontal: 20,
												paddingBottom: 20,
											}}>
											<VStack space='md'>
												<Divider
													style={{
														backgroundColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}
												/>

												{/* Description */}
												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														À propos
													</Text>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#d1d5db"
																: "#374151",
															lineHeight: 20,
														}}>
														{job.companies
															.description ||
															"Entreprise spécialisée dans les services de sécurité et de surveillance. Nous offrons des solutions professionnelles adaptées à tous types d'établissements."}
													</Text>
												</VStack>

												{/* Localisation */}
												{/* {job.city && (
													<HStack
														space='sm'
														style={{
															alignItems:
																"center",
														}}>
														<Box
															style={{
																width: 40,
																height: 40,
																borderRadius: 20,
																backgroundColor:
																	"#fef3c7",
																justifyContent:
																	"center",
																alignItems:
																	"center",
															}}>
															<Icon
																as={MapPin}
																size='lg'
																style={{
																	color: "#f59e0b",
																}}
															/>
														</Box>
														<VStack>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? "#9ca3af"
																		: "#6b7280",
																}}>
																Localisation
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"500",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{job.city} (
																{
																	job.department_code
																}
																)
															</Text>
														</VStack>
													</HStack>
												)} */}

												{/* Email */}
												{/* {job.companies.email && (
													<HStack
														space='sm'
														style={{
															alignItems:
																"center",
														}}>
														<Box
															style={{
																width: 40,
																height: 40,
																borderRadius: 20,
																backgroundColor:
																	"#dbeafe",
																justifyContent:
																	"center",
																alignItems:
																	"center",
															}}>
															<Icon
																as={Mail}
																size='lg'
																style={{
																	color: "#2563eb",
																}}
															/>
														</Box>
														<VStack>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? "#9ca3af"
																		: "#6b7280",
																}}>
																Email
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"500",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{
																	job
																		.companies
																		.email
																}
															</Text>
														</VStack>
													</HStack>
												)} */}

												{/* Téléphone (exemple fictif) */}
												{/* <HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Box
														style={{
															width: 40,
															height: 40,
															borderRadius: 20,
															backgroundColor:
																"#dcfce7",
															justifyContent:
																"center",
															alignItems:
																"center",
														}}>
														<Icon
															as={Phone}
															size='lg'
															style={{
																color: "#16a34a",
															}}
														/>
													</Box>
													<VStack>
														<Text
															size='xs'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
															}}>
															Téléphone
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"500",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}>
															{job.companies
																.phone ||
																"01 23 45 67 89"}
														</Text>
													</VStack>
												</HStack> */}
											</VStack>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</Card>
						)}

					{/* Boutons d'action */}
					{role === "pro" && user.id === company_id && (
						<VStack space='sm'>
							<Button
								disabled={isArchived ? true : false}
								action={isArchived ? "secondary" : "negative"}
								variant={isArchived ? "outline" : "solid"}
								size='lg'
								onPress={handleArchive}
								style={{ width: "100%" }}>
								<ButtonText>
									{isArchived ? "Job archivé" : "Archiver"}
								</ButtonText>
							</Button>
						</VStack>
					)}

					{/* Card Candidats (pour pro) */}
					{role === "pro" && user.id === company_id && (
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<VStack space='md'>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
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
											as={Users}
											size='xl'
											style={{ color: "#16a34a" }}
										/>
									</Box>
									<Heading
										size='lg'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Candidats
									</Heading>
								</HStack>

								<Divider
									style={{
										backgroundColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}
								/>

								{job?.applications &&
								job.applications.length > 0 ? (
									<VStack space='sm'>
										{job.applications.map(
											(apply, index) => (
												<React.Fragment key={apply.id}>
													{index > 0 && (
														<Divider
															style={{
																backgroundColor:
																	isDark
																		? "#374151"
																		: "#f3f4f6",
															}}
														/>
													)}
													<HStack
														style={{
															justifyContent:
																"space-between",
															alignItems:
																"center",
															paddingVertical: 8,
														}}>
														<VStack
															style={{ flex: 1 }}>
															<Text
																size='md'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{
																	apply
																		.profiles
																		.firstname
																}{" "}
																{
																	apply
																		.profiles
																		.lastname
																}
															</Text>
															{apply.current_status && (
																<Badge
																	size='sm'
																	variant='solid'
																	action={
																		apply.current_status ===
																		"rejected"
																			? "error"
																			: apply.current_status ===
																				  "contract_signed_pro"
																				? "success"
																				: "info"
																	}
																	style={{
																		marginTop: 4,
																		alignSelf:
																			"flex-start",
																	}}>
																	<BadgeText>
																		{apply.current_status ===
																		"applied"
																			? "Candidature envoyée"
																			: apply.current_status ===
																				  "selected"
																				? "Sélectionné"
																				: apply.current_status ===
																					  "contract_sent"
																					? "Contrat envoyé"
																					: apply.current_status ===
																						  "contract_signed_candidate"
																						? "Contrat signé (candidat)"
																						: apply.current_status ===
																							  "contract_signed_pro"
																							? "Contrat finalisé"
																							: apply.current_status ===
																								  "rejected"
																								? "Refusé"
																								: apply.current_status}
																	</BadgeText>
																</Badge>
															)}
														</VStack>
														<Button
															size='sm'
															action='primary'
															onPress={() =>
																router.push({
																	pathname:
																		"/application",
																	params: {
																		id: job.id,
																		company_id:
																			job.company_id,
																		apply_id:
																			apply.id,
																	},
																})
															}>
															<ButtonText>
																Voir
															</ButtonText>
														</Button>
													</HStack>
												</React.Fragment>
											),
										)}
									</VStack>
								) : (
									<Text
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											textAlign: "center",
											paddingVertical: 16,
										}}>
										Aucun candidat pour cette offre.
									</Text>
								)}
							</VStack>
						</Card>
					)}
				</VStack>
			</ScrollView>

			{/* Bouton fixe en bas pour candidat */}
			{role === "candidat" && (
				<Box
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						padding: 16,
						paddingBottom: 35,
						backgroundColor: isDark ? "#1f2937" : "#f9fafb",
						borderTopWidth: 1,
						borderTopColor: isDark ? "#374151" : "#e5e7eb",
					}}>
					<Button
						disabled={isApplied ? true : false}
						action={isApplied ? "secondary" : "primary"}
						variant={isApplied ? "outline" : "solid"}
						size='lg'
						onPress={handleApply}
						style={{ width: "100%" }}>
						<ButtonText>
							{isApplied ? "Vous avez déjà postulé" : "Postuler"}
						</ButtonText>
					</Button>
				</Box>
			)}

			{/* Modal de confirmation pour postuler */}
			<Modal
				isOpen={showApplyModal}
				onClose={() => setShowApplyModal(false)}>
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
								as={CheckCircle}
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
								Confirmer la candidature
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#d1d5db" : "#6b7280",
									textAlign: "center",
								}}>
								Êtes-vous sûr de vouloir postuler à cette offre
								d'emploi ? Vous recevrez une notification pour
								suivre l'avancée de votre candidature.
							</Text>
						</VStack>
						<HStack
							space='md'
							style={{ width: "100%", marginTop: 8 }}>
							<Button
								variant='outline'
								action='secondary'
								onPress={() => setShowApplyModal(false)}
								style={{ flex: 1 }}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								action='primary'
								onPress={confirmApply}
								style={{ flex: 1 }}>
								<ButtonText>Postuler</ButtonText>
							</Button>
						</HStack>
					</VStack>
				</ModalContent>
			</Modal>
		</Box>
	);
};

export default JobScreen;
