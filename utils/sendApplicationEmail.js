// Votre fichier de service API ou dans le composant où le candidat postule
import axios from "axios";

// Fonction pour envoyer l'e-mail de notification à l'entreprise
export const sendApplicationEmail = async (
	applicantName,
	applicantEmail,
	offerTitle,
	companyEmail,
	companyName
) => {
	try {
		// REMPLACEZ PAR L'URL DE VOTRE FONCTION EDGE
		const EDGE_FUNCTION_URL =
			"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-application-email";

		const response = await axios.post(EDGE_FUNCTION_URL, {
			applicantName,
			applicantEmail,
			offerTitle,
			companyEmail,
			companyName,
		});

		if (response.status === 200) {
			console.log(
				"E-mail de notification de candidature envoyé avec succès !",
				response.data
			);
			return { success: true, message: "Email sent successfully!" };
		} else {
			console.error(
				"Erreur lors de l'envoi de l'e-mail de notification :",
				response.data
			);
			return {
				success: false,
				message: response.data.error || "Failed to send email",
			};
		}
	} catch (error) {
		console.error(
			"Erreur réseau ou inattendue lors de l'envoi de l'e-mail :",
			error.message
		);
		return {
			success: false,
			message: "Network error or unexpected issue.",
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
