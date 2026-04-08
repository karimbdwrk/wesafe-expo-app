import React, { useState, useEffect, useCallback, useRef } from "react";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import {
	ScrollView,
	TouchableOpacity,
	Linking,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";

import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
import {
	CheckCircle,
	Clock,
	AlertCircle,
	FileText,
	Upload,
	X,
	Lightbulb,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { SUBMIT_KBIS_DOCUMENT } from "@/utils/activityEvents";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "kbis";

export default function KBISDocumentVerification() {
	const router = useRouter();
	const { user, userCompany, accessToken, loadUserData } = useAuth();
	const { update, getAll, getById, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const elevated = isDark ? Colors.dark.elevated : Colors.light.elevated;
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
	const toast = useToast();

	const [kbisImage, setKbisImage] = useState(null);
	const scrollViewRef = useRef(null);

	const [siret, setSiret] = useState("");
	const [savedSiret, setSavedSiret] = useState("");

	const formatSiret = (raw) => {
		if (raw.length <= 3) return raw;
		if (raw.length <= 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
		if (raw.length <= 9)
			return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
		return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 9)} ${raw.slice(9)}`;
	};

	const [kbisUploadedStatus, setKbisUploadedStatus] = useState(null);
	const [kbisUploadedUrl, setKbisUploadedUrl] = useState(null);

	const [isSubmitting, setIsSubmitting] = useState(false);

	useFocusEffect(
		useCallback(() => {
			console.log("KBIS Verification Screen focused");
			loadCompanyData();
			markKbisNotificationsRead();
		}, []),
	);

	const markKbisNotificationsRead = async () => {
		if (!user?.id) return;
		try {
			const { data: unread } = await getAll(
				"notifications",
				"id",
				`&recipient_id=eq.${user.id}&type=eq.kbis_status_update&is_read=eq.false`,
				1,
				50,
			);
			if (!unread?.length) return;
			const now = new Date().toISOString();
			await Promise.all(
				unread.map((n) =>
					update("notifications", n.id, {
						is_read: true,
						read_at: now,
						updated_at: now,
					}),
				),
			);
		} catch (error) {
			console.error("Error marking kbis notifications as read:", error);
		}
	};

	const loadCompanyData = async () => {
		try {
			if (user?.id) {
				const companyData = await getById(
					"companies",
					user.id,
					"kbis_verification_status,kbis_url,siret",
				);

				if (companyData) {
					setKbisUploadedStatus(companyData.kbis_verification_status);
					setKbisUploadedUrl(companyData.kbis_url);
					if (companyData.siret) setSavedSiret(companyData.siret);

					console.log("Loaded company data:", {
						kbis_verification_status:
							companyData.kbis_verification_status,
						kbis_url: companyData.kbis_url,
					});
				}
			}
		} catch (error) {
			console.error("Error loading company data:", error);
		}
	};

	useEffect(() => {
		loadCompanyData();
	}, [userCompany]);

	useEffect(() => {
		console.log("KBIS Uploaded Status:", kbisUploadedStatus);
	}, [kbisUploadedStatus]);

	/* ------------------ */
	/* PDF picker         */
	/* ------------------ */

	const handlePickPDF = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/pdf",
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
		const extension = match?.[1] || "pdf";
		const mimeType = kbisImage.mimeType || "application/pdf";

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
		trackActivity(SUBMIT_KBIS_DOCUMENT);
		console.log("Submitting KBIS...");
		setIsSubmitting(true);
		try {
			const kbisUrl = await uploadKBIS();

			const updatePayload = {
				kbis_url: kbisUrl,
				kbis_verification_status: "pending",
				...(siret.trim().length === 14 && { siret: siret.trim() }),
			};
			await update("companies", userCompany.id, updatePayload);

			console.log("KBIS submitted successfully");

			// Recharger les données
			await loadUserData(user.id, accessToken);

			// Réinitialiser le formulaire
			setKbisImage(null);
			if (siret.trim().length === 14) setSavedSiret(siret.trim());
			setSiret("");

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={CheckCircle}
						color={
							isDark ? Colors.dark.success : Colors.light.success
						}
						title='KBIS soumis avec succès !'
						description='Votre KBIS est en cours de vérification.'
					/>
				),
			});
		} catch (error) {
			console.error("Submit KBIS error:", error);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title='Erreur lors de la soumission'
						description="Une erreur est survenue lors de l'envoi de votre KBIS. Veuillez réessayer."
					/>
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
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView
				ref={scrollViewRef}
				style={{
					flex: 1,
					backgroundColor: bg,
				}}
				contentContainerStyle={{ padding: 20 }}
				keyboardShouldPersistTaps='handled'>
				<VStack space='xl'>
					{/* Header */}
					<VStack space='md'>
						<Text
							size='md'
							style={{
								color: muted,
							}}>
							Téléchargez votre extrait KBIS de moins de 3 mois
						</Text>
					</VStack>

					{/* Status Card - Si document déjà uploadé */}
					{kbisUploadedStatus && (
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
									space='md'
									style={{
										alignItems: "center",
										justifyContent: "space-between",
									}}>
									<VStack style={{ flex: 1 }} space='sm'>
										<Heading
											size='lg'
											style={{
												color: textPrimary,
											}}>
											Statut du document
										</Heading>
										<Text
											size='sm'
											style={{
												color: muted,
											}}>
											KBIS téléchargé
										</Text>
										{savedSiret.length > 0 && (
											<Text
												size='sm'
												style={{
													color: textPrimary,
													fontWeight: "600",
													fontFamily: "monospace",
												}}>
												SIRET :{" "}
												{formatSiret(savedSiret)}
											</Text>
										)}
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
												backgroundColor: elevated,
												borderRadius: 8,
												padding: 16,
												borderWidth: 1,
												borderColor: border,
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
														color: tint,
													}}
												/>
												<Text
													size='sm'
													style={{
														color: textPrimary,
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
														color: danger,
														fontWeight: "600",
													}}>
													⚠️ Document rejeté
												</Text>
												<Text
													size='sm'
													style={{
														color: danger,
														lineHeight: 20,
													}}>
													Votre document a été rejeté.
													Veuillez soumettre un
													nouveau KBIS de moins de 3
													mois.
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
								backgroundColor: cardBg,
								borderRadius: 12,
								padding: 24,
								borderWidth: 1,
								borderColor: border,
							}}>
							<VStack space='lg'>
								<VStack space='sm'>
									<Icon
										as={FileText}
										size='xl'
										style={{
											color: muted,
										}}
									/>
									<Heading
										size='lg'
										style={{
											color: textPrimary,
										}}>
										{kbisUploadedStatus
											? "Soumettre un nouveau KBIS"
											: "Télécharger votre KBIS"}
									</Heading>
									<Text
										size='sm'
										style={{
											color: muted,
										}}>
										L'extrait KBIS doit dater de moins de 3
										mois
									</Text>
								</VStack>

								{/* SIRET input */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Numéro SIRET *
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: border,
											borderRadius: 8,
											borderWidth: 1,
										}}>
										<InputField
											placeholder='XXX XXX XXX XXXXX'
											value={formatSiret(siret)}
											onChangeText={(t) =>
												setSiret(
													t
														.replace(/\D/g, "")
														.slice(0, 14),
												)
											}
											onFocus={() =>
												scrollViewRef.current?.scrollToEnd(
													{ animated: true },
												)
											}
											keyboardType='numeric'
											maxLength={18}
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
									<Text
										size='xs'
										style={{
											color:
												siret.length === 14
													? success
													: muted,
										}}>
										{siret.length}/14 chiffres
									</Text>
								</VStack>

								{/* Document sélectionné */}
								{kbisImage && (
									<HStack
										style={{
											alignItems: "center",
											justifyContent: "space-between",
											backgroundColor: elevated,
											borderRadius: 8,
											padding: 16,
											borderWidth: 1,
											borderColor: border,
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
													color: textPrimary,
												}}
											/>
											<Text
												size='sm'
												style={{
													color: textPrimary,
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
													color: danger,
												}}
											/>
										</TouchableOpacity>
									</HStack>
								)}

								{/* Upload Button */}
								{!kbisImage && (
									<VStack space='sm'>
										<HStack
											space='xs'
											style={{ alignItems: "center" }}>
											<Icon
												as={FileText}
												size='sm'
												style={{ color: muted }}
											/>
											<Text
												size='xs'
												style={{ color: muted }}>
												Uniquement les fichiers PDF sont
												acceptés
											</Text>
										</HStack>
										<Button
											size='lg'
											action='primary'
											onPress={handlePickPDF}
											style={{
												backgroundColor: tint,
												borderRadius: 8,
											}}>
											<ButtonIcon
												as={Upload}
												style={{ color: "#ffffff" }}
											/>
											<ButtonText
												style={{ color: "#ffffff" }}>
												Sélectionner un PDF
											</ButtonText>
										</Button>
									</VStack>
								)}

								{/* Submit Button */}
								{kbisImage && (
									<Button
										size='lg'
										action='positive'
										onPress={handleSubmitKBIS}
										isDisabled={
											isSubmitting || siret.length !== 14
										}
										style={{
											backgroundColor: success,
											borderRadius: 8,
										}}>
										<ButtonIcon
											as={CheckCircle}
											color='#ffffff'
										/>
										<ButtonText
											style={{ color: "#ffffff" }}>
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
							backgroundColor: tint20,
							borderRadius: 12,
							padding: 16,
							borderWidth: 1,
							borderColor: tint20,
						}}>
						<VStack space='sm'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Lightbulb color={tint} size={14} />
								<Text
									size='sm'
									style={{
										color: tint,
										fontWeight: "600",
									}}>
									À propos du KBIS
								</Text>
							</HStack>
							<Text
								size='sm'
								style={{
									color: tint,
									lineHeight: 20,
								}}>
								L'extrait KBIS est la carte d'identité de votre
								entreprise. Il doit dater de moins de 3 mois
								pour être accepté. Vous pouvez l'obtenir
								gratuitement sur infogreffe.fr.
							</Text>
						</VStack>
					</Card>
				</VStack>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
