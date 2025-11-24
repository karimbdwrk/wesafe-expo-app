import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import axios from "axios";
import { Platform } from "react-native";
// import { useDataContext } from "../context/DataContext"; // Importe ton hook DataContext

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const storePushTokenDirectly = async (userId, accessToken) => {
	// Récupère les méthodes du DataContext via le hook
	// const { create, update, getAll } = useDataContext();

	const axiosInstance = axios.create({
		baseURL: `${SUPABASE_URL}/rest/v1`,
		headers: {
			apikey: SUPABASE_API_KEY,
			Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
			"Content-Type": "application/json",
		},
	});

	const getAll = async (
		table,
		select = "*",
		filters = "",
		page = 1,
		limit = 10,
		order
	) => {
		try {
			const from = (page - 1) * limit;
			const to = from + limit - 1;

			const query = `/${table}?select=${select}${filters}&order=${order}&offset=${from}&limit=${limit}`;

			const res = await axiosInstance.get(query, {
				headers: {
					Prefer: "count=exact",
				},
			});

			const contentRange = res.headers["content-range"];
			const totalCount = contentRange
				? parseInt(contentRange.split("/")[1], 10)
				: res.data.length;

			return { data: res.data, totalCount };
		} catch (error) {
			console.error(
				"Error fetching data:",
				error.response?.data || error.message
			);
			throw error;
		}
	};

	const create = async (table, data) => {
		console.log("create token :", accessToken);
		try {
			console.log(
				"create data :",
				table,
				data,
				accessToken,
				SUPABASE_API_KEY
			);
			const res = await axiosInstance.post(`/${table}`, data);
			console.log(res.data);
			return res.data;
		} catch (error) {
			console.error(
				"Error creating data:",
				error.response?.data || error.message
			);
			console.error("Create failed", error.message);
			console.error("Full error:", error.toJSON?.() || error);
			console.log("BASE_URL:", axiosInstance.defaults.baseURL);
			console.log("Headers:", axiosInstance.defaults.headers);

			throw error;
		}
	};

	const update = async (table, id, data) => {
		console.log(`Updating data in table: ${table}, ID: ${id}, Data:`, data);
		try {
			const res = await axiosInstance.patch(
				`/${table}?id=eq.${id}`,
				data
			);
			console.log("Data updated successfully:", res.data);
			return res.data;
		} catch (error) {
			console.error(
				"Error updating data:",
				error.response?.data || error.message
			);
			console.error("Update failed", error.message);
			console.error("Full error:", error.toJSON?.() || error);
			console.log("BASE_URL:", axiosInstance.defaults.baseURL);
			console.log("Headers:", axiosInstance.defaults.headers);

			throw error;
		}
	};

	if (!userId) {
		console.warn("User ID is missing. Cannot store push token.");
		return;
	} else {
		console.log("Storing push token for user ID:", userId);
	}

	const tableName = "push_tokens";
	let expoPushToken;

	// --- 1. Obtenir le Expo Push Token de l'appareil ---
	if (!Device.brand) {
		console.log(
			"Push notifications are only available on physical devices."
		);
		return;
	}

	try {
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

		// Assure-toi que `Constants.expoConfig.projectId` est correctement configuré dans app.json
		// Si tu es en Bare Workflow et qu'il n'est pas inféré, remplace par ton ID de projet Expo directement.
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ||
			"dd6d1001-e217-43e0-b545-e89b21412e4b"; // EX: "c878939c-f230-4e36-96a9-839f37c3a002"

		if (!projectId) {
			console.error(
				"Project ID is missing for getExpoPushTokenAsync. Check app.json or hardcode it."
			);
			return;
		}

		expoPushToken = (
			await Notifications.getExpoPushTokenAsync({ projectId })
		).data;
		console.log("Got Expo Push Token:", expoPushToken);
	} catch (tokenError) {
		console.error("Error getting Expo Push Token:", tokenError.message);
		return;
	}

	if (!expoPushToken) {
		console.warn("No Expo Push Token obtained.");
		return;
	}

	// --- 2. Stocker ou mettre à jour le token dans la base de données ---
	try {
		console.log(
			`Checking for existing token for user ID: ${userId} using getAll.`
		);

		// Utilise ta méthode getAll avec un filtre pour chercher par user_id.
		// ASSUMPTION: Ta méthode `getAll` prend le nom de la table et un objet de filtre
		// comme `getAll(tableName, { user_id: userId })`.
		// Si ta signature est différente (e.g., `getAll(tableName, "user_id", "user_id=eq.${userId}", ...)`,
		// tu devras adapter l'appel ici.
		const existingTokenRecords = await getAll(
			tableName,
			"user_id",
			`&user_id=eq.${userId}`,
			1,
			1,
			"created_at.desc"
		);

		// On prend le premier enregistrement trouvé, ou null s'il n'y en a pas.
		// On suppose qu'un utilisateur n'aura qu'un seul token actif ou que tu veux mettre à jour le premier trouvé.
		const existingTokenRecord =
			existingTokenRecords && existingTokenRecords.length > 0
				? existingTokenRecords[0]
				: null;

		const dataToStore = {
			user_id: userId,
			token: expoPushToken,
		};

		let response;
		if (existingTokenRecord) {
			// Si un token existe, on le met à jour
			console.log(
				`Existing token found (ID: ${existingTokenRecord.id}). Attempting to update.`
			);
			response = await update(
				tableName,
				existingTokenRecord.id,
				dataToStore
			);
			console.log("Push token updated successfully:", response);
		} else {
			// Sinon, on crée un nouvel enregistrement
			console.log(
				"No existing token found. Attempting to create new token."
			);
			response = await create(tableName, dataToStore);
			console.log("Push token created successfully:", response);
		}
		return response;
	} catch (error) {
		console.error(
			"Error storing push token via DataContext (getAll/create/update):",
			error.response?.data || error.message
		);
		// On relance l'erreur pour qu'elle puisse être gérée plus haut si nécessaire.
		throw error;
	}
};

export default storePushTokenDirectly;
