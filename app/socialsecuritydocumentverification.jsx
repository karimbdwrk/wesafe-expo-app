import React, { useState, useEffect, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import {
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import {
	CheckCircle,
	Clock,
	AlertCircle,
	CreditCard,
	FileText,
	Camera,
	Image as ImageIcon,
	Upload,
	X,
	Heart,
	Shield,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "social-security-documents";

export default function SocialSecurityDocumentVerification({ navigation }) {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { isDark } = useTheme();

	const [documentType, setDocumentType] = useState(null);
	const [documentImage, setDocumentImage] = useState(null);

	const [uploadedType, setUploadedType] = useState(null);
	const [uploadedStatus, setUploadedStatus] = useState(null);

	// Numéro de sécurité sociale
	const [socialSecurityNumber, setSocialSecurityNumber] = useState("");
	const [ssnSaved, setSsnSaved] = useState(false);
	const [ssnError, setSsnError] = useState(null);

	const scrollViewRef = useRef(null);
	const [ssnInputY, setSsnInputY] = useState(0);

	const formatSSN = (raw) => {
		const digits = raw.replace(/\D/g, "").slice(0, 15);
		const parts = [
			digits.slice(0, 1),
			digits.slice(1, 3),
			digits.slice(3, 5),
			digits.slice(5, 7),
			digits.slice(7, 10),
			digits.slice(10, 13),
			digits.slice(13, 15),
		].filter(Boolean);
		return parts.join(" ");
	};

	const handleSSNChange = (text) => {
		const formatted = formatSSN(text);
		setSocialSecurityNumber(formatted);
		setSsnSaved(false);
		setSsnError(null);
	};

	const validateSSN = () => {
		const digits = socialSecurityNumber.replace(/\D/g, "");
		if (digits.length === 0) {
			setSsnError("Le numéro de sécurité sociale est obligatoire");
			return false;
		}
		if (digits.length !== 15) {
			setSsnError("Le numéro doit contenir 15 chiffres");
			return false;
		}
		return true;
	};

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		setUploadedType(userProfile?.social_security_doc_type || null);
		setUploadedStatus(
			userProfile?.social_security_verification_status || null,
		);
	}, [userProfile]);

	/* ------------------ */
	/* Image picker       */
	/* ------------------ */

	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});

		if (!result.canceled) {
			setDocumentImage(result.assets[0]);
		}
	};

	/* ------------------ */
	/* Upload logic       */
	/* ------------------ */

	const uploadDocument = async () => {
		if (!documentImage?.uri) throw new Error("No image");

		const originalName = documentImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";

		const storageFilename = `${user.id}/social_security_${documentType}_${Date.now()}.${extension}`;

		const formData = new FormData();
		formData.append("files", {
			uri: documentImage.uri,
			name: storageFilename,
			type: `image/${extension}`,
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

	const handleSubmit = async () => {
		if (!validateSSN()) return;
		try {
			const fileUrl = await uploadDocument();

			await update("profiles", user.id, {
				social_security_doc_type: documentType,
				social_security_document_url: fileUrl,
				social_security_verification_status: "pending",
				social_security_number: socialSecurityNumber.trim(),
			});

			loadUserData(user.id, accessToken);
			setDocumentType(null);
			setDocumentImage(null);
			setSocialSecurityNumber("");
			setSsnError(null);
		} catch (error) {
			console.error("Submit error:", error);
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

		const config = statusConfig[uploadedStatus] || statusConfig.pending;

		return (
			<Badge size='md' variant='solid' action={config.action}>
				<BadgeIcon as={config.icon} />
				<BadgeText className='ml-1'>{config.label}</BadgeText>
			</Badge>
		);
	};

	const getDocumentLabel = (type) => {
		return type === "carte_vitale"
			? "Carte Vitale"
			: "Attestation de Sécurité Sociale";
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView
				ref={scrollViewRef}
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}>
				<Box style={{ padding: 20, paddingBottom: 40 }}>
					<VStack space='2xl'>
						{/* Header */}
						<VStack space='md'>
							<Heading
								size='2xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Sécurité Sociale
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Téléchargez votre Carte Vitale ou une
								attestation de Sécurité Sociale
							</Text>
						</VStack>

						{/* Status Card */}
						{uploadedStatus && (
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.05,
									shadowRadius: 8,
									elevation: 2,
								}}>
								<VStack space='md'>
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
										}}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Document actuel
										</Text>
										{getStatusBadge()}
									</HStack>

									<Divider />

									<VStack space='sm'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={
													uploadedType ===
													"carte_vitale"
														? CreditCard
														: FileText
												}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{getDocumentLabel(uploadedType)}
											</Text>
										</HStack>
										{userProfile?.social_security_number && (
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Shield}
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}
												/>
												<Text
													style={{
														color: isDark
															? "#d1d5db"
															: "#374151",
													}}>
													N°{" "}
													{formatSSN(
														userProfile.social_security_number,
													)}
												</Text>
											</HStack>
										)}
									</VStack>
								</VStack>
							</Card>
						)}
						{/* Document Type Selection */}
						{!documentType && uploadedStatus !== "verified" && (
							<VStack space='lg'>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Choisissez votre document
								</Text>

								<TouchableOpacity
									onPress={() =>
										setDocumentType("carte_vitale")
									}
									activeOpacity={0.7}>
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? "#374151"
												: "#ffffff",
											borderRadius: 12,
											borderWidth: 2,
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<HStack
											space='md'
											style={{ alignItems: "center" }}>
											<Box
												style={{
													width: 48,
													height: 48,
													borderRadius: 24,
													backgroundColor: "#dcfce7",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={CreditCard}
													size='xl'
													style={{ color: "#16a34a" }}
												/>
											</Box>
											<VStack
												style={{ flex: 1 }}
												space='xs'>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Carte Vitale
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Carte d'assurance maladie
													française
												</Text>
											</VStack>
										</HStack>
									</Card>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() =>
										setDocumentType(
											"social_security_certificate",
										)
									}
									activeOpacity={0.7}>
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? "#374151"
												: "#ffffff",
											borderRadius: 12,
											borderWidth: 2,
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<HStack
											space='md'
											style={{ alignItems: "center" }}>
											<Box
												style={{
													width: 48,
													height: 48,
													borderRadius: 24,
													backgroundColor: "#dbeafe",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={FileText}
													size='xl'
													style={{ color: "#2563eb" }}
												/>
											</Box>
											<VStack
												style={{ flex: 1 }}
												space='xs'>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Attestation de Sécurité
													Sociale
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Document officiel
													d'attestation
												</Text>
											</VStack>
										</HStack>
									</Card>
								</TouchableOpacity>
							</VStack>
						)}

						{documentType && (
							<VStack space='xl'>
								{/* Document Type Header */}
								<Card
									style={{
										padding: 16,
										backgroundColor: isDark
											? "#065f46"
											: "#dcfce7",
										borderRadius: 12,
									}}>
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
										}}>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={
													documentType ===
													"carte_vitale"
														? CreditCard
														: FileText
												}
												size='lg'
												style={{
													color: isDark
														? "#d1fae5"
														: "#16a34a",
												}}
											/>
											<Text
												size='lg'
												style={{
													fontWeight: "600",
													color: isDark
														? "#d1fae5"
														: "#14532d",
												}}>
												{getDocumentLabel(documentType)}
											</Text>
										</HStack>
										<Button
											variant='outline'
											size='sm'
											onPress={() =>
												setDocumentType(null)
											}>
											<ButtonIcon as={X} />
											<ButtonText>Changer</ButtonText>
										</Button>
									</HStack>
								</Card>

								{/* Upload Block */}
								<UploadBlock
									label='Document'
									image={documentImage}
									onPick={pickImage}
									onCamera={() =>
										navigation.navigate("CameraScreen", {
											onCapture: setDocumentImage,
										})
									}
									onRemove={() => setDocumentImage(null)}
									isDark={isDark}
								/>

								{/* SSN Input */}
								<Card
									onLayout={(e) =>
										setSsnInputY(e.nativeEvent.layout.y)
									}
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.05,
										shadowRadius: 8,
										elevation: 2,
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Shield}
												size='md'
												style={{
													color: isDark
														? "#60a5fa"
														: "#2563eb",
												}}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Numéro de sécurité sociale
											</Text>
										</HStack>
										<Input
											variant='outline'
											size='md'
											style={{
												backgroundColor: isDark
													? "#1f2937"
													: "#ffffff",
												borderColor: ssnError
													? "#ef4444"
													: isDark
														? "#4b5563"
														: "#e5e7eb",
											}}>
											<InputField
												placeholder='1 23 45 67 890 123 45'
												value={socialSecurityNumber}
												onChangeText={handleSSNChange}
												keyboardType='number-pad'
												maxLength={21}
												onFocus={() => {
													setTimeout(() => {
														scrollViewRef.current?.scrollTo(
															{
																y:
																	ssnInputY -
																	20,
																animated: true,
															},
														);
													}, 150);
												}}
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
													letterSpacing: 1,
												}}
											/>
										</Input>
										{ssnError && (
											<Text
												size='sm'
												style={{ color: "#ef4444" }}>
												{ssnError}
											</Text>
										)}
									</VStack>
								</Card>

								{/* Submit Button */}
								<Button
									size='lg'
									isDisabled={!documentImage}
									onPress={handleSubmit}
									style={{
										borderRadius: 12,
										backgroundColor: documentImage
											? "#16a34a"
											: "#d1d5db",
									}}>
									<ButtonIcon as={Upload} />
									<ButtonText
										style={{
											fontSize: 16,
											fontWeight: "600",
										}}>
										Soumettre le document
									</ButtonText>
								</Button>

								{!documentImage && (
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											textAlign: "center",
										}}>
										Veuillez ajouter une photo du document
									</Text>
								)}
							</VStack>
						)}
					</VStack>
				</Box>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

