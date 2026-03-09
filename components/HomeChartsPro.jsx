import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions } from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { BarChart } from "react-native-gifted-charts";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";

import { Briefcase, Users, CheckCircle, Clock } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const SCREEN_WIDTH = Dimensions.get("window").width;

// Génère les 6 derniers mois sous forme ["Jan", "Fév", ...]
const getLast6Months = () => {
	const months = [
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
	const result = [];
	const now = new Date();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		result.push({
			label: months[d.getMonth()],
			year: d.getFullYear(),
			month: d.getMonth(),
		});
	}
	return result;
};

const KpiCard = ({
	icon: Icon,
	iconColor,
	iconBg,
	label,
	value,
	sub,
	isDark,
}) => (
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
		<HStack space='sm' style={{ alignItems: "center", marginBottom: 10 }}>
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
				style={{ color: isDark ? "#6b7280" : "#9ca3af", marginTop: 2 }}>
				{sub}
			</Text>
		) : null}
	</Box>
);

const HomeChartsPro = () => {
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();

	const [loading, setLoading] = useState(true);
	const [kpis, setKpis] = useState({
		jobsTotal: 0,
		applicationsTotal: 0,
		fillRate: 0,
		avgDays: null,
	});
	const [barData, setBarData] = useState([]);

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

			// 1. Jobs publiés (non archivés)
			const [jobsRes, appsRes, filledAppsRes] = await Promise.all([
				axios.get(
					`${base}/jobs?company_id=eq.${user.id}&is_archived=eq.false&select=id,created_at`,
					{ headers: { ...headers, Prefer: "count=exact" } },
				),
				axios.get(
					`${base}/applications?company_id=eq.${user.id}&select=id,current_status,created_at,updated_at`,
					{ headers: { ...headers, Prefer: "count=exact" } },
				),
				axios.get(
					`${base}/applications?company_id=eq.${user.id}&current_status=eq.contract_signed_pro&select=id,created_at,updated_at`,
					{ headers },
				),
			]);

			const jobs = jobsRes.data ?? [];
			const applications = appsRes.data ?? [];
			const filledApps = filledAppsRes.data ?? [];

			const jobsTotal = jobs.length;
			const applicationsTotal = applications.length;

			// Taux de missions pourvues = jobs qui ont au moins 1 contrat finalisé / total jobs
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

			// Temps moyen recrutement (jours entre created_at et updated_at des contrats finalisés)
			let avgDays = null;
			if (filledApps.length > 0) {
				const totalMs = filledApps.reduce((acc, a) => {
					const diff =
						new Date(a.updated_at) - new Date(a.created_at);
					return acc + (diff > 0 ? diff : 0);
				}, 0);
				avgDays = Math.round(
					totalMs / filledApps.length / (1000 * 60 * 60 * 24),
				);
			}

			setKpis({ jobsTotal, applicationsTotal, fillRate, avgDays });

			// Bar chart : missions publiées par mois (6 derniers mois)
			const months = getLast6Months();
			const bars = months.map(({ label, year, month }) => {
				const count = jobs.filter((j) => {
					const d = new Date(j.created_at);
					return d.getFullYear() === year && d.getMonth() === month;
				}).length;
				return {
					value: count,
					label,
					frontColor: isDark ? "#3b82f6" : "#2563eb",
					topLabelComponent:
						count > 0
							? () => (
									<Text
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											fontSize: 11,
											marginBottom: 2,
										}}>
										{count}
									</Text>
								)
							: undefined,
				};
			});
			setBarData(bars);
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
					/>
					<KpiCard
						icon={Users}
						iconColor='#7c3aed'
						iconBg={isDark ? "#2e1065" : "#f5f3ff"}
						label='Candidatures reçues'
						value={kpis.applicationsTotal}
						isDark={isDark}
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
						value={kpis.avgDays !== null ? `${kpis.avgDays}j` : "—"}
						sub={
							kpis.avgDays !== null
								? "jours en moyenne"
								: "pas encore de données"
						}
						isDark={isDark}
					/>
				</HStack>
			</VStack>

			<Divider style={{ backgroundColor: borderColor }} />

			{/* Bar chart */}
			<VStack space='xs'>
				<Heading size='sm' style={{ color: textPrimary }}>
					Missions publiées / mois
				</Heading>
				<Text
					size='xs'
					style={{ color: textSecondary, marginBottom: 12 }}>
					6 derniers mois
				</Text>
				<Box
					style={{
						backgroundColor: cardBg,
						borderRadius: 16,
						borderWidth: 1,
						borderColor,
						padding: 16,
						overflow: "hidden",
					}}>
					<BarChart
						data={barData}
						barWidth={28}
						spacing={16}
						roundedTop
						roundedBottom
						hideRules
						xAxisColor={axisColor}
						yAxisColor='transparent'
						yAxisTextStyle={{ color: labelColor, fontSize: 11 }}
						xAxisLabelTextStyle={{
							color: labelColor,
							fontSize: 11,
						}}
						noOfSections={4}
						maxValue={Math.max(...barData.map((b) => b.value), 4)}
						width={SCREEN_WIDTH - 96}
						isAnimated
					/>
				</Box>
			</VStack>
		</VStack>
	);
};

export default HomeChartsPro;
