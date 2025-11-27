import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerForPushNotificationsAsync } from "@/utils/pushNotifications";

const TOKEN_API_ENDPOINT =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/store-push-token";

const LoggedInAppInitializer = () => {
	const { user, userCompany, accessToken } = useAuth(); // 👈 AJOUT accessToken

	useEffect(() => {
		if (user?.id && userCompany?.id) {
			registerForPushNotificationsAsync(
				user.id,
				userCompany.id,
				TOKEN_API_ENDPOINT,
				accessToken // 👈 PASS accessToken AU LIEU D'APPELER useAuth()
			);
		}
	}, [user, userCompany, accessToken]);

	return null;
};

export default LoggedInAppInitializer;
