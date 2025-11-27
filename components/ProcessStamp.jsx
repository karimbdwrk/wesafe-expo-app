import React, { useState } from "react";
import { Image, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";

const SUPABASE_FUNCTION_URL =
	"https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/process-stamp";

const ProcessStamp = () => {
	const { accessToken } = useAuth();

	const [selectedImage, setSelectedImage] = useState(null);
	const [processedImage, setProcessedImage] = useState(null);

	const pickImage = async () => {
		console.log("click pick image");
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Permission required",
				"We need access to your photos."
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [4, 4],
			quality: 1,
			base64: true, // Important for sending image to Supabase Edge
		});

		if (!result.canceled) {
			const image = result.assets[0];
			// console.log("image en base64 :", image.base64);
			setSelectedImage(image.uri);
			await sendToEdgeFunction(image.base64);
		}
	};

	const sendToEdgeFunction = async (imageBase64) => {
		try {
			const res = await axios.post(
				SUPABASE_FUNCTION_URL,
				{ image: imageBase64 }, // send base64 image
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);
			console.log("Processed image URL or data:", res.data);
			setProcessedImage(res.data.image); // Adjust depending on your response
		} catch (err) {
			console.error("Error processing image:", err);
			Alert.alert("Error", "Image processing failed.");
		}
	};

	return (
		<View style={{ padding: 20 }}>
			<Button onPress={pickImage}>
				<ButtonText>Choisir une image</ButtonText>
			</Button>
			{selectedImage && (
				<Image
					source={{ uri: selectedImage }}
					style={{ width: 200, height: 200, marginTop: 20 }}
				/>
			)}
			{processedImage && (
				<Image
					source={{ uri: `data:image/png;base64,${processedImage}` }}
					style={{
						width: 200,
						height: 200,
						marginTop: 20,
						borderWidth: 2,
					}}
				/>
			)}
		</View>
	);
};

export default ProcessStamp;
