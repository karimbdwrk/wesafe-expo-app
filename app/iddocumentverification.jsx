import React, { useState, useEffect, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import {
	CheckCircle,
	Clock,
	AlertCircle,
	CreditCard,
	IdCard,
	Camera,
	Image as ImageIcon,
	Calendar,
	Upload,
	X,
	Globe,
} from "lucide-react-native";

import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "identity-documents";

const flagEmoji = (cca2) =>
	cca2
		.toUpperCase()
		.split("")
		.map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
		.join("");

export default function IDDocumentVerification({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	const [documentType, setDocumentType] = useState(null);
	const [frontImage, setFrontImage] = useState(null);
	const [backImage, setBackImage] = useState(null);

	const [documentUploadedType, setDocumentUploadedType] = useState(null);
	const [documentUploadedStatus, setDocumentUploadedStatus] = useState(null);
	const [documentUploadedValidityDate, setDocumentUploadedValidityDate] =
		useState(null);

	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [date, setDate] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Nationalité
	const [nationalityQuery, setNationalityQuery] = useState("");
	const [nationalitySuggestions, setNationalitySuggestions] = useState([]);
	const [selectedNationality, setSelectedNationality] = useState(null);
	const [loadingNationalities, setLoadingNationalities] = useState(false);
	const countriesCacheRef = useRef(null);
	const searchTimeoutRef = useRef(null);

	const searchNationality = async (query) => {
		if (query.length < 3) {
			setNationalitySuggestions([]);
			return;
		}
		setLoadingNationalities(true);
		try {
			if (!countriesCacheRef.current) {
				const res = await axios.get(
					"https://restcountries.com/v3.1/all?fields=cca2,translations,flags",
				);
				countriesCacheRef.current = res.data;
			}
			const lower = query.toLowerCase();
			const results = countriesCacheRef.current
				.filter((c) => {
					const frName = c.translations?.fra?.common || "";
					return frName.toLowerCase().includes(lower);
				})
				.slice(0, 8)
				.map((c) => ({
					code: c.cca2,
					name: c.translations?.fra?.common || c.cca2,
					flag: flagEmoji(c.cca2),
				}));
			setNationalitySuggestions(results);
		} catch (e) {
			console.error("searchNationality error:", e);
		} finally {
			setLoadingNationalities(false);
		}
	};

	const handleNationalityChange = (text) => {
		setNationalityQuery(text);
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		searchTimeoutRef.current = setTimeout(
			() => searchNationality(text),
			300,
		);
	};

	const handleSelectNationality = (country) => {
		setSelectedNationality(country);
		setNationalityQuery(country.name);
		setNationalitySuggestions([]);
		update("profiles", user.id, { nationality: country.code });
	};

	useFocusEffect(
		useCallback(() => {
			console.log("Document Verification Screen focused");
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		console.log("User profile updated:", userProfile);
		setDocumentUploadedType(userProfile?.id_type || null);
		setDocumentUploadedStatus(userProfile?.id_verification_status || null);
		setDocumentUploadedValidityDate(userProfile?.id_validity_date || null);
		// Charger la nationalité stockée
		const code = userProfile?.nationality;
		if (code) {
			axios
				.get(
					`https://restcountries.com/v3.1/alpha/${code}?fields=cca2,translations`,
				)
				.then((res) => {
					const c = res.data;
					const country = {
						code: c.cca2,
						name: c.translations?.fra?.common || c.cca2,
						flag: flagEmoji(c.cca2),
					};
					setSelectedNationality(country);
					setNationalityQuery(country.name);
				})
				.catch(() => {
					setSelectedNationality({ code, name: code, flag: "" });
					setNationalityQuery(code);
				});
		}
	}, [userProfile]);

	useEffect(() => {
		if (date) {
			console.log("Selected date:", date);
		}
	}, [date]);

	const handleConfirmDate = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		setDate(simpleDate);
		setDatePickerVisibility(false);
	};

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const pickImage = async (side) => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") {
			console.warn("Permission denied");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			const asset = result.assets[0];
			if (side === "front") setFrontImage(asset);
			if (side === "back") setBackImage(asset);
		}
	};

	const canSubmit =
		documentType === "passport"
			? !!frontImage
			: !!frontImage && !!backImage;

	/* ------------------ */
	/* Upload logic       */
	/* ------------------ */

	const uploadDocument = async ({ image, side, documentType }) => {
		if (!image?.uri) throw new Error("No image to upload");

		const formData = new FormData();

		const originalName = image.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";
		const mimeType = `image/${extension}`;

		const storageFilename = `${user.id}/${documentType}_${side}_${Date.now()}.${extension}`;

		formData.append("files", {
			uri: image.uri,
			name: storageFilename,
			type: mimeType,
		});

		await axios.post(
			`${SUPABASE_URL}/storage/v1/object/${DOCUMENTS_BUCKET}/${storageFilename}`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${accessToken}`,
					apikey: SUPABASE_API_KEY,
				},
			},
		);

		return `${SUPABASE_URL}/storage/v1/object/public/${DOCUMENTS_BUCKET}/${storageFilename}`;
	};

	/* ------------------ */
	/* Submit             */
	/* ------------------ */

	const handleSubmitDocuments = async () => {
		console.log("Submitting documents...");
		setIsSubmitting(true);
		try {
			if (documentType === "passport") {
				const passportUrl = await uploadDocument({
					image: frontImage,
					side: "main",
					documentType: "passport",
				});

				await update("profiles", user.id, {
					id_type: documentType,
					id_validity_date: date,
					passport_url: passportUrl,
					id_verification_status: "pending",
				});
			}

			if (documentType === "national_id") {
				const frontUrl = await uploadDocument({
					image: frontImage,
					side: "front",
					documentType: "national_id",
				});

				const backUrl = await uploadDocument({
					image: backImage,
					side: "back",
					documentType: "national_id",
				});

				await update("profiles", user.id, {
					id_type: documentType,
					id_validity_date: date,
					national_id_front_url: frontUrl,
					national_id_back_url: backUrl,
					id_verification_status: "pending",
				});
			}

			if (documentType === "residence_permit") {
				const frontUrl = await uploadDocument({
					image: frontImage,
					side: "front",
					documentType: "residence_permit",
				});

				const backUrl = await uploadDocument({
					image: backImage,
					side: "back",
					documentType: "residence_permit",
				});

				await update("profiles", user.id, {
					id_type: documentType,
					id_validity_date: date,
					residence_permit_front_url: frontUrl,
					residence_permit_back_url: backUrl,
					id_verification_status: "pending",
				});
			}

			console.log("Documents submitted successfully");

			// Recharger les données utilisateur
			await loadUserData(user.id, accessToken);

			// Réinitialiser le formulaire
			setDocumentType(null);
			setFrontImage(null);
			setBackImage(null);
			setDate(null);

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon
							as={CheckCircle}
							size='lg'
							className='mr-2'
							style={{ color: "#10b981" }}
						/>
						<VStack space='xs' style={{ flex: 1 }}>
							<ToastTitle>
								Documents soumis avec succès !
							</ToastTitle>
							<ToastDescription>
								Vos documents sont en cours de vérification.
								Vous recevrez une notification dès que la
								vérification sera terminée.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} catch (error) {
			console.error("Submit documents error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon
							as={AlertCircle}
							size='lg'
							className='mr-2'
							style={{ color: "#ef4444" }}
						/>
						<VStack space='xs' style={{ flex: 1 }}>
							<ToastTitle>
								Erreur lors de la soumission
							</ToastTitle>
							<ToastDescription>
								Une erreur est survenue lors de l'envoi de vos
								documents. Veuillez réessayer.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	/* ------------------ */
	/* UI                 */
	/* ------------------ */

	const getStatusBadge = () => {
		const statusConfig = {
			verified: {
				action: "success",
				icon: CheckCircle,
				label: "Vérifié",
			},
			pending: {
				action: "warning",
				icon: Clock,
				label: "En attente",
			},
			rejected: {
				action: "error",
				icon: AlertCircle,
				label: "Rejeté",
			},
		};

		const config =
			statusConfig[documentUploadedStatus] || statusConfig.pending;

		return (
			<Badge size='md' variant='solid' action={config.action}>
				<BadgeIcon as={config.icon} />
				<BadgeText className='ml-1'>{config.label}</BadgeText>
			</Badge>
		);
	};

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: isDark ? "#1f2937" : "#f9fafb" }}
			showsVerticalScrollIndicator={false}>
			<Box style={{ padding: 20, paddingBottom: 40 }}>
				<VStack space='2xl'>
					{/* Header */}
					<VStack space='md'>
						<Heading
							size='2xl'
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Vérification d'identité
						</Heading>
						<Text
							size='md'
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
							Téléchargez un document d'identité valide pour
							vérifier votre compte
						</Text>
					</VStack>

					{/* Nationalité */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.05,
							shadowRadius: 8,
							elevation: 2,
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Globe}
									size='md'
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
									}}
								/>
								<Text
									size='md'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Nationalité
								</Text>
							</HStack>

							{selectedNationality ? (
								<HStack
									space='sm'
									style={{
										alignItems: "center",
										padding: 12,
										backgroundColor: isDark
											? "#1f2937"
											: "#f0fdf4",
										borderRadius: 8,
										borderWidth: 1,
										borderColor: isDark
											? "#10b981"
											: "#bbf7d0",
									}}>
									<Text style={{ fontSize: 22 }}>
										{selectedNationality.flag}
									</Text>
									<Text
										style={{
											flex: 1,
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{selectedNationality.name}
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											marginRight: 8,
										}}>
										{selectedNationality.code}
									</Text>
									<TouchableOpacity
										onPress={() => {
											setSelectedNationality(null);
											setNationalityQuery("");
										}}>
										<Icon
											as={X}
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</TouchableOpacity>
								</HStack>
							) : (
								<Input
									variant='outline'
									size='md'
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#ffffff",
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<InputField
										placeholder='Tapez 3 lettres pour rechercher...'
										value={nationalityQuery}
										onChangeText={handleNationalityChange}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							)}

							{loadingNationalities && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textAlign: "center",
									}}>
									Recherche en cours...
								</Text>
							)}

							{nationalitySuggestions.length > 0 && (
								<VStack
									style={{
										borderRadius: 8,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
										overflow: "hidden",
									}}>
									{nationalitySuggestions.map(
										(country, i) => (
											<TouchableOpacity
												key={country.code}
												onPress={() =>
													handleSelectNationality(
														country,
													)
												}
												activeOpacity={0.7}>
												<HStack
													space='sm'
													style={{
														padding: 12,
														alignItems: "center",
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderBottomWidth:
															i <
															nationalitySuggestions.length -
																1
																? 1
																: 0,
														borderBottomColor:
															isDark
																? "#374151"
																: "#f3f4f6",
													}}>
													<Text
														style={{
															fontSize: 20,
															width: 32,
														}}>
														{country.flag}
													</Text>
													<Text
														style={{
															flex: 1,
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														{country.name}
													</Text>
													<Text
														size='xs'
														style={{
															color: isDark
																? "#6b7280"
																: "#9ca3af",
															fontWeight: "600",
														}}>
														{country.code}
													</Text>
												</HStack>
											</TouchableOpacity>
										),
									)}
								</VStack>
							)}

							{nationalityQuery.length >= 3 &&
								nationalitySuggestions.length === 0 &&
								!loadingNationalities &&
								!selectedNationality && (
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											textAlign: "center",
										}}>
										Aucun pays trouvé
									</Text>
								)}
						</VStack>
					</Card>

					{/* Status Card */}
					{documentUploadedStatus && (
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.05,
								shadowRadius: 8,
								elevation: 2,
							}}>
							<VStack space='md'>
								<HStack
									style={{
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<Text
										size='lg'
										style={{ fontWeight: "600" }}>
										Document actuel
									</Text>
									{getStatusBadge()}
								</HStack>

								<Divider />

								<VStack space='sm'>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={
												documentUploadedType ===
												"passport"
													? CreditCard
													: IdCard
											}
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
										<Text
											style={{
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}>
											{documentUploadedType === "passport"
												? "Passeport"
												: documentUploadedType ===
													  "residence_permit"
													? "Titre de séjour"
													: "Carte d'identité nationale"}
										</Text>
									</HStack>

									{documentUploadedValidityDate && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Calendar}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												Valide jusqu'au{" "}
												{new Date(
													documentUploadedValidityDate,
												).toLocaleDateString("fr-FR")}
											</Text>
										</HStack>
									)}
								</VStack>
							</VStack>
						</Card>
					)}

					{/* Document Type Selection */}
					{documentUploadedStatus !== "verified" && !documentType && (
						<VStack space='lg'>
							<Text
								size='lg'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Choisissez votre type de document
							</Text>

							<TouchableOpacity
								onPress={() => setDocumentType("passport")}
								activeOpacity={0.7}>
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 2,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<HStack
										space='md'
										style={{ alignItems: "center" }}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#dbeafe",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={CreditCard}
												size='xl'
												style={{ color: "#2563eb" }}
											/>
										</Box>
										<VStack style={{ flex: 1 }} space='xs'>
											<Text
												size='lg'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Passeport
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Une seule photo requise
											</Text>
										</VStack>
									</HStack>
								</Card>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => setDocumentType("national_id")}
								activeOpacity={0.7}>
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 2,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<HStack
										space='md'
										style={{ alignItems: "center" }}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#dcfce7",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={IdCard}
												size='xl'
												style={{ color: "#16a34a" }}
											/>
										</Box>
										<VStack style={{ flex: 1 }} space='xs'>
											<Text
												size='lg'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Carte d'identité nationale
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Recto et verso requis
											</Text>
										</VStack>
									</HStack>
								</Card>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() =>
									setDocumentType("residence_permit")
								}
								activeOpacity={0.7}>
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 2,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<HStack
										space='md'
										style={{ alignItems: "center" }}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#fef3c7",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={IdCard}
												size='xl'
												style={{ color: "#d97706" }}
											/>
										</Box>
										<VStack style={{ flex: 1 }} space='xs'>
											<Text
												size='lg'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Titre de séjour
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Recto et verso requis
											</Text>
										</VStack>
									</HStack>
								</Card>
							</TouchableOpacity>
						</VStack>
					)}

					{documentType && (
						<VStack space='xl'>
							{/* Document Type Header */}
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1e40af"
										: "#eff6ff",
									borderRadius: 12,
								}}>
								<HStack
									style={{
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={
												documentType === "passport"
													? CreditCard
													: IdCard
											}
											size='lg'
											style={{
												color: isDark
													? "#dbeafe"
													: "#2563eb",
											}}
										/>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#dbeafe"
													: "#1e40af",
											}}>
											{documentType === "passport"
												? "Passeport"
												: documentType ===
													  "residence_permit"
													? "Titre de séjour"
													: "Carte d'identité"}
										</Text>
									</HStack>
									<Button
										variant='outline'
										size='sm'
										onPress={() => setDocumentType(null)}>
										<ButtonIcon as={X} />
										<ButtonText>Changer</ButtonText>
									</Button>
								</HStack>
							</Card>

							{/* Upload Blocks */}
							<VStack space='md'>
								<UploadBlock
									label={
										documentType === "passport"
											? "Photo du document"
											: "Recto de la carte"
									}
									image={frontImage}
									onPick={() => pickImage("front")}
									onCamera={() =>
										navigation.navigate("CameraScreen", {
											side: "front",
											onCapture: setFrontImage,
										})
									}
									onRemove={() => setFrontImage(null)}
									isDark={isDark}
								/>
								{(documentType === "national_id" ||
									documentType === "residence_permit") && (
									<UploadBlock
										label='Verso de la carte'
										image={backImage}
										onPick={() => pickImage("back")}
										onCamera={() =>
											navigation.navigate(
												"CameraScreen",
												{
													side: "back",
													onCapture: setBackImage,
												},
											)
										}
										onRemove={() => setBackImage(null)}
										isDark={isDark}
									/>
								)}
							</VStack>

							{/* Date Picker */}
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
								}}>
								<VStack space='md'>
									<Text
										size='md'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Date d'expiration
									</Text>
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() =>
											setDatePickerVisibility(true)
										}>
										<Box
											style={{
												borderWidth: 1,
												borderColor: isDark
													? "#4b5563"
													: "#d1d5db",
												borderRadius: 8,
												backgroundColor: isDark
													? "#1f2937"
													: "#f9fafb",
												paddingHorizontal: 16,
												paddingVertical: 12,
												flexDirection: "row",
												alignItems: "center",
											}}>
											<Icon
												as={Calendar}
												size='md'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													marginRight: 12,
												}}
											/>
											<Text
												style={{
													color: date
														? isDark
															? "#f3f4f6"
															: "#111827"
														: isDark
															? "#6b7280"
															: "#9ca3af",
													fontSize: 16,
												}}>
												{date
													? new Date(
															date,
														).toLocaleDateString(
															"fr-FR",
														)
													: "Sélectionner une date"}
											</Text>
										</Box>
									</TouchableOpacity>
									<DateTimePickerModal
										isVisible={isDatePickerVisible}
										mode='date'
										onConfirm={handleConfirmDate}
										onCancel={() =>
											setDatePickerVisibility(false)
										}
										minimumDate={new Date()}
									/>
								</VStack>
							</Card>

							{/* Submit Button */}
							<Button
								size='lg'
								isDisabled={!canSubmit || !date || isSubmitting}
								onPress={handleSubmitDocuments}
								style={{
									borderRadius: 12,
									backgroundColor:
										canSubmit && date && !isSubmitting
											? "#2563eb"
											: "#d1d5db",
								}}>
								<ButtonIcon as={Upload} />
								<ButtonText
									style={{ fontSize: 16, fontWeight: "600" }}>
									{isSubmitting
										? "Envoi en cours..."
										: "Soumettre les documents"}
								</ButtonText>
							</Button>

							{(!canSubmit || !date) && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textAlign: "center",
									}}>
									{!date
										? "Veuillez sélectionner une date d'expiration"
										: documentType === "passport"
											? "Veuillez ajouter une photo du passeport"
											: "Veuillez ajouter le recto et le verso"}
								</Text>
							)}
						</VStack>
					)}
				</VStack>
			</Box>
		</ScrollView>
	);
}

/* ------------------ */
/* Upload block       */
/* ------------------ */

function UploadBlock({ label, image, onPick, onCamera, onRemove, isDark }) {
	return (
		<Card
			style={{
				padding: 20,
				backgroundColor: isDark ? "#374151" : "#ffffff",
				borderRadius: 12,
				borderWidth: 2,
				borderColor: image ? "#10b981" : isDark ? "#4b5563" : "#e5e7eb",
				borderStyle: image ? "solid" : "dashed",
			}}>
			<VStack space='md'>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
					}}>
					<Text
						size='md'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						{label}
					</Text>
					{image && (
						<TouchableOpacity onPress={onRemove}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: "#fee2e2",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={X}
									size='sm'
									style={{ color: "#dc2626" }}
								/>
							</Box>
						</TouchableOpacity>
					)}
				</HStack>

				{image ? (
					<Box
						style={{
							borderRadius: 8,
							overflow: "hidden",
							backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
						}}>
						<Image
							source={{ uri: image.uri }}
							alt={label}
							style={{
								width: "100%",
								height: 200,
								borderRadius: 8,
							}}
							resizeMode='cover'
						/>
					</Box>
				) : (
					<Box
						style={{
							height: 140,
							borderRadius: 8,
							backgroundColor: isDark ? "#1f2937" : "#f9fafb",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Icon
							as={ImageIcon}
							size='xl'
							style={{ color: isDark ? "#6b7280" : "#d1d5db" }}
						/>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
								marginTop: 8,
							}}>
							Aucun fichier sélectionné
						</Text>
					</Box>
				)}

				<HStack space='sm'>
					<Button
						variant='outline'
						style={{ flex: 1, borderRadius: 8 }}
						onPress={onPick}>
						<ButtonIcon as={ImageIcon} />
						<ButtonText>Galerie</ButtonText>
					</Button>
					<Button
						style={{
							flex: 1,
							borderRadius: 8,
							backgroundColor: "#2563eb",
						}}
						onPress={onCamera}>
						<ButtonIcon as={Camera} />
						<ButtonText>Caméra</ButtonText>
					</Button>
				</HStack>
			</VStack>
		</Card>
	);
}
