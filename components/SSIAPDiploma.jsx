import React, { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
import { Divider } from "@/components/ui/divider";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
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
	Calendar,
	Image as ImageIcon,
	Upload,
	Camera,
	FileText,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "ssiap-diplomas";

export default function SSIAPDiploma({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	// État pour chaque diplôme SSIAP
	const [ssiap1, setSsiap1] = useState({
		image: null,
		date: "",
		url: null,
		status: null,
	});
	const [ssiap2, setSsiap2] = useState({
		image: null,
		date: "",
		url: null,
		status: null,
	});
	const [ssiap3, setSsiap3] = useState({
		image: null,
		date: "",
		url: null,
		status: null,
	});

	const [uploadedStatus, setUploadedStatus] = useState(null);

	// Valeurs initiales pour détecter les modifications
	const [initialSsiap1, setInitialSsiap1] = useState({ date: "", url: null });
	const [initialSsiap2, setInitialSsiap2] = useState({ date: "", url: null });
	const [initialSsiap3, setInitialSsiap3] = useState({ date: "", url: null });

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		// Charger les données existantes si disponibles
		setUploadedStatus(userProfile?.ssiap_verification_status || null);

		// Charger SSIAP1
		if (userProfile?.ssiap1_document_url || userProfile?.ssiap1_date) {
			const ssiap1Data = {
				image: userProfile.ssiap1_document_url
					? { uri: userProfile.ssiap1_document_url }
					: null,
				date: userProfile.ssiap1_date || "",
				url: userProfile.ssiap1_document_url || null,
				status: userProfile.ssiap1_verification_status || null,
			};
			setSsiap1(ssiap1Data);
			setInitialSsiap1({ date: ssiap1Data.date, url: ssiap1Data.url });
		}

		// Charger SSIAP2
		if (userProfile?.ssiap2_document_url || userProfile?.ssiap2_date) {
			const ssiap2Data = {
				image: userProfile.ssiap2_document_url
					? { uri: userProfile.ssiap2_document_url }
					: null,
				date: userProfile.ssiap2_date || "",
				url: userProfile.ssiap2_document_url || null,
				status: userProfile.ssiap2_verification_status || null,
			};
			setSsiap2(ssiap2Data);
			setInitialSsiap2({ date: ssiap2Data.date, url: ssiap2Data.url });
		}

		// Charger SSIAP3
		if (userProfile?.ssiap3_document_url || userProfile?.ssiap3_date) {
			const ssiap3Data = {
				image: userProfile.ssiap3_document_url
					? { uri: userProfile.ssiap3_document_url }
					: null,
				date: userProfile.ssiap3_date || "",
				url: userProfile.ssiap3_document_url || null,
				status: userProfile.ssiap3_verification_status || null,
			};
			setSsiap3(ssiap3Data);
			setInitialSsiap3({ date: ssiap3Data.date, url: ssiap3Data.url });
		}
	}, [userProfile]);

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const pickImage = async (diplomaType) => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			const image = result.assets[0];
			if (diplomaType === "ssiap1") {
				setSsiap1({ ...ssiap1, image });
			} else if (diplomaType === "ssiap2") {
				setSsiap2({ ...ssiap2, image });
			} else if (diplomaType === "ssiap3") {
				setSsiap3({ ...ssiap3, image });
			}
		}
	};

	const pickDocument = async (diplomaType) => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*", "application/pdf"],
				copyToCacheDirectory: true,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const file = result.assets[0];
				const document = {
					uri: file.uri,
					name: file.name,
					type: file.mimeType,
				};

				if (diplomaType === "ssiap1") {
					setSsiap1({ ...ssiap1, image: document });
				} else if (diplomaType === "ssiap2") {
					setSsiap2({ ...ssiap2, image: document });
				} else if (diplomaType === "ssiap3") {
					setSsiap3({ ...ssiap3, image: document });
				}
			}
		} catch (error) {
			console.error("Error picking document:", error);
		}
	};

	/* ------------------ */
	/* Upload logic       */
	/* ------------------ */

	const uploadDocument = async (documentImage, diplomaType) => {
		if (!documentImage?.uri) throw new Error("No image");

		const originalName = documentImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";

		const storageFilename = `${user.id}/ssiap_${diplomaType}_${Date.now()}.${extension}`;

		const formData = new FormData();
		formData.append("files", {
			uri: documentImage.uri,
			name: storageFilename,
			type: `image/${extension}`,
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
	/* Submit individuels */
	/* ------------------ */

	const handleSubmitSsiap1 = async () => {
		try {
			const uploadData = {};
			if (ssiap1.image && !ssiap1.url) {
				const url = await uploadDocument(ssiap1.image, "ssiap1");
				uploadData.ssiap1_document_url = url;
				uploadData.ssiap1_verification_status = "pending";
			}
			if (ssiap1.date) {
				uploadData.ssiap1_date = ssiap1.date;
			}
			if (Object.keys(uploadData).length > 0) {
				await update("profiles", user.id, uploadData);
				await loadUserData(user.id, accessToken);
				toast.show({
					placement: "top",
					duration: 4000,
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<Icon as={CheckCircle} />
							<VStack>
								<ToastTitle>
									Diplôme SSIAP 1 enregistré
								</ToastTitle>
								<ToastDescription>
									Votre diplôme a été enregistré avec succès
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			}
		} catch (error) {
			console.error("Submit SSIAP1 error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Une erreur est survenue lors de l'enregistrement
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		}
	};

	const handleSubmitSsiap2 = async () => {
		try {
			const uploadData = {};
			if (ssiap2.image && !ssiap2.url) {
				const url = await uploadDocument(ssiap2.image, "ssiap2");
				uploadData.ssiap2_document_url = url;
				uploadData.ssiap2_verification_status = "pending";
			}
			if (ssiap2.date) {
				uploadData.ssiap2_date = ssiap2.date;
			}
			if (Object.keys(uploadData).length > 0) {
				await update("profiles", user.id, uploadData);
				await loadUserData(user.id, accessToken);
				toast.show({
					placement: "top",
					duration: 4000,
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<Icon as={CheckCircle} />
							<VStack>
								<ToastTitle>
									Diplôme SSIAP 2 enregistré
								</ToastTitle>
								<ToastDescription>
									Votre diplôme a été enregistré avec succès
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			}
		} catch (error) {
			console.error("Submit SSIAP2 error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Une erreur est survenue lors de l'enregistrement
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		}
	};

	const handleSubmitSsiap3 = async () => {
		try {
			const uploadData = {};
			if (ssiap3.image && !ssiap3.url) {
				const url = await uploadDocument(ssiap3.image, "ssiap3");
				uploadData.ssiap3_document_url = url;
				uploadData.ssiap3_verification_status = "pending";
			}
			if (ssiap3.date) {
				uploadData.ssiap3_date = ssiap3.date;
			}
			if (Object.keys(uploadData).length > 0) {
				await update("profiles", user.id, uploadData);
				await loadUserData(user.id, accessToken);
				toast.show({
					placement: "top",
					duration: 4000,
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<Icon as={CheckCircle} />
							<VStack>
								<ToastTitle>
									Diplôme SSIAP 3 enregistré
								</ToastTitle>
								<ToastDescription>
									Votre diplôme a été enregistré avec succès
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			}
		} catch (error) {
			console.error("Submit SSIAP3 error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Une erreur est survenue lors de l'enregistrement
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		}
	};

	/* ------------------ */
	/* Détection changements */
	/* ------------------ */

	const hasSsiap1Changed = () => {
		const hasNewImage = ssiap1.image && !ssiap1.url;
		const hasDateChanged = ssiap1.date !== initialSsiap1.date;
		return hasNewImage || hasDateChanged;
	};

	const hasSsiap2Changed = () => {
		const hasNewImage = ssiap2.image && !ssiap2.url;
		const hasDateChanged = ssiap2.date !== initialSsiap2.date;
		return hasNewImage || hasDateChanged;
	};

	const hasSsiap3Changed = () => {
		const hasNewImage = ssiap3.image && !ssiap3.url;
		const hasDateChanged = ssiap3.date !== initialSsiap3.date;
		return hasNewImage || hasDateChanged;
	};

	/* ------------------ */
	/* UI                 */
	/* ------------------ */

	const hasAnyDiploma = ssiap1.image || ssiap2.image || ssiap3.image;

	return (
		<VStack space='2xl'>
			{/* SSIAP 1 */}
			<DiplomaUploadBlock
				title='SSIAP 1'
				diploma={ssiap1}
				onUpdateDate={(date) => setSsiap1({ ...ssiap1, date })}
				onPickImage={() => pickImage("ssiap1")}
				onPickDocument={() => pickDocument("ssiap1")}
				onCamera={() =>
					navigation.navigate("CameraScreen", {
						onCapture: (image) => setSsiap1({ ...ssiap1, image }),
					})
				}
				onSubmit={handleSubmitSsiap1}
				isDisabled={!hasSsiap1Changed()}
				isDark={isDark}
			/>

			{/* SSIAP 2 */}
			<DiplomaUploadBlock
				title='SSIAP 2'
				diploma={ssiap2}
				onUpdateDate={(date) => setSsiap2({ ...ssiap2, date })}
				onPickImage={() => pickImage("ssiap2")}
				onPickDocument={() => pickDocument("ssiap2")}
				onCamera={() =>
					navigation.navigate("CameraScreen", {
						onCapture: (image) => setSsiap2({ ...ssiap2, image }),
					})
				}
				onSubmit={handleSubmitSsiap2}
				isDisabled={!hasSsiap2Changed()}
				isDark={isDark}
			/>

			{/* SSIAP 3 */}
			<DiplomaUploadBlock
				title='SSIAP 3'
				diploma={ssiap3}
				onUpdateDate={(date) => setSsiap3({ ...ssiap3, date })}
				onPickImage={() => pickImage("ssiap3")}
				onPickDocument={() => pickDocument("ssiap3")}
				onCamera={() =>
					navigation.navigate("CameraScreen", {
						onCapture: (image) => setSsiap3({ ...ssiap3, image }),
					})
				}
				onSubmit={handleSubmitSsiap3}
				isDisabled={!hasSsiap3Changed()}
				isDark={isDark}
			/>
		</VStack>
	);
}

/* ------------------ */
/* Diploma Upload Block */
/* ------------------ */

function DiplomaUploadBlock({
	title,
	diploma,
	onUpdateDate,
	onPickImage,
	onPickDocument,
	onCamera,
	onSubmit,
	isDisabled,
	isDark,
}) {
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	useEffect(() => {
		console.log(`Diploma ${title} updated:`, diploma);
	}, [diploma, title]);

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
	};

	const handleConfirm = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const formattedDate = `${year}-${month}-${day}`;
		onUpdateDate(formattedDate);
		hideDatePicker();
	};

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

		const config = statusConfig[diploma.status] || null;
		if (!config) return null;

		return (
			<Badge size='sm' variant='solid' action={config.action}>
				<BadgeIcon as={config.icon} className='mr-2' />
				<BadgeText>{config.label}</BadgeText>
			</Badge>
		);
	};

	return (
		<Card
			style={{
				padding: 20,
				backgroundColor: isDark ? "#374151" : "#ffffff",
				borderRadius: 12,
				borderWidth: 1,
				borderColor: isDark ? "#4b5563" : "#e5e7eb",
			}}>
			<VStack space='lg'>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
					}}>
					<Text
						size='lg'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						{title}
					</Text>
					{diploma.status && getStatusBadge()}
				</HStack>

				{diploma.status === "verified" ? (
					/* Mode lecture seule pour diplôme vérifié */
					<VStack space='md'>
						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>
						{diploma.date && (
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
										Date d'obtention
									</Text>
								</HStack>
								<Text
									size='md'
									style={{
										color: isDark ? "#d1d5db" : "#374151",
										marginLeft: 28,
									}}>
									{new Date(diploma.date).toLocaleDateString(
										"fr-FR",
									)}
								</Text>
							</VStack>
						)}
						{(diploma.image || diploma.url) && (
							<VStack space='xs'>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
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
										padding: 16,
										borderWidth: 1,
										borderRadius: 8,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										marginTop: 8,
									}}>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={FileText}
											size='lg'
											style={{
												color: "#2563eb",
											}}
										/>
										<VStack style={{ flex: 1 }}>
											<Text
												size='sm'
												style={{
													fontWeight: "500",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{diploma.image?.name ||
													diploma.url
														?.split("/")
														.pop() ||
													"document.pdf"}
											</Text>
											<Text
												size='xs'
												style={{
													color: "#10b981",
													marginTop: 4,
												}}>
												Fichier vérifié
											</Text>
										</VStack>
									</HStack>
								</Box>
							</VStack>
						)}
					</VStack>
				) : (
					/* Mode édition pour diplômes non vérifiés */
					<>
						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Date d'obtention */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Date d'obtention
							</Text>
							<Pressable onPress={showDatePicker}>
								<Input
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
										pointerEvents: "none",
									}}>
									<InputSlot style={{ paddingLeft: 12 }}>
										<InputIcon
											as={Calendar}
											size={20}
											color={
												isDark ? "#9ca3af" : "#6b7280"
											}
										/>
									</InputSlot>
									<InputField
										placeholder='Sélectionner une date'
										value={
											diploma.date
												? new Date(
														diploma.date,
													).toLocaleDateString(
														"fr-FR",
													)
												: ""
										}
										editable={false}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</Pressable>
							<DateTimePickerModal
								isVisible={isDatePickerVisible}
								mode='date'
								onConfirm={handleConfirm}
								onCancel={hideDatePicker}
								locale='fr_FR'
								maximumDate={new Date()}
								cancelTextIOS='Annuler'
								confirmTextIOS='Confirmer'
							/>
						</VStack>

						{/* Document */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Document
							</Text>
							{diploma.image || diploma.url ? (
								<Box
									style={{
										padding: 16,
										borderWidth: 1,
										borderRadius: 8,
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
									}}>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={FileText}
											size='lg'
											style={{
												color: isDark
													? "#60a5fa"
													: "#2563eb",
											}}
										/>
										<VStack style={{ flex: 1 }}>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
												numberOfLines={1}>
												{diploma.image?.name ||
													diploma.url
														?.split("/")
														.pop() ||
													"document.pdf"}
											</Text>
											<Text
												size='xs'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Fichier sélectionné
											</Text>
										</VStack>
									</HStack>
								</Box>
							) : (
								<Box
									style={{
										padding: 20,
										borderWidth: 2,
										borderRadius: 8,
										borderStyle: "dashed",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
										alignItems: "center",
										justifyContent: "center",
										minHeight: 100,
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
									}}>
									<Icon
										as={FileText}
										size='xl'
										style={{
											color: isDark
												? "#6b7280"
												: "#9ca3af",
											marginBottom: 8,
										}}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Aucun document sélectionné
									</Text>
								</Box>
							)}
						</VStack>

						<VStack space='sm'>
							<HStack space='sm'>
								<Button
									variant='outline'
									style={{
										flex: 1,
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}
									onPress={onPickImage}>
									<ButtonIcon as={Upload} />
									<ButtonText
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Galerie
									</ButtonText>
								</Button>
								{onCamera && (
									<Button
										variant='outline'
										style={{
											flex: 1,
											borderColor: isDark
												? "#4b5563"
												: "#d1d5db",
										}}
										onPress={onCamera}>
										<ButtonIcon as={Camera} />
										<ButtonText
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Photo
										</ButtonText>
									</Button>
								)}
							</HStack>
							<Button
								variant='outline'
								style={{
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}
								onPress={onPickDocument}>
								<ButtonIcon as={FileText} />
								<ButtonText
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Fichiers
								</ButtonText>
							</Button>
						</VStack>

						{/* Bouton Enregistrer */}
						<Button
							isDisabled={isDisabled}
							onPress={onSubmit}
							style={{
								backgroundColor: isDisabled
									? isDark
										? "#374151"
										: "#d1d5db"
									: "#2563eb",
							}}>
							<ButtonIcon as={CheckCircle} />
							<ButtonText
								style={{
									color: isDisabled
										? isDark
											? "#6b7280"
											: "#9ca3af"
										: "#ffffff",
								}}>
								Enregistrer
							</ButtonText>
						</Button>
					</>
				)}
			</VStack>
		</Card>
	);
}
