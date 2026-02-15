import React, { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, TouchableOpacity, Linking } from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
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
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import {
	CheckCircle,
	Clock,
	AlertCircle,
	FileText,
	Camera,
	Image as ImageIcon,
	Upload,
	X,
	FileUp,
	Building2,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "kbis";

export default function KBISDocumentVerification() {
	const router = useRouter();
	const { user, userCompany, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	const [kbisImage, setKbisImage] = useState(null);
	const [showActionsheet, setShowActionsheet] = useState(false);

	const [kbisUploadedStatus, setKbisUploadedStatus] = useState(null);
	const [kbisUploadedUrl, setKbisUploadedUrl] = useState(null);

	const [isSubmitting, setIsSubmitting] = useState(false);

	useFocusEffect(
		useCallback(() => {
			console.log("KBIS Verification Screen focused");
			loadCompanyData();
		}, []),
	);

	const loadCompanyData = async () => {
		if (userCompany) {
			setKbisUploadedStatus(userCompany?.kbis_verification_status);
			setKbisUploadedUrl(userCompany?.kbis_url);
		}

		console.log("Loaded company data:", {
			kbis_verification_status: userCompany?.kbis_verification_status,
			kbis_url: userCompany?.kbis_url,
		});
	};

	useEffect(() => {
		loadCompanyData();
	}, [userCompany]);

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const handleTakePhoto = async () => {
		setShowActionsheet(false);
		const { status } = await ImagePicker.requestCameraPermissionsAsync();

		if (status !== "granted") {
			console.warn("Permission denied");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
			allowsEditing: true,
		});

		if (!result.canceled) {
			setKbisImage(result.assets[0]);
		}
	};

	const handlePickFromGallery = async () => {
		setShowActionsheet(false);
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") {
			console.warn("Permission denied");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setKbisImage(result.assets[0]);
		}
	};

	const handlePickDocument = async () => {
		setShowActionsheet(false);
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*", "application/pdf"],
				copyToCacheDirectory: true,
			});

			if (!result.canceled && result.assets && result.assets[0]) {
				setKbisImage(result.assets[0]);
			}
		} catch (error) {
			console.error("Document picker error:", error);
		}
	};

	/* ------------------ */
	/* Upload logic       */
	/* ------------------ */

	const uploadKBIS = async () => {
		if (!kbisImage?.uri) throw new Error("No KBIS to upload");

		const formData = new FormData();

		const originalName = kbisImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";
		const mimeType = kbisImage.mimeType || `image/${extension}`;

		const storageFilename = `${userCompany.id}/kbis_${Date.now()}.${extension}`;

		formData.append("files", {
			uri: kbisImage.uri,
			name: storageFilename,
			type: mimeType,
		});

		await axios.post(
			`${SUPABASE_URL}/storage/v1/object/${DOCUMENTS_BUCKET}/${storageFilename}`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${accessToken}`,
					apikey: SUPABASE_API_KEY,
				},
			},
		);

		return `${SUPABASE_URL}/storage/v1/object/public/${DOCUMENTS_BUCKET}/${storageFilename}`;
	};

	/* ------------------ */
	/* Submit             */
	/* ------------------ */

	const handleSubmitKBIS = async () => {
		console.log("Submitting KBIS...");
		setIsSubmitting(true);
		try {
			const kbisUrl = await uploadKBIS();

			await update("companies", userCompany.id, {
				kbis_url: kbisUrl,
				kbis_verification_status: "pending",
			});

			console.log("KBIS submitted successfully");

			// Recharger les données
			await loadUserData(user.id, accessToken);

			// Réinitialiser le formulaire
			setKbisImage(null);

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon
							as={CheckCircle}
							size='lg'
							className='mr-2'
							style={{ color: "#10b981" }}
						/>
						<VStack space='xs' style={{ flex: 1 }}>
							<ToastTitle>KBIS soumis avec succès !</ToastTitle>
							<ToastDescription>
								Votre KBIS est en cours de vérification. Vous
								recevrez une notification dès que la
								vérification sera terminée.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} catch (error) {
			console.error("Submit KBIS error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon
							as={AlertCircle}
							size='lg'
							className='mr-2'
							style={{ color: "#ef4444" }}
						/>
						<VStack space='xs' style={{ flex: 1 }}>
							<ToastTitle>
								Erreur lors de la soumission
							</ToastTitle>
							<ToastDescription>
								Une erreur est survenue lors de l'envoi de votre
								KBIS. Veuillez réessayer.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	/* ------------------ */
	/* UI                 */
	/* ------------------ */

	const getStatusBadge = () => {
		const statusConfig = {
			verified: {
				action: "success",
				icon: CheckCircle,
				label: "Vérifié",
			},
			pending: {
				action: "warning",
				icon: Clock,
				label: "En attente",
			},
			rejected: {
				action: "error",
				icon: AlertCircle,
				label: "Rejeté",
			},
		};

		const config = statusConfig[kbisUploadedStatus] || statusConfig.pending;

		return (
			<Badge size='md' variant='solid' action={config.action}>
				<BadgeIcon as={config.icon} />
				<BadgeText className='ml-1'>{config.label}</BadgeText>
			</Badge>
		);
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
						Vérification KBIS
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Téléchargez votre extrait KBIS de moins de 3 mois
					</Text>
				</VStack>

				{/* Status Card - Si document déjà uploadé */}
				{kbisUploadedStatus && (
					<Card
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							padding: 24,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='lg'>
							<HStack
								space='md'
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<VStack style={{ flex: 1 }} space='sm'>
									<Heading
										size='lg'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Statut du document
									</Heading>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										KBIS téléchargé
									</Text>
								</VStack>
								{getStatusBadge()}
							</HStack>

							{kbisUploadedUrl && (
								<>
									<Divider />
									<TouchableOpacity
										onPress={() => {
											// Ouvrir le document
											Linking.openURL(
												kbisUploadedUrl,
											).catch((err) =>
												console.error(
													"Erreur ouverture document:",
													err,
												),
											);
										}}
										style={{
											backgroundColor: isDark
												? "#1f2937"
												: "#f3f4f6",
											borderRadius: 8,
											padding: 16,
											borderWidth: 1,
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<HStack
											space='sm'
											style={{
												alignItems: "center",
											}}>
											<Icon
												as={FileText}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#2563eb",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
													fontWeight: "500",
													flex: 1,
												}}
												numberOfLines={1}
												ellipsizeMode='middle'>
												{kbisUploadedUrl
													.split("/")
													.pop()}
											</Text>
										</HStack>
									</TouchableOpacity>

									{kbisUploadedStatus === "rejected" && (
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#fca5a5"
														: "#dc2626",
													fontWeight: "600",
												}}>
												⚠️ Document rejeté
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#fecaca"
														: "#991b1b",
													lineHeight: 20,
												}}>
												Votre document a été rejeté.
												Veuillez soumettre un nouveau
												KBIS de moins de 3 mois.
											</Text>
										</VStack>
									)}
								</>
							)}
						</VStack>
					</Card>
				)}

				{/* Upload Card - Masqué si vérifié */}
				{kbisUploadedStatus !== "verified" && (
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
									as={FileText}
									size='xl'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}
								/>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{kbisUploadedStatus
										? "Soumettre un nouveau KBIS"
										: "Télécharger votre KBIS"}
								</Heading>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									L'extrait KBIS doit dater de moins de 3 mois
								</Text>
							</VStack>

						{/* Document sélectionné */}
						{kbisImage && (
							<HStack
								style={{
									alignItems: "center",
									justifyContent: "space-between",
									backgroundColor: isDark
										? "#1f2937"
										: "#f3f4f6",
									borderRadius: 8,
									padding: 16,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<HStack
									space='sm'
									style={{
										alignItems: "center",
										flex: 1,
									}}>
									<Icon
										as={FileText}
										size='lg'
										style={{
											color: isDark
												? "#60a5fa"
												: "#2563eb",
										}}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "500",
											flex: 1,
										}}
										numberOfLines={1}
										ellipsizeMode='middle'>
										{kbisImage.fileName ||
											kbisImage.name ||
											"Document sélectionné"}
									</Text>
								</HStack>
								<TouchableOpacity
									onPress={() => setKbisImage(null)}>
									<Icon
										as={X}
										size='lg'
										style={{
											color: isDark
												? "#ef4444"
												: "#dc2626",
										}}
									/>
								</TouchableOpacity>
							</HStack>
						)}

						{/* Upload Button */}
						{!kbisImage && (
							<Button
								size='lg'
								action='primary'
								onPress={() => setShowActionsheet(true)}
								style={{
									backgroundColor: "#3b82f6",
									borderRadius: 8,
								}}>
								<ButtonIcon as={Upload} />
								<ButtonText>
									Sélectionner un document
								</ButtonText>
							</Button>
						)}

						{/* Submit Button */}
						{kbisImage && (
							<Button
								size='lg'
								action='positive'
								onPress={handleSubmitKBIS}
								isDisabled={isSubmitting}
								style={{
									backgroundColor: "#10b981",
									borderRadius: 8,
								}}>
								<ButtonIcon as={CheckCircle} />
								<ButtonText>
									{isSubmitting
										? "Envoi en cours..."
										: "Soumettre le KBIS"}
								</ButtonText>
							</Button>
						)}
					</VStack>
				</Card>
				)}

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
							💡 À propos du KBIS
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
								lineHeight: 20,
							}}>
							L'extrait KBIS est la carte d'identité de votre
							entreprise. Il doit dater de moins de 3 mois pour
							être accepté. Vous pouvez l'obtenir gratuitement sur
							infogreffe.fr.
						</Text>
					</VStack>
				</Card>
			</VStack>

			{/* ActionSheet pour sélectionner la source */}
			<Actionsheet
				isOpen={showActionsheet}
				onClose={() => setShowActionsheet(false)}>
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

						<ActionsheetItem onPress={handleTakePhoto}>
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

						<ActionsheetItem onPress={handlePickFromGallery}>
							<Icon
								as={ImageIcon}
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

						<ActionsheetItem onPress={handlePickDocument}>
							<Icon
								as={FileUp}
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
		</ScrollView>
	);
}
