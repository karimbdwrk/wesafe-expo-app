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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
} from "@/components/ui/actionsheet";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	X,
	MapPin,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { CREATE_PROFILE } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";

const GENDERS = [
	{ label: "Homme", value: "male" },
	{ label: "Femme", value: "female" },
];

const CreateProfile = () => {
	const router = useRouter();
	const { user, setJustSignup, loadSession, role } = useAuth();
	const { create, trackActivity } = useDataContext();
	const { isDark } = useTheme();

	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);

	const PROGRESS_VALUES = [0, 33, 67, 100];
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: PROGRESS_VALUES[step - 1],
			duration: 400,
			useNativeDriver: false,
		}).start();
	}, [step]);

	// Step 1
	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const DEFAULT_DATE = new Date(1990, 0, 1);
	const [birthdayDate, setBirthdayDate] = useState(DEFAULT_DATE);
	const [birthdaySet, setBirthdaySet] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [gender, setGender] = useState("");

	const formatDate = (d) =>
		`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

	const formatName = (val) => {
		const cleaned = val.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ \-]/g, "");
		return cleaned
			.toLowerCase()
			.replace(
				/(^|[\s\-])(\S)/g,
				(_, sep, char) => sep + char.toUpperCase(),
			);
	};

	// Step 2
	const [postalCode, setPostalCode] = useState("");
	const [communes, setCommunes] = useState([]);
	const [selectedCommune, setSelectedCommune] = useState(null);
	const [fetchingCommunes, setFetchingCommunes] = useState(false);
	const [communeError, setCommuneError] = useState("");

	// Step 3
	const [height, setHeight] = useState("");
	const [weight, setWeight] = useState("");
	const [licenseInput, setLicenseInput] = useState("");
	const [licenses, setLicenses] = useState([]);
	const [languageInput, setLanguageInput] = useState("");
	const [languages, setLanguages] = useState([]);

	const fetchCommunes = async () => {
		if (postalCode.length < 5) {
			setCommuneError(
				"Veuillez entrer un code postal valide (5 chiffres)",
			);
			return;
		}
		setFetchingCommunes(true);
		setCommuneError("");
		setCommunes([]);
		setSelectedCommune(null);
		try {
			const res = await fetch(
				`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,departement,region,centre&format=json`,
			);
			const data = await res.json();
			if (!data || data.length === 0) {
				setCommuneError("Aucune ville trouvée pour ce code postal");
			} else {
				setCommunes(data);
			}
		} catch {
			setCommuneError("Erreur lors de la recherche");
		} finally {
			setFetchingCommunes(false);
		}
	};

	const addLicense = () => {
		const val = licenseInput.trim().toUpperCase();
		if (val && !licenses.includes(val)) setLicenses([...licenses, val]);
		setLicenseInput("");
	};

	const addLanguage = () => {
		const val = languageInput.trim();
		if (val && !languages.includes(val)) setLanguages([...languages, val]);
		setLanguageInput("");
	};

	const handleCreateProfile = async () => {
		if (!firstname.trim() || !lastname.trim()) {
			Alert.alert("Erreur", "Merci de remplir votre nom et prénom");
			return;
		}
		setSubmitting(true);
		try {
			const profileData = {
				lastname,
				firstname,
				email: user.email,
				...(birthdaySet && {
					birthday: `${birthdayDate.getFullYear()}-${String(birthdayDate.getMonth() + 1).padStart(2, "0")}-${String(birthdayDate.getDate()).padStart(2, "0")}`,
				}),
				...(gender && { gender }),
				...(selectedCommune && {
					city: selectedCommune.nom,
					department: selectedCommune.departement?.nom,
					region: selectedCommune.region?.nom,
					department_code: selectedCommune.codeDepartement,
					region_code: selectedCommune.codeRegion,
					latitude: selectedCommune.centre?.coordinates?.[1],
					longitude: selectedCommune.centre?.coordinates?.[0],
				}),
				...(height && { height: parseFloat(height) }),
				...(weight && { weight: parseFloat(weight) }),
				...(licenses.length > 0 && {
					driving_licenses: licenses.join(", "),
				}),
				...(languages.length > 0 && {
					languages: languages.join(", "),
				}),
				profile_status: "pending",
			};

			trackActivity(CREATE_PROFILE);
			await create("profiles", profileData);
			await loadSession();
			setJustSignup(false);
			await new Promise((resolve) => setTimeout(resolve, 500));
			router.replace("/tabs/(tabs)");
		} catch (error) {
			Alert.alert("Erreur", "Impossible de créer le profil");
			console.log("❌ Error create profile", error);
		} finally {
			setSubmitting(false);
		}
	};

	const bg = isDark ? "#111827" : "#f9fafb";
	const cardBg = isDark ? "#374151" : "#ffffff";
	const cardBorder = isDark ? "#4b5563" : "#e5e7eb";
	const inputStyle = {
		borderRadius: 10,
		backgroundColor: isDark ? "#1f2937" : "#f9fafb",
		borderColor: isDark ? "#4b5563" : "#d1d5db",
	};
	const inputTextStyle = { color: isDark ? "#f3f4f6" : "#111827" };
	const labelStyle = {
		fontWeight: "600",
		color: isDark ? "#d1d5db" : "#374151",
	};
	const textColor = isDark ? "#f3f4f6" : "#111827";

	const canAdvance =
		step === 1
			? firstname.trim().length > 0 &&
				lastname.trim().length > 0 &&
				birthdaySet &&
				gender.length > 0
			: step === 2
				? selectedCommune !== null
				: step === 3
					? height.trim().length > 0 &&
						weight.trim().length > 0 &&
						languages.length > 0
					: true;

	const STEP_LABELS = [
		"Identité",
		"Localisation",
		"Physique & Compétences",
		"Récapitulatif",
	];

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
								Mon profil
							</Text>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 6,
								}}>
								Étape {step} / 4 — {STEP_LABELS[step - 1]}
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

						{/* ---- STEP 1: Identité ---- */}
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
											Prénom *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='Jean'
												value={firstname}
												onChangeText={(val) =>
													setFirstname(
														formatName(val),
													)
												}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Nom *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='Dupont'
												value={lastname}
												onChangeText={(val) =>
													setLastname(formatName(val))
												}
												style={inputTextStyle}
											/>
										</Input>
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Date de naissance *
										</Text>
										<TouchableOpacity
											onPress={() =>
												setShowDatePicker(true)
											}
											activeOpacity={0.7}
											style={[
												inputStyle,
												{
													height: 44,
													paddingHorizontal: 12,
													justifyContent: "center",
													borderWidth: 1,
												},
											]}>
											<Text
												style={{
													color: birthdaySet
														? isDark
															? "#f3f4f6"
															: "#111827"
														: isDark
															? "#6b7280"
															: "#9ca3af",
													fontSize: 15,
												}}>
												{birthdaySet
													? formatDate(birthdayDate)
													: "Sélectionner une date"}
											</Text>
										</TouchableOpacity>

										{/* iOS : Actionsheet */}
										{Platform.OS === "ios" && (
											<Actionsheet
												isOpen={showDatePicker}
												onClose={() => {
													setBirthdaySet(true);
													setShowDatePicker(false);
												}}>
												<ActionsheetBackdrop />
												<ActionsheetContent
													style={{
														paddingBottom: 32,
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
													}}>
													<ActionsheetDragIndicatorWrapper>
														<ActionsheetDragIndicator />
													</ActionsheetDragIndicatorWrapper>
													<DateTimePicker
														value={birthdayDate}
														mode='date'
														display='spinner'
														locale='fr-FR'
														maximumDate={new Date()}
														minimumDate={
															new Date(1920, 0, 1)
														}
														onChange={(_, d) => {
															if (d)
																setBirthdayDate(
																	d,
																);
														}}
														style={{
															width: "100%",
														}}
														textColor={
															isDark
																? "#f3f4f6"
																: "#111827"
														}
													/>
												</ActionsheetContent>
											</Actionsheet>
										)}

										{/* Android : picker natif */}
										{Platform.OS === "android" &&
											showDatePicker && (
												<DateTimePicker
													value={birthdayDate}
													mode='date'
													display='calendar'
													maximumDate={new Date()}
													minimumDate={
														new Date(1920, 0, 1)
													}
													onChange={(_, d) => {
														setShowDatePicker(
															false,
														);
														if (d) {
															setBirthdayDate(d);
															setBirthdaySet(
																true,
															);
														}
													}}
												/>
											)}
									</VStack>

									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Genre *
										</Text>
										<HStack
											style={{
												flexWrap: "wrap",
												gap: 8,
												marginTop: 4,
											}}>
											{GENDERS.map(({ label, value }) => (
												<TouchableOpacity
													key={value}
													onPress={() =>
														setGender(
															value === gender
																? ""
																: value,
														)
													}
													style={{
														paddingHorizontal: 14,
														paddingVertical: 8,
														borderRadius: 20,
														borderWidth: 1.5,
														borderColor:
															gender === value
																? "#2563eb"
																: isDark
																	? "#4b5563"
																	: "#d1d5db",
														backgroundColor:
															gender === value
																? isDark
																	? "#1e3a5f"
																	: "#eff6ff"
																: "transparent",
													}}>
													<Text
														size='sm'
														style={{
															color:
																gender === value
																	? isDark
																		? "#60a5fa"
																		: "#2563eb"
																	: isDark
																		? "#d1d5db"
																		: "#374151",
															fontWeight:
																gender === value
																	? "600"
																	: "400",
														}}>
														{label}
													</Text>
												</TouchableOpacity>
											))}
										</HStack>
									</VStack>
								</VStack>
							</Card>
						)}

						{/* ---- STEP 2: Localisation ---- */}
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
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Code postal
										</Text>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Input
												style={{
													...inputStyle,
													flex: 1,
												}}>
												<InputField
													placeholder='75001'
													value={postalCode}
													onChangeText={(t) => {
														setPostalCode(t);
														setCommuneError("");
														setCommunes([]);
														setSelectedCommune(
															null,
														);
													}}
													keyboardType='numeric'
													maxLength={5}
													style={inputTextStyle}
												/>
											</Input>
											<Button
												onPress={fetchCommunes}
												style={{
													backgroundColor:
														postalCode.length === 5
															? "#2563eb"
															: isDark
																? "#374151"
																: "#e5e7eb",
													borderRadius: 10,
													paddingHorizontal: 16,
													height: 44,
												}}
												disabled={
													postalCode.length !== 5
												}>
												<ButtonText
													style={{
														color:
															postalCode.length ===
															5
																? "#ffffff"
																: isDark
																	? "#6b7280"
																	: "#9ca3af",
														fontWeight: "700",
													}}>
													Chercher
												</ButtonText>
											</Button>
										</HStack>
										{communeError ? (
											<Text
												size='xs'
												style={{ color: "#ef4444" }}>
												{communeError}
											</Text>
										) : null}
									</VStack>

									{fetchingCommunes && (
										<ActivityIndicator
											size='large'
											color={
												isDark ? "#60a5fa" : "#2563eb"
											}
										/>
									)}

									{communes.length > 0 && (
										<VStack space='sm'>
											<Text size='sm' style={labelStyle}>
												Sélectionnez votre ville
											</Text>
											{communes.map((c) => {
												const selected =
													selectedCommune?.code ===
													c.code;
												return (
													<TouchableOpacity
														key={c.code}
														onPress={() =>
															setSelectedCommune(
																c,
															)
														}
														activeOpacity={0.7}>
														<Card
															style={{
																padding: 14,
																borderRadius: 12,
																borderWidth: 2,
																borderColor:
																	selected
																		? "#2563eb"
																		: isDark
																			? "#4b5563"
																			: "#e5e7eb",
																backgroundColor:
																	selected
																		? isDark
																			? "#1e3a5f"
																			: "#eff6ff"
																		: isDark
																			? "#1f2937"
																			: "#f9fafb",
															}}>
															<HStack
																space='sm'
																style={{
																	alignItems:
																		"center",
																}}>
																<Icon
																	as={MapPin}
																	size='sm'
																	style={{
																		color: selected
																			? "#2563eb"
																			: isDark
																				? "#9ca3af"
																				: "#6b7280",
																	}}
																/>
																<VStack>
																	<Text
																		style={{
																			fontWeight:
																				"700",
																			color: textColor,
																			fontSize: 15,
																		}}>
																		{c.nom}
																	</Text>
																	<Text
																		size='xs'
																		style={{
																			color: isDark
																				? "#9ca3af"
																				: "#6b7280",
																		}}>
																		{
																			c
																				.departement
																				?.nom
																		}{" "}
																		(
																		{
																			c.codeDepartement
																		}
																		) —{" "}
																		{
																			c
																				.region
																				?.nom
																		}
																	</Text>
																</VStack>
															</HStack>
														</Card>
													</TouchableOpacity>
												);
											})}
										</VStack>
									)}
								</VStack>
							</Card>
						)}

						{/* ---- STEP 3: Physique & Compétences ---- */}
						{step === 3 && (
							<Card
								style={{
									padding: 24,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: cardBorder,
								}}>
								<VStack space='lg'>
									<HStack space='md'>
										<VStack space='xs' style={{ flex: 1 }}>
											<Text size='sm' style={labelStyle}>
												Taille (cm) *
											</Text>
											<Input style={inputStyle}>
												<InputField
													placeholder='175'
													value={height}
													onChangeText={setHeight}
													keyboardType='numeric'
													style={inputTextStyle}
												/>
											</Input>
										</VStack>
										<VStack space='xs' style={{ flex: 1 }}>
											<Text size='sm' style={labelStyle}>
												Poids (kg) *
											</Text>
											<Input style={inputStyle}>
												<InputField
													placeholder='70'
													value={weight}
													onChangeText={setWeight}
													keyboardType='numeric'
													style={inputTextStyle}
												/>
											</Input>
										</VStack>
									</HStack>

									{/* Langues */}
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Langues parlées *
										</Text>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Input
												style={{
													...inputStyle,
													flex: 1,
												}}>
												<InputField
													placeholder='Français, Anglais...'
													value={languageInput}
													onChangeText={
														setLanguageInput
													}
													onSubmitEditing={
														addLanguage
													}
													style={inputTextStyle}
												/>
											</Input>
											<TouchableOpacity
												onPress={addLanguage}
												style={{
													width: 44,
													height: 44,
													borderRadius: 10,
													backgroundColor: "#2563eb",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={Plus}
													size='sm'
													style={{ color: "#ffffff" }}
												/>
											</TouchableOpacity>
										</HStack>
										{languages.length > 0 && (
											<HStack
												style={{
													flexWrap: "wrap",
													gap: 6,
													marginTop: 6,
												}}>
												{languages.map((l) => (
													<TouchableOpacity
														key={l}
														onPress={() =>
															setLanguages(
																languages.filter(
																	(x) =>
																		x !== l,
																),
															)
														}
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															paddingHorizontal: 10,
															paddingVertical: 6,
															borderRadius: 16,
															backgroundColor:
																isDark
																	? "#1a2e1a"
																	: "#f0fdf4",
															gap: 4,
														}}>
														<Text
															size='xs'
															style={{
																color: isDark
																	? "#4ade80"
																	: "#16a34a",
																fontWeight:
																	"600",
															}}>
															{l}
														</Text>
														<Icon
															as={X}
															size='xs'
															style={{
																color: isDark
																	? "#4ade80"
																	: "#16a34a",
															}}
														/>
													</TouchableOpacity>
												))}
											</HStack>
										)}
										{languages.length > 0 && (
											<Text
												size='xs'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													fontStyle: "italic",
												}}>
												Enregistré :{" "}
												{languages.join(", ")}
											</Text>
										)}
									</VStack>

									{/* Permis de conduire */}
									<VStack space='xs'>
										<Text size='sm' style={labelStyle}>
											Permis de conduire
										</Text>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Input
												style={{
													...inputStyle,
													flex: 1,
												}}>
												<InputField
													placeholder='B, A2...'
													value={licenseInput}
													onChangeText={
														setLicenseInput
													}
													onSubmitEditing={addLicense}
													autoCapitalize='characters'
													style={inputTextStyle}
												/>
											</Input>
											<TouchableOpacity
												onPress={addLicense}
												style={{
													width: 44,
													height: 44,
													borderRadius: 10,
													backgroundColor: "#2563eb",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={Plus}
													size='sm'
													style={{ color: "#ffffff" }}
												/>
											</TouchableOpacity>
										</HStack>
										{licenses.length > 0 && (
											<HStack
												style={{
													flexWrap: "wrap",
													gap: 6,
													marginTop: 6,
												}}>
												{licenses.map((l) => (
													<TouchableOpacity
														key={l}
														onPress={() =>
															setLicenses(
																licenses.filter(
																	(x) =>
																		x !== l,
																),
															)
														}
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															paddingHorizontal: 10,
															paddingVertical: 6,
															borderRadius: 16,
															backgroundColor:
																isDark
																	? "#1e3a5f"
																	: "#eff6ff",
															gap: 4,
														}}>
														<Text
															size='xs'
															style={{
																color: isDark
																	? "#60a5fa"
																	: "#2563eb",
																fontWeight:
																	"600",
															}}>
															{l}
														</Text>
														<Icon
															as={X}
															size='xs'
															style={{
																color: isDark
																	? "#60a5fa"
																	: "#2563eb",
															}}
														/>
													</TouchableOpacity>
												))}
											</HStack>
										)}
										{licenses.length > 0 && (
											<Text
												size='xs'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													fontStyle: "italic",
												}}>
												Enregistré :{" "}
												{licenses.join(", ")}
											</Text>
										)}
									</VStack>
								</VStack>
							</Card>
						)}

						{/* ---- STEP 4: Récapitulatif ---- */}
						{step === 4 && (
							<Card
								style={{
									padding: 24,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<VStack space='md'>
									<Text
										style={{
											fontSize: 18,
											fontWeight: "800",
											color: textColor,
											marginBottom: 4,
										}}>
										Récapitulatif
									</Text>
									<Box
										style={{
											height: 1,
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
											marginBottom: 4,
										}}
									/>
									{[
										["Prénom", firstname || "—"],
										["Nom", lastname || "—"],
										[
											"Date de naissance",
											birthdaySet
												? formatDate(birthdayDate)
												: "—",
										],
										[
											"Genre",
											gender === "male"
												? "Homme"
												: gender === "female"
													? "Femme"
													: "—",
										],
										["Ville", selectedCommune?.nom || "—"],
										[
											"Département",
											selectedCommune
												? `${selectedCommune.departement?.nom} (${selectedCommune.codeDepartement})`
												: "—",
										],
										[
											"Région",
											selectedCommune?.region?.nom || "—",
										],
										[
											"Taille",
											height ? `${height} cm` : "—",
										],
										[
											"Poids",
											weight ? `${weight} kg` : "—",
										],
										[
											"Permis",
											licenses.length > 0
												? licenses.join(", ")
												: "—",
										],
										[
											"Langues",
											languages.length > 0
												? languages.join(", ")
												: "—",
										],
									].map(([label, value]) => (
										<HStack
											key={label}
											style={{
												justifyContent: "space-between",
												alignItems: "flex-start",
												paddingVertical: 8,
												borderBottomWidth: 1,
												borderBottomColor: isDark
													? "#374151"
													: "#f3f4f6",
											}}>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													fontWeight: "600",
													flex: 1,
												}}>
												{label}
											</Text>
											<Text
												size='sm'
												style={{
													color: textColor,
													fontWeight: "500",
													flex: 1,
													textAlign: "right",
												}}>
												{value}
											</Text>
										</HStack>
									))}
								</VStack>
							</Card>
						)}

						{/* Navigation buttons */}
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
							)}

							{step < 4 ? (
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
										backgroundColor: "#2563eb",
										borderRadius: 12,
										height: 52,
									}}
									onPress={handleCreateProfile}>
									<ButtonText
										style={{
											color: "#ffffff",
											fontWeight: "700",
											fontSize: 16,
										}}>
										Créer mon profil
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

export default CreateProfile;
