import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
	CreditCard,
	CheckCircle,
	XCircle,
	Calendar,
	AlertCircle,
	Zap,
	Star,
	Check,
} from "lucide-react-native";

import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const PLANS = [
	{
		key: "standard",
		label: "Standard",
		subtitle: "L'essentiel pour recruter",
		Icon: CreditCard,
		color: "#3b82f6",
		bgLight: "#eff6ff",
		bgDark: "#1e3a5f",
		borderActive: "#3b82f6",
		features: [
			"Publication d'offres d'emploi",
			"Gestion des candidatures",
			"Messagerie intégrée",
			"Profil entreprise",
		],
	},
	{
		key: "standard_plus",
		label: "Standard+",
		subtitle: "Le plus populaire",
		popular: true,
		Icon: Zap,
		color: "#7c3aed",
		bgLight: "#f5f3ff",
		bgDark: "#2e1065",
		borderActive: "#7c3aed",
		features: [
			"Tout Standard inclus",
			"Annonces Last Minute",
			"Statistiques avancées",
			"Publications illimitées",
			"Badge entreprise vérifié",
		],
	},
	{
		key: "premium",
		label: "Premium",
		subtitle: "Le meilleur de WeSafe",
		Icon: Star,
		color: "#d97706",
		bgLight: "#fffbeb",
		bgDark: "#422006",
		borderActive: "#d97706",
		features: [
			"Tout Standard+ inclus",
			"Support prioritaire 7j/7",
			"Mise en avant des annonces",
			"Tableau de bord analytique",
			"Accès API",
		],
	},
];

const PLAN_RANK = { standard: 0, standard_plus: 1, premium: 2 };

