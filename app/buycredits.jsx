import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { BUY_CREDITS } from "@/utils/activityEvents";
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
	const { getById, update, trackActivity } = useDataContext();
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
		trackActivity(BUY_CREDITS);
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
				backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
			}}
			contentContainerStyle={{ padding: 20 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading
						size='2xl'
						style={{
							color: isDark ? Colors.dark.text : Colors.light.text,
						}}>
						Crédits Last Minute
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? Colors.dark.muted : Colors.light.muted,
						}}>
						Achetez des crédits pour publier vos annonces en mode
						Last Minute
					</Text>
				</VStack>

				{/* Current Credits Card */}
				<Card
					style={{
						backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
						borderRadius: 12,
						padding: 20,
						borderWidth: 1,
						borderColor: isDark ? Colors.dark.border : Colors.light.border,
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
									style={{ color: Colors.light.tint }}
								/>
							</Box>
							<VStack style={{ flex: 1 }}>
								<Text
									size='sm'
									style={{
										color: isDark ? Colors.dark.muted : Colors.light.muted,
									}}>
									Vos crédits disponibles
								</Text>
								<Heading
									size='2xl'
									style={{
										color: isDark ? Colors.dark.text : Colors.light.text,
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
						backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
						borderRadius: 12,
						padding: 20,
						borderWidth: 2,
						borderColor: Colors.light.tint,
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
									color: isDark ? Colors.dark.text : Colors.light.text,
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
									style={{ color: Colors.light.success }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? Colors.dark.muted : Colors.light.muted,
									}}>
									10 publications Last Minute
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: Colors.light.success }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? Colors.dark.muted : Colors.light.muted,
									}}>
									3€ par annonce au lieu de 5€
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: Colors.light.success }}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? Colors.dark.muted : Colors.light.muted,
									}}>
									Économisez 20€ sur ce pack
								</Text>
							</HStack>
						</VStack>

						<Box
							style={{
								borderTopWidth: 1,
								borderTopColor: isDark ? Colors.dark.border : Colors.light.border,
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
										color: isDark ? Colors.dark.muted : Colors.light.muted,
										fontWeight: "500",
									}}>
									Prix total
								</Text>
								<Heading
									size='2xl'
									style={{
										color: Colors.light.tint,
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
								backgroundColor: Colors.light.tint,
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
								color: isDark ? Colors.dark.tint : Colors.light.tint,
								fontWeight: "600",
							}}>
							💡 À propos des crédits Last Minute
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : Colors.light.tint,
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
