import React, { useCallback, useState, useEffect } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	Link,
	Tabs,
	useRouter,
	Slot,
	useSegments,
	useFocusEffect,
} from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { View, StyleSheet, Pressable, Image, Platform } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import {
	Avatar,
	AvatarBadge,
	AvatarFallbackText,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import {
	Menu,
	MenuItem,
	MenuItemLabel,
	MenuSeparator,
} from "@/components/ui/menu";
import { Icon } from "@/components/ui/icon";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";

import {
	AlertTriangle,
	Bookmark,
	ShieldUser,
	FileText,
	Power,
	Home,
	LayoutDashboard,
	Plus,
	IdCard,
	BookUser,
	Layers,
	FolderKanban,
	Timer,
	Trophy,
	Box,
	House,
	Bell,
	Settings,
	BookmarkCheck,
} from "lucide-react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

import { supabase, createSupabaseClient } from "@/lib/supabase";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useNotifications } from "@/context/NotificationsContext";

import LoggedInAppInitializer from "@/context/LoggedInAppInitializer";
import { toast } from "sonner-native";

// import {
// 	registerForPushNotificationsAsync,
// 	setupNotificationResponseListener,
// } from "@/utils/pushNotifications";

// Notifications.setNotificationHandler({
// 	handleNotification: async () => ({
// 		shouldShowAlert: true,
// 		shouldPlaySound: false,
// 		shouldSetBadge: false,
// 	}),
// });

const TOKEN_API_ENDPOINT =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/store-push-token";

function LogoTitle({ colorScheme }) {
	const fillColor = colorScheme === "dark" ? "#f3f4f6" : "#111827";
	return (
		<Svg viewBox='0 0 264.3 297.85' width={60} height={60}>
			<G>
				{/* <Path
					fill={"#333333"}
					d='M123.57,2.29L9.97,67.71c-6.17,3.55-9.97,10.13-9.97,17.24v127.08c0,7.1,3.78,13.66,9.93,17.22l114.49,66.28c5.34,3.09,11.93,3.08,17.26-.02l112.74-65.66c6.12-3.56,9.88-10.11,9.88-17.2v-127.7c0-7.12-3.8-13.69-9.97-17.24L140.73,2.29c-5.31-3.06-11.84-3.06-17.15,0Z'
				/> */}
				<G>
					<Path
						fill={fillColor}
						d='M108.85,167.5v-54.85h20.57v75.42H54v-75.42h20.57v54.85h6.86v-54.85h20.57v54.85h6.86Z'
					/>
					<Path
						fill={fillColor}
						d='M211.7,133.22h-75.42v-20.57h75.42v20.57ZM211.7,160.65h-75.42v-20.57h75.42v20.57ZM211.7,188.07h-75.42v-20.57h75.42v20.57Z'
					/>
				</G>
			</G>
		</Svg>
	);
}

