import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
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
	const { update, getById } = useDataContext();
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