/* ------------------ */
/* Upload block       */
/* ------------------ */

function UploadBlock({ label, image, onPick, onCamera, onRemove, isDark }) {
	return (
		<Card
			style={{
				padding: 20,
				backgroundColor: isDark ? "#374151" : "#ffffff",
				borderRadius: 12,
				borderWidth: 2,
				borderColor: image ? "#10b981" : isDark ? "#4b5563" : "#e5e7eb",
				borderStyle: image ? "solid" : "dashed",
			}}>
			<VStack space='md'>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
					}}>
					<Text
						size='md'
						style={{
							fontWeight: "600",
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						{label}
					</Text>
					{image && (
						<TouchableOpacity onPress={onRemove}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: "#fee2e2",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={X}
									size='sm'
									style={{ color: "#dc2626" }}
								/>
							</Box>
						</TouchableOpacity>
					)}
				</HStack>

				{image ? (
					<Box
						style={{
							borderRadius: 8,
							overflow: "hidden",
							backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
						}}>
						<Image
							source={{ uri: image.uri }}
							alt={label}
							style={{
								width: "100%",
								height: 200,
								borderRadius: 8,
							}}
							resizeMode='cover'
						/>
					</Box>
				) : (
					<Box
						style={{
							height: 140,
							borderRadius: 8,
							backgroundColor: isDark ? "#1f2937" : "#f9fafb",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Icon
							as={ImageIcon}
							size='xl'
							style={{ color: isDark ? "#6b7280" : "#d1d5db" }}
						/>
						<Text
							size='sm'
							style={{
								color: "#9ca3af",
								marginTop: 8,
							}}>
							Aucun fichier sélectionné
						</Text>
					</Box>
				)}

				<HStack space='sm'>
					<Button
						variant='outline'
						style={{ flex: 1, borderRadius: 8 }}
						onPress={onPick}>
						<ButtonIcon as={ImageIcon} />
						<ButtonText>Galerie</ButtonText>
					</Button>
					<Button
						style={{
							flex: 1,
							borderRadius: 8,
							backgroundColor: "#16a34a",
						}}
						onPress={onCamera}>
						<ButtonIcon as={Camera} />
						<ButtonText>Caméra</ButtonText>
					</Button>
				</HStack>
			</VStack>
		</Card>
	);
}
