import React, { useState, useCallback, useEffect } from "react";
import {
	ScrollView,
	RefreshControl,
	TouchableOpacity,
	Dimensions,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";

import {
	Search,
	MapPin,
	Briefcase,
	TrendingUp,
	Users,
	Building2,
	FileText,
	ClipboardList,
	Plus,
	ChevronRight,
	Clock,
	CheckCircle,
	AlertCircle,
	Bookmark,
	BadgeCheck,
	Timer,
	Sparkles,
	BookmarkCheck,
	IdCard,
} from "lucide-react-native";

import JobCard from "@/components/JobCard";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { width } from "dom-helpers";
import { Spinner } from "@/components/ui/spinner";

export default function Tab1() {
	const router = useRouter();
	const { user, role, userCompany } = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredJobs, setFilteredJobs] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [recentJobs, setRecentJobs] = useState([]);
	const [timePeriod, setTimePeriod] = useState("7d"); // 7d, 1m, 6m, 1y, all
	const [chartData, setChartData] = useState([]);
	const [stats, setStats] = useState({
		totalJobs: 0,
		applications: 0,
		applied: 0,
		inProgress: 0,
		rejected: 0,
	});

	const searchJobs = async (query) => {
		if (!query || query.trim().length < 2) {
			setFilteredJobs([]);
			setSearchLoading(false);
			return;
		}
		setSearchLoading(true);
		try {
			// Recherche dans title, description, city, department, region
			const searchTerm = query.toLowerCase();
			const { data: jobs } = await getAll(
				"jobs",
				"*, companies(name, logo_url)",
				`&isArchived=eq.false&or=(title.ilike.*${searchTerm}*,description.ilike.*${searchTerm}*,city.ilike.*${searchTerm}*,department.ilike.*${searchTerm}*,region.ilike.*${searchTerm}*,category.ilike.*${searchTerm}*)`,
				1,
				3,
				"created_at.desc",
			);
			setFilteredJobs(jobs || []);
		} catch (error) {
			console.error("Erreur recherche jobs:", error);
			setFilteredJobs([]);
		} finally {
			setSearchLoading(false);
		}
	};

	const loadData = async () => {
		try {
			if (role === "pro") {
				// Calculer la date de début selon la période sélectionnée
				const now = new Date();
				let startDate = new Date();

				switch (timePeriod) {
					case "7d":
						startDate.setDate(now.getDate() - 7);
						break;
					case "1m":
						startDate.setMonth(now.getMonth() - 1);
						break;
					case "6m":
						startDate.setMonth(now.getMonth() - 6);
						break;
					case "1y":
						startDate.setFullYear(now.getFullYear() - 1);
						break;
					case "all":
						startDate = null;
						break;
				}

				const dateFilter = startDate
					? `&created_at=gte.${startDate.toISOString()}`
					: "";

				// Stats pour les pros
				const { data: jobs, totalCount: jobsCount } = await getAll(
					"jobs",
					"*",
					`&company_id=eq.${user.id}&isArchived=eq.false`,
					1,
					100,
					"created_at.desc",
				);

				const { totalCount: appsCount } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}${dateFilter}`,
					1,
					1,
					"created_at.desc",
				);

				const { totalCount: appliedCount } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}&current_status=eq.applied${dateFilter}`,
					1,
					1,
					"created_at.desc",
				);

				// En cours = selected + contract_sent + contract_signed_candidate + contract_signed_pro
				const { data: inProgressApps } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}&current_status=in.(selected,contract_sent,contract_signed_candidate,contract_signed_pro)${dateFilter}`,
					1,
					1000,
					"created_at.desc",
				);
				const inProgressCount = inProgressApps?.length || 0;

				const { totalCount: rejectedCount } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}&current_status=eq.rejected${dateFilter}`,
					1,
					1,
					"created_at.desc",
				);

				setStats({
					totalJobs: jobsCount || 0,
					applications: appsCount || 0,
					applied: appliedCount || 0,
					inProgress: inProgressCount || 0,
					rejected: rejectedCount || 0,
				});
				setRecentJobs(jobs?.slice(0, 3) || []);

				// Générer les données pour le graphique
				generateChartData(
					appliedCount || 0,
					inProgressCount || 0,
					rejectedCount || 0,
				);
			} else {
				// Offres récentes pour les candidats
				if (!user || !user.id) {
					setRecentJobs([]);
					setStats({ wishlist: 0, applications: 0 });
					return;
				}
				const { data: jobs } = await getAll(
					"jobs",
					"*, companies(name, logo_url)",
					`&isArchived=eq.false`,
					1,
					5,
					"created_at.desc",
				);
				setRecentJobs(jobs || []);

				// Stats candidat
				const { totalCount: wishlistCount } = await getAll(
					"wishlists",
					"wish_id",
					`&profile_id=eq.${user.id}`,
					1,
					1,
					"created_at.desc",
				);
				const { totalCount: appsCount } = await getAll(
					"applications",
					"id",
					`&candidate_id=eq.${user.id}`,
					1,
					1,
					"created_at.desc",
				);
				setStats({
					wishlist: wishlistCount || 0,
					applications: appsCount || 0,
				});
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			setStats({
				wishlist: 0,
				applications: 0,
				totalJobs: 0,
				applied: 0,
				inProgress: 0,
				rejected: 0,
			});
		}
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [role, timePeriod]),
	);
	// Recherche avec debounce
	useEffect(() => {
		const timer = setTimeout(() => {
			searchJobs(searchQuery);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, []);

	const generateChartData = (applied, inProgress, rejected) => {
		setChartData([
			{
				value: applied,
				label: "Postulées",
				frontColor: "#3b82f6",
				color: "#3b82f6",
			},
			{
				value: inProgress,
				label: "En cours",
				frontColor: "#f59e0b",
				color: "#f59e0b",
			},
			{
				value: rejected,
				label: "Refusées",
				frontColor: "#ef4444",
				color: "#ef4444",
			},
		]);
	};

	const ActionCard = ({ icon, title, subtitle, onPress, badge }) => (
		<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
			<Card
				style={{
					padding: 16,
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderRadius: 12,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<HStack
					style={{
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<HStack
						space='md'
						style={{ flex: 1, alignItems: "center" }}>
						<Box
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={icon}
								size='xl'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
						</Box>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								size='md'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								{title}
							</Text>
							{subtitle && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{subtitle}
								</Text>
							)}
						</VStack>
					</HStack>
					<HStack space='sm' style={{ alignItems: "center" }}>
						{badge && (
							<Badge size='md' variant='solid' action='success'>
								<BadgeText>{badge}</BadgeText>
							</Badge>
						)}
						<Icon
							as={ChevronRight}
							size='lg'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}
						/>
					</HStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);

	const StatCard = ({ icon, value, label, color = "#3b82f6", pressed }) => (
		<Card
			style={{
				flex: 1,
				width: "100%",
				minWidth: 0,
				padding: 16,
				backgroundColor: isDark ? "#374151" : "#ffffff",
				borderRadius: 12,
				borderWidth: 1,
				borderColor: isDark ? "#4b5563" : "#e5e7eb",
				opacity: pressed ? 0.6 : 1,
				transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
			}}>
			<HStack
				style={{
					alignItems: "center",
					justifyContent: "space-between",
				}}>
				<VStack space='sm'>
					<Box
						style={{
							backgroundColor: "#F7F7F7",
							width: 40,
							height: 40,
							borderRadius: 5,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Icon as={icon} size='lg' style={{ color }} />
					</Box>
					<VStack space='sm' style={{ paddingLeft: 5 }}>
						<Text
							size='2xl'
							style={{
								fontWeight: "700",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							{value}
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}>
							{label}
						</Text>
					</VStack>
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
	);

	// Version PRO
	if (role === "pro") {
		return (
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark ? "#111827" : "#f9fafb",
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				<VStack
					space='xl'
					style={{
						padding: 16,
						paddingBottom: 40,
					}}>
					{/* Header */}
					<VStack space='sm'>
						<Heading
							size='2xl'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Tableau de bord
						</Heading>
						<Text
							size='md'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}>
							Bonjour {userCompany?.name || ""}
						</Text>
					</VStack>

					{/* Time Period Filter */}
					<VStack space='md'>
						<Text
							size='lg'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Période
						</Text>
						<HStack
							space='sm'
							style={{
								flexWrap: "wrap",
							}}>
							{[
								{ value: "7d", label: "7 jours" },
								{ value: "1m", label: "1 mois" },
								{ value: "6m", label: "6 mois" },
								{ value: "1y", label: "1 an" },
								{ value: "all", label: "Tout" },
							].map((period) => (
								<TouchableOpacity
									key={period.value}
									onPress={() => setTimePeriod(period.value)}
									style={{ marginBottom: 8 }}>
									<Badge
										size='lg'
										variant='solid'
										action={
											timePeriod === period.value
												? "info"
												: "muted"
										}>
										<BadgeText>{period.label}</BadgeText>
									</Badge>
								</TouchableOpacity>
							))}
						</HStack>
					</VStack>

					{/* Stats Cards */}
					<VStack space='md'>
						<Text
							size='lg'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Statistiques
						</Text>
						<HStack space='md'>
							<Pressable
								onPress={() => router.push("/offers")}
								style={{ flex: 1 }}>
								{({ pressed }) => (
									<StatCard
										icon={Briefcase}
										value={stats.totalJobs}
										label='Offres actives'
										color='#3b82f6'
										pressed={pressed}
									/>
								)}
							</Pressable>
							<Pressable
								onPress={() => router.push("/applicationspro")}
								style={{ flex: 1 }}>
								{({ pressed }) => (
									<StatCard
										icon={Users}
										value={stats.applications}
										label='Candidatures'
										color='#10b981'
										pressed={pressed}
									/>
								)}
							</Pressable>
						</HStack>
					</VStack>

					{/* Graphique en barres */}
					{chartData.length > 0 && (
						<VStack space='md'>
							<Text
								size='lg'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Répartition des candidatures
							</Text>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<BarChart
									data={chartData}
									width={Dimensions.get("window").width - 80}
									height={220}
									barWidth={60}
									spacing={40}
									hideRules
									xAxisThickness={0}
									yAxisThickness={0}
									yAxisTextStyle={{
										color: isDark ? "#9ca3af" : "#6b7280",
										fontSize: 12,
									}}
									noOfSections={4}
									maxValue={
										Math.max(
											stats.applied,
											stats.inProgress,
											stats.rejected,
										) + 5
									}
									labelTextStyle={{
										color: isDark ? "#9ca3af" : "#6b7280",
										fontSize: 10,
										marginTop: 5,
									}}
								/>
							</Card>
						</VStack>
					)}

					{/* Graphique circulaire */}
					{chartData.length > 0 && stats.applications > 0 && (
						<VStack space='md'>
							<Text
								size='lg'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Statut des candidatures
							</Text>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
									alignItems: "center",
								}}>
								<PieChart
									data={chartData}
									donut
									radius={90}
									innerRadius={60}
									innerCircleColor={
										isDark ? "#374151" : "#ffffff"
									}
									centerLabelComponent={() => (
										<VStack
											style={{
												alignItems: "center",
											}}>
											<Text
												size='2xl'
												style={{
													fontWeight: "700",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{stats.applications}
											</Text>
											<Text
												size='xs'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Total
											</Text>
										</VStack>
									)}
								/>
								<VStack space='sm' style={{ marginTop: 20 }}>
									{chartData.map((item, index) => (
										<HStack
											key={index}
											space='sm'
											style={{
												alignItems: "center",
											}}>
											<Box
												style={{
													width: 12,
													height: 12,
													borderRadius: 6,
													backgroundColor: item.color,
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{item.label}: {item.value}
											</Text>
										</HStack>
									))}
								</VStack>
							</Card>
						</VStack>
					)}

					{/* Quick Actions */}
					{/* <VStack space='md'>
						<Text
							size='lg'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Actions rapides
						</Text>
						<ActionCard
							icon={Plus}
							title='Créer une offre'
							subtitle="Publier une nouvelle offre d'emploi"
							onPress={() => router.push("/newjob")}
						/>
						<ActionCard
							icon={ClipboardList}
							title='Mes offres'
							subtitle="Gérer vos offres d'emploi"
							badge={stats.totalJobs}
							onPress={() => router.push("/offers")}
						/>
						<ActionCard
							icon={Users}
							title='Candidatures'
							subtitle='Consulter les candidatures reçues'
						badge={stats.applied > 0 ? stats.applied : null}
							onPress={() => router.push("/applicationspro")}
						/>
						<ActionCard
							icon={Building2}
							title='Mon entreprise'
							subtitle='Gérer les informations'
							onPress={() => router.push("/dashboard")}
						/>
					</VStack> */}

					{/* Recent Jobs */}
					{recentJobs.length > 0 && (
						<VStack space='md'>
							<HStack
								style={{
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Offres récentes
								</Text>
								<TouchableOpacity
									onPress={() => router.push("/offers")}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#60a5fa"
												: "#2563eb",
											fontWeight: "500",
										}}>
										Voir tout
									</Text>
								</TouchableOpacity>
							</HStack>
							{recentJobs.map((job) => (
								<JobCard
									key={job.id}
									id={job.id}
									title={job.title}
									category={job.category}
									company_id={job.company_id}
									company_name={userCompany?.name}
									city={job.city}
									postcode={job.postcode}
									logo={userCompany?.logo_url}
									contract_type={job.contract_type}
									working_time={job.working_time}
									salary={job.salary}
									isArchived={job.isArchived}
									isLastMinute={job.isLastMinute}
								/>
							))}
						</VStack>
					)}
				</VStack>
			</ScrollView>
		);
	}

	// Version CANDIDAT
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
			keyboardVerticalOffset={100}>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark ? "#111827" : "#f9fafb",
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				<VStack
					space='xl'
					style={{
						padding: 16,
						paddingBottom: 40,
					}}>
					{/* Header with Search */}
					<VStack space='md'>
						<Heading
							size='2xl'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Trouvez votre emploi
						</Heading>
						<Text
							size='md'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}>
							Les meilleures offres dans la sécurité
						</Text>

						{/* Search Bar */}
						<VStack>
							<Input
								variant='outline'
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputField
									placeholder='Rechercher un poste, une ville...'
									value={searchQuery}
									onChangeText={setSearchQuery}
								/>
								<InputSlot className='mr-4'>
									<InputIcon as={Search} />
								</InputSlot>
							</Input>

							{/* Resultat de la recherche filtrée */}
							{searchQuery.length >= 2 && (
								<VStack
									style={{
										marginTop: 15,
										backgroundColor: isDark
											? "#1f2937"
											: "#ffffff",
										borderRadius: 12,
										padding: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#374151"
											: "#e5e7eb",
									}}>
									{filteredJobs.length > 0 ? (
										<>
											{filteredJobs.map((job) => (
												<Pressable
													key={job.id}
													onPress={() =>
														router.push(
															`/job?id=${job.id}`,
														)
													}
													style={{
														paddingVertical: 8,
														borderBottomWidth: 1,
														borderBottomColor:
															isDark
																? "#374151"
																: "#f3f4f6",
													}}>
													<HStack
														space='sm'
														style={{
															alignItems:
																"center",
														}}>
														<VStack
															style={{
																justifyContent:
																	"flex-start",
																alignItems:
																	"center",
																width: 30,
																height: "100%",
																paddingTop: 2,
															}}>
															<Avatar size='xs'>
																<AvatarFallbackText>
																	{job
																		.companies
																		?.name ||
																		"?"}
																</AvatarFallbackText>
																{job.companies
																	?.logo_url && (
																	<AvatarImage
																		source={{
																			uri: job
																				.companies
																				.logo_url,
																		}}
																	/>
																)}
															</Avatar>
														</VStack>
														<VStack
															style={{ flex: 1 }}>
															<Text
																style={{
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																	fontWeight:
																		"600",
																	fontSize: 14,
																}}>
																{job.title}
															</Text>
															<HStack
																space='xs'
																style={{
																	alignItems:
																		"center",
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
																	style={{
																		color: isDark
																			? "#9ca3af"
																			: "#6b7280",
																		fontSize: 12,
																	}}>
																	{job.city}
																	{job.department
																		? ` (${job.department})`
																		: ""}
																</Text>
															</HStack>
															<HStack space='sm'>
																{job.category && (
																	<Badge
																		size='sm'
																		variant='solid'
																		action='info'
																		style={{
																			marginVertical: 4,
																			alignSelf:
																				"flex-start",
																		}}>
																		<BadgeIcon
																			as={
																				IdCard
																			}
																			className='mr-2'
																		/>
																		<BadgeText>
																			{
																				job.category
																			}
																		</BadgeText>
																	</Badge>
																)}
																<Badge
																	size='sm'
																	variant='solid'
																	action='muted'
																	style={{
																		marginVertical: 4,
																		alignSelf:
																			"flex-start",
																	}}>
																	<BadgeIcon
																		as={
																			FileText
																		}
																		className='mr-2'
																	/>
																	<BadgeText>
																		{job.contract_type ||
																			"CDI"}
																	</BadgeText>
																</Badge>
															</HStack>
														</VStack>
														<Icon
															as={ChevronRight}
															size='sm'
															color={
																isDark
																	? "#9ca3af"
																	: "#6b7280"
															}
														/>
													</HStack>
												</Pressable>
											))}
											<Button
												onPress={() => (
													setSearchQuery(""),
													// router.push(
													// 	`/(tabs)/tab2?search=${encodeURIComponent(searchQuery)}`,
													// )
													router.push({
														pathname:
															"/tabs/(tabs)/tab2",
														params: {
															search: searchQuery,
														},
													})
												)}
												variant='link'
												style={{ marginTop: 8 }}>
												<ButtonText
													style={{
														color: "#3b82f6",
														fontSize: 13,
													}}>
													Voir tous les résultats
												</ButtonText>
												<ButtonIcon as={ChevronRight} />
											</Button>
										</>
									) : (
										<VStack
											style={{
												alignItems: "center",
												paddingVertical: 20,
											}}>
											<Icon
												as={AlertCircle}
												size='xl'
												color={
													isDark
														? "#6b7280"
														: "#9ca3af"
												}
											/>
											<Text
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													marginTop: 8,
													fontSize: 14,
													textAlign: "center",
												}}>
												Aucun résultat trouvé pour "
												{searchQuery}"
											</Text>
										</VStack>
									)}
								</VStack>
							)}
						</VStack>
					</VStack>

					{/* Stats */}
					<HStack space='md' style={{ width: "100%" }}>
						<Pressable
							onPress={() => router.push("/applications")}
							style={{ flex: 1 }}>
							{({ pressed }) => (
								<StatCard
									icon={FileText}
									value={stats.applications || 0}
									label='Candidatures'
									color='#3b82f6'
									pressed={pressed}
								/>
							)}
						</Pressable>
						<Pressable
							onPress={() => router.push("/wishlist")}
							style={{ flex: 1 }}>
							{({ pressed }) => (
								<StatCard
									icon={BookmarkCheck}
									value={stats.wishlist || 0}
									label='Favoris'
									color='#f59e0b'
									pressed={pressed}
								/>
							)}
						</Pressable>
					</HStack>

					{/* Quick Categories */}
					{/* <VStack space='md'>
					<Text
						size='lg'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Catégories populaires
					</Text>
					<HStack
						space='sm'
						style={{
							flexWrap: "wrap",
						}}>
						{[
							"APS",
							"SSIAP",
							"Agent Cynophile",
							"APR",
							"Surveillance",
							"Accueil",
						].map((cat) => (
							<TouchableOpacity
								key={cat}
								onPress={() =>
									router.push({
										pathname: "/lastminute",
										params: { category: cat },
									})
								}
								style={{ marginBottom: 8 }}>
								<Badge
									size='lg'
									variant='outline'
									action='info'>
									<BadgeIcon as={Briefcase} />
									<BadgeText>{cat}</BadgeText>
								</Badge>
							</TouchableOpacity>
						))}
					</HStack>
				</VStack> */}

					{/* Recent Jobs */}
					{recentJobs.length > 0 && (
						<VStack space='md'>
							<HStack
								style={{
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Offres récentes
								</Text>
								<TouchableOpacity
									onPress={() =>
										router.push("/tabs/(tabs)/tab2")
									}>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#60a5fa"
												: "#2563eb",
											fontWeight: "500",
										}}>
										Voir tout
									</Text>
								</TouchableOpacity>
							</HStack>
							{recentJobs.map((job) => (
								<JobCard
									key={job.id}
									id={job.id}
									title={job.title}
									category={job.category}
									company_id={job.company_id}
									company_name={job.companies?.name}
									city={job.city}
									postcode={job.postcode}
									logo={job.companies?.logo_url}
									contract_type={job.contract_type}
									working_time={job.working_time}
									salary={job.salary}
									isArchived={job.isArchived}
									isLastMinute={job.isLastMinute}
								/>
							))}
						</VStack>
					)}
				</VStack>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
