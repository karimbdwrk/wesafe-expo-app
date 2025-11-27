import React from "react";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import ContactForm from "../components/ContactForm";

const ContactUs = () => {
	return (
		<VStack
			style={{ padding: 15, gap: 15, flex: 1, justifyContent: "center" }}>
			<ContactForm />
		</VStack>
	);
};

export default ContactUs;
