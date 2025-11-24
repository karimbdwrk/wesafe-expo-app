// util/notifications.js
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const storePushToken = async (
	createFn,
	updateFn,
	fetchByColumnFn,
	userId,
	companyId
) => {
	if (!userId) {
		console.warn("User ID is missing, cannot store push token.");
		return;
	}

	let expoPushToken;
	const tableName = "push_tokens";

	// --- 1. Obtenir le ExpoPushToken ---
	if (Constants.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.warn(
				"Failed to get push token for push notification: Permissions not granted."
			);
			return;
		}

		const projectId =
			Constants?.expoConfig?.projectId || "YOUR_EXPO_PROJECT_ID_HERE"; // Remplace par ton ID réel

		if (!projectId) {
			console.error(
				"Project ID is missing for getExpoPushTokenAsync. Check app.json or hardcode it."
			);
			return;
		}

		try {
			expoPushToken = (
				await Notifications.getExpoPushTokenAsync({ projectId })
			).data;
			console.log("Got Expo Push Token:", expoPushToken);
		} catch (tokenError) {
			console.error("Error getting Expo Push Token:", tokenError.message);
			return;
		}
	} else {
		console.log(
			"Push notifications are only available on physical devices."
		);
		return;
	}

	if (!expoPushToken) {
		console.warn("No Expo Push Token obtained.");
		return;
	}

	// --- 2. Stocker ou mettre à jour le token dans Supabase via DataContext ---
	try {
		console.log(`Checking for existing token for user_id: ${userId}`);
		// Utilise la nouvelle méthode fetchByColumn pour chercher par user_id
		const existingTokenRecord = await fetchByColumnFn(
			tableName,
			"user_id",
			userId
		);

		if (existingTokenRecord) {
			// Si une entrée existe, on la met à jour
			console.log(
				`Existing token found (ID: ${existingTokenRecord.id}). Attempting to update.`
			);
			await updateFn(tableName, existingTokenRecord.id, {
				token: expoPushToken,
				company_id: companyId,
			});
			console.log("Push token updated successfully.");
		} else {
			// Si aucune entrée n'existe, on en crée une nouvelle
			console.log(
				"No existing token found. Attempting to create new token."
			);
			await createFn(tableName, {
				user_id: userId,
				company_id: companyId,
				token: expoPushToken,
			});
			console.log("Push token created successfully.");
		}
	} catch (error) {
		console.error(
			"Error storing push token via DataContext (fetch/create/update):",
			error.response?.data || error.message
		);
		throw error;
	}
};
