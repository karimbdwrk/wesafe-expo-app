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

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ImageProvider } from "@/context/ImageContext";

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
		<StripeProvider publishableKey='pk_test_51RhCWfRs36t2SzSl20E1w8vTi97kdamUZ36cUp6tI7uBjzYWm3hXiNs8evBcViZpsYCHnnK7MYFl6I52jC9xS4Su000R6gOuhW'>
			<AuthProvider>
				<DataProvider>
					<ImageProvider>
						<RootLayoutNav />
					</ImageProvider>
				</DataProvider>
			</AuthProvider>
		</StripeProvider>
	);
}

function RootLayoutNav() {
	const pathname = usePathname();
	const { user, role, loading: authLoading } = useAuth();
	const [colorMode, setColorMode] = useState("light");

	useEffect(() => {
		if (authLoading) return;

		if (!user) {
			// Pas connecté → laisser accéder à index.jsx
			if (pathname !== "/") router.replace("/");
			return;
		}

		// Connecté → vérifier la finalisation
		if (role === "unknown") {
			if (pathname !== "/finalizeregistration") {
				router.replace("/finalizeregistration");
			}
			return;
		}

		// Connecté normal → aller sur tabs
		if (!pathname.startsWith("/tabs")) {
			router.replace("/tabs/(tabs)");
		}
	}, [authLoading, user, role]);

	return (
		<>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<SafeAreaProvider>
					<GluestackUIProvider mode={colorMode}>
						<Toaster />
						<ThemeProvider
							value={
								colorMode === "dark" ? DarkTheme : DefaultTheme
							}>
							<Stack
								screenOptions={{
									headerShown: false,
									headerBackTitle: "Retour",
								}}>
								<Stack.Screen
									name='index'
									options={{ headerShown: false }}
								/>
								<Stack.Screen
									name='dashboard'
									options={{
										headerShown: true,
										headerTitle: "Mon Dashboard Pro",
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
									name='scanner'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='buycredits'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='offers'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='applicationspro'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='profilelist'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='profile'
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
									name='updateprofile'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='curriculum'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='addexperience'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='signature'
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
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='application'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='wishlist'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='job'
									options={{ headerShown: true }}
								/>
								<Stack.Screen
									name='addjob'
									options={{ headerShown: true }}
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
								{/* <Slot /> */}
							</Stack>
							{pathname === "/" && (
								<Fab
									onPress={() =>
										setColorMode(
											colorMode === "dark"
												? "light"
												: "dark"
										)
									}
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
			</GestureHandlerRootView>
		</>
	);
}
