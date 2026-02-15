import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import axios from "axios";
import { Image } from "react-native";

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

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import {
	Camera,
	User,
	SquarePen,
	Plus,
	Images,
	UserPlus,
	Pen,
	FileText,
} from "lucide-react-native";
import { height } from "dom-helpers";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "avatars";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const AvatarUploader = ({ image, onUpload }) => {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { setImage } = useImage();
	const { isDark } = useTheme();
	const router = useRouter();

	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
	const [loading, setLoading] = useState(false);

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
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
				},
			);
			console.log("Response upload:", response.data);
			const publicUrl = `${STORAGE_URL}/${filename}`;
			await update("profiles", user.id, { avatar_url: publicUrl });
			setAvatarUrl(publicUrl);
			await loadUserData(user.id, accessToken);
			setImage(null);
			onUpload();
		} catch (error) {
			console.error("Error upload:", error);
		}
	};

	return (
		<>
			<Pressable
				onPress={() => setShowActionsheet(true)}
				style={{
					width: "100%",
					height: "100%",
					position: "absolute",
					top: 0,
				}}>
				<Center>
					<VStack space='lg' alignItems='center'>
						{loading ? (
							<Spinner size='large' />
						) : (
							<>
								<VStack
									style={{
										width: 120,
										height: 120,
										alignItems: "center",
										justifyContent: "center",
										borderRadius: 15,
										overflow: "hidden",
										backgroundColor: avatarUrl
											? "transparent"
											: "#f3f4f6",
									}}>
									{avatarUrl ? (
										<Image
											source={{ uri: avatarUrl }}
											style={{
												width: 120,
												height: 120,
											}}
											resizeMode='cover'
										/>
									) : (
										<Camera color='lightgrey' size={48} />
									)}
								</VStack>
							</>
						)}
					</VStack>
				</Center>
			</Pressable>
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

						<ActionsheetItem
							onPress={() => {
								router.push("/camera");
								setShowActionsheet(false);
							}}>
							<Icon
								as={Camera}
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
								Prendre une photo
							</ActionsheetItemText>
						</ActionsheetItem>

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

export default AvatarUploader;
