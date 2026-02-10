import React, { useState, useEffect, useRef } from "react";
import {
	View,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from "react-native";
import axios from "axios";
import Constants from "expo-constants";

import { Button, ButtonText } from "@/components/ui/button";
import { Link, LinkText } from "@/components/ui/link";
import {
	Checkbox,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxIcon,
} from "@/components/ui/checkbox";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { EyeIcon, EyeOffIcon, CheckIcon } from "@/components/ui/icon";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetItem,
	ActionsheetItemText,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalCloseButton,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";

import Ionicons from "@expo/vector-icons/Ionicons";
import { Icon, CloseIcon } from "@/components/ui/icon";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { createSupabaseClient } from "../lib/supabase";

import OTPForm from "../components/OTPForm";

const SignUpScreen = () => {
	const { signUp, loading } = useAuth();
	const router = useRouter();
	const initialRef = useRef(null);

	const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

	const [generatedOTP, setGeneratedTP] = useState(null);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [password2, setPassword2] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showPassword2, setShowPassword2] = useState(false);
	const [isCandidate, setIsCandidate] = useState(null);
	const [isCompany, setIsCompany] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	// État pour gérer les étapes du formulaire
	const [step, setStep] = useState(1); // 1 = email, 2 = password + role
	const [emailError, setEmailError] = useState("");
	const [checkingEmail, setCheckingEmail] = useState(false);

	const [showModal, setShowModal] = React.useState(false);
	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	const generateOTP = async () => {
		try {
			const supabase = createSupabaseClient();
			const { data, error } = await supabase.functions.invoke(
				"send-signup-otp",
				{
					body: {
						email: email,
						name: email,
					},
				},
			);

			if (error) {
				console.error("Erreur envoi OTP:", error);
				Alert.alert(
					"Erreur",
					"Échec de l'envoi du code de vérification",
				);
				return;
			}

			setGeneratedTP("sent"); // Juste pour activer l'affichage du formulaire OTP
			setShowModal(true);
		} catch (error) {
			console.error("Erreur:", error);
			Alert.alert("Erreur", "Échec de l'envoi du code");
		}
	};

	useEffect(() => {
		console.log("isCandidate or isCompany :", isCandidate, isCompany);
	}, [isCandidate, isCompany]);

	// Vérifier si l'email existe déjà
	const checkEmailExists = async () => {
		if (!email || !email.includes("@")) {
			setEmailError("Veuillez entrer une adresse email valide");
			return;
		}

		setCheckingEmail(true);
		setEmailError("");

		try {
			const response = await axios.post(
				`${SUPABASE_URL}/functions/v1/check-email-exists`,
				{ email: email },
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${SUPABASE_API_KEY}`,
					},
				},
			);

			if (response.data.exists === true) {
				setEmailError("Cet email est déjà utilisé");
			} else {
				// Email disponible, passer à l'étape 2
				setStep(2);
			}
		} catch (error) {
			console.error("Erreur vérification email :", error);
			setEmailError("Erreur lors de la vérification");
		} finally {
			setCheckingEmail(false);
		}
	};

	const handleLogup = async () => {
		// generateOTP();

		if (!email || !password || isCandidate === null || isCompany === null) {
			Alert.alert("Erreur", "Merci de remplir tous les champs");
			return;
		}

		setSubmitting(true);
		try {
			await signUp(email, password, isCandidate, isCompany);
			// router.replace("/(tabs)");
			// Redirige vers la page principale
			// router.replace("/updatecompany");
		} catch (error) {
			Alert.alert("Échec de la connexion", error.message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleOTP = async (newOTP) => {
		console.log("Vérification OTP :", newOTP);

		if (newOTP.length !== 6) {
			Alert.alert("Erreur", "Le code doit contenir 6 chiffres");
			return;
		}

		try {
			const supabase = createSupabaseClient();
			const { data, error } = await supabase.functions.invoke(
				"verify-signup-otp",
				{
					body: {
						email: email,
						otp: newOTP,
					},
				},
			);

			if (error || !data?.success) {
				console.error("Erreur vérification OTP:", error || data?.error);
				const errorMessage = data?.error || "Code invalide ou expiré";

				if (data?.attemptsLeft !== undefined) {
					Alert.alert(
						"Code invalide",
						`${errorMessage}. Il vous reste ${data.attemptsLeft} tentative(s).`,
					);
				} else {
					Alert.alert("Erreur", errorMessage);
				}
				return;
			}

			// ✅ Code valide, créer le compte
			setShowModal(false);
			await handleLogup();
		} catch (error) {
			console.error("Erreur:", error);
			Alert.alert("Erreur", "Échec de la vérification du code");
		}
	};

	const handleReset = () => {
		console.log("reset signup infos !");
		setGeneratedTP(null);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Ajuste si tu as un header
		>
			<ScrollView
				contentContainerStyle={{
					flex: 1,
					flexGrow: 1,
				}}
				keyboardShouldPersistTaps='handled'>
				{!generatedOTP && (
					<View style={styles.container}>
						<FormControl className='p-4 border rounded-lg border-outline-300'>
							<VStack space='xl'>
								<Heading className='text-typography-900'>
									Je créé mon compte
								</Heading>

								{step === 1 && (
									<>
										<VStack space='xs'>
											<Text className='text-typography-500'>
												Email
											</Text>
											<Input className='min-w-[250px]'>
												<InputField
													type='text'
													placeholder='example@wesafeapp.com'
													value={email}
													onChangeText={(text) => {
														setEmail(text);
														setEmailError("");
													}}
													autoCapitalize='none'
													keyboardType='email-address'
												/>
											</Input>
											{emailError ? (
												<Text className='text-error-500 text-sm'>
													{emailError}
												</Text>
											) : null}
										</VStack>

										{checkingEmail ? (
											<ActivityIndicator size='large' />
										) : (
											<Button
												className='ml-auto'
												style={{ width: "100%" }}
												onPress={checkEmailExists}>
												<ButtonText className='text-typography-0'>
													Suivant
												</ButtonText>
											</Button>
										)}
									</>
								)}

								{step === 2 && (
									<>
										<VStack space='xs'>
											<Text className='text-typography-500'>
												Email
											</Text>
											<Input
												className='min-w-[250px]'
												isDisabled={true}>
												<InputField
													type='text'
													value={email}
													editable={false}
												/>
											</Input>
											<Button
												variant='link'
												size='sm'
												onPress={() => {
													setStep(1);
													setPassword("");
													setPassword2("");
													setIsCandidate(null);
													setIsCompany(null);
												}}
												style={{
													alignSelf: "flex-start",
												}}>
												<ButtonText className='text-sm'>
													Modifier l'email
												</ButtonText>
											</Button>
										</VStack>

										<VStack space='xs'>
											<Text className='text-typography-500'>
												Mot de passe
											</Text>
											<Input className='text-center'>
												<InputField
													type={
														showPassword
															? "text"
															: "password"
													}
													placeholder='MonMotDePasse$'
													value={password}
													onChangeText={setPassword}
												/>
												<InputSlot
													className='pr-3'
													onPress={() =>
														setShowPassword(
															!showPassword,
														)
													}>
													<InputIcon
														as={
															showPassword
																? EyeIcon
																: EyeOffIcon
														}
													/>
												</InputSlot>
											</Input>
										</VStack>

										<VStack space='xs'>
											<Text className='text-typography-500'>
												Confirmer mot de passe
											</Text>
											<Input className='text-center'>
												<InputField
													type={
														showPassword2
															? "text"
															: "password"
													}
													placeholder='MonMotDePasse$'
													value={password2}
													onChangeText={setPassword2}
												/>
												<InputSlot
													className='pr-3'
													onPress={() =>
														setShowPassword2(
															!showPassword2,
														)
													}>
													<InputIcon
														as={
															showPassword2
																? EyeIcon
																: EyeOffIcon
														}
													/>
												</InputSlot>
											</Input>
										</VStack>

										<HStack space={"md"}>
											<Checkbox
												size='md'
												onChange={() => (
													setIsCandidate(
														!isCandidate,
													),
													setIsCompany(false)
												)}
												isChecked={isCandidate}>
												<CheckboxIndicator>
													<CheckboxIcon
														as={CheckIcon}
													/>
												</CheckboxIndicator>
												<CheckboxLabel>
													Candidat
												</CheckboxLabel>
											</Checkbox>
											<Checkbox
												size='md'
												onChange={() => (
													setIsCompany(!isCompany),
													setIsCandidate(false)
												)}
												isChecked={isCompany}>
												<CheckboxIndicator>
													<CheckboxIcon
														as={CheckIcon}
													/>
												</CheckboxIndicator>
												<CheckboxLabel>
													Professionnel
												</CheckboxLabel>
											</Checkbox>
										</HStack>

										{submitting ? (
											<ActivityIndicator size='large' />
										) : (
											<Button
												className='ml-auto'
												style={{ width: "100%" }}
												onPress={generateOTP}>
												<ButtonText className='text-typography-0'>
													S'inscrire
												</ButtonText>
											</Button>
										)}

										<HStack
											space={"sm"}
											justifyContent='center'>
											<Text>J'ai déjà un compte</Text>
											<Link
												onPress={() =>
													router.replace("/signin")
												}>
												<LinkText>
													Me connecter
												</LinkText>
											</Link>
										</HStack>
									</>
								)}
							</VStack>
						</FormControl>
					</View>
				)}
				{generatedOTP && (
					<View style={styles.container}>
						<OTPForm onSubmit={handleOTP} />
						<Button onPress={handleReset}>
							<ButtonText>Modifier mes informations</ButtonText>
						</Button>
					</View>
				)}
			</ScrollView>
			<Modal
				isOpen={showModal}
				initialFocusRef={initialRef}
				onClose={() => {
					setShowModal(false);
					handleReset();
				}}
				size='lg'>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader alignItems='flex-start'>
						<VStack>
							<Heading size='md' className='text-typography-950'>
								Entrez votre code OTP
							</Heading>
							<Text size='xs'>
								Vous avez reçu un code OTP par e-mail
							</Text>
						</VStack>
						<ModalCloseButton>
							<Icon
								as={CloseIcon}
								size='md'
								className='stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900'
							/>
						</ModalCloseButton>
					</ModalHeader>
					<ModalBody>
						<VStack>
							<OTPForm onSubmit={handleOTP} />
						</VStack>
						<VStack style={{ alignItems: "flex-start" }}>
							<Button onPress={generateOTP} variant='link'>
								<ButtonText
									style={{
										textDecorationLine: "underline",
										fontWeight: 300,
										fontStyle: "italic",
									}}>
									Je n'ai pas reçu de code
								</ButtonText>
							</Button>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => {
								setShowModal(false);
								handleReset();
							}}>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							onPress={() => {
								setShowModal(false);
							}}>
							<ButtonText>Valider</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			<Actionsheet
				isOpen={showActionsheet}
				onClose={handleClose}
				preventScroll={true}
				isKeyboardDismissable={true}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack style={{ paddingBottom: 90 }}>
						<OTPForm ref={initialRef} onSubmit={handleOTP} />
						<Button onPress={handleReset}>
							<ButtonText>Modifier mes informations</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</KeyboardAvoidingView>
	);
};

export default SignUpScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 28,
		marginBottom: 24,
		textAlign: "center",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		padding: 12,
		marginBottom: 16,
		borderRadius: 8,
	},
	loading: {
		marginTop: 16,
		textAlign: "center",
		color: "#555",
	},
});
