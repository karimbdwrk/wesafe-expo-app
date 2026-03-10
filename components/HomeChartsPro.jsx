import React, { useEffect, useState, useMemo } from "react";
import {
	ActivityIndicator,
	Dimensions,
	TouchableOpacity,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { LineChart, BarChart } from "react-native-gifted-charts";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";

import {
	Briefcase,
	Users,
	CheckCircle,
	Clock,
	UserCheck,
	TrendingUp,
	Zap,
	Timer,
	Target,
	ChevronRight,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY } from "@/constants/categories";

// Palette de couleurs pour les catégories
const CAT_COLORS = [
	"#2563eb",
	"#7c3aed",
	"#059669",
	"#d97706",
	"#dc2626",
	"#0891b2",
	"#9333ea",
	"#65a30d",
];

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIODS = [
	{ key: "1W", label: "1 sem." },
	{ key: "1M", label: "1 mois" },
	{ key: "6M", label: "6 mois" },
	{ key: "1Y", label: "1 an" },
];

const MONTH_LABELS = [
	"Jan",
	"Fév",
	"Mar",
	"Avr",
	"Mai",
	"Jun",
	"Jul",
	"Aoû",
	"Sep",
	"Oct",
	"Nov",
	"Déc",
];
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Génère les buckets selon la période choisie
const buildBuckets = (period) => {
	const now = new Date();
	const buckets = [];

	if (period === "1W") {
		// 7 derniers jours, libellé = jour semaine
		for (let i = 6; i >= 0; i--) {
			const d = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - i,
			);
			buckets.push({
				label: DAY_LABELS[d.getDay()],
				test: (date) =>
					date.getFullYear() === d.getFullYear() &&
					date.getMonth() === d.getMonth() &&
					date.getDate() === d.getDate(),
			});
		}
	} else if (period === "1M") {
		// 4 semaines, libellé = "S1"...
		for (let i = 3; i >= 0; i--) {
			const end = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - i * 7,
			);
			const start = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - (i + 1) * 7 + 1,
			);
			buckets.push({
				label: `S${4 - i}`,
				test: (date) => date >= start && date <= end,
			});
		}
	} else if (period === "6M") {
		// 6 derniers mois
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			buckets.push({
				label: MONTH_LABELS[d.getMonth()],
				test: (date) =>
					date.getFullYear() === d.getFullYear() &&
					date.getMonth() === d.getMonth(),
			});
		}
	} else {
		// 1Y → 12 derniers mois
		for (let i = 11; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			buckets.push({
				label: MONTH_LABELS[d.getMonth()],
				test: (date) =>
					date.getFullYear() === d.getFullYear() &&
					date.getMonth() === d.getMonth(),
			});
		}
	}
	return buckets;
};

const KpiCard = ({
	icon: Icon,
	iconColor,
	iconBg,
	label,
	value,
	sub,
	isDark,
	onPress,
}) => {
	const inner = (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#ffffff",
				borderRadius: 16,
				borderWidth: 1,
				borderColor: isDark ? "#374151" : "#e5e7eb",
				padding: 16,
				minWidth: "47%",
			}}>
			<HStack
				space='sm'
				style={{ alignItems: "center", marginBottom: 10 }}>
				<Box
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						backgroundColor: iconBg,
						justifyContent: "center",
						alignItems: "center",
					}}>
					<Icon size={18} color={iconColor} />
				</Box>
				<Text
					size='xs'
					style={{
						color: isDark ? "#9ca3af" : "#6b7280",
						fontWeight: "600",
						flex: 1,
						lineHeight: 16,
					}}>
					{label}
				</Text>
				{onPress ? (
					<ChevronRight
						size={14}
						color={isDark ? "#4b5563" : "#d1d5db"}
					/>
				) : null}
			</HStack>
			<Text
				style={{
					fontSize: 28,
					fontWeight: "800",
					color: isDark ? "#f3f4f6" : "#111827",
					lineHeight: 34,
				}}>
				{value}
			</Text>
			{sub ? (
				<Text
					size='xs'
					style={{
						color: isDark ? "#6b7280" : "#9ca3af",
						marginTop: 2,
					}}>
					{sub}
				</Text>
			) : null}
		</Box>
	);
	if (onPress) {
		return (
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={0.75}
				style={{ flex: 1 }}>
				{inner}
			</TouchableOpacity>
		);
	}
	return inner;
};

