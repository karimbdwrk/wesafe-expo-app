import React, { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import {
	Check,
	Building2,
	FileText,
	Hash,
	CheckCircle,
	AlertCircle,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";

const UpdateCompany = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();
	const { companyName, companySiret, companyDescription } =
		useLocalSearchParams();

	const [name, setName] = useState("");
	const [siret, setSiret] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleUpdateCompany = async () => {
		if (!name || !siret) {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Champs obligatoires</ToastTitle>
							<ToastDescription>
								Veuillez remplir le nom et le SIRET de
								l'entreprise.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const updateCompany = await update("companies", user.id, {
				name: name,
				siret: siret,
				description: description,
			});
			console.log("update company :", updateCompany);

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon as={CheckCircle} />
						<VStack>
							<ToastTitle>Entreprise mise à jour !</ToastTitle>
							<ToastDescription>
								Les informations ont été enregistrées avec
								succès.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});

			setTimeout(() => router.back(), 1500);
		} catch (error) {
			console.log("error update company", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Impossible de mettre à jour l'entreprise.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		setName(companyName);
		setSiret(companySiret);
		setDescription(companyDescription);
	}, []);

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack space='lg' style={{ padding: 20 }}>
				{/* Header Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: "#2563eb",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon as={Building2} size={24} color='#ffffff' />
						</Box>
						<VStack style={{ flex: 1 }}>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Modifier l'entreprise
							</Heading>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 4,
								}}>
								Mettez à jour les informations de votre
								entreprise
							</Text>
						</VStack>
					</HStack>
				</Card>

				{/* Form Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<VStack space='lg'>
						{/* Nom de l'entreprise */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Nom de l'entreprise *
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Building2}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Entrez le nom de votre entreprise'
									value={name}
									onChangeText={setName}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* SIRET */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								SIRET *
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Hash}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Entrez le SIRET de votre entreprise'
									value={siret}
									onChangeText={setSiret}
									keyboardType='numeric'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Description */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Description
							</Text>
							<Textarea
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
									minHeight: 120,
								}}>
								<TextareaInput
									placeholder='Description de votre entreprise...'
									value={description}
									onChangeText={setDescription}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Textarea>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Une brève description de votre activité
							</Text>
						</VStack>
					</VStack>
				</Card>

				{/* Action Buttons */}
				<HStack space='md' style={{ justifyContent: "flex-end" }}>
					<Button
						variant='outline'
						onPress={() => router.back()}
						disabled={isSubmitting}
						style={{
							borderColor: isDark ? "#4b5563" : "#d1d5db",
						}}>
						<ButtonText
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Annuler
						</ButtonText>
					</Button>
					<Button
						onPress={handleUpdateCompany}
						disabled={isSubmitting}
						style={{
							backgroundColor: "#2563eb",
						}}>
						{isSubmitting ? (
							<ButtonText style={{ color: "#ffffff" }}>
								Enregistrement...
							</ButtonText>
						) : (
							<>
								<ButtonIcon
									as={CheckCircle}
									size={20}
									color='#ffffff'
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									Enregistrer
								</ButtonText>
							</>
						)}
					</Button>
				</HStack>
			</VStack>
		</ScrollView>
	);
};

export default UpdateCompany;
