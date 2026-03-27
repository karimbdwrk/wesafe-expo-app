import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	useRouter,
	useFocusEffect,
	Stack,
	useLocalSearchParams,
} from "expo-router";
import {
	ScrollView,
	TouchableOpacity,
	Dimensions,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
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
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
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
	BookUser,
	MessageSquare,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { createSupabaseClient } from "@/lib/supabase";

import LogoUploader from "@/components/LogoUploader";
import { OPEN_SUPPORT_CHAT, SIGN_OUT } from "@/utils/activityEvents";
import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";
import MessageThread from "@/components/MessageThread";

const { SUPABASE_URL, SUPABASE_API_KEY, SUPERADMIN_ID } =
	Constants.expoConfig.extra;

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
	const { signOut, user, hasSubscription, userCompany, accessToken } =
		useAuth();
	const { getById, trackActivity } = useDataContext();
	const { image } = useImage();
	const { isDark } = useTheme();
	const { refreshNotifications } = useNotifications();

	const router = useRouter();
	const { openSupport } = useLocalSearchParams();

	const [company, setCompany] = useState(null);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [notifCount, setNotifCount] = useState(0);
	const [showSupportSheet, setShowSupportSheet] = useState(false);
	const [supportConvId, setSupportConvId] = useState(null);
	const [supportUnreadCount, setSupportUnreadCount] = useState(0);

	const fetchSupportUnreadCount = useCallback(async () => {
		if (!user?.id || !accessToken) return;
		try {
			const supabase = createSupabaseClient(accessToken);
			const { data: conv } = await supabase
				.from("support_conversations")
				.select("id")
				.eq("user_id", user.id)
				.single();
			if (!conv?.id) return;
			const { count } = await supabase
				.from("support_messages")
				.select("id", { count: "exact", head: true })
				.eq("conversation_id", conv.id)
				.neq("sender_id", user.id)
				.or("is_read.is.false,is_read.is.null");
			setSupportUnreadCount(count ?? 0);
		} catch (e) {
			setSupportUnreadCount(0);
		}
	}, [user?.id, accessToken]);

	useEffect(() => {
		if (openSupport === "true") {
			openSupportSheet();
		}
	}, [openSupport]);

	const openSupportSheet = async () => {
		if (!user?.id || !accessToken) return;
		setSupportUnreadCount(0);
		try {
			const supabase = createSupabaseClient(accessToken);
			const { data, error } = await supabase
				.from("support_conversations")
				.upsert({ user_id: user.id }, { onConflict: "user_id" })
				.select("id")
				.single();
			if (!error && data?.id) setSupportConvId(data.id);
			await supabase
				.from("notifications")
				.update({ is_read: true, read_at: new Date().toISOString() })
				.eq("recipient_id", user.id)
				.eq("type", "support_message")
				.eq("actor_id", SUPERADMIN_ID);
			await refreshNotifications();
		} catch (e) {
			console.error("Erreur support conv:", e);
		}
		trackActivity(OPEN_SUPPORT_CHAT);
		setShowSupportSheet(true);
	};

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
			fetchSupportUnreadCount();

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
					(payload) => {
						fetchNotifCount();
						if (payload.new?.type === "support_message") {
							fetchSupportUnreadCount();
						}
					},
				)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "support_messages",
					},
					(payload) => {
						if (payload.new?.sender_id !== user?.id) {
							fetchSupportUnreadCount();
						}
					},
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
						{/* Bannière rejet */}
						{company?.company_status === "rejected" && (
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#450a0a"
										: "#fef2f2",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#7f1d1d" : "#fecaca",
								}}>
								<VStack space='xs'>
									<Text
										style={{
											fontWeight: "700",
											color: isDark
												? "#fca5a5"
												: "#b91c1c",
											fontSize: 14,
										}}>
										Votre entreprise a été refusée
									</Text>
									{company?.reject_message ? (
										<Text
											style={{
												color: isDark
													? "#fca5a5"
													: "#dc2626",
												fontSize: 13,
											}}>
											{company.reject_message}
										</Text>
									) : null}
								</VStack>
							</Card>
						)}

						{/* Bannière suspension */}
						{company?.company_status === "suspended" && (
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1c1917"
										: "#f9fafb",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#44403c" : "#d1d5db",
								}}>
								<VStack space='xs'>
									<Text
										style={{
											fontWeight: "700",
											color: isDark
												? "#d1d5db"
												: "#374151",
											fontSize: 14,
										}}>
										Votre compte a été suspendu
									</Text>
									{company?.suspend_message ? (
										<Text
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontSize: 13,
											}}>
											{company.suspend_message}
										</Text>
									) : (
										<Text
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontSize: 13,
											}}>
											Contactez le support pour plus
											d'informations : support@wesafe.fr
										</Text>
									)}
								</VStack>
							</Card>
						)}

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
											<VStack className='mb-2'>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{company?.name}
												</Text>
												{(company?.legal_representative_firstname ||
													company?.legal_representative_lastname) && (
													<Text
														size='xs'
														style={{
															fontStyle: "italic",
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														(
														{[
															company?.legal_representative_firstname,
															company?.legal_representative_lastname,
														]
															.filter(Boolean)
															.join(" ")}
														)
													</Text>
												)}
											</VStack>
											{company?.company_status ===
												"pending" && (
												<Badge
													size='sm'
													variant='solid'
													action='warning'>
													<BadgeIcon
														as={BadgeCheck}
														className='mr-1'
													/>
													<BadgeText>
														En attente
													</BadgeText>
												</Badge>
											)}
											{company?.company_status ===
												"verified" && (
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
											{company?.company_status ===
												"rejected" && (
												<Badge
													size='sm'
													variant='solid'
													action='error'>
													<BadgeIcon
														as={BadgeCheck}
														className='mr-1'
													/>
													<BadgeText>
														Refusé
													</BadgeText>
												</Badge>
											)}
											{company?.company_status ===
												"suspended" && (
												<Badge
													size='sm'
													variant='solid'
													action='muted'>
													<BadgeIcon
														as={BadgeCheck}
														className='mr-1'
													/>
													<BadgeText>
														Suspendu
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
													userCompany?.subscription_status ===
													"premium"
														? "success"
														: userCompany?.subscription_status ===
															  "standard_plus"
															? "info"
															: "muted"
												}>
												<BadgeText>
													{userCompany?.subscription_status ===
													"premium"
														? "Premium"
														: userCompany?.subscription_status ===
															  "standard_plus"
															? "Standard+"
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
										: company?.signature_status ===
											  "pending"
											? "En attente"
											: company?.signature_status ===
												  "verified"
												? "Validée"
												: company?.signature_status ===
													  "rejected"
													? "Rejetée"
													: null
								}
								badgeColor={
									!company?.signature_url
										? "error"
										: company?.signature_status ===
											  "pending"
											? "warning"
											: company?.signature_status ===
												  "verified"
												? "success"
												: company?.signature_status ===
													  "rejected"
													? "error"
													: null
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
									!company?.stamp_url
										? "manquant"
										: company?.stamp_status === "pending"
											? "En attente"
											: company?.stamp_status ===
												  "verified"
												? "Validé"
												: company?.stamp_status ===
													  "rejected"
													? "Rejeté"
													: null
								}
								badgeColor={
									!company?.stamp_url
										? "error"
										: company?.stamp_status === "pending"
											? "warning"
											: company?.stamp_status ===
												  "verified"
												? "success"
												: company?.stamp_status ===
													  "rejected"
													? "error"
													: null
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

							<ActionCard
								icon={BookUser}
								title='Mes contacts'
								subtitle='Gérer vos contacts'
								onPress={() => {
									router.push({
										pathname: "/profilelist",
									});
								}}
							/>

							<Divider style={{ marginVertical: 16 }} />

							<ActionCard
								icon={MessageSquare}
								title='Messages'
								subtitle='Contacter le support WeSafe'
								onPress={openSupportSheet}
								badgeText={
									supportUnreadCount > 0
										? supportUnreadCount.toString()
										: null
								}
								badgeColor={
									supportUnreadCount > 0 ? "error" : undefined
								}
							/>

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
											trackActivity(SIGN_OUT);
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

			{/* ActionSheet Support Messages */}
			<Actionsheet
				isOpen={showSupportSheet}
				onClose={() => {
					setShowSupportSheet(false);
					setSupportUnreadCount(0);
				}}>
				<ActionsheetBackdrop />
				<ActionsheetContent style={{ padding: 0 }}>
					<Box
						style={{ height: SCREEN_HEIGHT * 0.85, width: "100%" }}>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#d1d5db",
								}}
							/>
						</ActionsheetDragIndicatorWrapper>
						<Box
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 20,
								paddingVertical: 10,
								borderBottomWidth: 1,
								borderBottomColor: isDark
									? "#374151"
									: "#e5e7eb",
							}}>
							<VStack space='xs'>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Support WeSafe
								</Text>
								<Text
									style={{
										fontSize: 11,
										color: isDark ? "#6b7280" : "#9ca3af",
										fontStyle: "italic",
										letterSpacing: 0.2,
									}}>
									Réponse généralement sous quelques heures
								</Text>
							</VStack>
							<TouchableOpacity
								onPress={() => {
									setShowSupportSheet(false);
									setSupportUnreadCount(0);
								}}
								activeOpacity={0.7}
								style={{
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: isDark ? "#f3f4f6" : "#374151",
										lineHeight: 18,
									}}>
									✕
								</Text>
							</TouchableOpacity>
						</Box>
						{showSupportSheet && supportConvId && SUPERADMIN_ID && (
							<MessageThread
								applyId={supportConvId}
								receiverId={SUPERADMIN_ID}
								otherPartyName='Support WeSafe'
								handleOwnKeyboard={true}
							/>
						)}
					</Box>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
};

export default DashboardScreen;
