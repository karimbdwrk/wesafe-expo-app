import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

export async function registerForPushNotificationsAsync(
	userId,
	userCompanyId,
	tokenApiEndpoint,
	accessToken,
) {
	let token;

	console.warn("registerForPushNotificationsAsync called with:", {
		userId,
		userCompanyId,
		tokenApiEndpoint,
		accessToken,
	});

	console.warn(
		"Device.brand:",
		Device.brand,
		"Device.isDevice:",
		Device.isDevice,
	);
	if (!Device.isDevice) {
		console.warn(
			"Doit utiliser un appareil physique pour les notifications push.",
		);
		return;
	}

	const { status: existingStatus } =
		await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync({
			ios: {
				allowAlert: true,
				allowBadge: true,
				allowSound: true,
			},
		});
		finalStatus = status;
	}

	if (finalStatus !== "granted") {
		console.warn("Permissions non accordées.");
		return;
	}

	try {
		let expoTokenResponse;

		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId;

		console.warn("projectId used for push token:", projectId);

		expoTokenResponse = await Notifications.getExpoPushTokenAsync(
			projectId ? { projectId } : {},
		);

		token = expoTokenResponse?.data;
		console.warn("Push token obtained:", token);

		if (token) {
			const res = await axios.post(
				tokenApiEndpoint,
				{
					user_id: userId,
					company_id: userCompanyId,
					token,
				},
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);
			console.warn("Token stored in DB:", res.status, res.data);
		}
	} catch (error) {
		console.warn(
			"Erreur lors de l'envoi du token:",
			error?.response?.data || error?.message || error,
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

/**
 * Navigue vers le bon écran selon les data d'une notification push
 */
export function navigateFromNotificationData(data, router) {
	if (!data) return;

	if (data.entity_type === "application" && data.entity_id) {
		router.push({
			pathname: "/application",
			params: { apply_id: data.entity_id },
		});
		return;
	}

	if (data.entity_type === "message" && data.entity_id) {
		router.push({
			pathname: "/application",
			params: { apply_id: data.entity_id, openMessaging: "true" },
		});
		return;
	}

	if (data.entity_type === "job" && data.entity_id) {
		router.push({
			pathname: "/job",
			params: { id: data.entity_id },
		});
		return;
	}

	if (data.entity_type === "kbis_review") {
		router.push({ pathname: "/kbisdocumentverification" });
		return;
	}

	if (data.screen) {
		router.push({ pathname: `/${data.screen}` });
	}
}

/**
 * ⚡️ Configure le listener quand un utilisateur TAP sur une notification (app en arrière-plan)
 * Compatible Expo Router (router.push)
 */
export function setupNotificationResponseListener(router) {
	const subscription = Notifications.addNotificationResponseReceivedListener(
		(response) => {
			const data = response.notification.request.content.data;
			console.warn(
				"🔔 [BACKGROUND] Notification data:",
				JSON.stringify(data),
			);
			navigateFromNotificationData(data, router);
		},
	);

	return () => subscription.remove();
}
