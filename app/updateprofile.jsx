import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
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
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
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
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";

const UpdateProfile = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { update, getById, getAll, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [gender, setGender] = useState("");
	const [birthday, setBirthday] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [postcode, setPostcode] = useState("");
	const [city, setCity] = useState("");
	const [department, setDepartment] = useState("");
	const [region, setRegion] = useState("");
	const [departmentCode, setDepartmentCode] = useState("");
	const [regionCode, setRegionCode] = useState("");
	const [latitude, setLatitude] = useState(null);
	const [longitude, setLongitude] = useState(null);
	const [formerSoldier, setFormerSoldier] = useState(false);
	const [drivingLicenses, setDrivingLicenses] = useState("");
	const [languages, setLanguages] = useState("");
	const [height, setHeight] = useState("");
	const [weight, setWeight] = useState("");
	const [phone, setPhone] = useState("");
	const [phoneChecking, setPhoneChecking] = useState(false);
	const [phoneStatus, setPhoneStatus] = useState(null); // null | 'available' | 'taken'
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
				setCity(profile.city || "");
				setDepartment(profile.department || "");
				setRegion(profile.region || "");
				setDepartmentCode(profile.department_code || "");
				setRegionCode(profile.region_code || "");
				setLatitude(profile.latitude || null);
				setLongitude(profile.longitude || null);
				setFormerSoldier(profile.former_soldier || false);
				setDrivingLicenses(profile.driving_licenses || "");
				setLanguages(profile.languages || "");
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

	const handleUpdateProfile = async () => {
		if (!firstname || !lastname) {
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Champs obligatoires</ToastTitle>
							<ToastDescription>
								Veuillez remplir votre prénom et nom.
							</ToastDescription>
						</VStack>
					</Toast>
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
				driving_licenses: drivingLicenses,
				languages,
				height: height ? parseFloat(height) : null,
				weight: weight ? parseFloat(weight) : null,
				phone: phone
					? `+33${phone.replace(/\s/g, "").replace(/^0/, "")}`
					: null,
			});

			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon as={CheckCircle} />
						<VStack>
							<ToastTitle>Profil mis à jour !</ToastTitle>
							<ToastDescription>
								Les informations ont été enregistrées avec
								succès.
							</ToastDescription>
						</VStack>
					</Toast>
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
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon as={AlertCircle} />
						<VStack>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Impossible de mettre à jour le profil.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setIsSubmitting(false);
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
			).then(({ data }) => {
				console.warn("[phone check] query pour", e164, "→ résultat brut :", data);
				if (data?.length > 0) {
					console.warn(`[phone check] ❌ Numéro ${e164} déjà utilisé par profil id=${data[0].id}`);
					setPhoneStatus("taken");
				} else {
					console.warn(`[phone check] ✅ Numéro ${e164} disponible`);
					setPhoneStatus("available");
				}
			}).catch((err) => {
				console.warn("[phone check] erreur requête :", err?.message || err);
			}).finally(() => {
				setPhoneChecking(false);
			});
		}
	};

	if (loading) {
		return (
			<Box
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
					justifyContent: "center",
					alignItems: "center",
				}}>
				<Text style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
					Chargement...
				</Text>
			</Box>
		);
	}

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack space='lg' style={{ padding: 20 }}>
				{/* Header Card */}
				{/* <Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: "#2563eb",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon as={User} size={24} color='#ffffff' />
						</Box>
						<VStack style={{ flex: 1 }}>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Modifier mon profil
							</Heading>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
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
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<VStack space='lg'>
						{/* Prénom */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Prénom *
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={User}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Entrez votre prénom'
									value={firstname}
									onChangeText={setFirstname}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Nom */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Nom *
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={User}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Entrez votre nom'
									value={lastname}
									onChangeText={setLastname}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Téléphone */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
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
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
										backgroundColor: isDark
											? "#374151"
											: "#f3f4f6",
										flexDirection: "row",
										alignItems: "center",
										gap: 6,
									}}>
									<Text
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
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
										backgroundColor: isDark ? "#1f2937" : "#f9fafb",
										borderColor: (() => {
											const digits = phone.replace(/\s/g, "");
											if (!digits) return isDark ? "#4b5563" : "#d1d5db";
											if (phoneStatus === "taken") return "#ef4444";
											if (phoneStatus === "available") return "#16a34a";
											const startsOk = /^0[67]/.test(digits);
											if (!startsOk && digits.length >= 2) return "#ef4444";
											return isDark ? "#4b5563" : "#d1d5db";
										})(),
										borderWidth: (() => {
											const digits = phone.replace(/\s/g, "");
											if (phoneStatus === "taken" || phoneStatus === "available") return 1.5;
											const startsOk = /^0[67]/.test(digits);
											if (!startsOk && digits.length >= 2) return 1.5;
											return 1;
										})(),
									}}>
									<InputField
										keyboardType='phone-pad'
										placeholder='06 12 34 56 78'
										value={phone}
										onChangeText={handlePhoneChange}
										maxLength={14}
										style={{ color: isDark ? "#f3f4f6" : "#111827" }}
									/>
									{phoneChecking && (
										<InputSlot style={{ paddingRight: 12 }}>
											<ActivityIndicator size='small' color={isDark ? "#9ca3af" : "#6b7280"} />
										</InputSlot>
									)}
								</Input>
							</HStack>
							{phoneChecking ? null : phoneStatus === "available" ? (
								<Text style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
									✓ Numéro disponible
								</Text>
							) : phoneStatus === "taken" ? (
								<Text style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
									✕ Ce numéro est déjà utilisé
								</Text>
							) : (() => {
								const digits = phone.replace(/\s/g, "");
								if (!digits) return null;
								if (/^0[67]/.test(digits)) return null;
								if (digits.length >= 2) {
									return (
										<Text style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
											Le numéro doit commencer par 06 ou 07
										</Text>
									);
								}
								return null;
							})()}
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Genre */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
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
										backgroundColor: isDark
											? "#1f2937"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#d1d5db",
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
											color: isDark
												? "#f3f4f6"
												: "#111827",
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
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Date de naissance */}
						<VStack space='sm'>
							<Pressable onPress={() => setShowDatePicker(true)}>
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
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
											backgroundColor: isDark
												? "#1f2937"
												: "#f9fafb",
											borderColor: isDark
												? "#4b5563"
												: "#d1d5db",
										}}>
										<InputSlot style={{ paddingLeft: 12 }}>
											<InputIcon
												as={Calendar}
												size={20}
												color={
													isDark
														? "#9ca3af"
														: "#6b7280"
												}
											/>
										</InputSlot>
										<InputField
											value={birthday.toLocaleDateString(
												"fr-FR",
											)}
											editable={false}
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
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
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Code Postal */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Code Postal
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={MapPin}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Entrez votre code postal'
									value={postcode}
									defaultValue={postcode}
									onChangeText={(text) => {
										setPostcode(text);
										searchCities(text);
									}}
									keyboardType='numeric'
									maxLength={5}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
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
										color: isDark ? "#f3f4f6" : "#111827",
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
														city === cityData.nom
															? isDark
																? "#1f2937"
																: "#dbeafe"
															: isDark
																? "#374151"
																: "#f9fafb",
													borderRadius: 8,
													borderWidth: 1,
													borderColor:
														city === cityData.nom
															? "#2563eb"
															: isDark
																? "#4b5563"
																: "#d1d5db",
												}}>
												<Text
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{cityData.nom} (
													{cityData.codeDepartement})
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
										backgroundColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}
								/>

								{/* Ville sélectionnée */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
										}}>
										Ville
									</Text>
									<Text
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{city}
									</Text>
								</VStack>

								{/* Département */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
										}}>
										Département
									</Text>
									<Text
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{department} ({departmentCode})
									</Text>
								</VStack>

								{/* Région */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
										}}>
										Région
									</Text>
									<Text
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{region}
									</Text>
								</VStack>
							</>
						)}

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Ancien militaire */}
						<HStack
							space='md'
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Shield}
									size={20}
									color={isDark ? "#9ca3af" : "#6b7280"}
								/>
								<Text
									size='sm'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
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
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Permis de conduire */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Permis de conduire
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Car}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Ex: B, A, C'
									value={drivingLicenses}
									onChangeText={setDrivingLicenses}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Séparez par des virgules (ex: B, A, C)
							</Text>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Langues */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Langues parlées
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Languages}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Ex: Français, Anglais, Espagnol'
									value={languages}
									onChangeText={setLanguages}
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Séparez par des virgules
							</Text>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Taille */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Taille
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Ruler}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Votre taille en cm'
									value={height}
									onChangeText={setHeight}
									keyboardType='numeric'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								En centimètres (ex: 175)
							</Text>
						</VStack>

						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>

						{/* Poids */}
						<VStack space='sm'>
							<Text
								size='sm'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
								}}>
								Poids
							</Text>
							<Input
								style={{
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<InputSlot style={{ paddingLeft: 12 }}>
									<InputIcon
										as={Ruler}
										size={20}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
								</InputSlot>
								<InputField
									type='text'
									placeholder='Votre poids en kg'
									value={weight}
									onChangeText={setWeight}
									keyboardType='numeric'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
							</Input>
							<Text
								size='xs'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								En kilogrammes (ex: 70)
							</Text>
						</VStack>
					</VStack>
				</Card>

				{/* Action Buttons */}
				<HStack space='md' style={{ justifyContent: "flex-end" }}>
					<Button
						variant='outline'
						onPress={() => router.back()}
						disabled={isSubmitting}
						style={{
							borderColor: isDark ? "#4b5563" : "#d1d5db",
						}}>
						<ButtonText
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Annuler
						</ButtonText>
					</Button>
					<Button
						onPress={handleUpdateProfile}
						disabled={isSubmitting}
						style={{
							backgroundColor: "#2563eb",
						}}>
						{isSubmitting ? (
							<ButtonText style={{ color: "#ffffff" }}>
								Enregistrement...
							</ButtonText>
						) : (
							<>
								<ButtonIcon
									as={CheckCircle}
									size={20}
									color='#ffffff'
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									Enregistrer
								</ButtonText>
							</>
						)}
					</Button>
				</HStack>
			</VStack>
		</ScrollView>
	);
};

export default UpdateProfile;
