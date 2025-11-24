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

import OTPForm from "../components/OTPForm";

const SignUpScreen = () => {
	const { signUp, loading } = useAuth();
	const router = useRouter();
	const initialRef = useRef(null);

	const [generatedOTP, setGeneratedTP] = useState(null);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [password2, setPassword2] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showPassword2, setShowPassword2] = useState(false);
	const [isCandidate, setIsCandidate] = useState(null);
	const [isCompany, setIsCompany] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const [showModal, setShowModal] = React.useState(false);
	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	const generateOTP = () => {
		setGeneratedTP(Math.floor(100000 + Math.random() * 900000).toString()); // 6 chiffres
	};

	useEffect(() => {
		console.log("isCandidate or isCompany :", isCandidate, isCompany);
	}, [isCandidate, isCompany]);

	const sendOTP = async (email, code) => {
		const payload = {
			from: {
				email: "info@wesafeapp.fr",
				name: "WeSafe",
			},
			to: [
				{
					email: email,
					name: "Utilisateur",
				},
			],
			subject: "Votre code de vérification",
			text: `Votre code de vérification est : ${code}`,
		};

		try {
			const res = await fetch("https://api.mailersend.com/v1/email", {
				method: "POST",
				headers: {
					Authorization: `Bearer mlsn.f6e3da15d544ac83afd9472efc0b79c8da3df7d96fb89112a04a0adbb9d827c0`, // remplace avec ta clé MailerSend
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const error = await res.json();
				console.error("Erreur envoi email", error);
			} else {
				console.log("OTP envoyé !");
			}
		} catch (err) {
			console.error("Erreur réseau : ", err);
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

	const handleOTP = (newOTP) => {
		console.log("newOTP :", newOTP, generatedOTP);
		if (newOTP === generatedOTP) {
			handleLogup();
			setShowModal(false);
		} else {
			console.log("false OTP verification");
			setShowModal(false);
			setGeneratedTP(null);
			Alert.alert("Erreur", "Échec de la vérification du code");
		}
	};

	const sendEmail = async () => {
		try {
			const response = await axios.post(
				"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/send-otp",
				{
					to: email,
					name: email,
					otp: generatedOTP,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			// Alert.alert("Succès", "Email envoyé !");
		} catch (error) {
			console.error("Erreur envoi :", error);
			Alert.alert("Erreur", "Échec de l'envoi de l'email");
		}
	};

	useEffect(() => {
		console.log("OTP :", generatedOTP);
		generatedOTP && sendEmail();
		generatedOTP && setShowModal(true);
		// email && generatedOTP && sendOTP(email, generatedOTP);
	}, [generatedOTP]);

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
								<VStack space='xs'>
									<Text className='text-typography-500'>
										Email
									</Text>
									<Input className='min-w-[250px]'>
										<InputField
											type='text'
											placeholder='example@wesafeapp.com'
											value={email}
											onChangeText={setEmail}
											autoCapitalize='none'
											keyboardType='email-address'
										/>
									</Input>
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
												setShowPassword(!showPassword)
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
												setShowPassword2(!showPassword2)
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
											setIsCandidate(!isCandidate),
											setIsCompany(false)
										)}
										isChecked={isCandidate}>
										<CheckboxIndicator>
											<CheckboxIcon as={CheckIcon} />
										</CheckboxIndicator>
										<CheckboxLabel>Candidat</CheckboxLabel>
									</Checkbox>
									<Checkbox
										size='md'
										onChange={() => (
											setIsCompany(!isCompany),
											setIsCandidate(false)
										)}
										isChecked={isCompany}>
										<CheckboxIndicator>
											<CheckboxIcon as={CheckIcon} />
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
							</VStack>
							<HStack
								space={"sm"}
								style={{ paddingTop: 30, paddingBottom: 5 }}
								justifyContent='center'>
								<Text>J'ai déjà un compte</Text>
								<Link onPress={() => router.replace("/signin")}>
									<LinkText>Me connecter</LinkText>
								</Link>
							</HStack>
							{/* <Button onPress={() => setShowActionsheet(true)}>
								<ButtonText>Open Actionsheet</ButtonText>
							</Button> */}
							{/* <Button onPress={() => setShowModal(true)}>
								<ButtonText>Show Modal</ButtonText>
							</Button> */}
						</FormControl>
					</View>
				)}
				{generatedOTP && (
					<View style={styles.container}>
						{/* <OTPForm onSubmit={handleOTP} />
						<Button onPress={handleReset}>
							<ButtonText>Modifier mes informations</ButtonText>
						</Button> */}
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
