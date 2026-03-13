import axios from "axios";

const SUPABASE_URL = "https://hzvbylhdptwgblpdondm.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dmJ5bGhkcHR3Z2JscGRvbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NTA5MjksImV4cCI6MjA2MTAyNjkyOX0.UdtpnbES2Ul7TDFBcHIpGnVxFxqQYmGt-WVtMHgewk4";

const headers = {
	apikey: SUPABASE_ANON_KEY,
	Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
	"Content-Type": "application/json",
};

/**
 * Envoyer un SMS OTP via Twilio Verify au numéro E.164 donné (+33XXXXXXXXX).
 * @returns {{ success: boolean, error?: string }}
 */
export const sendPhoneOtp = async (phoneE164) => {
	const res = await axios.post(
		`${SUPABASE_URL}/functions/v1/send-phone-otp`,
		{ phone: phoneE164 },
		{ headers },
	);
	return res.data;
};

/**
 * Vérifier le code OTP reçu par SMS.
 * @returns {{ success: boolean, status: string, error?: string }}
 */
export const verifyPhoneOtp = async (phoneE164, code) => {
	const res = await axios.post(
		`${SUPABASE_URL}/functions/v1/verify-phone-otp`,
		{ phone: phoneE164, code },
		{ headers },
	);
	return res.data;
};
