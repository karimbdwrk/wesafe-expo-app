import axios from "axios";
import { useStripe } from "@stripe/stripe-react-native";
import { Alert } from "react-native";

const CREATE_STRIPE_PAYMENT_URL =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/create-stripe-payment";

export const useStripePaymentHandler = () => {
	const { initPaymentSheet, presentPaymentSheet } = useStripe();

	const initiateAndPresentPayment = async (
		companyId,
		amountInCents,
		paymentType,
	) => {
		try {
			const response = await axios.post(CREATE_STRIPE_PAYMENT_URL, {
				company_id: companyId,
				amount_in_cents: amountInCents,
				payment_type: paymentType,
			});

			const {
				paymentIntentClientSecret,
				ephemeralKeySecret,
				customerId,
				publishableKey,
			} = response.data;

			const { error: initError } = await initPaymentSheet({
				merchantDisplayName: "WeSafeApp",
				customerId: customerId,
				customerEphemeralKeySecret: ephemeralKeySecret,
				paymentIntentClientSecret: paymentIntentClientSecret,
				allowsDelayedPaymentMethods: true,
			});

			if (initError) {
				Alert.alert(`Erreur d'initialisation du paiement: ${initError.message}`);
				return { success: false, error: initError.message };
			}

			const { error: presentError } = await presentPaymentSheet();

			if (presentError) {
				Alert.alert(`Paiement échoué: ${presentError.message}`);
				return { success: false, error: presentError.message };
			}

			return { success: true };
		} catch (error) {
			console.error(
				"Error initiating or presenting Stripe payment:",
				error.response?.data || error.message,
			);
			Alert.alert(
				"Erreur",
				error.response?.data?.error || "Impossible de préparer le paiement.",
			);
			return { success: false, error: error.response?.data?.error || "Failed to initiate payment." };
		}
	};

	return { initiateAndPresentPayment };
};

// Fonction pour poster l'annonce (peut rester dans un autre service ou être ici)
const POST_LAST_MINUTE_JOB_URL =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/post-last-minute-job";
export const postLastMinuteJob = async (companyId, jobData, paymentType) => {
	try {
		const response = await axios.post(POST_LAST_MINUTE_JOB_URL, {
			company_id: companyId,
			job_data: jobData,
			payment_type: paymentType, // 'credit' ou 'oneshot'
		});
		return { success: true, data: response.data };
	} catch (error) {
		console.error(
			"Error posting Last Minute job:",
			error.response?.data || error.message,
		);
		return {
			success: false,
			error: error.response?.data?.error || "Failed to post ad.",
		};
	}
};
