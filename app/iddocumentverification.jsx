import React, { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";

import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "identity-documents";

export default function DocumentVerification({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();

	const [documentType, setDocumentType] = useState(null);
	const [frontImage, setFrontImage] = useState(null);
	const [backImage, setBackImage] = useState(null);

	const [documentUploadedType, setDocumentUploadedType] = useState(null);
	const [documentUploadedStatus, setDocumentUploadedStatus] = useState(null);
	const [documentUploadedValidityDate, setDocumentUploadedValidityDate] =
		useState(null);

	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [date, setDate] = useState(null);

	useFocusEffect(
		useCallback(() => {
			console.log("Document Verification Screen focused");
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		console.log("User profile updated:", userProfile);
		setDocumentUploadedType(userProfile?.id_type || null);
		setDocumentUploadedStatus(userProfile?.verification_status || null);
		setDocumentUploadedValidityDate(userProfile?.id_validity_date || null);
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
					verification_status: "pending",
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
					verification_status: "pending",
				});
			}

			console.log("Documents submitted");
		} catch (error) {
			console.error("Submit documents error:", error);
		}
	};

	/* ------------------ */
	/* UI                 */
	/* ------------------ */

	return (
		<Box flex={1} bg='$backgroundLight0' style={{ padding: 15 }}>
			<VStack space='xl'>
				<VStack space='xs'>
					<Text size='xl' fontWeight='$bold'>
						ID Document verification
					</Text>
					<Text color='$textLight500'>
						Upload a valid identity document
					</Text>
					{documentUploadedStatus && (
						<VStack>
							<Text>
								You have already uploaded a{" "}
								{documentUploadedType}.
							</Text>
							<HStack>
								<Badge
									size='lg'
									variant='solid'
									action={
										documentUploadedStatus === "verified"
											? "success"
											: documentUploadedStatus ===
												  "pending"
												? "warning"
												: "info"
									}>
									<BadgeText>
										{documentUploadedStatus || "pending"}
									</BadgeText>
									<BadgeIcon
										as={GlobeIcon}
										className='ml-2'
									/>
								</Badge>
							</HStack>
							<Text>{documentUploadedValidityDate}</Text>
						</VStack>
					)}
				</VStack>

				{!documentType && (
					<VStack space='md'>
						<Text fontWeight='$medium'>Choose your document</Text>

						<Pressable onPress={() => setDocumentType("passport")}>
							<Box p='$4' borderWidth={1} borderRadius='$lg'>
								<Text fontWeight='$medium'>Passport</Text>
								<Text size='sm' color='$textLight500'>
									Single page upload
								</Text>
							</Box>
						</Pressable>

						<Pressable
							onPress={() => setDocumentType("national_id")}>
							<Box p='$4' borderWidth={1} borderRadius='$lg'>
								<Text fontWeight='$medium'>
									National ID card
								</Text>
								<Text size='sm' color='$textLight500'>
									Front and back required
								</Text>
							</Box>
						</Pressable>
					</VStack>
				)}

				{documentType && (
					<VStack space='lg'>
						<UploadBlock
							label={
								documentType === "passport"
									? "Document photo"
									: "Front side"
							}
							image={frontImage}
							onPick={() => pickImage("front")}
							onCamera={() =>
								navigation.navigate("CameraScreen", {
									side: "front",
									onCapture: setFrontImage,
								})
							}
						/>

						{documentType === "national_id" && (
							<UploadBlock
								label='Back side'
								image={backImage}
								onPick={() => pickImage("back")}
								onCamera={() =>
									navigation.navigate("CameraScreen", {
										side: "back",
										onCapture: setBackImage,
									})
								}
							/>
						)}
						<VStack>
							<Pressable
								onPress={() => setDatePickerVisibility(true)}>
								<Text style={{ fontSize: 16 }}>
									{date || "Sélectionner une date"}
								</Text>
							</Pressable>
							<DateTimePickerModal
								isVisible={isDatePickerVisible}
								mode='date'
								onConfirm={handleConfirmDate}
								onCancel={() => setDatePickerVisibility(false)}
								minimumDate={new Date()}
							/>
						</VStack>

						<Button
							isDisabled={!canSubmit}
							onPress={handleSubmitDocuments}>
							<ButtonText>Submit documents</ButtonText>
						</Button>
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

/* ------------------ */
/* Upload block       */
/* ------------------ */

function UploadBlock({ label, image, onPick, onCamera }) {
	return (
		<Box p='$4' borderWidth={1} borderRadius='$lg' borderStyle='dashed'>
			<VStack space='md'>
				<Text fontWeight='$medium'>{label}</Text>

				{image ? (
					<Image
						source={{ uri: image.uri }}
						alt={label}
						width='100%'
						height={160}
						borderRadius='$md'
					/>
				) : (
					<Text size='sm' color='$textLight500'>
						No file selected
					</Text>
				)}

				<HStack space='sm'>
					<Button variant='outline' flex={1} onPress={onPick}>
						<ButtonText>Gallery</ButtonText>
					</Button>
					<Button flex={1} onPress={onCamera}>
						<ButtonText>Camera</ButtonText>
					</Button>
				</HStack>
			</VStack>
		</Box>
	);
}
