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
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
	Select,
	SelectTrigger,
	SelectInput,
	SelectIcon,
	SelectPortal,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicatorWrapper,
	SelectDragIndicator,
	SelectItem,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import {
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	FileText,
	MapPin,
	Upload,
	X,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import LogoTitle from "@/assets/icons/Logo";
import Colors from "@/constants/Colors";
import { regions } from "@/constants/regions";
import { createSupabaseClient } from "@/lib/supabase";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const DOCUMENTS_BUCKET = "kbis";

const LEGAL_FORMS = [
	{ label: "SASU — SAS Unipersonnelle", value: "SASU" },
	{ label: "SAS — Société par Actions Simplifiée", value: "SAS" },
	{ label: "EURL — SARL Unipersonnelle", value: "EURL" },
	{ label: "SARL — Société à Responsabilité Limitée", value: "SARL" },
	{ label: "ME — Micro-entreprise", value: "ME" },
	{ label: "EI — Entreprise Individuelle", value: "EI" },
	{ label: "SA — Société Anonyme", value: "SA" },
];

const CreateCompany = () => {
	const router = useRouter();
	const { user, setJustSignup, setRole, loadSession, accessToken } =
		useAuth();
	const { create, update, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);

	const scrollRef = useRef(null);
	const phoneRef = useRef(null);
	const nameRef = useRef(null);
	const legalLastnameRef = useRef(null);
	const legalFirstnameRef = useRef(null);
	const descriptionRef = useRef(null);
	const siretRef = useRef(null);
	const addrRef = useRef(null);

	const scrollToInput = (ref) => {
		if (ref?.current && scrollRef.current) {
			setTimeout(() => {
				ref.current.measureLayout(
					scrollRef.current,
					(x, y) => {
						scrollRef.current.scrollTo({
							y: y - 100,
							animated: true,
						});
					},
					() => {},
				);
			}, 100);
		}
	};

	// Step 1
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [legalLastname, setLegalLastname] = useState("");
	const [legalFirstname, setLegalFirstname] = useState("");
	const [phone, setPhone] = useState("");

	const formatPhone = (val) => {
		let digits = val.replace(/\D/g, "");
		if (digits.startsWith("0")) digits = digits.slice(1);
		if (digits.length > 0 && digits[0] !== "6" && digits[0] !== "7") {
			digits = "";
		}
		digits = digits.slice(0, 9);
		let formatted = "";
		for (let i = 0; i < digits.length; i++) {
			if (i === 1 || i === 3 || i === 5 || i === 7) formatted += " ";
			formatted += digits[i];
		}
		return formatted;
	};

	// Step 2
	const [siret, setSiret] = useState("");
	const [legalForm, setLegalForm] = useState("");

	// Step 3
	const [addrQuery, setAddrQuery] = useState("");
	const [addrResults, setAddrResults] = useState([]);
	const [addrSelected, setAddrSelected] = useState(null);
	const [addrLoading, setAddrLoading] = useState(false);

	const searchAddress = async (query) => {
		if (!query || query.length < 3) {
			setAddrResults([]);
			return;
		}
		setAddrLoading(true);
		try {
			const res = await fetch(
				`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6`,
			);
			const data = await res.json();
			setAddrResults(
				(data.features || []).map((item) => {
					const ctx = (item.properties.context || "").split(", ");
					const regionName = ctx[2] || "";
					return {
						label: item.properties.label,
						street: item.properties.name,
						city: item.properties.city,
						postcode: item.properties.postcode,
						// latitude: item.geometry?.coordinates?.[1] ?? null,
						// longitude: item.geometry?.coordinates?.[0] ?? null,
						// department_code: ctx[0] || "",
						// department: ctx[1] || "",
						// region: regionName,
						// region_code:
						// 	regions.find((r) => r.nom === regionName)?.code ||
						// 	"",
					};
				}),
			);
		} catch {
			setAddrResults([]);
		} finally {
			setAddrLoading(false);
		}
	};

	const formatSiret = (raw) => {
		if (raw.length <= 3) return raw;
		if (raw.length <= 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
		if (raw.length <= 9)
			return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
		return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 9)} ${raw.slice(9)}`;
	};
	const [kbisImage, setKbisImage] = useState(null);

	// Progress bar animation
	const PROGRESS_VALUES = [0, 50, 100];
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: PROGRESS_VALUES[step - 1],
			duration: 400,
			useNativeDriver: false,
		}).start();
	}, [step]);

	const STEP_LABELS = ["Informations", "Documents", "Siège social"];

	// ─── Validation ───────────────────────────────────────────────
	const canAdvance =
		step === 1
			? name.trim().length > 0 &&
				description.trim().length > 0 &&
				legalLastname.trim().length > 0 &&
				legalFirstname.trim().length > 0
			: step === 2
				? siret.trim().length === 14 && kbisImage !== null
				: true;

	// ─── KBIS picker ─────────────────────────────────────────────
	const handlePickDocument = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["application/pdf"],
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
				...(phone.replace(/\s/g, "").length === 9 && {
					phone: `+33${phone.replace(/\s/g, "")}`,
				}),
				...(phone.replace(/\s/g, "").length === 9 && {
					phone: `+33${phone.replace(/\s/g, "")}`,
				}),
				last_minute_credits: 0,
				isConfirmed: false,
				description: description.trim(),
				legal_representative_lastname: legalLastname.trim(),
				legal_representative_firstname: legalFirstname.trim(),
				...(legalForm && { legal_form: legalForm }),
				...(addrSelected && {
					street: addrSelected.street,
					city: addrSelected.city,
					postcode: addrSelected.postcode,
					department: addrSelected.department,
					department_code: addrSelected.department_code,
					region: addrSelected.region,
					region_code: addrSelected.region_code,
					latitude: addrSelected.latitude,
					longitude: addrSelected.longitude,
				}),
			};

			trackActivity("company_created");
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
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark ? Colors.dark.elevated : Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textColor = isDark ? Colors.dark.text : Colors.light.text;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const inputStyle = {
		backgroundColor: isDark ? Colors.dark.elevated : Colors.light.elevated,
		borderColor: isDark ? Colors.dark.border : Colors.light.border,
		borderRadius: 10,
		borderWidth: 1,
	};
	const inputTextStyle = { color: textColor };
	const labelStyle = {
		fontWeight: "600",
		color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: bg }}
			edges={["bottom"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<ScrollView
					ref={scrollRef}
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardShouldPersistTaps='handled'>
					<VStack
						style={{
							flex: 1,
							paddingHorizontal: 10,
							paddingBottom: 120,
						}}>
						{/* Header */}
						<VStack
							style={{
								alignItems: "center",
								paddingTop: 32,
								paddingBottom: 24,
							}}>
							<LogoTitle
								colorScheme={isDark ? "dark" : "light"}
								size={70}
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
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
									marginTop: 6,
								}}>
								Étape {step} / 3 — {STEP_LABELS[step - 1]}
							</Text>
						</VStack>

						{/* Progress bar */}
						<Box
							style={{
								height: 4,
								backgroundColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
									backgroundColor: tint,
									borderRadius: 2,
								}}
							/>
						</Box>

						{/* ── STEP 1 : Informations ── */}
						{step === 1 && (
							<Card
								style={{
									paddingHorizontal: 15,
									paddingVertical: 20,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack space='lg'>
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Email
										</Text>
										<Input
											style={[
												inputStyle,
												{ opacity: 0.6 },
											]}>
											<InputField
												value={user?.email || ""}
												editable={false}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Téléphone mobile
										</Text>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Box
												style={[
													inputStyle,
													{
														height: 44,
														paddingHorizontal: 12,
														justifyContent:
															"center",
														alignItems: "center",
														opacity: 0.6,
													},
												]}>
												<Text
													style={[
														inputTextStyle,
														{
															fontWeight: "600",
															fontSize: 15,
														},
													]}>
													+33
												</Text>
											</Box>
											<Input
												style={[
													inputStyle,
													{ flex: 1 },
												]}>
												<InputField
													placeholder='6 XX XX XX XX'
													ref={phoneRef}
													onFocus={() => scrollToInput(phoneRef)}
													value={phone}
													onChangeText={(val) =>
														setPhone(
															formatPhone(val),
														)
													}
													keyboardType='phone-pad'
													maxLength={13}
													style={inputTextStyle}
												/>
											</Input>
										</HStack>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Nom de l'entreprise *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='WeSafe SAS'
												ref={nameRef}
												onFocus={() => scrollToInput(nameRef)}
												value={name}
												onChangeText={setName}
												style={inputTextStyle}
												autoCapitalize='sentences'
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Nom du représentant légal *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='Dupont'
												ref={legalLastnameRef}
												onFocus={() => scrollToInput(legalLastnameRef)}
												value={legalLastname}
												onChangeText={setLegalLastname}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Prénom du représentant légal *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='Jean'
												ref={legalFirstnameRef}
												onFocus={() => scrollToInput(legalFirstnameRef)}
												value={legalFirstname}
												onChangeText={setLegalFirstname}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Description *
										</Text>
										<TextInput
											ref={descriptionRef}
											onFocus={() => scrollToInput(descriptionRef)}
											placeholder='Décrivez votre entreprise…'
											placeholderTextColor={
												isDark
													? Colors.dark.muted
													: Colors.light.muted
											}
											value={description}
											onChangeText={setDescription}
											multiline
											numberOfLines={5}
											textAlignVertical='top'
											autoCapitalize='sentences'
											style={{
												backgroundColor: isDark
													? Colors.dark.elevated
													: Colors.light.elevated,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
												borderWidth: 1,
												borderRadius: 10,
												padding: 12,
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
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
									paddingHorizontal: 15,
									paddingVertical: 20,
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
												ref={siretRef}
												onFocus={() => scrollToInput(siretRef)}
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
														? Colors.light.success
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
											}}>
											{siret.length}/14 chiffres
										</Text>
									</VStack>

									{/* Forme juridique */}
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Forme juridique
										</Text>
										<Select
											selectedValue={legalForm}
											onValueChange={setLegalForm}>
											<SelectTrigger
												variant='outline'
												size='md'
												style={{
													backgroundColor: isDark
														? Colors.dark.elevated
														: Colors.light
																.background,
													borderColor: cardBorder,
													borderRadius: 10,
												}}>
												<SelectInput
													placeholder='Sélectionnez une forme juridique'
													style={{
														color: legalForm
															? isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text
															: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
													}}
												/>
												<SelectIcon as={ChevronDown} />
											</SelectTrigger>
											<SelectPortal>
												<SelectBackdrop />
												<SelectContent>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
													{LEGAL_FORMS.map((f) => (
														<SelectItem
															key={f.value}
															label={f.label}
															value={f.value}
														/>
													))}
												</SelectContent>
											</SelectPortal>
										</Select>
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
													? Colors.dark.muted
													: Colors.light.muted,
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
														? Colors.dark.elevated
														: Colors.light.elevated,
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
																? Colors.dark
																		.tint
																: tint,
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
																? Colors.dark
																		.danger
																: Colors.light
																		.danger,
														}}
													/>
												</TouchableOpacity>
											</HStack>
										) : (
											<Button
												onPress={handlePickDocument}
												style={{
													backgroundColor: isDark
														? Colors.dark.elevated
														: Colors.light.tint20,
													borderRadius: 10,
													borderWidth: 1,
													borderColor: isDark
														? Colors.dark.border
														: Colors.light.tint20,
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
																? Colors.dark
																		.tint
																: tint,
														}}
													/>
													<ButtonText
														style={{
															color: isDark
																? Colors.dark
																		.tint
																: tint,
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

						{/* ── STEP 3 : Siège social ── */}
						{step === 3 && (
							<Card
								style={{
									paddingHorizontal: 15,
									paddingVertical: 20,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack space='lg'>
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Adresse du siège social
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='8 rue de la Paix, Paris...'
												ref={addrRef}
												onFocus={() => scrollToInput(addrRef)}
												value={addrQuery}
												onChangeText={(v) => {
													setAddrQuery(v);
													setAddrSelected(null);
													searchAddress(v);
												}}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									{addrLoading && (
										<ActivityIndicator
											size='small'
											color={tint}
										/>
									)}

									{addrResults.length > 0 &&
										!addrSelected && (
											<VStack space='xs'>
												{addrResults.map((item, i) => (
													<Button
														key={i}
														variant='outline'
														style={{
															borderColor:
																cardBorder,
															borderRadius: 10,
															justifyContent:
																"flex-start",
															height: "auto",
															paddingVertical: 10,
														}}
														onPress={() => {
															setAddrSelected(
																item,
															);
															setAddrQuery(
																item.label,
															);
															setAddrResults([]);
														}}>
														<HStack
															space='sm'
															style={{
																alignItems:
																	"center",
																flex: 1,
															}}>
															<MapPin
																size={14}
																color={muted}
															/>
															<VStack
																style={{
																	flex: 1,
																}}>
																<ButtonText
																	style={{
																		color: textColor,
																		fontWeight:
																			"600",
																		fontSize: 13,
																		textAlign:
																			"left",
																	}}>
																	{
																		item.street
																	}
																</ButtonText>
																<ButtonText
																	style={{
																		color: muted,
																		fontSize: 12,
																		textAlign:
																			"left",
																	}}>
																	{
																		item.postcode
																	}{" "}
																	{item.city}
																</ButtonText>
															</VStack>
														</HStack>
													</Button>
												))}
											</VStack>
										)}

									{addrSelected && (
										<HStack
											space='sm'
											style={{
												alignItems: "center",
												padding: 12,
												borderRadius: 10,
												borderWidth: 2,
												borderColor: tint,
												backgroundColor: isDark
													? Colors.dark.tint20
													: Colors.light.tint20,
											}}>
											<MapPin size={16} color={tint} />
											<VStack style={{ flex: 1 }}>
												<Text
													style={{
														fontWeight: "700",
														color: textColor,
														fontSize: 14,
													}}>
													{addrSelected.label}
												</Text>
												<Text
													size='xs'
													style={{ color: muted }}>
													{addrSelected.department} —{" "}
													{addrSelected.region}
												</Text>
											</VStack>
										</HStack>
									)}

									<Text size='xs' style={{ color: muted }}>
										Ce champ est optionnel, vous pourrez le
										renseigner plus tard.
									</Text>
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
							{step > 1 && (
								<Button
									variant='outline'
									style={{
										flex: 1,
										borderRadius: 12,
										height: 52,
										borderColor: isDark
											? Colors.dark.border
											: Colors.light.border,
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
													? Colors.dark.textSecondary
													: Colors.light
															.textSecondary,
											}}
										/>
										<ButtonText
											style={{
												color: isDark
													? Colors.dark.textSecondary
													: Colors.light
															.textSecondary,
											}}>
											Précédent
										</ButtonText>
									</HStack>
								</Button>
							)}

							{step < 3 ? (
								<Button
									style={{
										flex: 1,
										backgroundColor: canAdvance
											? tint
											: isDark
												? Colors.dark.cardBackground
												: Colors.light.border,
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
													: muted,
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
													: muted,
											}}
										/>
									</HStack>
								</Button>
							) : submitting ? (
								<ActivityIndicator
									size='large'
									color={tint}
									style={{ flex: 1 }}
								/>
							) : (
								<Button
									style={{
										flex: 1,
										backgroundColor: tint,
										borderRadius: 12,
										height: 52,
									}}
									onPress={handleCreateCompany}>
									<ButtonText
										style={{
											color: "#ffffff",
											fontWeight: "700",
											fontSize: 14,
										}}>
										Créer mon entreprise
									</ButtonText>
								</Button>
							)}
						</HStack>
					</VStack>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default CreateCompany;