export default function TabLayout({ theme = "light" }) {
	const colorScheme = useColorScheme();
	const {
		accessToken,
		role,
		signOut,
		user,
		userProfile,
		userCompany,
		loadUserData,
		loadSession,
		checkSubscription,
		hasSubscription,
		loading: authLoading,
	} = useAuth();
	const { getAll } = useDataContext();
	const router = useRouter();
	const toast = useToast();
	const segments = useSegments();
	const [menuOpen, setMenuOpen] = useState(false);

	// const [unreadCount, setUnreadCount] = useState(0);
	const {
		notifications,
		unreadCount: contextUnreadCount,
		fetchNotifications,
		refreshUnreadCount,
	} = useNotifications();

	useFocusEffect(
		useCallback(() => {
			refreshUnreadCount();
		}, [refreshUnreadCount]),
	);

	// Fermer le menu quand la route change
	useEffect(() => {
		setMenuOpen(false);
	}, [segments]);

	useEffect(() => {
		// Fermer le menu quand la route change
		setMenuOpen(false);
	}, [segments]);

	useEffect(() => {
		if (user && !authLoading && role === "unknown") {
			// Vérifier si l'utilisateur est dans les tabs avant de rediriger
			const inTabsGroup = segments[0] === "tabs";
			if (inTabsGroup) {
				router.replace("/finalizeregistration");
			}
		}
	}, [user, role, authLoading]);

	// useEffect(() => {
	// 	// setupNotificationResponseListener a besoin de l'objet router pour naviguer
	// 	const unsubscribe = setupNotificationResponseListener(router);
	// 	return unsubscribe; // Nettoyer le listener au démontage
	// }, [router]);

	// async function registerForPushNotificationsAsync(companyId) {
	// 	let token;
	// 	if (Device.isDevice) {
	// 		const { status: existingStatus } =
	// 			await Notifications.getPermissionsAsync();
	// 		let finalStatus = existingStatus;
	// 		if (existingStatus !== "granted") {
	// 			const { status } =
	// 				await Notifications.requestPermissionsAsync();
	// 			finalStatus = status;
	// 		}
	// 		if (finalStatus !== "granted") {
	// 			console.warn("Failed to get push token for push notification!");
	// 			return;
	// 		}
	// 		token = (await Notifications.getExpoPushTokenAsync()).data;
	// 	} else {
	// 		console.warn("Must use physical device for Push Notifications");
	// 	}

	// 	if (Platform.OS === "android") {
	// 		Notifications.setNotificationChannelAsync("default", {
	// 			name: "default",
	// 			importance: Notifications.AndroidImportance.MAX,
	// 			vibrationPattern: [0, 250, 250, 250],
	// 			lightColor: "#FF231F7C",
	// 		});
	// 	}
	// 	return token;
	// }

	useEffect(() => {
		// Appeler registerForPushNotificationsAsync() au démarrage de l'app ou après connexion
		// ...
		const subscription =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					const { screen, offerId } =
						response.notification.request.content.data;
					if (screen === "OfferDetails" && offerId) {
						// Naviguer vers l'écran de l'offre
						navigation.navigate("OfferDetails", {
							offerId: offerId,
						});
					}
				},
			);
		return () => subscription.remove();
	}, []);

	// useEffect(() => {
	// 	userCompany && registerForPushNotificationsAsync(userCompany.id);
	// }, [userCompany]);

	return (
		<>
			{user && <LoggedInAppInitializer />}
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
					headerShown: true,
					headerBackTitle: "",
					headerTitle: (props) => (
						<LogoTitle {...props} colorScheme={colorScheme} />
					),
					headerRight: () => (
						<>
							{!accessToken && (
								<Link href='/signin' asChild>
									<Pressable>
										{({ pressed }) => (
											<FontAwesome
												name='info-circle'
												size={25}
												color={
													Colors[
														colorScheme ?? "light"
													].text
												}
												style={{
													marginRight: 15,
													opacity: pressed ? 0.5 : 1,
												}}
											/>
										)}
									</Pressable>
								</Link>
							)}
							<VStack>
								{contextUnreadCount > 0 && (
									<Badge
										className='absolute z-10 self-start h-[14px] w-[14px] bg-red-600 rounded-full left-0 top-1'
										variant='solid'>
										<BadgeText
											className='text-white absolute right-1'
											style={{ fontSize: 10 }}>
											{contextUnreadCount > 9
												? "9+"
												: contextUnreadCount}
										</BadgeText>
									</Badge>
								)}
								<Pressable
									// variant='link'
									style={{
										marginRight: 15,
										// backgroundColor: "pink",
										paddingHorizontal: 5,
										paddingVertical: 10,
									}}
									onPress={() =>
										router.push("/notifications")
									}>
									<Bell
										color={
											colorScheme === "dark"
												? "#f3f4f6"
												: "#111827"
										}
										size={22}
									/>
								</Pressable>
							</VStack>
							{role === "candidat" && (
								<Pressable
									onPress={() => router.push("/account")}
									style={{ marginRight: 15 }}>
									<Avatar size='sm'>
										<AvatarFallbackText>
											{userProfile?.firstname +
												" " +
												userProfile?.lastname}
										</AvatarFallbackText>
										<AvatarImage
											source={{
												uri: userProfile?.avatar_url,
											}}
										/>
									</Avatar>
								</Pressable>
							)}
							{role === "pro" && (
								<VStack>
									<Pressable
										onPress={() =>
											router.push("/dashboard")
										}
										style={{ marginRight: 15 }}>
										<Avatar size='sm'>
											<AvatarFallbackText>
												{userCompany?.name}
											</AvatarFallbackText>
											<AvatarImage
												source={{
													uri: userCompany?.logo_url,
												}}
											/>
										</Avatar>
									</Pressable>
									{userCompany &&
										!userCompany.isConfirmed && (
											<Badge
												className='z-10 h-[16px] w-[16px] bg-red-600 rounded-full'
												style={{
													display: "flex",
													justifyContent: "center",
													alignItems: "center",
													position: "absolute",
													left: -5,
													padding: 0,
												}}
												variant='solid'>
												<BadgeText
													className='text-white font-semibold'
													style={{
														position: "absolute",
														top: 1,
													}}>
													!
												</BadgeText>
											</Badge>
										)}
								</VStack>
							)}
						</>
					),
				}}>
				<Tabs.Screen
					name='tab1'
					options={{
						title: "Accueil",
						tabBarIcon: ({ color }) => (
							<House color={color} size={24} strokeWidth={2} />
						),
					}}
				/>
				<Tabs.Screen
					name='tab2'
					options={{
						title: "Toutes nos offres",
						tabBarIcon: ({ color }) => (
							<Layers color={color} size={24} strokeWidth={2} />
						),
					}}
				/>
			</Tabs>
			{role === "pro" && userCompany && (
				<View style={styles.floatingButtonContainer}>
					{userCompany.isConfirmed && (
						<Button
							size='xl'
							className={`rounded-full p-3.5`}
							onPress={() => {
								router.push("/addjob");
							}}>
							<ButtonIcon size='xl' as={Plus} />
						</Button>
					)}
					{!userCompany.isConfirmed && (
						<Button
							size='xl'
							className={`rounded-full p-3.5 bg-slate-400`}
							onPress={() => {
								toast.show({
									placement: "top",
									render: ({ id }) => (
										<Toast
											nativeID={"toast-" + id}
											className='px-5 py-3 gap-4 shadow-soft-1 items-center flex-row'>
											<Icon
												as={AlertTriangle}
												size='xl'
												className='text-typography-white'
											/>
											<VStack>
												<ToastTitle size='sm'>
													Entreprise pas encore
													validéee
												</ToastTitle>
												<ToastDescription size='xs'>
													Votre entreprise est en
													cours de validation.
												</ToastDescription>
											</VStack>
										</Toast>
									),
								});
							}}>
							<ButtonIcon size='xl' as={Plus} />
						</Button>
					)}
				</View>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	floatingButtonContainer: {
		position: "absolute",
		bottom: 60,
		alignSelf: "center",
		zIndex: 99,
	},
	floatingButton: {
		backgroundColor: "pink",
		width: 90,
		height: 90,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 5,
	},
});
