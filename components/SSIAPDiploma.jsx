import React, { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "ssiap-diplomas";

export default function SSIAPDiploma({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
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
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<VStack space='xs'>
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
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<VStack space='xs'>
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
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<VStack space='xs'>
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
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<VStack space='xs'>
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
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='accent'>
							<VStack space='xs'>
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
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<VStack space='xs'>
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
		<Box flex={1} bg='$backgroundLight0' style={{ padding: 15 }}>
			<VStack space='xl'>
				<VStack space='xs'>
					<Text size='xl' fontWeight='$bold'>
						Diplômes SSIAP
					</Text>
					<Text color='$textLight500'>
						Téléchargez vos diplômes SSIAP 1, 2 et/ou 3 avec leurs
						dates d'obtention
					</Text>
					{uploadedStatus && (
						<Badge
							size='lg'
							variant='solid'
							action={
								uploadedStatus === "verified"
									? "success"
									: uploadedStatus === "pending"
										? "warning"
										: "info"
							}>
							<BadgeText>
								{uploadedStatus === "verified"
									? "Vérifié"
									: uploadedStatus === "pending"
										? "En attente"
										: "Non vérifié"}
							</BadgeText>
							<BadgeIcon as={GlobeIcon} className='ml-2' />
						</Badge>
					)}
				</VStack>

				{/* SSIAP 1 */}
				<DiplomaUploadBlock
					title='SSIAP 1'
					diploma={ssiap1}
					onUpdateDate={(date) => setSsiap1({ ...ssiap1, date })}
					onPickImage={() => pickImage("ssiap1")}
					onCamera={() =>
						navigation.navigate("CameraScreen", {
							onCapture: (image) =>
								setSsiap1({ ...ssiap1, image }),
						})
					}
					onSubmit={handleSubmitSsiap1}
					isDisabled={!hasSsiap1Changed()}
				/>

				{/* SSIAP 2 */}
				<DiplomaUploadBlock
					title='SSIAP 2'
					diploma={ssiap2}
					onUpdateDate={(date) => setSsiap2({ ...ssiap2, date })}
					onPickImage={() => pickImage("ssiap2")}
					onCamera={() =>
						navigation.navigate("CameraScreen", {
							onCapture: (image) =>
								setSsiap2({ ...ssiap2, image }),
						})
					}
					onSubmit={handleSubmitSsiap2}
					isDisabled={!hasSsiap2Changed()}
				/>

				{/* SSIAP 3 */}
				<DiplomaUploadBlock
					title='SSIAP 3'
					diploma={ssiap3}
					onUpdateDate={(date) => setSsiap3({ ...ssiap3, date })}
					onPickImage={() => pickImage("ssiap3")}
					onCamera={() =>
						navigation.navigate("CameraScreen", {
							onCapture: (image) =>
								setSsiap3({ ...ssiap3, image }),
						})
					}
					onSubmit={handleSubmitSsiap3}
					isDisabled={!hasSsiap3Changed()}
				/>
			</VStack>
		</Box>
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
	onCamera,
	onSubmit,
	isDisabled,
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

	return (
		<Box p='$4' borderWidth={1} borderRadius='$lg' bg='$backgroundLight50'>
			<VStack space='md'>
				<HStack justifyContent='space-between' alignItems='center'>
					<Text fontWeight='$bold' size='lg'>
						{title}
					</Text>
					{diploma.status && (
						<Badge
							size='sm'
							variant='solid'
							action={
								diploma.status === "verified"
									? "success"
									: diploma.status === "pending"
										? "warning"
										: "error"
							}>
							<BadgeText>
								{diploma.status === "verified"
									? "Vérifié"
									: diploma.status === "pending"
										? "En attente"
										: "Refusé"}
							</BadgeText>
						</Badge>
					)}
				</HStack>

				{diploma.status === "verified" ? (
					/* Mode lecture seule pour diplôme vérifié */
					<VStack space='md'>
						{diploma.date && (
							<VStack space='xs'>
								<Text fontWeight='$medium' size='sm'>
									Date d'obtention
								</Text>
								<Text size='md'>{diploma.date}</Text>
							</VStack>
						)}
						{(diploma.image || diploma.url) && (
							<VStack space='xs'>
								<Text fontWeight='$medium' size='sm'>
									Document
								</Text>
								<Image
									source={{
										uri: diploma.image?.uri || diploma.url,
									}}
									alt={title}
									width='100%'
									height={160}
									borderRadius='$md'
								/>
							</VStack>
						)}
					</VStack>
				) : (
					/* Mode édition pour diplômes non vérifiés */
					<>
						{/* Date d'obtention */}
						<VStack space='xs'>
							<Text fontWeight='$medium' size='sm'>
								Date d'obtention
							</Text>
							<Pressable onPress={showDatePicker}>
								<Input isReadOnly pointerEvents='none'>
									<InputField
										placeholder='Sélectionner une date'
										value={diploma.date}
										editable={false}
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
							/>
						</VStack>

						{/* Image du diplôme */}
						<VStack space='xs'>
							<Text fontWeight='$medium' size='sm'>
								Document
							</Text>
							{diploma.image || diploma.url ? (
								<Image
									source={{
										uri: diploma.image?.uri || diploma.url,
									}}
									alt={title}
									width='100%'
									height={160}
									borderRadius='$md'
								/>
							) : (
								<Box
									p='$4'
									borderWidth={1}
									borderRadius='$md'
									borderStyle='dashed'
									alignItems='center'
									justifyContent='center'
									minHeight={80}>
									<Text size='sm' color='$textLight500'>
										Aucun fichier sélectionné
									</Text>
								</Box>
							)}
						</VStack>

						<HStack space='sm'>
							<Button
								variant='outline'
								flex={1}
								onPress={onPickImage}>
								<ButtonText>Galerie</ButtonText>
							</Button>
							{onCamera && (
								<Button flex={1} onPress={onCamera}>
									<ButtonText>Appareil photo</ButtonText>
								</Button>
							)}
						</HStack>

						{/* Bouton Enregistrer */}
						<Button
							isDisabled={isDisabled}
							onPress={onSubmit}
							action='positive'>
							<ButtonText>Enregistrer</ButtonText>
						</Button>
					</>
				)}
			</VStack>
		</Box>
	);
}
