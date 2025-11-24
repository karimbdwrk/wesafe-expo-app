import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	ActivityIndicator,
	Alert,
	SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const CreateProfile = () => {
	const router = useRouter();
	const { user, setJustSignup, loadUserData, AccessToken } = useAuth();
	const { create } = useDataContext();

	const [lastname, setLastname] = useState("");
	const [firstname, setFirstname] = useState("");

	const handleCreateProfile = async () => {
		try {
			const newProfile = await create("profiles", {
				lastname,
				firstname,
				email: user.email,
			});
			console.log("new profile :", newProfile);
			loadUserData(user.id, AccessToken);
			setJustSignup(false);
			router.replace("/(tabs)");
		} catch (error) {
			console.log("error create profile", error);
		}
	};

	return (
		<SafeAreaView>
			<View style={{ padding: 15 }}>
				<Heading>Create Profile</Heading>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez votre nom'
						value={lastname}
						onChangeText={setLastname}
					/>
				</Input>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez votre prénom'
						value={firstname}
						onChangeText={setFirstname}
					/>
				</Input>
				<Button className='ml-auto' onPress={handleCreateProfile}>
					<ButtonText className='text-typography-0'>
						Suivant
					</ButtonText>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default CreateProfile;
