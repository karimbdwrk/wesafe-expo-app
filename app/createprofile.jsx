import React, { useState, useEffect, useRef } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
	Animated,
	useWindowDimensions,
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
	ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import {
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	MapPin,
	Languages,
	Car,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { createSupabaseClient } from "@/lib/supabase";
import { useDataContext } from "@/context/DataContext";
import { CREATE_PROFILE } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { DRIVING_LICENSES } from "@/constants/drivinglicences";
import { languages as LANGUAGES } from "@/constants/languages";
import { departements } from "@/constants/departements";
import { regions } from "@/constants/regions";

const GENDERS = [
	{ label: "Homme", value: "male" },
	{ label: "Femme", value: "female" },
];

const CreateProfile = () => {
	const router = useRouter();
	const { user, setJustSignup, loadSession, role, accessToken } = useAuth();
	const { create, getAll, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const { height: screenHeight } = useWindowDimensions();

	const [step, setStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);

	const PROGRESS_VALUES = [0, 33, 67, 100];
	const progressAnim = useRef(new Animated.Value(0)).current;

	const scrollRef = useRef(null);
	const firstnameRef = useRef(null);
	const lastnameRef = useRef(null);
	const postcodeRef = useRef(null);
	const heightRef = useRef(null);
	const weightRef = useRef(null);

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
	const [drivingLicenses, setDrivingLicenses] = useState([]);
	const [showDrivingLicenseSheet, setShowDrivingLicenseSheet] =
		useState(false);
	const [languages, setLanguages] = useState([]);
	const [showLanguageSheet, setShowLanguageSheet] = useState(false);

	const toCommune = (city) => {
		const dept = departements.find((d) => d.code === city.department_code);
		const reg = regions.find((r) => r.code === city.region_code);
		return {
			nom: city.nom,
			code: city.code,
			codesPostaux: [city.postcode],
			codeDepartement: city.department_code,
			codeRegion: city.region_code,
			departement: { nom: dept?.nom || city.department || "" },
			region: { nom: reg?.nom || city.region || "" },
			centre: { coordinates: [city.longitude, city.latitude] },
		};
	};

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

		// 1. Vérifier le cache Supabase
		try {
			const { data: cached } = await getAll(
				"cities",
				"*",
				`&postcode=eq.${postalCode}`,
				1,
				50,
			);
			if (cached && cached.length > 0) {
				setCommunes(cached.map(toCommune));
				setFetchingCommunes(false);
				return;
			}
		} catch (cacheErr) {
			console.warn("Cache cities inaccessible:", cacheErr?.message);
		}

		// 2. Fallback API geo.gouv.fr
		try {
			const res = await fetch(
				`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,departement,region,centre&format=json`,
			);
			const data = await res.json();
			if (!data || data.length === 0) {
				setCommuneError("Aucune ville trouvée pour ce code postal");
			} else {
				setCommunes(data);
				// 3. Sauvegarder dans Supabase en batch (sans bloquer l'affichage)
				const supabase = createSupabaseClient(accessToken);
				supabase
					.from("cities")
					.insert(
						data.map((c) => ({
							postcode: postalCode,
							code: c.code,
							nom: c.nom,
							department_code: c.codeDepartement,
							region_code: c.codeRegion,
							latitude: c.centre?.coordinates?.[1] ?? null,
							longitude: c.centre?.coordinates?.[0] ?? null,
						})),
					)
					.then((res) => {
						console.log("upsert cities response:", res);
						if (res.error)
							console.warn(
								"Erreur save cities:",
								res.error.message,
								res.error.code,
								res.error.details,
							);
					});
			}
		} catch {
			setCommuneError("Erreur lors de la recherche");
		} finally {
			setFetchingCommunes(false);
		}
	};

	const addLicense = () => {};

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
				...(drivingLicenses.length > 0 && {
					driving_licenses: drivingLicenses.join(", "),
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

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const inputStyle = {
		borderRadius: 10,
		backgroundColor: isDark
			? Colors.dark.elevated
			: Colors.light.background,
		borderColor: isDark ? Colors.dark.border : Colors.light.border,
	};
	const inputTextStyle = {
		color: isDark ? Colors.dark.text : Colors.light.text,
	};
	const labelStyle = {
		fontWeight: "600",
		color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
	};
	const textColor = isDark ? Colors.dark.text : Colors.light.text;

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
									color: muted,
									marginTop: 6,
								}}>
								Étape {step} / 4 — {STEP_LABELS[step - 1]}
							</Text>
						</VStack>

						{/* Progress bar */}
						<Box
							style={{
								height: 4,
								backgroundColor: isDark
									? Colors.dark.cardBackground
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

						{/* ---- STEP 1: Identité ---- */}
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
											Prénom *
										</Text>
										<Input style={inputStyle}>
											<InputField
												placeholder='Jean'
												ref={firstnameRef}
												onFocus={() =>
													scrollToInput(firstnameRef)
												}
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
												ref={lastnameRef}
												onFocus={() =>
													scrollToInput(lastnameRef)
												}
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
														? textColor
														: muted,
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
												onClose={() =>
													setShowDatePicker(false)
												}>
												<ActionsheetBackdrop />
												<ActionsheetContent
													style={{
														paddingBottom: 32,
														backgroundColor: isDark
															? Colors.dark
																	.elevated
															: Colors.light
																	.cardBackground,
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
														textColor={textColor}
													/>
													<Button
														onPress={() => {
															setBirthdaySet(
																true,
															);
															setShowDatePicker(
																false,
															);
														}}
														style={{
															backgroundColor:
																tint,
															borderRadius: 12,
															height: 52,
															marginHorizontal: 16,
															marginTop: 8,
															width: "100%",
														}}>
														<ButtonText
															style={{
																color: "#ffffff",
																fontWeight:
																	"700",
																fontSize: 16,
															}}>
															Valider
														</ButtonText>
													</Button>
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
																? tint
																: isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
														backgroundColor:
															gender === value
																? isDark
																	? Colors
																			.dark
																			.tint20
																	: Colors
																			.light
																			.tint20
																: "transparent",
													}}>
													<Text
														size='sm'
														style={{
															color:
																gender === value
																	? isDark
																		? tint
																		: tint
																	: isDark
																		? Colors
																				.dark
																				.textSecondary
																		: Colors
																				.light
																				.textSecondary,
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
													ref={postcodeRef}
													onFocus={() =>
														scrollToInput(
															postcodeRef,
														)
													}
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
															? tint
															: isDark
																? Colors.dark
																		.cardBackground
																: Colors.light
																		.border,
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
																: muted,
														fontWeight: "700",
													}}>
													Chercher
												</ButtonText>
											</Button>
										</HStack>
										{communeError ? (
											<Text
												size='xs'
												style={{
													color: isDark
														? Colors.dark.danger
														: Colors.light.danger,
												}}>
												{communeError}
											</Text>
										) : null}
									</VStack>

									{fetchingCommunes && (
										<ActivityIndicator
											size='large'
											color={tint}
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
																		? tint
																		: isDark
																			? Colors
																					.dark
																					.border
																			: Colors
																					.light
																					.border,
																backgroundColor:
																	selected
																		? isDark
																			? Colors
																					.dark
																					.tint20
																			: Colors
																					.light
																					.tint20
																		: isDark
																			? Colors
																					.dark
																					.elevated
																			: Colors
																					.light
																					.background,
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
																			? tint
																			: muted,
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
																			color: muted,
																		}}>
																		{
																			c
																				.codesPostaux?.[0]
																		}{" "}
																		—{" "}
																		{
																			c
																				.departement
																				?.nom
																		}{" "}
																		—{" "}
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
									paddingHorizontal: 15,
									paddingVertical: 20,
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
													ref={heightRef}
													onFocus={() =>
														scrollToInput(heightRef)
													}
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
													ref={weightRef}
													onFocus={() =>
														scrollToInput(weightRef)
													}
													value={weight}
													onChangeText={setWeight}
													keyboardType='numeric'
													style={inputTextStyle}
												/>
											</Input>
										</VStack>
									</HStack>

									{/* Langues */}
									<VStack space='sm'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Languages}
												size='md'
												style={{ color: tint }}
											/>
											<Text size='sm' style={labelStyle}>
												Langues parlées *
											</Text>
										</HStack>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() =>
												setShowLanguageSheet(true)
											}>
											<Box
												style={{
													flexDirection: "row",
													alignItems: "center",
													justifyContent:
														"space-between",
													padding: 12,
													borderRadius: 8,
													borderWidth: 1,
													borderColor:
														languages.length > 0
															? tint
															: cardBorder,
													backgroundColor: cardBg,
												}}>
												<Text
													style={{
														flex: 1,
														color:
															languages.length > 0
																? tint
																: muted,
														fontWeight:
															languages.length > 0
																? "600"
																: "400",
													}}>
													{languages.length > 0
														? `${languages.length} langue${
																languages.length >
																1
																	? "s"
																	: ""
															} sélectionnée${
																languages.length >
																1
																	? "s"
																	: ""
															}`
														: "Sélectionner des langues"}
												</Text>
												<Icon
													as={ChevronDown}
													size='sm'
													style={{
														color:
															languages.length > 0
																? tint
																: muted,
													}}
												/>
											</Box>
										</TouchableOpacity>
										{languages.length > 0 && (
											<HStack
												space='xs'
												style={{
													flexWrap: "wrap",
													marginTop: 6,
												}}>
												{languages.map((code) => (
													<Box
														key={code}
														style={{
															paddingHorizontal: 8,
															paddingVertical: 3,
															borderRadius: 6,
															borderWidth: 1,
															borderColor:
																cardBorder,
															backgroundColor:
																cardBg,
															marginBottom: 4,
														}}>
														<Text
															style={{
																fontSize: 11,
																fontWeight:
																	"700",
																color: textColor,
															}}>
															{code}
														</Text>
													</Box>
												))}
											</HStack>
										)}
									</VStack>

									{/* Permis de conduire */}
									<VStack space='sm'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Car}
												size='md'
												style={{ color: { tint } }}
											/>
											<Text size='sm' style={labelStyle}>
												Permis de conduire
											</Text>
										</HStack>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() =>
												setShowDrivingLicenseSheet(true)
											}>
											<Box
												style={{
													flexDirection: "row",
													alignItems: "center",
													justifyContent:
														"space-between",
													padding: 12,
													borderRadius: 8,
													borderWidth: 1,
													borderColor:
														drivingLicenses.length >
														0
															? tint
															: cardBorder,
													backgroundColor: cardBg,
												}}>
												<Text
													style={{
														flex: 1,
														color:
															drivingLicenses.length >
															0
																? tint
																: muted,
														fontWeight:
															drivingLicenses.length >
															0
																? "600"
																: "400",
													}}>
													{drivingLicenses.length > 0
														? `${drivingLicenses.length} permis sélectionné${drivingLicenses.length > 1 ? "s" : ""}`
														: "Sélectionnez vos permis"}
												</Text>
												<Icon
													as={ChevronDown}
													size='sm'
													style={{
														color:
															drivingLicenses.length >
															0
																? tint
																: muted,
													}}
												/>
											</Box>
										</TouchableOpacity>
										{drivingLicenses.length > 0 && (
											<HStack
												space='xs'
												style={{
													flexWrap: "wrap",
													marginTop: 6,
												}}>
												{drivingLicenses.map(
													(acronym) => (
														<Box
															key={acronym}
															style={{
																paddingHorizontal: 8,
																paddingVertical: 3,
																borderRadius: 6,
																borderWidth: 1,
																borderColor:
																	cardBorder,
																backgroundColor:
																	cardBg,
																marginBottom: 4,
															}}>
															<Text
																style={{
																	fontSize: 11,
																	fontWeight:
																		"700",
																	color: textColor,
																}}>
																{acronym}
															</Text>
														</Box>
													),
												)}
											</HStack>
										)}
									</VStack>
								</VStack>
							</Card>
						)}

						{/* ---- STEP 4: Récapitulatif ---- */}
						{step === 4 && (
							<Card
								style={{
									paddingHorizontal: 15,
									paddingVertical: 20,
									backgroundColor: cardBg,
									borderRadius: 16,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
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
												? Colors.dark.border
												: Colors.light.border,
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
										[
											"Code postal",
											selectedCommune
												?.codesPostaux?.[0] ||
												postalCode ||
												"—",
										],
										["Ville", selectedCommune?.nom || "—"],
										[
											"Département",
											selectedCommune?.departement?.nom ||
												"—",
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
											drivingLicenses.length > 0
												? drivingLicenses.join(", ")
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
													? Colors.dark.cardBackground
													: Colors.light.elevated,
											}}>
											<Text
												size='sm'
												style={{
													color: muted,
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

							{step < 4 ? (
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

			{/* Actionsheet — Langues */}
			<Actionsheet
				isOpen={showLanguageSheet}
				onClose={() => setShowLanguageSheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark
							? Colors.dark.background
							: Colors.light.cardBackground,
						paddingBottom: 0,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack style={{ width: "100%", paddingTop: 8 }}>
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 4,
								marginBottom: 8,
							}}>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 17,
									color: textColor,
								}}>
								Langues parlées
							</Text>
							{languages.length > 0 && (
								<Pressable onPress={() => setLanguages([])}>
									<Text
										style={{
											fontSize: 13,
											color: Colors.dark.danger,
										}}>
										Tout effacer
									</Text>
								</Pressable>
							)}
						</HStack>
						<ActionsheetScrollView
							showsVerticalScrollIndicator={false}
							style={{
								width: "100%",
								height: screenHeight * 0.5,
							}}>
							<VStack space='xs' style={{ paddingBottom: 16 }}>
								{LANGUAGES.map((lang) => {
									const isSel = languages.includes(lang.code);
									return (
										<Pressable
											key={lang.code}
											onPress={() =>
												setLanguages((prev) =>
													isSel
														? prev.filter(
																(v) =>
																	v !==
																	lang.code,
															)
														: [...prev, lang.code],
												)
											}>
											<Box
												style={{
													padding: 14,
													borderRadius: 10,
													borderWidth: 2,
													borderColor: isSel
														? Colors.light.tint
														: cardBorder,
													backgroundColor: isSel
														? isDark
															? Colors.dark.tint20
															: "#dbeafe"
														: cardBg,
												}}>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Box
														style={{
															paddingHorizontal: 8,
															paddingVertical: 3,
															borderRadius: 6,
															backgroundColor:
																isSel
																	? Colors
																			.light
																			.tint
																	: cardBorder,
														}}>
														<Text
															style={{
																fontSize: 11,
																fontWeight:
																	"800",
																color: isSel
																	? Colors
																			.light
																			.cardBackground
																	: muted,
															}}>
															{lang.code}
														</Text>
													</Box>
													<Text
														style={{
															flex: 1,
															fontSize: 14,
															color: isSel
																? Colors.light
																		.tint
																: textColor,
															fontWeight: isSel
																? "600"
																: "400",
														}}>
														{lang.name}
													</Text>
												</HStack>
											</Box>
										</Pressable>
									);
								})}
							</VStack>
						</ActionsheetScrollView>
						<Box
							style={{
								paddingTop: 12,
								paddingBottom: 32,
								backgroundColor: isDark
									? Colors.dark.background
									: Colors.light.cardBackground,
							}}>
							<Button
								style={{ backgroundColor: tint }}
								onPress={() => setShowLanguageSheet(false)}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Valider
								</ButtonText>
							</Button>
						</Box>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>

			{/* Actionsheet — Permis de conduire */}
			<Actionsheet
				isOpen={showDrivingLicenseSheet}
				onClose={() => setShowDrivingLicenseSheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark
							? Colors.dark.background
							: Colors.light.cardBackground,
						paddingBottom: 0,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack style={{ width: "100%", paddingTop: 8 }}>
						<HStack
							style={{
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 4,
								marginBottom: 8,
							}}>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 17,
									color: textColor,
								}}>
								Permis de conduire
							</Text>
							{drivingLicenses.length > 0 && (
								<Pressable
									onPress={() => setDrivingLicenses([])}>
									<Text
										style={{
											fontSize: 13,
											color: Colors.dark.danger,
										}}>
										Tout effacer
									</Text>
								</Pressable>
							)}
						</HStack>
						<ActionsheetScrollView
							showsVerticalScrollIndicator={false}
							style={{
								width: "100%",
								height: screenHeight * 0.5,
							}}>
							<VStack space='lg' style={{ paddingBottom: 16 }}>
								{(() => {
									const DL_GROUP_LABELS = {
										moto: "Moto",
										vehicule_leger: "Véhicule léger",
										poids_lourd: "Poids lourd",
										transport_personnes:
											"Transport de personnes",
									};
									const grouped = Object.entries(
										DRIVING_LICENSES,
									).reduce((acc, [key, dl]) => {
										if (!acc[dl.category])
											acc[dl.category] = [];
										acc[dl.category].push({ key, ...dl });
										return acc;
									}, {});
									return Object.entries(grouped).map(
										([groupKey, items]) => (
											<VStack key={groupKey} space='sm'>
												<Text
													style={{
														fontSize: 12,
														fontWeight: "700",
														letterSpacing: 0.8,
														textTransform:
															"uppercase",
														color: muted,
														paddingHorizontal: 4,
													}}>
													{DL_GROUP_LABELS[
														groupKey
													] || groupKey}
												</Text>
												<VStack space='xs'>
													{items.map((dl) => {
														const isSel =
															drivingLicenses.includes(
																dl.acronym,
															);
														return (
															<Pressable
																key={dl.key}
																onPress={() =>
																	setDrivingLicenses(
																		(
																			prev,
																		) =>
																			isSel
																				? prev.filter(
																						(
																							v,
																						) =>
																							v !==
																							dl.acronym,
																					)
																				: [
																						...prev,
																						dl.acronym,
																					],
																	)
																}>
																<Box
																	style={{
																		padding: 14,
																		borderRadius: 10,
																		borderWidth: 2,
																		borderColor:
																			isSel
																				? Colors
																						.light
																						.tint
																				: cardBorder,
																		backgroundColor:
																			isSel
																				? isDark
																					? Colors
																							.dark
																							.tint20
																					: "#dbeafe"
																				: cardBg,
																	}}>
																	<HStack
																		space='sm'
																		style={{
																			alignItems:
																				"center",
																		}}>
																		<Box
																			style={{
																				paddingHorizontal: 8,
																				paddingVertical: 3,
																				borderRadius: 6,
																				backgroundColor:
																					isSel
																						? Colors
																								.light
																								.tint
																						: cardBorder,
																			}}>
																			<Text
																				style={{
																					fontSize: 11,
																					fontWeight:
																						"800",
																					color: isSel
																						? Colors
																								.light
																								.cardBackground
																						: muted,
																				}}>
																				{
																					dl.acronym
																				}
																			</Text>
																		</Box>
																		<Text
																			style={{
																				flex: 1,
																				fontSize: 14,
																				color: isSel
																					? Colors
																							.light
																							.tint
																					: textColor,
																				fontWeight:
																					isSel
																						? "600"
																						: "400",
																			}}>
																			{
																				dl.name
																			}
																		</Text>
																	</HStack>
																</Box>
															</Pressable>
														);
													})}
												</VStack>
											</VStack>
										),
									);
								})()}
							</VStack>
						</ActionsheetScrollView>
						<Box
							style={{
								paddingTop: 12,
								paddingBottom: 32,
								backgroundColor: isDark
									? Colors.dark.background
									: Colors.light.cardBackground,
							}}>
							<Button
								style={{ backgroundColor: tint }}
								onPress={() =>
									setShowDrivingLicenseSheet(false)
								}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Valider
								</ButtonText>
							</Button>
						</Box>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</SafeAreaView>
	);
};

export default CreateProfile;
