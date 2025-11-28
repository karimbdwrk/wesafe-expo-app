import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

export async function registerForPushNotificationsAsync(
	userId,
	userCompanyId,
	tokenApiEndpoint,
	accessToken
) {
	let token;

	console.warn("registerForPushNotificationsAsync called with:", {
		userId,
		userCompanyId,
		tokenApiEndpoint,
		accessToken,
	});

	if (!Device.brand) {
		console.warn(
			"Doit utiliser un appareil physique pour les notifications push."
		);
		return;
	}

	const { status: existingStatus } =
		await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== "granted") {
		console.warn("Permissions non accordées.");
		return;
	}

	try {
		let expoTokenResponse;

		const isStandaloneApp = Constants.appOwnership === "standalone";
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId;

		if (isStandaloneApp && projectId) {
			expoTokenResponse = await Notifications.getExpoPushTokenAsync({
				projectId,
			});
		} else {
			expoTokenResponse = await Notifications.getExpoPushTokenAsync();
		}

		token = expoTokenResponse?.data;

		if (token) {
			await axios.post(
				tokenApiEndpoint,
				{
					user_id: userId,
					company_id: userCompanyId,
					token,
				},
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
		}
	} catch (error) {
		console.error("Erreur lors de l'envoi du token:", error);
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

/**
 * ⚡️ Configure le listener quand un utilisateur TAP sur une notification
 * Compatible Expo Router (router.push)
 */
export function setupNotificationResponseListener(router) {
	const subscription = Notifications.addNotificationResponseReceivedListener(
		(response) => {
			const data = response.notification.request.content.data;

			// Ex: data = { screen: "offer-details", offerId: 42 }
			if (data?.screen) {
				console.log("🔔 Navigating from Push Notification:", data);

				if (data.offerId) {
					router.push(`/${data.screen}?offerId=${data.offerId}`);
				} else {
					router.push(`/${data.screen}`);
				}
			}
		}
	);

	return () => subscription.remove();
}
