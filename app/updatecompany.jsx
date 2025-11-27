import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	ActivityIndicator,
	Alert,
	SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";

import { Check } from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";

import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const UpdateCompany = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update } = useDataContext();
	const { companyName } = useLocalSearchParams();

	const [name, setName] = useState("");

	const handleUpdateCompany = async () => {
		try {
			const updateCompany = await update("companies", user.id, {
				name: name,
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
	}, []);

	return (
		<SafeAreaView>
			<View style={{ padding: 15 }}>
				<Heading>Update Company</Heading>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez le nom de votre entreprise'
						value={name}
						onChangeText={setName}
					/>
				</Input>
				<Button className='ml-auto' onPress={handleUpdateCompany}>
					<ButtonText className='text-typography-0'>
						Suivant
					</ButtonText>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default UpdateCompany;
