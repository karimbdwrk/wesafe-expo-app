import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import axios from "axios";

import { View, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Icon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
	ActionsheetItem,
	ActionsheetItemText,
} from "@/components/ui/actionsheet";

import { useDataContext } from "@/context/DataContext"; // your supabase axios methods
import { useAuth } from "@/context/AuthContext"; // to get user & token
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import {
	Camera,
	Pen,
	User,
	Upload,
	Images,
	FileText,
} from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "logos";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const LogoUploader = ({ image }) => {
	const { user, userCompany, accessToken, fetchCompanyFromSession } =
		useAuth();
	const { update } = useDataContext(); // your method for updating `profiles`
	const { setImage } = useImage();
	const { isDark } = useTheme();

	const [logoUrl, setLogoUrl] = useState(userCompany?.logo_url || null);
	const [loading, setLoading] = useState(false);
	const [showActionsheet, setShowActionsheet] = useState(false);

	const handleClose = () => setShowActionsheet(false);

	useEffect(() => {
		image && handleUpload(image);
	}, [image]);

	const pickImage = async () => {
		console.log("open picker clicked !");
		setShowActionsheet(false);

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

	const pickDocument = async () => {
		console.log("open document picker clicked !");
		setShowActionsheet(false);

		let result = await DocumentPicker.getDocumentAsync({
			type: "image/*",
			copyToCacheDirectory: true,
		});

		console.log("document result :", result);

		if (result.assets && result.assets.length > 0) {
			const file = result.assets[0];
			handleUpload(file);
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
				<Pressable onPress={() => setShowActionsheet(true)}>
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
						onPress={() => setShowActionsheet(true)}
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

			<Actionsheet isOpen={showActionsheet} onClose={handleClose}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					<VStack style={{ width: "100%", padding: 20 }} space='md'>
						<Heading
							size='xl'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Choisir une source
						</Heading>

						<ActionsheetItem onPress={pickImage}>
							<Icon
								as={Images}
								size='lg'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Galerie photo
							</ActionsheetItemText>
						</ActionsheetItem>

						<ActionsheetItem onPress={pickDocument}>
							<Icon
								as={FileText}
								size='lg'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Fichiers
							</ActionsheetItemText>
						</ActionsheetItem>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
};

export default LogoUploader;
