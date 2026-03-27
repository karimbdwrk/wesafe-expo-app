import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
	Check,
	Building2,
	FileText,
	Hash,
	CheckCircle,
	AlertCircle,
	Mail,
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
import { width } from "dom-helpers";

const UpdateCompany = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update, getById, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	const [name, setName] = useState("");
	// const [siret, setSiret] = useState("");
	const [email, setEmail] = useState("");
	const [description, setDescription] = useState("");
	const [legalFirstname, setLegalFirstname] = useState("");
	const [legalLastname, setLegalLastname] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const scrollViewRef = useRef(null);
	const nameInputRef = useRef(null);
	const siretInputRef = useRef(null);
	const emailInputRef = useRef(null);
	const descriptionInputRef = useRef(null);
	const legalFirstnameInputRef = useRef(null);
	const legalLastnameInputRef = useRef(null);

	// Formater le SIRET avec des espaces : 123 456 789 00013
	const formatSiret = (value) => {
		const cleaned = value.replace(/\s/g, "");
		const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,5})$/);
		if (match) {
			return [match[1], match[2], match[3], match[4]]
				.filter(Boolean)
				.join(" ");
		}
		return value;
	};

	// Gérer le changement de SIRET
	const handleSiretChange = (value) => {
		const cleaned = value.replace(/\s/g, "");
		if (cleaned.length <= 14 && /^\d*$/.test(cleaned)) {
			setSiret(cleaned);
		}
	};

	// Fonction pour scroller vers l'input en focus
	const scrollToInput = (inputRef) => {
		if (inputRef.current && scrollViewRef.current) {
			setTimeout(() => {
				inputRef.current.measureLayout(
					scrollViewRef.current,
					(x, y) => {
						scrollViewRef.current.scrollTo({
							y: y - 100,
							animated: true,
						});
					},
					() => {},
				);
			}, 100);
		}
	};

	const handleUpdateCompany = async () => {
		if (!name || !email) {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='muted' variant='outline'>
						<HStack space='md' style={{ alignItems: "flex-start" }}>
							<Icon
								as={AlertCircle}
								className='text-red-500 mt-1'
							/>
							<VStack>
								<ToastTitle>Champs obligatoires</ToastTitle>
								<ToastDescription>
									Veuillez remplir le nom, le SIRET {"\n"}et
									l'email de l'entreprise.
								</ToastDescription>
							</VStack>
						</HStack>
					</Toast>
				),
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const updateCompany = await update("companies", user.id, {
				name: name,
				// siret: siret,
				email: email,
				description: description,
				legal_representative_firstname: legalFirstname,
				legal_representative_lastname: legalLastname,
			});
			console.log("update company :", updateCompany);

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<Toast nativeID={id} action='muted' variant='outline'>
						<HStack space='md' style={{ alignItems: "flex-start" }}>
							<Icon
								as={CheckCircle}
								className='text-green-500 mt-1'
							/>
							<VStack>
								<ToastTitle>
									Entreprise mise à jour !
								</ToastTitle>
								<ToastDescription>
									Les informations ont été enregistrées avec
									succès.
								</ToastDescription>
							</VStack>
						</HStack>
					</Toast>
				),
			});
			trackActivity("update_profile");
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
		const loadCompanyData = async () => {
			try {
				if (user?.id) {
					const companyData = await getById(
						"companies",
						user.id,
						"name,siret,email,description,legal_representative_firstname,legal_representative_lastname",
					);

					if (companyData) {
						setName(companyData.name || "");
						// setSiret(companyData.siret || "");
						setEmail(companyData.email || "");
						setDescription(companyData.description || "");
						setLegalFirstname(
							companyData.legal_representative_firstname || "",
						);
						setLegalLastname(
							companyData.legal_representative_lastname || "",
						);
					}
				}
			} catch (error) {
				console.error("Error loading company data:", error);
				toast.show({
					placement: "top",
					duration: 4000,
					render: ({ id }) => (
						<Toast nativeID={id} action='error' variant='accent'>
							<Icon as={AlertCircle} />
							<VStack>
								<ToastTitle>Erreur</ToastTitle>
								<ToastDescription>
									Impossible de charger les données de
									l'entreprise.
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadCompanyData();
	}, [user?.id]);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
			keyboardVerticalOffset={100}>
			<ScrollView
				ref={scrollViewRef}
				keyboardShouldPersistTaps='handled'
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				contentContainerStyle={{ paddingBottom: 100 }}>
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
								<Icon
									as={Building2}
									size={24}
									color='#ffffff'
								/>
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
							paddingBottom: 40,
						}}>
						<VStack space='lg'>
							{/* Nom de l'entreprise */}
							<VStack space='sm' ref={nameInputRef}>
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
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}>
									<InputSlot style={{ paddingLeft: 12 }}>
										<InputIcon
											as={Building2}
											size={20}
											color={
												isDark ? "#9ca3af" : "#6b7280"
											}
										/>
									</InputSlot>
									<InputField
										type='text'
										placeholder='Entrez le nom de votre entreprise'
										value={name}
										onChangeText={setName}
										onFocus={() =>
											scrollToInput(nameInputRef)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* Nom du représentant légal */}
							<VStack space='sm' ref={legalLastnameInputRef}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontWeight: "600",
									}}>
									Nom du représentant légal
								</Text>
								<Input
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}>
									<InputField
										type='text'
										placeholder='Nom'
										value={legalLastname}
										onChangeText={setLegalLastname}
										onFocus={() =>
											scrollToInput(legalLastnameInputRef)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* Prénom du représentant légal */}
							<VStack space='sm' ref={legalFirstnameInputRef}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontWeight: "600",
									}}>
									Prénom du représentant légal
								</Text>
								<Input
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}>
									<InputField
										type='text'
										placeholder='Prénom'
										value={legalFirstname}
										onChangeText={setLegalFirstname}
										onFocus={() =>
											scrollToInput(
												legalFirstnameInputRef,
											)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* SIRET */}
							{/* <VStack space='sm' ref={siretInputRef}>
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
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}>
									<InputSlot style={{ paddingLeft: 12 }}>
										<InputIcon
											as={Hash}
											size={20}
											color={
												isDark ? "#9ca3af" : "#6b7280"
											}
										/>
									</InputSlot>
									<InputField
										type='text'
										placeholder='123 456 789 00013'
										value={formatSiret(siret)}
										onChangeText={handleSiretChange}
										onFocus={() =>
											scrollToInput(siretInputRef)
										}
										keyboardType='numeric'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack> */}
							{/* 
							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/> */}

							{/* Email */}
							<VStack space='sm' ref={emailInputRef}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontWeight: "600",
									}}>
									Email *
								</Text>
								<Input
									isReadOnly
									isDisabled
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}>
									<InputSlot style={{ paddingLeft: 12 }}>
										<InputIcon
											as={Mail}
											size={20}
											color={
												isDark ? "#9ca3af" : "#6b7280"
											}
										/>
									</InputSlot>
									<InputField
										type='text'
										placeholder='contact@entreprise.com'
										value={email}
										onChangeText={setEmail}
										onFocus={() =>
											scrollToInput(emailInputRef)
										}
										keyboardType='email-address'
										autoCapitalize='none'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* Description */}
							<VStack space='sm' ref={descriptionInputRef}>
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
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
										minHeight: 120,
									}}>
									<TextareaInput
										placeholder='Description de votre entreprise...'
										value={description}
										onChangeText={setDescription}
										onFocus={() =>
											scrollToInput(descriptionInputRef)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
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
				</VStack>
			</ScrollView>

			{/* Bouton fixe en bas */}
			<Box
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					padding: 16,
					paddingBottom: 32,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
					borderTopWidth: 1,
					borderTopColor: isDark ? "#374151" : "#e5e7eb",
				}}>
				<Button
					onPress={handleUpdateCompany}
					disabled={isSubmitting}
					style={{
						backgroundColor: "#2563eb",
						width: "100%",
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
			</Box>
		</KeyboardAvoidingView>
	);
};

export default UpdateCompany;
