import axios from "axios";

/**
 * Envoie un email de notification pour une étape du recrutement
 * @param {string} recipientEmail - Email du destinataire
 * @param {string} recipientName - Nom du destinataire
 * @param {string} actorName - Nom de la personne qui a fait l'action
 * @param {string} status - Le nouveau statut (selected, contract_sent, contract_signed_candidate, etc.)
 * @param {string} jobTitle - Titre de l'offre
 * @param {string} recipientType - "candidate" ou "company"
 * @param {string} accessToken - Token d'authentification JWT
 */
export const sendRecruitmentStatusEmail = async (
	recipientEmail,
	recipientName,
	actorName,
	status,
	jobTitle,
	recipientType,
	accessToken,
) => {
	try {
		const EDGE_FUNCTION_URL =
			"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-recruitment-status-email";

		const payload = {
			recipientEmail,
			recipientName,
			actorName,
			status,
			jobTitle,
			recipientType,
		};

		console.log(
			"Envoi de l'email de notification de statut avec les données:",
			payload,
		);

		const response = await axios.post(EDGE_FUNCTION_URL, payload, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (response.status === 200) {
			console.log(
				"Email de notification de statut envoyé avec succès !",
				response.data,
			);
			return { success: true, message: "Email sent successfully!" };
		} else {
			console.error(
				"Erreur lors de l'envoi de l'email de notification :",
				response.data,
			);
			return {
				success: false,
				message: response.data.error || "Failed to send email",
			};
		}
	} catch (error) {
		console.error(
			"Erreur réseau ou inattendue lors de l'envoi de l'email :",
			error.message,
		);
		console.error("Détails de l'erreur:", error.response?.data);
		console.error("Status code:", error.response?.status);
		return {
			success: false,
			message: error.message || "Network error occurred",
		};
	}
};
