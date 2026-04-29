import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
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
import Colors from "@/constants/Colors";

const PLANS = [
	{
		key: "standard",
		label: "Standard",
		subtitle: "Pour commencer à recruter",
		Icon: CreditCard,
		color: "#6b7280",
		bgLight: "#f9fafb",
		bgDark: "#1f2937",
		borderActive: "#6b7280",
		priceMonthly: null,
		priceYearly: null,
		features: [
			"3 offres publiées par mois",
			"Suivi des candidatures",
			"Support par email",
		],
	},
	{
		key: "standard_plus",
		label: "Standard+",
		subtitle: "L'essentiel pour gérer \nvos recrutements efficacement",
		popular: true,
		Icon: Zap,
		color: "#3b82f6",
		bgLight: "#eff6ff",
		bgDark: "#1e3a5f",
		borderActive: "#3b82f6",
		priceMonthly: 19,
		priceYearly: 199,
		features: [
			"10 offres publiées par mois",
			"Annonces prioritaires",
			"Suivi des candidatures",
			"Messagerie interne candidatures",
			"Messagerie de support prioritaire",
			"Badge entreprise vérifiée",
		],
	},
	{
		key: "premium",
		label: "Premium",
		subtitle: "Le meilleur de WeSafe",
		Icon: Star,
		color: "#16a34a",
		bgLight: "#f0fdf4",
		bgDark: "#14532d",
		borderActive: "#16a34a",
		priceMonthly: 25,
		priceYearly: 249,
		features: [
			"Annonces illimitées",
			"Annonces prioritaires",
			"Suivi des candidatures",
			"Messagerie interne candidatures",
			"Génération de contrats",
			"Répertoire candidats",
			"Messagerie de support prioritaire",
			"Badge entreprise vérifiée",
		],
	},
];

const PLAN_RANK = { standard: 0, standard_plus: 1, premium: 2 };

