import { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
	ChevronRight,
	Plus,
	Calendar,
	MapPin,
	Briefcase,
	CheckCircle,
	AlertCircle,
	Users,
	Clock,
	Zap,
} from "lucide-react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import HomeChartsProMini from "./HomeChartsProMini";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const HomePro = () => {
	const router = useRouter();
	const { isDark } = useTheme();
	const { user, userCompany } = useAuth();
	const { getAll } = useDataContext();

	const lmCredits = userCompany?.last_minute_credits ?? null;

	const [todayJobs, setTodayJobs] = useState([]);
	const [todayApps, setTodayApps] = useState({});
	const [pendingApps, setPendingApps] = useState([]);

	useEffect(() => {
		if (!user?.id) return;
		fetchTodayMissions();
	}, [user?.id]);

	const fetchTodayMissions = async () => {
		try {
			const todayStr = new Date().toISOString().slice(0, 10);
			const tomorrowStr = new Date(Date.now() + 86400000)
				.toISOString()
				.slice(0, 10);

			const [{ data: jobs }, { data: apps }, { data: toProcess }] =
				await Promise.all([
					getAll(
						"jobs",
						"id,title,category,city,postcode,isLastMinute,start_date",
						`&company_id=eq.${user.id}&is_archived=eq.false&start_date=gte.${todayStr}&start_date=lt.${tomorrowStr}`,
						1,
						50,
						"start_date.asc",
					),
					getAll(
						"applications",
						"job_id,current_status",
						`&company_id=eq.${user.id}`,
						1,
						1000,
						"created_at.desc",
					),
					getAll(
						"applications",
						"id,job_id,current_status,created_at,profiles(firstname,lastname,avatar_url),jobs(title,isLastMinute)",
						`&company_id=eq.${user.id}&current_status=in.(applied,selected)`,
						1,
						50,
						"created_at.desc",
					),
				]);

			const safeJobs = jobs ?? [];
			const safeApps = apps ?? [];

			// Compter les candidatures par job + savoir si pourvu
			const appMap = {};
			safeApps.forEach((a) => {
				if (!appMap[a.job_id])
					appMap[a.job_id] = { count: 0, filled: false };
				appMap[a.job_id].count++;
				if (a.current_status === "contract_signed_pro")
					appMap[a.job_id].filled = true;
			});

			setTodayJobs(safeJobs);
			setTodayApps(appMap);
			setPendingApps(toProcess ?? []);
		} catch (e) {
			console.error("HomePro fetchTodayMissions:", e?.message);
		}
	};

	const filledCount = todayJobs.filter((j) => todayApps[j.id]?.filled).length;
	const pendingCount = todayJobs.length - filledCount;

	return (
		<Box>
			{/* CTA nouvelle annonce */}
			<TouchableOpacity
				onPress={() => router.push("/postjob")}
				activeOpacity={0.75}
				className='mb-4'>
				<Box
					style={{
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 14,
						borderWidth: 1,
						borderColor: isDark
							? Colors.dark.border
							: Colors.light.border,
						padding: 16,
						flexDirection: "row",
						alignItems: "center",
						gap: 14,
					}}>
					<Box
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.background,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Plus
							size={22}
							color={
								isDark ? Colors.dark.tint : Colors.light.tint
							}
						/>
					</Box>
					<VStack style={{ flex: 1 }} space='xs'>
						<Text
							style={{
								fontWeight: "700",
								fontSize: 15,
								color: isDark
									? Colors.dark.text
									: Colors.light.text,
							}}>
							Créer une nouvelle annonce
						</Text>
						<Text
							size='xs'
							style={{
								color: isDark
									? Colors.dark.muted
									: Colors.light.muted,
							}}>
							Publiez une offre classique ou Last Minute
						</Text>
					</VStack>
					<ChevronRight
						size={18}
						color={isDark ? Colors.dark.muted : Colors.light.muted}
					/>
				</Box>
			</TouchableOpacity>

			{/* Récap missions du jour */}
			<Box
				style={{
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.cardBackground,
					borderRadius: 14,
					borderWidth: 1,
					borderColor: isDark
						? Colors.dark.border
						: Colors.light.border,
					marginBottom: 16,
					overflow: "hidden",
				}}>
				{/* Header */}
				<HStack
					style={{
						padding: 14,
						alignItems: "center",
						justifyContent: "space-between",
						borderBottomWidth: todayJobs.length > 0 ? 1 : 0,
						borderBottomColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.background,
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 32,
								height: 32,
								borderRadius: 9,
								backgroundColor: isDark
									? Colors.dark.background
									: Colors.light.background,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Calendar
								size={16}
								color={
									isDark
										? Colors.dark.tint
										: Colors.light.tint
								}
							/>
						</Box>
						<VStack space='xs'>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 14,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Missions du jour
							</Text>
							<Text
								size='xs'
								style={{
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
								}}>
								{new Date().toLocaleDateString("fr-FR", {
									weekday: "long",
									day: "numeric",
									month: "long",
								})}
							</Text>
						</VStack>
					</HStack>
					{/* Compteurs */}
					<HStack space='xs'>
						{pendingCount > 0 && (
							<Box
								style={{
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.background,
									borderRadius: 8,
									paddingHorizontal: 8,
									paddingVertical: 3,
								}}>
								<Text
									size='xs'
									style={{
										fontWeight: "700",
										color: isDark
											? Colors.dark.warning
											: Colors.light.warning,
									}}>
									{pendingCount} à pourvoir
								</Text>
							</Box>
						)}
						{filledCount > 0 && (
							<Box
								style={{
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.background,
									borderRadius: 8,
									paddingHorizontal: 8,
									paddingVertical: 3,
								}}>
								<Text
									size='xs'
									style={{
										fontWeight: "700",
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
									}}>
									{filledCount} pourvue
									{filledCount > 1 ? "s" : ""}
								</Text>
							</Box>
						)}
					</HStack>
				</HStack>

				{/* Liste missions */}
				{todayJobs.length === 0 ? (
					<HStack
						space='sm'
						style={{
							padding: 16,
							alignItems: "center",
						}}>
						<AlertCircle
							size={16}
							color={
								isDark
									? Colors.dark.border
									: Colors.light.border
							}
						/>
						<Text
							size='sm'
							style={{
								color: isDark
									? Colors.dark.muted
									: Colors.light.muted,
							}}>
							Aucune mission programmée aujourd'hui
						</Text>
					</HStack>
				) : (
					todayJobs.map((job, idx) => {
						const info = todayApps[job.id];
						const filled = info?.filled ?? false;
						const appCount = info?.count ?? 0;
						return (
							<TouchableOpacity
								key={job.id}
								onPress={() => router.push(`/job?id=${job.id}`)}
								activeOpacity={0.7}>
								<HStack
									space='sm'
									style={{
										paddingHorizontal: 14,
										paddingVertical: 12,
										alignItems: "center",
										borderTopWidth: idx > 0 ? 1 : 0,
										borderTopColor: isDark
											? Colors.dark.cardBackground
											: Colors.light.background,
									}}>
									{/* Icône statut */}
									<Box
										style={{
											width: 30,
											height: 30,
											borderRadius: 8,
											backgroundColor: isDark
												? Colors.dark.background
												: Colors.light.background,
											justifyContent: "center",
											alignItems: "center",
										}}>
										{filled ? (
											<CheckCircle
												size={15}
												color={
													isDark
														? Colors.dark.success
														: Colors.light.success
												}
											/>
										) : (
											<Briefcase
												size={15}
												color={
													isDark
														? Colors.dark.warning
														: Colors.light.warning
												}
											/>
										)}
									</Box>
									{/* Infos */}
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}
											numberOfLines={1}>
											{job.title}
										</Text>
										<HStack
											space='xs'
											style={{ alignItems: "center" }}>
											{job.city && (
												<>
													<MapPin
														size={11}
														color={
															isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted
														}
													/>
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														{job.city}
														{job.postcode
															? ` (${job.postcode.slice(0, 2)})`
															: ""}
													</Text>
												</>
											)}
											{job.isLastMinute && (
												<Badge
													size='sm'
													variant='solid'
													action='warning'
													style={{ marginLeft: 4 }}>
													<BadgeText>LM</BadgeText>
												</Badge>
											)}
										</HStack>
									</VStack>
									{/* Nb candidatures */}
									<VStack
										style={{ alignItems: "flex-end" }}
										space='xs'>
										<Text
											size='xs'
											style={{
												fontWeight: "700",
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											{appCount} cand.
										</Text>
										<ChevronRight
											size={14}
											color={
												isDark
													? Colors.dark.border
													: Colors.light.border
											}
										/>
									</VStack>
								</HStack>
							</TouchableOpacity>
						);
					})
				)}
			</Box>

			{/* Candidatures à traiter */}
			{(() => {
				const appliedCount = pendingApps.filter(
					(a) => a.current_status === "applied",
				).length;
				const selectedCount = pendingApps.filter(
					(a) => a.current_status === "selected",
				).length;
				return (
					<Box
						style={{
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.cardBackground,
							borderRadius: 14,
							borderWidth: 1,
							borderColor: isDark
								? Colors.dark.border
								: Colors.light.border,
							marginBottom: 16,
							padding: 16,
						}}>
						<HStack
							space='sm'
							style={{
								alignItems: "center",
								marginBottom: 12,
							}}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 9,
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.background,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Users
									size={16}
									color={
										isDark
											? Colors.dark.tint
											: Colors.light.tint
									}
								/>
							</Box>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 18,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								{pendingApps.length} candidature
								{pendingApps.length !== 1 ? "s" : ""} à traiter
							</Text>
						</HStack>

						<VStack space='xs' style={{ marginBottom: 16 }}>
							{appliedCount > 0 && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Clock
										size={14}
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
												: Colors.light.muted,
										}}>
										<Text style={{ fontWeight: "700" }}>
											{appliedCount}
										</Text>{" "}
										nouvelle
										{appliedCount !== 1 ? "s" : ""}
									</Text>
								</HStack>
							)}
							{selectedCount > 0 && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<CheckCircle
										size={14}
										color={
											isDark
												? Colors.dark.tint
												: Colors.light.tint
										}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
										}}>
										<Text style={{ fontWeight: "700" }}>
											{selectedCount}
										</Text>{" "}
										en attente de réponse
									</Text>
								</HStack>
							)}
							{pendingApps.length === 0 && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<AlertCircle
										size={14}
										color={
											isDark
												? Colors.dark.border
												: Colors.light.border
										}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
										}}>
										Aucune candidature en attente
									</Text>
								</HStack>
							)}
						</VStack>

						<TouchableOpacity
							onPress={() => router.push("/applicationspro")}
							activeOpacity={0.75}
							style={{
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 10,
								paddingVertical: 11,
								alignItems: "center",
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
								flexDirection: "row",
								justifyContent: "center",
								gap: 6,
							}}>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 14,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Voir candidatures
							</Text>
							<ChevronRight
								size={16}
								color={
									isDark
										? Colors.dark.muted
										: Colors.light.muted
								}
							/>
						</TouchableOpacity>
					</Box>
				);
			})()}

			{/* Crédits Last Minute */}
			<Box
				style={{
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.cardBackground,
					borderRadius: 14,
					borderWidth: 1,
					borderColor: isDark
						? Colors.dark.border
						: Colors.light.border,
					marginBottom: 16,
					padding: 16,
				}}>
				<HStack
					space='sm'
					style={{
						alignItems: "center",
						marginBottom: 10,
					}}>
					<Box
						style={{
							width: 32,
							height: 32,
							borderRadius: 9,
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.background,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Calendar
							size={16}
							color={
								isDark ? Colors.dark.tint : Colors.light.tint
							}
						/>
					</Box>
					<Text
						style={{
							fontWeight: "700",
							fontSize: 15,
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
						}}>
						Crédits last minute
					</Text>
				</HStack>

				<Text
					style={{
						fontSize: 28,
						fontWeight: "800",
						color: isDark
							? Colors.dark.warning
							: Colors.light.warning,
						marginBottom: 14,
						lineHeight: 32,
					}}>
					{lmCredits === null ? "—" : lmCredits}{" "}
					<Text
						style={{
							fontSize: 14,
							fontWeight: "500",
							color: isDark
								? Colors.dark.muted
								: Colors.light.muted,
						}}>
						crédit{lmCredits !== 1 ? "s" : ""} restant
						{lmCredits !== 1 ? "s" : ""}
					</Text>
				</Text>

				<TouchableOpacity
					onPress={() => router.push("/buycredits")}
					activeOpacity={0.75}
					style={{
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 10,
						paddingVertical: 11,
						alignItems: "center",
						borderWidth: 1,
						borderColor: isDark
							? Colors.dark.border
							: Colors.light.border,
						flexDirection: "row",
						justifyContent: "center",
						gap: 6,
					}}>
					<Zap
						size={15}
						color={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
					/>
					<Text
						style={{
							fontWeight: "700",
							fontSize: 14,
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
						}}>
						Acheter
					</Text>
				</TouchableOpacity>
			</Box>

			<HomeChartsProMini />
		</Box>
	);
};

export default HomePro;
