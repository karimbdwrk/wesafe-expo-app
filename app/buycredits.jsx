import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Button, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";

// import { supabase } from "../supabaseClient";
// Pour obtenir l'ID de l'utilisateur
// Assurez-vous d'avoir une fonction pour fetcher les crédits de l'entreprise
// export const fetchCompanyCredits = async (companyId) => { ... }
// et pour recharger les informations de l'entreprise si nécessaire.

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import { useStripePaymentHandler } from "../services/stripeApi";

const BuyCreditsScreen = () => {
	const { user, loadUserData, accessToken } = useAuth();
	const { getById, update } = useDataContext();

	const { initiateAndPresentPayment } = useStripePaymentHandler();

	const [loading, setLoading] = useState(false);
	const [credits, setCredits] = useState(0);
	const [companyId, setCompanyId] = useState(null);

	const loadCompanyCredits = async (id) => {
		setLoading(true);
		const data = await getById("companies", id, `last_minute_credits`);
		console.log("Fetched company credits:", data);
		setCredits(data.last_minute_credits);
		// if (error) {
		// 	console.error("Error fetching company credits:", error);
		// 	setCredits(0);
		// 	Alert.alert("Erreur", "Impossible de charger vos crédits.");
		// } else if (data) {
		// 	console.log("Fetched company credits:", data);
		// 	setCredits(data.last_minute_credits);
		// }
		setLoading(false);
	};

	const addCompanyCredits = async (id) => {
		setLoading(true);
		const data = await update("companies", id, {
			last_minute_credits: credits + 10,
		});
		console.log("added company credits data:", data);
	};

	// const loadJob = async () => {
	// 	const data = await getById("jobs", id, `*, companies(name, email)`);
	// 	console.log("data job :", data);
	// 	setJob(data);
	// };

	const fetchUserAndCredits = async () => {
		// const {
		// 	data: { user },
		// } = await supabase.auth.getUser();
		if (user) {
			setCompanyId(user.id);
			await loadCompanyCredits(user.id);
		} else {
			Alert.alert(
				"Erreur",
				"Vous devez être connecté pour acheter des crédits."
			);
			navigation.navigate("Login");
		}
	};

	useFocusEffect(
		useCallback(() => {
			fetchUserAndCredits();
		}, [companyId])
	);

	// useEffect(() => {
	// 	const fetchUserAndCredits = async () => {
	// 		// const {
	// 		// 	data: { user },
	// 		// } = await supabase.auth.getUser();
	// 		if (user) {
	// 			setCompanyId(user.id);
	// 			await loadCompanyCredits(user.id);
	// 		} else {
	// 			Alert.alert(
	// 				"Erreur",
	// 				"Vous devez être connecté pour acheter des crédits."
	// 			);
	// 			navigation.navigate("Login");
	// 		}
	// 	};
	// 	fetchUserAndCredits();

	// 	// const unsubscribe = navigation.addListener("focus", () => {
	// 	// 	if (companyId) loadCompanyCredits(companyId); // Recharger à chaque fois qu'on revient
	// 	// });
	// 	// return unsubscribe;
	// }, [companyId]);

	const handleBuyCredits = async () => {
		if (!companyId) {
			Alert.alert(
				"Erreur",
				"ID de l'entreprise manquant. Veuillez vous reconnecter."
			);
			return;
		}
		setLoading(true);
		// Appelle la fonction Edge pour initier le paiement
		const result = await initiateAndPresentPayment(
			companyId,
			3000,
			"credits_pack"
		); // 3000 cents = 30 EUR

		if (result.success) {
			// Le webhook s'occupera d'ajouter les crédits en BDD. On rafraîchit l'affichage.
			Alert.alert("Succès", "Votre pack de 10 crédits a été acheté !");
			await addCompanyCredits(companyId); // Ajouter les crédits localement
			await loadCompanyCredits(companyId); // Recharger les crédits pour afficher la nouvelle quantité
			loadUserData(companyId, accessToken);
		}
		// Les messages d'erreur sont déjà gérés par initiateAndPresentPayment via Alert
		setLoading(false);
	};

	return (
		<View style={{ padding: 20 }}>
			<Text
				style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
				Acheter des Crédits Last Minute
			</Text>
			<Text style={{ fontSize: 18, marginBottom: 10 }}>
				Vos crédits actuels : {credits}
			</Text>

			<View style={{ marginBottom: 20 }}>
				<Text style={{ fontSize: 16 }}>
					Pack de 10 crédits pour 30€
				</Text>
				<Text style={{ fontSize: 14, color: "#666" }}>
					(Soit 3€ par annonce au lieu de 5€)
				</Text>
			</View>

			<Button
				title={
					loading ? "Chargement..." : "Acheter un pack de 10 crédits"
				}
				onPress={handleBuyCredits}
				disabled={loading || !companyId}
			/>

			{loading && (
				<ActivityIndicator
					size='large'
					color='#0000ff'
					style={{ marginTop: 20 }}
				/>
			)}
		</View>
	);
};

export default BuyCreditsScreen;
