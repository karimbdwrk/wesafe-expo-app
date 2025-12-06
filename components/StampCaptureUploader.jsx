import React, { useState } from "react";
import { Image, View, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import Constants from "expo-constants";

import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "stamps";

const API_URL = "https://web-production-5fcb9.up.railway.app/process/"; // 🔁 Mets ici l’URL réelle de ton API Railway

const StampCaptureUploader = () => {
	const { user, accessToken, fetchCompanyFromSession } = useAuth();
	const { update } = useDataContext();

	const [originalImage, setOriginalImage] = useState(null);
	const [processedImage, setProcessedImage] = useState(null);
	const [filepath, setFilepath] = useState(null);
	const [uploading, setUploading] = useState(false);

	const pickImage = async () => {
		console.log("pick image ok");
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			alert("Permission requise pour accéder aux images");
			return;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: false,
			aspect: [4, 3],
			quality: 1,
		});

		if (!result.canceled) {
			console.log("Image URI:", result.assets[0].uri);
			const uri = result.assets[0].uri;
			setOriginalImage({ uri });
			setProcessedImage(null);
		}
	};

	const sendToRailway = async () => {
		if (!originalImage) return;
		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", {
				uri: originalImage.uri,
				name: "photo.jpg",
				type: "image/jpeg",
			});

			const response = await axios.post(API_URL, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				responseType: "blob",
			});

			const blob = response.data;

			const reader = new FileReader();
			reader.onloadend = async () => {
				const base64data = reader.result.split(",")[1]; // Supprime le préfixe

				const filePath =
					FileSystem.documentDirectory + `stamp-${Date.now()}.jpg`;

				await FileSystem.writeAsStringAsync(filePath, base64data, {
					encoding: "base64",
					// encoding: FileSystem.EncodingType.Base64,
				});

				setProcessedImage({ uri: filePath });
				Alert.alert("Traitement terminé !");
				setFilepath(filePath);
				setUploading(false);
			};

			reader.readAsDataURL(blob);
		} catch (error) {
			console.error("Erreur API Railway :", error);
			Alert.alert("Erreur pendant le traitement de l’image.");
			setUploading(false);
		}
	};

	const handleUpload = async () => {
		console.log("handleUpload values", filepath);

		try {
			const formData = new FormData();
			let filename = filepath.split("/").pop();
			let match = /\.(\w+)$/.exec(filename);
			let type = match ? `image/${match[1]}` : `image`;
			formData.append("files", { uri: filepath, name: filename, type });

			const response = await axios.post(
				`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${accessToken}`, // Required if using RLS
						apikey: SUPABASE_API_KEY,
					},
				}
			);
			console.log("Response upload:", response.data);
			const publicUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`;
			const responseUpdate = await update("companies", user.id, {
				stamp_url: publicUrl,
			});
			console.log("Response update company:", responseUpdate);

			Alert.alert("envoyé a supabase !");
		} catch (error) {
			console.error("Error upload:", error);
		}
	};

	const handleReset = () => {
		setOriginalImage(null);
		setProcessedImage(null);
	};

	// const uploadToSupabase = async () => {
	// 	if (!processedImage?.uri) return;
	// 	setUploading(true);

	// 	try {
	// 		const fileName = `stamp-${Date.now()}.jpg`;
	// 		const filePath = `${BUCKET_NAME}/${fileName}`;
	// 		const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;

	// 		const formData = new FormData();
	// 		formData.append("file", {
	// 			uri: processedImage.uri,
	// 			name: fileName,
	// 			type: "image/jpeg",
	// 		});

	// 		const response = await axios.post(uploadUrl, formData, {
	// 			headers: {
	// 				"Content-Type": "multipart/form-data",
	// 				Authorization: `Bearer ${SUPABASE_API_KEY}`,
	// 				"x-upsert": "true",
	// 			},
	// 		});

	// 		if (response.status < 300) {
	// 			Alert.alert("Image envoyée sur Supabase !");
	// 		} else {
	// 			console.error("Erreur HTTP :", response);
	// 			Alert.alert("Échec de l'envoi");
	// 		}
	// 	} catch (error) {
	// 		console.error("Erreur Supabase :", error);
	// 		Alert.alert("Upload échoué");
	// 	}

	// 	setUploading(false);
	// };

	return (
		<View style={{ padding: 20 }}>
			<Button onPress={pickImage}>
				<ButtonText>Choisir une image</ButtonText>
			</Button>

			{originalImage && !processedImage && (
				<>
					<Image
						source={{ uri: originalImage.uri }}
						style={{ width: 400, height: 200, marginVertical: 10 }}
						resizeMode='contain'
					/>
					<Button onPress={sendToRailway}>
						<ButtonText>Génerer mon tampon</ButtonText>
					</Button>
					<Button onPress={pickImage}>
						<ButtonText>Choisir une autre image</ButtonText>
					</Button>
				</>
			)}

			{processedImage && (
				<>
					<Image
						source={{ uri: processedImage.uri }}
						style={{ width: 400, height: 200, marginVertical: 10 }}
						resizeMode='contain'
					/>
					<Button onPress={handleUpload}>
						<ButtonText>Enregistrer</ButtonText>
					</Button>
					<Button onPress={handleReset}>
						<ButtonText>Recommencer</ButtonText>
					</Button>
				</>
			)}

			{uploading && <ActivityIndicator size='large' />}
		</View>
	);
};

export default StampCaptureUploader;
