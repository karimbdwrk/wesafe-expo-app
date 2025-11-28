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
import { Button, ButtonIcon } from "@/components/ui/button";
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
} from "lucide-react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

import { useAuth } from "@/context/AuthContext";

import LoggedInAppInitializer from "@/context/LoggedInAppInitializer";

import {
	registerForPushNotificationsAsync,
	setupNotificationResponseListener,
} from "@/utils/pushNotifications";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

const TOKEN_API_ENDPOINT =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/store-push-token";

function LogoTitle() {
	return (
		<Svg viewBox='0 0 264.3 297.85' width={60} height={60}>
			<G>
				{/* <Path
					fill={"#333333"}
					d='M123.57,2.29L9.97,67.71c-6.17,3.55-9.97,10.13-9.97,17.24v127.08c0,7.1,3.78,13.66,9.93,17.22l114.49,66.28c5.34,3.09,11.93,3.08,17.26-.02l112.74-65.66c6.12-3.56,9.88-10.11,9.88-17.2v-127.7c0-7.12-3.8-13.69-9.97-17.24L140.73,2.29c-5.31-3.06-11.84-3.06-17.15,0Z'
				/> */}
				<G>
					<Path
						fill={"#333333"}
						d='M108.85,167.5v-54.85h20.57v75.42H54v-75.42h20.57v54.85h6.86v-54.85h20.57v54.85h6.86Z'
					/>
					<Path
						fill={"#333333"}
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
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		console.warn("my role :", role);
	}, [role]);

	useFocusEffect(
		useCallback(() => {
			console.log("useFocusEffect called in /(tabs)/_layout.jsx :", user);
			loadSession();
		}, [])
	);

	useEffect(() => {
		if (user && !authLoading) {
			if (role === "unknown") {
				router.replace("/finalizeregistration");
				// console.log("role is set to:", role);
			} else {
				console.log("role is set to:", role);
			}
		}
	}, [user, role]);

	useEffect(() => {
		// setupNotificationResponseListener a besoin de l'objet router pour naviguer
		const unsubscribe = setupNotificationResponseListener(router);
		return unsubscribe; // Nettoyer le listener au démontage
	}, [router]);

	async function registerForPushNotificationsAsync(companyId) {
		let token;
		if (Device.isDevice) {
			const { status: existingStatus } =
				await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;
			if (existingStatus !== "granted") {
				const { status } =
					await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== "granted") {
				// alert("Failed to get push token for push notification!");
				console.warn("Failed to get push token for push notification!");
				return;
			}
			token = (await Notifications.getExpoPushTokenAsync()).data;
			console.log(token);
			// Envoyer ce token à votre fonction Edge ou API pour le stocker dans Supabase
			// Exemple: await supabase.from('push_tokens').insert({ company_id: companyId, token: token });
		} else {
			// alert("Must use physical device for Push Notifications");
			console.warn("Must use physical device for Push Notifications");
		}

		if (Platform.OS === "android") {
			Notifications.setNotificationChannelAsync("default", {
				name: "default",
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#FF231F7C",
			});
		}
		return token;
	}

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
				}
			);
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		userCompany && registerForPushNotificationsAsync(userCompany.id);
	}, [userCompany]);

	return (
		<>
			{user && <LoggedInAppInitializer />}
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
					headerShown: useClientOnlyValue(false, true),
					headerBackTitle: "Back",
					headerTitle: (props) => <LogoTitle {...props} />,
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
							{role === "candidat" && (
								<Menu
									style={{ marginRight: 5, marginTop: 5 }}
									placement='top left'
									offset={5}
									trigger={({ ...triggerProps }) => {
										return (
											<Button
												variant='link'
												{...triggerProps}
												style={{
													marginRight: 10,
													marginBottom: 5,
												}}>
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
											</Button>
										);
									}}>
									<MenuItem
										key='Add account'
										textValue='Add account'
										onPress={() => router.push("/account")}>
										<Icon
											as={ShieldUser}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Mon compte
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='ProCard'
										textValue='ProCard'
										onPress={() =>
											router.push("/procards")
										}>
										<Icon
											as={IdCard}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Mes cartes professionnelles
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='Community'
										textValue='Community'
										onPress={() =>
											router.push("/applications")
										}>
										<Icon
											as={FileText}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Mes candidatures
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='Plugins'
										textValue='Plugins'
										onPress={() =>
											router.push("/wishlist")
										}>
										<Icon
											as={Bookmark}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Ma wishlist
										</MenuItemLabel>
									</MenuItem>
									<MenuSeparator />
									<MenuItem
										key='Settings'
										textValue='Settings'
										onPress={signOut}>
										<Icon
											as={Power}
											size='sm'
											className='mr-2'
											style={{
												color: Colors[theme].danger,
											}}
										/>
										<MenuItemLabel
											size='sm'
											style={{
												color: Colors[theme].danger,
											}}>
											Se deconnecter
										</MenuItemLabel>
									</MenuItem>
								</Menu>
							)}
							{role === "pro" && (
								<Menu
									style={{ marginRight: 5 }}
									placement='top left'
									offset={5}
									trigger={({ ...triggerProps }) => {
										return (
											<VStack>
												<Button
													variant='link'
													size='md'
													{...triggerProps}
													style={{ marginRight: 10 }}>
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
												</Button>
												<Badge
													className='z-10 h-[16px] w-[16px] bg-red-600 rounded-full'
													style={{
														display: "flex",
														justifyContent:
															"center",
														alignItems: "center",
														position: "absolute",
														left: -5,
														padding: 0,
													}}
													variant='solid'>
													<BadgeText
														className='text-white font-semibold'
														style={{
															position:
																"absolute",
															top: 1,
														}}>
														!
													</BadgeText>
												</Badge>
											</VStack>
										);
									}}>
									<MenuItem
										key='Premium'
										textValue='Premium'
										className='pt-5 pb-5 justify-between'
										onPress={() =>
											router.push("/subscription")
										}>
										{/* <Icon
											as={Box}
											size='sm'
											className='mr-2'
										/> */}
										<MenuItemLabel size='sm'>
											Membership
										</MenuItemLabel>
										<Badge
											action={
												hasSubscription
													? "success"
													: "muted"
											}
											className='rounded-full'>
											<BadgeText className='text-2xs capitalize'>
												{hasSubscription
													? "Premium"
													: "Standard"}
											</BadgeText>
										</Badge>
									</MenuItem>
									<MenuItem
										key='Add account'
										textValue='Add account'
										onPress={() =>
											router.push("/dashboard")
										}>
										<Icon
											as={LayoutDashboard}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Dashboard Pro
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='Community'
										textValue='Community'
										onPress={() => router.push("/offers")}>
										<Icon
											as={FolderKanban}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Nos offres d'emploi
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='Plugins'
										textValue='Plugins'
										onPress={() =>
											router.push("/applicationspro")
										}>
										<Icon
											as={Layers}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Nos candidatures
										</MenuItemLabel>
									</MenuItem>
									<MenuItem
										key='Plugins2'
										textValue='Plugins2'
										onPress={() =>
											router.push("/profilelist")
										}>
										<Icon
											as={BookUser}
											size='sm'
											className='mr-2'
										/>
										<MenuItemLabel size='sm'>
											Mes contacts
										</MenuItemLabel>
									</MenuItem>
									<MenuSeparator />
									<MenuItem
										key='Settings'
										textValue='Settings'
										onPress={signOut}>
										<Icon
											as={Power}
											size='sm'
											className='mr-2'
											style={{
												color: Colors[theme].danger,
											}}
										/>
										<MenuItemLabel
											size='sm'
											style={{
												color: Colors[theme].danger,
											}}>
											Se deconnecter
										</MenuItemLabel>
									</MenuItem>
								</Menu>
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
			{role === "pro" && (
				<View style={styles.floatingButtonContainer}>
					<Button
						size='xl'
						className='rounded-full p-3.5'
						onPress={() => {
							router.push("/addjob");
						}}>
						<ButtonIcon size='xl' as={Plus} />
					</Button>
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
