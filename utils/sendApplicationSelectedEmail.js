import axios from "axios";

export const sendApplicationSelectedEmail = async (
	candidateName,
	candidateEmail,
	offerTitle,
	companyName,
) => {
	console.log("Envoi de l'email de sélection avec les données:", {
		candidateName,
		candidateEmail,
		offerTitle,
		companyName,
	});
	try {
		const EDGE_FUNCTION_URL =
			"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-application-selected-email";

		const payload = {
			candidateName,
			candidateEmail,
			offerTitle,
			companyName,
		};

		const response = await axios.post(EDGE_FUNCTION_URL, payload);

		if (response.status === 200) {
			return { success: true };
		}

		return { success: false, message: "Failed to send email" };
	} catch (error) {
		return {
			success: false,
			message: error.response?.data?.error || error.message,
		};
	}
};