const HomeChartsPro = () => {
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [kpis, setKpis] = useState({
		jobsTotal: 0,
		applicationsTotal: 0,
		fillRate: 0,
		avgMs: null,
	});
	const [lmKpis, setLmKpis] = useState({
		total: 0,
		active: 0,
		apps: 0,
		fillRate: 0,
		avgMs: null,
		uniqueAgents: 0,
		avgAppsPerJob: 0,
	});
	const [allJobs, setAllJobs] = useState([]);
	const [allApplications, setAllApplications] = useState([]);
	const [topAgents, setTopAgents] = useState([]);
	const [period, setPeriod] = useState("6M");
	const [catPeriod, setCatPeriod] = useState("6M");
	const [lmPeriod, setLmPeriod] = useState("6M");
	const [lmCatPeriod, setLmCatPeriod] = useState("6M");

	const lineData = useMemo(() => {
		const buckets = buildBuckets(period);
		return buckets.map(({ label, test }) => {
			const count = allJobs.filter((j) =>
				test(new Date(j.created_at)),
			).length;
			return { value: count, label };
		});
	}, [allJobs, period]);

	const lineData2 = useMemo(() => {
		const buckets = buildBuckets(period);
		return buckets.map(({ label, test }) => {
			const count = allApplications.filter((a) =>
				test(new Date(a.created_at)),
			).length;
			return { value: count, label };
		});
	}, [allApplications, period]);

	const catChartData = useMemo(() => {
		const buckets = buildBuckets(catPeriod);
		const periodJobs = allJobs.filter((j) =>
			buckets.some((b) => b.test(new Date(j.created_at))),
		);
		const periodApps = allApplications.filter((a) =>
			buckets.some((b) => b.test(new Date(a.created_at))),
		);
		const total = periodJobs.length || 1;

		// map job_id → category
		const jobCatMap = {};
		allJobs.forEach((j) => {
			jobCatMap[j.id] = j.category;
		});

		// count candidatures par catégorie
		const appCounts = {};
		periodApps.forEach((a) => {
			const cat = jobCatMap[a.job_id];
			if (cat) appCounts[cat] = (appCounts[cat] || 0) + 1;
		});

		const sorted = CATEGORY.map((cat, i) => ({
			cat,
			count: periodJobs.filter((j) => j.category === cat.id).length,
			i,
		}))
			.filter(({ count }) => count > 0)
			.sort((a, b) => b.count - a.count);

		const barData = sorted.map(({ cat, count, i }) => ({
			value: count,
			label: cat.acronym,
			frontColor: CAT_COLORS[i % CAT_COLORS.length],
			pct: Math.round((count / total) * 100),
		}));

		const lineData = sorted.map(({ cat }) => ({
			value: appCounts[cat.id] || 0,
		}));

		return { barData, lineData };
	}, [allJobs, allApplications, catPeriod]);

	// ── Last Minute charts ──────────────────────────────────────────
	const lmJobs = useMemo(
		() => allJobs.filter((j) => j.isLastMinute),
		[allJobs],
	);

	const lmLineData = useMemo(() => {
		const buckets = buildBuckets(lmPeriod);
		return buckets.map(({ label, test }) => ({
			value: lmJobs.filter((j) => test(new Date(j.created_at))).length,
			label,
		}));
	}, [lmJobs, lmPeriod]);

	const lmLineData2 = useMemo(() => {
		const buckets = buildBuckets(lmPeriod);
		const lmJobIds = new Set(lmJobs.map((j) => j.id));
		return buckets.map(({ label, test }) => ({
			value: allApplications.filter(
				(a) => lmJobIds.has(a.job_id) && test(new Date(a.created_at)),
			).length,
			label,
		}));
	}, [lmJobs, allApplications, lmPeriod]);

	const lmCatChartData = useMemo(() => {
		const buckets = buildBuckets(lmCatPeriod);
		const periodJobs = lmJobs.filter((j) =>
			buckets.some((b) => b.test(new Date(j.created_at))),
		);
		const lmJobIds = new Set(lmJobs.map((j) => j.id));
		const periodApps = allApplications.filter(
			(a) =>
				lmJobIds.has(a.job_id) &&
				buckets.some((b) => b.test(new Date(a.created_at))),
		);
		const total = periodJobs.length || 1;

		const jobCatMap = {};
		lmJobs.forEach((j) => {
			jobCatMap[j.id] = j.category;
		});

		const appCounts = {};
		periodApps.forEach((a) => {
			const cat = jobCatMap[a.job_id];
			if (cat) appCounts[cat] = (appCounts[cat] || 0) + 1;
		});

		const sorted = CATEGORY.map((cat, i) => ({
			cat,
			count: periodJobs.filter((j) => j.category === cat.id).length,
			i,
		}))
			.filter(({ count }) => count > 0)
			.sort((a, b) => b.count - a.count);

		const barData = sorted.map(({ cat, count, i }) => ({
			value: count,
			label: cat.acronym,
			frontColor: CAT_COLORS[i % CAT_COLORS.length],
			pct: Math.round((count / total) * 100),
		}));

		const lineData = sorted.map(({ cat }) => ({
			value: appCounts[cat.id] || 0,
		}));

		return { barData, lineData };
	}, [lmJobs, allApplications, lmCatPeriod]);

	useEffect(() => {
		if (!user?.id || !accessToken) return;
		fetchStats();
	}, [user?.id, accessToken]);

	const fetchStats = async () => {
		setLoading(true);
		try {
			const headers = {
				apikey: SUPABASE_API_KEY,
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			};
			const base = `${SUPABASE_URL}/rest/v1`;

			// Récupère TOUS les jobs (archivés ou non) pour avoir l'historique complet du chart
			const [jobsRes, appsRes, filledAppsRes] = await Promise.all([
				axios.get(
					`${base}/jobs?company_id=eq.${user.id}&select=id,created_at,category,is_archived,isLastMinute,start_date`,
					{ headers },
				),
				axios.get(
					`${base}/applications?company_id=eq.${user.id}&select=id,job_id,current_status,created_at,updated_at`,
					{ headers: { ...headers, Prefer: "count=exact" } },
				),
				axios.get(
					`${base}/applications?company_id=eq.${user.id}&current_status=eq.contract_signed_pro&select=id,job_id,candidate_id,created_at,updated_at`,
					{ headers },
				),
			]);

			const jobs = jobsRes.data ?? [];
			const applications = appsRes.data ?? [];
			const filledApps = filledAppsRes.data ?? [];

			// KPI : jobs actifs uniquement (hors Last Minute)
			const activeJobs = jobs.filter((j) => !j.is_archived);
			const nonLmJobs = activeJobs.filter((j) => !j.isLastMinute);
			const nonLmJobIds = new Set(nonLmJobs.map((j) => j.id));
			const jobsTotal = nonLmJobs.length;
			const applicationsTotal = applications.filter((a) =>
				nonLmJobIds.has(a.job_id),
			).length;

			const filledJobIds = new Set(
				(
					await axios.get(
						`${base}/applications?company_id=eq.${user.id}&current_status=eq.contract_signed_pro&select=job_id`,
						{ headers },
					)
				).data.map((a) => a.job_id),
			);
			const fillRate =
				jobsTotal > 0
					? Math.round((filledJobIds.size / jobsTotal) * 100)
					: 0;

			let avgMs = null;
			if (filledApps.length > 0) {
				const totalMs = filledApps.reduce((acc, a) => {
					const diff =
						new Date(a.updated_at) - new Date(a.created_at);
					return acc + (diff > 0 ? diff : 0);
				}, 0);
				avgMs = Math.round(totalMs / filledApps.length);
			}

			const uniqueAgents = new Set(filledApps.map((a) => a.candidate_id))
				.size;
			const avgAppsPerJob =
				jobsTotal > 0
					? Math.round((applicationsTotal / jobsTotal) * 10) / 10
					: 0;

			// Stats Last Minute
			const lmJobs = jobs.filter((j) => !j.is_archived && j.isLastMinute);

			// Missions réellement actives : < 7j ET start_date null ou <= aujourd'hui
			const now = new Date();
			const limit7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const todayStart = new Date(now);
			todayStart.setHours(0, 0, 0, 0);
			todayStart.setDate(todayStart.getDate() - 1);
			const lmActive = lmJobs.filter((j) => {
				if (new Date(j.created_at) < limit7d) return false;
				if (j.start_date) {
					const sd = new Date(j.start_date);
					sd.setHours(0, 0, 0, 0);
					if (sd < todayStart) return false;
				}
				return true;
			}).length;
			const lmJobIds = new Set(lmJobs.map((j) => j.id));
			const lmAppsTotal = applications.filter((a) =>
				lmJobIds.has(a.job_id),
			).length;
			const lmFilledIds = new Set(
				filledApps
					.filter((a) => lmJobIds.has(a.job_id))
					.map((a) => a.job_id),
			);
			const lmFillRate =
				lmJobs.length > 0
					? Math.round((lmFilledIds.size / lmJobs.length) * 100)
					: 0;
			const lmFilledApps = filledApps.filter((a) =>
				lmJobIds.has(a.job_id),
			);
			let lmAvgMs = null;
			if (lmFilledApps.length > 0) {
				const totalMs = lmFilledApps.reduce((acc, a) => {
					const diff =
						new Date(a.updated_at) - new Date(a.created_at);
					return acc + (diff > 0 ? diff : 0);
				}, 0);
				lmAvgMs = Math.round(totalMs / lmFilledApps.length);
			}

			setKpis({
				jobsTotal,
				applicationsTotal,
				fillRate,
				avgMs,
				uniqueAgents,
				avgAppsPerJob,
			});
			setLmKpis({
				total: lmJobs.length,
				active: lmActive,
				apps: lmAppsTotal,
				fillRate: lmFillRate,
				avgMs: lmAvgMs,
				uniqueAgents: new Set(lmFilledApps.map((a) => a.candidate_id))
					.size,
				avgAppsPerJob:
					lmJobs.length > 0
						? Math.round((lmAppsTotal / lmJobs.length) * 10) / 10
						: 0,
			});
			setAllJobs(jobs);
			setAllApplications(applications);

			// Top 3 agents (par nb de contrats signés)
			const agentCounts = {};
			for (const a of filledApps) {
				agentCounts[a.candidate_id] =
					(agentCounts[a.candidate_id] || 0) + 1;
			}
			const top3Ids = Object.entries(agentCounts)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3)
				.map(([id, count]) => ({ id, count }));

			if (top3Ids.length > 0) {
				const ids = top3Ids.map((a) => a.id).join(",");
				const profilesRes = await axios.get(
					`${base}/profiles?id=in.(${ids})&select=id,firstname,lastname,avatar_url`,
					{ headers },
				);
				const profileMap = {};
				for (const p of profilesRes.data ?? []) {
					profileMap[p.id] = p;
				}
				setTopAgents(
					top3Ids.map(({ id, count }) => ({
						...profileMap[id],
						count,
					})),
				);
			} else {
				setTopAgents([]);
			}
		} catch (e) {
			console.error(
				"HomeChartsPro fetchStats:",
				e?.response?.data ?? e.message,
			);
		} finally {
			setLoading(false);
		}
	};

	const cardBg = isDark ? "#1f2937" : "#ffffff";
	const borderColor = isDark ? "#374151" : "#e5e7eb";
	const textPrimary = isDark ? "#f3f4f6" : "#111827";
	const textSecondary = isDark ? "#9ca3af" : "#6b7280";
	const axisColor = isDark ? "#374151" : "#e5e7eb";
	const labelColor = isDark ? "#6b7280" : "#9ca3af";

	if (loading) {
		return (
			<Box style={{ padding: 32, alignItems: "center" }}>
				<ActivityIndicator
					size='large'
					color={isDark ? "#60a5fa" : "#2563eb"}
				/>
			</Box>
		);
	}

	return (
		<VStack space='lg'>
			{/* KPIs */}
			<VStack space='sm'>
				<Heading
					size='sm'
					style={{ color: textPrimary, marginBottom: 4 }}>
					Tableau de bord
				</Heading>

				{/* Row 1 */}
				<HStack space='sm'>
					<KpiCard
						icon={Briefcase}
						iconColor='#2563eb'
						iconBg={isDark ? "#1e3a5f" : "#eff6ff"}
						label='Missions publiées'
						value={kpis.jobsTotal}
						sub='actives'
						isDark={isDark}
						onPress={() =>
							router.push({
								pathname: "/offers",
								params: {
									isLastMinute: false,
								},
							})
						}
					/>
					<KpiCard
						icon={Users}
						iconColor='#7c3aed'
						iconBg={isDark ? "#2e1065" : "#f5f3ff"}
						label='Candidatures reçues'
						value={kpis.applicationsTotal}
						isDark={isDark}
						onPress={() => router.push("/applicationspro")}
					/>
				</HStack>

				{/* Row 2 */}
				<HStack space='sm'>
					<KpiCard
						icon={CheckCircle}
						iconColor='#059669'
						iconBg={isDark ? "#052e16" : "#f0fdf4"}
						label='Taux missions pourvues'
						value={`${kpis.fillRate} %`}
						isDark={isDark}
					/>
					<KpiCard
						icon={Clock}
						iconColor='#d97706'
						iconBg={isDark ? "#451a03" : "#fffbeb"}
						label='Temps moyen recrutement'
						value={(() => {
							if (kpis.avgMs === null) return "—";
							const mins = Math.round(kpis.avgMs / 60000);
							if (mins < 60) return `${mins} min`;
							const hours = Math.round(kpis.avgMs / 3600000);
							if (hours < 24) return `${hours} h`;
							return `${Math.round(kpis.avgMs / 86400000)} j`;
						})()}
						sub={(() => {
							if (kpis.avgMs === null)
								return "pas encore de données";
							const mins = Math.round(kpis.avgMs / 60000);
							if (mins < 60) return "minutes en moyenne";
							const hours = Math.round(kpis.avgMs / 3600000);
							if (hours < 24) return "heures en moyenne";
							return "jours en moyenne";
						})()}
						isDark={isDark}
					/>
				</HStack>

				{/* Row 3 */}
				<HStack space='sm'>
					<KpiCard
						icon={UserCheck}
						iconColor='#0891b2'
						iconBg={isDark ? "#0c2a35" : "#ecfeff"}
						label='Agents recrutés'
						value={kpis.uniqueAgents ?? "—"}
						sub='profils uniques'
						isDark={isDark}
					/>
					<KpiCard
						icon={TrendingUp}
						iconColor='#9333ea'
						iconBg={isDark ? "#2e0a4a" : "#faf5ff"}
						label='Moy. candidatures / mission'
						value={kpis.avgAppsPerJob ?? "—"}
						sub='candidatures en moyenne'
						isDark={isDark}
					/>
				</HStack>
			</VStack>

			<Divider style={{ backgroundColor: borderColor }} />

			{/* Bar chart */}
			<VStack space='xs'>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 8,
					}}>
					<Heading size='sm' style={{ color: textPrimary }}>
						Missions publiées
					</Heading>
					{/* Sélecteur de période */}
					<HStack
						style={{
							backgroundColor: isDark ? "#111827" : "#f3f4f6",
							borderRadius: 10,
							padding: 3,
						}}>
						{PERIODS.map(({ key, label }) => {
							const active = period === key;
							return (
								<TouchableOpacity
									key={key}
									onPress={() => setPeriod(key)}
									activeOpacity={0.7}
									style={{
										paddingHorizontal: 10,
										paddingVertical: 5,
										borderRadius: 8,
										backgroundColor: active
											? isDark
												? "#2563eb"
												: "#2563eb"
											: "transparent",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: active ? "700" : "500",
											color: active
												? "#ffffff"
												: isDark
													? "#6b7280"
													: "#9ca3af",
										}}>
										{label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</HStack>
				</HStack>
				<Box
					style={{
						backgroundColor: cardBg,
						borderRadius: 16,
						borderWidth: 1,
						borderColor,
						paddingTop: 20,
						paddingBottom: 8,
						paddingHorizontal: 8,
						overflow: "hidden",
					}}>
					{/* Légende */}
					<HStack
						space='lg'
						style={{ paddingHorizontal: 8, marginBottom: 12 }}>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 24,
									height: 3,
									borderRadius: 2,
									backgroundColor: isDark
										? "#3b82f6"
										: "#2563eb",
								}}
							/>
							<Text size='xs' style={{ color: textSecondary }}>
								Missions
							</Text>
						</HStack>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 24,
									height: 3,
									borderRadius: 2,
									backgroundColor: isDark
										? "#a78bfa"
										: "#7c3aed",
								}}
							/>
							<Text size='xs' style={{ color: textSecondary }}>
								Candidatures
							</Text>
						</HStack>
					</HStack>
					<LineChart
						data={lineData}
						data2={lineData2}
						width={SCREEN_WIDTH - 96}
						height={180}
						spacing={(SCREEN_WIDTH - 96) / (lineData.length + 1)}
						color1={isDark ? "#3b82f6" : "#2563eb"}
						color2={isDark ? "#a78bfa" : "#7c3aed"}
						thickness1={2.5}
						thickness2={2.5}
						startFillColor1={isDark ? "#1e3a5f" : "#dbeafe"}
						endFillColor1={isDark ? "#111827" : "#ffffff"}
						startFillColor2={isDark ? "#2e1065" : "#f5f3ff"}
						endFillColor2={isDark ? "#111827" : "#ffffff"}
						startOpacity1={0.35}
						endOpacity1={0}
						startOpacity2={0.25}
						endOpacity2={0}
						areaChart
						hideRules
						xAxisColor={axisColor}
						yAxisColor='transparent'
						yAxisTextStyle={{ color: labelColor, fontSize: 11 }}
						xAxisLabelTextStyle={{
							color: labelColor,
							fontSize: 10,
						}}
						dataPointsColor1={isDark ? "#60a5fa" : "#2563eb"}
						dataPointsColor2={isDark ? "#c4b5fd" : "#7c3aed"}
						dataPointsRadius={4}
						noOfSections={4}
						maxValue={Math.max(
							...lineData.map((d) => d.value),
							...lineData2.map((d) => d.value),
							4,
						)}
						isAnimated
						animationDuration={600}
						curved
					/>
				</Box>
			</VStack>

			<Divider style={{ backgroundColor: borderColor }} />

			{/* Répartition par poste */}
			<VStack space='xs'>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 8,
					}}>
					<Heading size='sm' style={{ color: textPrimary }}>
						Répartition par poste
					</Heading>
					<HStack
						style={{
							backgroundColor: isDark ? "#111827" : "#f3f4f6",
							borderRadius: 10,
							padding: 3,
						}}>
						{PERIODS.map(({ key, label }) => {
							const active = catPeriod === key;
							return (
								<TouchableOpacity
									key={key}
									onPress={() => setCatPeriod(key)}
									activeOpacity={0.7}
									style={{
										paddingHorizontal: 10,
										paddingVertical: 5,
										borderRadius: 8,
										backgroundColor: active
											? "#2563eb"
											: "transparent",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: active ? "700" : "500",
											color: active
												? "#ffffff"
												: isDark
													? "#6b7280"
													: "#9ca3af",
										}}>
										{label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</HStack>
				</HStack>

				{catChartData.barData.length === 0 ? (
					<Box
						style={{
							backgroundColor: cardBg,
							borderRadius: 16,
							borderWidth: 1,
							borderColor,
							padding: 24,
							alignItems: "center",
						}}>
						<Text size='sm' style={{ color: textSecondary }}>
							Aucune mission sur cette période
						</Text>
					</Box>
				) : (
					<Box
						style={{
							backgroundColor: cardBg,
							borderRadius: 16,
							borderWidth: 1,
							borderColor,
							padding: 16,
							overflow: "hidden",
						}}>
						{/* Légende */}
						<HStack
							style={{
								justifyContent: "flex-end",
								marginBottom: 10,
								gap: 14,
							}}>
							<HStack style={{ alignItems: "center", gap: 5 }}>
								<Box
									style={{
										width: 12,
										height: 12,
										borderRadius: 3,
										backgroundColor: CAT_COLORS[0],
									}}
								/>
								<Text
									size='xs'
									style={{ color: textSecondary }}>
									Missions
								</Text>
							</HStack>
							<HStack style={{ alignItems: "center", gap: 5 }}>
								<Box
									style={{
										width: 12,
										height: 3,
										borderRadius: 2,
										backgroundColor: isDark
											? "#a78bfa"
											: "#7c3aed",
									}}
								/>
								<Text
									size='xs'
									style={{ color: textSecondary }}>
									Candidatures
								</Text>
							</HStack>
						</HStack>
						<BarChart
							data={catChartData.barData}
							showLine
							lineData={catChartData.lineData}
							lineConfig={{
								color: isDark ? "#a78bfa" : "#7c3aed",
								thickness: 2.5,
								curved: false,
								dataPointsColor: isDark ? "#c4b5fd" : "#7c3aed",
								dataPointsRadius: 5,
								dataPointsWidth: 5,
								shiftY: 0,
							}}
							height={200}
							width={SCREEN_WIDTH - 96}
							barWidth={28}
							spacing={20}
							roundedTop
							hideRules
							yAxisColor='transparent'
							xAxisColor={axisColor}
							yAxisTextStyle={{ color: labelColor, fontSize: 11 }}
							xAxisLabelTextStyle={{
								color: labelColor,
								fontSize: 10,
							}}
							noOfSections={4}
							maxValue={Math.max(
								...catChartData.barData.map((d) => d.value),
								...catChartData.lineData.map((d) => d.value),
								4,
							)}
							isAnimated
							animationDuration={500}
							renderTooltip={(item) => (
								<Box
									style={{
										backgroundColor: isDark
											? "#374151"
											: "#1f2937",
										paddingHorizontal: 8,
										paddingVertical: 4,
										borderRadius: 6,
										marginBottom: 4,
									}}>
									<Text
										style={{
											color: "#ffffff",
											fontSize: 12,
											fontWeight: "700",
										}}>
										{item.value} mission
										{item.value > 1 ? "s" : ""} · {item.pct}
										%
									</Text>
								</Box>
							)}
						/>
					</Box>
				)}
			</VStack>

			<Divider style={{ backgroundColor: borderColor }} />

			{lmKpis.total === 0 ? (
				<Box
					style={{
						backgroundColor: isDark ? "#422006" : "#fefce8",
						borderRadius: 16,
						borderWidth: 1,
						borderColor: isDark ? "#92400e" : "#fde68a",
						padding: 16,
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
					}}>
					<Zap size={18} color={isDark ? "#fbbf24" : "#d97706"} />
					<VStack style={{ flex: 1 }}>
						<Text
							style={{
								color: isDark ? "#fbbf24" : "#92400e",
								fontWeight: "700",
								fontSize: 14,
							}}>
							Aucune donnée Last Minute
						</Text>
						<Text
							style={{
								color: isDark ? "#fcd34d" : "#b45309",
								fontSize: 12,
								marginTop: 2,
							}}>
							Publiez une annonce Last Minute pour voir vos
							statistiques apparaître ici.
						</Text>
					</VStack>
				</Box>
			) : (
				<>
					{/* Stats Last Minute */}
					<VStack space='sm'>
						<HStack
							style={{
								alignItems: "center",
								gap: 8,
								marginBottom: 4,
							}}>
							<Box
								style={{
									width: 28,
									height: 28,
									borderRadius: 8,
									backgroundColor: isDark
										? "#451a03"
										: "#fff7ed",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Zap size={15} color='#ea580c' />
							</Box>
							<Heading size='sm' style={{ color: textPrimary }}>
								Missions Last Minute
							</Heading>
						</HStack>

						<HStack space='sm'>
							<KpiCard
								icon={Zap}
								iconColor='#ea580c'
								iconBg={isDark ? "#451a03" : "#fff7ed"}
								label='Missions last minute'
								value={lmKpis.active}
								sub='actives'
								isDark={isDark}
								onPress={() =>
									router.push({
										pathname: "/offers",
										params: {
											isLastMinute: true,
										},
									})
								}
							/>
							<KpiCard
								icon={Users}
								iconColor='#be185d'
								iconBg={isDark ? "#4a0520" : "#fdf2f8"}
								label='Candidatures reçues'
								value={lmKpis.apps}
								sub='sur missions LM'
								isDark={isDark}
								onPress={() => router.push("/applicationspro")}
							/>
						</HStack>

						<HStack space='sm'>
							<KpiCard
								icon={Target}
								iconColor='#16a34a'
								iconBg={isDark ? "#052e16" : "#f0fdf4"}
								label='Taux de pourvoi LM'
								value={`${lmKpis.fillRate} %`}
								isDark={isDark}
							/>
							<KpiCard
								icon={Timer}
								iconColor='#0891b2'
								iconBg={isDark ? "#0c2a35" : "#ecfeff"}
								label='Temps moyen pourvoi LM'
								value={(() => {
									if (lmKpis.avgMs === null) return "—";
									const mins = Math.round(
										lmKpis.avgMs / 60000,
									);
									if (mins < 60) return `${mins} min`;
									const hours = Math.round(
										lmKpis.avgMs / 3600000,
									);
									if (hours < 24) return `${hours} h`;
									return `${Math.round(lmKpis.avgMs / 86400000)} j`;
								})()}
								sub={(() => {
									if (lmKpis.avgMs === null)
										return "pas encore de données";
									const mins = Math.round(
										lmKpis.avgMs / 60000,
									);
									if (mins < 60) return "minutes en moyenne";
									const hours = Math.round(
										lmKpis.avgMs / 3600000,
									);
									if (hours < 24) return "heures en moyenne";
									return "jours en moyenne";
								})()}
								isDark={isDark}
							/>
						</HStack>

						{/* Row 3 LM */}
						<HStack space='sm'>
							<KpiCard
								icon={UserCheck}
								iconColor='#0891b2'
								iconBg={isDark ? "#0c2a35" : "#ecfeff"}
								label='Agents recrutés LM'
								value={lmKpis.uniqueAgents ?? "—"}
								sub='profils uniques'
								isDark={isDark}
							/>
							<KpiCard
								icon={TrendingUp}
								iconColor='#9333ea'
								iconBg={isDark ? "#2e0a4a" : "#faf5ff"}
								label='Moy. candidatures / mission LM'
								value={lmKpis.avgAppsPerJob ?? "—"}
								sub='candidatures en moyenne'
								isDark={isDark}
							/>
						</HStack>
					</VStack>

					{/* Line chart LM */}

					<Divider style={{ marginVertical: 8 }} />
					<VStack space='xs'>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 8,
							}}>
							<Heading size='sm' style={{ color: textPrimary }}>
								Missions LM publiées
							</Heading>
							<HStack
								style={{
									backgroundColor: isDark
										? "#111827"
										: "#f3f4f6",
									borderRadius: 10,
									padding: 3,
								}}>
								{PERIODS.map(({ key, label }) => {
									const active = lmPeriod === key;
									return (
										<TouchableOpacity
											key={key}
											onPress={() => setLmPeriod(key)}
											activeOpacity={0.7}
											style={{
												paddingHorizontal: 10,
												paddingVertical: 5,
												borderRadius: 8,
												backgroundColor: active
													? "#ea580c"
													: "transparent",
											}}>
											<Text
												size='xs'
												style={{
													fontWeight: active
														? "700"
														: "500",
													color: active
														? "#ffffff"
														: isDark
															? "#6b7280"
															: "#9ca3af",
												}}>
												{label}
											</Text>
										</TouchableOpacity>
									);
								})}
							</HStack>
						</HStack>
						<Box
							style={{
								backgroundColor: cardBg,
								borderRadius: 16,
								borderWidth: 1,
								borderColor,
								paddingTop: 20,
								paddingBottom: 8,
								paddingHorizontal: 8,
								overflow: "hidden",
							}}>
							<HStack
								space='lg'
								style={{
									paddingHorizontal: 8,
									marginBottom: 12,
								}}>
								<HStack
									space='xs'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 24,
											height: 3,
											borderRadius: 2,
											backgroundColor: isDark
												? "#fb923c"
												: "#ea580c",
										}}
									/>
									<Text
										size='xs'
										style={{ color: textSecondary }}>
										Missions LM
									</Text>
								</HStack>
								<HStack
									space='xs'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 24,
											height: 3,
											borderRadius: 2,
											backgroundColor: isDark
												? "#a78bfa"
												: "#7c3aed",
										}}
									/>
									<Text
										size='xs'
										style={{ color: textSecondary }}>
										Candidatures
									</Text>
								</HStack>
							</HStack>
							<LineChart
								data={lmLineData}
								data2={lmLineData2}
								width={SCREEN_WIDTH - 96}
								height={180}
								spacing={
									(SCREEN_WIDTH - 96) /
									(lmLineData.length + 1)
								}
								color1={isDark ? "#fb923c" : "#ea580c"}
								color2={isDark ? "#a78bfa" : "#7c3aed"}
								thickness1={2.5}
								thickness2={2.5}
								startFillColor1={isDark ? "#431407" : "#ffedd5"}
								endFillColor1={isDark ? "#111827" : "#ffffff"}
								startFillColor2={isDark ? "#2e1065" : "#f5f3ff"}
								endFillColor2={isDark ? "#111827" : "#ffffff"}
								startOpacity1={0.35}
								endOpacity1={0}
								startOpacity2={0.25}
								endOpacity2={0}
								areaChart
								hideRules
								xAxisColor={axisColor}
								yAxisColor='transparent'
								yAxisTextStyle={{
									color: labelColor,
									fontSize: 11,
								}}
								xAxisLabelTextStyle={{
									color: labelColor,
									fontSize: 10,
								}}
								dataPointsColor1={
									isDark ? "#fb923c" : "#ea580c"
								}
								dataPointsColor2={
									isDark ? "#c4b5fd" : "#7c3aed"
								}
								dataPointsRadius={4}
								noOfSections={4}
								maxValue={Math.max(
									...lmLineData.map((d) => d.value),
									...lmLineData2.map((d) => d.value),
									4,
								)}
								isAnimated
								animationDuration={600}
								curved
							/>
						</Box>
					</VStack>

					{/* Bar chart répartition LM */}

					<Divider style={{ marginVertical: 8 }} />
					<VStack space='xs'>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 8,
							}}>
							<Heading size='sm' style={{ color: textPrimary }}>
								Répartition postes LM
							</Heading>
							<HStack
								style={{
									backgroundColor: isDark
										? "#111827"
										: "#f3f4f6",
									borderRadius: 10,
									padding: 3,
								}}>
								{PERIODS.map(({ key, label }) => {
									const active = lmCatPeriod === key;
									return (
										<TouchableOpacity
											key={key}
											onPress={() => setLmCatPeriod(key)}
											activeOpacity={0.7}
											style={{
												paddingHorizontal: 10,
												paddingVertical: 5,
												borderRadius: 8,
												backgroundColor: active
													? "#ea580c"
													: "transparent",
											}}>
											<Text
												size='xs'
												style={{
													fontWeight: active
														? "700"
														: "500",
													color: active
														? "#ffffff"
														: isDark
															? "#6b7280"
															: "#9ca3af",
												}}>
												{label}
											</Text>
										</TouchableOpacity>
									);
								})}
							</HStack>
						</HStack>

						{lmCatChartData.barData.length === 0 ? (
							<Box
								style={{
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor,
									padding: 24,
									alignItems: "center",
								}}>
								<Text
									size='sm'
									style={{ color: textSecondary }}>
									Aucune mission LM sur cette période
								</Text>
							</Box>
						) : (
							<Box
								style={{
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor,
									padding: 16,
									overflow: "hidden",
								}}>
								<HStack
									style={{
										justifyContent: "flex-end",
										marginBottom: 10,
										gap: 14,
									}}>
									<HStack
										style={{
											alignItems: "center",
											gap: 5,
										}}>
										<Box
											style={{
												width: 12,
												height: 12,
												borderRadius: 3,
												backgroundColor: CAT_COLORS[0],
											}}
										/>
										<Text
											size='xs'
											style={{ color: textSecondary }}>
											Missions LM
										</Text>
									</HStack>
									<HStack
										style={{
											alignItems: "center",
											gap: 5,
										}}>
										<Box
											style={{
												width: 12,
												height: 3,
												borderRadius: 2,
												backgroundColor: isDark
													? "#a78bfa"
													: "#7c3aed",
											}}
										/>
										<Text
											size='xs'
											style={{ color: textSecondary }}>
											Candidatures
										</Text>
									</HStack>
								</HStack>
								<BarChart
									data={lmCatChartData.barData}
									showLine
									lineData={lmCatChartData.lineData}
									lineConfig={{
										color: isDark ? "#a78bfa" : "#7c3aed",
										thickness: 2.5,
										curved: false,
										dataPointsColor: isDark
											? "#c4b5fd"
											: "#7c3aed",
										dataPointsRadius: 5,
										dataPointsWidth: 5,
										shiftY: 0,
									}}
									height={200}
									width={SCREEN_WIDTH - 96}
									barWidth={28}
									spacing={20}
									roundedTop
									hideRules
									yAxisColor='transparent'
									xAxisColor={axisColor}
									yAxisTextStyle={{
										color: labelColor,
										fontSize: 11,
									}}
									xAxisLabelTextStyle={{
										color: labelColor,
										fontSize: 10,
									}}
									noOfSections={4}
									maxValue={Math.max(
										...lmCatChartData.barData.map(
											(d) => d.value,
										),
										...lmCatChartData.lineData.map(
											(d) => d.value,
										),
										4,
									)}
									isAnimated
									animationDuration={500}
									renderTooltip={(item) => (
										<Box
											style={{
												backgroundColor: isDark
													? "#374151"
													: "#1f2937",
												paddingHorizontal: 8,
												paddingVertical: 4,
												borderRadius: 6,
												marginBottom: 4,
											}}>
											<Text
												style={{
													color: "#ffffff",
													fontSize: 12,
													fontWeight: "700",
												}}>
												{item.value} mission
												{item.value > 1
													? "s"
													: ""} · {item.pct}%
											</Text>
										</Box>
									)}
								/>
							</Box>
						)}
					</VStack>
				</>
			)}

			{/* Top agents */}
			{topAgents.length > 0 && (
				<>
					<Divider style={{ marginVertical: 8 }} />
					<VStack
						space='sm'
						style={{
							paddingHorizontal: 0,
							paddingBottom: 16,
							marginTop: 10,
						}}>
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 4,
							}}>
							<Heading
								size='sm'
								style={{
									color: isDark ? "#f9fafb" : "#111827",
								}}>
								Top agents
							</Heading>
							<Text
								size='xs'
								style={{
									color: isDark ? "#6b7280" : "#9ca3af",
								}}>
								contrats signés
							</Text>
						</HStack>
						{topAgents.map((agent, idx) => (
							<HStack
								key={agent.id}
								space='sm'
								style={{
									alignItems: "center",
									paddingVertical: 10,
									paddingHorizontal: 14,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#374151" : "#e5e7eb",
									backgroundColor: isDark
										? "#1f2937"
										: "#ffffff",
								}}>
								{/* Rang */}
								<Box
									style={{
										width: 28,
										height: 28,
										borderRadius: 8,
										backgroundColor: isDark
											? "#374151"
											: "#f3f4f6",
										alignItems: "center",
										justifyContent: "center",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: "700",
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										#{idx + 1}
									</Text>
								</Box>
								{/* Avatar */}
								{agent.avatar_url ? (
									<Image
										source={{ uri: agent.avatar_url }}
										style={{
											width: 36,
											height: 36,
											borderRadius: 18,
										}}
									/>
								) : (
									<Box
										style={{
											width: 36,
											height: 36,
											borderRadius: 18,
											backgroundColor: isDark
												? "#374151"
												: "#e5e7eb",
											alignItems: "center",
											justifyContent: "center",
										}}>
										<Text
											style={{
												fontWeight: "700",
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontSize: 14,
											}}>
											{(
												agent.firstname?.[0] ?? "?"
											).toUpperCase()}
										</Text>
									</Box>
								)}
								{/* Nom */}
								<VStack style={{ flex: 1 }}>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{agent.firstname ?? ""}{" "}
										{agent.lastname ?? ""}
									</Text>
								</VStack>
								{/* Score */}
								<HStack
									space='xs'
									style={{ alignItems: "center" }}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 16,
											color: isDark
												? "#fbbf24"
												: "#d97706",
										}}>
										{agent.count}
									</Text>
									<Text
										size='xs'
										style={{
											color: isDark
												? "#6b7280"
												: "#9ca3af",
										}}>
										contrat{agent.count > 1 ? "s" : ""}
									</Text>
								</HStack>
							</HStack>
						))}
					</VStack>
					<Divider style={{ marginVertical: 8 }} />
				</>
			)}
		</VStack>
	);
};
export default HomeChartsPro;
