import React, { useState, useEffect, useRef } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
	Animated,
	TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetItem,
	ActionsheetItemText,
} from "@/components/ui/actionsheet";
import {
	ChevronLeft,
	ChevronRight,
	Camera,
	Image as ImageIcon,
	FileText,
	Upload,
	X,
	File,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { createSupabaseClient } from "@/lib/supabase";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "kbis";

const CreateCompany = () => {
	const router = useRouter();
	const { user, setJustSignup, setRole, loadSession, accessToken } =
		useAuth();
	const { create, update } = useDataContext();
	const { isDark } = useTheme();

	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);

	// Step 1
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	// Step 2
	const [siret, setSiret] = useState("");

	const formatSiret = (raw) => {
		if (raw.length <= 3) return raw;
		if (raw.length <= 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
		if (raw.length <= 9)
			return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
		return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 9)} ${raw.slice(9)}`;
	};
	const [kbisImage, setKbisImage] = useState(null);
	const [showActionsheet, setShowActionsheet] = useState(false);

	// Progress bar animation
	const PROGRESS_VALUES = [0, 100];
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: PROGRESS_VALUES[step - 1],
			duration: 400,
			useNativeDriver: false,
		}).start();
	}, [step]);

	const STEP_LABELS = ["Informations", "Documents"];

	// ─── Validation ───────────────────────────────────────────────
	const canAdvance =
		step === 1
			? name.trim().length > 0
			: step === 2
				? siret.trim().length === 14 && kbisImage !== null
				: true;

	// ─── KBIS pickers ─────────────────────────────────────────────
	const handleTakePhoto = async () => {
		setShowActionsheet(false);
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") return;
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
			allowsEditing: true,
		});
		if (!result.canceled) setKbisImage(result.assets[0]);
	};

	const handlePickFromGallery = async () => {
		setShowActionsheet(false);
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") return;
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
		});
		if (!result.canceled) setKbisImage(result.assets[0]);
	};

	const handlePickDocument = async () => {
		setShowActionsheet(false);
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*", "application/pdf"],
				copyToCacheDirectory: true,
			});
			if (!result.canceled && result.assets?.[0])
				setKbisImage(result.assets[0]);
		} catch (e) {
			console.error("Document picker error:", e);
		}
	};

	// ─── KBIS upload ──────────────────────────────────────────────
	const uploadKBIS = async () => {
		if (!kbisImage?.uri) return null;
		const formData = new FormData();
		const originalName = kbisImage.uri.split("/").pop();
		const match = /\.(\w+)$/.exec(originalName);
		const extension = match?.[1] || "jpg";
		const mimeType = kbisImage.mimeType || `image/${extension}`;
		const storageFilename = `${user.id}/kbis_${Date.now()}.${extension}`;
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

	// ─── Create company ───────────────────────────────────────────
	const handleCreateCompany = async () => {
		setSubmitting(true);
		try {
			const companyPayload = {
				id: user.id,
				name: name.trim(),
				siret: siret.trim(),
				email: user.email,
				last_minute_credits: 0,
				isConfirmed: false,
				...(description.trim() && { description: description.trim() }),
			};

			trackActivity(CREATE_COMPANY);
			const newCompanyResponse = await create(
				"companies",
				companyPayload,
			);

			const finalize = async () => {
				if (kbisImage) {
					try {
						const kbisUrl = await uploadKBIS();
						if (kbisUrl) {
							await update("companies", user.id, {
								kbis_url: kbisUrl,
								kbis_verification_status: "pending",
							});
						}
					} catch (e) {
						console.error("KBIS upload error:", e);
					}
				}
				try {
					const supabase = createSupabaseClient(accessToken);
					await supabase.functions.invoke(
						"send-company-validation-email",
						{
							body: {
								companyName: name.trim(),
								companyEmail: user.email,
							},
						},
					);
				} catch (e) {
					console.error("Erreur envoi email:", e);
				}
				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
				}
				loadSession();
				router.push("/tabs/(tabs)");
			};

			if (newCompanyResponse?.status === 201) {
				await finalize();
				return;
			}
			if (
				newCompanyResponse?.status &&
				newCompanyResponse.status !== 201
			) {
				throw new Error(
					`Échec de la création. Statut: ${newCompanyResponse.status}`,
				);
			}
		} catch (error) {
			if (error?.status === 201) {
				try {
					const supabase = createSupabaseClient(accessToken);
					await supabase.functions.invoke(
						"send-company-validation-email",
						{
							body: {
								companyName: name.trim(),
								companyEmail: user.email,
							},
						},
					);
				} catch (e) {
					console.error("Erreur envoi email:", e);
				}
				if (typeof setJustSignup === "function") {
					setJustSignup(false);
					setRole("pro");
				}
				loadSession();
				router.push("/tabs/(tabs)");
				return;
			}
			console.error("Erreur création entreprise:", error);
			Alert.alert("Erreur", "Impossible de créer l'entreprise");
		} finally {
			setSubmitting(false);
		}
	};

	// ─── Styles ───────────────────────────────────────────────────
	const bg = isDark ? "#111827" : "#f9fafb";
	const cardBg = isDark ? "#1f2937" : "#ffffff";
	const cardBorder = isDark ? "#374151" : "#e5e7eb";
	const textColor = isDark ? "#f3f4f6" : "#111827";
	const inputStyle = {
		backgroundColor: isDark ? "#374151" : "#f9fafb",
		borderColor: isDark ? "#4b5563" : "#d1d5db",
		borderRadius: 10,
		borderWidth: 1,
	};
	const inputTextStyle = { color: isDark ? "#f3f4f6" : "#111827" };
	const labelStyle = {
		fontWeight: "600",
		color: isDark ? "#d1d5db" : "#374151",
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: bg }}
			edges={["bottom"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardShouldPersistTaps='handled'>
					<VStack
						style={{
							flex: 1,
							paddingHorizontal: 24,
							paddingBottom: 120,
						}}>
						{/* Header */}
						<VStack
							style={{
								alignItems: "center",
								paddingTop: 32,
								paddingBottom: 24,
							}}>
							<Image
								source={require("@/assets/images/logo-wesafe-v2.png")}
								style={{ width: 70, height: 70 }}
								resizeMode='contain'
							/>
							<Text
								style={{
									fontSize: 22,
									fontWeight: "800",
									color: textColor,
									marginTop: 16,
									letterSpacing: -0.5,
								}}>
								Mon entreprise
							</Text>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 6,
								}}>
								Étape {step} / 2 — {STEP_LABELS[step - 1]}
							</Text>
						</VStack>

						{/* Progress bar */}
						<Box
							style={{
								height: 4,
								backgroundColor: isDark ? "#374151" : "#e5e7eb",
								borderRadius: 2,
								marginBottom: 24,
							}}>
							<Animated.View
								style={{
									height: 4,
									width: progressAnim.interpolate({
										inputRange: [0, 100],
										outputRange: ["0%", "100%"],
									}),
									backgroundColor: "#2563eb",
									borderRadius: 2,
								}}
							/>
						</Box>

						{/* ── STEP 1 : Informations ── */}
						{step === 1 && (
							<Card
								style={{
									padding: 24,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack space='lg'>
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Nom de l'entreprise *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='WeSafe SAS'
												value={name}
												onChangeText={setName}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Description
										</Text>
										<TextInput
											placeholder='Décrivez votre entreprise…'
											placeholderTextColor={
												isDark ? "#6b7280" : "#9ca3af"
											}
											value={description}
											onChangeText={setDescription}
											multiline
											numberOfLines={5}
											textAlignVertical='top'
											style={{
												backgroundColor: isDark
													? "#374151"
													: "#f9fafb",
												borderColor: isDark
													? "#4b5563"
													: "#d1d5db",
												borderWidth: 1,
												borderRadius: 10,
												padding: 12,
												color: isDark
													? "#f3f4f6"
													: "#111827",
												fontSize: 15,
												minHeight: 110,
											}}
										/>
									</VStack>
								</VStack>
							</Card>
						)}

						{/* ── STEP 2 : Documents ── */}
						{step === 2 && (
							<Card
								style={{
									padding: 24,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack space='lg'>
									{/* SIRET */}
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Numéro SIRET *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='xxx xxx xxx xxxxx'
												value={formatSiret(siret)}
												onChangeText={(t) =>
													setSiret(
														t
															.replace(/\D/g, "")
															.slice(0, 14),
													)
												}
												keyboardType='numeric'
												maxLength={18}
												style={inputTextStyle}
											/>
										</Input>
										<Text
											size='xs'
											style={{
												color:
													siret.length === 14
														? "#10b981"
														: isDark
															? "#9ca3af"
															: "#6b7280",
											}}>
											{siret.length}/14 chiffres
										</Text>
									</VStack>

									<Box
										style={{
											height: 1,
											backgroundColor: cardBorder,
										}}
									/>

									{/* KBIS */}
									<VStack space='sm'>
										<Text size='sm' style={labelStyle}>
											Extrait KBIS *
										</Text>
										<Text
											size='xs'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Obligatoire — doit dater de moins de
											3 mois
										</Text>

										{kbisImage ? (
											<HStack
												style={{
													alignItems: "center",
													justifyContent:
														"space-between",
													backgroundColor: isDark
														? "#374151"
														: "#f3f4f6",
													borderRadius: 10,
													padding: 14,
													borderWidth: 1,
													borderColor: cardBorder,
												}}>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
														flex: 1,
													}}>
													<Icon
														as={FileText}
														size='md'
														style={{
															color: isDark
																? "#60a5fa"
																: "#2563eb",
														}}
													/>
													<Text
														size='sm'
														style={{
															color: textColor,
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
													onPress={() =>
														setKbisImage(null)
													}>
													<Icon
														as={X}
														size='md'
														style={{
															color: isDark
																? "#ef4444"
																: "#dc2626",
														}}
													/>
												</TouchableOpacity>
											</HStack>
										) : (
											<Button
												onPress={() =>
													setShowActionsheet(true)
												}
												style={{
													backgroundColor: isDark
														? "#374151"
														: "#eff6ff",
													borderRadius: 10,
													borderWidth: 1,
													borderColor: isDark
														? "#4b5563"
														: "#bfdbfe",
													height: 52,
												}}>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Icon
														as={Upload}
														size='sm'
														style={{
															color: isDark
																? "#60a5fa"
																: "#2563eb",
														}}
													/>
													<ButtonText
														style={{
															color: isDark
																? "#60a5fa"
																: "#2563eb",
															fontWeight: "600",
														}}>
														Sélectionner un document
													</ButtonText>
												</HStack>
											</Button>
										)}
									</VStack>
								</VStack>
							</Card>
						)}

						{/* Navigation */}
						<HStack
							space='md'
							style={{
								marginTop: 24,
								justifyContent: "space-between",
							}}>
							{step > 1 ? (
								<Button
									variant='outline'
									style={{
										flex: 1,
										borderRadius: 12,
										height: 52,
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
									}}
									onPress={() => setStep(step - 1)}>
									<HStack
										space='xs'
										style={{ alignItems: "center" }}>
										<Icon
											as={ChevronLeft}
											size='sm'
											style={{
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}
										/>
										<ButtonText
											style={{
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}>
											Précédent
										</ButtonText>
									</HStack>
								</Button>
							) : (
								<Box style={{ flex: 1 }} />
							)}

							{step < 2 ? (
								<Button
									style={{
										flex: 1,
										backgroundColor: canAdvance
											? "#2563eb"
											: isDark
												? "#374151"
												: "#e5e7eb",
										borderRadius: 12,
										height: 52,
									}}
									onPress={() => {
										if (canAdvance) setStep(step + 1);
									}}
									disabled={!canAdvance}>
									<HStack
										space='xs'
										style={{ alignItems: "center" }}>
										<ButtonText
											style={{
												color: canAdvance
													? "#ffffff"
													: isDark
														? "#6b7280"
														: "#9ca3af",
												fontWeight: "700",
												fontSize: 16,
											}}>
											Suivant
										</ButtonText>
										<Icon
											as={ChevronRight}
											size='sm'
											style={{
												color: canAdvance
													? "#ffffff"
													: isDark
														? "#6b7280"
														: "#9ca3af",
											}}
										/>
									</HStack>
								</Button>
							) : submitting ? (
								<ActivityIndicator
									size='large'
									color={isDark ? "#60a5fa" : "#2563eb"}
									style={{ flex: 1 }}
								/>
							) : (
								<Button
									style={{
										flex: 1,
										backgroundColor: canAdvance
											? "#2563eb"
											: isDark
												? "#374151"
												: "#e5e7eb",
										borderRadius: 12,
										height: 52,
									}}
									onPress={() => {
										if (canAdvance) handleCreateCompany();
									}}
									disabled={!canAdvance}>
									<ButtonText
										style={{
											color: canAdvance
												? "#ffffff"
												: isDark
													? "#6b7280"
													: "#9ca3af",
											fontWeight: "700",
											fontSize: 16,
										}}>
										Créer mon entreprise
									</ButtonText>
								</Button>
							)}
						</HStack>
					</VStack>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Actionsheet KBIS */}
			<Actionsheet
				isOpen={showActionsheet}
				onClose={() => setShowActionsheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						paddingBottom: 32,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack style={{ width: "100%", padding: 20 }} space='sm'>
						<Text
							style={{
								fontSize: 18,
								fontWeight: "700",
								color: textColor,
								marginBottom: 8,
							}}>
							Sélectionner le KBIS
						</Text>
						<ActionsheetItem onPress={handleTakePhoto}>
							<Icon
								as={Camera}
								size='md'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText style={{ color: textColor }}>
								Prendre une photo
							</ActionsheetItemText>
						</ActionsheetItem>
						<ActionsheetItem onPress={handlePickFromGallery}>
							<Icon
								as={ImageIcon}
								size='md'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText style={{ color: textColor }}>
								Galerie photo
							</ActionsheetItemText>
						</ActionsheetItem>
						<ActionsheetItem onPress={handlePickDocument}>
							<Icon
								as={File}
								size='md'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
									marginRight: 12,
								}}
							/>
							<ActionsheetItemText style={{ color: textColor }}>
								Choisir un fichier (PDF…)
							</ActionsheetItemText>
						</ActionsheetItem>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</SafeAreaView>
	);
};

export default CreateCompany;
