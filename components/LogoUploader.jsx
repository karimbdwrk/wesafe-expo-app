import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import axios from "axios";

import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Image } from "@/components/ui/image";

import { useDataContext } from "@/context/DataContext"; // your supabase axios methods
import { useAuth } from "@/context/AuthContext"; // to get user & token
import { useImage } from "@/context/ImageContext";
import { Camera, User } from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "logos";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const LogoUploader = ({ image }) => {
	const { user, userCompany, accessToken, fetchCompanyFromSession } =
		useAuth();
	const { update } = useDataContext(); // your method for updating `profiles`
	const { setImage } = useImage();

	const [logoUrl, setLogoUrl] = useState(userCompany?.logo_url || null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		image && handleUpload(image);
	}, [image]);

	const pickImage = async () => {
		console.log("open picker clicked !");

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		console.log("result :", result);

		if (result.assets) {
			console.log("result assets mimeType :", result.assets[0].mimeType);
			handleUpload(result.assets[0]);
		}
	};

	const handleUpload = async (values) => {
		// setAvatarLoading(true);
		console.log("handleUpload values", values, accessToken);

		try {
			console.log("values to upload", values);
			const formData = new FormData();
			let filename = values.uri.split("/").pop();
			let match = /\.(\w+)$/.exec(filename);
			let type = match ? `image/${match[1]}` : `image`;
			formData.append("files", { uri: values.uri, name: filename, type });

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
			const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
			await update("companies", user.id, { logo_url: publicUrl });
			setLogoUrl(publicUrl);
			// await fetchCompanyFromSession();
			setImage(null);
		} catch (error) {
			console.error("Error upload:", error);
		}
	};

	return (
		<Center>
			<VStack space='lg' alignItems='center'>
				{logoUrl ? (
					<Image
						source={{ uri: logoUrl }}
						size={"xl"}
						resizeMode='contain'
					/>
				) : (
					<View
						style={{
							width: 120,
							height: 120,
							borderWidth: 1,
							borderRadius: 15,
							borderColor: "black",
							borderStyle: "dotted",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Camera />
					</View>
				)}

				{loading ? (
					<Spinner size='large' />
				) : (
					<Button onPress={pickImage}>
						<ButtonText>
							{logoUrl ? "Update logo" : "Upload logo"}
						</ButtonText>
					</Button>
				)}
			</VStack>
		</Center>
	);
};

export default LogoUploader;