const SubscriptionScreen = () => {
	const {
		accessToken,
		userCompany,
		user,
		hasSubscription,
		checkSubscription,
	} = useAuth();
	const { getAll, getById } = useDataContext();
	const { isDark } = useTheme();
	const router = useRouter();

	const [subscriptions, setSubscriptions] = useState([]);
	const [subscriptionStatus, setSubscriptionStatus] = useState(null);

	const loadData = async () => {
		const [{ data }, companyData] = await Promise.all([
			getAll("subscriptions", "*", ``, 1, 5, "created_at.desc"),
			getById("companies", user.id, "subscription_status"),
		]);
		setSubscriptions(data);
		if (companyData) setSubscriptionStatus(companyData.subscription_status);
	};

	useFocusEffect(
		useCallback(() => {
			checkSubscription(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		loadData();
	}, [hasSubscription]);

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const currentRank =
		subscriptionStatus !== null
			? (PLAN_RANK[subscriptionStatus] ?? -1)
			: -1;
	const activeSub = subscriptions.length > 0 ? subscriptions[0] : null;

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}
			contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='xs'>
					<Heading
						size='2xl'
						style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
						Mon abonnement
					</Heading>
					<Text
						size='md'
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
						Gérez votre formule WeSafe
					</Text>
				</VStack>

				{/* Current plan summary */}
				{hasSubscription && subscriptionStatus && (
					<Box
						style={{
							borderRadius: 14,
							borderWidth: 1,
							padding: 16,
							backgroundColor: isDark
								? (PLANS.find(
										(p) => p.key === subscriptionStatus,
									)?.bgDark ?? "#1f2937")
								: (PLANS.find(
										(p) => p.key === subscriptionStatus,
									)?.bgLight ?? "#f5f3ff"),
							borderColor:
								PLANS.find((p) => p.key === subscriptionStatus)
									?.borderActive ?? "#3b82f6",
						}}>
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<VStack space='xs'>
								<Text
									size='xs'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textTransform: "uppercase",
										letterSpacing: 1,
									}}>
									Formule active
								</Text>
								<Text
									style={{
										fontWeight: "800",
										fontSize: 22,
										color:
											PLANS.find(
												(p) =>
													p.key ===
													subscriptionStatus,
											)?.color ?? "#7c3aed",
									}}>
									{PLANS.find(
										(p) => p.key === subscriptionStatus,
									)?.label ?? subscriptionStatus}
								</Text>
								{activeSub?.current_period_end && (
									<HStack
										space='xs'
										style={{
											alignItems: "center",
											marginTop: 2,
										}}>
										<Calendar
											size={13}
											color={
												isDark ? "#9ca3af" : "#6b7280"
											}
										/>
										<Text
											size='xs'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											{activeSub.status === "active"
												? "Renouvellement le "
												: "Actif jusqu'au "}
											{formatDate(
												activeSub.current_period_end,
											)}
										</Text>
									</HStack>
								)}
							</VStack>
							<Badge
								size='md'
								variant='solid'
								action='success'
								style={{ borderRadius: 20 }}>
								<BadgeText>Actif</BadgeText>
							</Badge>
						</HStack>
					</Box>
				)}

				{/* No subscription banner */}
				{!hasSubscription && (
					<Box
						style={{
							borderRadius: 14,
							borderWidth: 1,
							padding: 16,
							backgroundColor: isDark
								? "rgba(239,68,68,0.1)"
								: "#fef2f2",
							borderColor: isDark
								? "rgba(239,68,68,0.3)"
								: "#fecaca",
						}}>
						<HStack space='sm' style={{ alignItems: "center" }}>
							<AlertCircle size={18} color='#ef4444' />
							<Text
								style={{
									fontWeight: "600",
									color: "#ef4444",
									fontSize: 14,
								}}>
								Aucun abonnement actif
							</Text>
						</HStack>
						<Text
							size='sm'
							style={{
								color: isDark ? "#fca5a5" : "#b91c1c",
								marginTop: 4,
							}}>
							Choisissez une formule ci-dessous pour accéder aux
							fonctionnalités WeSafe.
						</Text>
					</Box>
				)}

				{/* Plan cards */}
				<VStack space='md'>
					<Text
						style={{
							fontWeight: "700",
							fontSize: 16,
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Nos formules
					</Text>
					{PLANS.map((plan) => {
						const planRank = PLAN_RANK[plan.key];
						const isCurrent =
							hasSubscription && plan.key === subscriptionStatus;
						const isLower =
							hasSubscription && planRank < currentRank;
						const isUpgrade =
							!hasSubscription || planRank > currentRank;

						return (
							<Box
								key={plan.key}
								style={{
									borderRadius: 14,
									borderWidth: isCurrent ? 2 : 1,
									borderColor: isCurrent
										? plan.borderActive
										: isDark
											? "#374151"
											: "#e5e7eb",
									backgroundColor: isDark
										? "#1f2937"
										: "#ffffff",
									overflow: "hidden",
									opacity: isLower ? 0.5 : 1,
								}}>
								{/* Plan header */}
								<Box
									style={{
										padding: 16,
										backgroundColor: isCurrent
											? isDark
												? plan.bgDark
												: plan.bgLight
											: "transparent",
										borderBottomWidth: 1,
										borderBottomColor: isDark
											? "#374151"
											: "#f3f4f6",
									}}>
									<HStack
										style={{
											alignItems: "center",
											justifyContent: "space-between",
										}}>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Box
												style={{
													width: 36,
													height: 36,
													borderRadius: 10,
													backgroundColor: isCurrent
														? isDark
															? plan.bgDark
															: plan.bgLight
														: isDark
															? "#374151"
															: "#f9fafb",
													justifyContent: "center",
													alignItems: "center",
													borderWidth: isCurrent
														? 0
														: 1,
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}>
												<plan.Icon
													size={18}
													color={
														isCurrent
															? plan.color
															: isDark
																? "#9ca3af"
																: "#6b7280"
													}
												/>
											</Box>
											<VStack space='xs'>
												<Text
													style={{
														fontWeight: "800",
														fontSize: 17,
														color: isCurrent
															? plan.color
															: isDark
																? "#f3f4f6"
																: "#111827",
													}}>
													{plan.label}
												</Text>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													{plan.subtitle}
												</Text>
											</VStack>
										</HStack>
										<HStack space='xs'>
											{plan.popular && !isCurrent && (
												<Badge
													size='sm'
													variant='solid'
													action='info'
													style={{
														borderRadius: 20,
													}}>
													<BadgeText>
														Populaire
													</BadgeText>
												</Badge>
											)}
											{isCurrent && (
												<Badge
													size='sm'
													variant='solid'
													action='success'
													style={{
														borderRadius: 20,
													}}>
													<BadgeText>
														Votre formule
													</BadgeText>
												</Badge>
											)}
										</HStack>
									</HStack>
								</Box>

								{/* Features */}
								<VStack space='xs' style={{ padding: 16 }}>
									{plan.features.map((feat, i) => (
										<HStack
											key={i}
											space='sm'
											style={{ alignItems: "center" }}>
											<Check
												size={14}
												color={
													isCurrent
														? plan.color
														: isDark
															? "#4b5563"
															: "#d1d5db"
												}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{feat}
											</Text>
										</HStack>
									))}

									{/* CTA */}
									{isUpgrade && !isLower && (
										<Box style={{ marginTop: 12 }}>
											<SubscriptionPaymentSheet
												company_id={userCompany?.id}
												email={user?.email}
												plan={plan.key}
											/>
										</Box>
									)}
								</VStack>
							</Box>
						);
					})}
				</VStack>

				{/* Cancel */}
				{hasSubscription && activeSub?.status === "active" && (
					<Box
						style={{
							borderRadius: 14,
							borderWidth: 1,
							padding: 16,
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
							borderColor: isDark ? "#374151" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<VStack space='xs'>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<AlertCircle size={16} color='#ef4444' />
									<Text
										style={{
											fontWeight: "700",
											fontSize: 15,
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Résilier l'abonnement
									</Text>
								</HStack>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									Vous pouvez annuler à tout moment. L'accès
									reste actif jusqu'à la fin de la période en
									cours.
								</Text>
							</VStack>
							<TouchableOpacity
								onPress={() =>
									router.push({
										pathname: "/cancelsubscription",
										params: {
											subscription_id:
												activeSub.stripe_subscription_id,
										},
									})
								}
								activeOpacity={0.75}
								style={{
									backgroundColor: isDark
										? "#450a0a"
										: "#fef2f2",
									borderRadius: 10,
									paddingVertical: 12,
									alignItems: "center",
									borderWidth: 1,
									borderColor: isDark ? "#7f1d1d" : "#fecaca",
								}}>
								<Text
									style={{
										fontWeight: "700",
										fontSize: 14,
										color: "#ef4444",
									}}>
									Annuler l'abonnement
								</Text>
							</TouchableOpacity>
						</VStack>
					</Box>
				)}
			</VStack>
		</ScrollView>
	);
};

export default SubscriptionScreen;
