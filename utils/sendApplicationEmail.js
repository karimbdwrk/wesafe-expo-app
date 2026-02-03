import axios from "axios";

export const sendApplicationEmail = async (
	applicantName,
	applicantEmail,
	offerTitle,
	companyEmail,
	companyName,
) => {
	try {
		const EDGE_FUNCTION_URL =
			"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-application-email";

		const payload = {
			applicantName,
			applicantEmail,
			offerTitle,
			companyEmail,
			companyName,
		};

		console.log("Envoi de l'email avec les données:", payload);

		const response = await axios.post(EDGE_FUNCTION_URL, payload);

		if (response.status === 200) {
			console.log(
				"E-mail de notification de candidature envoyé avec succès !",
				response.data,
			);
			return { success: true, message: "Email sent successfully!" };
		} else {
			console.error(
				"Erreur lors de l'envoi de l'e-mail de notification :",
				response.data,
			);
			return {
				success: false,
				message: response.data.error || "Failed to send email",
			};
		}
	} catch (error) {
		console.error(
			"Erreur réseau ou inattendue lors de l'envoi de l'e-mail :",
			error.message,
		);
		console.error("Détails de l'erreur:", error.response?.data);
		console.error("Status code:", error.response?.status);
		return {
			success: false,
			message:
				error.response?.data?.error ||
				"Network error or unexpected issue.",
		};
	}
};

// import { Resend } from 'resend';

// const resend = new Resend('re_iTKHK5Xv_7Qv5s9WyZvnTgyw6fohANonE');

// resend.emails.send({
//   from: 'onboarding@resend.dev',
//   to: 'info.wesafeapp@gmail.com',
//   subject: 'Hello World',
//   html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
// });
