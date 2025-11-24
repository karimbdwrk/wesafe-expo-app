import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // Votre hook useAuth
import { registerForPushNotificationsAsync } from "@/utils/pushNotifications"; // Votre fonction de notifications

const TOKEN_API_ENDPOINT =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/store-push-token";

const LoggedInAppInitializer = () => {
	const { user, userCompany } = useAuth(); // Récupère l'utilisateur et l'ID de l'entreprise depuis votre AuthContext

	useEffect(() => {
		// Cette logique ne se déclenchera que si LoggedInAppInitializer est rendu,
		// ce qui devrait être le cas uniquement si l'utilisateur est connecté.
		console.log(
			"LoggedInAppInitializer: Checking conditions for push token registration...",
			{
				userId: user?.id,
				userCompanyId: userCompany?.id,
			}
		);

		if (user?.id && userCompany?.id) {
			console.log(
				"LoggedInAppInitializer: Conditions met! Calling registerForPushNotificationsAsync..."
			);
			registerForPushNotificationsAsync(
				user.id,
				userCompany.id,
				TOKEN_API_ENDPOINT
			);
		} else {
			console.warn(
				"LoggedInAppInitializer: Conditions NOT met for push token registration.",
				{
					userId: user?.id,
					userCompanyId: userCompany?.id,
				}
			);
		}
	}, [user, userCompany]); // Déclenche quand user ou userCompanyId changent

	return null; // Ce composant ne rend rien visuellement, il gère juste la logique
};

export default LoggedInAppInitializer;
