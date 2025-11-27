// Dans votre composant React Native / Expo
import React, { useState, useCallback } from "react";
import { Button, View, Text, ActivityIndicator, Alert } from "react-native";
import axios from "axios"; // Importez Axios
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const CancelSubscriptionScreen = () => {
	const { accessToken } = useAuth();

	const params = useLocalSearchParams();
	const { subscription_id } = params;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [userSubscriptionId, setUserSubscriptionId] = useState(null);

	useFocusEffect(
		useCallback(() => {
			console.log("sub ID :", subscription_id);
			setUserSubscriptionId(subscription_id);
		}, [subscription_id])
	);

	const handleCancelSubscription = async () => {
		setLoading(true);
		setError(null);

		try {
			// Pour une Edge Function Supabase, l'URL est typiquement:
			// VOTRE_URL_SUPABASE/functions/v1/nom-de-votre-fonction
			const supabaseUrl = SUPABASE_URL; // Assurez-vous que cette variable est bien configurée dans .env
			const functionUrl = `${supabaseUrl}/functions/v1/cancel-subscription`; // Le nom de votre Edge Function

			if (!userSubscriptionId) {
				Alert.alert("Erreur", "ID d'abonnement manquant.");
				setLoading(false);
				return;
			}

			// Si votre Edge Function 'cancel-subscription' nécessite une authentification
			// (ce qui est FORTEMENT recommandé pour des raisons de sécurité),
			// vous devrez passer le token d'authentification dans les headers.
			const headers = {
				"Content-Type": "application/json",
			};
			if (accessToken) {
				// N'ajoutez le header que si un token est disponible
				headers["Authorization"] = `Bearer ${accessToken}`;
			} else {
				// Si l'authentification est requise et que le token est absent
				Alert.alert(
					"Erreur",
					"Non authentifié. Veuillez vous connecter."
				);
				setLoading(false);
				return;
			}

			const response = await axios.post(
				functionUrl,
				{
					subscriptionId: userSubscriptionId,
				},
				{ headers }
			);

			const data = response.data; // Axios place la réponse JSON dans response.data

			Alert.alert(
				"Succès",
				`Abonnement ${data.subscriptionId} résilié avec succès. Statut: ${data.status}`
			);
			// Mettre à jour l'état de l'application ou naviguer après la résiliation
			// Par exemple: refetcher les données de l'abonnement de l'utilisateur
		} catch (err) {
			console.error("Erreur de résiliation:", err);
			// Axios renvoie l'erreur dans err.response.data pour les erreurs HTTP
			const errorMessage =
				err.response?.data?.error ||
				err.message ||
				"Une erreur inattendue est survenue.";
			setError(errorMessage);
			Alert.alert("Erreur", errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View
			style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Text style={{ marginBottom: 20 }}>Gérer votre abonnement</Text>
			{error && (
				<Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
			)}
			<Button
				title={
					loading ? "Résilier en cours..." : "Résilier l'abonnement"
				}
				onPress={handleCancelSubscription}
				disabled={loading || !userSubscriptionId}
			/>
			{loading && <ActivityIndicator style={{ marginTop: 10 }} />}
			{/* Afficher l'ID d'abonnement actuel pour le débogage */}
			{userSubscriptionId && (
				<Text style={{ marginTop: 20 }}>
					Votre ID d'abonnement: {userSubscriptionId}
				</Text>
			)}
		</View>
	);
};

export default CancelSubscriptionScreen;