const SubscriptionScreen = () => {
	const { accessToken, userCompany, user, checkSubscription, refreshUser } =
		useAuth();
	const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
	const { getAll } = useDataContext();
	const { isDark } = useTheme();
	const router = useRouter();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const elevated = isDark ? Colors.dark.elevated : Colors.light.elevated;
	const border = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark
		? Colors.dark.textSecondary
		: Colors.light.textSecondary;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const success = isDark ? Colors.dark.success : Colors.light.success;
	const success20 = isDark ? Colors.dark.success20 : Colors.light.success20;
	const danger = isDark ? Colors.dark.danger : Colors.light.danger;
	const danger20 = isDark ? Colors.dark.danger20 : Colors.light.danger20;
	const danger50 = isDark ? Colors.dark.danger50 : Colors.light.danger50;

	const [subscriptions, setSubscriptions] = useState([]);
	const [interval, setInterval] = useState("monthly");
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);

	const handleCancel = async () => {
		if (!activeSub?.stripe_subscription_id) return;
		setCancelLoading(true);
		try {
			await axios.post(
				`${SUPABASE_URL}/functions/v1/cancel-subscription`,
				{ subscriptionId: activeSub.stripe_subscription_id },
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);
			// On ne touche PAS à subscription_status ici :
			// l'accès reste actif jusqu'à current_period_end.
			// Le downgrade se fait via webhook Stripe à expiration.
			const canceledPlan =
				userCompany?.subscription_status || "standard_plus";
			const canceledInterval = activeSub?.interval || "monthly";
			const canceledPeriodEnd = activeSub?.current_period_end;
			setShowCancelDialog(false);
			await refreshUser();
			await loadData();

			// Email de confirmation de résiliation
			try {
				await axios.post(
					`${SUPABASE_URL}/functions/v1/send-subscription-confirmation-email`,
					{
						firstName:
							userCompany?.legal_representative_firstname || "",
						email: user?.email,
						companyName: userCompany?.name || "",
						plan: canceledPlan,
						interval: canceledInterval,
						action: "cancel",
						periodEnd: canceledPeriodEnd,
					},
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/json",
						},
					},
				);
				console.log("✅ Email résiliation envoyé");
			} catch (emailErr) {
				console.error(
					"❌ Erreur email résiliation:",
					emailErr.response?.data ?? emailErr.message,
				);
			}
		} catch (err) {
			console.error(
				"❌ Erreur résiliation:",
				err.response?.data ?? err.message,
			);
		} finally {
			setCancelLoading(false);
		}
	};

	const loadData = async () => {
		const { data } = await getAll(
			"subscriptions",
			"*",
			``,
			1,
			5,
			"created_at.desc",
		);
		setSubscriptions(data);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	useEffect(() => {
		loadData();
	}, []);

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const activeSub = subscriptions.length > 0 ? subscriptions[0] : null;

	const resolvedStatus = userCompany?.subscription_status ?? "standard";
	const currentRank = PLAN_RANK[resolvedStatus] ?? -1;

	const isExpiredOrCanceled =
		!activeSub ||
		(activeSub.status === "canceled" &&
			new Date(activeSub.current_period_end) <= new Date());

	const activePlan = PLANS.find((p) => p.key === resolvedStatus);
	const activeInterval = isExpiredOrCanceled
		? null
		: (activeSub?.interval ?? null);
	const activeIntervalLabel =
		activeInterval === "yearly"
			? "Annuel"
			: activeInterval === "monthly"
				? "Mensuel"
				: null;
	const activePrice =
		activeInterval === "yearly"
			? activePlan?.priceYearly
			: activePlan?.priceMonthly;

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: bg }}
			contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
			<VStack space='xl'>
				{/* Current plan summary */}
				{resolvedStatus && (
					<Box
						style={{
							borderRadius: 14,
							borderWidth: 1,
							padding: 16,
							backgroundColor: isDark
								? (activePlan?.bgDark ?? "#1f2937")
								: (activePlan?.bgLight ?? "#f5f3ff"),
							borderColor: activePlan?.borderActive ?? "#3b82f6",
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
										color: muted,
										textTransform: "uppercase",
										letterSpacing: 1,
									}}>
									Formule active
								</Text>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Text
										style={{
											fontWeight: "800",
											fontSize: 22,
											color:
												activePlan?.color ?? "#7c3aed",
										}}>
										{activePlan?.label ?? resolvedStatus}
									</Text>
									{activeIntervalLabel && (
										<Badge
											size='sm'
											variant='outline'
											style={{
												borderRadius: 20,
												borderColor:
													activePlan?.color ??
													"#7c3aed",
											}}>
											<BadgeText
												style={{
													color:
														activePlan?.color ??
														"#7c3aed",
												}}>
												{activeIntervalLabel}
											</BadgeText>
										</Badge>
									)}
								</HStack>
								{activePrice && (
									<Text
										size='sm'
										style={{
											color: muted,
										}}>
										{activePrice}€ /{" "}
										{activeInterval === "yearly"
											? "an"
											: "mois"}
									</Text>
								)}
								{activeSub?.current_period_end && (
									<HStack
										space='xs'
										style={{
											alignItems: "center",
											marginTop: 2,
										}}>
										<Calendar size={13} color={muted} />
										<Text
											size='xs'
											style={{
												color: muted,
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
								action={
									resolvedStatus === "standard"
										? "muted"
										: "success"
								}
								style={{ borderRadius: 20 }}>
								<BadgeText>
									{resolvedStatus === "standard"
										? "Gratuit"
										: "Actif"}
								</BadgeText>
							</Badge>
						</HStack>
					</Box>
				)}

				{/* Plan cards */}
				<VStack space='md'>
					<HStack
						style={{
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								fontWeight: "700",
								fontSize: 16,
								color: textPrimary,
							}}>
							Nos formules
						</Text>
						{/* Toggle mensuel / annuel */}
						<HStack
							style={{
								backgroundColor: elevated,
								borderRadius: 20,
								padding: 3,
							}}>
							<TouchableOpacity
								onPress={() => setInterval("monthly")}
								style={{
									paddingHorizontal: 12,
									paddingVertical: 5,
									borderRadius: 18,
									backgroundColor:
										interval === "monthly"
											? cardBg
											: "transparent",
								}}>
								<Text
									size='sm'
									style={{
										fontWeight:
											interval === "monthly"
												? "700"
												: "400",
										color:
											interval === "monthly"
												? textPrimary
												: muted,
									}}>
									Mensuel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setInterval("yearly")}
								style={{
									paddingHorizontal: 12,
									paddingVertical: 5,
									borderRadius: 18,
									backgroundColor:
										interval === "yearly"
											? cardBg
											: "transparent",
								}}>
								<Text
									size='sm'
									style={{
										fontWeight:
											interval === "yearly"
												? "700"
												: "400",
										color:
											interval === "yearly"
												? textPrimary
												: muted,
									}}>
									Annuel
								</Text>
							</TouchableOpacity>
						</HStack>
					</HStack>
					{PLANS.map((plan) => {
						const planRank = PLAN_RANK[plan.key];
						const isCurrent = plan.key === resolvedStatus;
						const isLower = planRank < currentRank;
						const isUpgrade = planRank > currentRank;

						return (
							<Box
								key={plan.key}
								style={{
									borderRadius: 14,
									borderWidth: isCurrent ? 2 : 1,
									borderColor: isCurrent
										? plan.borderActive
										: border,
									backgroundColor: cardBg,
									overflow: "hidden",
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
										borderBottomColor: elevated,
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
														: elevated,
													justifyContent: "center",
													alignItems: "center",
													borderWidth: isCurrent
														? 0
														: 1,
													borderColor: border,
												}}>
												<plan.Icon
													size={18}
													color={
														isCurrent
															? plan.color
															: muted
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
															: textPrimary,
													}}>
													{plan.label}
												</Text>
												<Text
													size='xs'
													style={{
														color: muted,
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

								{/* Pricing */}
								<Box
									style={{
										paddingHorizontal: 16,
										paddingVertical: 14,
										borderBottomWidth: 1,
										borderBottomColor: elevated,
									}}>
									{plan.priceMonthly === null ? (
										<Text
											style={{
												fontWeight: "800",
												fontSize: 22,
												color: plan.color,
											}}>
											Gratuit
										</Text>
									) : (
										<VStack space='xs'>
											<HStack
												space='xs'
												style={{
													alignItems: "flex-end",
												}}>
												<Text
													style={{
														fontWeight: "800",
														fontSize: 26,
														color: plan.color,
														lineHeight: 28,
													}}>
													{interval === "yearly"
														? plan.priceYearly
														: plan.priceMonthly}
													€
												</Text>
												<Text
													size='sm'
													style={{
														color: muted,
														marginBottom: 2,
													}}>
													{interval === "yearly"
														? "/ an"
														: "/ mois"}
												</Text>
											</HStack>
											{interval === "yearly" ? (
												<Box
													style={{
														backgroundColor:
															success20,
														borderRadius: 6,
														paddingHorizontal: 6,
														paddingVertical: 2,
														alignSelf: "flex-start",
													}}>
													<Text
														size='xs'
														style={{
															fontWeight: "700",
															color: success,
														}}>
														-
														{Math.round(
															(1 -
																plan.priceYearly /
																	(plan.priceMonthly *
																		12)) *
																100,
														)}
														% vs mensuel
													</Text>
												</Box>
											) : (
												<Text
													size='xs'
													style={{
														color: muted,
													}}>
													ou{" "}
													<Text
														size='xs'
														style={{
															fontWeight: "700",
															color: textPrimary,
														}}>
														{plan.priceYearly}€
													</Text>{" "}
													/ an{" "}
													<Text
														size='xs'
														style={{
															fontWeight: "700",
															color: success,
														}}>
														(-
														{Math.round(
															(1 -
																plan.priceYearly /
																	(plan.priceMonthly *
																		12)) *
																100,
														)}
														%)
													</Text>
												</Text>
											)}
										</VStack>
									)}
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
														: border
												}
											/>
											<Text
												size='sm'
												style={{
													color: textSecondary,
												}}>
												{feat}
											</Text>
										</HStack>
									))}

									{/* CTA */}
									{!isCurrent && plan.key !== "standard" && (
										<Box style={{ marginTop: 12 }}>
											<SubscriptionPaymentSheet
												company_id={userCompany?.id}
												email={user?.email}
												plan={plan.key}
												interval={interval}
												companyName={userCompany?.name}
												firstName={
													userCompany?.legal_representative_firstname
												}
											/>
										</Box>
									)}
								</VStack>
							</Box>
						);
					})}
				</VStack>

				{/* Cancel */}
				{resolvedStatus !== "standard" &&
					activeSub?.status === "active" && (
						<Box
							style={{
								borderRadius: 14,
								borderWidth: 1,
								padding: 16,
								backgroundColor: cardBg,
								borderColor: border,
							}}>
							<VStack space='md'>
								<VStack space='xs'>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<AlertCircle
											size={16}
											color='#ef4444'
										/>
										<Text
											style={{
												fontWeight: "700",
												fontSize: 15,
												color: textPrimary,
											}}>
											Résilier l'abonnement
										</Text>
									</HStack>
									<Text
										size='sm'
										style={{
											color: muted,
										}}>
										L'accès reste actif jusqu'à la fin de la
										période en cours.
									</Text>
								</VStack>
								<TouchableOpacity
									onPress={() => setShowCancelDialog(true)}
									activeOpacity={0.75}
									style={{
										backgroundColor: danger20,
										borderRadius: 10,
										paddingVertical: 12,
										alignItems: "center",
										borderWidth: 1,
										borderColor: danger50,
									}}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 14,
											color: danger,
										}}>
										Annuler l'abonnement
									</Text>
								</TouchableOpacity>

								<AlertDialog
									isOpen={showCancelDialog}
									onClose={() => setShowCancelDialog(false)}>
									<AlertDialogBackdrop />
									<AlertDialogContent
										style={{
											backgroundColor: cardBg,
											borderRadius: 14,
											padding: 24,
										}}>
										<AlertDialogHeader>
											<Heading
												size='md'
												style={{
													color: textPrimary,
												}}>
												Annuler l'abonnement
											</Heading>
										</AlertDialogHeader>
										<AlertDialogBody>
											<Text
												size='sm'
												style={{
													color: textSecondary,
													marginTop: 8,
												}}>
												Votre abonnement sera résilié
												immédiatement et votre compte
												repassera en Standard (gratuit).
											</Text>
										</AlertDialogBody>
										<AlertDialogFooter
											style={{ marginTop: 20 }}>
											<HStack
												space='md'
												style={{ width: "100%" }}>
												<Button
													variant='outline'
													action='secondary'
													onPress={() =>
														setShowCancelDialog(
															false,
														)
													}
													style={{ flex: 1 }}
													disabled={cancelLoading}>
													<ButtonText>
														Garder
													</ButtonText>
												</Button>
												<Button
													action='negative'
													onPress={handleCancel}
													style={{ flex: 1 }}
													disabled={cancelLoading}>
													{cancelLoading ? (
														<ActivityIndicator
															color='#fff'
															size='small'
														/>
													) : (
														<ButtonText>
															Confirmer
														</ButtonText>
													)}
												</Button>
											</HStack>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</VStack>
						</Box>
					)}
			</VStack>
		</ScrollView>
	);
};

export default SubscriptionScreen;
