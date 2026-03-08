import React, { useState, useEffect } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
} from "react-native";
import * as Linking from "expo-linking";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { ChevronLeft } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

export default function ResetPassword() {
	const router = useRouter();
	const { isDark } = useTheme();
	const { access_token: tokenParam, link_error: linkErrorParam } =
		useLocalSearchParams();

	const [accessToken, setAccessToken] = useState(null);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [linkError, setLinkError] = useState(false);

	useEffect(() => {
		// Web: token passed as search param by index.jsx after hash interception
		if (tokenParam) {
			setAccessToken(tokenParam);
			return;
		}
		if (linkErrorParam) {
			setLinkError(true);
			return;
		}

		// Native: deep link
		const parseNativeUrl = (url) => {
			if (!url) return;
			const hash = url.split("#")[1];
			if (!hash) {
				setLinkError(true);
				return;
			}
			const params = new URLSearchParams(hash);
			if (
				params.get("access_token") &&
				params.get("type") === "recovery"
			) {
				setAccessToken(params.get("access_token"));
			} else {
				setLinkError(true);
			}
		};
		Linking.getInitialURL().then((url) => {
			if (url) parseNativeUrl(url);
		});
		const sub = Linking.addEventListener("url", ({ url }) =>
			parseNativeUrl(url),
		);
		return () => sub.remove();
	}, [tokenParam, linkErrorParam]);

	const handleReset = async () => {
		if (password.length < 8) {
			Alert.alert("Mot de passe trop court", "Minimum 8 caractères.");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert(
				"Mots de passe différents",
				"Les deux champs ne correspondent pas.",
			);
			return;
		}
		setSubmitting(true);
		try {
			await axios.put(
				`${SUPABASE_URL}/auth/v1/user`,
				{ password },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				},
			);
			setDone(true);
		} catch (e) {
			Alert.alert(
				"Erreur",
				"Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const bg = isDark ? "#111827" : "#f9fafb";
	const cardBg = isDark ? "#1f2937" : "#ffffff";
	const textPrimary = isDark ? "#f3f4f6" : "#111827";
	const textSecondary = isDark ? "#9ca3af" : "#6b7280";
	const blue = isDark ? "#60a5fa" : "#2563eb";
	const borderColor = isDark ? "#374151" : "#e5e7eb";

	return (
		<SafeAreaView
			edges={["bottom"]}
			style={{ flex: 1, backgroundColor: bg }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, padding: 20 }}
					keyboardShouldPersistTaps='handled'>
					{/* Back button */}
					<TouchableOpacity
						onPress={() => router.replace("/signin")}
						activeOpacity={0.7}
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 24,
							alignSelf: "flex-start",
						}}>
						<ChevronLeft size={20} color={textSecondary} />
						<Text
							size='sm'
							style={{ color: textSecondary, marginLeft: 4 }}>
							Retour à la connexion
						</Text>
					</TouchableOpacity>

					{/* Title */}
					<Heading
						size='2xl'
						style={{ color: textPrimary, marginBottom: 8 }}>
						Nouveau mot de passe
					</Heading>
					<Text
						size='sm'
						style={{ color: textSecondary, marginBottom: 28 }}>
						Choisissez un mot de passe sécurisé d'au moins 8
						caractères.
					</Text>

					{/* Error: invalid link */}
					{linkError && (
						<Box
							style={{
								backgroundColor: isDark ? "#450a0a" : "#fef2f2",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#991b1b" : "#fecaca",
								padding: 16,
								marginBottom: 20,
							}}>
							<Text
								style={{
									color: isDark ? "#fca5a5" : "#dc2626",
									fontWeight: "700",
									fontSize: 15,
									marginBottom: 4,
								}}>
								Lien invalide ou expiré
							</Text>
							<Text
								style={{
									color: isDark ? "#fecaca" : "#991b1b",
									fontSize: 14,
									lineHeight: 20,
								}}>
								Ce lien de réinitialisation n'est plus valide.
								Retournez à l'écran de connexion et faites une
								nouvelle demande.
							</Text>
						</Box>
					)}

					{/* Success */}
					{done && (
						<Box
							style={{
								backgroundColor: isDark ? "#052e16" : "#f0fdf4",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#166534" : "#bbf7d0",
								padding: 16,
								marginBottom: 20,
							}}>
							<Text
								style={{
									color: isDark ? "#86efac" : "#166534",
									fontWeight: "700",
									fontSize: 15,
									marginBottom: 4,
								}}>
								Mot de passe mis à jour ✓
							</Text>
							<Text
								style={{
									color: isDark ? "#bbf7d0" : "#15803d",
									fontSize: 14,
									lineHeight: 20,
								}}>
								Votre mot de passe a été réinitialisé avec
								succès.
							</Text>
							<Button
								size='lg'
								style={{
									backgroundColor: "#2563eb",
									borderRadius: 12,
									height: 52,
									marginTop: 16,
								}}
								onPress={() => router.replace("/signin")}>
								<ButtonText
									style={{
										fontWeight: "700",
										fontSize: 16,
										color: "#ffffff",
									}}>
									Se connecter
								</ButtonText>
							</Button>
						</Box>
					)}

					{/* Form (hidden once done or link error) */}
					{!done && !linkError && (
						<Card
							style={{
								backgroundColor: cardBg,
								borderRadius: 16,
								borderWidth: 1,
								borderColor,
								padding: 20,
							}}>
							<VStack space='md'>
								{/* Nouveau mot de passe */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											color: textSecondary,
											fontWeight: "600",
										}}>
										Nouveau mot de passe
									</Text>
									<Input
										variant='outline'
										size='lg'
										style={{
											borderColor,
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
											borderRadius: 10,
										}}>
										<InputField
											placeholder='Minimum 8 caractères'
											placeholderTextColor={
												isDark ? "#6b7280" : "#9ca3af"
											}
											secureTextEntry={!showPassword}
											value={password}
											onChangeText={setPassword}
											style={{ color: textPrimary }}
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

								{/* Confirmer mot de passe */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											color: textSecondary,
											fontWeight: "600",
										}}>
										Confirmer le mot de passe
									</Text>
									<Input
										variant='outline'
										size='lg'
										style={{
											borderColor,
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
											borderRadius: 10,
										}}>
										<InputField
											placeholder='Répétez le mot de passe'
											placeholderTextColor={
												isDark ? "#6b7280" : "#9ca3af"
											}
											secureTextEntry={!showConfirm}
											value={confirmPassword}
											onChangeText={setConfirmPassword}
											style={{ color: textPrimary }}
										/>
										<InputSlot
											className='pr-3'
											onPress={() =>
												setShowConfirm(!showConfirm)
											}>
											<InputIcon
												as={
													showConfirm
														? EyeIcon
														: EyeOffIcon
												}
											/>
										</InputSlot>
									</Input>
								</VStack>

								{/* Submit */}
								{submitting ? (
									<ActivityIndicator
										size='large'
										color={blue}
										style={{ marginTop: 8 }}
									/>
								) : (
									<Button
										size='lg'
										style={{
											backgroundColor: !accessToken
												? "#6b7280"
												: "#2563eb",
											borderRadius: 12,
											height: 52,
											marginTop: 8,
										}}
										disabled={!accessToken}
										onPress={handleReset}>
										<ButtonText
											style={{
												fontWeight: "700",
												fontSize: 16,
												color: "#ffffff",
											}}>
											{accessToken
												? "Réinitialiser le mot de passe"
												: "Chargement…"}
										</ButtonText>
									</Button>
								)}
							</VStack>
						</Card>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
