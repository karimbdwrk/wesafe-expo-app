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
	Animated,
	View,
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
	MessagesSquare,
	Zap,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { createSupabaseClient } from "@/lib/supabase";
import Colors from "@/constants/Colors";

import LogoUploader from "@/components/LogoUploader";
import { OPEN_SUPPORT_CHAT, SIGN_OUT } from "@/utils/activityEvents";
import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";
import MessageThread from "@/components/MessageThread";
import { width } from "dom-helpers";

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

	const [loading, setLoading] = useState(true);
	const [company, setCompany] = useState(null);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [notifCount, setNotifCount] = useState(0);
	const [showSupportSheet, setShowSupportSheet] = useState(false);
	const [supportConvId, setSupportConvId] = useState(null);
	const [supportUnreadCount, setSupportUnreadCount] = useState(0);

	const skeletonAnim = useRef(new Animated.Value(0.4)).current;
	useEffect(() => {
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(skeletonAnim, {
					toValue: 1,
					duration: 700,
					useNativeDriver: true,
				}),
				Animated.timing(skeletonAnim, {
					toValue: 0.4,
					duration: 700,
					useNativeDriver: true,
				}),
			]),
		);
		if (loading) pulse.start();
		else pulse.stop();
		return () => pulse.stop();
	}, [loading]);

	const skeletonColor = isDark ? "#374151" : "#e5e7eb";

	const SkeletonBox = ({ width, height, style, borderRadius = 8 }) => (
		<Animated.View
			style={[
				{
					width,
					height,
					borderRadius,
					backgroundColor: skeletonColor,
					opacity: skeletonAnim,
				},
				style,
			]}
		/>
	);

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
		try {
			const data = await getById("companies", user.id, `*`);
			setCompany(data);
			await fetchNotifCount();
		} catch (e) {
			console.error("Erreur chargement dashboard:", e);
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			if (!user?.id) return;
			setLoading(true);
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
					backgroundColor: isDark
						? Colors.dark.cardBackground
						: Colors.light.cardBackground,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: isDark
						? Colors.dark.border
						: Colors.light.border,
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
								backgroundColor: isDark
									? Colors.dark.background
									: Colors.light.background,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={icon}
								size='lg'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
								}}
							/>
						</Box>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								size='md'
								style={{
									fontWeight: "600",
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								{title}
							</Text>
							{subtitle && (
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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
								color: isDark
									? Colors.dark.muted
									: Colors.light.muted,
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
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
								}}
							/>
						</TouchableOpacity>
					),
				}}
			/>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.background,
				}}
				showsVerticalScrollIndicator={false}>
				<Box style={{ padding: 10, paddingBottom: 30, paddingTop: 15 }}>
					{loading ? (
						<VStack space='2xl'>
							{/* Skeleton Company Info Card */}
							<View
								style={{
									backgroundColor: isDark
										? Colors.dark.cardBackground
										: Colors.light.cardBackground,
									borderRadius: 12,
									padding: 20,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
									gap: 16,
								}}>
								{/* Logo centré */}
								<View
									style={{
										alignItems: "center",
										paddingVertical: 8,
									}}>
									<SkeletonBox
										width={80}
										height={80}
										borderRadius={40}
									/>
								</View>
								<View
									style={{
										height: 1,
										backgroundColor: skeletonColor,
										opacity: 0.4,
									}}
								/>
								{/* Nom entreprise + badge statut */}
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<SkeletonBox width='55%' height={18} />
									<SkeletonBox
										width={70}
										height={22}
										borderRadius={6}
									/>
								</View>
								{/* Adresse */}
								<View style={{ gap: 8 }}>
									<SkeletonBox width='60%' height={13} />
									<SkeletonBox width='45%' height={13} />
									<SkeletonBox width='50%' height={13} />
								</View>
								<View
									style={{
										height: 1,
										backgroundColor: skeletonColor,
										opacity: 0.4,
									}}
								/>
								{/* Abonnement */}
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<SkeletonBox width='40%' height={14} />
									<SkeletonBox
										width={80}
										height={22}
										borderRadius={6}
									/>
								</View>
								<View
									style={{
										height: 1,
										backgroundColor: skeletonColor,
										opacity: 0.4,
									}}
								/>
								{/* Crédits */}
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<SkeletonBox width='45%' height={14} />
									<SkeletonBox
										width={50}
										height={28}
										borderRadius={20}
									/>
								</View>
							</View>

							{/* Skeleton Actions rapides */}
							<VStack space='md'>
								<SkeletonBox
									width='40%'
									height={18}
									style={{ marginBottom: 4 }}
								/>
								{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
									<View
										key={i}
										style={{
											padding: 16,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}>
										<View
											style={{
												flexDirection: "row",
												alignItems: "center",
												gap: 12,
											}}>
											<SkeletonBox
												width={40}
												height={40}
												borderRadius={20}
											/>
											<View style={{ flex: 1, gap: 7 }}>
												<SkeletonBox
													width='55%'
													height={14}
												/>
												<SkeletonBox
													width='40%'
													height={12}
												/>
											</View>
											<SkeletonBox
												width={20}
												height={20}
												borderRadius={4}
											/>
										</View>
									</View>
								))}
							</VStack>
						</VStack>
					) : (
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
										borderColor: isDark
											? "#7f1d1d"
											: "#fecaca",
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
														? Colors.dark.danger
														: Colors.light.danger,
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
											? Colors.dark.background
											: Colors.light.background,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? Colors.dark.border
											: Colors.light.border,
									}}>
									<VStack space='xs'>
										<Text
											style={{
												fontWeight: "700",
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
												fontSize: 14,
											}}>
											Votre compte a été suspendu
										</Text>
										{company?.suspend_message ? (
											<Text
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
													fontSize: 13,
												}}>
												{company.suspend_message}
											</Text>
										) : (
											<Text
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
													fontSize: 13,
												}}>
												Contactez le support pour plus
												d'informations :
												support@wesafe.fr
											</Text>
										)}
									</VStack>
								</Card>
							)}

							{/* Company Info Card */}
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? Colors.dark.cardBackground
										: Colors.light.cardBackground,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
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
													justifyContent:
														"space-between",
												}}>
												<VStack className='mb-2'>
													<Text
														size='lg'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														{company?.name}
													</Text>
													{(company?.legal_representative_firstname ||
														company?.legal_representative_lastname) && (
														<Text
															size='xs'
															style={{
																fontStyle:
																	"italic",
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
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
											{(company?.street ||
												company?.postcode ||
												company?.city) && (
												<VStack
													space='0.5'
													className='mb-2'>
													<Text
														size='sm'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														{company.street}
													</Text>
													<Text
														size='sm'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														{[
															company.postcode,
															company.city,
														]
															.filter(Boolean)
															.join(" ")}
													</Text>
												</VStack>
											)}
											{company?.siret && (
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
														? Colors.dark.muted
														: Colors.light.muted,
												}}>
												{company.description}
											</Text>
										</>
									)}

									<Divider />

									{/* Subscription Status */}
									<TouchableOpacity
										onPress={() =>
											router.push("/subscription")
										}
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
													justifyContent:
														"space-between",
													paddingRight: 10,
												}}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
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
														? Colors.dark.muted
														: Colors.light.muted,
												}}
											/>
										</HStack>
									</TouchableOpacity>

									<Divider />
									{/* Subscription Status */}
									<TouchableOpacity
										onPress={() =>
											router.push("/buycredits")
										}
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
													justifyContent:
														"space-between",
													paddingRight: 10,
												}}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													Crédits LastMinute
												</Text>
												<TouchableOpacity
													// onPress={() => router.push("/buycredits")}
													activeOpacity={0.7}
													style={{
														flexDirection: "row",
														alignItems: "center",
														gap: 4,
														backgroundColor: isDark
															? Colors.dark
																	.background
															: "#fef9c3",
														borderRadius: 20,
														paddingHorizontal: 10,
														paddingVertical: 5,
														marginRight: 4,
													}}>
													<Icon
														as={Zap}
														size='sm'
														style={{
															color: Colors.light
																.warning,
														}}
													/>
													<Text
														size='sm'
														style={{
															fontWeight: "700",
															color: Colors.light
																.warning,
														}}>
														{company?.last_minute_credits ??
															0}
													</Text>
												</TouchableOpacity>
												{/* <Badge
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
											</Badge> */}
											</HStack>
											<Icon
												as={ChevronRight}
												size='sm'
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
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
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
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
											pathname:
												"/kbisdocumentverification",
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
													? "Validé"
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
											: company?.stamp_status ===
												  "pending"
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
											: company?.stamp_status ===
												  "pending"
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
										notifCount > 0
											? `${notifCount}`
											: undefined
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

								<TouchableOpacity
									onPress={openSupportSheet}
									activeOpacity={0.7}>
									<Card
										style={{
											padding: 16,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}>
										<HStack
											style={{
												alignItems: "center",
												justifyContent: "space-between",
											}}>
											<HStack
												space='md'
												style={{
													flex: 1,
													alignItems: "center",
												}}>
												<Box
													style={{
														width: 40,
														height: 40,
														borderRadius: 20,
														backgroundColor: isDark
															? Colors.dark
																	.background
															: Colors.light
																	.background,
														justifyContent:
															"center",
														alignItems: "center",
													}}>
													<Icon
														as={MessagesSquare}
														size='lg'
														style={{
															color: isDark
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
												</Box>
												<VStack
													style={{ flex: 1 }}
													space='xs'>
													<HStack
														space='xs'
														style={{
															alignItems:
																"center",
														}}>
														<Text
															size='md'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Messagerie de
															support
														</Text>
														{supportUnreadCount >
															0 && (
															<Box
																style={{
																	marginLeft: 4,
																	minWidth: 18,
																	height: 18,
																	borderRadius: 9,
																	paddingHorizontal: 5,
																	justifyContent:
																		"center",
																	alignItems:
																		"center",
																	backgroundColor:
																		"#ef4444",
																}}>
																<Text
																	style={{
																		color: "#fff",
																		fontSize: 10,
																		fontWeight:
																			"700",
																		lineHeight: 14,
																	}}>
																	{
																		supportUnreadCount
																	}
																</Text>
															</Box>
														)}
													</HStack>
													<Text
														size='sm'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														Contacter le support
														WeSafe
													</Text>
												</VStack>
											</HStack>
											<Icon
												as={ChevronRight}
												size='lg'
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
												}}
											/>
										</HStack>
									</Card>
								</TouchableOpacity>

								<ActionCard
									icon={Settings}
									title='Paramètres'
									subtitle="Paramètres de l'application"
									onPress={() => router.push("/settings")}
								/>
							</VStack>
							<Divider />
							{/* Déconnexion */}
							<HStack
								style={{
									justifyContent: "center",
									alignItems: "center",
									width: "100%",
								}}>
								<TouchableOpacity
									onPress={() => setShowLogoutDialog(true)}
									activeOpacity={0.7}
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 10,
										paddingVertical: 14,
										paddingHorizontal: 4,
									}}>
									<LogOut
										size={16}
										color={
											isDark
												? Colors.dark.danger
												: Colors.light.danger
										}
									/>
									<Text
										style={{
											fontSize: 14,
											fontWeight: "500",
											color: isDark
												? Colors.dark.danger
												: Colors.light.danger,
										}}>
										Déconnexion
									</Text>
								</TouchableOpacity>
							</HStack>
						</VStack>
					)}
					<AlertDialog
						isOpen={showLogoutDialog}
						onClose={() => setShowLogoutDialog(false)}>
						<AlertDialogBackdrop />
						<AlertDialogContent
							style={{
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								padding: 24,
							}}>
							<AlertDialogHeader>
								<Heading
									size='lg'
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Déconnexion
								</Heading>
							</AlertDialogHeader>
							<AlertDialogBody>
								<Text
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										marginTop: 8,
									}}>
									Êtes-vous sûr de vouloir vous déconnecter ?
								</Text>
							</AlertDialogBody>
							<AlertDialogFooter style={{ marginTop: 24 }}>
								<HStack space='md' style={{ width: "100%" }}>
									<TouchableOpacity
										onPress={() =>
											setShowLogoutDialog(false)
										}
										activeOpacity={0.75}
										style={{
											flex: 1,
											paddingVertical: 11,
											borderRadius: 10,
											alignItems: "center",
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
										}}>
										<Text
											style={{
												fontWeight: "600",
												fontSize: 14,
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
											}}>
											Annuler
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => {
											setShowLogoutDialog(false);
											trackActivity(SIGN_OUT);
											signOut();
										}}
										activeOpacity={0.75}
										style={{
											flex: 1,
											paddingVertical: 11,
											borderRadius: 10,
											alignItems: "center",
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.danger
												: Colors.light.danger,
											backgroundColor: "transparent",
										}}>
										<Text
											style={{
												fontWeight: "600",
												fontSize: 14,
												color: isDark
													? Colors.dark.danger
													: Colors.light.danger,
											}}>
											Déconnexion
										</Text>
									</TouchableOpacity>
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
										? Colors.dark.border
										: Colors.light.border,
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
									? Colors.dark.border
									: Colors.light.border,
							}}>
							<VStack space='xs'>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Support WeSafe
								</Text>
								<Text
									style={{
										fontSize: 11,
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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
										? Colors.dark.border
										: Colors.light.border,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: isDark
											? Colors.dark.text
											: Colors.light.muted,
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
