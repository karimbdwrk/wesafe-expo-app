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

const { SUPABASE_API_KEY } = Constants.expoConfig.extra;

export default function SubscriptionPaymentSheet({ company_id, email }) {
	const {
		verifySubscription,
		checkSubscription,
		accessToken,
		fetchCompanyFromSession,
	} = useAuth();

	const [loading, setLoading] = useState(false);

	const fetchPaymentSheetParams = async () => {
		try {
			const response = await axios.post(
				"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/create-subscription",
				{
					company_id,
					email,
				},
				{
					headers: {
						Authorization: `Bearer ${SUPABASE_API_KEY}`,
						"Content-Type": "application/json",
					},
				}
			);

			const { clientSecret, subscriptionId } = response.data;
			if (!clientSecret) throw new Error("clientSecret manquant");
			console.log("✅ clientSecret reçu:", clientSecret);
			return { clientSecret, subscriptionId };
		} catch (error) {
			console.error(
				"❌ Erreur create-subscription:",
				error.response?.data || error.message
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
		setLoading(true);
		try {
			const clientSecret = await initializePaymentSheet();
			if (!clientSecret) return;

			const { error } = await presentPaymentSheet();
			if (error) {
				Alert.alert("Paiement échoué", error.message);
			} else {
				Alert.alert("Succès", "Votre abonnement a été activé !");
				// 👉 ici tu pourrais ajouter une logique pour mettre à jour le statut côté app si besoin
				// verifySubscription();
				checkSubscription(company_id, accessToken);
			}
		} catch (err) {
			console.error("❌ Erreur Payment Sheet:", err.message);
			Alert.alert(
				"Erreur",
				"Une erreur est survenue pendant le paiement."
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
