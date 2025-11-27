import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import axios from "axios";
import { toast } from "sonner-native";

import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { Check, X } from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/send-contact-email`;

const ContactForm = () => {
	const { user, role, userProfile } = useAuth();
	const { create } = useDataContext();

	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		console.log("Role:", user.email, role);
	}, [role]);

	const handleSubmit = async () => {
		console.log("Submitting contact form with:");
		const dataToSend = {
			user_id: user?.id,
			subject,
			message,
			email: user?.email,
			name:
				role === "candidat"
					? userProfile?.lastname + " " + userProfile?.firstname
					: userCompany?.name,
			is_company: role === "candidat" ? false : true,
			is_profile: role === "candidat" ? true : false,
		};
		const result = await create("contact_messages", dataToSend);

		console.log("Response from contact message:", result);
		if (result.status === 201) {
			const emailResponse = await axios.post(
				edgeFunctionUrl,
				dataToSend,
				{
					headers: {
						"Content-Type": "application/json",
						apikey: SUPABASE_API_KEY, // Clé anon Supabase (publique)
					},
				}
			);

			console.log("Email Edge Function response:", emailResponse.data);

			toast.success(`Votre message a été envoyé avec succès !`, {
				description: "Everything worked as expected.",
				duration: 2500,
				icon: <Check />,
			});
			setSubject("");
			setMessage("");
		} else {
			console.error("Error sending message:", error);
			toast.error(
				"Une erreur s'est produite lors de l'envoi du message.",
				{
					description: "Everything not worked as expected.",
					duration: 2500,
					icon: <X />,
				}
			);
		}
	};

	return (
		<VStack style={{ gap: 10 }}>
			<Input>
				<InputField
					placeholder='Subject'
					value={subject}
					onChangeText={setSubject}
				/>
			</Input>
			<Textarea
				size='md'
				isReadOnly={false}
				isInvalid={false}
				isDisabled={false}>
				<TextareaInput
					placeholder='Message'
					value={message}
					onChangeText={setMessage}
				/>
			</Textarea>
			<Button onPress={handleSubmit}>
				<ButtonText>Envoyer</ButtonText>
			</Button>
		</VStack>
	);
};

export default ContactForm;
