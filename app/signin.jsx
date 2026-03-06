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

const SignInScreen = () => {
	const { signIn, loading } = useAuth();
	const router = useRouter();
	const { isDark } = useTheme();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Erreur", "Merci de remplir tous les champs");
			return;
		}
		setSubmitting(true);
		try {
			await signIn(email, password);
		} catch (error) {
			Alert.alert("Échec de la connexion", error.message);
		} finally {
			setSubmitting(false);
		}
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
								Connexion
							</Text>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 6,
								}}>
								Content de vous revoir 👋
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
								{/* Email */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Adresse email
									</Text>
									<Input
										style={{
											borderRadius: 10,
											backgroundColor: isDark
												? "#1f2937"
												: "#f9fafb",
											borderColor: isDark
												? "#4b5563"
												: "#d1d5db",
										}}>
										<InputField
											type='text'
											placeholder='exemple@wesafeapp.com'
											value={email}
											onChangeText={setEmail}
											autoCapitalize='none'
											keyboardType='email-address'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
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
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Mot de passe
									</Text>
									<Input
										style={{
											borderRadius: 10,
											backgroundColor: isDark
												? "#1f2937"
												: "#f9fafb",
											borderColor: isDark
												? "#4b5563"
												: "#d1d5db",
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
												color: isDark
													? "#f3f4f6"
													: "#111827",
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

								{/* Submit */}
								{submitting ? (
									<ActivityIndicator
										size='large'
										color={isDark ? "#60a5fa" : "#2563eb"}
										style={{ marginTop: 8 }}
									/>
								) : (
									<Button
										size='lg'
										style={{
											backgroundColor: "#2563eb",
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
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Pas encore de compte ?
							</Text>
							<Link onPress={() => router.replace("/signup")}>
								<LinkText
									size='sm'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
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
