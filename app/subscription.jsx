import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	Platform,
} from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScrollView } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
	CreditCard,
	CheckCircle,
	XCircle,
	Calendar,
	AlertCircle,
} from "lucide-react-native";

import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const SubscriptionScreen = () => {
	const {
		accessToken,
		userCompany,
		user,
		hasSubscription,
		checkSubscription,
	} = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const router = useRouter();

	const [subscriptions, setSubscriptions] = useState([]);

	const getAllSubscription = async () => {
		console.log("get all subs");
		const { data, totalCount } = await getAll(
			"subscriptions",
			"*",
			``,
			1,
			5,
			"created_at.desc",
		);
		console.log(data, totalCount);
		setSubscriptions(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			checkSubscription(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		console.log("has sub in sub screen :", hasSubscription);
		getAllSubscription();
	}, [hasSubscription]);

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}
			contentContainerStyle={{ padding: 20 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading
						size='2xl'
						style={{
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Mon abonnement
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Gérez votre abonnement WeSafe
					</Text>
				</VStack>

				{/* Status Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 24,
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#e5e7eb",
					}}>
					<VStack space='lg'>
						<HStack
							space='md'
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Icon
									as={CreditCard}
									size='xl'
									style={{
										color: hasSubscription
											? "#10b981"
											: isDark
												? "#9ca3af"
												: "#6b7280",
									}}
								/>
								<VStack>
									<Heading
										size='lg'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Statut
									</Heading>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{hasSubscription
											? "Abonnement actif"
											: "Aucun abonnement"}
									</Text>
								</VStack>
							</HStack>
							<Badge
								size='lg'
								variant='solid'
								action={hasSubscription ? "success" : "muted"}
								style={{
									borderRadius: 20,
								}}>
								<BadgeText>
									{hasSubscription ? "Actif" : "Inactif"}
								</BadgeText>
							</Badge>
						</HStack>

						{hasSubscription && subscriptions.length > 0 && (
							<VStack space='md'>
								<Box
									style={{
										height: 1,
										backgroundColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}
								/>
								<VStack space='sm'>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={Calendar}
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											{subscriptions[0].status ===
											"active"
												? "Renouvellement le"
												: "Abonnement jusqu'au"}
										</Text>
									</HStack>
									<Text
										size='md'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
										}}>
										{formatDate(
											subscriptions[0].current_period_end,
										)}
									</Text>
								</VStack>
							</VStack>
						)}
					</VStack>
				</Card>

				{/* Subscribe Card */}
				{!hasSubscription && (
					<Card
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							padding: 24,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='lg'>
							<VStack space='sm'>
								<Icon
									as={CheckCircle}
									size='xl'
									style={{
										color: "#3b82f6",
									}}
								/>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Accédez à tous les avantages
								</Heading>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									Souscrivez à l'abonnement WeSafe pour
									débloquer toutes les fonctionnalités
								</Text>
							</VStack>

							<SubscriptionPaymentSheet
								company_id={userCompany.id}
								email={user.email}
							/>
						</VStack>
					</Card>
				)}

				{/* Cancel Card */}
				{hasSubscription &&
					subscriptions.length > 0 &&
					subscriptions[0].status === "active" && (
						<Card
							style={{
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								padding: 24,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<VStack space='lg'>
								<VStack space='sm'>
									<Icon
										as={AlertCircle}
										size='lg'
										style={{
											color: "#ef4444",
										}}
									/>
									<Heading
										size='md'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Résilier l'abonnement
									</Heading>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Vous pouvez annuler votre abonnement à
										tout moment
									</Text>
								</VStack>

								<Button
									size='lg'
									action='negative'
									onPress={() =>
										router.push({
											pathname: "/cancelsubscription",
											params: {
												subscription_id:
													subscriptions[0]
														.stripe_subscription_id,
											},
										})
									}
									style={{
										backgroundColor: "#ef4444",
										borderRadius: 8,
									}}>
									<ButtonIcon as={XCircle} />
									<ButtonText>
										Annuler l'abonnement
									</ButtonText>
								</Button>
							</VStack>
						</Card>
					)}

				{/* Info Card */}
				<Card
					style={{
						backgroundColor: isDark
							? "rgba(59, 130, 246, 0.1)"
							: "rgba(59, 130, 246, 0.05)",
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: isDark
							? "rgba(59, 130, 246, 0.3)"
							: "rgba(59, 130, 246, 0.2)",
					}}>
					<VStack space='sm'>
						<Text
							size='sm'
							style={{
								color: isDark ? "#93c5fd" : "#2563eb",
								fontWeight: "600",
							}}>
							💡 À propos de l'abonnement
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
								lineHeight: 20,
							}}>
							L'abonnement WeSafe vous permet de publier des
							offres d'emploi, gérer vos candidatures et accéder à
							tous les outils professionnels de la plateforme.
						</Text>
					</VStack>
				</Card>
			</VStack>
		</ScrollView>
	);
};

export default SubscriptionScreen;
