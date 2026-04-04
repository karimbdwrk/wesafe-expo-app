import React, { useState, useEffect, useCallback } from "react";
import {
	useLocalSearchParams,
	useFocusEffect,
	Stack,
	useNavigation,
	useRouter,
} from "expo-router";
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
import { Spinner } from "@/components/ui/spinner";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { TOGGLE_WISHLIST_JOB, ARCHIVE_JOB } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";

import {
	Bookmark,
	BookmarkCheck,
	Timer,
	Check,
	MapPin,
	Sparkles,
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
	Zap,
	AlertTriangle,
} from "lucide-react-native";
import { position } from "dom-helpers";

// Tableau des catégories métiers
import { CATEGORY, getCategoryLabel } from "@/constants/categories";
import { formatSalary } from "@/constants/salary";

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

const JobScreen = () => {
	const { id, title, company_id, category } = useLocalSearchParams();
	const { user, role, userProfile } = useAuth();
	const { isDark } = useTheme();
	const profileToast = useToast();
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
		getAll,
		createNotification,
		trackActivity,
	} = useDataContext();

	const [isLoading, setIsLoading] = useState(true);

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

	const mapContractType = (value) => {
		if (value === "cdi") return "CDI";
		if (value === "cdd") return "CDD";
		return value;
	};

	const parseVacations = (field) => {
		if (!field) return [];
		if (Array.isArray(field)) return field;
		try {
			return JSON.parse(field);
		} catch {
			return [];
		}
	};

	const formatVacationDate = (date) => {
		if (!date) return "";
		return new Date(date).toLocaleDateString("fr-FR");
	};

	const router = useRouter();
	const scrollViewRef = React.useRef(null);

	const [job, setJob] = useState(null);
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isApplied, setIsApplied] = useState(false);
	const [isArchived, setIsArchived] = useState(false);
	const [showApplyModal, setShowApplyModal] = useState(false);
	const [wishlistCount, setWishlistCount] = useState(0);

	// useEffect(() => {
	// 	console.warn("user data :", user);
	// 	console.warn("job is applied ?", isApplied);
	// }, [isApplied, user]);

	const loadJob = async () => {
		setIsLoading(true);
		const data = await getById(
			"jobs",
			id,
			`*, companies(name, email, logo_url), applications(id, candidate_id, current_status, profiles(firstname, lastname))`,
		);
		console.log("Fetched job data:", data);
		setJob(data);
		const { totalCount } = await getAll(
			"wishlists",
			"wish_id",
			`&job_id=eq.${id}`,
			1,
			1,
		);
		setWishlistCount(totalCount || 0);
		setIsLoading(false);
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
			if (id) {
				loadJob();
				trackActivity("view_job");
			}
		}, []),
	);

	const handleToggle = async () => {
		const isNowInWishlist = await toggleWishlistJob(id, user.id);
		trackActivity(TOGGLE_WISHLIST_JOB, { job_id: id });
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
		trackActivity("apply_job");

		setIsApplied(
			Array.isArray(isNowApplied)
				? isNowApplied.length > 0
				: Boolean(isNowApplied),
		);
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
		if (role === "candidat" && userProfile?.profile_status !== "verified") {
			profileToast.show({
				placement: "top",
				render: ({ id: toastId }) => (
					<CustomToast
						id={toastId}
						icon={AlertTriangle}
						color={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
						title='Profil non vérifié'
						description='Votre profil doit être vérifié pour pouvoir postuler à une offre.'
					/>
				),
			});
			return;
		}
		setShowApplyModal(true);
	};

	const handleArchive = async () => {
		const isNowArchived = await archiveJob(id);
		trackActivity(ARCHIVE_JOB, { job_id: id });
		setIsArchived(isNowArchived);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	const checkApplication = async () => {
		const applied = await isJobApplied(user.id, id);
		setIsApplied(
			Array.isArray(applied) ? applied.length > 0 : Boolean(applied),
		);
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
				backgroundColor: isDark
					? Colors.dark.background
					: Colors.light.background,
			}}>
			<Stack.Screen
				options={{
					headerShown: true,
					headerRight: () => (
						<HStack
							space='sm'
							style={{ alignItems: "center", marginRight: 0 }}>
							{job?.isLastMinute === true && (
								<Zap size={18} color='orange' />
							)}
						</HStack>
					),
				}}
			/>
			{isLoading ? (
				<Box
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: isDark
							? Colors.dark.background
							: Colors.light.background,
					}}>
					<Spinner />
				</Box>
			) : (
				<ScrollView ref={scrollViewRef}>
					<VStack
						space='lg'
						style={{
							paddingHorizontal: 10,
							paddingVertical: 15,
							paddingBottom: 120,
						}}>
						{/* Card Principale - Informations du poste */}
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
												// flexWrap: "wrap",
											}}>
											{job?.isLastMinute && (
												<VStack
													style={{
														justifyContent:
															"flex-start",
														height: "100%",
														paddingTop: 5,
													}}>
													<Zap
														size={18}
														color='orange'
													/>
												</VStack>
											)}
											<VStack>
												<Heading
													size='xl'
													style={{
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
														paddingRight:
															job?.isLastMinute
																? 35
																: 30,
													}}>
													{job?.title}
												</Heading>
												{job?.sponsorship_date &&
													new Date(
														job.sponsorship_date,
													) >= new Date() && (
														<HStack
															space='xs'
															style={{
																alignItems:
																	"center",
																marginTop: 2,
															}}>
															<Sparkles
																size={11}
																color={
																	isDark
																		? Colors
																				.dark
																				.warning
																		: Colors
																				.light
																				.warning
																}
															/>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? Colors
																				.dark
																				.warning
																		: Colors
																				.light
																				.warning,
																	fontWeight:
																		"500",
																}}>
																Annonce
																sponsorisée
															</Text>
														</HStack>
													)}
											</VStack>
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
														? Colors.light.tint
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
												}}
											/>
										</TouchableOpacity>
									)}
								</HStack>
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Avatar size='md'>
										<AvatarFallbackText>
											{job?.companies?.name || "Company"}
										</AvatarFallbackText>
										{job?.companies?.logo_url && (
											<AvatarImage
												source={{
													uri: job?.companies
														?.logo_url,
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
											<Text
												size='md'
												style={{
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
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
															? Colors.dark.muted
															: Colors.light.muted
													}
												/>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
									<Badge
										size='md'
										variant='solid'
										action='info'>
										<BadgeIcon
											as={IdCard}
											className='mr-2'
										/>
										<BadgeText>
											{getCategoryLabel(job?.category)}
										</BadgeText>
									</Badge>
								</HStack>
								<HStack space='sm' style={{ flexWrap: "wrap" }}>
									<Badge
										size='sm'
										variant='solid'
										action='success'>
										<BadgeIcon
											as={FileText}
											className='mr-2'
										/>
										<BadgeText>
											{mapContractType(
												job?.contract_type,
											) || "Non spécifié"}
										</BadgeText>
									</Badge>
									<Badge
										size='sm'
										variant='solid'
										action='muted'>
										<BadgeIcon
											as={Clock}
											className='mr-2'
										/>
										<BadgeText>
											{mapWorkTime(job?.work_time) ||
												"Non spécifié"}
										</BadgeText>
									</Badge>
									{job?.salary_type && (
										<Badge
											size='sm'
											variant='solid'
											action='warning'>
											<BadgeIcon
												as={BadgeEuro}
												className='mr-2'
											/>
											<BadgeText>
												{formatSalary(job)}
											</BadgeText>
										</Badge>
									)}
								</HStack>
								{job?.isLastMinute || job?.is_archived ? (
									<Divider />
								) : null}
								<HStack>
									{job?.isLastMinute && (
										<Badge
											size='md'
											variant='solid'
											action='warning'>
											<BadgeIcon
												as={Zap}
												className='mr-2'
											/>
											<BadgeText>
												Dernière minute
											</BadgeText>
										</Badge>
									)}
									{job?.is_archived && (
										<Badge
											size='md'
											variant='solid'
											action='warning'>
											<BadgeText>Archivé</BadgeText>
										</Badge>
									)}
								</HStack>
								{wishlistCount > 0 && (
									<HStack
										space='xs'
										style={{
											alignItems: "center",
											marginTop: 4,
											opacity: 0.6,
										}}>
										<Bookmark
											size={11}
											color={
												isDark
													? Colors.dark.muted
													: Colors.light.muted
											}
										/>
										<Text
											size='xs'
											style={{
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											{wishlistCount} candidat
											{wishlistCount > 1 ? "s" : ""}{" "}
											{wishlistCount > 1 ? "ont" : "a"}{" "}
											sauvegardé cette offre
										</Text>
									</HStack>
								)}
							</VStack>
						</Card>

						{/* Card Description du poste */}
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
											backgroundColor: isDark
												? Colors.dark.background
												: Colors.light.background,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Briefcase}
											size='xl'
											style={{
												color: isDark
													? Colors.dark.tint
													: Colors.light.tint,
											}}
										/>
									</Box>
									<Heading
										size='lg'
										style={{
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										Description du poste
									</Heading>
								</HStack>

								<Divider
									style={{
										backgroundColor: isDark
											? Colors.dark.border
											: Colors.light.border,
									}}
								/>

								<Text
									size='md'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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
													? Colors.dark.text
													: Colors.light.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															•
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
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
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
											backgroundColor: isDark
												? Colors.dark.background
												: Colors.light.background,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Users}
											size='xl'
											style={{
												color: isDark
													? Colors.dark.tint
													: Colors.light.tint,
											}}
										/>
									</Box>
									<Heading
										size='lg'
										style={{
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										Profil recherché
									</Heading>
								</HStack>

								<Divider
									style={{
										backgroundColor: isDark
											? Colors.dark.border
											: Colors.light.border,
									}}
								/>

								<VStack space='sm'>
									{parseJsonField(job?.searched_profile)
										.length > 0 && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															{profile}
														</Text>
													</HStack>
												))}
											</VStack>
										</VStack>
									)}
									{parseJsonField(job?.diplomas_required)
										.length > 0 && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															{diploma}
														</Text>
													</HStack>
												))}
											</VStack>
										</VStack>
									)}
									{parseJsonField(
										job?.certifications_required,
									).length > 0 && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
												}}>
												Certifications requises :
											</Text>
											<VStack
												space='xs'
												style={{ paddingLeft: 8 }}>
												{parseJsonField(
													job?.certifications_required,
												).map((cert, index) => (
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															{cert}
														</Text>
													</HStack>
												))}
											</VStack>
										</VStack>
									)}
									{parseJsonField(job?.driving_licenses)
										.length > 0 && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															{license}
														</Text>
													</HStack>
												))}
											</VStack>
										</VStack>
									)}
									{parseJsonField(job?.languages).length >
										0 && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? Colors.dark.text
														: Colors.light.text,
												}}>
												Langues requises :
											</Text>
											<VStack
												space='xs'
												style={{ paddingLeft: 8 }}>
												{parseJsonField(
													job?.languages,
												).map((language, index) => (
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															✓
														</Text>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															{language}
														</Text>
													</HStack>
												))}
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
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
											backgroundColor: isDark
												? Colors.dark.background
												: Colors.light.background,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Clock}
											size='xl'
											style={{
												color: isDark
													? Colors.dark.tint
													: Colors.light.tint,
											}}
										/>
									</Box>
									<Heading
										size='lg'
										style={{
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										Conditions
									</Heading>
								</HStack>

								<Divider
									style={{
										backgroundColor: isDark
											? Colors.dark.border
											: Colors.light.border,
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
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											Type de contrat
										</Text>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											{mapContractType(
												job?.contract_type,
											) || "Non spécifié"}
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.background,
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
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											Temps de travail
										</Text>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											{mapWorkTime(job?.work_time) ||
												"Non spécifié"}
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.background,
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
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											Salaire
										</Text>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											{formatSalary(job)}
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.background,
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
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											Horaires
										</Text>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											{mapWorkSchedule(
												job?.work_schedule,
											) || "Non spécifié"}
										</Text>
									</HStack>
									{/* Dates / Vacations */}
									{job?.date_mode === "vacations" ? (
										<>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.background,
												}}
											/>
											<HStack
												style={{
													justifyContent:
														"space-between",
													paddingVertical: 8,
													alignItems: "flex-start",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
													}}>
													Vacations
												</Text>
												<VStack
													space='xs'
													style={{
														alignItems: "flex-end",
													}}>
													{parseVacations(
														job?.vacations,
													).map((v, i) => (
														<Text
															key={i}
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															{formatVacationDate(
																v.date,
															)}
															{v.start_time &&
															v.end_time
																? ` · ${v.start_time} - ${v.end_time}`
																: ""}
														</Text>
													))}
												</VStack>
											</HStack>
										</>
									) : job?.start_date ||
									  job?.start_date_asap ||
									  job?.end_date ? (
										<>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.background,
												}}
											/>
											<HStack
												style={{
													justifyContent:
														"space-between",
													paddingVertical: 8,
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
													}}>
													Dates
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													{job?.start_date_asap
														? "Dès que possible"
														: job?.start_date &&
															new Date(
																job.start_date,
															).toLocaleDateString(
																"fr-FR",
															)}
													{!job?.start_date_asap &&
														job?.start_date &&
														job?.end_date &&
														" - "}
													{!job?.start_date_asap &&
														job?.end_date &&
														new Date(
															job.end_date,
														).toLocaleDateString(
															"fr-FR",
														)}
												</Text>
											</HStack>
										</>
									) : null}
									{(job?.start_time || job?.end_time) && (
										<>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.background,
												}}
											/>
											<HStack
												style={{
													justifyContent:
														"space-between",
													paddingVertical: 8,
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
													}}>
													Heures
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													{job?.start_time &&
														job.start_time.slice(
															0,
															5,
														)}
													{job?.start_time &&
														job?.end_time &&
														" - "}
													{job?.end_time &&
														job.end_time.slice(
															0,
															5,
														)}
												</Text>
											</HStack>
										</>
									)}
									{(job?.packed_lunch ||
										job?.accommodations ||
										parseJsonField(job?.reimbursements)
											.length > 0) && (
										<>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.background,
												}}
											/>
											<HStack
												style={{
													justifyContent:
														"space-between",
													paddingVertical: 8,
													alignItems: "flex-start",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Panier repas
														</Text>
													)}
													{job?.accommodations && (
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Hébergement
														</Text>
													)}
													{parseJsonField(
														job?.reimbursements,
													).map(
														(
															reimbursement,
															index,
														) => (
															<Text
																key={index}
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
											? Colors.dark.cardBackground
											: Colors.light.cardBackground,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? Colors.dark.border
											: Colors.light.border,
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
																	{job
																		?.companies
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
																				? Colors
																						.dark
																						.muted
																				: Colors
																						.light
																						.muted,
																		}}>
																		Entreprise
																	</Text>
																	<Text
																		size='lg'
																		style={{
																			fontWeight:
																				"600",
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
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
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
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
															backgroundColor:
																isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
														}}
													/>

													{/* Description */}
													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															À propos
														</Text>
														<Text
															size='sm'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
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
																	isDark ? Colors.dark.background : Colors.light.background,
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
																	color: isDark ? Colors.dark.muted : Colors.light.muted,
																}}>
																Localisation
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"500",
																	color: isDark ? Colors.dark.text : Colors.light.text,
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
																	isDark ? Colors.dark.background : Colors.light.background,
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
																	color: isDark ? Colors.dark.muted : Colors.light.muted,
																}}>
																Email
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"500",
																	color: isDark ? Colors.dark.text : Colors.light.text,
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
																isDark ? Colors.dark.background : Colors.light.background,
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
																color: isDark ? Colors.dark.muted : Colors.light.muted,
															}}>
															Téléphone
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"500",
																color: isDark ? Colors.dark.text : Colors.light.text,
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
									action={
										isArchived ? "secondary" : "negative"
									}
									variant={isArchived ? "outline" : "solid"}
									size='lg'
									onPress={handleArchive}
									style={{ width: "100%" }}>
									<ButtonText>
										{isArchived
											? "Job archivé"
											: "Archiver"}
									</ButtonText>
								</Button>
							</VStack>
						)}

						{/* Card Candidats (pour pro) */}
						{role === "pro" && user.id === company_id && (
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? Colors.dark.cardBackground
										: Colors.light.cardBackground,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
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
												backgroundColor: isDark
													? Colors.dark.background
													: Colors.light.background,
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={Users}
												size='xl'
												style={{
													color: isDark
														? Colors.dark.tint
														: Colors.light.tint,
												}}
											/>
										</Box>
										<Heading
											size='lg'
											style={{
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											Candidats
										</Heading>
									</HStack>

									<Divider
										style={{
											backgroundColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}
									/>

									{job?.applications &&
									job.applications.length > 0 ? (
										<VStack space='sm'>
											{job.applications.map(
												(apply, index) => (
													<React.Fragment
														key={apply.id}>
														{index > 0 && (
															<Divider
																style={{
																	backgroundColor:
																		isDark
																			? Colors
																					.dark
																					.cardBackground
																			: Colors
																					.light
																					.background,
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
																style={{
																	flex: 1,
																}}>
																<Text
																	size='md'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																	router.push(
																		{
																			pathname:
																				"/application",
																			params: {
																				id: job.id,
																				company_id:
																					job.company_id,
																				apply_id:
																					apply.id,
																			},
																		},
																	)
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
													? Colors.dark.muted
													: Colors.light.muted,
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
			)}

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
						backgroundColor: isDark
							? Colors.dark.background
							: Colors.light.background,
						borderTopWidth: 1,
						borderTopColor: isDark
							? Colors.dark.border
							: Colors.light.border,
					}}>
					<Button
						disabled={isApplied}
						onPress={handleApply}
						style={{
							width: "100%",
							height: 52,
							borderRadius: 12,
							backgroundColor: isApplied
								? isDark
									? Colors.dark.border
									: Colors.light.border
								: Colors.light.tint,
							borderWidth: isApplied ? 1 : 0,
							borderColor: isDark
								? Colors.dark.border
								: Colors.light.border,
						}}>
						<ButtonText
							style={{
								color: isApplied
									? isDark
										? Colors.dark.muted
										: Colors.light.muted
									: "#ffffff",
								fontWeight: "700",
								fontSize: 16,
							}}>
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
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 16,
						padding: 24,
					}}>
					<VStack space='lg' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								backgroundColor: isDark
									? Colors.dark.background
									: Colors.light.background,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={CheckCircle}
								size='2xl'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
								}}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
									textAlign: "center",
								}}>
								Confirmer la candidature
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
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
