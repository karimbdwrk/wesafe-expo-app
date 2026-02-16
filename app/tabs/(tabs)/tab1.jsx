import React, { useState, useCallback, useEffect } from "react";
import {
	ScrollView,
	RefreshControl,
	TouchableOpacity,
	TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
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
} from "lucide-react-native";

import JobCard from "@/components/JobCard";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

export default function Tab1() {
	const router = useRouter();
	const { user, role, userCompany } = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [recentJobs, setRecentJobs] = useState([]);
	const [stats, setStats] = useState({
		totalJobs: 0,
		applications: 0,
		pending: 0,
	});

	const loadData = async () => {
		try {
			if (role === "pro") {
				// Stats pour les pros
				const { data: jobs, totalCount: jobsCount } = await getAll(
					"jobs",
					"*",
					`&company_id=eq.${user.id}&isArchived=eq.false`,
					1,
					100,
				);
				const { totalCount: appsCount } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}`,
					1,
					1,
				);
				const { totalCount: pendingCount } = await getAll(
					"applications",
					"*",
					`&company_id=eq.${user.id}&status=eq.pending`,
					1,
					1,
				);
				setStats({
					totalJobs: jobsCount || 0,
					applications: appsCount || 0,
					pending: pendingCount || 0,
				});
				setRecentJobs(jobs?.slice(0, 3) || []);
			} else {
				// Offres récentes pour les candidats
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
				pending: 0,
			});
		}
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [role]),
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, []);

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

	const StatCard = ({ icon, value, label, color = "#3b82f6" }) => (
		<Card
			style={{
				flex: 1,
				padding: 16,
				backgroundColor: isDark ? "#374151" : "#ffffff",
				borderRadius: 12,
				borderWidth: 1,
				borderColor: isDark ? "#4b5563" : "#e5e7eb",
			}}>
			<VStack space='sm'>
				<Icon as={icon} size='lg' style={{ color }} />
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

					{/* Stats Cards */}
					<VStack space='md'>
						<Text
							size='lg'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Vue d'ensemble
						</Text>
						<HStack space='md'>
							<StatCard
								icon={Briefcase}
								value={stats.totalJobs}
								label='Offres actives'
								color='#3b82f6'
							/>
							<StatCard
								icon={Users}
								value={stats.applications}
								label='Candidatures'
								color='#10b981'
							/>
						</HStack>
						<StatCard
							icon={Clock}
							value={stats.pending}
							label='En attente de validation'
							color='#f59e0b'
						/>
					</VStack>

					{/* Quick Actions */}
					<VStack space='md'>
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
							badge={stats.pending > 0 ? stats.pending : null}
							onPress={() => router.push("/applicationspro")}
						/>
						<ActionCard
							icon={Building2}
							title='Mon entreprise'
							subtitle='Gérer les informations'
							onPress={() => router.push("/dashboard")}
						/>
					</VStack>

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
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f9fafb",
			}}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
					<TouchableOpacity
						onPress={() => router.push("/lastminute")}
						activeOpacity={0.8}>
						<Input
							variant='outline'
							size='lg'
							isReadOnly
							pointerEvents='none'
							style={{
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderColor: isDark ? "#4b5563" : "#d1d5db",
							}}>
							<InputSlot pl='$3'>
								<InputIcon as={Search} />
							</InputSlot>
							<InputField
								placeholder='Rechercher un poste, une ville...'
								editable={false}
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}
							/>
						</Input>
					</TouchableOpacity>
				</VStack>

				{/* Stats */}
				<HStack space='md'>
					<StatCard
						icon={Bookmark}
						value={stats.wishlist || 0}
						label='Favoris'
						color='#f59e0b'
					/>
					<StatCard
						icon={FileText}
						value={stats.applications || 0}
						label='Candidatures'
						color='#3b82f6'
					/>
				</HStack>

				{/* Quick Categories */}
				<VStack space='md'>
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
				</VStack>

				{/* Quick Access */}
				<VStack space='md'>
					<Text
						size='lg'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Accès rapide
					</Text>
					<ActionCard
						icon={Timer}
						title='Offres dernière minute'
						subtitle='Missions urgentes disponibles'
						onPress={() => router.push("/lastminute")}
					/>
					<ActionCard
						icon={Bookmark}
						title='Mes favoris'
						subtitle='Offres sauvegardées'
						badge={stats.wishlist > 0 ? stats.wishlist : null}
						onPress={() => router.push("/wishlist")}
					/>
					<ActionCard
						icon={FileText}
						title='Mes candidatures'
						subtitle='Suivre vos candidatures'
						badge={
							stats.applications > 0 ? stats.applications : null
						}
						onPress={() => router.push("/applications")}
					/>
					<ActionCard
						icon={BadgeCheck}
						title='Mon profil'
						subtitle='Compléter votre CV'
						onPress={() => router.push("/account")}
					/>
				</VStack>

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
								onPress={() => router.push("/lastminute")}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
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
	);
}
