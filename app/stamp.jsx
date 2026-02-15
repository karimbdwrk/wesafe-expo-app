import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import Constants from "expo-constants";

import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
	Button,
	ButtonText,
	ButtonIcon,
	ButtonSpinner,
} from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	ActionsheetItem,
	ActionsheetItemText,
} from "@/components/ui/actionsheet";
import {
	Stamp,
	Edit3,
	FileSignature,
	Camera,
	Image as ImageIcon,
	FileUp,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "stamps";
const API_URL = "https://web-production-5fcb9.up.railway.app/process/";

const StampScreen = () => {
	const { user, userCompany, refreshUser, accessToken } = useAuth();
	const { isDark } = useTheme();
	const { update } = useDataContext();
	const router = useRouter();

	const [showActionsheet, setShowActionsheet] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [processing, setProcessing] = useState(false);

	// useEffect(() => {
	// 	console.log("userCompany stamp url:", userCompany?.stamp_url);
	// }, [userCompany]);

	useFocusEffect(
		useCallback(() => {
			console.log("refreshing user in StampScreen");
			refreshUser();
			if (userCompany) {
				console.log(
					"userCompany Stamp in StampScreen:",
					userCompany?.stamp_url,
				);
			}
		}, []),
	);

	const handleCloseActionsheet = () => setShowActionsheet(false);

	const processImageWithRailway = async (imageUri) => {
		setProcessing(true);
		try {
			const formData = new FormData();
			formData.append("file", {
				uri: imageUri,
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

			return new Promise((resolve, reject) => {
				reader.onloadend = async () => {
					try {
						const base64data = reader.result.split(",")[1];
						const filePath =
							FileSystem.documentDirectory +
							`stamp-${Date.now()}.jpg`;

						await FileSystem.writeAsStringAsync(
							filePath,
							base64data,
							{
								encoding: "base64",
							},
						);

						resolve(filePath);
					} catch (error) {
						reject(error);
					}
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch (error) {
			console.error("Erreur API Railway :", error);
			throw error;
		} finally {
			setProcessing(false);
		}
	};

	const uploadToSupabase = async (filepath) => {
		setUploading(true);
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
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
				},
			);

			const publicUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`;
			await update("companies", user.id, {
				stamp_url: publicUrl,
			});

			await refreshUser();
			Alert.alert("Succès", "Le tampon a été mis à jour avec succès !");
		} catch (error) {
			console.error("Error upload:", error);
			Alert.alert("Erreur", "Échec de l'envoi du tampon");
		} finally {
			setUploading(false);
		}
	};

	const handleTakePhoto = async () => {
		handleCloseActionsheet();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission requise",
				"L'accès à la caméra est nécessaire",
			);
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		if (!result.canceled) {
			const processedPath = await processImageWithRailway(
				result.assets[0].uri,
			);
			await uploadToSupabase(processedPath);
		}
	};

	const handlePickFromGallery = async () => {
		handleCloseActionsheet();
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission requise",
				"L'accès à la galerie est nécessaire",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		if (!result.canceled) {
			const processedPath = await processImageWithRailway(
				result.assets[0].uri,
			);
			await uploadToSupabase(processedPath);
		}
	};

	const handlePickDocument = async () => {
		handleCloseActionsheet();
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "image/*",
				copyToCacheDirectory: true,
			});

			if (!result.canceled) {
				const processedPath = await processImageWithRailway(
					result.assets[0].uri,
				);
				await uploadToSupabase(processedPath);
			}
		} catch (error) {
			console.error("Error picking document:", error);
			Alert.alert("Erreur", "Échec de la sélection du fichier");
		}
	};

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}
			contentContainerStyle={{ padding: 20 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading
						size='2xl'
						style={{
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						Tampon de l'entreprise
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Gérez le tampon officiel de votre entreprise pour les
						documents
					</Text>
				</VStack>

				{/* Stamp Preview Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 24,
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#e5e7eb",
					}}>
					<VStack space='lg'>
						<VStack space='sm'>
							<Icon
								as={FileSignature}
								size='lg'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}
							/>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Aperçu du tampon
							</Heading>
						</VStack>

						<Box
							style={{
								minHeight: 300,
								justifyContent: "center",
								alignItems: "center",
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
								borderRadius: 8,
								borderWidth: 2,
								borderStyle: "dashed",
								borderColor: isDark ? "#4b5563" : "#d1d5db",
								padding: 20,
							}}>
							{userCompany?.stamp_url ? (
								<Image
									size='2xl'
									source={{
										uri: userCompany.stamp_url,
									}}
									resizeMode='contain'
									alt="Tampon de l'entreprise"
									style={{
										width: "100%",
										height: 250,
									}}
								/>
							) : (
								<VStack
									space='md'
									style={{
										alignItems: "center",
										justifyContent: "center",
									}}>
									<Icon
										as={Stamp}
										size='2xl'
										style={{
											color: isDark
												? "#4b5563"
												: "#d1d5db",
										}}
									/>
									<Text
										size='md'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											textAlign: "center",
										}}>
										Aucun tampon configuré
									</Text>
								</VStack>
							)}
						</Box>

						<Button
							size='lg'
							action='primary'
							onPress={() => setShowActionsheet(true)}
							isDisabled={uploading || processing}
							style={{
								backgroundColor: "#3b82f6",
								borderRadius: 8,
							}}>
							{(uploading || processing) && <ButtonSpinner />}
							<ButtonIcon as={Edit3} />
							<ButtonText>
								{processing
									? "Traitement..."
									: uploading
										? "Envoi..."
										: userCompany?.stamp_url
											? "Modifier le tampon"
											: "Ajouter un tampon"}
							</ButtonText>
						</Button>
					</VStack>
				</Card>

				{/* Info Card */}
				<Card
					style={{
						backgroundColor: isDark
							? "rgba(59, 130, 246, 0.1)"
							: "rgba(59, 130, 246, 0.05)",
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: isDark
							? "rgba(59, 130, 246, 0.3)"
							: "rgba(59, 130, 246, 0.2)",
					}}>
					<VStack space='sm'>
						<Text
							size='sm'
							style={{
								color: isDark ? "#93c5fd" : "#2563eb",
								fontWeight: "600",
							}}>
							💡 À propos du tampon
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
								lineHeight: 20,
							}}>
							Le tampon sera utilisé pour valider et signer vos
							documents officiels. Assurez-vous qu'il soit
							clairement lisible et conforme à votre identité
							visuelle.
						</Text>
					</VStack>
				</Card>
			</VStack>

			{/* ActionSheet pour choisir la source */}
			<Actionsheet
				isOpen={showActionsheet}
				onClose={handleCloseActionsheet}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					<VStack space='md' style={{ width: "100%", padding: 20 }}>
						<Heading
							size='lg'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Choisir une source
						</Heading>

						<ActionsheetItem onPress={handleTakePhoto}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Icon
									as={Camera}
									size='xl'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}
								/>
								<ActionsheetItemText
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontSize: 16,
									}}>
									Prendre une photo
								</ActionsheetItemText>
							</HStack>
						</ActionsheetItem>

						<ActionsheetItem onPress={handlePickFromGallery}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Icon
									as={ImageIcon}
									size='xl'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}
								/>
								<ActionsheetItemText
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontSize: 16,
									}}>
									Ouvrir la pellicule
								</ActionsheetItemText>
							</HStack>
						</ActionsheetItem>

						<ActionsheetItem onPress={handlePickDocument}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Icon
									as={FileUp}
									size='xl'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}
								/>
								<ActionsheetItemText
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontSize: 16,
									}}>
									Choisir un fichier
								</ActionsheetItemText>
							</HStack>
						</ActionsheetItem>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</ScrollView>
	);
};

export default StampScreen;
