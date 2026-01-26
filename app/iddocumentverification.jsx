import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";

export default function DocumentVerification({ navigation }) {
	const [documentType, setDocumentType] = useState(null); // 'passport' | 'national_id'
	const [frontImage, setFrontImage] = useState(null);
	const [backImage, setBackImage] = useState(null);

	const pickImage = async (side) => {
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			if (side === "front") setFrontImage(result.assets[0]);
			if (side === "back") setBackImage(result.assets[0]);
		}
	};

	const canSubmit =
		documentType === "passport"
			? !!frontImage
			: !!frontImage && !!backImage;

	return (
		<Box flex={1} bg='$backgroundLight0' style={{ padding: 15 }}>
			<VStack space='xl' p='$6'>
				{/* Header */}
				<VStack space='xs'>
					<Text size='xl' fontWeight='$bold'>
						ID Document verification
					</Text>
					<Text color='$textLight500'>
						Upload a valid identity document
					</Text>
				</VStack>

				{/* Document type selection */}
				{!documentType && (
					<VStack space='md'>
						<Text fontWeight='$medium'>Choose your document</Text>

						<Pressable onPress={() => setDocumentType("passport")}>
							<Box
								p='$4'
								borderWidth={1}
								borderRadius='$lg'
								borderColor='$borderLight300'>
								<Text fontWeight='$medium'>Passport</Text>
								<Text size='sm' color='$textLight500'>
									Single page upload
								</Text>
							</Box>
						</Pressable>

						<Pressable
							onPress={() => setDocumentType("national_id")}>
							<Box
								p='$4'
								borderWidth={1}
								borderRadius='$lg'
								borderColor='$borderLight300'>
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

				{/* Upload section */}
				{documentType && (
					<VStack space='lg'>
						<HStack
							justifyContent='space-between'
							alignItems='center'>
							<Text fontWeight='$medium'>
								{documentType === "passport"
									? "Passport"
									: "National ID card"}
							</Text>
							<Button
								variant='link'
								onPress={() => {
									setDocumentType(null);
									setFrontImage(null);
									setBackImage(null);
								}}>
								<ButtonText color='$primary500'>
									Change
								</ButtonText>
							</Button>
						</HStack>

						{/* Front / main */}
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

						{/* Back only for CNI */}
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

						<Button isDisabled={!canSubmit}>
							<ButtonText>Submit documents</ButtonText>
						</Button>
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

/* ------------------ */
/* Reusable component */
/* ------------------ */

function UploadBlock({ label, image, onPick, onCamera }) {
	return (
		<Box
			p='$4'
			borderWidth={1}
			borderRadius='$lg'
			borderStyle='dashed'
			borderColor='$borderLight400'>
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
