import React, {
	useState,
	useCallback,
	useLayoutEffect,
	useEffect,
	useRef,
	useMemo,
} from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	Animated,
	Dimensions,
} from "react-native";
import Constants from "expo-constants";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import {
	Avatar,
	AvatarFallbackText,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	useRouter,
	useFocusEffect,
	Stack,
	useLocalSearchParams,
} from "expo-router";
import SvgQRCode from "react-native-qrcode-svg";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import AvatarUploader from "@/components/AvatarUploader";
import {
	IdCard,
	BookmarkIcon,
	Briefcase,
	User,
	FileText,
	Signature,
	Upload,
	ChevronRight,
	CheckIcon,
	QrCode,
	X,
	Calendar,
	MapPin,
	Shield,
	Car,
	Languages,
	Ruler,
	GraduationCap,
	Settings,
	LogOut,
	BookmarkCheck,
	MessagesSquare,
} from "lucide-react-native";

import { supabase } from "@/lib/supabase";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useNotifications } from "@/context/NotificationsContext";
import { useImage } from "@/context/ImageContext";
import { createSupabaseClient } from "@/lib/supabase";
import MessageThread from "@/components/MessageThread";
import {
	OPEN_SUPPORT_CHAT,
	SIGN_OUT,
	OPEN_QR_MODAL,
} from "@/utils/activityEvents";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const { SUPERADMIN_ID } = Constants.expoConfig.extra;

import Logo from "@/components/Logo";

