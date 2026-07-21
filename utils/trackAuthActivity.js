import axios from "axios";
import Constants from "expo-constants";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

// Écrit dans user_activity en dehors de DataContext : au moment du sign in/up,
// le contexte data n'a pas encore de user chargé, donc son trackActivity() serait no-op.
export const trackAuthActivity = async (
	userId,
	accessToken,
	eventType,
	metadata = {},
) => {
	if (!userId || !accessToken) return;
	try {
		await axios.post(
			`${SUPABASE_URL}/rest/v1/user_activity`,
			{ user_id: userId, event_type: eventType, metadata },
			{
				headers: {
					apikey: SUPABASE_API_KEY,
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.warn(
			"trackAuthActivity error:",
			error?.response?.data || error?.message,
		);
	}
};
