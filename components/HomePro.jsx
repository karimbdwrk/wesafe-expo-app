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

const HomePro = () => {
	const router = useRouter();
	const { isDark } = useTheme();
	const { user } = useAuth();
	const { getAll } = useDataContext();

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

			const [{ data: jobs }, { data: apps }, { data: toProcess }] = await Promise.all([
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
						backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
						borderRadius: 14,
						borderWidth: 1,
						borderColor: isDark ? "#1d4ed8" : "#bfdbfe",
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
							backgroundColor: "#2563eb",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Plus size={22} color='#ffffff' />
					</Box>
					<VStack style={{ flex: 1 }} space='xs'>
						<Text
							style={{
								fontWeight: "700",
								fontSize: 15,
								color: isDark ? "#93c5fd" : "#1d4ed8",
							}}>
							Créer une nouvelle annonce
						</Text>
						<Text
							size='xs'
							style={{
								color: isDark ? "#60a5fa" : "#3b82f6",
							}}>
							Publiez une offre classique ou Last Minute
						</Text>
					</VStack>
					<ChevronRight
						size={18}
						color={isDark ? "#3b82f6" : "#2563eb"}
					/>
				</Box>
			</TouchableOpacity>

			{/* Récap missions du jour */}
			<Box
				style={{
					backgroundColor: isDark ? "#1f2937" : "#ffffff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: isDark ? "#374151" : "#e5e7eb",
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
						borderBottomColor: isDark ? "#374151" : "#f3f4f6",
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 32,
								height: 32,
								borderRadius: 9,
								backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Calendar size={16} color='#2563eb' />
						</Box>
						<VStack space='xs'>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 14,
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Missions du jour
							</Text>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
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
										? "#451a03"
										: "#fff7ed",
									borderRadius: 8,
									paddingHorizontal: 8,
									paddingVertical: 3,
								}}>
								<Text
									size='xs'
									style={{
										fontWeight: "700",
										color: "#ea580c",
									}}>
									{pendingCount} à pourvoir
								</Text>
							</Box>
						)}
						{filledCount > 0 && (
							<Box
								style={{
									backgroundColor: isDark
										? "#052e16"
										: "#f0fdf4",
									borderRadius: 8,
									paddingHorizontal: 8,
									paddingVertical: 3,
								}}>
								<Text
									size='xs'
									style={{
										fontWeight: "700",
										color: "#16a34a",
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
							color={isDark ? "#4b5563" : "#d1d5db"}
						/>
						<Text
							size='sm'
							style={{
								color: isDark ? "#6b7280" : "#9ca3af",
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
											? "#374151"
											: "#f3f4f6",
									}}>
									{/* Icône statut */}
									<Box
										style={{
											width: 30,
											height: 30,
											borderRadius: 8,
											backgroundColor: filled
												? isDark
													? "#052e16"
													: "#f0fdf4"
												: isDark
													? "#451a03"
													: "#fff7ed",
											justifyContent: "center",
											alignItems: "center",
										}}>
										{filled ? (
											<CheckCircle
												size={15}
												color='#16a34a'
											/>
										) : (
											<Briefcase
												size={15}
												color='#ea580c'
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
													? "#f3f4f6"
													: "#111827",
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
																? "#6b7280"
																: "#9ca3af"
														}
													/>
													<Text
														size='xs'
														style={{
															color: isDark
																? "#6b7280"
																: "#9ca3af",
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
													? "#9ca3af"
													: "#6b7280",
											}}>
											{appCount} cand.
										</Text>
										<ChevronRight
											size={14}
											color={
												isDark ? "#4b5563" : "#d1d5db"
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
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
							borderRadius: 14,
							borderWidth: 1,
							borderColor: isDark ? "#374151" : "#e5e7eb",
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
										? "#2e1065"
										: "#f5f3ff",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Users size={16} color='#7c3aed' />
							</Box>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 18,
									color: isDark ? "#f3f4f6" : "#111827",
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
									<Clock size={14} color='#7c3aed' />
									<Text
										size='sm'
										style={{
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										<Text
											style={{ fontWeight: "700" }}>
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
									<CheckCircle size={14} color='#2563eb' />
									<Text
										size='sm'
										style={{
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										<Text
											style={{ fontWeight: "700" }}>
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
										color={isDark ? "#4b5563" : "#d1d5db"}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#6b7280"
												: "#9ca3af",
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
									? "#2e1065"
									: "#f5f3ff",
								borderRadius: 10,
								paddingVertical: 11,
								alignItems: "center",
								borderWidth: 1,
								borderColor: isDark ? "#5b21b6" : "#ddd6fe",
								flexDirection: "row",
								justifyContent: "center",
								gap: 6,
							}}>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 14,
									color: "#7c3aed",
								}}>
								Voir candidatures
							</Text>
							<ChevronRight size={16} color='#7c3aed' />
						</TouchableOpacity>
					</Box>
				);
			})()}

			<HomeChartsProMini />
		</Box>
	);
};

export default HomePro;