const AccountScreen = () => {
	const { user, signOut, accessToken } = useAuth();
	const { getById, getAll, trackActivity } = useDataContext();
	const { isDark } = useTheme();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const { unreadCount, notifications, refreshNotifications } =
		useNotifications();
	const unreadMessagesCount =
		notifications?.filter((n) => n.type === "new_message" && !n.is_read)
			.length ?? 0;
	const { image } = useImage();
	const router = useRouter();
	const { openSupport } = useLocalSearchParams();

	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [procards, setProcards] = useState([]);
	const [showQRModal, setShowQRModal] = useState(false);
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
	const [verifiedDocs, setVerifiedDocs] = useState({
		cnaps: [],
		diplomas: [],
		certifications: [],
	});

	const [qrToken, setQrToken] = useState(null);
	const [qrProgress, setQrProgress] = useState(1); // 1 = plein, 0 = vide
	const progressAnim = useRef(new Animated.Value(1)).current;
	const qrIntervalRef = useRef(null);
	const qrProgressRef = useRef(null);

	const generateQrToken = useCallback(async () => {
		if (!accessToken) return;
		try {
			const supabaseClient = createSupabaseClient(accessToken);
			const { data, error } =
				await supabaseClient.functions.invoke("generate-qr-token");
			if (error || !data?.success) {
				console.warn("[QR] erreur génération token:", error, data);
				return;
			}
			setQrToken(data.token);
			// Relancer la progress bar
			if (qrProgressRef.current) clearInterval(qrProgressRef.current);
			progressAnim.setValue(1);
			Animated.timing(progressAnim, {
				toValue: 0,
				duration: 30000,
				useNativeDriver: false,
			}).start();
		} catch (e) {
			console.warn("[QR] exception:", e);
		}
	}, [accessToken]);

	// Lancer/arrêter le renouvellement automatique selon l'état du modal
	useEffect(() => {
		if (showQRModal) {
			generateQrToken();
			qrIntervalRef.current = setInterval(generateQrToken, 30000);
		} else {
			if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
			if (qrProgressRef.current) clearInterval(qrProgressRef.current);
			progressAnim.stopAnimation();
			progressAnim.setValue(1);
			setQrToken(null);
		}
		return () => {
			if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
			if (qrProgressRef.current) clearInterval(qrProgressRef.current);
		};
	}, [showQRModal]);

	const fetchNotifCount = useCallback(async () => {
		if (!user?.id || !accessToken) return;
		try {
			const supabase = createSupabaseClient(accessToken);
			const { count, error } = await supabase
				.from("applications")
				.select("id", { count: "exact", head: true })
				.eq("candidate_id", user.id)
				.eq("candidate_notification", true);
			setNotifCount(error ? 0 : (count ?? 0));
		} catch (e) {
			setNotifCount(0);
		}
	}, [user?.id, accessToken]);

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

	const loadAllData = async () => {
		if (!user?.id) return;
		try {
			const supabase = createSupabaseClient(accessToken);
			const now = new Date().toISOString();
			const [profileData, procardsData, cnaps, diplomas, certifications] =
				await Promise.all([
					getById("profiles", user.id, `*`),
					getAll(
						"procards",
						"*",
						`&profile_id=eq.${user.id}&isDeleted=eq.false`,
						1,
						100,
						"created_at.desc",
					),
					supabase
						.from("user_cnaps_cards")
						.select("*")
						.eq("user_id", user.id)
						.eq("status", "verified")
						.or(`expires_at.is.null,expires_at.gt.${now}`),
					supabase
						.from("user_diplomas")
						.select("*")
						.eq("user_id", user.id)
						.eq("status", "verified")
						.or(`expires_at.is.null,expires_at.gt.${now}`),
					supabase
						.from("user_certifications")
						.select("*")
						.eq("user_id", user.id)
						.eq("status", "verified")
						.or(`expires_at.is.null,expires_at.gt.${now}`),
				]);
			setProfile(profileData);
			setProcards(procardsData?.data || []);
			setVerifiedDocs({
				cnaps: cnaps.data || [],
				diplomas: diplomas.data || [],
				certifications: certifications.data || [],
			});
		} catch (error) {
			console.error("Erreur chargement account:", error);
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
			loadAllData();
			fetchNotifCount();
			fetchSupportUnreadCount();

			const supabase = createSupabaseClient(accessToken);
			const channel = supabase
				.channel(`account-notif-${user?.id}`)
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

	useLayoutEffect(() => {
		// Ne rien faire ici, le header est défini dans _layout.jsx
	}, []);

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
					backgroundColor: cardBg,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: cardBorder,
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
								backgroundColor: bg,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={icon}
								size='lg'
								style={{
									color: tint,
								}}
							/>
						</Box>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								size='md'
								style={{
									fontWeight: "600",
									color: textPrimary,
								}}>
								{title}
							</Text>
							{subtitle && (
								<Text
									size='sm'
									style={{
										color: textSecondary,
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
								color: textSecondary,
							}}
						/>
					</HStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);

	const qrUrl = qrToken ? `wesafe://profile?token=${qrToken}` : "";

	return (
		<>
			<Stack.Screen
				options={{
					headerStyle: {
						backgroundColor: bg,
					},
					headerRight: () => (
						<TouchableOpacity
							style={{
								backgroundColor: "transparent",
							}}
							onPress={() => {
								setShowQRModal(true);
								trackActivity(OPEN_QR_MODAL);
							}}
							activeOpacity={0.7}>
							<Icon
								as={QrCode}
								size='xl'
								style={{
									color: tint,
								}}
							/>
						</TouchableOpacity>
					),
				}}
			/>
			<Actionsheet
				isOpen={showQRModal}
				onClose={() => setShowQRModal(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: cardBg,
						paddingBottom: 60,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					{/* Header titre + bouton fermer */}
					<HStack
						style={{
							width: "100%",
							alignItems: "center",
							justifyContent: "center",
							paddingHorizontal: 10,
							paddingTop: 24,
							paddingBottom: 24,
						}}>
						<Heading
							size='md'
							style={{
								color: textPrimary,
							}}>
							Mon QR Code
						</Heading>
						{/* <TouchableOpacity
							onPress={() => setShowQRModal(false)}
							activeOpacity={0.7}
							style={{
								backgroundColor: bg,
								borderRadius: 999,
								padding: 8,
							}}>
							<Icon
								as={X}
								size='sm'
								style={{
									color: textSecondary,
								}}
							/>
						</TouchableOpacity> */}
					</HStack>

					{/* Avatar + nom + prénom */}
					{/* <HStack
						space='md'
						style={{
							alignItems: "center",
							width: "100%",
							marginTop: 20,
							marginBottom: 28,
							paddingHorizontal: 12,
						}}>
						<Avatar size='lg'>
							<AvatarFallbackText>
								{profile?.firstname} {profile?.lastname}
							</AvatarFallbackText>
							{profile?.avatar_url && (
								<AvatarImage
									source={{ uri: profile.avatar_url }}
								/>
							)}
						</Avatar>
						<VStack>
							<Heading
								size='sm'
								style={{
									color: textPrimary,
								}}>
								{profile?.firstname} {profile?.lastname}
							</Heading>
							{profile?.job_title ? (
								<Text
									size='sm'
									style={{
										color: textSecondary,
									}}>
									{profile.job_title}
								</Text>
							) : null}
						</VStack>
					</HStack> */}

					{/* QR Code */}
					<View
						style={{
							alignItems: "center",
							width: "100%",
							paddingHorizontal: 24,
						}}>
						<View
							style={{
								backgroundColor: isDark ? "#111827" : "#ffffff",
								borderRadius: 24,
								padding: 20,
								shadowColor: "#000",
								shadowOpacity: 0.1,
								shadowRadius: 16,
								shadowOffset: { width: 0, height: 4 },
								elevation: 6,
							}}>
							{qrUrl ? (
								<SvgQRCode
									value={qrUrl}
									size={200}
									color={isDark ? "#f8fafc" : "#111827"}
									backgroundColor={
										isDark ? "#111827" : "#ffffff"
									}
								/>
							) : (
								<View
									style={{
										width: 200,
										height: 200,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Text
										style={{
											color: textSecondary,
											fontSize: 12,
										}}>
										Chargement...
									</Text>
								</View>
							)}
						</View>

						{/* Progress bar 30s */}
						<View
							style={{
								width: 240,
								height: 4,
								backgroundColor: cardBorder,
								borderRadius: 2,
								marginTop: 16,
								overflow: "hidden",
							}}>
							<Animated.View
								style={{
									height: 4,
									borderRadius: 2,
									backgroundColor: textSecondary,
									width: progressAnim.interpolate({
										inputRange: [0, 1],
										outputRange: ["0%", "100%"],
									}),
								}}
							/>
						</View>
					</View>

					{/* Hint */}
					<Text
						style={{
							color: textSecondary,
							fontSize: 12,
							marginTop: 12,
							marginBottom: 8,
							textAlign: "center",
							paddingHorizontal: 24,
						}}>
						Code valable 30 secondes • Se renouvelle automatiquement
					</Text>
				</ActionsheetContent>
			</Actionsheet>
			<Box
				style={{
					flex: 1,
					backgroundColor: bg,
				}}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						padding: 10,
						paddingBottom: 30,
						paddingTop: 15,
					}}>
					{loading ? (
						<VStack space='2xl'>
							{/* Skeleton Profile Header */}
							<Card
								style={{
									padding: 20,
									backgroundColor: cardBg,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack
									space='lg'
									style={{ alignItems: "center" }}>
									<SkeletonBox
										width={100}
										height={100}
										borderRadius={50}
									/>
									<Divider />
									<VStack
										space='sm'
										style={{
											width: "100%",
											alignItems: "flex-start",
										}}>
										<SkeletonBox width='60%' height={18} />
										<SkeletonBox
											width='45%'
											height={14}
											style={{ marginTop: 4 }}
										/>
										<SkeletonBox
											width='35%'
											height={14}
											style={{ marginTop: 4 }}
										/>
									</VStack>
									<Divider />
									<VStack
										space='sm'
										style={{ width: "100%" }}>
										<SkeletonBox width='50%' height={13} />
										<SkeletonBox width='40%' height={13} />
										<SkeletonBox width='55%' height={13} />
									</VStack>
								</VStack>
							</Card>

							{/* Skeleton Actions rapides */}
							<VStack space='md'>
								<SkeletonBox
									width='40%'
									height={18}
									style={{ marginBottom: 4 }}
								/>
								{[1, 2, 3, 4, 5].map((i) => (
									<Card
										key={i}
										style={{
											padding: 16,
											backgroundColor: cardBg,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: cardBorder,
										}}>
										<HStack
											space='md'
											style={{ alignItems: "center" }}>
											<SkeletonBox
												width={40}
												height={40}
												borderRadius={20}
											/>
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<SkeletonBox
													width='55%'
													height={14}
												/>
												<SkeletonBox
													width='40%'
													height={12}
													style={{ marginTop: 4 }}
												/>
											</VStack>
											<SkeletonBox
												width={20}
												height={20}
												borderRadius={4}
											/>
										</HStack>
									</Card>
								))}
							</VStack>
						</VStack>
					) : (
						<VStack space='2xl'>
							{/* Bannière rejet */}
							{profile?.profile_status === "rejected" && (
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
											Votre profil a été refusé
										</Text>
										{profile?.reject_message ? (
											<Text
												style={{
													color: isDark
														? "#fca5a5"
														: "#dc2626",
													fontSize: 13,
												}}>
												{profile.reject_message}
											</Text>
										) : null}
									</VStack>
								</Card>
							)}

							{/* Bannière suspension */}
							{profile?.profile_status === "suspended" && (
								<Card
									style={{
										padding: 16,
										backgroundColor: bg,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: cardBorder,
									}}>
									<VStack space='xs'>
										<Text
											style={{
												fontWeight: "700",
												color: textPrimary,
												fontSize: 14,
											}}>
											Votre compte a été suspendu
										</Text>
										{profile?.suspend_message ? (
											<Text
												style={{
													color: textSecondary,
													fontSize: 13,
												}}>
												{profile.suspend_message}
											</Text>
										) : (
											<Text
												style={{
													color: textSecondary,
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

							{/* Profile Header Card */}
							<Card
								style={{
									padding: 20,
									backgroundColor: cardBg,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack
									space='lg'
									style={{ alignItems: "center" }}>
									{/* Avatar Section - Centré et cliquable */}
									<VStack
										space='md'
										style={{
											alignItems: "center",
											justifyContent: "center",
											height: 120,
											width: 120,
											// backgroundColor: "pink",
										}}>
										<AvatarUploader image={image} />
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
													justifyContent:
														"space-between",
													alignItems: "center",
												}}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: textPrimary,
													}}>
													{profile?.firstname}{" "}
													{profile?.lastname}
												</Text>
												{profile?.profile_status ===
													"pending" && (
													<Badge
														size='sm'
														variant='solid'
														action='warning'>
														<BadgeText>
															En attente
														</BadgeText>
													</Badge>
												)}
												{profile?.profile_status ===
													"verified" && (
													<Badge
														size='sm'
														variant='solid'
														action='success'>
														<BadgeIcon
															as={IdCard}
															className='mr-1'
														/>
														<BadgeText>
															Vérifié
														</BadgeText>
													</Badge>
												)}
												{profile?.profile_status ===
													"rejected" && (
													<Badge
														size='sm'
														variant='solid'
														action='error'>
														<BadgeText>
															Refusé
														</BadgeText>
													</Badge>
												)}
												{profile?.profile_status ===
													"suspended" && (
													<Badge
														size='sm'
														variant='solid'
														action='muted'>
														<BadgeText>
															Suspendu
														</BadgeText>
													</Badge>
												)}
											</HStack>
											{profile?.email && (
												<Text
													size='sm'
													style={{
														color: textSecondary,
													}}>
													{profile.email}
												</Text>
											)}
											{profile?.phone && (
												<Text
													size='sm'
													style={{
														color: textSecondary,
													}}>
													{profile.phone.startsWith(
														"+33",
													) &&
													profile.phone.length === 12
														? "+33 " +
															profile.phone
																.slice(3)
																.replace(
																	/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/,
																	"$1 $2 $3 $4 $5",
																)
														: profile.phone}
												</Text>
											)}
											{(verifiedDocs.cnaps.length > 0 ||
												verifiedDocs.diplomas.length >
													0 ||
												verifiedDocs.certifications
													.length > 0) && (
												<HStack
													space='xs'
													style={{
														flexWrap: "wrap",
														marginTop: 6,
													}}>
													{verifiedDocs.cnaps.map(
														(doc) => (
															<Badge
																key={doc.id}
																size='sm'
																variant='solid'
																action='success'>
																<BadgeIcon
																	as={IdCard}
																	className='mr-1'
																/>
																<BadgeText>
																	{doc.type}
																</BadgeText>
															</Badge>
														),
													)}
													{verifiedDocs.diplomas.map(
														(doc) => (
															<Badge
																key={doc.id}
																size='sm'
																variant='solid'
																action='success'>
																<BadgeIcon
																	as={IdCard}
																	className='mr-1'
																/>
																<BadgeText>
																	{doc.type}
																</BadgeText>
															</Badge>
														),
													)}
													{verifiedDocs.certifications.map(
														(doc) => (
															<Badge
																key={doc.id}
																size='sm'
																variant='solid'
																action='success'>
																<BadgeIcon
																	as={IdCard}
																	className='mr-1'
																/>
																<BadgeText>
																	{doc.type}
																</BadgeText>
															</Badge>
														),
													)}
												</HStack>
											)}
										</VStack>
									</HStack>

									<Divider />

									{/* Informations personnelles */}
									<VStack
										space='md'
										style={{ width: "100%" }}>
										{profile?.gender && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={User}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													{profile.gender === "male"
														? "Homme"
														: profile.gender ===
															  "female"
															? "Femme"
															: "Autre"}
												</Text>
											</HStack>
										)}

										{profile?.birthday && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Calendar}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													{new Date(
														profile.birthday,
													).toLocaleDateString(
														"fr-FR",
													)}
												</Text>
												<Text
													size='sm'
													style={{
														color: textSecondary,
													}}>
													(
													{Math.floor(
														(new Date() -
															new Date(
																profile.birthday,
															)) /
															(365.25 *
																24 *
																60 *
																60 *
																1000),
													)}{" "}
													ans)
												</Text>
											</HStack>
										)}

										{(profile?.height ||
											profile?.weight) && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Ruler}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													{profile?.height &&
														`${profile.height} cm`}
													{profile?.height &&
														profile?.weight &&
														" • "}
													{profile?.weight &&
														`${profile.weight} kg`}
												</Text>
											</HStack>
										)}

										{(profile?.city ||
											profile?.department ||
											profile?.region) && (
											<HStack
												space='sm'
												style={{
													alignItems: "flex-start",
												}}>
												<Icon
													as={MapPin}
													size='sm'
													style={{
														color: textSecondary,
														marginTop: 2,
													}}
												/>
												<VStack style={{ flex: 1 }}>
													<Text
														size='sm'
														style={{
															color: textPrimary,
														}}>
														{[
															profile?.postcode,
															profile?.city,
														]
															.filter(Boolean)
															.join(" ")}
													</Text>
													{(profile?.department ||
														profile?.region) && (
														<Text
															size='xs'
															style={{
																color: textSecondary,
															}}>
															{[
																profile?.department,
																profile?.region,
															]
																.filter(Boolean)
																.join(", ")}
														</Text>
													)}
												</VStack>
											</HStack>
										)}

										{profile?.former_soldier && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Shield}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													Ancien militaire
												</Text>
											</HStack>
										)}

										{profile?.driving_licenses && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Car}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													Permis{" "}
													{profile.driving_licenses}
												</Text>
											</HStack>
										)}

										{profile?.languages && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Languages}
													size='sm'
													style={{
														color: textSecondary,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
													}}>
													{profile.languages}
												</Text>
											</HStack>
										)}
									</VStack>

									{profile?.qualifications &&
										profile.qualifications.length > 0 && (
											<>
												<Divider />
												<HStack
													space='sm'
													style={{
														flexWrap: "wrap",
													}}>
													{profile.qualifications.map(
														(qual, index) => (
															<Badge
																key={index}
																size='sm'>
																<BadgeIcon
																	as={IdCard}
																	className='mr-1'
																/>
																<BadgeText>
																	{qual}
																</BadgeText>
															</Badge>
														),
													)}
												</HStack>
											</>
										)}

									{/* Cartes professionnelles */}
									{procards && procards.length > 0 && (
										<>
											<Divider />
											<VStack
												space='xs'
												style={{ width: "100%" }}>
												{/* <Text
												size='sm'
												style={{
													fontWeight: "600",
													color: textPrimary,
												}}>
												Cartes professionnelles
											</Text> */}
												<HStack
													space='sm'
													style={{
														flexWrap: "wrap",
														justifyContent:
															"flex-start",
														width: "100%",
													}}>
													{profile?.ssiap1_verification_status ===
														"verified" && (
														<Badge
															size='sm'
															variant='solid'
															action='success'>
															<BadgeIcon
																as={
																	GraduationCap
																}
																className='mr-1'
															/>
															<BadgeText>
																SSIAP 1
															</BadgeText>
														</Badge>
													)}
													{profile?.ssiap2_verification_status ===
														"verified" && (
														<Badge
															size='sm'
															variant='solid'
															action='success'>
															<BadgeIcon
																as={
																	GraduationCap
																}
																className='mr-1'
															/>
															<BadgeText>
																SSIAP 2
															</BadgeText>
														</Badge>
													)}
													{profile?.ssiap3_verification_status ===
														"verified" && (
														<Badge
															size='sm'
															variant='solid'
															action='success'>
															<BadgeIcon
																as={
																	GraduationCap
																}
																className='mr-1'
															/>
															<BadgeText>
																SSIAP 3
															</BadgeText>
														</Badge>
													)}
													{procards
														.filter((card) => {
															const validityDate =
																new Date(
																	card.validity_date,
																);
															const isExpired =
																validityDate <
																new Date();
															return (
																card.status ===
																	"verified" &&
																!isExpired
															);
														})
														.map((card) => {
															return (
																<Badge
																	key={
																		card.id
																	}
																	size='sm'
																	variant='solid'
																	action='success'>
																	<BadgeIcon
																		as={
																			IdCard
																		}
																		className='mr-1'
																	/>
																	<BadgeText>
																		{
																			card.category
																		}
																	</BadgeText>
																</Badge>
															);
														})}
												</HStack>
											</VStack>
										</>
									)}
								</VStack>
							</Card>

							{/* Navigation Cards */}
							<VStack space='lg'>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: textPrimary,
									}}>
									Actions rapides
								</Text>

								<ActionCard
									icon={User}
									title='Informations personnelles'
									subtitle='Modifiez votre profil'
									onPress={() =>
										router.push("/updateprofile")
									}
								/>
								<ActionCard
									icon={FileText}
									title='CV'
									subtitle='Gérez votre curriculum vitae'
									onPress={() =>
										router.push("/curriculumvitae")
									}
								/>

								<ActionCard
									icon={Signature}
									title='Signature'
									subtitle='Créez votre signature'
									onPress={() => router.push("/signature")}
									badgeText={
										profile?.signature_url ? "✓" : null
									}
								/>

								<ActionCard
									icon={Upload}
									title='Documents'
									subtitle="Documents d'identité et sécurité sociale"
									onPress={() => router.push("/documents")}
								/>

								<ActionCard
									icon={IdCard}
									title='Documents professionnelles'
									subtitle='Cartes professionnels, diplômes, attestations...'
									onPress={() => router.push("/prodocs")}
								/>
								<Divider style={{ marginVertical: 16 }} />

								<ActionCard
									icon={BookmarkCheck}
									title='Liste de souhaits'
									subtitle='Vos missions favorites'
									onPress={() => router.push("/wishlist")}
								/>

								<ActionCard
									icon={Briefcase}
									title='Candidatures'
									subtitle='Suivez vos candidatures'
									onPress={() => router.push("/applications")}
									badgeText={
										notifCount > 0
											? notifCount.toString()
											: null
									}
									badgeColor={
										notifCount > 0 ? "error" : undefined
									}
								/>
								<TouchableOpacity
									onPress={() => router.push("/messaging")}
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
															Messagerie
														</Text>
														{unreadMessagesCount >
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
																		unreadMessagesCount
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
														Vos conversations
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
								<Divider style={{ marginVertical: 16 }} />
								<TouchableOpacity
									onPress={() => setShowLogoutDialog(true)}
									activeOpacity={0.7}
									style={{
										marginTop: 8,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										gap: 8,
										borderWidth: 1,
										borderColor: isDark
											? Colors.dark.danger
											: Colors.light.danger,
										backgroundColor: cardBg,
										borderRadius: 10,
										height: 48,
									}}>
									<Icon
										as={LogOut}
										size='sm'
										style={{
											color: isDark
												? Colors.dark.danger
												: Colors.light.danger,
										}}
									/>
									<Text
										style={{
											color: isDark
												? Colors.dark.danger
												: Colors.light.danger,
											fontSize: 15,
										}}>
										Déconnexion
									</Text>
								</TouchableOpacity>
							</VStack>
						</VStack>
					)}
				</ScrollView>

				{/* Modal de confirmation de déconnexion */}
				<AlertDialog
					isOpen={showLogoutDialog}
					onClose={() => setShowLogoutDialog(false)}>
					<AlertDialogBackdrop />
					<AlertDialogContent
						style={{
							backgroundColor: cardBg,
							borderRadius: 12,
							padding: 24,
						}}>
						<AlertDialogHeader>
							<Heading
								size='lg'
								style={{
									color: textPrimary,
								}}>
								Déconnexion
							</Heading>
						</AlertDialogHeader>
						<AlertDialogBody>
							<Text
								style={{
									color: textPrimary,
									marginTop: 8,
								}}>
								Êtes-vous sûr de vouloir vous déconnecter ?
							</Text>
						</AlertDialogBody>
						<AlertDialogFooter style={{ marginTop: 24 }}>
							<HStack space='md' style={{ width: "100%" }}>
								<TouchableOpacity
									onPress={() => setShowLogoutDialog(false)}
									activeOpacity={0.7}
									style={{
										flex: 1,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										borderWidth: 1,
										borderColor: cardBorder,
										backgroundColor: cardBg,
										borderRadius: 10,
										height: 44,
									}}>
									<Text
										style={{
											color: textSecondary,
											fontSize: 15,
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
									activeOpacity={0.7}
									style={{
										flex: 1,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										gap: 8,
										borderWidth: 1,
										borderColor: isDark
											? Colors.dark.danger
											: Colors.light.danger,
										backgroundColor: cardBg,
										borderRadius: 10,
										height: 44,
									}}>
									<Icon
										as={LogOut}
										size='sm'
										style={{
											color: isDark
												? Colors.dark.danger
												: Colors.light.danger,
										}}
									/>
									<Text
										style={{
											color: isDark
												? Colors.dark.danger
												: Colors.light.danger,
											fontSize: 15,
										}}>
										Déconnexion
									</Text>
								</TouchableOpacity>
							</HStack>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Box>
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
									backgroundColor: cardBorder,
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
								borderBottomColor: cardBorder,
							}}>
							<VStack space='xs'>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: textPrimary,
									}}>
									Support WeSafe
								</Text>
								<Text
									style={{
										fontSize: 11,
										color: textSecondary,
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
									backgroundColor: cardBorder,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: textPrimary,
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

export default AccountScreen;
