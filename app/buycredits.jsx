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
import { Coins, CreditCard, Check, Zap, Lightbulb } from "lucide-react-native";

const BuyCreditsScreen = () => {
	const { user, loadUserData, accessToken } = useAuth();
	const { getById, update, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const { initiateAndPresentPayment } = useStripePaymentHandler();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const border = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const warning = isDark ? Colors.dark.warning : Colors.light.warning;
	const warning20 = isDark ? Colors.dark.warning20 : Colors.light.warning20;
	const warning50 = isDark ? Colors.dark.warning50 : Colors.light.warning50;
	const success = isDark ? Colors.dark.success : Colors.light.success;

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
		const result = await initiateAndPresentPayment(
			companyId,
			3000,
			"credits_pack",
		); // 3000 cents = 30 EUR

		if (result.success) {
			Alert.alert("Succès", "Votre pack de 10 crédits a été acheté !");
			await addCompanyCredits(companyId);
			await loadCompanyCredits(companyId);
			loadUserData(companyId, accessToken);
		}
		setLoading(false);
	};

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: bg,
			}}
			contentContainerStyle={{ padding: 20 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading size='2xl' style={{ color: textPrimary }}>
						Crédits Last Minute
					</Heading>
					<Text size='md' style={{ color: muted }}>
						Achetez des crédits pour publier vos annonces en mode
						Last Minute
					</Text>
				</VStack>

				{/* Current Credits Card */}
				<Card
					style={{
						backgroundColor: cardBg,
						borderRadius: 12,
						padding: 20,
						borderWidth: 1,
						borderColor: border,
					}}>
					<VStack space='md'>
						<HStack space='md' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 48,
									height: 48,
									borderRadius: 24,
									backgroundColor: warning20,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={Coins}
									size='xl'
									style={{ color: warning }}
								/>
							</Box>
							<VStack style={{ flex: 1 }}>
								<Text size='sm' style={{ color: muted }}>
									Vos crédits disponibles
								</Text>
								<Heading
									size='2xl'
									style={{ color: textPrimary }}>
									{loading ? "..." : credits}
								</Heading>
							</VStack>
						</HStack>
					</VStack>
				</Card>

				{/* Pack Card */}
				<Card
					style={{
						backgroundColor: cardBg,
						borderRadius: 12,
						padding: 20,
						borderWidth: 2,
						borderColor: warning,
					}}>
					<VStack space='lg'>
						<HStack
							space='sm'
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<Heading size='xl' style={{ color: textPrimary }}>
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
									style={{ color: success }}
								/>
								<Text size='md' style={{ color: muted }}>
									10 publications Last Minute
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: success }}
								/>
								<Text size='md' style={{ color: muted }}>
									3€ par annonce au lieu de 5€
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Check}
									size='sm'
									style={{ color: success }}
								/>
								<Text size='md' style={{ color: muted }}>
									Économisez 20€ sur ce pack
								</Text>
							</HStack>
						</VStack>

						<Box
							style={{
								borderTopWidth: 1,
								borderTopColor: border,
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
									style={{ color: muted, fontWeight: "500" }}>
									Prix total
								</Text>
								<Heading size='2xl' style={{ color: warning }}>
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
								backgroundColor: warning,
								borderRadius: 8,
							}}>
							{loading && <ButtonSpinner color='#ffffff' />}
							<ButtonText style={{ color: "#ffffff" }}>
								{loading
									? "Traitement..."
									: "Acheter maintenant"}
							</ButtonText>
							{!loading && (
								<Icon as={CreditCard} color='#ffffff' />
							)}
						</Button>
					</VStack>
				</Card>

				{/* Info Card */}
				<Card
					style={{
						backgroundColor: warning20,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: warning50,
					}}>
					<VStack space='sm'>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Lightbulb size={16} color={warning} />
							<Text
								size='sm'
								style={{
									color: warning,
									fontFamily: "Inter_700Bold",
								}}>
								À propos des crédits Last Minute
							</Text>
						</HStack>
						<Text
							size='sm'
							style={{ color: warning, lineHeight: 20 }}>
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
