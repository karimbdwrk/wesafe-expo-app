import React from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Slot, Stack, usePathname, router } from "expo-router";
import { Fab, FabIcon } from "@/components/ui/fab";
import { MoonIcon, SunIcon } from "@/components/ui/icon";

import MyHeader from "@/components/MyHeader";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import { StripeProvider } from "@stripe/stripe-react-native"; // Commenté temporairement - nécessite dev build
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider, useDataContext } from "@/context/DataContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ImageProvider } from "@/context/ImageContext";
import {
	ThemeProvider as AppThemeProvider,
	useTheme,
} from "@/context/ThemeContext";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StripeProvider publishableKey='pk_test_51RhCWfRs36t2SzSl20E1w8vTi97kdamUZ36cUp6tI7uBjzYWm3hXiNs8evBcViZpsYCHnnK7MYFl6I52jC9xS4Su000R6gOuhW'>
				<AppThemeProvider>
					<AuthProvider>
						<DataProvider>
							<NotificationsProvider>
								<ImageProvider>
									<RootLayoutNav />
								</ImageProvider>
							</NotificationsProvider>
						</DataProvider>
					</AuthProvider>
				</AppThemeProvider>
			</StripeProvider>
		</GestureHandlerRootView>
	);
}

function RootLayoutNav() {
	const pathname = usePathname();
	const { user, role, loading: authLoading } = useAuth();
	const { colorMode, toggleColorMode } = useTheme();
	const { trackActivity } = useDataContext();

	// Track open_app une seule fois quand l'user est connecté
	const hasTrackedOpen = React.useRef(false);
	useEffect(() => {
		if (user?.id && !hasTrackedOpen.current) {
			hasTrackedOpen.current = true;
			trackActivity("open_app");
		}
		if (!user) hasTrackedOpen.current = false;
	}, [user?.id]);

	useEffect(() => {
		console.log(
			"🔄 _layout useEffect - authLoading:",
			authLoading,
			"user:",
			!!user,
			"role:",
			role,
			"pathname:",
			pathname,
		);

		if (authLoading) return;

		// Ne rien faire si on est sur createprofile ou createcompany - laisser ces écrans gérer leur propre navigation
		if (pathname === "/createprofile" || pathname === "/createcompany") {
			console.log("⏸️ Skipping redirect - on creation screen");
			return;
		}

		if (!user) {
			console.log("❌ pas connecté, pathname:", pathname);
			// Pas connecté → rediriger vers connexion
			if (
				pathname !== "/connexion" &&
				pathname !== "/signin" &&
				pathname !== "/signup"
			) {
				console.log("🔀 Redirecting to /connexion from", pathname);
				router.replace("/connexion");
			}
			return;
		}

		// Connecté → vérifier la finalisation
		if (role === "unknown") {
			console.log("⚠️ Role unknown, pathname:", pathname);
			// Permettre finalizeregistration
			if (pathname !== "/finalizeregistration") {
				console.log(
					"🔀 Redirecting to /finalizeregistration from",
					pathname,
				);
				router.replace("/finalizeregistration");
			}
			return;
		}

		// Connecté normal → aller sur tabs uniquement si sur les écrans de connexion/signup
		console.log("✅ User connected with role:", role);
		if (
			pathname === "/" ||
			pathname === "/connexion" ||
			pathname === "/signin" ||
			pathname === "/signup" ||
			pathname === "/finalizeregistration"
		) {
			console.log("🔀 Redirecting to /tabs/(tabs) from", pathname);
			router.replace("/tabs/(tabs)");
		}
	}, [authLoading, user, role, pathname]);

	return (
		<>
			<SafeAreaProvider>
				<GluestackUIProvider mode={colorMode}>
					<Toaster />
					<ThemeProvider
						value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
						<Stack
							screenOptions={{
								header: (props) => (
									<MyHeader
										title={props.options.headerTitle}
										headerRight={props.options.headerRight}
										showBack={props.back}
										titleBadge={props.options.titleBadge}
									/>
								),
								headerShown: false,
								headerBackTitleStyle: { fontSize: 0 },
								headerBackTitle: "Retour",
								headerRightContainerStyle: {
									backgroundColor: "transparent",
								},
								headerBlurEffect: "regular",
							}}>
							<Stack.Screen
								name='index'
								options={{ headerShown: false }}
							/>
							<Stack.Screen
								name='connexion'
								options={{ headerShown: false }}
							/>
							<Stack.Screen
								name='analytics'
								options={{
									headerShown: true,
									headerTitle: "Analytics",
								}}
							/>
							<Stack.Screen
								name='postjob'
								options={{
									headerShown: true,
									headerTitle: "Publier une offre",
								}}
							/>
							<Stack.Screen
								name='dashboard'
								options={{
									headerShown: true,
									headerTitle: "Mon Dashboard Pro",
								}}
							/>
							<Stack.Screen
								name='notifications'
								options={{
									headerShown: true,
									headerTitle: "Notifications",
								}}
							/>
							<Stack.Screen
								name='createprofile'
								options={{
									headerShown: true,
									headerTitle: "Créer mon profil",
								}}
							/>
							<Stack.Screen
								name='createcompany'
								options={{
									headerShown: true,
									headerTitle: "Créer mon entreprise",
								}}
							/>
							<Stack.Screen
								name='updatecompany'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='stamp'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='updatestamp'
								options={{ headerShown: true }}
							/>
							<Stack.Screen name='scanner' />
							<Stack.Screen
								name='buycredits'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='offers'
								options={{
									headerShown: true,
									headerTitle: "Mes offres",
								}}
							/>
							<Stack.Screen
								name='applicationspro'
								options={{
									headerShown: true,
									headerTitle: "Candidatures",
								}}
							/>
							<Stack.Screen
								name='profilelist'
								options={{
									headerShown: true,
									headerTitle: "Mes contacts",
								}}
							/>
							<Stack.Screen
								name='profile'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='kbisdocumentverification'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='account'
								options={{
									headerShown: true,
									headerTitle: "Mon Compte",
								}}
							/>
							<Stack.Screen
								name='documents'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='iddocumentverification'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='socialsecuritydocumentverification'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='updateprofile'
								options={{
									headerShown: true,
									headerTitle: "Mettre à jour mon profil",
								}}
							/>
							<Stack.Screen
								name='curriculumvitae'
								options={{
									headerShown: true,
									headerTitle: "Mon CV",
								}}
							/>
							<Stack.Screen
								name='addexperience'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='signature'
								options={{
									headerShown: true,
									headerTitle: "Ma signature",
								}}
							/>
							<Stack.Screen
								name='settings'
								options={{
									headerShown: true,
									headerTitle: "Paramètres",
								}}
							/>
							<Stack.Screen
								name='prodocs'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='procards'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='procard'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='addprocard'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='applications'
								options={{
									headerShown: true,
									headerTitle: "Mes candidatures",
								}}
							/>
							<Stack.Screen
								name='application'
								options={{
									headerShown: true,
									headerTitle: "Candidature",
								}}
							/>
							<Stack.Screen
								name='messaging'
								options={{
									presentation: "modal",
									headerShown: false,
									animation: "slide_from_bottom",
									gestureEnabled: true,
									gestureDirection: "vertical",
								}}
							/>
							<Stack.Screen
								name='wishlist'
								options={{
									headerShown: true,
									headerTitle: "Ma Wishlist",
								}}
							/>
							<Stack.Screen
								name='job'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='faq'
								options={{
									headerShown: true,
									headerTitle: "Centre d'aide",
								}}
							/>
							<Stack.Screen
								name='lastminute'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='contactus'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='subscription'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='contract'
								options={{ headerShown: true }}
							/>
							<Stack.Screen
								name='languages'
								options={{
									headerShown: true,
									headerTitle: "Choisir la langue",
								}}
							/>
							<Stack.Screen name='camera' />
							{/* <Slot /> */}
						</Stack>
						{pathname === "/" && (
							<Fab
								onPress={toggleColorMode}
								className='m-6'
								size='lg'>
								<FabIcon
									as={
										colorMode === "dark"
											? MoonIcon
											: SunIcon
									}
								/>
							</Fab>
						)}
					</ThemeProvider>
				</GluestackUIProvider>
			</SafeAreaProvider>
		</>
	);
}
