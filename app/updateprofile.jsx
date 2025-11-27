import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	ActivityIndicator,
	Alert,
	SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const UpdateProfile = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update, getById } = useDataContext();

	const { firstname, lastname } = useLocalSearchParams();

	const [lastName, setLastname] = useState("");
	const [firstName, setFirstname] = useState("");

	const handleUpdateProfile = async () => {
		try {
			const updateProfile = await update("profiles", user.id, {
				lastname: lastName,
				firstname: firstName,
			});
			console.log("update profile :", updateProfile);
			// router.replace("/(tabs)");
		} catch (error) {
			console.log("error update profile", error);
		}
	};

	useEffect(() => {
		setFirstname(firstname);
		setLastname(lastname);
	}, []);

	return (
		<SafeAreaView>
			<View style={{ padding: 15 }}>
				<Heading>Update Profile</Heading>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez votre nom'
						value={lastName}
						onChangeText={setLastname}
					/>
				</Input>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez votre prénom'
						value={firstName}
						onChangeText={setFirstname}
					/>
				</Input>
				<Button className='ml-auto' onPress={handleUpdateProfile}>
					<ButtonText className='text-typography-0'>
						Update
					</ButtonText>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default UpdateProfile;
