import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerForPushNotificationsAsync } from "@/utils/pushNotifications";

const TOKEN_API_ENDPOINT =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/store-push-token";

const LoggedInAppInitializer = () => {
	const { user, userCompany, accessToken } = useAuth();

	useEffect(() => {
		if (user?.id) {
			registerForPushNotificationsAsync(
				user.id,
				userCompany?.id,
				TOKEN_API_ENDPOINT,
				accessToken,
			);
		}
	}, [user, userCompany, accessToken]);

	return null;
};

export default LoggedInAppInitializer;
