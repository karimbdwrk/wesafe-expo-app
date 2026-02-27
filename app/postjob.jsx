import React, { useState, useRef, useEffect } from "react";
import {
	ScrollView,
	Platform,
	TouchableOpacity,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Keyboard,
	Easing,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
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
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogBody,
	AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
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
	ChevronDownIcon,
	GraduationCap,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { formatSalary } from "@/constants/salary";

const result = {
	accommodations: true,
	category: "Agent cynophile",
	city: "Levallois-Perret",
	contract_type: "CDI",
	department: "Hauts-de-Seine",
	department_code: "92",
	description: "Pirhozegopienrgoif",
	diplomas_required: ["CQP", "SST"],
	driving_licenses: ["Permis B", "Permis A"],
	end_date: "2026-03-25",
	end_time: "23:33",
	// experience_required: "2",
	isLastMinute: false,
	languages: ["Français", "Anglais"],
	latitude: 48.8946,
	longitude: 2.2874,
	missions: [
		"Assurer la sécurité des biens et des personnes",
		"Réaliser des rondes de surveillance",
		"Intervenir en cas d'incident ou d'urgence",
	],
	packed_lunch: true,
	postcode: "92300",
	region: "Île-de-France",
	region_code: "11",
	reimbursements: true,
	salary_hourly: "15",
	searched_profile: [
		"Carte professionnelle en cours de validité",
		"Experience en surveillance de site industriel",
	],
	start_date: "2026-03-19",
	start_time: "22:22",
	title: "Uerhgeonmrgop",
	weekly_hours: "35",
	daily_hours: "",
	work_hours_type: "semaine",
	work_schedule: "day",
	work_time: "fulltime",
};

const result2 = {
	accommodations: true,
	category: "Agent SSIAP",
	city: "Besançon",
	contract_type: "CDD",
	daily_hours: "",
	department: "Doubs",
	department_code: "25",
	description: "Fhg’c",
	diplomas_required: ["SSIAP 1", "CQP", "SST"],
	driving_licenses: ["Ttt"],
	end_date: "2026-03-19T23:05:43.000Z",
	end_time: "23:00",
	isLastMinute: true,
	languages: ["Gggg"],
	latitude: 47.2602,
	longitude: 6.0123,
	missions: ["Mission 1", "Mission 2"],
	packed_lunch: true,
	postcode: "25000",
	region: "Bourgogne-Franche-Comté",
	region_code: "27",
	reimbursements: ["Ggg"],
	salary_hourly: "15",
	searched_profile: ["Profil 1", "Profil 2"],
	start_date: "2026-03-19T23:05:43.000Z",
	start_time: "15:00",
	title: "Hhh",
	weekly_hours: "25",
	work_hours_type: "semaine",
	work_schedule: "Jour",
	work_time: "Temps plein",
};

const CATEGORIES = [
	{
		id: "aps",
		acronym: "APS",
		name: "Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ads",
		acronym: "ADS",
		name: "Agent De Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ssiap_1",
		acronym: "SSIAP 1",
		name: "Agent de Sécurité Incendie",
		category: "securite_incendie",
		level: 1,
	},
	{
		id: "ssiap_2",
		acronym: "SSIAP 2",
		name: "Chef d'Équipe de Sécurité Incendie",
		category: "securite_incendie",
		level: 2,
	},
	{
		id: "ssiap_3",
		acronym: "SSIAP 3",
		name: "Chef de Service de Sécurité Incendie",
		category: "securite_incendie",
		level: 3,
	},
	{
		id: "asc",
		acronym: "ASC",
		name: "Agent de Sécurité Cynophile",
		category: "cynophile",
	},
	{
		id: "apr",
		acronym: "APR",
		name: "Agent de Protection Rapprochée",
		category: "protection_rapprochee",
	},
];

const CONTRACT_TYPES = ["CDI", "CDD"];
const WORK_TIME = ["Temps plein", "Temps partiel"];
const WORK_SCHEDULE = ["Jour", "Nuit", "Variable"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STEPS = [
	{ id: 1, title: "Informations principales" },
	{ id: 2, title: "Localisation et contrat" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Récapitulatif" },
	// { id: 4, title: "Détails" },
];

const PostJob = () => {
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();
	const { create } = useDataContext();
	const router = useRouter();
	const toast = useToast();

	const [loading, setLoading] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null]);
	const titleInputRef = useRef(null);
	const descriptionInputRef = useRef(null);
	const postcodeInputRef = useRef(null);
	const startTimeInputRef = useRef(null);
	const endTimeInputRef = useRef(null);
	const diplomaInputRef = useRef(null);
	const drivingLicenseInputRef = useRef(null);
	const languageInputRef = useRef(null);
	const reimbursementInputRef = useRef(null);
	const startDateInputRef = useRef(null);
	const endDateInputRef = useRef(null);
	const missionInputRef = useRef(null);
	const profileInputRef = useRef(null);
	const hoursInputRef = useRef(null);
	const salaryInputRef = useRef(null);
	const [currentMission, setCurrentMission] = useState("");
	const [currentProfile, setCurrentProfile] = useState("");
	const [currentDiploma, setCurrentDiploma] = useState("");
	const [currentDrivingLicense, setCurrentDrivingLicense] = useState("");
	const [currentLanguage, setCurrentLanguage] = useState("");
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
		salary_type: "selon_profil",
		salary_hourly: "",
		salary_amount: "",
		salary_min: "",
		salary_max: "",
		weekly_hours: "",
		daily_hours: "",
		work_hours_type: "semaine",
		// experience_required: "",
		missions: [],
		searched_profile: [],
		diplomas_required: [],
		driving_licenses: [],
		languages: [],
		reimbursements: [],
		packed_lunch: false,
		accommodations: false,
		isLastMinute: false,
	});

	const updateField = (field, value) => {
		// Si on change le type d'heures, réinitialiser les deux champs d'heures
		if (field === "work_hours_type") {
			setFormData((prev) => ({
				...prev,
				[field]: value,
				weekly_hours: "",
				daily_hours: "",
			}));
		} else {
			setFormData((prev) => ({ ...prev, [field]: value }));
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
			setFormData((prev) => ({
				...prev,
				missions: [...prev.missions, currentMission.trim()],
			}));
			setCurrentMission("");
		}
	};

	const removeMission = (index) => {
		setFormData((prev) => ({
			...prev,
			missions: prev.missions.filter((_, i) => i !== index),
		}));
	};

	const addProfile = () => {
		if (currentProfile.trim()) {
			setFormData((prev) => ({
				...prev,
				searched_profile: [
					...prev.searched_profile,
					currentProfile.trim(),
				],
			}));
			setCurrentProfile("");
		}
	};

	const removeProfile = (index) => {
		setFormData((prev) => ({
			...prev,
			searched_profile: prev.searched_profile.filter(
				(_, i) => i !== index,
			),
		}));
	};

	const addDiploma = () => {
		if (currentDiploma.trim()) {
			setFormData((prev) => ({
				...prev,
				diplomas_required: [
					...prev.diplomas_required,
					currentDiploma.trim(),
				],
			}));
			setCurrentDiploma("");
		}
	};

	const removeDiploma = (index) => {
		setFormData((prev) => ({
			...prev,
			diplomas_required: prev.diplomas_required.filter(
				(_, i) => i !== index,
			),
		}));
	};

	const addDrivingLicense = () => {
		if (currentDrivingLicense.trim()) {
			setFormData((prev) => ({
				...prev,
				driving_licenses: [
					...prev.driving_licenses,
					currentDrivingLicense.trim(),
				],
			}));
			setCurrentDrivingLicense("");
		}
	};

	const removeDrivingLicense = (index) => {
		setFormData((prev) => ({
			...prev,
			driving_licenses: prev.driving_licenses.filter(
				(_, i) => i !== index,
			),
		}));
	};

	const addLanguage = () => {
		if (currentLanguage.trim()) {
			setFormData((prev) => ({
				...prev,
				languages: [...prev.languages, currentLanguage.trim()],
			}));
			setCurrentLanguage("");
		}
	};

	const removeLanguage = (index) => {
		setFormData((prev) => ({
			...prev,
			languages: prev.languages.filter((_, i) => i !== index),
		}));
	};

	const addReimbursement = () => {
		if (currentReimbursement.trim()) {
			setFormData((prev) => ({
				...prev,
				reimbursements: [
					...prev.reimbursements,
					currentReimbursement.trim(),
				],
			}));
			setCurrentReimbursement("");
		}
	};

	const removeReimbursement = (index) => {
		setFormData((prev) => ({
			...prev,
			reimbursements: prev.reimbursements.filter((_, i) => i !== index),
		}));
	};

	const handleStartDateChange = (event, selectedDate) => {
		if (selectedDate) {
			updateField("start_date", selectedDate);
		}
	};

	const handleEndDateChange = (event, selectedDate) => {
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

	const scrollToInput = (
		inputRef,
		stepIndex = 1,
		offset = 100,
		skipIfVisible = false,
	) => {
		if (inputRef.current && scrollViewRefs.current[stepIndex]) {
			setTimeout(() => {
				inputRef.current.measureLayout(
					scrollViewRefs.current[stepIndex],
					(x, y) => {
						if (skipIfVisible) {
							// Vérifier si l'élément est déjà visible (pas en dessous du clavier)
							// Hauteur du clavier approximative: 300px
							const keyboardHeight = 300;
							const screenHeight =
								Dimensions.get("window").height;
							if (y + 200 < screenHeight - keyboardHeight) {
								return; // Ne pas scroller si déjà visible
							}
						}
						scrollViewRefs.current[stepIndex].scrollTo({
							y: y - offset,
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

	const showError = (title, message) => {
		toast.show({
			placement: "top",
			render: ({ id }) => (
				<Toast
					nativeID={"toast-" + id}
					className='px-5 py-3 gap-4 bg-error-500'>
					<ToastTitle className='text-white'>{message}</ToastTitle>
				</Toast>
			),
		});
	};

	const validateStep = () => {
		switch (currentStep) {
			case 1:
				if (
					!formData.title ||
					!formData.category ||
					!formData.description
				) {
					showError(
						"Erreur",
						"Veuillez remplir tous les champs obligatoires",
					);
					return false;
				}
				break;
			case 2:
				if (!formData.city || !formData.start_date) {
					showError(
						"Erreur",
						"Veuillez remplir tous les champs obligatoires (localisation et dates)",
					);
					return false;
				}
				if (formData.contract_type !== "CDI" && !formData.end_date) {
					showError(
						"Erreur",
						"La date de fin est obligatoire pour ce type de contrat",
					);
					return false;
				}
				if (!formData.contract_type) {
					showError(
						"Erreur",
						"Veuillez sélectionner un type de contrat",
					);
					return false;
				}
				if (!formData.work_time) {
					showError(
						"Erreur",
						"Veuillez sélectionner un temps de travail",
					);
					return false;
				}

				// Validation selon le type de salaire
				if (formData.salary_type === "hourly") {
					if (!formData.salary_hourly) {
						showError(
							"Erreur",
							"Veuillez indiquer le salaire horaire",
						);
						return false;
					}
					if (
						formData.work_hours_type === "jour" &&
						!formData.daily_hours
					) {
						showError(
							"Erreur",
							"Veuillez indiquer le nombre d'heures par jour",
						);
						return false;
					}
					if (
						formData.work_hours_type === "semaine" &&
						!formData.weekly_hours
					) {
						showError(
							"Erreur",
							"Veuillez indiquer le nombre d'heures par semaine",
						);
						return false;
					}
				} else if (formData.salary_type === "monthly_fixed") {
					if (!formData.salary_monthly_fixed) {
						showError(
							"Erreur",
							"Veuillez indiquer le salaire mensuel",
						);
						return false;
					}
				} else if (formData.salary_type === "annual_fixed") {
					if (!formData.salary_annual_fixed) {
						showError(
							"Erreur",
							"Veuillez indiquer le salaire annuel",
						);
						return false;
					}
				} else if (formData.salary_type === "monthly_range") {
					if (
						!formData.salary_monthly_min ||
						!formData.salary_monthly_max
					) {
						showError(
							"Erreur",
							"Veuillez indiquer la fourchette de salaire mensuel (min et max)",
						);
						return false;
					}
				} else if (formData.salary_type === "annual_range") {
					if (
						!formData.salary_annual_min ||
						!formData.salary_annual_max
					) {
						showError(
							"Erreur",
							"Veuillez indiquer la fourchette de salaire annuel (min et max)",
						);
						return false;
					}
				}

				break;
			case 3:
				// Pas de validation obligatoire pour l'étape 3 (Détails)
				break;
		}
		return true;
	};

	const handleNextStep = () => {
		if (validateStep()) {
			if (currentStep === STEPS.length) {
				setShowConfirmModal(true);
			} else {
				goToNextStep();
			}
		}
	};

	const handleSubmit = async () => {
		console.log("form data to submit:", formData);
		setLoading(true);
		try {
			// Construire le string de salaire selon le type
			let salaryString = "";

			if (formData.salary_type === "selon_profil") {
				salaryString = "Selon profil";
			} else if (
				formData.salary_type === "hourly" &&
				formData.salary_hourly
			) {
				if (
					formData.work_hours_type === "jour" &&
					formData.daily_hours
				) {
					const monthlySalary = (
						parseFloat(formData.salary_hourly) *
						parseFloat(formData.daily_hours) *
						22
					).toFixed(2);
					salaryString = `${formData.salary_hourly}€/h - ${formData.daily_hours}h/jour (~${monthlySalary}€/mois)`;
				} else if (
					formData.work_hours_type === "semaine" &&
					formData.weekly_hours
				) {
					const monthlySalary = (
						(parseFloat(formData.salary_hourly) *
							parseFloat(formData.weekly_hours) *
							52) /
						12
					).toFixed(2);
					salaryString = `${formData.salary_hourly}€/h - ${formData.weekly_hours}h/semaine (~${monthlySalary}€/mois)`;
				} else {
					salaryString = `${formData.salary_hourly}€/h`;
				}
			} else if (
				formData.salary_type === "monthly_fixed" &&
				formData.salary_monthly_fixed
			) {
				salaryString = `${formData.salary_monthly_fixed}€/mois`;
			} else if (
				formData.salary_type === "annual_fixed" &&
				formData.salary_annual_fixed
			) {
				const monthlySalary = (
					parseFloat(formData.salary_annual_fixed) / 12
				).toFixed(2);
				salaryString = `${formData.salary_annual_fixed}€/an (~${monthlySalary}€/mois)`;
			} else if (
				formData.salary_type === "monthly_range" &&
				formData.salary_monthly_min &&
				formData.salary_monthly_max
			) {
				salaryString = `${formData.salary_monthly_min}€ - ${formData.salary_monthly_max}€/mois`;
			} else if (
				formData.salary_type === "annual_range" &&
				formData.salary_annual_min &&
				formData.salary_annual_max
			) {
				const monthlyMin = (
					parseFloat(formData.salary_annual_min) / 12
				).toFixed(2);
				const monthlyMax = (
					parseFloat(formData.salary_annual_max) / 12
				).toFixed(2);
				salaryString = `${formData.salary_annual_min}€ - ${formData.salary_annual_max}€/an (~${monthlyMin}€ - ${monthlyMax}€/mois)`;
			}

			// Formater les dates au format ISO pour la base de données
			const startDateISO = formData.start_date
				? formData.start_date.toISOString().split("T")[0]
				: null;
			const endDateISO = formData.end_date
				? formData.end_date.toISOString().split("T")[0]
				: null;

			// Convertir les chaînes vides en null pour les champs numériques
			const cleanNumericField = (value) => {
				if (value === "" || value === null || value === undefined) {
					return null;
				}
				const parsed = parseFloat(value);
				return isNaN(parsed) ? null : parsed;
			};

			// Convertir les arrays vides en null, sinon en JSON
			const cleanArrayField = (array) => {
				if (!array || array.length === 0) {
					return null;
				}
				return JSON.stringify(array);
			};

			// Mapper les valeurs françaises vers l'anglais pour la base de données
			const mapWorkTime = (value) => {
				if (value === "Temps plein") return "fulltime";
				if (value === "Temps partiel") return "parttime";
				return value;
			};

			const mapWorkSchedule = (value) => {
				if (value === "Jour") return "daily";
				if (value === "Nuit") return "nightly";
				if (value === "Variable") return "variable";
				return value;
			};

			const mapWorkHoursType = (value) => {
				if (value === "semaine") return "weekly";
				if (value === "jour") return "daily";
				return value;
			};

			await create("jobs", {
				title: formData.title,
				category: formData.category,
				description: formData.description,
				city: formData.city,
				postcode: formData.postcode,
				department: formData.department,
				department_code: formData.department_code,
				region: formData.region,
				region_code: formData.region_code,
				latitude: cleanNumericField(formData.latitude),
				longitude: cleanNumericField(formData.longitude),
				contract_type: formData.contract_type,
				work_time: mapWorkTime(formData.work_time),
				work_schedule: mapWorkSchedule(formData.work_schedule),
				start_date: startDateISO,
				end_date: endDateISO,
				start_time: formData.start_time || null,
				end_time: formData.end_time || null,
				salary_type: formData.salary_type || null,
				salary_hourly: cleanNumericField(formData.salary_hourly),
				salary_monthly_fixed: cleanNumericField(
					formData.salary_monthly_fixed,
				),
				salary_annual_fixed: cleanNumericField(
					formData.salary_annual_fixed,
				),
				salary_monthly_min: cleanNumericField(
					formData.salary_monthly_min,
				),
				salary_monthly_max: cleanNumericField(
					formData.salary_monthly_max,
				),
				salary_annual_min: cleanNumericField(
					formData.salary_annual_min,
				),
				salary_annual_max: cleanNumericField(
					formData.salary_annual_max,
				),
				weekly_hours: cleanNumericField(formData.weekly_hours),
				daily_hours: cleanNumericField(formData.daily_hours),
				work_hours_type: mapWorkHoursType(formData.work_hours_type),
				missions: cleanArrayField(formData.missions),
				searched_profile: cleanArrayField(formData.searched_profile),
				diplomas_required: cleanArrayField(formData.diplomas_required),
				driving_licenses: cleanArrayField(formData.driving_licenses),
				languages: cleanArrayField(formData.languages),
				reimbursements: cleanArrayField(formData.reimbursements),
				packed_lunch: formData.packed_lunch,
				accommodations: formData.accommodations,
				isLastMinute: formData.isLastMinute,
				company_id: user.id,
				isArchived: false,
			});

			toast.show({
				placement: "top",
				render: ({ id }) => (
					<Toast
						nativeID={"toast-" + id}
						className='px-5 py-3 gap-4 bg-success-500'>
						<ToastTitle className='text-white'>
							Annonce publiée avec succés
						</ToastTitle>
					</Toast>
				),
			});

			// Réinitialiser le formulaire
			setFormData({
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
				salary_type: "selon_profil",
				salary_hourly: "",
				salary_monthly_fixed: "",
				salary_annual_fixed: "",
				salary_monthly_min: "",
				salary_monthly_max: "",
				salary_annual_min: "",
				salary_annual_max: "",
				weekly_hours: "",
				daily_hours: "",
				work_hours_type: "semaine",
				missions: [],
				searched_profile: [],
				diplomas_required: [],
				driving_licenses: [],
				languages: [],
				reimbursements: [],
				packed_lunch: false,
				accommodations: false,
				isLastMinute: false,
			});

			// Réinitialiser les inputs temporaires
			setCurrentMission("");
			setCurrentProfile("");
			setCurrentDiploma("");
			setCurrentDrivingLicense("");
			setCurrentLanguage("");
			setCurrentReimbursement("");

			// Retourner au step 1
			setCurrentStep(1);
			scrollX.setValue(0);

			// Rediriger vers la liste des offres
			// router.push("/");
		} catch (error) {
			console.error("Erreur lors de la publication:", error);
			showError(
				"Erreur",
				"Une erreur est survenue lors de la publication de l'offre",
			);
		} finally {
			setLoading(false);
		}
	};

	// Animation de la barre de progression
	const progressAnim = useRef(
		new Animated.Value(((currentStep - 1) / (STEPS.length - 1)) * 100),
	).current;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: ((currentStep - 1) / (STEPS.length - 1)) * 100,
			duration: 500,
			easing: Easing.inOut(Easing.ease),
			useNativeDriver: false,
		}).start();
	}, [currentStep, STEPS.length]);

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
					{/* Barre de progression animée */}
					<Box
						style={{
							width: "100%",
							height: 8,
							backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							borderRadius: 4,
							overflow: "hidden",
						}}>
						<Animated.View
							style={{
								width: progressAnim.interpolate({
									inputRange: [0, 100],
									outputRange: ["0%", "100%"],
								}),
								height: "100%",
								backgroundColor: "#3b82f6",
								borderRadius: 4,
							}}
						/>
					</Box>
				</VStack>
			</Box>

			{/* Steps Container - Conditional Rendering pour fix scroll Android */}
			<Box style={{ flex: 1 }}>
				{/* Étape 1: Informations principales */}
				{currentStep === 1 && (
					<Box style={{ width: SCREEN_WIDTH, flex: 1 }}>
						<KeyboardAvoidingView
							behavior={
								Platform.OS === "ios" ? "padding" : "height"
							}
							style={{ flex: 1 }}
							keyboardVerticalOffset={100}>
							<ScrollView
								ref={(ref) => (scrollViewRefs.current[0] = ref)}
								keyboardShouldPersistTaps='handled'>
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
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<VStack space='md'>
											{/* Dernière minute */}
											<HStack
												space='md'
												style={{
													justifyContent:
														"space-between",
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
													value={
														formData.isLastMinute
													}
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
												<VStack ref={titleInputRef}>
													<Input
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Ex: Agent de sécurité H/F'
															value={
																formData.title
															}
															onChangeText={(
																value,
															) =>
																updateField(
																	"title",
																	value,
																)
															}
															onFocus={() =>
																scrollToInput(
																	titleInputRef,
																	0,
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
													selectedValue={
														formData.category
													}
													onValueChange={(value) =>
														updateField(
															"category",
															value,
														)
													}>
													<SelectTrigger
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
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
															{CATEGORIES.map(
																(cat) => (
																	<SelectItem
																		key={
																			cat.id
																		}
																		label={`${cat.acronym} - ${cat.name}`}
																		value={`${cat.acronym} - ${cat.name}`}
																	/>
																),
															)}
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
												<VStack
													ref={descriptionInputRef}>
													<Textarea
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
															minHeight: 120,
														}}>
														<TextareaInput
															placeholder='Décrivez le poste et les responsabilités...'
															value={
																formData.description
															}
															onChangeText={(
																value,
															) =>
																updateField(
																	"description",
																	value,
																)
															}
															onFocus={() =>
																scrollToInput(
																	descriptionInputRef,
																	0,
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
										</VStack>
									</Card>

									{/* Missions principales */}
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
												style={{
													alignItems: "center",
												}}>
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
												<VStack
													ref={missionInputRef}
													style={{ flex: 1 }}>
													<Input
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Ajouter une mission...'
															value={
																currentMission
															}
															onChangeText={
																setCurrentMission
															}
															onFocus={() =>
																scrollToInput(
																	missionInputRef,
																	0,
																)
															}
															onSubmitEditing={
																addMission
															}
															returnKeyType='done'
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
													onPress={addMission}
													style={{
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{formData.missions.length > 0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.missions.map(
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
																		as={
																			Trash2
																		}
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
												style={{
													alignItems: "center",
												}}>
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
												<VStack
													ref={profileInputRef}
													style={{ flex: 1 }}>
													<Input
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Ajouter une compétence...'
															value={
																currentProfile
															}
															onChangeText={
																setCurrentProfile
															}
															onFocus={() =>
																scrollToInput(
																	profileInputRef,
																	0,
																)
															}
															onSubmitEditing={
																addProfile
															}
															returnKeyType='done'
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
													onPress={addProfile}
													style={{
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{formData.searched_profile.length >
												0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.searched_profile.map(
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
																		as={
																			Trash2
																		}
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
												style={{
													alignItems: "center",
												}}>
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
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Ex: SSIAP 1'
															value={
																currentDiploma
															}
															onChangeText={
																setCurrentDiploma
															}
															onFocus={() =>
																scrollToInput(
																	diplomaInputRef,
																	0,
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
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{/* Liste des diplômes */}
											{formData.diplomas_required.length >
												0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.diplomas_required.map(
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
																		as={
																			Trash2
																		}
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
				)}

				{/* Étape 2: Localisation et contrat */}
				{currentStep === 2 && (
					<Box style={{ width: SCREEN_WIDTH, flex: 1 }}>
						<KeyboardAvoidingView
							behavior={
								Platform.OS === "ios" ? "padding" : "height"
							}
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
												style={{
													alignItems: "center",
												}}>
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
												<VStack ref={postcodeInputRef}>
													<Input
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Entrez le code postal'
															value={
																formData.postcode
															}
															onChangeText={(
																text,
															) => {
																updateField(
																	"postcode",
																	text,
																);
																searchCities(
																	text,
																);
															}}
															onFocus={() =>
																scrollToInput(
																	postcodeInputRef,
																	1,
																)
															}
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
														{cities.map(
															(cityData) => (
																<TouchableOpacity
																	key={
																		cityData.code
																	}
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
															),
														)}
													</VStack>
												</VStack>
											)}

											{/* Affichage de la ville sélectionnée */}
											{formData.city && (
												<>
													<Divider
														style={{
															backgroundColor:
																isDark
																	? "#4b5563"
																	: "#e5e7eb",
														}}
													/>

													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
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
																(
																{
																	formData.postcode
																}
																)
															</Text>
															<Text
																size='sm'
																style={{
																	color: isDark
																		? "#9ca3af"
																		: "#6b7280",
																}}>
																{
																	formData.region
																}
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
											<VStack
												space='xs'
												ref={startDateInputRef}>
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
											</VStack>

											{/* Date de fin (conditionnelle pour non-CDI) */}
											{formData.contract_type !==
												"CDI" && (
												<VStack
													space='xs'
													ref={endDateInputRef}>
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
																borderColor:
																	isDark
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
												{WORK_SCHEDULE.map(
													(schedule) => (
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
													),
												)}
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
															onChangeText={(
																value,
															) =>
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
															onChangeText={(
																value,
															) =>
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
												style={{
													alignItems: "center",
												}}>
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

											{/* Sélection du type de salaire */}
											<VStack space='xs'>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Type de rémunération *
												</Text>
												<Select
													selectedValue={
														formData.salary_type
													}
													onValueChange={(value) => {
														updateField(
															"salary_type",
															value,
														);
														// Réinitialiser les champs de salaire
														setFormData((prev) => ({
															...prev,
															salary_type: value,
															salary_hourly: "",
															salary_amount: "",
															salary_min: "",
															salary_max: "",
															weekly_hours: "",
															daily_hours: "",
														}));
													}}>
													<SelectTrigger
														variant='outline'
														size='md'
														style={{
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<SelectInput
															placeholder='Sélectionner'
															value={
																formData.salary_type ===
																"selon_profil"
																	? "Selon profil"
																	: formData.salary_type ===
																		  "hourly"
																		? "Taux horaire"
																		: formData.salary_type ===
																			  "monthly_fixed"
																			? "Salaire mensuel fixe"
																			: formData.salary_type ===
																				  "annual_fixed"
																				? "Salaire annuel fixe"
																				: formData.salary_type ===
																					  "monthly_range"
																					? "Fourchette mensuelle"
																					: formData.salary_type ===
																						  "annual_range"
																						? "Fourchette annuelle"
																						: ""
															}
															style={{
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}
														/>
														<SelectIcon className='mr-3'>
															<Icon
																as={
																	ChevronDownIcon
																}
																style={{
																	color: isDark
																		? "#9ca3af"
																		: "#6b7280",
																}}
															/>
														</SelectIcon>
													</SelectTrigger>
													<SelectPortal>
														<SelectBackdrop />
														<SelectContent
															style={{
																backgroundColor:
																	isDark
																		? "#1f2937"
																		: "#ffffff",
															}}>
															<SelectDragIndicatorWrapper>
																<SelectDragIndicator />
															</SelectDragIndicatorWrapper>
															<SelectItem
																label='Selon profil'
																value='selon_profil'
															/>
															<SelectItem
																label='Taux horaire'
																value='hourly'
															/>
															<SelectItem
																label='Salaire mensuel fixe'
																value='monthly_fixed'
															/>
															<SelectItem
																label='Salaire annuel fixe'
																value='annual_fixed'
															/>
															<SelectItem
																label='Fourchette mensuelle'
																value='monthly_range'
															/>
															<SelectItem
																label='Fourchette annuelle'
																value='annual_range'
															/>
														</SelectContent>
													</SelectPortal>
												</Select>
											</VStack>

											{/* Taux horaire */}
											{formData.salary_type ===
												"hourly" && (
												<>
													<HStack space='md'>
														<VStack
															ref={salaryInputRef}
															space='xs'
															style={{ flex: 1 }}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Taux horaire (€)
																*
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#1f2937"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#e5e7eb",
																}}>
																<InputField
																	placeholder='Ex: 15.50'
																	value={
																		formData.salary_hourly
																	}
																	onChangeText={(
																		value,
																	) =>
																		updateField(
																			"salary_hourly",
																			value,
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			salaryInputRef,
																			1,
																			100,
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

													{/* Sélecteur semaine/jour */}
													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}>
															Période de travail *
														</Text>
														<HStack space='sm'>
															<Pressable
																onPress={() =>
																	updateField(
																		"work_hours_type",
																		"semaine",
																	)
																}
																style={{
																	flex: 1,
																}}>
																<Box
																	style={{
																		padding: 12,
																		borderRadius: 10,
																		borderWidth: 2,
																		borderColor:
																			formData.work_hours_type ===
																			"semaine"
																				? "#3b82f6"
																				: isDark
																					? "#4b5563"
																					: "#e5e7eb",
																		backgroundColor:
																			formData.work_hours_type ===
																			"semaine"
																				? isDark
																					? "#1e3a8a"
																					: "#dbeafe"
																				: isDark
																					? "#1f2937"
																					: "#f9fafb",
																		alignItems:
																			"center",
																	}}>
																	<Text
																		style={{
																			fontWeight:
																				"600",
																			color:
																				formData.work_hours_type ===
																				"semaine"
																					? "#3b82f6"
																					: isDark
																						? "#f3f4f6"
																						: "#111827",
																		}}>
																		Par
																		semaine
																	</Text>
																</Box>
															</Pressable>
															<Pressable
																onPress={() =>
																	updateField(
																		"work_hours_type",
																		"jour",
																	)
																}
																style={{
																	flex: 1,
																}}>
																<Box
																	style={{
																		padding: 12,
																		borderRadius: 10,
																		borderWidth: 2,
																		borderColor:
																			formData.work_hours_type ===
																			"jour"
																				? "#3b82f6"
																				: isDark
																					? "#4b5563"
																					: "#e5e7eb",
																		backgroundColor:
																			formData.work_hours_type ===
																			"jour"
																				? isDark
																					? "#1e3a8a"
																					: "#dbeafe"
																				: isDark
																					? "#1f2937"
																					: "#f9fafb",
																		alignItems:
																			"center",
																	}}>
																	<Text
																		style={{
																			fontWeight:
																				"600",
																			color:
																				formData.work_hours_type ===
																				"jour"
																					? "#3b82f6"
																					: isDark
																						? "#f3f4f6"
																						: "#111827",
																		}}>
																		Par jour
																	</Text>
																</Box>
															</Pressable>
														</HStack>
													</VStack>

													{/* Input heures par semaine */}
													{formData.work_hours_type ===
														"semaine" && (
														<VStack
															space='xs'
															ref={hoursInputRef}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
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
																	backgroundColor:
																		isDark
																			? "#1f2937"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#e5e7eb",
																}}>
																<InputField
																	placeholder='Ex: 35'
																	value={
																		formData.weekly_hours
																	}
																	onChangeText={(
																		value,
																	) =>
																		updateField(
																			"weekly_hours",
																			value,
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			hoursInputRef,
																			1,
																			100,
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
													)}

													{/* Input heures par jour */}
													{formData.work_hours_type ===
														"jour" && (
														<VStack
															space='xs'
															ref={hoursInputRef}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Heures/jour *
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#1f2937"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#e5e7eb",
																}}>
																<InputField
																	placeholder='Ex: 7'
																	value={
																		formData.daily_hours
																	}
																	onChangeText={(
																		value,
																	) =>
																		updateField(
																			"daily_hours",
																			value,
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			hoursInputRef,
																			1,
																			100,
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
													)}
													{/* Calcul du salaire mensuel */}
													{formData.salary_hourly &&
														((formData.work_hours_type ===
															"jour" &&
															formData.daily_hours) ||
															(formData.work_hours_type ===
																"semaine" &&
																formData.weekly_hours)) && (
															<Box
																style={{
																	padding: 16,
																	backgroundColor:
																		isDark
																			? "#1e3a8a"
																			: "#dbeafe",
																	borderRadius: 10,
																	borderWidth: 1,
																	borderColor:
																		"#3b82f6",
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
																		Salaire
																		mensuel
																		estimé
																	</Text>
																	<Text
																		style={{
																			fontSize: 24,
																			fontWeight:
																				"700",
																			color: "#3b82f6",
																		}}>
																		{formData.work_hours_type ===
																		"jour"
																			? (
																					(parseFloat(
																						formData.salary_hourly,
																					) *
																						parseFloat(
																							formData.daily_hours,
																						) *
																						22) /
																					1
																				).toFixed(
																					2,
																				)
																			: (
																					(parseFloat(
																						formData.salary_hourly,
																					) *
																						parseFloat(
																							formData.weekly_hours,
																						) *
																						52) /
																					12
																				).toFixed(
																					2,
																				)}{" "}
																		€
																	</Text>
																	<Text
																		size='xs'
																		style={{
																			color: isDark
																				? "#93c5fd"
																				: "#1e40af",
																		}}>
																		{formData.work_hours_type ===
																		"jour"
																			? `Calcul : ${formData.salary_hourly}€/h × ${formData.daily_hours}h/jour × 22 jours`
																			: `Calcul : ${formData.salary_hourly}€/h × ${formData.weekly_hours}h/sem × 52 sem ÷ 12 mois`}
																	</Text>
																</VStack>
															</Box>
														)}
												</>
											)}

											{/* Salaire mensuel fixe */}
											{formData.salary_type ===
												"monthly_fixed" && (
												<>
													<VStack
														ref={salaryInputRef}
														space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}>
															Salaire mensuel brut
															(€) *
														</Text>
														<Input
															variant='outline'
															size='md'
															style={{
																backgroundColor:
																	isDark
																		? "#374151"
																		: "#ffffff",
																borderColor:
																	isDark
																		? "#4b5563"
																		: "#d1d5db",
																color: isDark
																	? "#f9fafb"
																	: "#111827",
															}}>
															<InputField
																placeholder='Ex: 2500'
																value={
																	formData.salary_monthly_fixed ||
																	""
																}
																onChangeText={(
																	text,
																) =>
																	setFormData(
																		{
																			...formData,
																			salary_monthly_fixed:
																				text,
																		},
																	)
																}
																onFocus={() =>
																	scrollToInput(
																		salaryInputRef,
																		1,
																		100,
																	)
																}
																keyboardType='numeric'
																style={{
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}
															/>
														</Input>
													</VStack>
												</>
											)}

											{/* Salaire annuel fixe */}
											{formData.salary_type ===
												"annual_fixed" && (
												<>
													<VStack
														ref={salaryInputRef}
														space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
															}}>
															Salaire annuel brut
															(€) *
														</Text>
														<Input
															variant='outline'
															size='md'
															style={{
																backgroundColor:
																	isDark
																		? "#374151"
																		: "#ffffff",
																borderColor:
																	isDark
																		? "#4b5563"
																		: "#d1d5db",
																color: isDark
																	? "#f9fafb"
																	: "#111827",
															}}>
															<InputField
																placeholder='Ex: 35000'
																value={
																	formData.salary_annual_fixed ||
																	""
																}
																onChangeText={(
																	text,
																) =>
																	setFormData(
																		{
																			...formData,
																			salary_annual_fixed:
																				text,
																		},
																	)
																}
																onFocus={() =>
																	scrollToInput(
																		salaryInputRef,
																		1,
																		100,
																	)
																}
																keyboardType='numeric'
																style={{
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}
															/>
														</Input>
													</VStack>
												</>
											)}

											{/* Fourchette mensuelle */}
											{formData.salary_type ===
												"monthly_range" && (
												<>
													<HStack
														ref={salaryInputRef}
														space='md'>
														<VStack
															space='xs'
															style={{ flex: 1 }}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Salaire min. (€)
																*
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#374151"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#d1d5db",
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}>
																<InputField
																	placeholder='Ex: 2000'
																	value={
																		formData.salary_monthly_min ||
																		""
																	}
																	onChangeText={(
																		text,
																	) =>
																		setFormData(
																			{
																				...formData,
																				salary_monthly_min:
																					text,
																			},
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			salaryInputRef,
																			1,
																			100,
																		)
																	}
																	keyboardType='numeric'
																	style={{
																		color: isDark
																			? "#f9fafb"
																			: "#111827",
																	}}
																/>
															</Input>
														</VStack>

														<VStack
															space='xs'
															style={{ flex: 1 }}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Salaire max. (€)
																*
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#374151"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#d1d5db",
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}>
																<InputField
																	placeholder='Ex: 2800'
																	value={
																		formData.salary_monthly_max ||
																		""
																	}
																	onChangeText={(
																		text,
																	) =>
																		setFormData(
																			{
																				...formData,
																				salary_monthly_max:
																					text,
																			},
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			salaryInputRef,
																			1,
																			100,
																		)
																	}
																	keyboardType='numeric'
																	style={{
																		color: isDark
																			? "#f9fafb"
																			: "#111827",
																	}}
																/>
															</Input>
														</VStack>
													</HStack>
												</>
											)}

											{/* Fourchette annuelle */}
											{formData.salary_type ===
												"annual_range" && (
												<>
													<HStack
														ref={salaryInputRef}
														space='md'>
														<VStack
															space='xs'
															style={{ flex: 1 }}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Salaire min. (€)
																*
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#374151"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#d1d5db",
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}>
																<InputField
																	placeholder='Ex: 30000'
																	value={
																		formData.salary_annual_min ||
																		""
																	}
																	onChangeText={(
																		text,
																	) =>
																		setFormData(
																			{
																				...formData,
																				salary_annual_min:
																					text,
																			},
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			salaryInputRef,
																			1,
																			100,
																		)
																	}
																	keyboardType='numeric'
																	style={{
																		color: isDark
																			? "#f9fafb"
																			: "#111827",
																	}}
																/>
															</Input>
														</VStack>

														<VStack
															space='xs'
															style={{ flex: 1 }}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? "#f3f4f6"
																		: "#111827",
																}}>
																Salaire max. (€)
																*
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? "#374151"
																			: "#ffffff",
																	borderColor:
																		isDark
																			? "#4b5563"
																			: "#d1d5db",
																	color: isDark
																		? "#f9fafb"
																		: "#111827",
																}}>
																<InputField
																	placeholder='Ex: 40000'
																	value={
																		formData.salary_annual_max ||
																		""
																	}
																	onChangeText={(
																		text,
																	) =>
																		setFormData(
																			{
																				...formData,
																				salary_annual_max:
																					text,
																			},
																		)
																	}
																	onFocus={() =>
																		scrollToInput(
																			salaryInputRef,
																			1,
																			100,
																		)
																	}
																	keyboardType='numeric'
																	style={{
																		color: isDark
																			? "#f9fafb"
																			: "#111827",
																	}}
																/>
															</Input>
														</VStack>
													</HStack>
												</>
											)}

											{/* Selon profil / À négocier */}
											{formData.salary_type ===
												"selon_profil" && (
												<>
													<Box
														style={{
															padding: 16,
															backgroundColor:
																isDark
																	? "#1e3a8a"
																	: "#dbeafe",
															borderRadius: 10,
															borderWidth: 1,
															borderColor:
																"#3b82f6",
														}}>
														<VStack
															space='xs'
															style={{
																alignItems:
																	"center",
															}}>
															<Text
																size='sm'
																style={{
																	color: isDark
																		? "#93c5fd"
																		: "#1e40af",
																	fontWeight:
																		"500",
																	textAlign:
																		"center",
																}}>
																💡 Le salaire
																sera déterminé
																selon le profil
																du candidat
															</Text>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? "#93c5fd"
																		: "#1e40af",
																	textAlign:
																		"center",
																}}>
																Cette option
																permet plus de
																flexibilité dans
																les négociations
															</Text>
														</VStack>
													</Box>
												</>
											)}
										</VStack>
									</Card>
								</VStack>
							</ScrollView>
						</KeyboardAvoidingView>
					</Box>
				)}

				{/* Étape 3: Détails */}
				{currentStep === 3 && (
					<Box style={{ width: SCREEN_WIDTH, flex: 1 }}>
						<KeyboardAvoidingView
							behavior={
								Platform.OS === "ios" ? "padding" : "height"
							}
							style={{ flex: 1 }}
							keyboardVerticalOffset={100}>
							<ScrollView
								ref={(ref) => (scrollViewRefs.current[2] = ref)}
								keyboardShouldPersistTaps='handled'>
								<VStack
									space='lg'
									style={{ padding: 20, paddingBottom: 100 }}>
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
												style={{
													alignItems: "center",
												}}>
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
															backgroundColor:
																isDark
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
													onPress={addDrivingLicense}
													style={{
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{/* Liste des permis */}
											{formData.driving_licenses.length >
												0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.driving_licenses.map(
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
																		as={
																			Trash2
																		}
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
												style={{
													alignItems: "center",
												}}>
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
															backgroundColor:
																isDark
																	? "#1f2937"
																	: "#ffffff",
															borderColor: isDark
																? "#4b5563"
																: "#e5e7eb",
														}}>
														<InputField
															placeholder='Ex: Anglais, Espagnol'
															value={
																currentLanguage
															}
															onChangeText={
																setCurrentLanguage
															}
															onFocus={() =>
																scrollToInput(
																	languageInputRef,
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
													onPress={addLanguage}
													style={{
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{/* Liste des langues */}
											{formData.languages.length > 0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.languages.map(
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
																		as={
																			Trash2
																		}
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
												style={{
													alignItems: "center",
												}}>
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
															backgroundColor:
																isDark
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
													onPress={addReimbursement}
													style={{
														backgroundColor:
															"#3b82f6",
													}}>
													<ButtonIcon
														as={Plus}
														style={{
															color: "#ffffff",
														}}
													/>
												</Button>
											</HStack>
											{/* Liste des remboursements */}
											{formData.reimbursements.length >
												0 && (
												<VStack
													space='xs'
													style={{ marginTop: 8 }}>
													{formData.reimbursements.map(
														(
															reimbursement,
															index,
														) => (
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
																	{
																		reimbursement
																	}
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
																		as={
																			Trash2
																		}
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
												style={{
													alignItems: "center",
												}}>
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

											{/* Panier repas */}
											<HStack
												space='md'
												style={{
													justifyContent:
														"space-between",
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
													value={
														formData.packed_lunch
													}
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
													justifyContent:
														"space-between",
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
													value={
														formData.accommodations
													}
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
				)}

				{/* Étape 4: Récapitulatif */}
				{currentStep === 4 && (
					<Box style={{ width: SCREEN_WIDTH, flex: 1 }}>
						<ScrollView
							ref={(ref) => (scrollViewRefs.current[3] = ref)}
							showsVerticalScrollIndicator={false}>
							<VStack
								space='lg'
								style={{ padding: 20, paddingBottom: 120 }}>
								{/* Bannière récap */}
								<Card
									style={{
										padding: 16,
										backgroundColor: isDark
											? "#1e3a5f"
											: "#eff6ff",
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isDark
											? "#2563eb"
											: "#bfdbfe",
									}}>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={FileText}
											size='lg'
											style={{ color: "#3b82f6" }}
										/>
										<VStack style={{ flex: 1 }}>
											<Text
												size='md'
												style={{
													fontWeight: "700",
													color: isDark
														? "#93c5fd"
														: "#1d4ed8",
												}}>
												Vérifiez votre annonce
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#60a5fa"
														: "#3b82f6",
												}}>
												Relisez les informations avant
												de publier
											</Text>
										</VStack>
									</HStack>
								</Card>

								{/* Infos principales */}
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
												as={Briefcase}
												size='md'
												style={{ color: "#3b82f6" }}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "700",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Informations principales
											</Text>
										</HStack>
										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>
										<VStack space='sm'>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Titre
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formData.title || "—"}
												</Text>
											</HStack>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Catégorie
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{CATEGORIES.find(
														(c) =>
															c.id ===
															formData.category,
													)
														? `${CATEGORIES.find((c) => c.id === formData.category).acronym} - ${CATEGORIES.find((c) => c.id === formData.category).name}`
														: "—"}
												</Text>
											</HStack>
											{formData.isLastMinute && (
												<HStack
													style={{
														justifyContent:
															"space-between",
													}}>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
															flex: 1,
														}}>
														Type
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: "#f59e0b",
															flex: 2,
															textAlign: "right",
														}}>
														⚡ Last Minute
													</Text>
												</HStack>
											)}
										</VStack>
										{formData.description ? (
											<>
												<Divider
													style={{
														backgroundColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}
												/>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Description
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#d1d5db"
															: "#374151",
													}}>
													{formData.description}
												</Text>
											</>
										) : null}
										{formData.missions.length > 0 && (
											<>
												<Divider
													style={{
														backgroundColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}
												/>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Missions
												</Text>
												<VStack space='xs'>
													{formData.missions.map(
														(m, i) => (
															<HStack
																key={i}
																space='xs'
																style={{
																	alignItems:
																		"flex-start",
																}}>
																<Box
																	style={{
																		width: 6,
																		height: 6,
																		borderRadius: 3,
																		backgroundColor:
																			"#3b82f6",
																		marginTop: 6,
																	}}
																/>
																<Text
																	size='sm'
																	style={{
																		flex: 1,
																		color: isDark
																			? "#d1d5db"
																			: "#374151",
																	}}>
																	{m}
																</Text>
															</HStack>
														),
													)}
												</VStack>
											</>
										)}
										{formData.searched_profile.length >
											0 && (
											<>
												<Divider
													style={{
														backgroundColor: isDark
															? "#4b5563"
															: "#e5e7eb",
													}}
												/>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Profil recherché
												</Text>
												<VStack space='xs'>
													{formData.searched_profile.map(
														(p, i) => (
															<HStack
																key={i}
																space='xs'
																style={{
																	alignItems:
																		"flex-start",
																}}>
																<Box
																	style={{
																		width: 6,
																		height: 6,
																		borderRadius: 3,
																		backgroundColor:
																			"#10b981",
																		marginTop: 6,
																	}}
																/>
																<Text
																	size='sm'
																	style={{
																		flex: 1,
																		color: isDark
																			? "#d1d5db"
																			: "#374151",
																	}}>
																	{p}
																</Text>
															</HStack>
														),
													)}
												</VStack>
											</>
										)}
									</VStack>
								</Card>

								{/* Localisation et contrat */}
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
												size='md'
												style={{ color: "#3b82f6" }}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "700",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Localisation & Contrat
											</Text>
										</HStack>
										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>
										<VStack space='sm'>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Ville
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formData.city
														? `${formData.postcode} ${formData.city}`
														: "—"}
												</Text>
											</HStack>
											{formData.department && (
												<HStack
													style={{
														justifyContent:
															"space-between",
													}}>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
															flex: 1,
														}}>
														Département
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
															flex: 2,
															textAlign: "right",
														}}>
														{formData.department}
													</Text>
												</HStack>
											)}
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Contrat
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formData.contract_type ||
														"—"}
												</Text>
											</HStack>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Temps de travail
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formData.work_time || "—"}
												</Text>
											</HStack>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Horaires
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formData.work_schedule ||
														"—"}
												</Text>
											</HStack>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Date de début
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formatDate(
														formData.start_date,
													)}
												</Text>
											</HStack>
											{formData.end_date && (
												<HStack
													style={{
														justifyContent:
															"space-between",
													}}>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
															flex: 1,
														}}>
														Date de fin
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
															flex: 2,
															textAlign: "right",
														}}>
														{formatDate(
															formData.end_date,
														)}
													</Text>
												</HStack>
											)}
											{(formData.start_time ||
												formData.end_time) && (
												<HStack
													style={{
														justifyContent:
															"space-between",
													}}>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
															flex: 1,
														}}>
														Horaire
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
															flex: 2,
															textAlign: "right",
														}}>
														{[
															formData.start_time
																? `Début : ${formData.start_time}`
																: null,
															formData.end_time
																? `Fin : ${formData.end_time}`
																: null,
														]
															.filter(Boolean)
															.join("  •  ")}
													</Text>
												</HStack>
											)}
										</VStack>
									</VStack>
								</Card>

								{/* Rémunération */}
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
												size='md'
												style={{ color: "#3b82f6" }}
											/>
											<Text
												size='md'
												style={{
													fontWeight: "700",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Rémunération
											</Text>
										</HStack>
										<Divider
											style={{
												backgroundColor: isDark
													? "#4b5563"
													: "#e5e7eb",
											}}
										/>
										<VStack space='sm'>
											<HStack
												style={{
													justifyContent:
														"space-between",
												}}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														flex: 1,
													}}>
													Salaire
												</Text>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
														flex: 2,
														textAlign: "right",
													}}>
													{formatSalary(formData)}
												</Text>
											</HStack>
											{(formData.weekly_hours ||
												formData.daily_hours) && (
												<HStack
													style={{
														justifyContent:
															"space-between",
													}}>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
															flex: 1,
														}}>
														Heures
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? "#f3f4f6"
																: "#111827",
															flex: 2,
															textAlign: "right",
														}}>
														{formData.work_hours_type ===
														"jour"
															? `${formData.daily_hours}h/jour`
															: `${formData.weekly_hours}h/semaine`}
													</Text>
												</HStack>
											)}
										</VStack>
									</VStack>
								</Card>

								{/* Compétences & Avantages */}
								{(formData.diplomas_required.length > 0 ||
									formData.driving_licenses.length > 0 ||
									formData.languages.length > 0 ||
									formData.reimbursements.length > 0 ||
									formData.packed_lunch ||
									formData.accommodations) && (
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
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={GraduationCap}
													size='md'
													style={{ color: "#3b82f6" }}
												/>
												<Text
													size='md'
													style={{
														fontWeight: "700",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Compétences & Avantages
												</Text>
											</HStack>
											<Divider
												style={{
													backgroundColor: isDark
														? "#4b5563"
														: "#e5e7eb",
												}}
											/>
											<VStack space='sm'>
												{formData.diplomas_required
													.length > 0 && (
													<HStack
														style={{
															justifyContent:
																"space-between",
															alignItems:
																"flex-start",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
																flex: 1,
															}}>
															Diplômes requis
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																flex: 2,
																textAlign:
																	"right",
															}}>
															{formData.diplomas_required.join(
																", ",
															)}
														</Text>
													</HStack>
												)}
												{formData.driving_licenses
													.length > 0 && (
													<HStack
														style={{
															justifyContent:
																"space-between",
															alignItems:
																"flex-start",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
																flex: 1,
															}}>
															Permis
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																flex: 2,
																textAlign:
																	"right",
															}}>
															{formData.driving_licenses.join(
																", ",
															)}
														</Text>
													</HStack>
												)}
												{formData.languages.length >
													0 && (
													<HStack
														style={{
															justifyContent:
																"space-between",
															alignItems:
																"flex-start",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
																flex: 1,
															}}>
															Langues
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																flex: 2,
																textAlign:
																	"right",
															}}>
															{formData.languages.join(
																", ",
															)}
														</Text>
													</HStack>
												)}
												{formData.reimbursements
													.length > 0 && (
													<HStack
														style={{
															justifyContent:
																"space-between",
															alignItems:
																"flex-start",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
																flex: 1,
															}}>
															Remboursements
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																flex: 2,
																textAlign:
																	"right",
															}}>
															{formData.reimbursements.join(
																", ",
															)}
														</Text>
													</HStack>
												)}
												{(formData.packed_lunch ||
													formData.accommodations) && (
													<HStack
														style={{
															justifyContent:
																"space-between",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? "#9ca3af"
																	: "#6b7280",
																flex: 1,
															}}>
															Avantages
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#f3f4f6"
																	: "#111827",
																flex: 2,
																textAlign:
																	"right",
															}}>
															{[
																formData.packed_lunch &&
																	"Panier repas",
																formData.accommodations &&
																	"Hébergement",
															]
																.filter(Boolean)
																.join(", ")}
														</Text>
													</HStack>
												)}
											</VStack>
										</VStack>
									</Card>
								)}
							</VStack>
						</ScrollView>
					</Box>
				)}
			</Box>

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

			{/* Modal de confirmation publication */}
			<AlertDialog
				isOpen={showConfirmModal}
				onClose={() => setShowConfirmModal(false)}>
				<AlertDialogBackdrop />
				<AlertDialogContent
					style={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						borderRadius: 16,
						margin: 20,
					}}>
					<AlertDialogHeader style={{ paddingBottom: 8 }}>
						<VStack
							space='xs'
							style={{ alignItems: "center", width: "100%" }}>
							<Box
								style={{
									width: 56,
									height: 56,
									borderRadius: 28,
									backgroundColor: isDark
										? "#064e3b"
										: "#d1fae5",
									alignItems: "center",
									justifyContent: "center",
									marginBottom: 8,
								}}>
								<Icon
									as={FileText}
									size='xl'
									style={{ color: "#10b981" }}
								/>
							</Box>
							<Heading
								size='md'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Publier l'annonce ?
							</Heading>
						</VStack>
					</AlertDialogHeader>
					<AlertDialogBody style={{ paddingVertical: 12 }}>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
								textAlign: "center",
								lineHeight: 20,
							}}>
							Votre annonce
							{formData.title ? ` "${formData.title}"` : ""} sera
							visible par tous les candidats. Confirmez-vous la
							publication ?
						</Text>
					</AlertDialogBody>
					<AlertDialogFooter style={{ paddingTop: 8 }}>
						<HStack space='md' style={{ width: "100%" }}>
							<Button
								variant='outline'
								size='lg'
								style={{
									flex: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}
								onPress={() => setShowConfirmModal(false)}>
								<ButtonText
									style={{
										color: isDark ? "#f3f4f6" : "#374151",
									}}>
									Annuler
								</ButtonText>
							</Button>
							<Button
								size='lg'
								style={{
									flex: 1,
									backgroundColor: "#10b981",
								}}
								isDisabled={loading}
								onPress={() => {
									setShowConfirmModal(false);
									handleSubmit();
								}}>
								<ButtonIcon
									as={Save}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									{loading ? "Publication..." : "Publier"}
								</ButtonText>
							</Button>
						</HStack>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Actionsheet — Date de début */}
			<Actionsheet
				isOpen={showStartDatePicker}
				onClose={() => setShowStartDatePicker(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						paddingBottom: 32,
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						space='md'
						style={{
							width: "100%",
							alignItems: "center",
							paddingTop: 8,
						}}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 16,
								color: isDark ? "#f9fafb" : "#111827",
							}}>
							Date de début
						</Text>
						<DateTimePicker
							value={formData.start_date || new Date()}
							mode='date'
							display='spinner'
							onChange={handleStartDateChange}
							minimumDate={new Date()}
							style={{ width: "100%" }}
							textColor={isDark ? "#f9fafb" : "#111827"}
						/>
						<Button
							size='md'
							onPress={() => setShowStartDatePicker(false)}
							style={{
								backgroundColor: "#3b82f6",
								width: "100%",
								marginTop: 8,
							}}>
							<ButtonText style={{ color: "#ffffff" }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>

			{/* Actionsheet — Date de fin */}
			<Actionsheet
				isOpen={showEndDatePicker}
				onClose={() => setShowEndDatePicker(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						paddingBottom: 32,
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						space='md'
						style={{
							width: "100%",
							alignItems: "center",
							paddingTop: 8,
						}}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 16,
								color: isDark ? "#f9fafb" : "#111827",
							}}>
							Date de fin
						</Text>
						<DateTimePicker
							value={
								formData.end_date ||
								formData.start_date ||
								new Date()
							}
							mode='date'
							display='spinner'
							onChange={handleEndDateChange}
							minimumDate={formData.start_date || new Date()}
							style={{ width: "100%" }}
							textColor={isDark ? "#f9fafb" : "#111827"}
						/>
						<Button
							size='md'
							onPress={() => setShowEndDatePicker(false)}
							style={{
								backgroundColor: "#3b82f6",
								width: "100%",
								marginTop: 8,
							}}>
							<ButtonText style={{ color: "#ffffff" }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</Box>
	);
};

export default PostJob;
