import React, { useState, useRef } from "react";
import {
	ScrollView,
	Platform,
	TouchableOpacity,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import axios from "axios";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import {
	Checkbox,
	CheckboxGroup,
	CheckboxIcon,
	CheckboxIndicator,
	CheckboxLabel,
} from "@/components/ui/checkbox";

import {
	Briefcase,
	MapPin,
	BadgeEuro,
	FileText,
	Clock,
	Users,
	Timer,
	ChevronDown,
	Save,
	X,
	Plus,
	Trash2,
	ChevronLeft,
	ChevronRight,
	GraduationCap,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const result = {
	accommodations: true,
	category: "Agent cynophile",
	city: "Levallois-Perret",
	contract_type: "CDI",
	department: "Hauts-de-Seine",
	department_code: "92",
	description: "Pirhozegopienrgoif",
	diplomas_required: "",
	driving_licenses: "",
	end_date: null,
	end_time: "23:33",
	experience_required: "2",
	isLastMinute: true,
	languages: "",
	latitude: 48.8946,
	longitude: 2.2874,
	packed_lunch: true,
	postcode: "92300",
	region: "Île-de-France",
	region_code: "11",
	reimbursements: "",
	salary_hourly: "15",
	start_date: "2026-03-19T04:16:53.000Z",
	start_time: "22:22",
	title: "Uerhgeonmrgop",
	weekly_hours: "35",
	work_schedule: "Jour",
	work_time: "Temps plein",
};

const CATEGORIES = [
	"Agent de sécurité",
	"Chef d'équipe",
	"Agent cynophile",
	"Agent SSIAP",
	"Agent de surveillance",
	"Autres",
];

const CONTRACT_TYPES = ["CDI", "CDD", "Intérim", "Vacation"];
const WORK_TIME = ["Temps plein", "Temps partiel"];
const WORK_SCHEDULE = ["Jour", "Nuit", "Variable"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STEPS = [
	{ id: 1, title: "Informations principales" },
	{ id: 2, title: "Localisation et contrat" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Détails" },
];

const PostJob = () => {
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();
	const { create } = useDataContext();
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null]);
	const startTimeInputRef = useRef(null);
	const endTimeInputRef = useRef(null);
	const diplomaInputRef = useRef(null);
	const drivingLicenseInputRef = useRef(null);
	const languageInputRef = useRef(null);
	const reimbursementInputRef = useRef(null);
	const [missionsList, setMissionsList] = useState([]);
	const [currentMission, setCurrentMission] = useState("");
	const [profileList, setProfileList] = useState([]);
	const [currentProfile, setCurrentProfile] = useState("");
	const [diplomasList, setDiplomasList] = useState([]);
	const [currentDiploma, setCurrentDiploma] = useState("");
	const [drivingLicensesList, setDrivingLicensesList] = useState([]);
	const [currentDrivingLicense, setCurrentDrivingLicense] = useState("");
	const [languagesList, setLanguagesList] = useState([]);
	const [currentLanguage, setCurrentLanguage] = useState("");
	const [reimbursementsList, setReimbursementsList] = useState([]);
	const [currentReimbursement, setCurrentReimbursement] = useState("");
	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showStartTimePicker, setShowStartTimePicker] = useState(false);
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);
	const [cities, setCities] = useState([]);
	const [formData, setFormData] = useState({
		title: "",
		category: "",
		description: "",
		city: "",
		postcode: "",
		department: "",
		department_code: "",
		region: "",
		region_code: "",
		latitude: null,
		longitude: null,
		contract_type: "CDI",
		work_time: "Temps plein",
		work_schedule: "Jour",
		start_date: null,
		end_date: null,
		start_time: "",
		end_time: "",
		salary_hourly: "",
		weekly_hours: "",
		experience_required: "",
		diplomas_required: "",
		driving_licenses: "",
		languages: "",
		reimbursements: "",
		packed_lunch: false,
		accommodations: false,
		isLastMinute: false,
	});

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
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
			console.log("Cities API response:", response.data);
			setCities(response.data);
		} catch (error) {
			console.error("Error fetching cities:", error);
		}
	};

	const selectCity = (cityData) => {
		setFormData((prev) => ({
			...prev,
			city: cityData.nom,
			department: cityData.departement?.nom || "",
			region: cityData.region?.nom || "",
			department_code: cityData.codeDepartement || "",
			region_code: cityData.codeRegion || "",
			latitude: cityData.centre?.coordinates[1] || null,
			longitude: cityData.centre?.coordinates[0] || null,
		}));
		setCities([]);
	};

	const addMission = () => {
		if (currentMission.trim()) {
			setMissionsList((prev) => [...prev, currentMission.trim()]);
			setCurrentMission("");
		}
	};

	const removeMission = (index) => {
		setMissionsList((prev) => prev.filter((_, i) => i !== index));
	};

	const addProfile = () => {
		if (currentProfile.trim()) {
			setProfileList((prev) => [...prev, currentProfile.trim()]);
			setCurrentProfile("");
		}
	};

	const addDiploma = () => {
		if (currentDiploma.trim()) {
			setDiplomasList((prev) => [...prev, currentDiploma.trim()]);
			setCurrentDiploma("");
		}
	};

	const removeDiploma = (index) => {
		setDiplomasList((prev) => prev.filter((_, i) => i !== index));
	};

	const addDrivingLicense = () => {
		if (currentDrivingLicense.trim()) {
			setDrivingLicensesList((prev) => [
				...prev,
				currentDrivingLicense.trim(),
			]);
			setCurrentDrivingLicense("");
		}
	};

	const removeDrivingLicense = (index) => {
		setDrivingLicensesList((prev) => prev.filter((_, i) => i !== index));
	};

	const addLanguage = () => {
		if (currentLanguage.trim()) {
			setLanguagesList((prev) => [...prev, currentLanguage.trim()]);
			setCurrentLanguage("");
		}
	};

	const removeLanguage = (index) => {
		setLanguagesList((prev) => prev.filter((_, i) => i !== index));
	};

	const addReimbursement = () => {
		if (currentReimbursement.trim()) {
			setReimbursementsList((prev) => [
				...prev,
				currentReimbursement.trim(),
			]);
			setCurrentReimbursement("");
		}
	};

	const removeReimbursement = (index) => {
		setReimbursementsList((prev) => prev.filter((_, i) => i !== index));
	};

	const removeProfile = (index) => {
		setProfileList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleStartDateChange = (event, selectedDate) => {
		if (Platform.OS === "android") {
			setShowStartDatePicker(false);
		}
		if (selectedDate) {
			updateField("start_date", selectedDate);
		}
	};

	const handleEndDateChange = (event, selectedDate) => {
		if (Platform.OS === "android") {
			setShowEndDatePicker(false);
		}
		if (selectedDate) {
			updateField("end_date", selectedDate);
		}
	};

	const formatDate = (date) => {
		if (!date) return "Sélectionner une date";
		const d = new Date(date);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const scrollToInput = (inputRef, stepIndex = 1) => {
		if (inputRef.current && scrollViewRefs.current[stepIndex]) {
			setTimeout(() => {
				inputRef.current.measureLayout(
					scrollViewRefs.current[stepIndex],
					(x, y) => {
						scrollViewRefs.current[stepIndex].scrollTo({
							y: y - 100,
							animated: true,
						});
					},
					() => {},
				);
			}, 100);
		}
	};

	const formatTimeInput = (value, field) => {
		// Ne garder que les chiffres
		const numbers = value.replace(/[^0-9]/g, "");

		// Limiter à 4 chiffres (HHMM)
		const limited = numbers.slice(0, 4);

		// Formater automatiquement
		let formatted = "";
		if (limited.length === 0) {
			formatted = "";
		} else if (limited.length === 1) {
			formatted = limited;
		} else if (limited.length === 2) {
			const validHours = Math.min(parseInt(limited), 23)
				.toString()
				.padStart(2, "0");
			formatted = validHours;
		} else if (limited.length === 3) {
			const hours = limited.slice(0, 2);
			const minutes = limited.slice(2, 3);
			const validHours = Math.min(parseInt(hours), 23)
				.toString()
				.padStart(2, "0");
			formatted = `${validHours}:${minutes}`;
		} else {
			// length === 4
			const hours = limited.slice(0, 2);
			const minutes = limited.slice(2, 4);
			const validHours = Math.min(parseInt(hours), 23)
				.toString()
				.padStart(2, "0");
			const validMinutes = Math.min(parseInt(minutes), 59)
				.toString()
				.padStart(2, "0");
			formatted = `${validHours}:${validMinutes}`;
		}

		updateField(field, formatted);
	};

	const goToNextStep = () => {
		if (currentStep < STEPS.length) {
			Animated.timing(scrollX, {
				toValue: -SCREEN_WIDTH * currentStep,
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep + 1);
			// Scroll vers le haut de la prochaine étape
			setTimeout(() => {
				if (scrollViewRefs.current[currentStep]) {
					scrollViewRefs.current[currentStep].scrollTo({
						y: 0,
						animated: true,
					});
				}
			}, 100);
		}
	};

	const goToPreviousStep = () => {
		if (currentStep > 1) {
			Animated.timing(scrollX, {
				toValue: -SCREEN_WIDTH * (currentStep - 2),
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep - 1);
			// Scroll vers le haut de l'étape précédente
			setTimeout(() => {
				if (scrollViewRefs.current[currentStep - 2]) {
					scrollViewRefs.current[currentStep - 2].scrollTo({
						y: 0,
						animated: true,
					});
				}
			}, 100);
		}
	};

	const validateStep = () => {
		switch (currentStep) {
			case 1:
				if (
					!formData.title ||
					!formData.category ||
					!formData.description
				) {
					toast.error("Erreur", {
						description:
							"Veuillez remplir tous les champs obligatoires",
					});
					return false;
				}
				break;
			case 2:
				if (!formData.city || !formData.start_date) {
					toast.error("Erreur", {
						description:
							"Veuillez remplir tous les champs obligatoires",
					});
					return false;
				}
				if (formData.contract_type !== "CDI" && !formData.end_date) {
					toast.error("Erreur", {
						description:
							"La date de fin est obligatoire pour ce type de contrat",
					});
					return false;
				}
				break;
			case 3:
				if (!formData.salary_hourly) {
					toast.error("Erreur", {
						description: "Veuillez indiquer le salaire horaire",
					});
					return false;
				}
				if (!formData.weekly_hours) {
					toast.error("Erreur", {
						description:
							"Veuillez indiquer le nombre d'heures par semaine",
					});
					return false;
				}
				break;
			case 4:
				// Pas de validation obligatoire pour l'étape 4
				break;
		}
		return true;
	};

	const handleNextStep = () => {
		if (validateStep()) {
			if (currentStep === STEPS.length) {
				handleSubmit();
			} else {
				goToNextStep();
			}
		}
	};

	const handleSubmit = async () => {
		console.log("form data to submit:", formData);
		// setLoading(true);
		// try {
		// 	// Convertir les listes en strings (une par ligne)
		// 	const missionsString = missionsList.join("\n");
		// 	const profileString = profileList.join("\n");
		// 	const diplomasString = diplomasList.join("\n");
		// 	const drivingLicensesString = drivingLicensesList.join("\n");
		// 	const languagesString = languagesList.join("\n");
		// 	const reimbursementsString = reimbursementsList.join("\n");

		// 	// Construire le string de salaire
		// 	let salaryString = "";
		// 	if (formData.salary_hourly && formData.weekly_hours) {
		// 		const monthlySalary = (
		// 			(parseFloat(formData.salary_hourly) *
		// 				parseFloat(formData.weekly_hours) *
		// 				52) /
		// 			12
		// 		).toFixed(2);
		// 		salaryString = `${formData.salary_hourly}€/h - ${formData.weekly_hours}h/semaine (~${monthlySalary}€/mois)`;
		// 	}

		// 	// Formater les dates au format ISO pour la base de données
		// 	const startDateISO = formData.start_date
		// 		? formData.start_date.toISOString().split("T")[0]
		// 		: null;
		// 	const endDateISO = formData.end_date
		// 		? formData.end_date.toISOString().split("T")[0]
		// 		: null;

		// 	await create("jobs", {
		// 		...formData,
		// 		start_date: startDateISO,
		// 		end_date: endDateISO,
		// 		missions: missionsString,
		// 		profile_sought: profileString,
		// 		diplomas_required: diplomasString,
		// 		driving_licenses: drivingLicensesString,
		// 		languages: languagesString,
		// 		reimbursements: reimbursementsString,
		// 		salary: salaryString,
		// 		company_id: user.id,
		// 		isArchived: false,
		// 	});

		// 	toast.success("Offre publiée", {
		// 		description: "Votre offre d'emploi a été publiée avec succès",
		// 	});

		// 	// Rediriger vers la liste des offres
		// 	router.push("/offers");
		// } catch (error) {
		// 	console.error("Erreur lors de la publication:", error);
		// 	toast.error("Erreur", {
		// 		description:
		// 			"Une erreur est survenue lors de la publication de l'offre",
		// 	});
		// } finally {
		// 	setLoading(false);
		// }

		// 	router.back();
		// } catch (error) {
		// 	console.error("Erreur création offre:", error);
		// 	toast.error("Erreur", {
		// 		description: "Impossible de publier l'offre",
		// 	});
		// } finally {
		// 	setLoading(false);
		// }
	};

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			{/* Progress Bar */}
			<Box
				style={{
					paddingTop: 15,
					paddingHorizontal: 20,
					paddingBottom: 15,
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderBottomWidth: 1,
					borderBottomColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<VStack space='sm'>
					<HStack
						space='sm'
						style={{
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							size='sm'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							{STEPS[currentStep - 1].title}
						</Text>
						<Text
							size='xs'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}>
							Étape {currentStep}/{STEPS.length}
						</Text>
					</HStack>
					{/* Barre de progression */}
					<Box
						style={{
							width: "100%",
							height: 8,
							backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							borderRadius: 4,
							overflow: "hidden",
						}}>
						<Box
							style={{
								width: `${(currentStep / STEPS.length) * 100}%`,
								height: "100%",
								backgroundColor: "#3b82f6",
								borderRadius: 4,
							}}
						/>
					</Box>
				</VStack>
			</Box>

			{/* Carousel Container */}
			<Animated.View
				style={{
					flexDirection: "row",
					transform: [{ translateX: scrollX }],
					flex: 1,
					paddingBottom: 30,
				}}>
				{/* Étape 1: Informations principales */}
				<Box style={{ width: SCREEN_WIDTH }}>
					<ScrollView
						ref={(ref) => (scrollViewRefs.current[0] = ref)}>
						<VStack
							space='lg'
							style={{ padding: 20, paddingBottom: 100 }}>
							<Card
								style={{
									padding: 20,
									paddingBottom: 40,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<VStack space='md'>
									{/* Titre */}
									<VStack space='xs'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Titre du poste *
										</Text>
										<Input
											variant='outline'
											size='md'
											style={{
												backgroundColor: isDark
													? "#1f2937"
													: "#ffffff",
												borderColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}>
											<InputField
												placeholder='Ex: Agent de sécurité H/F'
												value={formData.title}
												onChangeText={(value) =>
													updateField("title", value)
												}
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
										</Input>
									</VStack>

									{/* Catégorie */}
									<VStack space='xs'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Catégorie *
										</Text>
										<Select
											selectedValue={formData.category}
											onValueChange={(value) =>
												updateField("category", value)
											}>
											<SelectTrigger
												variant='outline'
												size='md'
												style={{
													backgroundColor: isDark
														? "#1f2937"
														: "#ffffff",
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}>
												<SelectInput
													placeholder='Sélectionnez une catégorie'
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
												<SelectIcon
													as={ChevronDown}
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}
												/>
											</SelectTrigger>
											<SelectPortal>
												<SelectBackdrop />
												<SelectContent>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
													{CATEGORIES.map((cat) => (
														<SelectItem
															key={cat}
															label={cat}
															value={cat}
														/>
													))}
												</SelectContent>
											</SelectPortal>
										</Select>
									</VStack>

									{/* Description */}
									<VStack space='xs'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Description du poste *
										</Text>
										<Textarea
											size='md'
											style={{
												backgroundColor: isDark
													? "#1f2937"
													: "#ffffff",
												borderColor: isDark
													? "#4b5563"
													: "#e5e7eb",
												minHeight: 120,
											}}>
											<TextareaInput
												placeholder='Décrivez le poste et les responsabilités...'
												value={formData.description}
												onChangeText={(value) =>
													updateField(
														"description",
														value,
													)
												}
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
										</Textarea>
									</VStack>
								</VStack>
							</Card>
						</VStack>
					</ScrollView>
				</Box>

				{/* Étape 2: Localisation et contrat */}
				<Box style={{ width: SCREEN_WIDTH }}>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						style={{ flex: 1 }}
						keyboardVerticalOffset={100}>
						<ScrollView
							ref={(ref) => (scrollViewRefs.current[1] = ref)}
							keyboardShouldPersistTaps='handled'>
							<VStack
								space='lg'
								style={{ padding: 20, paddingBottom: 100 }}>
								{/* Localisation */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={MapPin}
												size='lg'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Localisation
											</Heading>
										</HStack>

										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>

										{/* Code postal */}
										<VStack space='xs'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Code postal *
											</Text>
											<Input
												variant='outline'
												size='md'
												style={{
													backgroundColor: isDark
														? "#1f2937"
														: "#ffffff",
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}>
												<InputField
													placeholder='Entrez le code postal'
													value={formData.postcode}
													onChangeText={(text) => {
														updateField(
															"postcode",
															text,
														);
														searchCities(text);
													}}
													keyboardType='numeric'
													maxLength={5}
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
											</Input>
										</VStack>

										{/* Liste des villes */}
										{cities.length > 0 && (
											<VStack space='xs'>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Sélectionnez la ville
												</Text>
												<VStack space='xs'>
													{cities.map((cityData) => (
														<TouchableOpacity
															key={cityData.code}
															onPress={() =>
																selectCity(
																	cityData,
																)
															}>
															<Box
																style={{
																	padding: 12,
																	backgroundColor:
																		formData.city ===
																		cityData.nom
																			? isDark
																				? "#1f2937"
																				: "#dbeafe"
																			: isDark
																				? "#1f2937"
																				: "#f9fafb",
																	borderRadius: 8,
																	borderWidth: 1,
																	borderColor:
																		formData.city ===
																		cityData.nom
																			? "#3b82f6"
																			: isDark
																				? "#4b5563"
																				: "#e5e7eb",
																}}>
																<Text
																	style={{
																		color: isDark
																			? "#f3f4f6"
																			: "#111827",
																	}}>
																	{
																		cityData.nom
																	}{" "}
																	(
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

										{/* Affichage de la ville sélectionnée */}
										{formData.city && (
											<>
												<Divider
													style={{
														backgroundColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}
												/>

												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Ville sélectionnée
													</Text>
													<Box
														style={{
															padding: 12,
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#dbeafe",
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																"#3b82f6",
														}}>
														<Text
															style={{
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																fontWeight:
																	"600",
															}}>
															{formData.city}
														</Text>
														{/* <Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														{formData.department} (
														{
															formData.department_code
														}
														)
													</Text> */}
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
															}}>
															{
																formData.department
															}{" "}
															({formData.postcode}
															)
														</Text>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
															}}>
															{formData.region}
														</Text>
													</Box>
												</VStack>
											</>
										)}
									</VStack>
								</Card>

								{/* Type de contrat */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Type de contrat *
										</Text>
										<HStack
											space='sm'
											style={{ flexWrap: "wrap" }}>
											{CONTRACT_TYPES.map((type) => (
												<Pressable
													key={type}
													onPress={() =>
														updateField(
															"contract_type",
															type,
														)
													}
													style={{
														flex: 1,
														minWidth: "45%",
														marginBottom: 8,
													}}>
													<Box
														style={{
															padding: 16,
															borderRadius: 10,
															borderWidth: 2,
															borderColor:
																formData.contract_type ===
																type
																	? "#3b82f6"
																	: isDark
																		? "#4b5563"
																		: "#e5e7eb",
															backgroundColor:
																formData.contract_type ===
																type
																	? isDark
																		? "#1e3a8a"
																		: "#dbeafe"
																	: isDark
																		? "#1f2937"
																		: "#f9fafb",
															alignItems:
																"center",
															justifyContent:
																"center",
														}}>
														<Text
															style={{
																fontWeight:
																	"600",
																fontSize: 15,
																color:
																	formData.contract_type ===
																	type
																		? "#3b82f6"
																		: isDark
																			? "#f3f4f6"
																			: "#111827",
															}}>
															{type}
														</Text>
													</Box>
												</Pressable>
											))}
										</HStack>
									</VStack>
								</Card>

								{/* Dates */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										{/* Date de début */}
										<VStack space='xs'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Date de début *
											</Text>
											<TouchableOpacity
												onPress={() => {
													Keyboard.dismiss();
													setShowStartDatePicker(
														true,
													);
												}}>
												<Input
													variant='outline'
													size='md'
													isDisabled
													style={{
														pointerEvents: "none",
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														value={formatDate(
															formData.start_date,
														)}
														editable={false}
														style={{
															color: formData.start_date
																? isDark
																	? "#f3f4f6"
																	: "#111827"
																: "#9ca3af",
														}}
													/>
												</Input>
											</TouchableOpacity>
											{showStartDatePicker && (
												<DateTimePicker
													value={
														formData.start_date ||
														new Date()
													}
													mode='date'
													display={
														Platform.OS === "ios"
															? "spinner"
															: "default"
													}
													onChange={
														handleStartDateChange
													}
													minimumDate={new Date()}
												/>
											)}
											{Platform.OS === "ios" &&
												showStartDatePicker && (
													<Button
														size='sm'
														onPress={() =>
															setShowStartDatePicker(
																false,
															)
														}
														style={{
															marginTop: 8,
															backgroundColor:
																"#3b82f6",
														}}>
														<ButtonText>
															Confirmer
														</ButtonText>
													</Button>
												)}
										</VStack>

										{/* Date de fin (conditionnelle pour non-CDI) */}
										{formData.contract_type !== "CDI" && (
											<VStack space='xs'>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Date de fin *
												</Text>
												<TouchableOpacity
													onPress={() => {
														Keyboard.dismiss();
														setShowEndDatePicker(
															true,
														);
													}}>
													<Input
														variant='outline'
														size='md'
														isDisabled
														style={{
															pointerEvents:
																"none",
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															value={formatDate(
																formData.end_date,
															)}
															editable={false}
															style={{
																color: formData.end_date
																	? isDark
																		? "#f3f4f6"
																		: "#111827"
																	: "#9ca3af",
															}}
														/>
													</Input>
												</TouchableOpacity>
												{showEndDatePicker && (
													<DateTimePicker
														value={
															formData.end_date ||
															formData.start_date ||
															new Date()
														}
														mode='date'
														display={
															Platform.OS ===
															"ios"
																? "spinner"
																: "default"
														}
														onChange={
															handleEndDateChange
														}
														minimumDate={
															formData.start_date ||
															new Date()
														}
													/>
												)}
												{Platform.OS === "ios" &&
													showEndDatePicker && (
														<Button
															size='sm'
															onPress={() =>
																setShowEndDatePicker(
																	false,
																)
															}
															style={{
																marginTop: 8,
																backgroundColor:
																	"#3b82f6",
															}}>
															<ButtonText>
																Confirmer
															</ButtonText>
														</Button>
													)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Temps de travail */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Temps de travail *
										</Text>
										<HStack
											space='sm'
											style={{ flexWrap: "wrap" }}>
											{WORK_TIME.map((time) => (
												<Pressable
													key={time}
													onPress={() =>
														updateField(
															"work_time",
															time,
														)
													}
													style={{
														flex: 1,
														minWidth: "45%",
														marginBottom: 8,
													}}>
													<Box
														style={{
															padding: 16,
															borderRadius: 10,
															borderWidth: 2,
															borderColor:
																formData.work_time ===
																time
																	? "#3b82f6"
																	: isDark
																		? "#4b5563"
																		: "#e5e7eb",
															backgroundColor:
																formData.work_time ===
																time
																	? isDark
																		? "#1e3a8a"
																		: "#dbeafe"
																	: isDark
																		? "#1f2937"
																		: "#f9fafb",
															alignItems:
																"center",
															justifyContent:
																"center",
														}}>
														<Text
															style={{
																fontWeight:
																	"600",
																fontSize: 15,
																color:
																	formData.work_time ===
																	time
																		? "#3b82f6"
																		: isDark
																			? "#f3f4f6"
																			: "#111827",
															}}>
															{time}
														</Text>
													</Box>
												</Pressable>
											))}
										</HStack>
									</VStack>
								</Card>

								{/* Horaires de travail */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Horaires de travail
										</Text>
										<HStack
											space='sm'
											style={{ flexWrap: "wrap" }}>
											{WORK_SCHEDULE.map((schedule) => (
												<Pressable
													key={schedule}
													onPress={() =>
														updateField(
															"work_schedule",
															schedule,
														)
													}
													style={{
														flex: 1,
														minWidth: "30%",
														marginBottom: 8,
													}}>
													<Box
														style={{
															padding: 16,
															borderRadius: 10,
															borderWidth: 2,
															borderColor:
																formData.work_schedule ===
																schedule
																	? "#3b82f6"
																	: isDark
																		? "#4b5563"
																		: "#e5e7eb",
															backgroundColor:
																formData.work_schedule ===
																schedule
																	? isDark
																		? "#1e3a8a"
																		: "#dbeafe"
																	: isDark
																		? "#1f2937"
																		: "#f9fafb",
															alignItems:
																"center",
															justifyContent:
																"center",
														}}>
														<Text
															style={{
																fontWeight:
																	"600",
																fontSize: 15,
																color:
																	formData.work_schedule ===
																	schedule
																		? "#3b82f6"
																		: isDark
																			? "#f3f4f6"
																			: "#111827",
															}}>
															{schedule}
														</Text>
													</Box>
												</Pressable>
											))}
										</HStack>

										{/* Horaires */}
										<HStack space='md'>
											{/* Heure de début */}
											<VStack
												ref={startTimeInputRef}
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Heure de début
												</Text>
												<Input
													variant='outline'
													size='md'
													isDisabled={false}
													isInvalid={false}
													isReadOnly={false}>
													<InputField
														placeholder='HH:MM'
														value={
															formData.start_time
														}
														onChangeText={(value) =>
															formatTimeInput(
																value,
																"start_time",
															)
														}
														onFocus={() =>
															scrollToInput(
																startTimeInputRef,
															)
														}
														keyboardType='numeric'
														maxLength={5}
													/>
												</Input>
											</VStack>

											{/* Heure de fin */}
											<VStack
												ref={endTimeInputRef}
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Heure de fin
												</Text>
												<Input
													variant='outline'
													size='md'
													isDisabled={false}
													isInvalid={false}
													isReadOnly={false}>
													<InputField
														placeholder='HH:MM'
														value={
															formData.end_time
														}
														onChangeText={(value) =>
															formatTimeInput(
																value,
																"end_time",
															)
														}
														onFocus={() =>
															scrollToInput(
																endTimeInputRef,
															)
														}
														keyboardType='numeric'
														maxLength={5}
													/>
												</Input>
											</VStack>
										</HStack>
									</VStack>
								</Card>
							</VStack>
						</ScrollView>
					</KeyboardAvoidingView>
				</Box>

				{/* Étape 3: Rémunération */}
				<Box style={{ width: SCREEN_WIDTH }}>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						style={{ flex: 1 }}
						keyboardVerticalOffset={100}>
						<ScrollView
							ref={(ref) => (scrollViewRefs.current[2] = ref)}
							keyboardShouldPersistTaps='handled'>
							<VStack
								space='lg'
								style={{ padding: 20, paddingBottom: 100 }}>
								{/* Type de rémunération */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={BadgeEuro}
												size='lg'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Rémunération
											</Heading>
										</HStack>

										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>

										<HStack space='md'>
											{/* Salaire horaire */}
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Salaire horaire (€) *
												</Text>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: 15.50'
														value={
															formData.salary_hourly
														}
														onChangeText={(value) =>
															updateField(
																"salary_hourly",
																value,
															)
														}
														keyboardType='decimal-pad'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>

											{/* Heures par semaine */}
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Heures/semaine *
												</Text>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: 35'
														value={
															formData.weekly_hours
														}
														onChangeText={(value) =>
															updateField(
																"weekly_hours",
																value,
															)
														}
														keyboardType='decimal-pad'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>
										</HStack>

										{/* Calcul du salaire mensuel */}
										{formData.salary_hourly &&
											formData.weekly_hours && (
												<Box
													style={{
														padding: 16,
														backgroundColor: isDark
															? "#1e3a8a"
															: "#dbeafe",
														borderRadius: 10,
														borderWidth: 1,
														borderColor: "#3b82f6",
													}}>
													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#93c5fd"
																	: "#1e40af",
																fontWeight:
																	"500",
															}}>
															Salaire mensuel
															estimé
														</Text>
														<Text
															style={{
																fontSize: 24,
																fontWeight:
																	"700",
																color: "#3b82f6",
															}}>
															{(
																(parseFloat(
																	formData.salary_hourly,
																) *
																	parseFloat(
																		formData.weekly_hours,
																	) *
																	52) /
																12
															).toFixed(2)}{" "}
															€
														</Text>
														<Text
															size='xs'
															style={{
																color: isDark
																	? "#93c5fd"
																	: "#1e40af",
															}}>
															Calcul :{" "}
															{
																formData.salary_hourly
															}
															€/h ×{" "}
															{
																formData.weekly_hours
															}
															h/sem × 52 sem ÷ 12
															mois
														</Text>
													</VStack>
												</Box>
											)}
									</VStack>
								</Card>

								{/* Expérience requise */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<VStack space='xs'>
											<Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Expérience requise
											</Text>
											<HStack
												space='md'
												style={{
													alignItems: "center",
												}}>
												<Input
													variant='outline'
													size='md'
													style={{
														flex: 1,
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: 2'
														value={
															formData.experience_required
														}
														onChangeText={(value) =>
															updateField(
																"experience_required",
																value,
															)
														}
														keyboardType='numeric'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
														fontWeight: "500",
													}}>
													{formData.experience_required &&
													parseInt(
														formData.experience_required,
													) === 1
														? "an minimum"
														: "ans minimum"}
												</Text>
											</HStack>
										</VStack>
									</VStack>
								</Card>

								{/* Diplômes requis */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={GraduationCap}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#3b82f6",
												}}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Diplômes requis
											</Text>
										</HStack>
										<HStack space='sm'>
											<VStack
												ref={diplomaInputRef}
												style={{ flex: 1 }}>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: SSIAP 1'
														value={currentDiploma}
														onChangeText={
															setCurrentDiploma
														}
														onFocus={() =>
															scrollToInput(
																diplomaInputRef,
																2,
															)
														}
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>
											<Button
												size='md'
												onPress={addDiploma}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des diplômes */}
										{diplomasList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{diplomasList.map(
													(diploma, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#3b82f6",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{diploma}
															</Text>
															<Button
																size='xs'
																variant='link'
																onPress={() =>
																	removeDiploma(
																		index,
																	)
																}>
																<ButtonIcon
																	as={Trash2}
																	size='sm'
																	style={{
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>
							</VStack>
						</ScrollView>
					</KeyboardAvoidingView>
				</Box>

				{/* Étape 4: Détails */}
				<Box style={{ width: SCREEN_WIDTH }}>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						style={{ flex: 1 }}
						keyboardVerticalOffset={100}>
						<ScrollView
							ref={(ref) => (scrollViewRefs.current[3] = ref)}>
							<VStack
								space='lg'
								style={{ padding: 20, paddingBottom: 100 }}>
								{/* Missions */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={FileText}
												size='lg'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Missions principales
											</Heading>
										</HStack>

										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>

										<HStack space='sm'>
											<Input
												variant='outline'
												size='md'
												style={{
													flex: 1,
													backgroundColor: isDark
														? "#1f2937"
														: "#ffffff",
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}>
												<InputField
													placeholder='Ajouter une mission...'
													value={currentMission}
													onChangeText={
														setCurrentMission
													}
													onSubmitEditing={addMission}
													returnKeyType='done'
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
											</Input>
											<Button
												size='md'
												onPress={addMission}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des missions */}
										{missionsList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{missionsList.map(
													(mission, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#3b82f6",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{mission}
															</Text>
															<Button
																size='xs'
																variant='link'
																onPress={() =>
																	removeMission(
																		index,
																	)
																}>
																<ButtonIcon
																	as={Trash2}
																	size='sm'
																	style={{
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Profil recherché */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Users}
												size='lg'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Profil recherché
											</Heading>
										</HStack>

										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>

										<HStack space='sm'>
											<Input
												variant='outline'
												size='md'
												style={{
													flex: 1,
													backgroundColor: isDark
														? "#1f2937"
														: "#ffffff",
													borderColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}>
												<InputField
													placeholder='Ajouter une compétence...'
													value={currentProfile}
													onChangeText={
														setCurrentProfile
													}
													onSubmitEditing={addProfile}
													returnKeyType='done'
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
											</Input>
											<Button
												size='md'
												onPress={addProfile}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des compétences */}
										{profileList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{profileList.map(
													(profile, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#10b981",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{profile}
															</Text>
															<Button
																size='xs'
																variant='link'
																onPress={() =>
																	removeProfile(
																		index,
																	)
																}>
																<ButtonIcon
																	as={Trash2}
																	size='sm'
																	style={{
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Permis de conduire */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={FileText}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#3b82f6",
												}}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Permis de conduire
											</Text>
										</HStack>
										<HStack space='sm'>
											<VStack
												ref={drivingLicenseInputRef}
												style={{ flex: 1 }}>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: Permis B'
														value={
															currentDrivingLicense
														}
														onChangeText={
															setCurrentDrivingLicense
														}
														onFocus={() =>
															scrollToInput(
																drivingLicenseInputRef,
																3,
															)
														}
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>
											<Button
												size='md'
												onPress={addDrivingLicense}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des permis */}
										{drivingLicensesList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{drivingLicensesList.map(
													(license, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#3b82f6",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{license}
															</Text>
															<Button
																size='xs'
																variant='link'
																onPress={() =>
																	removeDrivingLicense(
																		index,
																	)
																}>
																<ButtonIcon
																	as={Trash2}
																	size='sm'
																	style={{
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Langues demandées */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Users}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#3b82f6",
												}}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Langues demandées
											</Text>
										</HStack>
										<HStack space='sm'>
											<VStack
												ref={languageInputRef}
												style={{ flex: 1 }}>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: Anglais, Espagnol'
														value={currentLanguage}
														onChangeText={
															setCurrentLanguage
														}
														onFocus={() =>
															scrollToInput(
																languageInputRef,
																3,
															)
														}
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>
											<Button
												size='md'
												onPress={addLanguage}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des langues */}
										{languagesList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{languagesList.map(
													(language, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#3b82f6",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
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
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Remboursements */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={BadgeEuro}
												size='lg'
												style={{
													color: isDark
														? "#60a5fa"
														: "#3b82f6",
												}}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Remboursements
											</Text>
										</HStack>
										<HStack space='sm'>
											<VStack
												ref={reimbursementInputRef}
												style={{ flex: 1 }}>
												<Input
													variant='outline'
													size='md'
													style={{
														backgroundColor: isDark
															? "#1f2937"
															: "#ffffff",
														borderColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}>
													<InputField
														placeholder='Ex: Frais de transport'
														value={
															currentReimbursement
														}
														onChangeText={
															setCurrentReimbursement
														}
														onFocus={() =>
															scrollToInput(
																reimbursementInputRef,
																3,
															)
														}
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}
													/>
												</Input>
											</VStack>
											<Button
												size='md'
												onPress={addReimbursement}
												style={{
													backgroundColor: "#3b82f6",
												}}>
												<ButtonIcon
													as={Plus}
													style={{ color: "#ffffff" }}
												/>
											</Button>
										</HStack>
										{/* Liste des remboursements */}
										{reimbursementsList.length > 0 && (
											<VStack
												space='xs'
												style={{ marginTop: 8 }}>
												{reimbursementsList.map(
													(reimbursement, index) => (
														<HStack
															key={index}
															space='sm'
															style={{
																alignItems:
																	"center",
																padding: 8,
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#f3f4f6",
																borderRadius: 8,
															}}>
															<Box
																style={{
																	width: 6,
																	height: 6,
																	borderRadius: 3,
																	backgroundColor:
																		"#3b82f6",
																}}
															/>
															<Text
																size='sm'
																style={{
																	flex: 1,
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																{reimbursement}
															</Text>
															<Button
																size='xs'
																variant='link'
																onPress={() =>
																	removeReimbursement(
																		index,
																	)
																}>
																<ButtonIcon
																	as={Trash2}
																	size='sm'
																	style={{
																		color: "#ef4444",
																	}}
																/>
															</Button>
														</HStack>
													),
												)}
											</VStack>
										)}
									</VStack>
								</Card>

								{/* Options */}
								<Card
									style={{
										padding: 20,
										backgroundColor: isDark
											? "#374151"
											: "#ffffff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<VStack space='md'>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Timer}
												size='lg'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<Heading
												size='md'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Options
											</Heading>
										</HStack>

										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>

										{/* Dernière minute */}
										<HStack
											space='md'
											style={{
												justifyContent: "space-between",
												alignItems: "center",
											}}>
											<VStack style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Offre dernière minute
												</Text>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Visible avec un badge
													urgence
												</Text>
											</VStack>
											<Switch
												value={formData.isLastMinute}
												onValueChange={(value) =>
													updateField(
														"isLastMinute",
														value,
													)
												}
												trackColor={{
													false: isDark
														? "#4b5563"
														: "#d1d5db",
													true: "#3b82f6",
												}}
											/>
										</HStack>

										{/* Panier repas */}
										<HStack
											space='md'
											style={{
												justifyContent: "space-between",
												alignItems: "center",
											}}>
											<VStack style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Panier repas
												</Text>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Panier repas fourni
												</Text>
											</VStack>
											<Switch
												value={formData.packed_lunch}
												onValueChange={(value) =>
													updateField(
														"packed_lunch",
														value,
													)
												}
												trackColor={{
													false: isDark
														? "#4b5563"
														: "#d1d5db",
													true: "#3b82f6",
												}}
											/>
										</HStack>

										{/* Hébergement */}
										<HStack
											space='md'
											style={{
												justifyContent: "space-between",
												alignItems: "center",
											}}>
											<VStack style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Hébergement
												</Text>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Hébergement fourni
												</Text>
											</VStack>
											<Switch
												value={formData.accommodations}
												onValueChange={(value) =>
													updateField(
														"accommodations",
														value,
													)
												}
												trackColor={{
													false: isDark
														? "#4b5563"
														: "#d1d5db",
													true: "#3b82f6",
												}}
											/>
										</HStack>
									</VStack>
								</Card>
							</VStack>
						</ScrollView>
					</KeyboardAvoidingView>
				</Box>
			</Animated.View>

			{/* Boutons de navigation fixés en bas */}
			<Box
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					paddingHorizontal: 20,
					paddingVertical: 16,
					paddingBottom: 40,
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderTopWidth: 1,
					borderTopColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<HStack space='md'>
					{currentStep > 1 && (
						<Button
							variant='outline'
							size='lg'
							onPress={goToPreviousStep}
							style={{
								flex: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<ButtonIcon
								as={ChevronLeft}
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}
							/>
							<ButtonText
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Précédent
							</ButtonText>
						</Button>
					)}
					<Button
						size='lg'
						onPress={handleNextStep}
						isDisabled={loading}
						style={{
							flex: 1,
							backgroundColor:
								currentStep === STEPS.length
									? "#10b981"
									: "#3b82f6",
						}}>
						{currentStep === STEPS.length ? (
							<>
								<ButtonIcon
									as={Save}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									{loading ? "Publication..." : "Publier"}
								</ButtonText>
							</>
						) : (
							<>
								<ButtonText style={{ color: "#ffffff" }}>
									Suivant
								</ButtonText>
								<ButtonIcon
									as={ChevronRight}
									style={{ color: "#ffffff" }}
								/>
							</>
						)}
					</Button>
				</HStack>
			</Box>
		</Box>
	);
};

export default PostJob;
