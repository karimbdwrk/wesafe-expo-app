import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useStripePaymentHandler } from "../services/stripeApi";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Coins, CreditCard, Check, Zap } from "lucide-react-native";

const BuyCreditsScreen = () => {
	const { user, loadUserData, accessToken } = useAuth();
	const { getById, update } = useDataContext();
	const { isDark } = useTheme();
	const { initiateAndPresentPayment } = useStripePaymentHandler();

	const [loading, setLoading] = useState(false);
	const [credits, setCredits] = useState(0);
	const [companyId, setCompanyId] = useState(null);

	const loadCompanyCredits = async (id) => {
		setLoading(true);
		const data = await getById("companies", id, `last_minute_credits`);
		setCredits(data.last_minute_credits);
		setLoading(false);
	};

	const addCompanyCredits = async (id) => {
		setLoading(true);
		const data = await update("companies", id, {
			last_minute_credits: credits + 10,
		});
	};

	const fetchUserAndCredits = async () => {
		if (user) {
			setCompanyId(user.id);
			await loadCompanyCredits(user.id);
		} else {
			Alert.alert(
				"Erreur",
				"Vous devez être connecté pour acheter des crédits.",
			);
			navigation.navigate("Login");
		}
	};

	useFocusEffect(
		useCallback(() => {
			fetchUserAndCredits();
		}, [companyId]),
	);

	const handleBuyCredits = async () => {
		if (!companyId) {
			Alert.alert(
				"Erreur",
				"ID de l'entreprise manquant. Veuillez vous reconnecter.",
			);
			return;
		}
		setLoading(true);
		// Appelle la fonction Edge pour initier le paiement
		const result = await initiateAndPresentPayment(
			companyId,
			3000,
			"credits_pack",
		); // 3000 cents = 30 EUR

		if (result.success) {
			// Le webhook s'occupera d'ajouter les crédits en BDD. On rafraîchit l'affichage.
			Alert.alert("Succès", "Votre pack de 10 crédits a été acheté !");
			await addCompanyCredits(companyId); // Ajouter les crédits localement
			await loadCompanyCredits(companyId); // Recharger les crédits pour afficher la nouvelle quantité
			loadUserData(companyId, accessToken);
		}
		// Les messages d'erreur sont déjà gérés par initiateAndPresentPayment via Alert
		setLoading(false);
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
						Crédits Last Minute
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Achetez des crédits pour publier vos annonces en mode
						Last Minute
					</Text>
				</VStack>

				{/* Current Credits Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#e5e7eb",
					}}>
					<VStack space='md'>
						<HStack space='md' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 48,
									height: 48,
									borderRadius: 24,
									backgroundColor: "#dbeafe",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={Coins}
									size='xl'
									style={{ color: "#2563eb" }}
								/>
							</Box>
							<VStack style={{ flex: 1 }}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									Vos crédits disponibles
								</Text>
								<Heading
									size='2xl'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{loading ? "..." : credits}
								</Heading>
							</VStack>
						</HStack>
					</VStack>
				</Card>

				{/* Pack Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
						borderWidth: 2,
						borderColor: "#3b82f6",
					}}>
					<VStack space='lg'>
						<HStack
							space='sm'
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Pack de 10 crédits
							</Heading>
							<Badge size='lg' variant='solid' action='success'>
								<BadgeIcon as={Zap} />
								<BadgeText>-40%</BadgeText>
							</Badge>
						</HStack>

						<VStack space='sm'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: "#10b981" }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? "#d1d5db" : "#374151",
									}}>
									10 publications Last Minute
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: "#10b981" }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? "#d1d5db" : "#374151",
									}}>
									3€ par annonce au lieu de 5€
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: "#10b981" }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? "#d1d5db" : "#374151",
									}}>
									Économisez 20€ sur ce pack
								</Text>
							</HStack>
						</VStack>

						<Box
							style={{
								borderTopWidth: 1,
								borderTopColor: isDark ? "#4b5563" : "#e5e7eb",
								paddingTop: 16,
							}}>
							<HStack
								space='sm'
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<Text
									size='lg'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										fontWeight: "500",
									}}>
									Prix total
								</Text>
								<Heading
									size='2xl'
									style={{
										color: "#3b82f6",
									}}>
									30€
								</Heading>
							</HStack>
						</Box>

						<Button
							size='lg'
							action='primary'
							onPress={handleBuyCredits}
							isDisabled={loading || !companyId}
							style={{
								backgroundColor: "#3b82f6",
								borderRadius: 8,
							}}>
							{loading && <ButtonSpinner />}
							<ButtonText>
								{loading
									? "Traitement..."
									: "Acheter maintenant"}
							</ButtonText>
							{!loading && <Icon as={CreditCard} />}
						</Button>
					</VStack>
				</Card>

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
							💡 À propos des crédits Last Minute
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
								lineHeight: 20,
							}}>
							Les crédits Last Minute vous permettent de publier
							des annonces urgentes avec une visibilité accrue.
							Chaque crédit = 1 annonce Last Minute.
						</Text>
					</VStack>
				</Card>
			</VStack>
		</ScrollView>
	);
};

export default BuyCreditsScreen;
