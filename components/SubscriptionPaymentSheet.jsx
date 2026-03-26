import React, { useState } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import {
	initPaymentSheet,
	presentPaymentSheet,
} from "@stripe/stripe-react-native";

import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { SELECT_SUBSCRIPTION_PLAN } from "@/utils/activityEvents";

const { SUPABASE_API_KEY, SUPABASE_URL } = Constants.expoConfig.extra;

export default function SubscriptionPaymentSheet({
	company_id,
	email,
	plan,
	interval,
	onSuccess,
}) {
	const { checkSubscription, refreshUser, accessToken } = useAuth();
	const { trackActivity } = useDataContext();

	const [loading, setLoading] = useState(false);

	const updateCompanySubscriptionStatus = async (newPlan) => {
		try {
			await axios.patch(
				`${SUPABASE_URL}/rest/v1/companies?id=eq.${company_id}`,
				{ subscription_status: newPlan },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
						Prefer: "return=minimal",
					},
				},
			);
			console.log(
				"✅ companies.subscription_status mis à jour:",
				newPlan,
			);
		} catch (err) {
			console.error(
				"❌ Erreur mise à jour subscription_status:",
				err.message,
			);
		}
	};

	const fetchPaymentSheetParams = async () => {
		const payload = { company_id, email, plan, interval };
		console.log("📤 create-subscription payload:", JSON.stringify(payload));
		try {
			const response = await axios.post(
				"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/create-subscription",
				payload,
				{
					headers: {
						Authorization: `Bearer ${SUPABASE_API_KEY}`,
						"Content-Type": "application/json",
					},
				},
			);

			console.log(
				"📥 create-subscription response:",
				JSON.stringify(response.data),
			);
			const { clientSecret, subscriptionId } = response.data;
			if (!clientSecret) throw new Error("clientSecret manquant");
			console.log("✅ clientSecret reçu:", clientSecret);
			return { clientSecret, subscriptionId };
		} catch (error) {
			const errData = error.response?.data;
			const errStatus = error.response?.status;
			console.error(
				"❌ Erreur create-subscription:",
				`status=${errStatus}`,
				JSON.stringify(errData ?? error.message),
			);
			Alert.alert("Erreur", "Impossible de créer la souscription.");
			return null;
		}
	};

	const initializePaymentSheet = async () => {
		const result = await fetchPaymentSheetParams();
		if (!result) return null;

		const { clientSecret } = result;

		const { error } = await initPaymentSheet({
			paymentIntentClientSecret: clientSecret,
			merchantDisplayName: "WeSafeApp",
			allowsDelayedPaymentMethods: false,
		});

		if (error) {
			Alert.alert("Erreur lors de l'initialisation", error.message);
			return null;
		}

		return clientSecret;
	};

	const openPaymentSheet = async () => {
		trackActivity(SELECT_SUBSCRIPTION_PLAN, { plan });
		setLoading(true);
		try {
			const clientSecret = await initializePaymentSheet();
			if (!clientSecret) return;

			const { error } = await presentPaymentSheet();
			if (error) {
				Alert.alert("Paiement échoué", error.message);
			} else {
				await updateCompanySubscriptionStatus(plan);
				await refreshUser();
				if (onSuccess) await onSuccess();
				Alert.alert("Succès", "Votre abonnement a été activé !");
			}
		} catch (err) {
			console.error("❌ Erreur Payment Sheet:", err.message);
			Alert.alert(
				"Erreur",
				"Une erreur est survenue pendant le paiement.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View>
			{loading ? (
				<ActivityIndicator size='large' />
			) : (
				<Button onPress={openPaymentSheet} disabled={loading}>
					<ButtonText>Souscrire à l'abonnement</ButtonText>
				</Button>
			)}
		</View>
	);
}
