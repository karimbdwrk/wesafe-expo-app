import React from "react";
import { View, Button, Alert } from "react-native";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";

const SendTestEmail = () => {
	const { user, accessToken } = useAuth();

	const sendEmail = async () => {
		try {
			const response = await axios.post(
				"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-test-email",
				{
					to: "karim@badwork.fr",
					name: "Jean Testeur",
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			Alert.alert("Succès", "Email envoyé !");
		} catch (error) {
			console.error("Erreur envoi :", error);
			Alert.alert("Erreur", "Échec de l'envoi de l'email");
		}
	};

	return (
		<View style={{ marginTop: 100, padding: 20 }}>
			<Button title='Envoyer un email de test' onPress={sendEmail} />
		</View>
	);
};

export default SendTestEmail;
