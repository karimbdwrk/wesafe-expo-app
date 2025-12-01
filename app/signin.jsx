import React, { useState } from "react";
import {
	View,
	TextInput,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

import { Button, ButtonText } from "@/components/ui/button";
import { Link, LinkText } from "@/components/ui/link";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";

const SignInScreen = () => {
	const { signIn, loading } = useAuth();
	const router = useRouter();

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
			// console.log("redirection from signin.jsx");
			// router.replace("/tabs/(tabs)");
		} catch (error) {
			Alert.alert("Échec de la connexion", error.message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView
			style={{ flex: 1, padding: 16, backgroundColor: "#FFFFFF" }}>
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
					<View style={styles.container}>
						<FormControl
							className='p-4 border rounded-lg border-outline-300'
							style={{ width: "100%" }}>
							<VStack space='xl'>
								<Heading className='text-typography-900'>
									Je me connecte
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
								{submitting ? (
									<ActivityIndicator size='large' />
								) : (
									<Button
										className='ml-auto mt-6'
										style={{ width: "100%" }}
										onPress={handleLogin}>
										<ButtonText className='text-typography-0'>
											Se connecter
										</ButtonText>
									</Button>
								)}
							</VStack>
							<HStack
								space={"sm"}
								style={{ paddingTop: 30, paddingBottom: 5 }}
								justifyContent='center'>
								<Text>Je n'ai pas de compte</Text>
								<Link onPress={() => router.replace("/signup")}>
									<LinkText>M'inscrire</LinkText>
								</Link>
							</HStack>
						</FormControl>
						{loading && (
							<Text style={styles.loading}>
								Chargement de la session...
							</Text>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default SignInScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		padding: 15,
		backgroundColor: "#FFFFFF",
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
