import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { toast } from "sonner-native";
import { ScrollView, TouchableOpacity } from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
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
	Users,
	Clock,
	Mail,
	Phone,
	ChevronDown,
	ChevronUp,
} from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const JobScreen = () => {
	const { id, title, company_id, category } = useLocalSearchParams();
	const { user, role, userProfile, accessToken } = useAuth();
	const { isDark } = useTheme();
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
			<ScrollView>
				<VStack space='lg' style={{ padding: 20 }}>
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
									<TouchableOpacity onPress={handleToggle}>
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
							{job?.city && (
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
							)}

							{/* Badges */}
							<HStack space='sm' style={{ flexWrap: "wrap" }}>
								<Badge size='md' variant='solid' action='info'>
									<BadgeIcon as={IdCard} />
									<BadgeText>{job?.category}</BadgeText>
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
								Nous recherchons un professionnel qualifié pour
								rejoindre notre équipe. Le candidat idéal aura
								une solide expérience dans le domaine et sera
								capable de travailler de manière autonome tout
								en collaborant efficacement avec l'équipe.
							</Text>

							<VStack space='sm'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Missions principales :
								</Text>
								<VStack space='xs' style={{ paddingLeft: 8 }}>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Assurer la sécurité des locaux et
											des personnes
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Effectuer des rondes de surveillance
											régulières
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Gérer les accès et contrôler les
											entrées/sorties
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Rédiger des rapports d'intervention
										</Text>
									</HStack>
								</VStack>
							</VStack>
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
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Compétences requises :
								</Text>
								<VStack space='xs' style={{ paddingLeft: 8 }}>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Carte professionnelle en cours de
											validité
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Diplôme SSIAP requis selon le poste
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Expérience minimum de 2 ans dans le
											domaine
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Excellentes capacités de
											communication
										</Text>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "flex-start" }}>
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
											Sens du service et des
											responsabilités
										</Text>
									</HStack>
								</VStack>
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
										CDI / CDD
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
										Temps plein
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
										Selon profil
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
										Jour / Nuit / Variable
									</Text>
								</HStack>
							</VStack>
						</VStack>
					</Card>

					{/* Card Entreprise avec Accordion */}
					{job?.companies && (
						<Card
							style={{
								padding: 0,
								backgroundColor: isDark ? "#374151" : "#ffffff",
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
												backgroundColor: "transparent",
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
														<Box
															style={{
																width: 48,
																height: 48,
																borderRadius: 24,
																backgroundColor:
																	"#dbeafe",
																justifyContent:
																	"center",
																alignItems:
																	"center",
															}}>
															<Icon
																as={Building2}
																size='xl'
																style={{
																	color: "#2563eb",
																}}
															/>
														</Box>
														<VStack
															style={{ flex: 1 }}>
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
											{job.city && (
												<HStack
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
											)}

											{/* Email */}
											{job.companies.email && (
												<HStack
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
																job.companies
																	.email
															}
														</Text>
													</VStack>
												</HStack>
											)}

											{/* Téléphone (exemple fictif) */}
											<HStack
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
														alignItems: "center",
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
															fontWeight: "500",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														{job.companies.phone ||
															"01 23 45 67 89"}
													</Text>
												</VStack>
											</HStack>
										</VStack>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</Card>
					)}

					{/* Boutons d'action */}
					<VStack space='sm'>
						{role === "candidat" && (
							<Button
								disabled={isApplied ? true : false}
								action={isApplied ? "secondary" : "primary"}
								variant={isApplied ? "outline" : "solid"}
								size='lg'
								onPress={handleApply}
								style={{ width: "100%" }}>
								<ButtonText>
									{isApplied
										? "Vous avez déjà postulé"
										: "Postuler"}
								</ButtonText>
							</Button>
						)}
						{role === "pro" && user.id === company_id && (
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
						)}
					</VStack>

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

								{job?.applies && job.applies.length > 0 ? (
									<VStack space='sm'>
										{job.applies.map((apply, index) => (
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
														alignItems: "center",
														paddingVertical: 8,
													}}>
													<VStack>
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
																apply.profiles
																	.firstname
															}{" "}
															{
																apply.profiles
																	.lastname
															}
														</Text>
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
										))}
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
		</Box>
	);
};

export default JobScreen;
