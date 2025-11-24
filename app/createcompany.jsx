import React, { useState, useEffect } from "react";
import { View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

import { useDataContext } from "@/context/DataContext";

import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const CreateCompany = () => {
	const router = useRouter();
	const { user, setJustSignup, role, setRole, loadUserData, accessToken } =
		useAuth();
	const { create } = useDataContext();

	const [name, setName] = useState("");
	const [reloadRole, setReloadRole] = useState(false);

	// useEffect(() => {
	// 	loadUserData(user.id, accessToken);
	// 	console.warn("Current role:", role);
	// 	console.warn("Reload role:", reloadRole);
	// 	setReloadRole(false);
	// }, [reloadRole]);

	// useEffect(() => {
	// 	console.log("role :", role);
	// 	console.log("user :", user);
	// 	if (user) {
	// 		console.warn(
	// 			"CREATECOMPANY JSX - User is logged in, checking role...",
	// 			role
	// 		);
	// 		if (role === "pro") {
	// 			router.replace("/(tabs)");
	// 			console.log("role is set to:", role);
	// 		} else if (role === "candidat") {
	// 			router.replace("/(tabs)");
	// 			console.log("role is set to:", role);
	// 		} else {
	// 			console.log("role is set to:", role);
	// 		}
	// 	}
	// }, [user, role]);

	const handleCreateCompany = async () => {
		console.log(
			"create company with name:",
			name,
			user.id,
			user.email,
			role
		);

		try {
			const newCompanyResponse = await create("companies", {
				id: user.id,
				name,
				email: user.email,
				last_minute_credits: 0,
			});

			const isSuccess = newCompanyResponse?.status === 201;

			if (isSuccess) {
				console.log("new company created successfully (Status 201)");

				// ✅ CORRECTION 1 : Vérification si setJustSignup est défini avant l'appel
				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
					// setReloadRole(true);
				}

				router.push("/(tabs)");
				return;
			}
			if (newCompanyResponse && newCompanyResponse.status !== 201) {
				throw new Error(
					`Échec de la création. Statut: ${newCompanyResponse.status}`
				);
			}
		} catch (error) {
			// CORRECTION 2 : La même vérification dans le bloc catch (pour le parsing 201)
			if (error.status === 201) {
				console.log(
					"new company created successfully (Caught Error, Status 201)"
				);

				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
					// setReloadRole(true);
				}

				router.push("/(tabs)");
				return;
			}

			console.log("error create company:", error.message || error);
		}
	};

	return (
		<SafeAreaView>
			<View style={{ padding: 15 }}>
				<Heading>Create Company</Heading>
				<Input className='min-w-[250px]'>
					<InputField
						type='text'
						placeholder='Entrez le nom de votre entreprise'
						value={name}
						onChangeText={setName}
					/>
				</Input>
				<Button className='ml-auto' onPress={handleCreateCompany}>
					<ButtonText className='text-typography-0'>
						Suivant
					</ButtonText>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default CreateCompany;
