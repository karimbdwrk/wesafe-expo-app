import React, { useState, useEffect, useRef } from "react";
import { View, SafeAreaView, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";

import { useDataContext } from "@/context/DataContext";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { createSupabaseClient } from "@/lib/supabase";

const { width } = Dimensions.get("window");

const CreateCompany = () => {
	const router = useRouter();
	const { user, setJustSignup, role, setRole, loadUserData, accessToken } =
		useAuth();
	const { create } = useDataContext();

	const [name, setName] = useState("");
	const [siret, setSiret] = useState("");
	const [currentStep, setCurrentStep] = useState(0);

	const slideAnim = useRef(new Animated.Value(0)).current;
	const [reloadRole, setReloadRole] = useState(false);

	const steps = [
		{
			title: "Nom de l'entreprise",
			placeholder: "Entrez le nom de votre entreprise",
			value: name,
			onChange: setName,
			field: "name",
		},
		{
			title: "Numéro SIRET",
			placeholder: "Entrez le numéro SIRET (14 chiffres)",
			value: siret,
			onChange: setSiret,
			field: "siret",
			keyboardType: "numeric",
		},
	];

	const goToNextStep = () => {
		if (currentStep < steps.length - 1) {
			Animated.timing(slideAnim, {
				toValue: -(currentStep + 1) * width,
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep + 1);
		}
	};

	const goToPreviousStep = () => {
		if (currentStep > 0) {
			Animated.timing(slideAnim, {
				toValue: -(currentStep - 1) * width,
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep - 1);
		}
	};

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
			"siret:",
			siret,
			user.id,
			user.email,
			role,
		);

		try {
			const newCompanyResponse = await create("companies", {
				id: user.id,
				name,
				siret,
				email: user.email,
				last_minute_credits: 0,
			});

			const isSuccess = newCompanyResponse?.status === 201;

			if (isSuccess) {
				console.log("new company created successfully (Status 201)");

				// Envoyer l'email de validation
				try {
					const supabase = createSupabaseClient(accessToken);
					await supabase.functions.invoke(
						"send-company-validation-email",
						{
							body: {
								companyName: name,
								companyEmail: user.email,
							},
						},
					);
					console.log("Email de validation envoyé");
				} catch (emailError) {
					console.error("Erreur envoi email:", emailError);
					// Ne pas bloquer la création si l'email échoue
				}

				// ✅ CORRECTION 1 : Vérification si setJustSignup est défini avant l'appel
				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
					// setReloadRole(true);
				}

				router.push("/tabs/(tabs)");
				return;
			}
			if (newCompanyResponse && newCompanyResponse.status !== 201) {
				throw new Error(
					`Échec de la création. Statut: ${newCompanyResponse.status}`,
				);
			}
		} catch (error) {
			// CORRECTION 2 : La même vérification dans le bloc catch (pour le parsing 201)
			if (error.status === 201) {
				console.log(
					"new company created successfully (Caught Error, Status 201)",
				);

				// Envoyer l'email de validation
				try {
					const supabase = createSupabaseClient(accessToken);
					await supabase.functions.invoke(
						"send-company-validation-email",
						{
							body: {
								companyName: name,
								companyEmail: user.email,
							},
						},
					);
					console.log("Email de validation envoyé");
				} catch (emailError) {
					console.error("Erreur envoi email:", emailError);
				}

				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
					// setReloadRole(true);
				}

				router.push("/tabs/(tabs)");
				return;
			}

			console.log("error create company:", error.message || error);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ flex: 1, padding: 15 }}>
				<View style={{ marginBottom: 30 }}>
					<Heading size='xl'>Créer mon entreprise</Heading>
					<Text className='text-typography-500 mt-2'>
						Étape {currentStep + 1} sur {steps.length}
					</Text>
				</View>

				{/* Carousel Container */}
				<View
					style={{
						flex: 1,
						overflow: "hidden",
						marginHorizontal: -15,
					}}>
					<Animated.View
						style={{
							flexDirection: "row",
							transform: [{ translateX: slideAnim }],
						}}>
						{steps.map((step, index) => (
							<View
								key={index}
								style={{
									width: width,
									paddingHorizontal: 15,
								}}>
								<Heading size='lg' className='mb-4'>
									{step.title}
								</Heading>
								<Input className='min-w-[250px]'>
									<InputField
										type='text'
										placeholder={step.placeholder}
										value={step.value}
										onChangeText={step.onChange}
										keyboardType={
											step.keyboardType || "default"
										}
										maxLength={
											step.field === "siret"
												? 14
												: undefined
										}
									/>
								</Input>
							</View>
						))}
					</Animated.View>
				</View>

				{/* Navigation Buttons */}
				<View style={{ paddingVertical: 20 }}>
					{currentStep > 0 && (
						<Button
							variant='outline'
							className='mb-3'
							onPress={goToPreviousStep}>
							<ButtonText>Précédent</ButtonText>
						</Button>
					)}

					{currentStep < steps.length - 1 ? (
						<Button
							className='ml-auto'
							onPress={goToNextStep}
							isDisabled={!steps[currentStep].value.trim()}>
							<ButtonText className='text-typography-0'>
								Suivant
							</ButtonText>
						</Button>
					) : (
						<Button
							className='ml-auto'
							onPress={handleCreateCompany}
							isDisabled={!steps[currentStep].value.trim()}>
							<ButtonText className='text-typography-0'>
								Créer l'entreprise
							</ButtonText>
						</Button>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default CreateCompany;
