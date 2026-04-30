import React, { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, Image as RNImage } from "react-native";
import axios from "axios";
import { decode } from "base64-arraybuffer";

import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import {
	PenTool,
	FileSignature,
	Edit3,
	X,
	Clock,
	CheckCircle,
	XCircle,
	ShieldCheck,
	Lightbulb,
} from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import SignatureCapture from "@/components/SignatureCapture";

import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "signatures";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const SignatureScreen = () => {
	const { setSignature, signature } = useImage();
	const {
		user,
		accessToken,
		loadUserData,
		userProfile,
		userCompany,
		refreshUser,
	} = useAuth();
	const { update, trackActivity } = useDataContext();
	const { isDark } = useTheme();
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

	const { signatureUrl, isPro, type } = useLocalSearchParams();

	const [signatureImg, setSignatureImg] = useState(null);
	const [signatureStatus, setSignatureStatus] = useState(null);
	const [showActionsheet, setShowActionsheet] = useState(false);
	// Garde l'URL uploadée localement pour éviter qu'un refresh du contexte
	// ne réécrive avec l'ancien param de navigation
	const uploadedUrlRef = React.useRef(null);

	const canEdit = signatureStatus !== "verified";

	// Lire les nouvelles valeurs après chaque refresh du contexte
	useEffect(() => {
		// Si on vient de faire un upload, ne pas laisser le param stale écraser
		if (uploadedUrlRef.current) {
			setSignatureImg(uploadedUrlRef.current);
			setSignatureStatus(
				userProfile?.signature_status ??
					userCompany?.signature_status ??
					null,
			);
			return;
		}
		if (signatureUrl) {
			setSignatureImg(signatureUrl);
		} else {
			setSignatureImg(
				userProfile?.signature_url ??
					userCompany?.signature_url ??
					null,
			);
		}
		setSignatureStatus(
			userProfile?.signature_status ??
				userCompany?.signature_status ??
				null,
		);
	}, [userProfile, userCompany, signatureUrl]);

	// Recharger depuis Supabase à chaque fois qu'on arrive sur le screen
	useFocusEffect(
		useCallback(() => {
			refreshUser();
		}, []),
	);

	const handleSaveSign = (signature) => {
		setSignatureImg(signature);
		setSignature(signature);
	};

	useEffect(() => {
		signature && handleUpload(signature);
	}, [signature]);

	const handleUpload = async (signatureBase64) => {
		try {
			const bucket = "signatures";
			const fileName = `${user.id}-${Date.now()}.png`;
			const filePath = `${bucket}/${fileName}`;

			// Strip the base64 header
			const base64Data = signatureBase64.replace(
				/^data:image\/\w+;base64,/,
				"",
			);

			// Convert base64 to ArrayBuffer (works in React Native)
			const arrayBuffer = decode(base64Data);

			const response = await fetch(
				`${SUPABASE_URL}/storage/v1/object/${filePath}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "image/png",
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
					body: arrayBuffer,
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Upload failed: ${response.status} - ${errorText}`,
				);
			}

			const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;

			// Déterminer la bonne table si le param `type` n'est pas passé
			const table = type ?? (userCompany ? "companies" : "profiles");

			await update(table, user.id, {
				signature_url: publicUrl,
				signature_status: "pending",
			});
			// Mettre à jour l'aperçu immédiatement avec la nouvelle URL
			uploadedUrlRef.current = publicUrl;
			setSignatureImg(publicUrl);
			setSignatureStatus("pending");
			trackActivity(
				signatureImg ? "signature_updated" : "signature_created",
			);
			loadUserData(user.id, accessToken);
			setSignature(null);

			console.log("✅ Upload successful:", publicUrl);
		} catch (error) {
			console.error("❌ Upload error:", error.message || error);
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
					<Text
						size='md'
						style={{
							color: muted,
						}}>
						Créez votre signature électronique pour valider vos
						documents officiels
					</Text>
				</VStack>

				{/* Preview Card */}
				{signatureImg && (
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
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									{/* <Icon
										as={FileSignature}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/> */}
									<Heading
										size='md'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Aperçu de votre signature
									</Heading>
								</HStack>

								{/* Badge statut */}
								{signatureStatus === "verified" && (
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
											Validée
										</Text>
									</HStack>
								)}
								{signatureStatus === "pending" && (
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
								{signatureStatus === "rejected" && (
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
											Refusée
										</Text>
									</HStack>
								)}
							</HStack>

							<Box
								style={{
									backgroundColor: "#ffffff",
									borderRadius: 8,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: border,
									padding: 8,
									height: 200,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<RNImage
									source={{ uri: signatureImg }}
									style={{ width: "100%", height: "100%" }}
									resizeMode='contain'
								/>
							</Box>

							{/* Message si vérifiée */}
							{signatureStatus === "verified" && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
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
										Votre signature est validée et ne peut
										plus être modifiée.
									</Text>
								</HStack>
							)}
							{/* Message préventif si pas encore validée */}
							{signatureStatus !== "verified" && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Icon
										as={ShieldCheck}
										size='xs'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
									<Text
										size='xs'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											flex: 1,
										}}>
										Une fois validée, votre signature ne
										pourra plus être modifiée.
									</Text>
								</HStack>
							)}
							{signatureStatus === "rejected" && (
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Icon
										as={XCircle}
										size='xs'
										style={{ color: danger }}
									/>
									<Text
										size='xs'
										style={{
											color: danger,
										}}>
										Votre signature a été refusée. Vous
										pouvez en soumettre une nouvelle.
									</Text>
								</HStack>
							)}
						</VStack>
					</Card>
				)}

				{/* Signature Action Card — masquée si acceptée */}
				{canEdit && (
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
									as={PenTool}
									size='lg'
									style={{
										color: muted,
									}}
								/>
								<Heading
									size='lg'
									style={{
										color: textPrimary,
									}}>
									{signatureImg
										? "Modifier la signature"
										: "Créer une signature"}
								</Heading>
								<Text
									size='sm'
									style={{
										color: muted,
									}}>
									Ouvrez l'outil de signature pour dessiner
									avec votre doigt
								</Text>
							</VStack>

							<Button
								size='lg'
								action='primary'
								onPress={() => setShowActionsheet(true)}
								style={{
									backgroundColor: tint,
									borderRadius: 8,
								}}>
								<ButtonIcon
									as={Edit3}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									{signatureImg
										? "Modifier"
										: "Créer ma signature"}
								</ButtonText>
							</Button>
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
								À propos de la signature
							</Text>
						</HStack>
						<Text
							size='sm'
							style={{
								color: tint,
								lineHeight: 20,
							}}>
							Votre signature électronique sera utilisée pour
							signer vos documents officiels et contrats. Elle a
							la même valeur juridique qu'une signature
							manuscrite.
						</Text>
					</VStack>
				</Card>
			</VStack>

			{/* ActionSheet pour la signature */}
			<Actionsheet
				isOpen={showActionsheet}
				onClose={() => setShowActionsheet(false)}
				snapPoints={[55]}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: bg,
						paddingHorizontal: 0,
						paddingBottom: 0,
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator
							style={{
								backgroundColor: border,
							}}
						/>
					</ActionsheetDragIndicatorWrapper>

					<VStack style={{ width: "100%", flex: 1 }}>
						{/* Header */}
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 20,
								paddingVertical: 16,
								borderBottomWidth: 1,
								borderBottomColor: isDark
									? "#374151"
									: "#e5e7eb",
							}}>
							<HStack
								space='md'
								style={{ alignItems: "center", flex: 1 }}>
								<Box
									style={{
										width: 40,
										height: 40,
										borderRadius: 10,
										backgroundColor: tint20,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={signatureImg ? Edit3 : PenTool}
										size='sm'
										style={{ color: tint }}
									/>
								</Box>
								<VStack space='xs'>
									<Heading
										size='lg'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										{signatureImg ? "Modifier" : "Créer"}{" "}
										votre signature
									</Heading>
									<Text
										size='xs'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Dessinez avec votre doigt dans la zone
										ci-dessous
									</Text>
								</VStack>
							</HStack>
							<TouchableOpacity
								onPress={() => setShowActionsheet(false)}
								style={{
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: isDark
										? "#374151"
										: "#f3f4f6",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={X}
									size='sm'
									style={{
										color: muted,
									}}
								/>
							</TouchableOpacity>
						</HStack>

						{/* Canvas paysage */}
						<Box
							style={{
								marginHorizontal: 16,
								marginTop: 12,
								marginBottom: 4,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: border,
								backgroundColor: cardBg,
								overflow: "hidden",
							}}>
							<SignatureCapture
								onSave={(sig) => {
									handleSaveSign(sig);
									setShowActionsheet(false);
								}}
							/>
						</Box>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</ScrollView>
	);
};

export default SignatureScreen;
