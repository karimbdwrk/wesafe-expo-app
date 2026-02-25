import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useFocusEffect, Stack } from "expo-router";
// import { useLocalSearchParams } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import axios from "axios";
import Constants from "expo-constants";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";

import {
	BadgeCheck,
	Building2,
	Briefcase,
	Users2,
	Pencil,
	Stamp,
	Signature,
	QrCode,
	CreditCard,
	ChevronRight,
	FileText,
	Settings,
	LogOut,
	ScanLine,
	Users,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import { createSupabaseClient } from "@/lib/supabase";

import LogoUploader from "@/components/LogoUploader";
import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

// Formater le SIRET avec des espaces : 123 456 789 00013
const formatSiret = (value) => {
	if (!value) return value;
	const cleaned = value.toString().replace(/\s/g, "");
	const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,5})$/);
	if (match) {
		return [match[1], match[2], match[3], match[4]]
			.filter(Boolean)
			.join(" ");
	}
	return value;
};

const DashboardScreen = () => {
	const { signOut, user, hasSubscription, accessToken } = useAuth();
	const { getById } = useDataContext();
	const { image } = useImage();
	const { isDark } = useTheme();

	const router = useRouter();

	const [company, setCompany] = useState(null);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [notifCount, setNotifCount] = useState(0);

	const fetchNotifCount = useCallback(async () => {
		if (!user?.id || !accessToken) return;
		try {
			const supabase = createSupabaseClient(accessToken);
			const { count, error } = await supabase
				.from("applications")
				.select("id", { count: "exact", head: true })
				.eq("company_id", user.id)
				.eq("company_notification", true);
			setNotifCount(error ? 0 : (count ?? 0));
		} catch (e) {
			setNotifCount(0);
		}
	}, [user?.id, accessToken]);

	const loadData = async () => {
		if (!user?.id) return;
		const data = await getById("companies", user.id, `*`);
		console.log("Company data:", data);
		setCompany(data);
		await fetchNotifCount();
	};

	useFocusEffect(
		useCallback(() => {
			if (!user?.id) return;
			loadData();

			// Souscription Realtime : écoute la table notifications (même pattern que applicationspro)
			const supabase = createSupabaseClient(accessToken);
			const channel = supabase
				.channel(`dashboard-notif-${user?.id}`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "notifications",
						filter: `recipient_id=eq.${user?.id}`,
					},
					() => fetchNotifCount(),
				)
				.subscribe();

			return () => {
				supabase.removeChannel(channel);
			};
		}, [user?.id, accessToken]),
	);

	const ActionCard = ({
		icon,
		title,
		subtitle,
		onPress,
		badgeText,
		badgeColor,
	}) => (
		<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
			<Card
				style={{
					padding: 16,
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderRadius: 12,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<HStack
					style={{
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<HStack
						space='md'
						style={{ flex: 1, alignItems: "center" }}>
						<Box
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={icon}
								size='lg'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
						</Box>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								size='md'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								{title}
							</Text>
							{subtitle && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{subtitle}
								</Text>
							)}
						</VStack>
					</HStack>
					<HStack space='sm' style={{ alignItems: "center" }}>
						{badgeText && (
							<Badge
								size='sm'
								variant='solid'
								action={badgeColor || "success"}>
								<BadgeText>{badgeText}</BadgeText>
							</Badge>
						)}
						<Icon
							as={ChevronRight}
							size='lg'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}
						/>
					</HStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: {
						backgroundColor: "white",
					},
					headerRight: () => (
						<TouchableOpacity
							style={{
								backgroundColor: "transparent",
							}}
							onPress={() => router.push("/scanner")}
							activeOpacity={0.7}>
							<Icon
								as={ScanLine}
								size='xl'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
						</TouchableOpacity>
					),
				}}
			/>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				showsVerticalScrollIndicator={false}>
				<Box style={{ padding: 20, paddingBottom: 40 }}>
					<VStack space='2xl'>
						{/* Header */}
						{/* <VStack space='md'>
						<Heading
							size='2xl'
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Tableau de bord
						</Heading>
						<Text
							size='md'
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
							Gérez votre entreprise et vos documents
						</Text>
					</VStack> */}

						{/* Company Info Card */}
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<VStack space='lg'>
								{/* Logo Section - Centré et cliquable */}
								<VStack
									space='md'
									style={{ alignItems: "center" }}>
									<LogoUploader image={image} />
								</VStack>

								<Divider />

								<HStack
									style={{
										alignItems: "center",
										justifyContent: "space-between",
									}}>
									<VStack style={{ flex: 1 }} space='xs'>
										<HStack
											space='sm'
											style={{
												alignItems: "center",
												justifyContent: "space-between",
											}}>
											<Text
												size='lg'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{company?.name ||
													"Mon entreprise"}
											</Text>
											{company?.isConfirmed && (
												<Badge
													size='sm'
													variant='solid'
													action='success'>
													<BadgeIcon
														as={BadgeCheck}
														className='mr-1'
													/>
													<BadgeText>
														Vérifié
													</BadgeText>
												</Badge>
											)}
										</HStack>
										{company?.siret && (
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												SIRET:{" "}
												{formatSiret(company.siret)}
											</Text>
										)}
									</VStack>
								</HStack>

								{company?.description && (
									<>
										<Divider />
										<Text
											size='sm'
											style={{
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}>
											{company.description}
										</Text>
									</>
								)}

								<Divider />

								{/* Subscription Status */}
								<TouchableOpacity
									onPress={() => router.push("/subscription")}
									activeOpacity={0.7}>
									<HStack
										style={{
											alignItems: "center",
											justifyContent: "space-between",
										}}>
										<HStack
											space='sm'
											style={{
												alignItems: "center",
												flex: 1,
												justifyContent: "space-between",
												paddingRight: 10,
											}}>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Statut d'abonnement
											</Text>
											<Badge
												size='md'
												variant='solid'
												action={
													hasSubscription
														? "success"
														: "muted"
												}>
												<BadgeText>
													{hasSubscription
														? "Premium"
														: "Standard"}
												</BadgeText>
											</Badge>
										</HStack>
										<Icon
											as={ChevronRight}
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</HStack>
								</TouchableOpacity>

								<Divider />
								{/* Subscription Status */}
								<TouchableOpacity
									onPress={() => router.push("/buycredits")}
									activeOpacity={0.7}>
									<HStack
										style={{
											alignItems: "center",
											justifyContent: "space-between",
										}}>
										<HStack
											space='sm'
											style={{
												alignItems: "center",
												flex: 1,
												justifyContent: "space-between",
												paddingRight: 10,
											}}>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Crédits LastMinute
											</Text>
											<Badge
												size='md'
												variant='solid'
												action={
													company?.last_minute_credits
														? "info"
														: "error"
												}>
												<BadgeText>
													{
														company?.last_minute_credits
													}
												</BadgeText>
											</Badge>
										</HStack>
										<Icon
											as={ChevronRight}
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</HStack>
								</TouchableOpacity>
							</VStack>
						</Card>

						{/* Actions Section */}
						<VStack space='md'>
							<Text
								size='lg'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Actions rapides
							</Text>

							<ActionCard
								icon={Pencil}
								title="Modifier l'entreprise"
								subtitle='Mettre à jour les informations'
								onPress={() => {
									router.push({
										pathname: "/updatecompany",
										params: {
											companyName: company?.name,
											companySiret: company?.siret,
											companyDescription:
												company?.description,
										},
									});
								}}
							/>
							<ActionCard
								icon={FileText}
								title='Vérification KBIS'
								subtitle='Télécharger votre extrait KBIS'
								onPress={() => {
									router.push({
										pathname: "/kbisdocumentverification",
									});
								}}
								badgeText={
									!company?.kbis_url
										? "manquant"
										: company?.kbis_verification_status ===
											  "pending"
											? "En attente"
											: company?.kbis_verification_status ===
												  "verified"
												? "Vérifié"
												: company?.kbis_verification_status ===
													  "rejected"
													? "Rejeté"
													: null
								}
								badgeColor={
									!company?.kbis_url
										? "error"
										: company?.kbis_verification_status ===
											  "pending"
											? "warning"
											: company?.kbis_verification_status ===
												  "verified"
												? "success"
												: company?.kbis_verification_status ===
													  "rejected"
													? "error"
													: null
								}
							/>

							<ActionCard
								icon={Signature}
								title='Signature'
								subtitle='Gérer votre signature'
								onPress={() => {
									router.push({
										pathname: "/signature",
										params: {
											signatureUrl:
												company?.signature_url,
											type: "companies",
										},
									});
								}}
								badgeText={
									!company?.signature_url
										? "manquante"
										: undefined
								}
								badgeColor={
									!company?.signature_url
										? "error"
										: undefined
								}
							/>

							<ActionCard
								icon={Stamp}
								title='Tampon'
								subtitle="Gérer le tampon de l'entreprise"
								onPress={() => {
									router.push({
										pathname: "/stamp",
										params: {
											companyName: company?.name,
										},
									});
								}}
								badgeText={
									!company?.stamp_url ? "manquant" : undefined
								}
								badgeColor={
									!company?.stamp_url ? "error" : undefined
								}
							/>

							<Divider style={{ marginVertical: 16 }} />

							<ActionCard
								icon={Briefcase}
								title='Mes offres'
								subtitle="Gérer vos offres d'emploi"
								onPress={() => {
									router.push({
										pathname: "/offers",
									});
								}}
							/>

							<ActionCard
								icon={Users}
								title='Mes candidatures'
								subtitle='Gérer vos candidatures'
								onPress={() => {
									router.push({
										pathname: "/applicationspro",
									});
								}}
								badgeText={
									notifCount > 0 ? `${notifCount}` : undefined
								}
								badgeColor={
									notifCount > 0 ? "error" : undefined
								}
							/>

							<Divider style={{ marginVertical: 16 }} />

							<ActionCard
								icon={Settings}
								title='Paramètres'
								subtitle="Paramètres de l'application"
								onPress={() => router.push("/settings")}
							/>
						</VStack>
						<Divider />
						{/* Déconnexion */}
						<Button
							action='negative'
							onPress={() => setShowLogoutDialog(true)}
							style={{ marginTop: 8 }}>
							<ButtonIcon as={LogOut} />
							<ButtonText>Déconnexion</ButtonText>
						</Button>
					</VStack>

					{/* Modal de confirmation de déconnexion */}
					<AlertDialog
						isOpen={showLogoutDialog}
						onClose={() => setShowLogoutDialog(false)}>
						<AlertDialogBackdrop />
						<AlertDialogContent
							style={{
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								padding: 24,
							}}>
							<AlertDialogHeader>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Déconnexion
								</Heading>
							</AlertDialogHeader>
							<AlertDialogBody>
								<Text
									style={{
										color: isDark ? "#d1d5db" : "#4b5563",
										marginTop: 8,
									}}>
									Êtes-vous sûr de vouloir vous déconnecter ?
								</Text>
							</AlertDialogBody>
							<AlertDialogFooter style={{ marginTop: 24 }}>
								<HStack space='md' style={{ width: "100%" }}>
									<Button
										variant='outline'
										action='secondary'
										onPress={() =>
											setShowLogoutDialog(false)
										}
										style={{ flex: 1 }}>
										<ButtonText>Annuler</ButtonText>
									</Button>
									<Button
										action='negative'
										onPress={() => {
											setShowLogoutDialog(false);
											signOut();
										}}
										style={{ flex: 1 }}>
										<ButtonText>Déconnexion</ButtonText>
									</Button>
								</HStack>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</Box>
			</ScrollView>
		</>
	);
};

export default DashboardScreen;
