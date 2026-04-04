import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import axios from "axios";

import { View, Image, Modal, useWindowDimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Icon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import CropPreview from "@/components/CropPreview";
import { Camera, Pen, User, Upload } from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "logos";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const LogoUploader = ({ image }) => {
	const { user, userCompany, accessToken, fetchCompanyFromSession } =
		useAuth();
	const { update } = useDataContext();
	const { setImage } = useImage();
	const { isDark } = useTheme();
	const { width: screenWidth } = useWindowDimensions();

	const [logoUrl, setLogoUrl] = useState(userCompany?.logo_url || null);
	const [loading, setLoading] = useState(false);
	const [rawPhoto, setRawPhoto] = useState(null);
	const [showCropModal, setShowCropModal] = useState(false);
	const [pendingReopen, setPendingReopen] = useState(false);

	useEffect(() => {
		image && handleUpload(image);
	}, [image]);

	const pickImage = async () => {
		console.log("open picker clicked !");

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: false,
			quality: 1,
		});

		console.log("result :", result);

		if (result.assets && result.assets[0]) {
			const asset = result.assets[0];
			setRawPhoto({
				uri: asset.uri,
				width: asset.width,
				height: asset.height,
			});
			setShowCropModal(true);
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
				},
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
		<>
			<Center>
				<Pressable onPress={pickImage}>
					<VStack space='lg' alignItems='center'>
						{logoUrl ? (
							<View
								style={{
									width: 120,
									height: 120,
									borderRadius: 15,
									overflow: "hidden",
								}}>
								<Image
									alt='company logo'
									source={{ uri: logoUrl }}
									style={{
										width: "100%",
										height: "100%",
									}}
									resizeMode='cover'
								/>
							</View>
						) : (
							<View
								style={{
									width: 120,
									height: 120,
									borderWidth: 2,
									borderRadius: 15,
									borderColor: isDark ? "#4b5563" : "#d1d5db",
									borderStyle: "dashed",
									justifyContent: "center",
									alignItems: "center",
									backgroundColor: isDark
										? "#374151"
										: "#f9fafb",
								}}>
								<Upload
									size={40}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
							</View>
						)}
					</VStack>
					<Button
						onPress={pickImage}
						size='md'
						className='rounded-full p-2'
						style={{
							position: "absolute",
							bottom: -8,
							right: -8,
							backgroundColor: "#2563eb",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
							elevation: 5,
							height: 32,
							width: 32,
							justifyContent: "center",
							alignItems: "center",
							borderRadius: 16,
						}}>
						<ButtonIcon as={Pen} size={16} color='#ffffff' />
					</Button>
				</Pressable>
			</Center>

			{/* Crop Modal */}
			<Modal
				visible={showCropModal}
				animationType='slide'
				presentationStyle='fullScreen'
				onDismiss={() => {
					if (pendingReopen) {
						setPendingReopen(false);
						pickImage();
					}
				}}
				onRequestClose={() => {
					setRawPhoto(null);
					setShowCropModal(false);
				}}>
				{rawPhoto && (
					<CropPreview
						uri={rawPhoto.uri}
						naturalWidth={rawPhoto.width}
						naturalHeight={rawPhoto.height}
						screenWidth={screenWidth}
						frameRatio={1}
						tint='#2563eb'
						onConfirm={(result) => {
							setRawPhoto(null);
							setShowCropModal(false);
							handleUpload({
								uri: result.uri,
								width: result.width,
								height: result.height,
							});
						}}
						onCancel={() => {
							setRawPhoto(null);
							setPendingReopen(true);
							setShowCropModal(false);
						}}
						onClose={() => {
							setRawPhoto(null);
							setShowCropModal(false);
						}}
					/>
				)}
			</Modal>
		</>
	);
};

export default LogoUploader;
