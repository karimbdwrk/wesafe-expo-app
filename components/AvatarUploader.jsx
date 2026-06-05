import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import axios from "axios";
import { Image } from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
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
import Colors from "@/constants/Colors";
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
	const [localPreview, setLocalPreview] = useState(null);
	const [loading, setLoading] = useState(false);
	const [cacheKey, setCacheKey] = useState(() => Date.now());

	// Synchronise l'état local quand userProfile change depuis l'extérieur
	useEffect(() => {
		if (userProfile?.avatar_url) {
			setAvatarUrl(userProfile.avatar_url);
		}
	}, [userProfile?.avatar_url]);

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

	// Recadre l'image en carré 1:1 centré (800×800)
	const cropToSquare = async (uri) => {
		const { width, height } = await new Promise((resolve) => {
			Image.getSize(uri, (w, h) => resolve({ width: w, height: h }));
		});
		const size = Math.min(width, height);
		const originX = Math.floor((width - size) / 2);
		const originY = Math.floor((height - size) / 2);
		const result = await ImageManipulator.manipulateAsync(
			uri,
			[
				{ crop: { originX, originY, width: size, height: size } },
				{ resize: { width: 800, height: 800 } },
			],
			{ compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
		);
		return result.uri;
	};

	const handleUpload = async (values) => {
		setImage(null); // évite les doubles déclenchements
		setLocalPreview(values.uri); // affichage immédiat avant upload
		setLoading(true);

		try {
			const squareUri = await cropToSquare(values.uri);
			setLocalPreview(squareUri); // met à jour avec la version recadrée
			const formData = new FormData();
			const filename = squareUri.split("/").pop();
			const type = "image/jpeg";
			formData.append("files", { uri: squareUri, name: filename, type });

			// Nom de fichier unique par upload → URL différente à chaque fois → pas de cache CDN
			const storagePath = `${user.id}/avatar_${Date.now()}.jpg`;

			await axios.post(
				`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
				},
			);

			const publicUrl = `${STORAGE_URL}/${storagePath}`;
			await update("profiles", user.id, { avatar_url: publicUrl });
			setAvatarUrl(publicUrl);
			// localPreview reste = squareUri (affichage immédiat côté client)
			await loadUserData(user.id, accessToken);
			if (typeof onUpload === "function") onUpload();
		} catch (error) {
			console.error("Error upload response:", error.response?.data);
			console.error("Error upload:", error);
			setLocalPreview(null); // en cas d'erreur, revenir à l'URL CDN
		} finally {
			setLoading(false);
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
										backgroundColor:
											localPreview || avatarUrl
												? "transparent"
												: "#f3f4f6",
									}}>
									{localPreview || avatarUrl ? (
										<Image
											key={`avatar-${cacheKey}`}
											source={{
												uri: localPreview
													? localPreview
													: `${avatarUrl}?v=${cacheKey}`,
											}}
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
						backgroundColor: isDark
							? Colors.dark.elevated
							: Colors.light.cardBackground,
						borderTopLeftRadius: 16,
						borderTopRightRadius: 16,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					<VStack style={{ width: "100%", padding: 20 }} space='md'>
						<Heading
							size='xl'
							style={{
								color: isDark
									? Colors.dark.text
									: Colors.light.text,
							}}>
							Choisir une source
						</Heading>

						<ActionsheetItem
							style={{
								backgroundColor: isDark
									? Colors.dark.elevated
									: Colors.light.cardBackground,
							}}
							onPress={() => {
								router.push("/camera");
								setShowActionsheet(false);
							}}>
							<Icon
								as={Camera}
								size='lg'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Prendre une photo
							</ActionsheetItemText>
						</ActionsheetItem>

						<ActionsheetItem
							style={{
								backgroundColor: isDark
									? Colors.dark.elevated
									: Colors.light.cardBackground,
							}}
							onPress={pickImage}>
							<Icon
								as={Images}
								size='lg'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Galerie photo
							</ActionsheetItemText>
						</ActionsheetItem>

						<ActionsheetItem
							style={{
								backgroundColor: isDark
									? Colors.dark.elevated
									: Colors.light.cardBackground,
							}}
							onPress={pickDocument}>
							<Icon
								as={FileText}
								size='lg'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
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
