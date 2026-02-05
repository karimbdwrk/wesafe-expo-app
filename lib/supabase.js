import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

export const createSupabaseClient = (accessToken) =>
	createClient(SUPABASE_URL, SUPABASE_API_KEY, {
		global: {
			headers: {
				Authorization: accessToken
					? `Bearer ${accessToken}`
					: undefined,
			},
		},
	});
