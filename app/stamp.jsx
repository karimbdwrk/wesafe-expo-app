import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
	ScrollView,
	Alert,
	Modal,
	View,
	StyleSheet,
	TouchableOpacity,
	useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import Constants from "expo-constants";
import { CameraView, useCameraPermissions } from "expo-camera";

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
	Stamp,
	Edit3,
	FileSignature,
	Camera,
	Image as ImageIcon,
	Clock,
	CheckCircle,
	XCircle,
	ShieldCheck,
	X,
	Lightbulb,
} from "lucide-react-native";

import CropPreview from "@/components/CropPreview";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { STAMP_TAKE_PHOTO, STAMP_PICK_GALLERY } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "stamps";
const API_URL = "https://web-production-5fcb9.up.railway.app/process/";

const StampScreen = () => {
	const { user, userCompany, refreshUser, accessToken } = useAuth();
	const { isDark } = useTheme();
	const { update, trackActivity } = useDataContext();
	const router = useRouter();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const border = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const tint20 = isDark ? Colors.dark.tint20 : Colors.light.tint20;
	const success = isDark ? Colors.dark.success : Colors.light.success;
	const success20 = isDark ? Colors.dark.success20 : Colors.light.success20;
	const warning = isDark ? Colors.dark.warning : Colors.light.warning;
	const warning20 = isDark ? Colors.dark.warning20 : Colors.light.warning20;
	const danger = isDark ? Colors.dark.danger : Colors.light.danger;
	const danger20 = isDark ? Colors.dark.danger20 : Colors.light.danger20;

	const [showCameraModal, setShowCameraModal] = useState(false);
	const [rawPhoto, setRawPhoto] = useState(null);
	const [pickSource, setPickSource] = useState(null);
	const [pendingReopenGallery, setPendingReopenGallery] = useState(false);
	const [facing, setFacing] = useState("back");
	const [cameraPermission, requestCameraPermission] = useCameraPermissions();
	const cameraRef = useRef(null);
	const { width: screenWidth } = useWindowDimensions();
	const [uploading, setUploading] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [stampStatus, setStampStatus] = useState(null);
	const canEdit = stampStatus !== "verified";

	// useEffect(() => {
	// 	console.log("userCompany stamp url:", userCompany?.stamp_url);
	// }, [userCompany]);

	useFocusEffect(
		useCallback(() => {
			refreshUser();
		}, []),
	);

	useEffect(() => {
		setStampStatus(userCompany?.stamp_status ?? null);
	}, [userCompany]);

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
				stamp_status: "pending",
			});
			setStampStatus("pending");

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
		trackActivity(STAMP_TAKE_PHOTO);
		if (!cameraPermission?.granted) {
			const { granted } = await requestCameraPermission();
			if (!granted) {
				Alert.alert(
					"Permission requise",
					"L'accès à la caméra est nécessaire",
				);
				return;
			}
		}
		setPickSource("camera");
		setRawPhoto(null);
		setShowCameraModal(true);
	};

	const captureDocument = async () => {
		if (!cameraRef.current) return;
		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 1,
			});
			setRawPhoto({
				uri: photo.uri,
				width: photo.width,
				height: photo.height,
			});
		} catch (e) {
			console.error("Capture error:", e);
		}
	};

	const handlePickFromGallery = async () => {
		trackActivity(STAMP_PICK_GALLERY);
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
			allowsEditing: false,
			quality: 1,
		});

		if (!result.canceled && result.assets?.[0]) {
			const asset = result.assets[0];
			setRawPhoto({
				uri: asset.uri,
				width: asset.width,
				height: asset.height,
			});
			setPickSource("gallery");
			setShowCameraModal(true);
		}
	};

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: bg,
			}}
			contentContainerStyle={{ padding: 20 }}>
			<VStack space='xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading
						size='2xl'
						style={{
							color: textPrimary,
						}}>
						Tampon de l'entreprise
					</Heading>
					<Text
						size='md'
						style={{
							color: muted,
						}}>
						Gérez le tampon officiel de votre entreprise pour les
						documents
					</Text>
				</VStack>

				{/* Stamp Preview Card */}
				<Card
					style={{
						backgroundColor: cardBg,
						borderRadius: 12,
						padding: 24,
						borderWidth: 1,
						borderColor: border,
					}}>
					<VStack space='lg'>
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<Heading
								size='md'
								style={{
									color: textPrimary,
								}}>
								Aperçu du tampon
							</Heading>

							{/* Badge statut */}
							{stampStatus === "verified" && (
								<HStack
									space='xs'
									style={{
										alignItems: "center",
										backgroundColor: success20,
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderRadius: 20,
										borderWidth: 1,
										borderColor: success20,
									}}>
									<Icon
										as={CheckCircle}
										size='xs'
										style={{ color: success }}
									/>
									<Text
										size='xs'
										style={{
											color: success,
											fontWeight: "600",
										}}>
										Validé
									</Text>
								</HStack>
							)}
							{stampStatus === "pending" && (
								<HStack
									space='xs'
									style={{
										alignItems: "center",
										backgroundColor: warning20,
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderRadius: 20,
										borderWidth: 1,
										borderColor: warning20,
									}}>
									<Icon
										as={Clock}
										size='xs'
										style={{ color: warning }}
									/>
									<Text
										size='xs'
										style={{
											color: warning,
											fontWeight: "600",
										}}>
										En attente
									</Text>
								</HStack>
							)}
							{stampStatus === "rejected" && (
								<HStack
									space='xs'
									style={{
										alignItems: "center",
										backgroundColor: danger20,
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderRadius: 20,
										borderWidth: 1,
										borderColor: danger20,
									}}>
									<Icon
										as={XCircle}
										size='xs'
										style={{ color: danger }}
									/>
									<Text
										size='xs'
										style={{
											color: danger,
											fontWeight: "600",
										}}>
										Refusé
									</Text>
								</HStack>
							)}
						</HStack>
						<Box
							style={{
								minHeight: 300,
								justifyContent: "center",
								alignItems: "center",
								backgroundColor: bg,
								borderRadius: 8,
								borderWidth: 2,
								borderStyle: "dashed",
								borderColor: border,
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
										style={{ color: border }}
									/>
									<Text
										size='md'
										style={{
											color: muted,
											textAlign: "center",
										}}>
										Aucun tampon configuré
									</Text>
								</VStack>
							)}
						</Box>

						{/* Message si validé */}
						{stampStatus === "verified" && (
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={ShieldCheck}
									size='xs'
									style={{ color: success }}
								/>
								<Text
									size='xs'
									style={{
										color: success,
									}}>
									Votre tampon est validé et ne peut plus être
									modifié.
								</Text>
							</HStack>
						)}
						{/* Message préventif si pas encore validé */}
						{stampStatus !== "verified" && (
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={ShieldCheck}
									size='xs'
									style={{
										color: muted,
									}}
								/>
								<Text
									size='xs'
									style={{
										color: muted,
										flex: 1,
									}}>
									Une fois validé, votre tampon ne pourra plus
									être modifié.
								</Text>
							</HStack>
						)}
						{/* Message si refusé */}
						{stampStatus === "rejected" && (
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={XCircle}
									size='xs'
									style={{ color: danger }}
								/>
								<Text size='xs' style={{ color: danger }}>
									Votre tampon a été refusé. Vous pouvez en
									soumettre un nouveau.
								</Text>
							</HStack>
						)}

						{/* Boutons masqués si validé */}
						{canEdit && (
							<HStack space='md'>
								<Button
									style={{
										flex: 1,
										backgroundColor: tint,
										borderRadius: 8,
									}}
									size='lg'
									onPress={handleTakePhoto}
									isDisabled={uploading || processing}>
									{(uploading || processing) && (
										<ButtonSpinner color='#ffffff' />
									)}
									<ButtonIcon
										as={Camera}
										style={{ color: "#ffffff" }}
									/>
									<ButtonText style={{ color: "#ffffff" }}>
										Caméra
									</ButtonText>
								</Button>
								<Button
									style={{
										flex: 1,
										backgroundColor: tint,
										borderRadius: 8,
									}}
									size='lg'
									onPress={handlePickFromGallery}
									isDisabled={uploading || processing}>
									{(uploading || processing) && (
										<ButtonSpinner color='#ffffff' />
									)}
									<ButtonIcon
										as={ImageIcon}
										style={{ color: "#ffffff" }}
									/>
									<ButtonText style={{ color: "#ffffff" }}>
										Pellicule
									</ButtonText>
								</Button>
							</HStack>
						)}
						{(uploading || processing) && (
							<Text
								size='xs'
								style={{ color: muted, textAlign: "center" }}>
								{processing
									? "Traitement en cours..."
									: "Envoi en cours..."}
							</Text>
						)}
					</VStack>
				</Card>

				{/* Info Card */}
				<Card
					style={{
						backgroundColor: tint20,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: tint20,
					}}>
					<VStack space='sm'>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Lightbulb size={16} color={tint} />
							<Text
								size='sm'
								style={{
									color: tint,
									fontWeight: "600",
								}}>
								À propos du tampon
							</Text>
						</HStack>
						<Text
							size='sm'
							style={{
								color: tint,
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

			{/* Camera / Crop Modal */}
			<Modal
				visible={showCameraModal}
				animationType='slide'
				presentationStyle='fullScreen'
				onDismiss={() => {
					if (pendingReopenGallery) {
						setPendingReopenGallery(false);
						handlePickFromGallery();
					}
				}}
				onRequestClose={() => {
					setRawPhoto(null);
					setShowCameraModal(false);
				}}>
				<Box style={{ flex: 1, backgroundColor: "#000" }}>
					{rawPhoto ? (
						<CropPreview
							uri={rawPhoto.uri}
							naturalWidth={rawPhoto.width}
							naturalHeight={rawPhoto.height}
							screenWidth={screenWidth}
							frameRatio={1}
							tint={tint}
							onConfirm={async (result) => {
								setRawPhoto(null);
								setShowCameraModal(false);
								try {
									const processedPath =
										await processImageWithRailway(
											result.uri,
										);
									await uploadToSupabase(processedPath);
								} catch (e) {
									Alert.alert(
										"Erreur",
										"Échec du traitement du tampon",
									);
								}
							}}
							onCancel={() => {
								setRawPhoto(null);
								if (pickSource === "gallery") {
									setPendingReopenGallery(true);
									setShowCameraModal(false);
								}
								// pickSource === "camera" : rawPhoto reset → retour caméra dans le modal
							}}
							onClose={() => {
								setRawPhoto(null);
								setShowCameraModal(false);
							}}
						/>
					) : cameraPermission?.granted ? (
						<Box style={{ flex: 1, backgroundColor: "#000" }}>
							{/* Fermer */}
							<TouchableOpacity
								onPress={() => setShowCameraModal(false)}
								style={{
									position: "absolute",
									top: 56,
									right: 16,
									zIndex: 10,
									backgroundColor: "rgba(0,0,0,0.5)",
									borderRadius: 20,
									padding: 8,
								}}>
								<Icon
									as={X}
									size='xl'
									style={{ color: "#fff" }}
								/>
							</TouchableOpacity>
							<CameraView
								ref={cameraRef}
								style={{ flex: 1 }}
								facing={facing}
							/>
							{/* Cadre guide 1:1 */}
							{(() => {
								const fw = Math.round(screenWidth * 0.88);
								return (
									<View
										style={{
											...StyleSheet.absoluteFillObject,
											zIndex: 5,
										}}
										pointerEvents='none'>
										<View
											style={{
												flex: 1,
												backgroundColor:
													"rgba(0,0,0,0.58)",
											}}
										/>
										<View
											style={{
												flexDirection: "row",
												height: fw,
											}}>
											<View
												style={{
													flex: 1,
													backgroundColor:
														"rgba(0,0,0,0.58)",
												}}
											/>
											<View
												style={{
													width: fw,
													height: fw,
													borderWidth: 2,
													borderColor:
														"rgba(255,255,255,0.9)",
													borderRadius: 10,
												}}
											/>
											<View
												style={{
													flex: 1,
													backgroundColor:
														"rgba(0,0,0,0.58)",
												}}
											/>
										</View>
										<View
											style={{
												flex: 1,
												backgroundColor:
													"rgba(0,0,0,0.58)",
											}}
										/>
									</View>
								);
							})()}
							{/* Bouton capture */}
							<Box
								style={{
									padding: 20,
									paddingBottom: 40,
									backgroundColor: "#000",
									zIndex: 10,
								}}>
								<Button
									onPress={captureDocument}
									style={{
										backgroundColor: tint,
										borderRadius: 12,
										height: 52,
									}}>
									<ButtonIcon
										as={Camera}
										style={{ color: "#ffffff" }}
									/>
									<ButtonText
										style={{
											color: "#ffffff",
											fontWeight: "700",
											fontSize: 16,
										}}>
										Prendre une photo
									</ButtonText>
								</Button>
							</Box>
						</Box>
					) : (
						<Box
							style={{
								flex: 1,
								backgroundColor: "#000",
								justifyContent: "center",
								alignItems: "center",
								padding: 24,
							}}>
							<Text
								style={{
									color: "#ffffff",
									textAlign: "center",
									fontSize: 15,
									marginBottom: 20,
								}}>
								L'accès à la caméra est requis pour prendre une
								photo.
							</Text>
							<Button
								onPress={requestCameraPermission}
								style={{
									backgroundColor: tint,
									borderRadius: 10,
								}}>
								<ButtonText>Autoriser la caméra</ButtonText>
							</Button>
						</Box>
					)}
				</Box>
			</Modal>
		</ScrollView>
	);
};

export default StampScreen;
