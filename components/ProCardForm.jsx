import React, { useState, useEffect, useCallback } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
	Select,
	SelectTrigger,
	SelectInput,
	SelectIcon,
	SelectPortal,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectItem,
} from "@/components/ui/select";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import {
	ChevronDownIcon,
	CheckCircle,
	Clock,
	AlertCircle,
	Calendar,
	IdCard as IdCardIcon,
	Upload,
	Camera,
	FileText,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "professional-cards";

const CARD_CATEGORIES = [
	{ label: "APS - Agent de Prévention et de Sécurité", value: "APS" },
	{ label: "APR - Agent de Protection Rapprochée", value: "APR" },
	{ label: "Agent Cynophile", value: "Agent Cynophile" },
	{ label: "Transport de Fonds", value: "Transport de Fonds" },
	{ label: "Vidéoprotection", value: "Vidéoprotection" },
	{ label: "Télésurveillance", value: "Télésurveillance" },
	{ label: "Aéroportuaire", value: "Aéroportuaire" },
	{ label: "Formateur", value: "Formateur" },
];

const ProCardForm = ({ procards }) => {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { create, update, getAll } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	// États pour toutes les cartes existantes
	const [existingCards, setExistingCards] = useState([]);

	// États pour le formulaire d'ajout
	const [procardNum, setProcardNum] = useState("");
	const [date, setDate] = useState("");
	const [category, setCategory] = useState("");
	const [cardImage, setCardImage] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
			loadExistingCards();
		}, []),
	);

	const loadExistingCards = async () => {
		try {
			const { data } = await getAll(
				"procards",
				"*",
				`&profile_id=eq.${user.id}&isDeleted=eq.false`,
				1,
				100,
				"created_at.desc",
			);
			setExistingCards(data || []);
		} catch (error) {
			console.error("Error loading existing cards:", error);
		}
	};

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
	};

	const handleConfirmDate = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		setDate(simpleDate);
		hideDatePicker();
	};

	// Vérifier si une catégorie est déjà utilisée avec une carte valide
	const isCategoryDisabled = (categoryValue) => {
		const existingCard = existingCards.find(
			(card) => card.category === categoryValue,
		);

		if (existingCard) {
			const validityDate = new Date(existingCard.validity_date);
			const currentDate = new Date();
			// Si la carte existe et est encore valide (date future), on désactive
			return validityDate > currentDate;
		}

		return false;
	};

	// Fonction pour obtenir le badge de statut
	const getStatusBadge = (card) => {
		const validityDate = new Date(card.validity_date);
		const currentDate = new Date();
		const isExpired = validityDate < currentDate;

		if (isExpired) {
			return (
				<Badge size='sm' variant='solid' action='error'>
					<BadgeIcon as={AlertCircle} className='mr-2' />
					<BadgeText>Expirée</BadgeText>
				</Badge>
			);
		}

		if (card.status === "verified") {
			return (
				<Badge size='sm' variant='solid' action='success'>
					<BadgeIcon as={CheckCircle} className='mr-2' />
					<BadgeText>Vérifiée</BadgeText>
				</Badge>
			);
		}

		if (card.status === "rejected") {
			return (
				<Badge size='sm' variant='solid' action='error'>
					<BadgeIcon as={AlertCircle} className='mr-2' />
					<BadgeText>Rejetée</BadgeText>
				</Badge>
			);
		}

		return (
			<Badge size='sm' variant='solid' action='warning'>
				<BadgeIcon as={Clock} className='mr-2' />
				<BadgeText>En attente</BadgeText>
			</Badge>
		);
	};

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Permission refusée</ToastTitle>
							<ToastDescription>
								Accès à la galerie requis
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setCardImage(result.assets[0]);
		}
	};

	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();

		if (status !== "granted") {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Permission refusée</ToastTitle>
							<ToastDescription>
								Accès à la caméra requis
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			quality: 0.8,
		});

		if (!result.canceled) {
			setCardImage(result.assets[0]);
		}
	};

	const pickDocument = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*", "application/pdf"],
				copyToCacheDirectory: true,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const document = result.assets[0];
				setCardImage({
					uri: document.uri,
					name: document.name,
					type: document.mimeType,
				});
			}
		} catch (error) {
			console.error("Document picker error:", error);
		}
	};

	/* ------------------ */
	/* Upload             */
	/* ------------------ */

	const uploadCardImage = async () => {
		if (!cardImage?.uri) return null;

		const formData = new FormData();

		const originalName = cardImage.name || cardImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";
		const mimeType = cardImage.type || `image/${extension}`;

		const storageFilename = `${user.id}/${category.replace(/\s+/g, "_")}_${Date.now()}.${extension}`;

		formData.append("files", {
			uri: cardImage.uri,
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

	const handleSubmit = async () => {
		if (!procardNum || !date || !category) {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='warning' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Champs manquants</ToastTitle>
							<ToastDescription>
								Veuillez remplir tous les champs
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			return;
		}

		setLoading(true);
		try {
			const cardData = {
				profile_id: user.id,
				procard_num: procardNum,
				validity_date: date,
				category,
				status: "pending",
			};

			// Upload de l'image si présente
			if (cardImage) {
				const imageUrl = await uploadCardImage();
				cardData.card_image_url = imageUrl;
			}

			await create("procards", cardData);

			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon as={CheckCircle} />
						<VStack>
							<ToastTitle>Carte ajoutée</ToastTitle>
							<ToastDescription>
								Votre carte professionnelle a été enregistrée
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});

			// Reset form
			setProcardNum("");
			setDate("");
			setCategory("");
			setCardImage(null);

			// Recharger les cartes
			await loadExistingCards();
			await loadUserData(user.id, accessToken);
		} catch (err) {
			console.error(
				"Error creating Procard:",
				err.response?.data || err.message,
			);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Une erreur est survenue
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<VStack space='2xl'>
			{/* Cartes existantes */}
			{existingCards.length > 0 && (
				<VStack space='lg'>
					<Text
						size='lg'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Mes cartes professionnelles
					</Text>

					{existingCards.map((card) => {
						const validityDate = new Date(card.validity_date);
						const isExpired = validityDate < new Date();

						return (
							<Card
								key={card.id}
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<VStack space='md'>
									{/* En-tête */}
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
										}}>
										<HStack
											space='sm'
											style={{
												alignItems: "center",
												flex: 1,
											}}>
											<Icon
												as={IdCardIcon}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#2563eb",
												}}
											/>
											<VStack style={{ flex: 1 }}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{card.category}
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													N° {card.procard_num}
												</Text>
											</VStack>
										</HStack>
										{getStatusBadge(card)}
									</HStack>

									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>

									{/* Date de validité */}
									<VStack space='xs'>
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
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Date de validité
											</Text>
										</HStack>
										<Text
											size='sm'
											style={{
												color: isExpired
													? "#ef4444"
													: isDark
														? "#d1d5db"
														: "#374151",
												marginLeft: 28,
											}}>
											{validityDate.toLocaleDateString(
												"fr-FR",
											)}
										</Text>
									</VStack>

									{/* Document si présent */}
									{card.card_image_url && (
										<VStack space='xs'>
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={FileText}
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}
												/>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Document
												</Text>
											</HStack>
											<Box
												style={{
													padding: 12,
													borderWidth: 1,
													borderRadius: 8,
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
													backgroundColor: isDark
														? "#1f2937"
														: "#f9fafb",
													// marginLeft: 28,
												}}>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Icon
														as={FileText}
														size='md'
														style={{
															color: "#2563eb",
														}}
													/>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														{card.card_image_url
															.split("/")
															.pop()}
													</Text>
												</HStack>
											</Box>
										</VStack>
									)}
								</VStack>
							</Card>
						);
					})}
				</VStack>
			)}

			{/* Formulaire d'ajout */}
			<VStack space='lg'>
				<Divider
					style={{
						backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
						marginVertical: 8,
					}}
				/>

				<Text
					size='lg'
					style={{
						fontWeight: "600",
						color: isDark ? "#f3f4f6" : "#111827",
					}}>
					Ajouter une carte professionnelle
				</Text>

				{/* Catégorie */}
				<VStack space='sm'>
					<Text
						size='sm'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Spécialité *
					</Text>
					<Select
						onValueChange={setCategory}
						selectedValue={category}>
						<SelectTrigger
							variant='outline'
							size='md'
							style={{
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
								borderColor: isDark ? "#4b5563" : "#d1d5db",
							}}>
							<SelectInput placeholder='Sélectionner une spécialité' />
							<SelectIcon className='mr-3' as={ChevronDownIcon} />
						</SelectTrigger>
						<SelectPortal>
							<SelectBackdrop />
							<SelectContent style={{ paddingBottom: 90 }}>
								<SelectDragIndicatorWrapper>
									<SelectDragIndicator />
								</SelectDragIndicatorWrapper>
								{CARD_CATEGORIES.map((cat) => (
									<SelectItem
										key={cat.value}
										label={cat.label}
										value={cat.value}
										isDisabled={isCategoryDisabled(
											cat.value,
										)}
										style={{
											opacity: isCategoryDisabled(
												cat.value,
											)
												? 0.3
												: 1,
										}}
									/>
								))}
							</SelectContent>
						</SelectPortal>
					</Select>
				</VStack>

				{/* Numéro de carte */}
				<VStack space='sm'>
					<Text
						size='sm'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Numéro de carte *
					</Text>
					<Input
						style={{
							backgroundColor: isDark ? "#1f2937" : "#f9fafb",
							borderColor: isDark ? "#4b5563" : "#d1d5db",
						}}>
						<InputField
							placeholder='7 derniers chiffres'
							value={procardNum}
							onChangeText={setProcardNum}
							keyboardType='numeric'
							maxLength={7}
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}
						/>
					</Input>
					<Text
						size='xs'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Les 7 derniers chiffres de votre carte professionnelle
					</Text>
				</VStack>

				{/* Date de validité */}
				<VStack space='sm'>
					<Text
						size='sm'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Date de fin de validité *
					</Text>
					<Pressable onPress={showDatePicker}>
						<Input
							style={{
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
								borderColor: isDark ? "#4b5563" : "#d1d5db",
								pointerEvents: "none",
							}}>
							<InputSlot style={{ paddingLeft: 12 }}>
								<InputIcon
									as={Calendar}
									size={20}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</InputSlot>
							<InputField
								placeholder='Sélectionner une date'
								value={
									date
										? new Date(date).toLocaleDateString(
												"fr-FR",
											)
										: ""
								}
								editable={false}
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}
							/>
						</Input>
					</Pressable>
					<DateTimePickerModal
						isVisible={isDatePickerVisible}
						mode='date'
						onConfirm={handleConfirmDate}
						onCancel={hideDatePicker}
						minimumDate={new Date()}
						locale='fr_FR'
					/>
				</VStack>

				{/* Document (optionnel) */}
				<VStack space='sm'>
					<Text
						size='sm'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Document (optionnel)
					</Text>

					{cardImage ? (
						<Box
							style={{
								padding: 16,
								borderWidth: 1,
								borderRadius: 8,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
							}}>
							<HStack
								space='sm'
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<HStack
									space='sm'
									style={{ alignItems: "center", flex: 1 }}>
									<Icon
										as={FileText}
										size='lg'
										style={{ color: "#2563eb" }}
									/>
									<VStack style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												fontWeight: "500",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
											numberOfLines={1}>
											{cardImage.name ||
												cardImage.uri.split("/").pop()}
										</Text>
										<Text
											size='xs'
											style={{
												color: "#10b981",
												marginTop: 4,
											}}>
											Prêt à envoyer
										</Text>
									</VStack>
								</HStack>
								<TouchableOpacity
									onPress={() => setCardImage(null)}>
									<Icon
										as={AlertCircle}
										size='sm'
										style={{ color: "#ef4444" }}
									/>
								</TouchableOpacity>
							</HStack>
						</Box>
					) : (
						<Box
							style={{
								padding: 16,
								borderWidth: 2,
								borderStyle: "dashed",
								borderRadius: 8,
								borderColor: isDark ? "#4b5563" : "#d1d5db",
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
								alignItems: "center",
							}}>
							<Icon
								as={FileText}
								size='xl'
								style={{
									color: isDark ? "#6b7280" : "#9ca3af",
									marginBottom: 8,
								}}
							/>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									textAlign: "center",
								}}>
								Aucun document sélectionné
							</Text>
						</Box>
					)}

					<HStack space='sm'>
						<Button
							variant='outline'
							size='sm'
							onPress={pickImage}
							style={{ flex: 1 }}>
							<ButtonIcon as={Upload} />
							<ButtonText>Galerie</ButtonText>
						</Button>
						<Button
							variant='outline'
							size='sm'
							onPress={takePhoto}
							style={{ flex: 1 }}>
							<ButtonIcon as={Camera} />
							<ButtonText>Photo</ButtonText>
						</Button>
					</HStack>
					<Button
						variant='outline'
						size='sm'
						onPress={pickDocument}
						style={{ width: "100%" }}>
						<ButtonIcon as={FileText} />
						<ButtonText>Fichiers</ButtonText>
					</Button>
				</VStack>

				{/* Bouton de soumission */}
				<Button
					onPress={handleSubmit}
					isDisabled={loading || !procardNum || !date || !category}
					size='lg'
					style={{
						backgroundColor:
							loading || !procardNum || !date || !category
								? isDark
									? "#374151"
									: "#d1d5db"
								: "#2563eb",
					}}>
					<ButtonIcon as={CheckCircle} />
					<ButtonText>
						{loading ? "Enregistrement..." : "Enregistrer la carte"}
					</ButtonText>
				</Button>
			</VStack>
		</VStack>
	);
};

export default ProCardForm;
