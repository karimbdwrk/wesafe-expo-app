import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, Linking } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { createSupabaseClient } from "@/lib/supabase";
import { BUY_CREDITS, CREDITS_RECEIVED } from "@/utils/activityEvents";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
	Coins,
	Check,
	Zap,
	Lightbulb,
	ShieldCheck,
	ExternalLink,
} from "lucide-react-native";
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";

const { WEBSITE_URL = "https://wesafe-dashboard-gxat3vt1m-infowesafeapp-8042s-projects.vercel.app" } = Constants.expoConfig.extra;

const BuyCreditsScreen = () => {
	const { user, userCompany, accessToken } = useAuth();
	const { getById, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const router = useRouter();
	const toast = useToast();
	useEffect(() => {
		if (userCompany && userCompany.company_status !== "active") {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={ShieldCheck}
						color={isDark ? Colors.dark.muted : Colors.light.muted}
						title='Compte non activé'
						description='Votre entreprise doit être active pour accéder aux crédits.'
					/>
				),
			});
			router.replace("/dashboard");
		}
	}, [userCompany?.company_status]);

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

	const [credits, setCredits] = useState(0);

	const loadCompanyCredits = async () => {
		if (!user?.id) return;
		const data = await getById("companies", user.id, `last_minute_credits`);
		setCredits(data?.last_minute_credits ?? 0);
	};

	useFocusEffect(
		useCallback(() => {
			loadCompanyCredits();

			if (!user?.id || !accessToken) return;
			const supabase = createSupabaseClient(accessToken);
			const channel = supabase
				.channel(`buycredits-${user.id}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "companies",
						filter: `id=eq.${user.id}`,
					},
					(payload) => {
						const newCredits = payload.new?.last_minute_credits;
						if (newCredits === undefined) return;
						setCredits((prev) => {
							if (newCredits > prev) {
								trackActivity(CREDITS_RECEIVED, {
									previous_credits: prev,
									new_credits: newCredits,
									delta: newCredits - prev,
								});
							}
							return newCredits;
						});
					},
				)
				.subscribe();

			return () => {
				supabase.removeChannel(channel);
			};
		}, [user?.id, accessToken]),
	);

	const openWebsite = async (source = "banner") => {
		trackActivity(BUY_CREDITS, { source });
		const refreshToken = await SecureStore.getItemAsync("refresh_token");
		const base = `${WEBSITE_URL}/dashboard/billing`;
		if (accessToken && refreshToken) {
			await Linking.openURL(`${base}#access_token=${accessToken}&refresh_token=${refreshToken}&token_type=bearer`);
		} else {
			await Linking.openURL(base);
		}
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
					{/* <Heading size='2xl' style={{ color: textPrimary }}>
						Crédits Last Minute
					</Heading> */}
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
									{credits}
								</Heading>
							</VStack>
						</HStack>
					</VStack>
				</Card>

				{/* Website redirect banner */}
				<TouchableOpacity
					onPress={() => openWebsite("banner")}
					activeOpacity={0.8}
					style={{
						borderRadius: 14,
						borderWidth: 1,
						borderColor: warning,
						backgroundColor: isDark ? Colors.dark.elevated : warning20,
						padding: 16,
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
					}}>
					<Box
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							backgroundColor: warning,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<ExternalLink size={20} color='#fff' />
					</Box>
					<VStack style={{ flex: 1 }} space='xs'>
						<Text style={{ fontWeight: "800", fontSize: 15, color: warning }}>
							Acheter des crédits sur wesafe.fr
						</Text>
						<Text size='sm' style={{ color: isDark ? Colors.dark.muted : Colors.light.muted }}>
							Les achats se font sur notre site web. Venez la chercher.
						</Text>
					</VStack>
				</TouchableOpacity>

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
								<Icon as={Check} size='sm' style={{ color: success }} />
								<Text size='md' style={{ color: muted }}>
									10 publications Last Minute
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon as={Check} size='sm' style={{ color: success }} />
								<Text size='md' style={{ color: muted }}>
									3€ par annonce au lieu de 5€
								</Text>
							</HStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon as={Check} size='sm' style={{ color: success }} />
								<Text size='md' style={{ color: muted }}>
									Économisez 20€ sur ce pack
								</Text>
							</HStack>
						</VStack>

						<Box style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 16 }}>
							<HStack space='sm' style={{ alignItems: "center", justifyContent: "space-between" }}>
								<Text size='lg' style={{ color: muted, fontWeight: "500" }}>
									Prix total
								</Text>
								<Heading size='2xl' style={{ color: warning }}>
									30€
								</Heading>
							</HStack>
						</Box>

						<TouchableOpacity
							onPress={() => openWebsite("pack_10_credits")}
							activeOpacity={0.8}
							style={{
								backgroundColor: warning,
								borderRadius: 8,
								paddingVertical: 14,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
							}}>
							<ExternalLink size={18} color='#fff' />
							<Text style={{ fontWeight: "700", fontSize: 15, color: "#fff" }}>
								Acheter sur le site
							</Text>
						</TouchableOpacity>
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
