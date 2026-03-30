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
	Plus,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { CATEGORY } from "@/constants/categories";

// Dégradé de gris pour les catégories (sobre)
const getCatColors = (isDark) =>
	isDark
		? [
				"#e2e8f0",
				"#cbd5e1",
				"#94a3b8",
				"#b0c1d0",
				"#f1f5f9",
				"#a8b4be",
				"#d1d5db",
				"#9ca3af",
			]
		: [
				"#1e293b",
				"#334155",
				"#475569",
				"#64748b",
				"#374151",
				"#4b5563",
				"#6b7280",
				"#0f172a",
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
				backgroundColor: isDark
					? Colors.dark.cardBackground
					: Colors.light.cardBackground,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: isDark ? Colors.dark.border : Colors.light.border,
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
						color: isDark ? Colors.dark.muted : Colors.light.muted,
						fontWeight: "600",
						flex: 1,
						lineHeight: 16,
					}}>
					{label}
				</Text>
				{onPress ? (
					<ChevronRight
						size={14}
						color={
							isDark ? Colors.dark.border : Colors.light.border
						}
					/>
				) : null}
			</HStack>
			<Text
				style={{
					fontSize: 28,
					fontWeight: "800",
					color: isDark ? Colors.dark.text : Colors.light.text,
					lineHeight: 34,
				}}>
				{value}
			</Text>
			{sub ? (
				<Text
					size='xs'
					style={{
						color: isDark ? Colors.dark.muted : Colors.light.muted,
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
			frontColor: getCatColors(isDark)[i % 8],
			pct: Math.round((count / total) * 100),
		}));

		const lineData = sorted.map(({ cat }) => ({
			value: appCounts[cat.id] || 0,
		}));

		return { barData, lineData };
	}, [allJobs, allApplications, catPeriod, isDark]);

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
			frontColor: getCatColors(isDark)[i % 8],
			pct: Math.round((count / total) * 100),
		}));

		const lineData = sorted.map(({ cat }) => ({
			value: appCounts[cat.id] || 0,
		}));

		return { barData, lineData };
	}, [lmJobs, allApplications, lmCatPeriod, isDark]);

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

	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const borderColor = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;
	const axisColor = isDark ? Colors.dark.border : Colors.light.border;
	const labelColor = isDark ? Colors.dark.muted : Colors.light.muted;

	if (loading) {
		return (
			<Box style={{ padding: 32, alignItems: "center" }}>
				<ActivityIndicator
					size='large'
					color={isDark ? Colors.dark.tint : Colors.light.tint}
				/>
			</Box>
		);
	}

	return (
		<VStack space='lg'>
			{/* KPIs */}
			<VStack space='sm'>
				{/* Row 1 */}
				<HStack space='sm'>
					<KpiCard
						icon={Briefcase}
						iconColor={
							isDark ? Colors.dark.tint : Colors.light.tint
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
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
						iconColor={
							isDark ? Colors.dark.tint : Colors.light.tint
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
						label='Candidatures reçues'
						value={kpis.applicationsTotal}
						isDark={isDark}
						onPress={() =>
							router.push({
								pathname: "/applicationspro",
								params: {
									isLastMinute: false,
								},
							})
						}
					/>
				</HStack>

				{/* Row 2 */}
				<HStack space='sm'>
					<KpiCard
						icon={CheckCircle}
						iconColor={
							isDark ? Colors.dark.success : Colors.light.success
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
						label='Taux missions pourvues'
						value={`${kpis.fillRate} %`}
						isDark={isDark}
					/>
					<KpiCard
						icon={Clock}
						iconColor={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
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
						iconColor={
							isDark ? Colors.dark.tint : Colors.light.tint
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
						label='Agents recrutés'
						value={kpis.uniqueAgents ?? "—"}
						sub='profils uniques'
						isDark={isDark}
					/>
					<KpiCard
						icon={TrendingUp}
						iconColor={
							isDark ? Colors.dark.tint : Colors.light.tint
						}
						iconBg={
							isDark
								? Colors.dark.background
								: Colors.light.background
						}
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
							backgroundColor: isDark
								? Colors.light.text
								: Colors.light.background,
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
												? Colors.dark.border
												: Colors.light.cardBackground
											: "transparent",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: active ? "700" : "500",
											color: active
												? isDark
													? Colors.dark.text
													: Colors.light.text
												: isDark
													? Colors.dark.muted
													: Colors.light.muted,
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
										? Colors.dark.tint
										: Colors.light.tint,
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
										? Colors.dark.muted
										: Colors.light.muted,
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
						color1={isDark ? Colors.dark.tint : Colors.light.tint}
						color2={isDark ? Colors.dark.muted : Colors.light.muted}
						thickness1={2.5}
						thickness2={2.5}
						startFillColor1={
							isDark
								? Colors.dark.cardBackground
								: Colors.light.background
						}
						endFillColor1={
							isDark
								? Colors.dark.background
								: Colors.light.cardBackground
						}
						startFillColor2={
							isDark
								? Colors.dark.cardBackground
								: Colors.light.background
						}
						endFillColor2={
							isDark
								? Colors.dark.background
								: Colors.light.cardBackground
						}
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
						dataPointsColor1={
							isDark ? Colors.dark.tint : Colors.light.tint
						}
						dataPointsColor2={
							isDark ? Colors.dark.muted : Colors.light.muted
						}
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
							backgroundColor: isDark
								? Colors.light.text
								: Colors.light.background,
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
											? isDark
												? Colors.dark.border
												: Colors.light.cardBackground
											: "transparent",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: active ? "700" : "500",
											color: active
												? isDark
													? Colors.dark.text
													: Colors.light.text
												: isDark
													? Colors.dark.muted
													: Colors.light.muted,
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
										backgroundColor:
											getCatColors(isDark)[0],
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
											? Colors.dark.muted
											: Colors.light.muted,
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
								color: isDark
									? Colors.dark.muted
									: Colors.light.muted,
								thickness: 2.5,
								curved: false,
								dataPointsColor: isDark
									? Colors.dark.muted
									: Colors.light.muted,
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
											? Colors.dark.border
											: Colors.dark.cardBackground,
										paddingHorizontal: 8,
										paddingVertical: 4,
										borderRadius: 6,
										marginBottom: 4,
									}}>
									<Text
										style={{
											color: Colors.light.cardBackground,
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
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.background,
						borderRadius: 16,
						borderWidth: 1,
						borderColor: isDark
							? Colors.dark.warning
							: Colors.light.warning,
						padding: 16,
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
					}}>
					<Zap
						size={18}
						color={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
					/>
					<VStack style={{ flex: 1 }}>
						<Text
							style={{
								color: isDark
									? Colors.dark.warning
									: Colors.light.warning,
								fontWeight: "700",
								fontSize: 14,
							}}>
							Aucune donnée Last Minute
						</Text>
						<Text
							style={{
								color: isDark
									? Colors.dark.muted
									: Colors.light.muted,
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
										? Colors.dark.background
										: Colors.light.background,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Zap
									size={15}
									color={
										isDark
											? Colors.dark.warning
											: Colors.light.warning
									}
								/>
							</Box>
							<Heading size='sm' style={{ color: textPrimary }}>
								Missions Last Minute
							</Heading>
						</HStack>

						<HStack space='sm'>
							<KpiCard
								icon={Zap}
								iconColor={
									isDark
										? Colors.dark.warning
										: Colors.light.warning
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
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
								iconColor={
									isDark
										? Colors.dark.tint
										: Colors.light.tint
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
								label='Candidatures reçues'
								value={lmKpis.apps}
								sub='sur missions LM'
								isDark={isDark}
								onPress={() =>
									router.push({
										pathname: "/applicationspro",
										params: {
											isLastMinute: true,
										},
									})
								}
							/>
						</HStack>

						<HStack space='sm'>
							<KpiCard
								icon={Target}
								iconColor={
									isDark
										? Colors.dark.success
										: Colors.light.success
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
								label='Taux de pourvoi LM'
								value={`${lmKpis.fillRate} %`}
								isDark={isDark}
							/>
							<KpiCard
								icon={Timer}
								iconColor={
									isDark
										? Colors.dark.tint
										: Colors.light.tint
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
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
								iconColor={
									isDark
										? Colors.dark.tint
										: Colors.light.tint
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
								label='Agents recrutés LM'
								value={lmKpis.uniqueAgents ?? "—"}
								sub='profils uniques'
								isDark={isDark}
							/>
							<KpiCard
								icon={TrendingUp}
								iconColor={
									isDark
										? Colors.dark.tint
										: Colors.light.tint
								}
								iconBg={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
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
										? Colors.dark.background
										: Colors.light.border,
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
													? isDark
														? Colors.dark.border
														: Colors.light
																.cardBackground
													: "transparent",
											}}>
											<Text
												size='xs'
												style={{
													fontWeight: active
														? "700"
														: "500",
													color: active
														? isDark
															? Colors.dark.text
															: Colors.light.text
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
												? Colors.dark.warning
												: Colors.light.warning,
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
												? Colors.dark.muted
												: Colors.light.muted,
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
								color1={
									isDark
										? Colors.dark.warning
										: Colors.light.warning
								}
								color2={
									isDark
										? Colors.dark.muted
										: Colors.light.muted
								}
								thickness1={2.5}
								thickness2={2.5}
								startFillColor1={
									isDark
										? Colors.dark.background
										: Colors.light.background
								}
								endFillColor1={
									isDark
										? Colors.dark.background
										: Colors.light.cardBackground
								}
								startFillColor2={
									isDark
										? Colors.dark.cardBackground
										: Colors.light.background
								}
								endFillColor2={
									isDark
										? Colors.dark.background
										: Colors.light.cardBackground
								}
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
									isDark
										? Colors.dark.warning
										: Colors.light.warning
								}
								dataPointsColor2={
									isDark
										? Colors.dark.muted
										: Colors.light.muted
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
										? Colors.dark.background
										: Colors.light.border,
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
													? isDark
														? Colors.dark.border
														: Colors.light
																.cardBackground
													: "transparent",
											}}>
											<Text
												size='xs'
												style={{
													fontWeight: active
														? "700"
														: "500",
													color: active
														? isDark
															? Colors.dark.text
															: Colors.light.text
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
												backgroundColor:
													getCatColors(isDark)[0],
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
													? Colors.dark.muted
													: Colors.light.muted,
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
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										thickness: 2.5,
										curved: false,
										dataPointsColor: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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
													? Colors.dark.border
													: Colors.dark
															.cardBackground,
												paddingHorizontal: 8,
												paddingVertical: 4,
												borderRadius: 6,
												marginBottom: 4,
											}}>
											<Text
												style={{
													color: Colors.light
														.cardBackground,
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Top agents
							</Heading>
							<Text
								size='xs'
								style={{
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
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
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
									backgroundColor: isDark
										? Colors.dark.cardBackground
										: Colors.light.cardBackground,
								}}>
								{/* Rang */}
								<Box
									style={{
										width: 28,
										height: 28,
										borderRadius: 8,
										backgroundColor: isDark
											? Colors.dark.border
											: Colors.light.background,
										alignItems: "center",
										justifyContent: "center",
									}}>
									<Text
										size='xs'
										style={{
											fontWeight: "700",
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
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
												? Colors.dark.border
												: Colors.light.border,
											alignItems: "center",
											justifyContent: "center",
										}}>
										<Text
											style={{
												fontWeight: "700",
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
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
												? Colors.light.background
												: Colors.light.text,
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
												? Colors.dark.warning
												: Colors.light.warning,
										}}>
										{agent.count}
									</Text>
									<Text
										size='xs'
										style={{
											color: isDark
												? Colors.light.muted
												: Colors.dark.muted,
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
