import React, { useState } from "react";
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
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Link, LinkText } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { EyeIcon, EyeOffIcon, Icon } from "@/components/ui/icon";
import { ChevronLeft } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const SignInScreen = () => {
	const { signIn, loading } = useAuth();
	const router = useRouter();
	const { isDark } = useTheme();
	const bg          = isDark ? Colors.dark.background     : Colors.light.background;
	const cardBg      = isDark ? Colors.dark.cardBackground : Colors.light.cardBackground;
	const elevated    = isDark ? Colors.dark.elevated       : Colors.light.elevated;
	const border      = isDark ? Colors.dark.border         : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text           : Colors.light.text;
	const muted       = isDark ? Colors.dark.muted          : Colors.light.muted;
	const tint        = isDark ? Colors.dark.tint           : Colors.light.tint;
	const danger      = isDark ? Colors.dark.danger         : Colors.light.danger;
	const danger20    = isDark ? Colors.dark.danger20       : Colors.light.danger20;
	const success     = isDark ? Colors.dark.success        : Colors.light.success;
	const success20   = isDark ? Colors.dark.success20      : Colors.light.success20;

	const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [deletedAccount, setDeletedAccount] = useState(false);
	const [forgotSent, setForgotSent] = useState(false);
	const [forgotLoading, setForgotLoading] = useState(false);

	const handleForgotPassword = async () => {
		const trimmed = email.trim();
		if (!trimmed) {
			Alert.alert(
				"Champ requis",
				'Saisissez votre adresse email dans le champ ci-dessus, puis appuyez sur "Mot de passe oublié".',
			);
			return;
		}
		setForgotLoading(true);
		try {
			// await axios.post(
			// 	`${SUPABASE_URL}/auth/v1/recover`,
			// 	{
			// 		email: trimmed,
			// 		redirect_to:
			// 			"https://VOTRE-DOMAINE-NEXTJS.com/reset-password",
			// 	},
			// 	{
			// 		headers: {
			// 			apikey: SUPABASE_API_KEY,
			// 			"Content-Type": "application/json",
			// 		},
			// 	},
			// );
			await axios.post(
				`${SUPABASE_URL}/functions/v1/send-password-reset`,
				{ email: trimmed },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						"Content-Type": "application/json",
					},
				},
			);
			setForgotSent(true);
		} catch (e) {
			Alert.alert(
				"Erreur",
				"Impossible d'envoyer l'email. Vérifiez votre adresse et réessayez.",
			);
		} finally {
			setForgotLoading(false);
		}
	};

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Erreur", "Merci de remplir tous les champs");
			return;
		}
		setDeletedAccount(false);
		setSubmitting(true);
		try {
			// Pré-authentification pour vérifier le statut du compte
			const { data: authData } = await axios.post(
				`${SUPABASE_URL}/auth/v1/token?grant_type=password`,
				{ email, password },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						"Content-Type": "application/json",
					},
				},
			);

			const userId = authData.user.id;
			const token = authData.access_token;
			const authHeaders = {
				Authorization: `Bearer ${token}`,
				apikey: SUPABASE_API_KEY,
			};

			// Vérifier le statut dans les deux tables en parallèle
			const [profileRes, companyRes] = await Promise.all([
				axios.get(
					`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=profile_status`,
					{ headers: authHeaders },
				),
				axios.get(
					`${SUPABASE_URL}/rest/v1/companies?id=eq.${userId}&select=company_status`,
					{ headers: authHeaders },
				),
			]);

			const profile = profileRes.data[0];
			const company = companyRes.data[0];

			if (
				profile?.profile_status === "deleted" ||
				company?.company_status === "deleted"
			) {
				// Invalider la session et bloquer la connexion
				await axios
					.post(
						`${SUPABASE_URL}/auth/v1/logout`,
						{},
						{ headers: authHeaders },
					)
					.catch(() => {});
				setDeletedAccount(true);
				return;
			}

			// Compte actif → connexion normale
			await signIn(email, password);
		} catch (error) {
			const msg =
				error?.response?.data?.error_description ||
				error?.response?.data?.msg ||
				error.message;
			Alert.alert("Échec de la connexion", msg);
		} finally {
			setSubmitting(false);
		}
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
						{/* Back button */}
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
							<Image
								source={require("@/assets/images/logo-wesafe-v2.png")}
								style={{ width: 80, height: 80 }}
								resizeMode='contain'
							/>
							<Text
								style={{
									fontSize: 24,
									fontWeight: "800",
									color: textPrimary,
									marginTop: 16,
									letterSpacing: -0.5,
									lineHeight: 28,
								}}>
								Connexion
							</Text>
							<Text
								size='sm'
								style={{
									color: muted,
									marginTop: 6,
								}}>
								Content de vous revoir 👋
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
								{/* Email */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Adresse email
									</Text>
									<Input
										style={{
											borderRadius: 10,
											backgroundColor: elevated,
											borderColor: border,
										}}>
										<InputField
											type='text'
											placeholder='exemple@wesafeapp.com'
											value={email}
											onChangeText={setEmail}
											autoCapitalize='none'
											keyboardType='email-address'
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								{/* Password */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Mot de passe
									</Text>
									<Input
										style={{
											borderRadius: 10,
											backgroundColor: elevated,
											borderColor: border,
										}}>
										<InputField
											type={
												showPassword
													? "text"
													: "password"
											}
											placeholder='MonMotDePasse$'
											value={password}
											onChangeText={setPassword}
											style={{
												color: textPrimary,
											}}
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

								{/* Mot de passe oublié */}
								<TouchableOpacity
									onPress={handleForgotPassword}
									disabled={forgotLoading}
									activeOpacity={0.7}
									style={{
										alignSelf: "flex-end",
										marginTop: -4,
									}}>
									{forgotLoading ? (
										<ActivityIndicator
											size='small'
											color={tint}
										/>
									) : (
										<Text
											size='sm'
											style={{
												color: tint,
												fontWeight: "600",
											}}>
											Mot de passe oublié ?
										</Text>
									)}
								</TouchableOpacity>
								{/* Submit */}
								{submitting ? (
									<ActivityIndicator
										size='large'
										color={tint}
										style={{ marginTop: 8 }}
									/>
								) : (
									<Button
										size='lg'
										style={{
											backgroundColor: tint,
											borderRadius: 12,
											height: 52,
											marginTop: 8,
										}}
										onPress={handleLogin}>
										<ButtonText
											style={{
												fontWeight: "700",
												fontSize: 16,
												color: "#ffffff",
											}}>
											Se connecter
										</ButtonText>
									</Button>
								)}
							</VStack>
						</Card>

						{/* Message compte supprimé */}
						{deletedAccount && (
							<Box
								style={{
									backgroundColor: danger20,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: danger20,
									padding: 16,
									marginTop: 16,
								}}>
								<Text
									style={{
										color: danger,
										fontWeight: "700",
										fontSize: 15,
										marginBottom: 4,
									}}>
									Compte en cours de suppression
								</Text>
								<Text
									style={{
										color: danger,
										fontSize: 14,
										lineHeight: 20,
									}}>
									Ce compte a été marqué pour suppression. Si
									vous pensez qu'il s'agit d'une erreur,
									contactez-nous à{" "}
									<Text style={{ fontWeight: "700" }}>
										support@wesafe.fr
									</Text>{" "}
									avant la date d'échéance.
								</Text>
							</Box>
						)}

						{/* Email reset envoyé */}
						{forgotSent && (
							<Box
								style={{
									backgroundColor: success20,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: success20,
									padding: 16,
									marginTop: 16,
								}}>
								<Text
									style={{
										color: success,
										fontWeight: "700",
										fontSize: 15,
										marginBottom: 4,
									}}>
									Email envoyé ✓
								</Text>
								<Text
									style={{
										color: success,
										fontSize: 14,
										lineHeight: 20,
									}}>
									Un lien de réinitialisation a été envoyé à{" "}
									{email}. Vérifiez votre boîte de réception
									(et vos spams).
								</Text>
							</Box>
						)}
						<Divider style={{ marginVertical: 24 }} />

						{/* Sign up link */}
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
								Pas encore de compte ?
							</Text>
							<Link onPress={() => router.replace("/signup")}>
								<LinkText
									size='sm'
									style={{
										color: tint,
										fontWeight: "600",
									}}>
									M'inscrire
								</LinkText>
							</Link>
						</HStack>
					</VStack>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default SignInScreen;
