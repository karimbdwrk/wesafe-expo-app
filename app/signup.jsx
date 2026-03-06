import React, { useState, useEffect, useRef } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
} from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Checkbox,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxIcon,
} from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Link, LinkText } from "@/components/ui/link";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalCloseButton,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
	CheckIcon,
	EyeIcon,
	EyeOffIcon,
	Icon,
	CloseIcon,
} from "@/components/ui/icon";
import { ChevronLeft } from "lucide-react-native";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { createSupabaseClient } from "../lib/supabase";
import OTPForm from "../components/OTPForm";

const SignUpScreen = () => {
	const { signUp, loading } = useAuth();
	const router = useRouter();
	const { isDark } = useTheme();
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
	const [step, setStep] = useState(1);
	const [emailError, setEmailError] = useState("");
	const [checkingEmail, setCheckingEmail] = useState(false);
	const [showModal, setShowModal] = React.useState(false);

	const generateOTP = async () => {
		try {
			const supabase = createSupabaseClient();
			const { data, error } = await supabase.functions.invoke(
				"send-signup-otp",
				{ body: { email, name: email } },
			);
			if (error) {
				Alert.alert(
					"Erreur",
					"Échec de l'envoi du code de vérification",
				);
				return;
			}
			setGeneratedTP("sent");
			setShowModal(true);
		} catch (error) {
			Alert.alert("Erreur", "Échec de l'envoi du code");
		}
	};

	useEffect(() => {
		console.log("isCandidate or isCompany :", isCandidate, isCompany);
	}, [isCandidate, isCompany]);

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
				{ email },
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
				// Email disponible → envoyer OTP pour vérifier l'email
				await generateOTP();
			}
		} catch (error) {
			setEmailError("Erreur lors de la vérification");
		} finally {
			setCheckingEmail(false);
		}
	};

	const handleLogup = async () => {
		if (!email || !password || isCandidate === null || isCompany === null) {
			Alert.alert("Erreur", "Merci de remplir tous les champs");
			return;
		}
		setSubmitting(true);
		try {
			await signUp(email, password, isCandidate, isCompany);
		} catch (error) {
			Alert.alert("Échec de l'inscription", error.message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleOTP = async (newOTP) => {
		if (newOTP.length !== 6) {
			Alert.alert("Erreur", "Le code doit contenir 6 chiffres");
			return;
		}
		try {
			const supabase = createSupabaseClient();
			const { data, error } = await supabase.functions.invoke(
				"verify-signup-otp",
				{ body: { email, otp: newOTP } },
			);
			if (error || !data?.success) {
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
			setShowModal(false);
			// OTP vérifié → passer à l'étape mots de passe + rôle
			setStep(2);
		} catch (error) {
			Alert.alert("Erreur", "Échec de la vérification du code");
		}
	};

	const handleReset = () => {
		setGeneratedTP(null);
	};

	const inputStyle = {
		borderRadius: 10,
		backgroundColor: isDark ? "#1f2937" : "#f9fafb",
		borderColor: isDark ? "#4b5563" : "#d1d5db",
	};
	const inputTextStyle = { color: isDark ? "#f3f4f6" : "#111827" };
	const labelStyle = {
		fontWeight: "600",
		color: isDark ? "#d1d5db" : "#374151",
	};

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f9fafb",
			}}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardShouldPersistTaps='handled'>
					<VStack
						style={{
							flex: 1,
							paddingHorizontal: 24,
							paddingBottom: 32,
						}}>
						{/* Back */}
						<TouchableOpacity
							onPress={() => router.back()}
							activeOpacity={0.7}
							style={{
								paddingTop: 12,
								paddingBottom: 8,
								alignSelf: "flex-start",
							}}>
							<HStack space='xs' style={{ alignItems: "center" }}>
								<Icon
									as={ChevronLeft}
									size='sm'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
									}}
								/>
								<Text
									size='sm'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
										fontWeight: "600",
									}}>
									Retour
								</Text>
							</HStack>
						</TouchableOpacity>

						{/* Logo */}
						<VStack
							style={{
								alignItems: "center",
								paddingTop: 24,
								paddingBottom: 32,
							}}>
							<Image
								source={require("@/assets/images/logo-wesafe-v2.png")}
								style={{ width: 80, height: 80 }}
								resizeMode='contain'
							/>
							<Text
								style={{
									fontSize: 24,
									fontWeight: "800",
									color: isDark ? "#f9fafb" : "#111827",
									marginTop: 16,
									letterSpacing: -0.5,
								}}>
								Créer un compte
							</Text>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 6,
								}}>
								{step === 1
									? "Étape 1 / 2 — Votre email"
									: "Étape 2 / 2 — Mot de passe et profil"}
							</Text>
						</VStack>

						{/* Form Card */}
						<Card
							style={{
								padding: 24,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 16,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<VStack space='lg'>
								{/* STEP 1 — Email */}
								{step === 1 && (
									<>
										<VStack space='xs'>
											<Text size='sm' style={labelStyle}>
												Adresse email
											</Text>
											<Input style={inputStyle}>
												<InputField
													type='text'
													placeholder='exemple@wesafeapp.com'
													value={email}
													onChangeText={(text) => {
														setEmail(text);
														setEmailError("");
													}}
													autoCapitalize='none'
													keyboardType='email-address'
													style={inputTextStyle}
												/>
											</Input>
											{emailError ? (
												<Text
													size='xs'
													style={{
														color: "#ef4444",
														marginTop: 2,
													}}>
													{emailError}
												</Text>
											) : null}
										</VStack>

										{checkingEmail ? (
											<ActivityIndicator
												size='large'
												color={
													isDark
														? "#60a5fa"
														: "#2563eb"
												}
											/>
										) : (
											<Button
												size='lg'
												style={{
													backgroundColor: "#2563eb",
													borderRadius: 12,
													height: 52,
												}}
												onPress={checkEmailExists}>
												<ButtonText
													style={{
														fontWeight: "700",
														fontSize: 16,
														color: "#ffffff",
													}}>
													Suivant
												</ButtonText>
											</Button>
										)}
									</>
								)}

								{/* STEP 2 — Password + role */}
								{step === 2 && (
									<>
										{/* Email readonly */}
										<VStack space='xs'>
											<Text size='sm' style={labelStyle}>
												Adresse email
											</Text>
											<Input
												style={{
													...inputStyle,
													opacity: 0.7,
												}}
												isDisabled>
												<InputField
													type='text'
													value={email}
													editable={false}
													style={inputTextStyle}
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
												<ButtonText
													style={{
														color: isDark
															? "#60a5fa"
															: "#2563eb",
														fontSize: 13,
													}}>
													Modifier l'email
												</ButtonText>
											</Button>
										</VStack>

										{/* Password */}
										<VStack space='xs'>
											<Text size='sm' style={labelStyle}>
												Mot de passe
											</Text>
											<Input style={inputStyle}>
												<InputField
													type={
														showPassword
															? "text"
															: "password"
													}
													placeholder='MonMotDePasse$'
													value={password}
													onChangeText={setPassword}
													style={inputTextStyle}
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

										{/* Confirm password */}
										<VStack space='xs'>
											<Text size='sm' style={labelStyle}>
												Confirmer le mot de passe
											</Text>
											<Input style={inputStyle}>
												<InputField
													type={
														showPassword2
															? "text"
															: "password"
													}
													placeholder='MonMotDePasse$'
													value={password2}
													onChangeText={setPassword2}
													style={inputTextStyle}
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

										{/* Role */}
										<VStack space='xs'>
											<Text size='sm' style={labelStyle}>
												Je suis
											</Text>
											<HStack
												space='lg'
												style={{ marginTop: 4 }}>
												<Checkbox
													size='md'
													onChange={() => {
														setIsCandidate(
															!isCandidate,
														);
														setIsCompany(false);
													}}
													isChecked={isCandidate}>
													<CheckboxIndicator>
														<CheckboxIcon
															as={CheckIcon}
														/>
													</CheckboxIndicator>
													<CheckboxLabel
														style={{
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														Candidat
													</CheckboxLabel>
												</Checkbox>
												<Checkbox
													size='md'
													onChange={() => {
														setIsCompany(
															!isCompany,
														);
														setIsCandidate(false);
													}}
													isChecked={isCompany}>
													<CheckboxIndicator>
														<CheckboxIcon
															as={CheckIcon}
														/>
													</CheckboxIndicator>
													<CheckboxLabel
														style={{
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														Professionnel
													</CheckboxLabel>
												</Checkbox>
											</HStack>
										</VStack>

										{submitting ? (
											<ActivityIndicator
												size='large'
												color={
													isDark
														? "#60a5fa"
														: "#2563eb"
												}
											/>
										) : (
											<Button
												size='lg'
												style={{
													backgroundColor: "#2563eb",
													borderRadius: 12,
													height: 52,
												}}
												onPress={handleLogup}>
												<ButtonText
													style={{
														fontWeight: "700",
														fontSize: 16,
														color: "#ffffff",
													}}>
													S'inscrire
												</ButtonText>
											</Button>
										)}
									</>
								)}
							</VStack>
						</Card>

						<Divider style={{ marginVertical: 24 }} />

						{/* Sign in link */}
						<HStack
							style={{
								justifyContent: "center",
								alignItems: "center",
							}}
							space='xs'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Déjà un compte ?
							</Text>
							<Link onPress={() => router.replace("/signin")}>
								<LinkText
									size='sm'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
										fontWeight: "600",
									}}>
									Me connecter
								</LinkText>
							</Link>
						</HStack>
					</VStack>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* OTP Modal */}
			<Modal
				isOpen={showModal}
				initialFocusRef={initialRef}
				onClose={() => {
					setShowModal(false);
					handleReset();
				}}
				size='lg'>
				<ModalBackdrop />
				<ModalContent
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 16,
					}}>
					<ModalHeader alignItems='flex-start'>
						<VStack>
							<Heading
								size='md'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Vérification par email
							</Heading>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 4,
								}}>
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
						<VStack space='md'>
							<OTPForm onSubmit={handleOTP} />
							<Button onPress={generateOTP} variant='link'>
								<ButtonText
									style={{
										textDecorationLine: "underline",
										fontWeight: "300",
										fontStyle: "italic",
										color: isDark ? "#60a5fa" : "#2563eb",
									}}>
									Je n'ai pas reçu de code
								</ButtonText>
							</Button>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<HStack space='md' style={{ width: "100%" }}>
							<Button
								variant='outline'
								action='secondary'
								style={{ flex: 1, borderRadius: 10 }}
								onPress={() => {
									setShowModal(false);
									handleReset();
								}}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								style={{
									flex: 1,
									borderRadius: 10,
									backgroundColor: "#2563eb",
								}}
								onPress={() => setShowModal(false)}>
								<ButtonText style={{ color: "#ffffff" }}>
									Valider
								</ButtonText>
							</Button>
						</HStack>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</SafeAreaView>
	);
};

export default SignUpScreen;
