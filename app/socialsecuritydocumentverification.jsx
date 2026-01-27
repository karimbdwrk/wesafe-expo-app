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

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "social-security-documents";

export default function SocialSecurityDocumentVerification({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();

	const [documentType, setDocumentType] = useState(null);
	const [documentImage, setDocumentImage] = useState(null);

	const [uploadedType, setUploadedType] = useState(null);
	const [uploadedStatus, setUploadedStatus] = useState(null);

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		setUploadedType(userProfile?.social_security_doc_type || null);
		setUploadedStatus(
			userProfile?.social_security_verification_status || null,
		);
	}, [userProfile]);

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setDocumentImage(result.assets[0]);
		}
	};

	/* ------------------ */
	/* Upload logic       */
	/* ------------------ */

	const uploadDocument = async () => {
		if (!documentImage?.uri) throw new Error("No image");

		const originalName = documentImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";

		const storageFilename = `${user.id}/social_security_${documentType}_${Date.now()}.${extension}`;

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
	/* Submit             */
	/* ------------------ */

	const handleSubmit = async () => {
		try {
			const fileUrl = await uploadDocument();

			await update("profiles", user.id, {
				social_security_doc_type: documentType,
				social_security_document_url: fileUrl,
				social_security_verification_status: "pending",
			});

			loadUserData(user.id, accessToken);
			setDocumentType(null);
			setDocumentImage(null);
		} catch (error) {
			console.error("Submit error:", error);
		}
	};

	/* ------------------ */
	/* UI                 */
	/* ------------------ */

	return (
		<Box flex={1} bg='$backgroundLight0' p='$6'>
			<VStack space='xl'>
				<VStack space='xs'>
					<Text size='xl' fontWeight='$bold'>
						Social Security document
					</Text>
					<Text color='$textLight500'>
						Upload your Carte Vitale or Social Security certificate
					</Text>
					{uploadedStatus && (
						<VStack>
							<Text>
								You have already uploaded a {uploadedType}.
							</Text>
							<HStack>
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
										{uploadedStatus || "pending"}
									</BadgeText>
									<BadgeIcon
										as={GlobeIcon}
										className='ml-2'
									/>
								</Badge>
							</HStack>
						</VStack>
					)}
				</VStack>

				{!documentType && uploadedStatus !== "verified" && (
					<VStack space='md'>
						<Text fontWeight='$medium'>Choose a document</Text>

						<Pressable
							onPress={() => setDocumentType("carte_vitale")}>
							<Box p='$4' borderWidth={1} borderRadius='$lg'>
								<Text fontWeight='$medium'>Carte Vitale</Text>
								<Text size='sm' color='$textLight500'>
									French health insurance card
								</Text>
							</Box>
						</Pressable>

						<Pressable
							onPress={() =>
								setDocumentType("social_security_certificate")
							}>
							<Box p='$4' borderWidth={1} borderRadius='$lg'>
								<Text fontWeight='$medium'>
									Social Security certificate
								</Text>
								<Text size='sm' color='$textLight500'>
									Official attestation document
								</Text>
							</Box>
						</Pressable>
					</VStack>
				)}

				{documentType && (
					<VStack space='lg'>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
							}}>
							<Text>
								{documentType === "passport"
									? "Passeport"
									: "Carte d'identité"}
							</Text>
							<Button onPress={() => setDocumentType(null)}>
								<ButtonText>Changer</ButtonText>
							</Button>
						</HStack>
						<UploadBlock
							label='Document'
							image={documentImage}
							onPick={pickImage}
							onCamera={() =>
								navigation.navigate("CameraScreen", {
									onCapture: setDocumentImage,
								})
							}
						/>
						<Button
							isDisabled={!documentImage}
							onPress={handleSubmit}>
							<ButtonText>Submit document</ButtonText>
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
