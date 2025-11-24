import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants"; // Importation nécessaire pour accéder aux infos du projet

import { useAuth } from "../context/AuthContext";

// Configure le gestionnaire de notifications pour le premier plan
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

// Fonction pour demander la permission et obtenir le Expo Push Token
export async function registerForPushNotificationsAsync(
	userId,
	tokenApiEndpoint
) {
	const { user, accessToken } = useAuth();

	let token;
	console.warn(
		"Test registration for push notifications 3",
		userId,
		tokenApiEndpoint
	);

	if (Device.brand) {
		console.log("Running on a physical device.");
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.warn(
				"Échec de l'obtention du jeton push pour les notifications ! Permissions non accordées."
			);
			return;
		}

		console.log(
			"Permissions accordées. Tentative d'obtention du jeton push..."
		);

		try {
			let expoPushTokenResponse;

			// Détecte si l'application est un build autonome (EAS) ou en développement local
			// 'Constants.appOwnership' sera 'standalone' pour un build EAS, ou 'expo' si vous exécutez avec Expo Go
			// ou 'guest' si vous êtes dans un simulateur sans Expo Go mais avec 'npx expo run:ios'
			const isStandaloneApp = Constants.appOwnership === "standalone";
			const projectIdFromConstants =
				Constants?.expoConfig?.extra?.eas?.projectId ??
				Constants?.easConfig?.projectId;

			if (isStandaloneApp && projectIdFromConstants) {
				// Ce bloc s'exécute si c'est un build EAS où le projectId est requis
				console.log(
					"Application autonome avec Project ID. Appel de getExpoPushTokenAsync avec projectId."
				);
				expoPushTokenResponse =
					await Notifications.getExpoPushTokenAsync({
						projectId: projectIdFromConstants,
					});
			} else if (!isStandaloneApp) {
				// Ce bloc s'exécute en développement local (Expo Go, npx expo run:ios sur simulateur/appareil)
				console.log(
					"Développement local, appel de getExpoPushTokenAsync sans projectId."
				);
				expoPushTokenResponse =
					await Notifications.getExpoPushTokenAsync();
			} else {
				// Ce cas est pour une application autonome (standalone) mais sans projectId détecté.
				// C'est un scénario de bord normalement résolu par une bonne configuration EAS.
				console.warn(
					"Avertissement: Application autonome sans Project ID trouvé. Tentative sans projectId."
				);
				expoPushTokenResponse =
					await Notifications.getExpoPushTokenAsync();
			}

			console.log(
				"Réponse brute de getExpoPushTokenAsync:",
				expoPushTokenResponse
			);

			token = expoPushTokenResponse?.data; // Utilisez le chaînage optionnel

			if (token) {
				console.log("Expo Push Token obtenu:", token);

				try {
					await axios.post(
						tokenApiEndpoint,
						{
							user_id: userId,
							token: token,
						},
						{
							headers: { Authorization: `Bearer ${accessToken}` },
						}
					);
					console.log(
						"Token de notification envoyé avec succès au backend."
					);
				} catch (error) {
					console.error(
						"Erreur lors de l'envoi du token au backend:",
						error
					);
				}
			} else {
				console.warn(
					"Aucun Expo Push Token valide n'a été reçu après l'appel. La réponse était valide, mais le champ 'data' était vide ou undefined."
				);
			}
		} catch (error) {
			console.error(
				"Erreur inattendue lors de l'appel à getExpoPushTokenAsync:",
				error
			);
			// Nous ne mettons plus l'erreur directement dans `token` car cela pourrait causer des problèmes de type.
			// Si vous avez besoin de retourner l'erreur, gérez-la séparément.
		}
	} else {
		console.warn(
			"Doit utiliser un appareil physique pour les notifications push."
		);
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

// Fonction pour gérer la réponse à la notification (quand l'utilisateur clique dessus)
export function setupNotificationResponseListener(navigation) {
	const subscription = Notifications.addNotificationResponseReceivedListener(
		(response) => {
			const { screen, offerId } =
				response.notification.request.content.data;
			if (screen === "OfferDetails" && offerId) {
				console.log("Navigating to OfferDetails with ID:", offerId);
				navigation.navigate("OfferDetails", { offerId: offerId });
			}
			// Ajoutez d'autres conditions pour d'autres types de navigation si nécessaire
		}
	);

	return () => Notifications.removeNotificationSubscription(subscription);
}
