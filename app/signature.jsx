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
import { PenTool, FileSignature, Edit3, X } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import SignatureCapture from "@/components/SignatureCapture";

import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "signatures";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const SignatureScreen = () => {
	const { setSignature, signature } = useImage();
	const { user, accessToken, loadUserData, userProfile, userCompany } =
		useAuth();
	const { update, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const { signatureUrl, isPro, type } = useLocalSearchParams();

	const [signatureImg, setSignatureImg] = useState(null);
	const [showActionsheet, setShowActionsheet] = useState(false);

	useFocusEffect(
		useCallback(() => {
			if (signatureUrl) {
				setSignatureImg(signatureUrl);
			} else {
				// Fallback : charger depuis le profil si le param n'est pas passé
				const url =
					userProfile?.signature_url ??
					userCompany?.signature_url ??
					null;
				setSignatureImg(url);
			}
		}, [
			signatureUrl,
			userProfile?.signature_url,
			userCompany?.signature_url,
		]),
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
			});
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
						Signature électronique
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}>
						Créez votre signature pour valider vos documents
						officiels
					</Text>
				</VStack>

				{/* Preview Card */}
				{signatureImg && (
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
									Aperçu de votre signature
								</Heading>
							</VStack>

							<Box
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderRadius: 8,
									borderWidth: 2,
									borderStyle: "dashed",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
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
						</VStack>
					</Card>
				)}

				{/* Signature Action Card */}
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
								as={PenTool}
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
								{signatureImg
									? "Modifier la signature"
									: "Créer une signature"}
							</Heading>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Ouvrez l'outil de signature pour dessiner avec
								votre doigt
							</Text>
						</VStack>

						<Button
							size='lg'
							action='primary'
							onPress={() => setShowActionsheet(true)}
							style={{
								backgroundColor: "#3b82f6",
								borderRadius: 8,
							}}>
							<ButtonIcon as={Edit3} />
							<ButtonText>
								{signatureImg
									? "Modifier"
									: "Créer ma signature"}
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
							💡 À propos de la signature
						</Text>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
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
						backgroundColor: isDark ? "#1f2937" : "#f9fafb",
						paddingHorizontal: 0,
						paddingBottom: 0,
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator
							style={{
								backgroundColor: isDark ? "#4b5563" : "#d1d5db",
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
										backgroundColor: isDark
											? "rgba(59, 130, 246, 0.2)"
											: "rgba(59, 130, 246, 0.1)",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={signatureImg ? Edit3 : PenTool}
										size='sm'
										style={{ color: "#3b82f6" }}
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
										color: isDark ? "#9ca3af" : "#6b7280",
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
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
								backgroundColor: isDark ? "#374151" : "#ffffff",
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
