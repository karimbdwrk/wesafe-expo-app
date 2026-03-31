import React, { useState, useEffect, useRef } from "react";
import {
	ScrollView,
	View,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import {
	User,
	Calendar,
	MapPin,
	Shield,
	Languages,
	Car,
	CheckCircle,
	AlertCircle,
	ChevronDown,
	Ruler,
	Plus,
	Trash2,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetItem,
	ActionsheetItemText,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
	ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { DRIVING_LICENSES } from "@/constants/drivinglicences";
import { sendPhoneOtp, verifyPhoneOtp } from "@/services/twilioApi";

const UpdateProfile = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update, getById, getAll, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const toast = useToast();

	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [gender, setGender] = useState("");
	const [birthday, setBirthday] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [postcode, setPostcode] = useState("");
	const [postcodeSearch, setPostcodeSearch] = useState("");
	const [city, setCity] = useState("");
	const [department, setDepartment] = useState("");
	const [region, setRegion] = useState("");
	const [departmentCode, setDepartmentCode] = useState("");
	const [regionCode, setRegionCode] = useState("");
	const [latitude, setLatitude] = useState(null);
	const [longitude, setLongitude] = useState(null);
	const [formerSoldier, setFormerSoldier] = useState(false);
	const [drivingLicenses, setDrivingLicenses] = useState([]);
	const [currentLanguage, setCurrentLanguage] = useState("");
	const [languages, setLanguages] = useState([]);
	const [showDrivingLicenseSheet, setShowDrivingLicenseSheet] =
		useState(false);
	const [height, setHeight] = useState("");
	const [weight, setWeight] = useState("");
	const [phone, setPhone] = useState("");
	const [phoneChecking, setPhoneChecking] = useState(false);
	const [phoneStatus, setPhoneStatus] = useState(null); // null | 'available' | 'taken'
	const [otpSending, setOtpSending] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [otpInput, setOtpInput] = useState("");
	const [otpVerifying, setOtpVerifying] = useState(false);
	const [phoneVerified, setPhoneVerified] = useState(false);
	const [otpError, setOtpError] = useState(null); // null | 'wrong_code' | 'expired' | 'server'
	const [resendCooldown, setResendCooldown] = useState(0); // secondes restantes avant de pouvoir renvoyer
	const resendTimerRef = useRef(null);
	const [cities, setCities] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadProfile();
	}, []);

	const loadProfile = async () => {
		try {
			const profile = await getById("profiles", user.id, "*");
			if (profile) {
				setFirstname(profile.firstname || "");
				setLastname(profile.lastname || "");
				setGender(profile.gender || "");
				setBirthday(
					profile.birthday ? new Date(profile.birthday) : new Date(),
				);
				setPostcode(profile.postcode || "");
				setPostcodeSearch(profile.postcode || "");
				setCity(profile.city || "");
				setDepartment(profile.department || "");
				setRegion(profile.region || "");
				setDepartmentCode(profile.department_code || "");
				setRegionCode(profile.region_code || "");
				setLatitude(profile.latitude || null);
				setLongitude(profile.longitude || null);
				setFormerSoldier(profile.former_soldier || false);
				setDrivingLicenses(
					(() => {
						const raw = profile.driving_licenses || "";
						try {
							return JSON.parse(raw);
						} catch {
							return raw
								? raw
										.split(",")
										.map((s) => s.trim())
										.filter(Boolean)
								: [];
						}
					})(),
				);
				setLanguages(
					(() => {
						const raw = profile.languages || "";
						try {
							return JSON.parse(raw);
						} catch {
							return raw
								? raw
										.split(",")
										.map((s) => s.trim())
										.filter(Boolean)
								: [];
						}
					})(),
				);
				setHeight(profile.height?.toString() || "");
				setWeight(profile.weight?.toString() || "");
				// Afficher le numéro formaté XX XX XX XX XX
				const raw = profile.phone || "";
				const digits = raw.startsWith("+33")
					? "0" + raw.slice(3)
					: raw.replace(/\D/g, "");
				setPhone(digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim());
			}
		} catch (error) {
			console.error("Error loading profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const searchCities = async (postalCode) => {
		if (postalCode.length !== 5) {
			setCities([]);
			return;
		}

		try {
			const response = await axios.get(
				`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,departement,region,centre&format=json`,
			);
			setCities(response.data);
		} catch (error) {
			console.error("Error fetching cities:", error);
		}
	};

	const selectCity = (cityData) => {
		setCity(cityData.nom);
		setDepartment(cityData.departement?.nom || "");
		setRegion(cityData.region?.nom || "");
		setDepartmentCode(cityData.codeDepartement || "");
		setRegionCode(cityData.codeRegion || "");
		setLatitude(cityData.centre?.coordinates[1] || null);
		setLongitude(cityData.centre?.coordinates[0] || null);
		if (cityData.codesPostaux?.[0]) {
			setPostcode(cityData.codesPostaux[0]);
		}
		setCities([]);
	};

	const addLanguage = () => {
		if (currentLanguage.trim()) {
			setLanguages((prev) => [...prev, currentLanguage.trim()]);
			setCurrentLanguage("");
		}
	};
	const removeLanguage = (index) => {
		setLanguages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpdateProfile = async () => {
		if (!firstname || !lastname) {
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
						title='Champs obligatoires'
						description='Veuillez remplir votre prénom et nom.'
					/>
				),
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await update("profiles", user.id, {
				firstname,
				lastname,
				gender,
				birthday: birthday.toISOString().split("T")[0],
				postcode,
				city,
				department,
				region,
				department_code: departmentCode,
				region_code: regionCode,
				latitude,
				longitude,
				former_soldier: formerSoldier,
				driving_licenses: drivingLicenses.length
					? JSON.stringify(drivingLicenses)
					: null,
				languages: languages.length ? JSON.stringify(languages) : null,
				height: height ? parseFloat(height) : null,
				weight: weight ? parseFloat(weight) : null,
				phone: phone
					? `+33${phone.replace(/\s/g, "").replace(/^0/, "")}`
					: null,
				phone_status: phone
					? phoneVerified
						? "verified"
						: "pending"
					: null,
			});

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
						title='Profil mis à jour !'
						description='Les informations ont été enregistrées avec succès.'
					/>
				),
			});
			trackActivity("update_profile");
			setTimeout(() => router.back(), 1500);
		} catch (error) {
			console.error("error update profile", error);
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
						title='Erreur'
						description='Impossible de mettre à jour le profil.'
					/>
				),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSendOtp = async () => {
		const digits = phone.replace(/\s/g, "");
		if (!/^0[67]\d{8}$/.test(digits)) return;
		const e164 = `+33${digits.slice(1)}`;
		setOtpSending(true);
		setOtpError(null);
		try {
			const res = await sendPhoneOtp(e164, user.id);
			if (res?.success) {
				setOtpSent(true);
				setOtpInput("");
				setOtpError(null);
				// Démarrer le cooldown 60s
				setResendCooldown(60);
				if (resendTimerRef.current)
					clearInterval(resendTimerRef.current);
				resendTimerRef.current = setInterval(() => {
					setResendCooldown((prev) => {
						if (prev <= 1) {
							clearInterval(resendTimerRef.current);
							return 0;
						}
						return prev - 1;
					});
				}, 1000);
			} else {
				console.warn(
					"[send-otp] erreur serveur :",
					res?.error,
					res?.detail,
				);
				setOtpError("server");
			}
		} catch (err) {
			console.warn("[send-otp] exception :", err?.message || err);
			setOtpError("server");
		} finally {
			setOtpSending(false);
		}
	};

	const handleVerifyOtp = async () => {
		const digits = phone.replace(/\s/g, "");
		if (!/^0[67]\d{8}$/.test(digits) || otpInput.length < 4) return;
		const e164 = `+33${digits.slice(1)}`;
		setOtpVerifying(true);
		setOtpError(null);
		try {
			const res = await verifyPhoneOtp(e164, otpInput.trim(), user.id);
			if (res?.success) {
				setPhoneVerified(true);
				setOtpSent(false);
				setOtpError(null);
			} else if (res?.expired) {
				setOtpError("expired");
				setOtpInput("");
			} else {
				// code incorrect
				setOtpError("wrong_code");
				console.warn(
					"[verify-otp] échec :",
					res?.error,
					res?.detail,
					"status:",
					res?.status,
				);
			}
		} catch (err) {
			console.warn("[verify-otp] exception :", err?.message || err);
			setOtpError("server");
		} finally {
			setOtpVerifying(false);
		}
	};

	const handleConfirmDate = (selectedDate) => {
		setShowDatePicker(false);
		setBirthday(selectedDate);
	};

	const handleCancelDate = () => {
		setShowDatePicker(false);
	};

	const handlePhoneChange = (text) => {
		// Garder seulement les chiffres
		let digits = text.replace(/\D/g, "");
		// Auto-préfixer 0 si premier chiffre est 6 ou 7
		if (digits.length === 1 && (digits[0] === "6" || digits[0] === "7")) {
			digits = "0" + digits;
		}
		// Limiter à 10 chiffres
		digits = digits.slice(0, 10);
		// Formater XX XX XX XX XX
		const formatted = digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
		setPhone(formatted);
		// Reset status si le numéro change
		setPhoneStatus(null);
		setPhoneChecking(false);
		setOtpSent(false);
		setOtpInput("");
		setPhoneVerified(false);
		setOtpError(null);

		// Vérification unicité dès que 10 chiffres valides
		if (digits.length === 10 && /^0[67]\d{8}$/.test(digits)) {
			const e164 = `+33${digits.slice(1)}`;
			const encoded = encodeURIComponent(e164);
			setPhoneChecking(true);
			getAll(
				"profiles",
				"id",
				`&phone=eq.${encoded}&id=neq.${user.id}`,
				1,
				1,
			)
				.then(({ data }) => {
					console.warn(
						"[phone check] query pour",
						e164,
						"→ résultat brut :",
						data,
					);
					if (data?.length > 0) {
						console.warn(
							`[phone check] ❌ Numéro ${e164} déjà utilisé par profil id=${data[0].id}`,
						);
						setPhoneStatus("taken");
					} else {
						console.warn(
							`[phone check] ✅ Numéro ${e164} disponible`,
						);
						setPhoneStatus("available");
					}
				})
				.catch((err) => {
					console.warn(
						"[phone check] erreur requête :",
						err?.message || err,
					);
				})
				.finally(() => {
					setPhoneChecking(false);
				});
		}
	};

	if (loading) {
		return (
			<Box
				style={{
					flex: 1,
					backgroundColor: bg,
					justifyContent: "center",
					alignItems: "center",
				}}>
				<Text style={{ color: textPrimary }}>Chargement...</Text>
			</Box>
		);
	}

	return (
		<>
			<View style={{ flex: 1, backgroundColor: bg }}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 100 }}>
					<VStack
						space='lg'
						style={{
							padding: 10,
							paddingTop: 15,
							paddingBottom: 30,
						}}>
						{/* Header Card */}
						{/* <Card
					style={{
						backgroundColor: cardBg,
						borderRadius: 12,
						padding: 20,
					}}>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: tint,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon as={User} size={24} color='#ffffff' />
						</Box>
						<VStack style={{ flex: 1 }}>
							<Heading
								size='lg'
								style={{
									color: textPrimary,
								}}>
								Modifier mon profil
							</Heading>
							<Text
								size='sm'
								style={{
									color: textSecondary,
									marginTop: 4,
								}}>
								Mettez à jour vos informations personnelles
							</Text>
						</VStack>
					</HStack>
				</Card> */}

						{/* Form Card */}
						<Card
							style={{
								backgroundColor: cardBg,
								borderRadius: 12,
								padding: 20,
							}}>
							<VStack space='lg'>
								{/* Prénom */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Prénom *
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={User}
												size={20}
												color={textSecondary}
											/>
										</InputSlot>
										<InputField
											type='text'
											placeholder='Entrez votre prénom'
											value={firstname}
											onChangeText={setFirstname}
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Nom */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Nom *
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={User}
												size={20}
												color={textSecondary}
											/>
										</InputSlot>
										<InputField
											type='text'
											placeholder='Entrez votre nom'
											value={lastname}
											onChangeText={setLastname}
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Téléphone */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Téléphone
									</Text>
									<HStack space='sm'>
										{/* Indicateur pays — bloqué +33 */}
										<Box
											style={{
												height: 36,
												paddingHorizontal: 14,
												borderRadius: 8,
												borderWidth: 1,
												borderColor: cardBorder,
												backgroundColor: cardBg,
												flexDirection: "row",
												alignItems: "center",
												gap: 6,
											}}>
											<Text
												style={{
													color: textPrimary,
													fontWeight: "600",
													fontSize: 14,
												}}>
												+33
											</Text>
										</Box>
										{/* Numéro */}
										<Input
											style={{
												flex: 1,
												backgroundColor: bg,
												borderColor: (() => {
													const digits =
														phone.replace(
															/\s/g,
															"",
														);
													if (!digits)
														return cardBorder;
													if (phoneStatus === "taken")
														return isDark
															? Colors.dark.danger
															: Colors.light
																	.danger;
													if (
														phoneStatus ===
														"available"
													)
														return isDark
															? Colors.dark
																	.success
															: Colors.light
																	.success;
													const startsOk =
														/^0[67]/.test(digits);
													if (
														!startsOk &&
														digits.length >= 2
													)
														return isDark
															? Colors.dark.danger
															: Colors.light
																	.danger;
													return cardBorder;
												})(),
												borderWidth: (() => {
													const digits =
														phone.replace(
															/\s/g,
															"",
														);
													if (
														phoneStatus ===
															"taken" ||
														phoneStatus ===
															"available"
													)
														return 1.5;
													const startsOk =
														/^0[67]/.test(digits);
													if (
														!startsOk &&
														digits.length >= 2
													)
														return 1.5;
													return 1;
												})(),
											}}>
											<InputField
												keyboardType='phone-pad'
												placeholder='06 12 34 56 78'
												value={phone}
												onChangeText={handlePhoneChange}
												maxLength={14}
												style={{ color: textPrimary }}
											/>
											{phoneChecking && (
												<InputSlot
													style={{
														paddingRight: 12,
													}}>
													<ActivityIndicator
														size='small'
														color={textSecondary}
													/>
												</InputSlot>
											)}
										</Input>
									</HStack>
									{phoneChecking ? null : phoneVerified ? (
										<HStack
											space='xs'
											style={{
												alignItems: "center",
												marginTop: 6,
											}}>
											<Icon
												as={CheckCircle}
												size='sm'
												style={{
													color: isDark
														? Colors.dark.success
														: Colors.light.success,
												}}
											/>
											<Text
												style={{
													fontSize: 12,
													color: isDark
														? Colors.dark.success
														: Colors.light.success,
												}}>
												Numéro vérifié
											</Text>
										</HStack>
									) : phoneStatus === "available" ? (
										<VStack
											space='sm'
											style={{ marginTop: 6 }}>
											{!otpSent ? (
												<>
													<Text
														style={{
															fontSize: 12,
															color: isDark
																? Colors.dark
																		.success
																: Colors.light
																		.success,
														}}>
														✓ Numéro disponible
													</Text>
													<TouchableOpacity
														onPress={handleSendOtp}
														disabled={otpSending}
														style={{
															alignSelf:
																"flex-start",
															paddingHorizontal: 16,
															paddingVertical: 8,
															borderRadius: 8,
															backgroundColor:
																tint,
															opacity: otpSending
																? 0.6
																: 1,
															flexDirection:
																"row",
															alignItems:
																"center",
															gap: 6,
														}}>
														{otpSending ? (
															<ActivityIndicator
																size='small'
																color='#fff'
															/>
														) : null}
														<Text
															style={{
																color: "#fff",
																fontSize: 14,
																fontWeight:
																	"600",
															}}>
															{otpSending
																? "Envoi en cours…"
																: "Valider par SMS"}
														</Text>
													</TouchableOpacity>
												</>
											) : (
												<>
													<Text
														style={{
															fontSize: 12,
															color: textSecondary,
														}}>
														Code envoyé par SMS —
														saisissez-le ci-dessous
													</Text>
													<HStack
														space='sm'
														style={{
															alignItems:
																"center",
														}}>
														<Input
															style={{
																flex: 1,
																backgroundColor:
																	bg,
																borderColor:
																	cardBorder,
															}}>
															<InputField
																keyboardType='number-pad'
																placeholder='Code OTP'
																value={otpInput}
																onChangeText={(
																	v,
																) => {
																	setOtpInput(
																		v,
																	);
																	setOtpError(
																		null,
																	);
																}}
																maxLength={6}
																style={{
																	color: textPrimary,
																	letterSpacing: 4,
																}}
															/>
														</Input>
														<TouchableOpacity
															onPress={
																handleVerifyOtp
															}
															disabled={
																otpVerifying ||
																otpInput.length <
																	4
															}
															style={{
																paddingHorizontal: 16,
																paddingVertical: 10,
																borderRadius: 8,
																backgroundColor:
																	tint,
																opacity:
																	otpVerifying ||
																	otpInput.length <
																		4
																		? 0.5
																		: 1,
																flexDirection:
																	"row",
																alignItems:
																	"center",
																gap: 6,
															}}>
															{otpVerifying ? (
																<ActivityIndicator
																	size='small'
																	color='#fff'
																/>
															) : null}
															<Text
																style={{
																	color: "#fff",
																	fontSize: 14,
																	fontWeight:
																		"600",
																}}>
																Vérifier
															</Text>
														</TouchableOpacity>
													</HStack>
													{otpError ===
														"wrong_code" && (
														<Text
															style={{
																fontSize: 12,
																color: isDark
																	? Colors
																			.dark
																			.danger
																	: Colors
																			.light
																			.danger,
																marginTop: 4,
															}}>
															Code incorrect,
															vérifiez votre SMS
														</Text>
													)}
													{otpError === "expired" && (
														<Text
															style={{
																fontSize: 12,
																color: isDark
																	? Colors
																			.dark
																			.warning
																	: Colors
																			.light
																			.warning,
																marginTop: 4,
															}}>
															Code expiré —
															cliquez sur
															"Renvoyer le code"
														</Text>
													)}
													{otpError === "server" && (
														<Text
															style={{
																fontSize: 12,
																color: isDark
																	? Colors
																			.dark
																			.danger
																	: Colors
																			.light
																			.danger,
																marginTop: 4,
															}}>
															Erreur serveur,
															réessayez
														</Text>
													)}
													<TouchableOpacity
														onPress={handleSendOtp}
														disabled={
															otpSending ||
															resendCooldown > 0
														}>
														<Text
															style={{
																fontSize: 11,
																color: textSecondary,
																marginTop: 2,
															}}>
															{resendCooldown > 0
																? `Renvoyer dans ${resendCooldown}s`
																: "Renvoyer le code"}
														</Text>
													</TouchableOpacity>
												</>
											)}
										</VStack>
									) : phoneStatus === "taken" ? (
										<Text
											style={{
												fontSize: 12,
												color: isDark
													? Colors.dark.danger
													: Colors.light.danger,
												marginTop: 4,
											}}>
											✕ Ce numéro est déjà utilisé
										</Text>
									) : (
										(() => {
											const digits = phone.replace(
												/\s/g,
												"",
											);
											if (!digits) return null;
											if (/^0[67]/.test(digits))
												return null;
											if (digits.length >= 2) {
												return (
													<Text
														style={{
															fontSize: 12,
															color: isDark
																? Colors.dark
																		.danger
																: Colors.light
																		.danger,
															marginTop: 4,
														}}>
														Le numéro doit commencer
														par 06 ou 07
													</Text>
												);
											}
											return null;
										})()
									)}
								</VStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Genre */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Genre
									</Text>
									<Select
										selectedValue={gender}
										onValueChange={setGender}>
										<SelectTrigger
											variant='outline'
											size='md'
											style={{
												backgroundColor: bg,
												borderColor: cardBorder,
											}}>
											<SelectInput
												placeholder='Sélectionnez votre genre'
												value={
													gender === "male"
														? "Homme"
														: gender === "female"
															? "Femme"
															: gender === "other"
																? "Autre"
																: ""
												}
												style={{
													color: textPrimary,
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
												<SelectItem
													label='Homme'
													value='male'
												/>
												<SelectItem
													label='Femme'
													value='female'
												/>
												<SelectItem
													label='Autre'
													value='other'
												/>
											</SelectContent>
										</SelectPortal>
									</Select>
								</VStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Date de naissance */}
								<VStack space='sm'>
									<Pressable
										onPress={() => setShowDatePicker(true)}>
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													color: textPrimary,
													fontWeight: "600",
													marginBottom: 6,
												}}>
												Date de naissance
											</Text>
											<Input
												// isDisabled
												isReadOnly
												pointerEvents='none'
												style={{
													backgroundColor: bg,
													borderColor: cardBorder,
												}}>
												<InputSlot
													style={{ paddingLeft: 12 }}>
													<InputIcon
														as={Calendar}
														size={20}
														color={textSecondary}
													/>
												</InputSlot>
												<InputField
													value={birthday.toLocaleDateString(
														"fr-FR",
													)}
													editable={false}
													style={{
														color: textPrimary,
													}}
												/>
											</Input>
										</VStack>
									</Pressable>
									<DateTimePickerModal
										isVisible={showDatePicker}
										mode='date'
										date={birthday}
										onConfirm={handleConfirmDate}
										onCancel={handleCancelDate}
										maximumDate={new Date()}
										locale='fr_FR'
										cancelTextIOS='Annuler'
										confirmTextIOS='Confirmer'
									/>
								</VStack>
								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Code Postal */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Code Postal
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={MapPin}
												size={20}
												color={textSecondary}
											/>
										</InputSlot>
										<InputField
											type='text'
											placeholder='Entrez votre code postal'
											value={postcodeSearch}
											onChangeText={(text) => {
												setPostcodeSearch(text);
												searchCities(text);
											}}
											keyboardType='numeric'
											maxLength={5}
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								{/* Ville */}
								{cities.length > 0 && (
									<VStack space='sm'>
										<Text
											size='sm'
											style={{
												color: textPrimary,
												fontWeight: "600",
											}}>
											Sélectionnez votre ville
										</Text>
										<VStack space='xs'>
											{cities.map((cityData) => (
												<TouchableOpacity
													key={cityData.code}
													onPress={() =>
														selectCity(cityData)
													}>
													<Box
														style={{
															padding: 12,
															backgroundColor:
																city ===
																cityData.nom
																	? isDark
																		? Colors
																				.dark
																				.background
																		: "#dbeafe"
																	: cardBg,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																city ===
																cityData.nom
																	? tint
																	: cardBorder,
														}}>
														<Text
															style={{
																color: textPrimary,
															}}>
															{cityData.nom} (
															{
																cityData.codeDepartement
															}
															)
														</Text>
													</Box>
												</TouchableOpacity>
											))}
										</VStack>
									</VStack>
								)}

								{city && (
									<>
										<Divider
											style={{
												backgroundColor: cardBorder,
											}}
										/>

										{/* Ville sélectionnée */}
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													color: textPrimary,
													fontWeight: "600",
												}}>
												Ville
											</Text>
											<Text
												style={{
													color: textSecondary,
												}}>
												{`${city} (${postcode})`}
											</Text>
										</VStack>
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													color: textPrimary,
													fontWeight: "600",
												}}>
												Département
											</Text>
											<Text
												style={{
													color: textSecondary,
												}}>
												{department} ({departmentCode})
											</Text>
										</VStack>

										{/* Région */}
										<VStack space='sm'>
											<Text
												size='sm'
												style={{
													color: textPrimary,
													fontWeight: "600",
												}}>
												Région
											</Text>
											<Text
												style={{
													color: textSecondary,
												}}>
												{region}
											</Text>
										</VStack>
									</>
								)}

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Ancien militaire */}
								<HStack
									space='md'
									style={{
										alignItems: "center",
										justifyContent: "space-between",
									}}>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={Shield}
											size={20}
											color={textSecondary}
										/>
										<Text
											size='sm'
											style={{
												color: textPrimary,
												fontWeight: "600",
											}}>
											Ancien militaire
										</Text>
									</HStack>
									<Switch
										value={formerSoldier}
										onValueChange={setFormerSoldier}
									/>
								</HStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Permis de conduire */}
								<VStack space='sm'>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={Car}
											size='md'
											style={{ color: tint }}
										/>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: textPrimary,
											}}>
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
												justifyContent: "space-between",
												padding: 12,
												borderRadius: 8,
												borderWidth: 1,
												borderColor:
													drivingLicenses.length > 0
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
															? Colors.light.tint
															: textSecondary,
													fontWeight:
														drivingLicenses.length >
														0
															? "600"
															: "400",
												}}>
												{drivingLicenses.length > 0
													? `${drivingLicenses.length} permis sélectionné${
															drivingLicenses.length >
															1
																? "s"
																: ""
														}`
													: "Sélectionnez vos permis"}
											</Text>
											<Icon
												as={ChevronDown}
												size='sm'
												style={{
													color:
														drivingLicenses.length >
														0
															? Colors.light.tint
															: textSecondary,
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
											{drivingLicenses.map((acronym) => (
												<Box
													key={acronym}
													style={{
														paddingHorizontal: 8,
														paddingVertical: 3,
														borderRadius: 6,
														borderWidth: 1,
														borderColor: cardBorder,
														backgroundColor: cardBg,
														marginBottom: 4,
													}}>
													<Text
														style={{
															fontSize: 11,
															fontWeight: "700",
															color: textPrimary,
														}}>
														{acronym}
													</Text>
												</Box>
											))}
										</HStack>
									)}
								</VStack>
								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

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
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: textPrimary,
											}}>
											Langues parlées
										</Text>
									</HStack>
									<HStack space='sm'>
										<Input
											style={{
												flex: 1,
												backgroundColor: bg,
												borderColor: cardBorder,
											}}>
											<InputField
												placeholder='Ex: Anglais, Espagnol'
												value={currentLanguage}
												onChangeText={
													setCurrentLanguage
												}
												style={{ color: textPrimary }}
											/>
										</Input>
										<Button
											size='md'
											variant='outline'
											onPress={addLanguage}
											style={{
												borderColor: cardBorder,
												backgroundColor: cardBg,
											}}>
											<ButtonIcon
												as={Plus}
												style={{ color: textSecondary }}
											/>
										</Button>
									</HStack>
									{languages.length > 0 && (
										<VStack
											space='xs'
											style={{ marginTop: 8 }}>
											{languages.map(
												(language, index) => (
													<HStack
														key={index}
														space='sm'
														style={{
															alignItems:
																"center",
															padding: 8,
															backgroundColor: bg,
															borderRadius: 8,
														}}>
														<Box
															style={{
																width: 6,
																height: 6,
																borderRadius: 3,
																backgroundColor:
																	Colors.light
																		.tint,
															}}
														/>
														<Text
															size='sm'
															style={{
																flex: 1,
																color: textPrimary,
															}}>
															{language}
														</Text>
														<Button
															size='xs'
															variant='link'
															onPress={() =>
																removeLanguage(
																	index,
																)
															}>
															<ButtonIcon
																as={Trash2}
																size='sm'
																style={{
																	color: Colors
																		.dark
																		.danger,
																}}
															/>
														</Button>
													</HStack>
												),
											)}
										</VStack>
									)}
								</VStack>
								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Taille */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Taille
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={Ruler}
												size={20}
												color={textSecondary}
											/>
										</InputSlot>
										<InputField
											type='text'
											placeholder='Votre taille en cm'
											value={height}
											onChangeText={setHeight}
											keyboardType='numeric'
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
									<Text
										size='xs'
										style={{
											color: textSecondary,
										}}>
										En centimètres (ex: 175)
									</Text>
								</VStack>

								<Divider
									style={{
										backgroundColor: cardBorder,
									}}
								/>

								{/* Poids */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: textPrimary,
											fontWeight: "600",
										}}>
										Poids
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={Ruler}
												size={20}
												color={textSecondary}
											/>
										</InputSlot>
										<InputField
											type='text'
											placeholder='Votre poids en kg'
											value={weight}
											onChangeText={setWeight}
											keyboardType='numeric'
											style={{
												color: textPrimary,
											}}
										/>
									</Input>
									<Text
										size='xs'
										style={{
											color: textSecondary,
										}}>
										En kilogrammes (ex: 70)
									</Text>
								</VStack>
							</VStack>
						</Card>
					</VStack>
				</ScrollView>
				{/* Bouton fixe bas de page */}
				<View
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						padding: 20,
						paddingBottom: 36,
						backgroundColor: bg,
						borderTopWidth: 1,
						borderTopColor: cardBorder,
					}}>
					<TouchableOpacity
						onPress={handleUpdateProfile}
						disabled={isSubmitting}
						activeOpacity={0.7}
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							borderWidth: 1,
							borderColor: tint,
							backgroundColor: cardBg,
							borderRadius: 10,
							height: 52,
						}}>
						{isSubmitting ? (
							<ActivityIndicator size='small' color={tint} />
						) : (
							<>
								<CheckCircle size={20} color={tint} />
								<Text
									style={{
										color: tint,
										fontSize: 15,
										fontWeight: "600",
									}}>
									Enregistrer
								</Text>
							</>
						)}
					</TouchableOpacity>
				</View>
			</View>

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
						maxHeight: "80%",
						paddingBottom: 32,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack style={{ width: "100%", paddingTop: 8 }} space='sm'>
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
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
							style={{ width: "100%" }}>
							<VStack space='lg' style={{ paddingBottom: 16 }}>
								{(() => {
									const DL_GROUP_LABELS = {
										moto: "Moto",
										vehicule_leger:
											"V\u00e9hicule l\u00e9ger",
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
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
																				: isDark
																					? Colors
																							.dark
																							.border
																					: Colors
																							.light
																							.border,
																		backgroundColor:
																			isSel
																				? isDark
																					? Colors
																							.dark
																							.tint
																					: "#dbeafe"
																				: isDark
																					? Colors
																							.dark
																							.cardBackground
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
																						: isDark
																							? Colors
																									.dark
																									.border
																							: Colors
																									.light
																									.border,
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
																						: isDark
																							? Colors
																									.dark
																									.muted
																							: Colors
																									.light
																									.muted,
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
																					: isDark
																						? Colors
																								.dark
																								.text
																						: Colors
																								.light
																								.text,
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
						<Button
							style={{
								backgroundColor: Colors.light.tint,
								marginTop: 8,
							}}
							onPress={() => setShowDrivingLicenseSheet(false)}>
							<ButtonText
								style={{ color: Colors.light.cardBackground }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
};

export default UpdateProfile;
