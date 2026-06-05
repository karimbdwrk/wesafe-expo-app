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
import Svg, { Path } from "react-native-svg";

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
import LogoTitle from "@/assets/icons/Logo";
import Colors from "@/constants/Colors";
import { createSupabaseClient } from "../lib/supabase";
import OTPForm from "../components/OTPForm";

const SignUpScreen = () => {
	const { signUp, loading } = useAuth();
	const router = useRouter();
	const { isDark } = useTheme();
	const scheme = isDark ? "dark" : "light";
	const bg = Colors[scheme].background;
	const cardBg = Colors[scheme].cardBackground;
	const elevated = Colors[scheme].elevated;
	const border = Colors[scheme].border;
	const textPrimary = Colors[scheme].text;
	const muted = Colors[scheme].muted;
	const tint = Colors[scheme].tint;
	const danger = Colors[scheme].danger;
	const initialRef = useRef(null);

	const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

	const [generatedOTP, setGeneratedTP] = useState(null);
	const [otpStatus, setOtpStatus] = useState(null);
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
	const [countdown, setCountdown] = useState(0);

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
			setCountdown(30);
		} catch (error) {
			Alert.alert("Erreur", "Échec de l'envoi du code");
		}
	};

	useEffect(() => {
		console.log("isCandidate or isCompany :", isCandidate, isCompany);
	}, [isCandidate, isCompany]);

	useEffect(() => {
		if (countdown <= 0) return;
		const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [countdown]);

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
		if (!email || !password) {
			Alert.alert("Erreur", "Merci de remplir tous les champs");
			return;
		}
		if (password !== password2) {
			Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
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
		setOtpStatus(null);
		try {
			const supabase = createSupabaseClient();
			const { data, error } = await supabase.functions.invoke(
				"verify-signup-otp",
				{ body: { email, otp: newOTP } },
			);
			if (error || !data?.success) {
				const errorMessage = data?.error || "Code invalide ou expiré";
				setOtpStatus("error");
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
			setOtpStatus("success");
			setTimeout(() => {
				setShowModal(false);
				setStep(2);
				setOtpStatus(null);
			}, 700);
		} catch (error) {
			setOtpStatus("error");
			Alert.alert("Erreur", "Échec de la vérification du code");
		}
	};

	const handleReset = () => {
		setGeneratedTP(null);
	};

	const inputStyle = {
		borderRadius: 10,
		backgroundColor: elevated,
		borderColor: border,
	};
	const inputTextStyle = { color: textPrimary };
	const labelStyle = {
		fontWeight: "600",
		color: muted,
	};

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: bg,
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
										color: tint,
									}}
								/>
								<Text
									size='sm'
									style={{
										color: tint,
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
							<LogoTitle
								colorScheme={isDark ? "dark" : "light"}
								size={80}
							/>
							<Svg
								viewBox='0 0 266.25 77.95'
								width={120}
								height={35}
								style={{ marginTop: 16 }}>
								<Path
									fill={textPrimary}
									d='M35.15,20.26l-9.08,32.91h-11.6L0,1.05h12.93l8.38,33.82L29.97,1.05h10.76l8.59,33.82L57.78,1.05h12.37l-14.53,52.12h-11.6l-8.87-32.91Z'
								/>
								<Path
									fill={textPrimary}
									d='M73.58,1.05h30.18v10.97h-17.75v9.57h15.93v9.99h-15.93v10.62h18.31v10.97h-30.74V1.05Z'
								/>
								<Path
									fill={textPrimary}
									d='M135.27,12.86c-2.24-1.61-5.24-2.8-7.96-2.8-3.56,0-5.31,1.4-5.31,3.49,0,2.59,2.59,4.33,7.34,8.66,8.38,7.55,11.11,11.95,11.11,17.4,0,9.01-8.1,14.39-18.31,14.39-4.68,0-10.69-1.33-14.67-3.63l4.33-9.57c3.28,1.82,6.5,3.14,10.27,3.14,3.56,0,5.73-1.89,5.73-4.12,0-2.65-2.52-5.03-7.48-9.5-8.38-7.27-11.32-10.62-11.32-16.77,0-6.99,5.59-13.56,18.03-13.56,4.12,0,8.87,1.4,12.65,3.35l-4.4,9.5Z'
								/>
								<Path
									fill={textPrimary}
									d='M178.6,45.42h-20.82l-2.79,7.76h-12.93L162.25,1.05h12.3l20.19,52.12h-13.35l-2.79-7.76ZM175.1,35.63l-6.85-19.07-6.92,19.07h13.77Z'
								/>
								<Path
									fill={textPrimary}
									d='M198.16,1.05h31.79v10.97h-19.35v11.11h16.98v10.97h-16.98v19.07h-12.44V1.05Z'
								/>
								<Path
									fill={textPrimary}
									d='M235.13,1.05h30.18v10.97h-17.75v9.57h15.93v9.99h-15.93v10.62h18.31v10.97h-30.74V1.05Z'
								/>
								<Path
									fill={muted}
									d='M110.38,57.75h4.67c3.96,0,6.19,2.12,6.19,5.51s-2.26,5.59-5.4,6.3l5.93,7.76h-3.57l-5.77-7.53h-.24l-.81,7.53h-3.07l2.07-19.57ZM113.16,60.58l-.68,6.5h1.68c2.47,0,3.99-1.57,3.99-3.67,0-1.52-.94-2.83-3.25-2.83h-1.73Z'
								/>
								<Path
									fill={muted}
									d='M125.48,57.75h10.07l-.29,2.7h-7l-.55,5.33h6.37l-.29,2.65h-6.37l-.66,6.19h7.21l-.29,2.7h-10.28l2.07-19.57Z'
								/>
								<Path
									fill={muted}
									d='M152.23,61.34c-1.23-.84-2.68-1.39-4.64-1.39-4.51,0-8.18,3.49-8.18,7.9,0,3.83,2.91,7.27,7.24,7.27,1.36,0,2.75-.37,4.28-1.26l1.18,2.46c-1.94,1.23-3.93,1.63-5.74,1.63-5.82,0-10.05-4.46-10.05-9.89,0-6.22,5.01-10.94,11.31-10.94,2.31,0,4.28.6,6.16,1.94l-1.55,2.28Z'
								/>
								<Path
									fill={muted}
									d='M156.16,57.75h4.67c3.96,0,6.19,2.12,6.19,5.51s-2.26,5.59-5.4,6.3l5.93,7.76h-3.57l-5.77-7.53h-.24l-.81,7.53h-3.07l2.07-19.57ZM158.94,60.58l-.68,6.5h1.68c2.47,0,3.99-1.57,3.99-3.67,0-1.52-.94-2.83-3.25-2.83h-1.73Z'
								/>
								<Path
									fill={muted}
									d='M175.7,77.95c-4.72,0-7.4-3.31-6.87-8.47l1.26-11.72h3.07l-1.31,12.38c-.34,3.33,1.63,5.01,3.93,5.01,2.07,0,4.22-1.6,4.56-4.91l1.34-12.49h3.07l-1.26,11.8c-.6,5.59-3.33,8.39-7.79,8.39Z'
								/>
								<Path
									fill={muted}
									d='M187.42,57.75h3.09l-2.1,19.57h-3.07l2.07-19.57Z'
								/>
								<Path
									fill={muted}
									d='M195.26,60.5h-3.44l.29-2.75h10.02l-.29,2.75h-3.49l-1.78,16.81h-3.07l1.76-16.81Z'
								/>
								<Path
									fill={muted}
									d='M205.62,57.75h3.07l3.23,14.01,4.3-14.01h3.07l2.99,19.57h-3.12l-1.97-13.82-4.41,13.82h-2.36l-3.36-13.95-3.38,13.95h-3.17l5.11-19.57Z'
								/>
								<Path
									fill={muted}
									d='M225.73,57.75h10.07l-.29,2.7h-7l-.55,5.33h6.37l-.29,2.65h-6.37l-.66,6.19h7.21l-.29,2.7h-10.28l2.07-19.57Z'
								/>
								<Path
									fill={muted}
									d='M240.97,62.86l-1.55,14.45h-3.07l2.07-19.57h3.1l8.52,14.37,1.52-14.37h3.1l-2.07,19.57h-3.02l-8.6-14.45Z'
								/>
								<Path
									fill={muted}
									d='M259.38,60.5h-3.44l.29-2.75h10.02l-.29,2.75h-3.49l-1.78,16.81h-3.07l1.76-16.81Z'
								/>
							</Svg>
							<Text
								style={{
									fontSize: 24,
									fontWeight: "800",
									color: textPrimary,
									marginTop: 16,
									letterSpacing: -0.5,
									lineHeight: 28,
								}}>
								Créer un compte
							</Text>
							<Text
								size='sm'
								style={{
									color: muted,
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
								backgroundColor: cardBg,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: border,
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
														color: danger,
														marginTop: 2,
														marginBottom: 2,
													}}>
													{emailError}
												</Text>
											) : (
												<Text
													size='xs'
													style={{
														color: "gray",
														marginTop: 2,
														marginBottom: 2,
													}}>
													Un code vous sera envoyé par
													email, valable 5 minutes
												</Text>
											)}
										</VStack>

										{checkingEmail ? (
											<ActivityIndicator
												size='large'
												color={tint}
											/>
										) : (
											<Button
												size='lg'
												style={{
													backgroundColor: tint,
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
														color: tint,
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
										{/* <VStack space='xs'>
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
															color: muted,
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
															color: muted,
														}}>
														Professionnel
													</CheckboxLabel>
												</Checkbox>
											</HStack>
										</VStack> */}

										{submitting ? (
											<ActivityIndicator
												size='large'
												color={tint}
											/>
										) : (
											<Button
												size='lg'
												style={{
													backgroundColor: tint,
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
									color: muted,
								}}>
								Déjà un compte ?
							</Text>
							<Link onPress={() => router.replace("/signin")}>
								<LinkText
									size='sm'
									style={{
										color: tint,
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
						backgroundColor: cardBg,
						borderRadius: 16,
					}}>
					<ModalHeader alignItems='flex-start'>
						<VStack>
							<Heading
								size='md'
								style={{
									color: textPrimary,
								}}>
								Vérification par email
							</Heading>
							<Text
								size='xs'
								style={{
									color: muted,
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
							<OTPForm
								onSubmit={handleOTP}
								status={otpStatus}
								onReset={() => setOtpStatus(null)}
							/>
							<Text
								size='xs'
								style={{
									textAlign: "center",
									color: muted,
									fontStyle: "italic",
								}}>
								Vous ne trouvez pas le code ? Pensez à vérifier
								vos spams ou courriers indésirables.
							</Text>
							{countdown > 0 ? (
								<Text
									size='sm'
									style={{
										textAlign: "center",
										color: muted,
										fontStyle: "italic",
									}}>
									Renvoyer un code dans {countdown}s
								</Text>
							) : (
								<Button onPress={generateOTP} variant='link'>
									<ButtonText
										style={{
											textDecorationLine: "underline",
											fontWeight: "300",
											fontStyle: "italic",
											color: tint,
										}}>
										Renvoyer un code
									</ButtonText>
								</Button>
							)}
						</VStack>
					</ModalBody>
					<ModalFooter>
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
					</ModalFooter>
				</ModalContent>
			</Modal>
		</SafeAreaView>
	);
};

export default SignUpScreen;
