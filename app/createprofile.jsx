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
	const { user, setJustSignup, loadSession, role } = useAuth();
	const { create } = useDataContext();

	const [lastname, setLastname] = useState("");
	const [firstname, setFirstname] = useState("");

	const handleCreateProfile = async () => {
		try {
			console.log("🟢 Creating profile...");
			const newProfile = await create("profiles", {
				lastname,
				firstname,
				email: user.email,
			});
			console.log("✅ Profile created:", newProfile);

			// Attendre que les données soient chargées avant de naviguer
			console.log("🔄 Loading session...");
			console.log("🔵 Role BEFORE loadSession:", role);
			await loadSession();
			console.log("✅ Session loaded");

			setJustSignup(false);

			// Attendre un peu pour que le state role soit bien propagé dans tous les composants
			console.log("⏳ Waiting for state to update...");
			await new Promise((resolve) => setTimeout(resolve, 500));

			console.log("🔵 Role AFTER delay:", role);
			console.log("🔀 Navigating to tabs...");
			router.replace("/tabs/(tabs)");
		} catch (error) {
			console.log("❌ Error create profile", error);
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
