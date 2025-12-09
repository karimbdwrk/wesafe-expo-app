import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";

import { Check } from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";

import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const UpdateCompany = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update } = useDataContext();
	const { companyName, companySiret, companyDescription } =
		useLocalSearchParams();

	const [name, setName] = useState("");
	const [siret, setSiret] = useState("");
	const [description, setDescription] = useState("");

	const handleUpdateCompany = async () => {
		try {
			const updateCompany = await update("companies", user.id, {
				name: name,
				siret: siret,
				description: description,
			});
			console.log("update company :", updateCompany);
			toast.success("Operation successful!", {
				// style: { backgroundColor: "blue" },
				description: "Everything worked as expected.",
				duration: 6000,
				icon: <Check />,
			});
		} catch (error) {
			console.log("error update company", error);
		}
	};

	useEffect(() => {
		setName(companyName);
		setSiret(companySiret);
		setDescription(companyDescription);
	}, []);

	return (
		// <SafeAreaView>
		<VStack style={{ padding: 15 }}>
			<Heading>Update Company</Heading>
			<VStack style={{ gap: 15, marginTop: 20, marginBottom: 20 }}>
				<Input>
					<InputField
						type='text'
						placeholder='Entrez le nom de votre entreprise'
						value={name}
						onChangeText={setName}
					/>
				</Input>
				<Input>
					<InputField
						type='number'
						placeholder='Entrez le SIRET de votre entreprise'
						value={siret}
						onChangeText={setSiret}
					/>
				</Input>
				<Textarea
					size='md'
					isReadOnly={false}
					isInvalid={false}
					isDisabled={false}>
					<TextareaInput
						placeholder='Description de votre entreprise...'
						value={description}
						onChangeText={setDescription}
					/>
				</Textarea>
			</VStack>
			<Button className='ml-auto' onPress={handleUpdateCompany}>
				<ButtonText className='text-typography-0'>
					Enregistrer
				</ButtonText>
			</Button>
		</VStack>
		// </SafeAreaView>
	);
};

export default UpdateCompany;
