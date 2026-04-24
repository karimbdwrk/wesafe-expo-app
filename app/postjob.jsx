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
	ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, Stack } from "expo-router";
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
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
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
	Award,
	Zap,
	Sparkles,
	CalendarDays,
	AlertCircle,
	CheckCircle,
	IdCard,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useStripePaymentHandler } from "@/services/stripeApi";
import { POST_JOB } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { formatSalary } from "@/constants/salary";
import {
	CATEGORY as CATEGORIES,
	getCategoryLabel,
} from "@/constants/categories";
import { DRIVING_LICENSES } from "@/constants/drivinglicences";
import { DIPLOMAS } from "@/constants/diplomas";
import { CERTIFICATIONS } from "@/constants/certifications";
import { CNAPS_CARDS } from "@/constants/cnapscards";
import { languages as LANGUAGES } from "@/constants/languages";
import { departements } from "@/constants/departements";
import { regions } from "@/constants/regions";
import { createSupabaseClient } from "@/lib/supabase";

const CONTRACT_TYPES = ["CDI", "CDD"];
const WORK_TIME = ["Temps plein", "Temps partiel"];
const WORK_SCHEDULE = ["Jour", "Nuit", "Variable"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SPONSORSHIP_PRICES = {
	"1w": { amountInCents: 999, amountDecimal: 9.99, label: "1 semaine" },
	"2w": { amountInCents: 1799, amountDecimal: 17.99, label: "2 semaines" },
	"1m": { amountInCents: 2999, amountDecimal: 29.99, label: "1 mois" },
};

const STEPS = [
	{ id: 1, title: "Informations principales" },
	{ id: 2, title: "Localisation et contrat" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Récapitulatif" },
	// { id: 4, title: "Détails" },
];

const PostJob = () => {
	const { user, accessToken, userCompany } = useAuth();
	const { isDark } = useTheme();
	const { create, getAll, update, trackActivity } = useDataContext();
	const { initiateAndPresentPayment } = useStripePaymentHandler();
	const router = useRouter();
	const toast = useToast();

	const [loading, setLoading] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const [jobCount, setJobCount] = useState(null);
	const [isSponsored, setIsSponsored] = useState(false);
	const [sponsorshipDuration, setSponsorshipDuration] = useState(null); // "1w" | "2w" | "1m"
	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null]);
	const titleInputRef = useRef(null);
	const descriptionInputRef = useRef(null);
	const postcodeInputRef = useRef(null);
	const citySearchTimer = useRef(null);
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
	const [showVacationDatePicker, setShowVacationDatePicker] = useState(false);
	const [showCategorySheet, setShowCategorySheet] = useState(false);
	const [showDrivingLicenseSheet, setShowDrivingLicenseSheet] =
		useState(false);
	const [showDiplomaSheet, setShowDiplomaSheet] = useState(false);
	const [showCertificationSheet, setShowCertificationSheet] = useState(false);
	const [showCnapsSheet, setShowCnapsSheet] = useState(false);
	const [showLanguageSheet, setShowLanguageSheet] = useState(false);
	const [currentVacation, setCurrentVacation] = useState({
		date: null,
		start_time: "",
		end_time: "",
	});
	const [vacationWarnings, setVacationWarnings] = useState(new Set());
	const [cities, setCities] = useState([]);
	const [postcodeInput, setPostcodeInput] = useState("");
	const [cityLoading, setCityLoading] = useState(false);
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
		work_schedule: "",
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
		certifications_required: [],
		cnaps_required: [],
		driving_licenses: [],
		languages: [],
		reimbursements: [],
		packed_lunch: false,
		accommodations: false,
		isLastMinute: false,
		date_mode: "dates",
		vacations: [],
		start_date_asap: false,
	});

	useEffect(() => {
		console.log("subscription status:", userCompany?.subscription_status);
	}, [userCompany]);

	const updateField = (field, value) => {
		// Si on change le type d'heures, réinitialiser les deux champs d'heures
		if (field === "work_hours_type") {
			setFormData((prev) => ({
				...prev,
				[field]: value,
				weekly_hours: "",
				daily_hours: "",
			}));
		} else if (field === "contract_type" && value === "CDI") {
			// En passant en CDI, réinitialiser mode date et vacations
			setFormData((prev) => ({
				...prev,
				[field]: value,
				date_mode: "dates",
				vacations: [],
				end_date: null,
				start_date_asap: false,
			}));
		} else if (field === "date_mode" && value === "vacations") {
			// En mode vacations, forcer le taux horaire et heures par jour
			setFormData((prev) => ({
				...prev,
				date_mode: value,
				salary_type: "hourly",
				work_hours_type: "jour",
				weekly_hours: "",
			}));
		} else if (field === "date_mode" && value === "dates") {
			setFormData((prev) => ({
				...prev,
				date_mode: value,
				vacations: [],
			}));
		} else {
			if (field === "isLastMinute") {
				if (value === true) {
					setIsSponsored(false);
					setSponsorshipDuration(null);
					// Calculer les vacations hors délai 7j
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const limit = new Date(today);
					limit.setDate(limit.getDate() + 7);
					const warned = new Set(
						formData.vacations
							.map((v, i) =>
								new Date(v.date) > limit ? i : null,
							)
							.filter((i) => i !== null),
					);
					setVacationWarnings(warned);
				} else {
					setVacationWarnings(new Set());
				}
			}
			setFormData((prev) => ({ ...prev, [field]: value }));
		}
	};

	const searchCities = async () => {
		console.log("code postal envoyé :", postcodeInput);
		if (postcodeInput.length !== 5) return;
		setCityLoading(true);

		// 1. Vérifier le cache Supabase
		try {
			const { data: cached } = await getAll(
				"cities",
				"*",
				`&postcode=eq.${postcodeInput}`,
				1,
				50,
			);
			if (cached && cached.length > 0) {
				console.log("📦 Villes depuis cache Supabase:", cached);
				setCities(cached);
				setCityLoading(false);
				return;
			}
		} catch (cacheErr) {
			console.warn(
				"Impossible de vérifier le cache cities:",
				cacheErr?.message,
			);
		}

		// 2. Fetch depuis l'API gouv
		try {
			const response = await axios.get(
				`https://geo.api.gouv.fr/communes?codePostal=${postcodeInput}&fields=nom,code,codeDepartement,codeRegion&geometry=centre&format=geojson`,
			);
			const features = response.data.features || [];

			// 3. Normaliser en format plat (snake_case = colonnes Supabase)
			const normalized = features.map((f) => ({
				postcode: postcodeInput,
				code: f.properties.code,
				nom: f.properties.nom,
				department_code: f.properties.codeDepartement,
				region_code: f.properties.codeRegion,
				latitude: f.geometry?.coordinates?.[1] ?? null,
				longitude: f.geometry?.coordinates?.[0] ?? null,
			}));

			// 4. Sauvegarder dans Supabase (sans bloquer l'affichage)
			normalized.forEach((city) => {
				create("cities", city).catch((e) =>
					console.warn("Erreur save city:", e?.message),
				);
			});

			console.log("🌐 Villes depuis API:", normalized);
			setCities(normalized);
		} catch (error) {
			console.error("Error fetching cities:", {
				status: error?.response?.status,
				statusText: error?.response?.statusText,
				url: error?.config?.url,
				data: error?.response?.data,
				message: error?.message,
			});
			setCities([]);
		} finally {
			setCityLoading(false);
		}
	};

	const selectCity = (cityData) => {
		const dep = departements.find(
			(d) => d.code === cityData.department_code,
		);
		const reg = regions.find((r) => r.code === cityData.region_code);
		setFormData((prev) => ({
			...prev,
			city: cityData.nom,
			postcode: postcodeInput,
			department: dep?.nom || cityData.department_code || "",
			region: reg?.nom || cityData.region_code || "",
			department_code: cityData.department_code || "",
			region_code: cityData.region_code || "",
			latitude: cityData.latitude,
			longitude: cityData.longitude,
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
			// Si lastMinute actif et date > 7 jours, auto-désactiver
			if (formData.isLastMinute) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const limit = new Date(today);
				limit.setDate(limit.getDate() + 7);
				if (selectedDate > limit) {
					setFormData((prev) => ({
						...prev,
						start_date: selectedDate,
						isLastMinute: false,
					}));
					showError(
						"Attention",
						"\u00ab Dernière minute \u00bb désactivé : la date dépasse les 7 prochains jours",
					);
				}
			}
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
				<CustomToast
					id={id}
					icon={AlertCircle}
					color={isDark ? Colors.dark.danger : Colors.light.danger}
					title={message}
				/>
			),
		});
	};

	const handleVacationDateChange = (event, selectedDate) => {
		if (selectedDate) {
			setCurrentVacation((prev) => ({ ...prev, date: selectedDate }));
		}
	};

	const formatVacationTimeInput = (value, field) => {
		const numbers = value.replace(/[^0-9]/g, "");
		const limited = numbers.slice(0, 4);
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
		setCurrentVacation((prev) => ({ ...prev, [field]: formatted }));
	};

	const addVacation = () => {
		if (
			!currentVacation.date ||
			!currentVacation.start_time ||
			!currentVacation.end_time
		) {
			showError(
				"Erreur",
				"Veuillez remplir la date, l'heure de début et l'heure de fin",
			);
			return;
		}
		if (formData.vacations.length >= 7) {
			showError(
				"Erreur",
				"Vous ne pouvez pas ajouter plus de 7 vacations",
			);
			return;
		}
		// Vérifier la contrainte lastMinute
		if (formData.isLastMinute) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const limit = new Date(today);
			limit.setDate(limit.getDate() + 7);
			limit.setHours(23, 59, 59, 999);
			const vacDate = new Date(currentVacation.date);
			vacDate.setHours(0, 0, 0, 0);
			if (vacDate > limit) {
				showError(
					"Erreur",
					"Une offre \u00ab Dernière minute \u00bb ne peut pas avoir une vacation au-delà des 7 prochains jours",
				);
				return;
			}
		}
		setFormData((prev) => ({
			...prev,
			vacations: [...prev.vacations, { ...currentVacation }].sort(
				(a, b) => new Date(a.date) - new Date(b.date),
			),
		}));
		setCurrentVacation({ date: null, start_time: "", end_time: "" });
	};

	const removeVacation = (index) => {
		setFormData((prev) => {
			const updated = prev.vacations.filter((_, i) => i !== index);
			// Recalculer les warnings avec les nouveaux indices
			if (prev.isLastMinute) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const limit = new Date(today);
				limit.setDate(limit.getDate() + 7);
				limit.setHours(23, 59, 59, 999);
				const warned = new Set(
					updated
						.map((v, i) => {
							const d = new Date(v.date);
							d.setHours(0, 0, 0, 0);
							return d > limit ? i : null;
						})
						.filter((i) => i !== null),
				);
				setVacationWarnings(warned);
			}
			return { ...prev, vacations: updated };
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
				if (!formData.city) {
					showError(
						"Erreur",
						"Veuillez remplir tous les champs obligatoires (localisation)",
					);
					return false;
				}
				// Validation selon le mode de planification
				if (
					formData.contract_type === "CDD" &&
					formData.date_mode === "vacations"
				) {
					if (formData.vacations.length === 0) {
						showError(
							"Erreur",
							"Veuillez ajouter au moins une vacation",
						);
						return false;
					}
					// Contrainte lastMinute sur les vacations
					if (formData.isLastMinute) {
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const limit = new Date(today);
						limit.setDate(limit.getDate() + 7);
						limit.setHours(23, 59, 59, 999);
						const hasOutOfRange = formData.vacations.some((v) => {
							const d = new Date(v.date);
							d.setHours(0, 0, 0, 0);
							return d > limit;
						});
						if (hasOutOfRange) {
							showError(
								"Erreur",
								"Une offre \u00ab Dernière minute \u00bb ne peut contenir que des vacations dans les 7 prochains jours",
							);
							return false;
						}
					}
				} else {
					if (!formData.start_date && !formData.start_date_asap) {
						showError(
							"Erreur",
							"Veuillez indiquer une date de début",
						);
						return false;
					}
					if (
						formData.contract_type !== "CDI" &&
						!formData.end_date
					) {
						showError(
							"Erreur",
							"La date de fin est obligatoire pour ce type de contrat",
						);
						return false;
					}
					// Contrainte lastMinute sur la date de début
					if (formData.isLastMinute && formData.start_date) {
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const limit = new Date(today);
						limit.setDate(limit.getDate() + 7);
						if (new Date(formData.start_date) > limit) {
							showError(
								"Erreur",
								"Une offre \u00ab Dernière minute \u00bb doit commencer dans les 7 prochains jours",
							);
							return false;
						}
					}
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
						!formData.daily_hours &&
						!(
							formData.contract_type === "CDD" &&
							formData.date_mode === "vacations"
						)
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
		trackActivity(POST_JOB);
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
			const isVacationsMode =
				formData.contract_type === "CDD" &&
				formData.date_mode === "vacations";
			const startDateISO = isVacationsMode
				? null
				: formData.start_date
					? formData.start_date.toISOString().split("T")[0]
					: null;
			const endDateISO = isVacationsMode
				? null
				: formData.end_date
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

			const mapContractType = (value) => {
				if (value === "CDI") return "cdi";
				if (value === "CDD") return "cdd";
				return value;
			};

			const mapWorkHoursType = (value) => {
				if (value === "semaine") return "weekly";
				if (value === "jour") return "daily";
				return value;
			};

			// Paiement Stripe pour annonce sponsorisée
			let sponsoredCustomerId = null;
			if (
				isSponsored &&
				sponsorshipDuration &&
				SPONSORSHIP_PRICES[sponsorshipDuration]
			) {
				const { amountInCents } =
					SPONSORSHIP_PRICES[sponsorshipDuration];
				const paymentResult = await initiateAndPresentPayment(
					userCompany.id,
					amountInCents,
					"sponsored_job",
				);
				if (!paymentResult.success) {
					setLoading(false);
					return;
				}
				sponsoredCustomerId = paymentResult.customerId;
			}

			// Paiement Stripe one-shot pour annonce Last Minute sans crédits
			let lastMinuteOneshotCustomerId = null;
			if (
				formData.isLastMinute &&
				(userCompany?.last_minute_credits ?? 0) === 0
			) {
				const paymentResult = await initiateAndPresentPayment(
					userCompany.id,
					600,
					"last_minute_oneshot",
				);
				if (!paymentResult.success) {
					setLoading(false);
					return;
				}
				lastMinuteOneshotCustomerId = paymentResult.customerId;
			}

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
				contract_type: mapContractType(formData.contract_type),
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
				certifications_required: cleanArrayField(
					formData.certifications_required,
				),
				driving_licenses: cleanArrayField(formData.driving_licenses),
				languages: cleanArrayField(formData.languages),
				reimbursements: cleanArrayField(formData.reimbursements),
				packed_lunch: formData.packed_lunch,
				accommodations: formData.accommodations,
				isLastMinute: formData.isLastMinute,
				date_mode: formData.date_mode || "dates",
				vacations: cleanArrayField(
					isVacationsMode
						? formData.vacations.map((v) => ({
								date: v.date
									? new Date(v.date)
											.toISOString()
											.split("T")[0]
									: null,
								start_time: v.start_time,
								end_time: v.end_time,
							}))
						: [],
				),
				company_id: user.id,
				is_archived: false,
				start_date_asap: formData.start_date_asap,
				status: "published",
				sponsorship_date: (() => {
					if (!isSponsored || !sponsorshipDuration) return null;
					const d = new Date();
					if (sponsorshipDuration === "1w")
						d.setDate(d.getDate() + 7);
					else if (sponsorshipDuration === "2w")
						d.setDate(d.getDate() + 14);
					else if (sponsorshipDuration === "1m")
						d.setMonth(d.getMonth() + 1);
					return d.toISOString().split("T")[0];
				})(),
			});

			// Transaction pour annonce sponsorisée
			if (isSponsored && sponsorshipDuration && sponsoredCustomerId) {
				const { amountDecimal, label } =
					SPONSORSHIP_PRICES[sponsorshipDuration];
				await create("transactions", {
					company_id: userCompany.id,
					amount: amountDecimal,
					currency: "EUR",
					transaction_type: "payment",
					credits_added: 0,
					credits_deducted: 0,
					description: `Sponsoring de l'annonce "${formData.title}" (${label})`,
					event_type: "sponsored_job_payment",
					stripe_customer_id: sponsoredCustomerId,
				});
			}

			toast.show({
				placement: "top",
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={CheckCircle}
						color={
							isDark ? Colors.dark.success : Colors.light.success
						}
						title='Annonce publiée avec succès'
					/>
				),
			});

			// Incrémenter le compteur d'annonces (plans standard et standard_plus)
			const _status = userCompany?.subscription_status;
			if (_status === "standard" || _status === "standard_plus") {
				setJobCount((prev) => (prev ?? 0) + 1);
			}

			// Décrémenter les crédits Last Minute si utilisés
			if (
				formData.isLastMinute &&
				(userCompany?.last_minute_credits ?? 0) > 0
			) {
				const newCredits = userCompany.last_minute_credits - 1;
				await update("companies", userCompany.id, {
					last_minute_credits: newCredits,
				});
				// Enregistrer la transaction de déduction
				await create("transactions", {
					company_id: userCompany.id,
					amount: 0,
					currency: "TOKEN",
					transaction_type: "credit_usage",
					credits_added: 0,
					credits_deducted: 1,
					description: `Déduction d'1 crédit Last Minute pour l'annonce "${formData.title}"`,
					event_type: "last_minute_credit_used",
				});
				// Mise à jour locale immédiate
				userCompany.last_minute_credits = newCredits;
			} else if (formData.isLastMinute && lastMinuteOneshotCustomerId) {
				// Enregistrer la transaction de paiement one-shot Last Minute
				await create("transactions", {
					company_id: userCompany.id,
					amount: 6.0,
					currency: "EUR",
					transaction_type: "payment",
					credits_added: 0,
					credits_deducted: 0,
					description: `Paiement one-shot pour l'annonce Last Minute "${formData.title}"`,
					event_type: "last_minute_oneshot_payment",
					stripe_customer_id: lastMinuteOneshotCustomerId,
				});
			}

			// Email de confirmation de publication
			try {
				const supabase = createSupabaseClient(accessToken);
				await supabase.functions.invoke("send-job-confirmation-email", {
					body: {
						firstName:
							userCompany?.legal_representative_firstname || "",
						email: user.email,
						companyName: userCompany?.name || "",
						job: {
							title: formData.title,
							category: getCategoryLabel(formData.category),
							city: formData.city,
							contractType: mapContractType(
								formData.contract_type,
							),
							workTime: mapWorkTime(formData.work_time),
							startDate: startDateISO,
							endDate: endDateISO,
							salary: salaryString || null,
							isLastMinute: formData.isLastMinute,
						},
						lastMinuteMode: formData.isLastMinute
							? lastMinuteOneshotCustomerId
								? "oneshot"
								: "credit"
							: undefined,
						isSponsored,
						sponsorshipDuration: isSponsored
							? sponsorshipDuration
							: undefined,
						sponsorshipDate:
							isSponsored && sponsorshipDuration
								? (() => {
										const d = new Date();
										if (sponsorshipDuration === "1w")
											d.setDate(d.getDate() + 7);
										else if (sponsorshipDuration === "2w")
											d.setDate(d.getDate() + 14);
										else if (sponsorshipDuration === "1m")
											d.setMonth(d.getMonth() + 1);
										return d.toISOString().split("T")[0];
									})()
								: undefined,
					},
				});
			} catch (e) {
				console.error("Erreur email confirmation annonce:", e);
			}

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
				work_schedule: "",
				start_date: null,
				start_date_asap: false,
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
				certifications_required: [],
				driving_licenses: [],
				cnaps_required: [],
				languages: [],
				reimbursements: [],
				packed_lunch: false,
				accommodations: false,
				isLastMinute: false,
				date_mode: "dates",
				vacations: [],
			});

			// Réinitialiser les inputs temporaires
			setPostcodeInput("");
			setCurrentMission("");
			setCurrentProfile("");
			setCurrentDiploma("");
			setCurrentDrivingLicense("");
			setCurrentLanguage("");
			setCurrentReimbursement("");
			setCurrentVacation({ date: null, start_time: "", end_time: "" });

			// Retourner au step 1
			setCurrentStep(1);
			scrollX.setValue(0);

			// Rediriger vers la liste des offres
			router.back();
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

	// Comptage des annonces (plans standard et standard_plus)
	useEffect(() => {
		const status = userCompany?.subscription_status;
		if (
			(status !== "standard" && status !== "standard_plus") ||
			!user ||
			!userCompany
		)
			return;
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);
		startDate.setHours(0, 0, 0, 0);
		getAll(
			"jobs",
			"id",
			`&company_id=eq.${userCompany.id}&created_at=gte.${startDate.toISOString()}`,
			1,
			10,
			"created_at.desc",
		).then(({ totalCount }) => setJobCount(totalCount ?? 0));
	}, [userCompany?.subscription_status]);

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
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<TouchableOpacity
							onPress={() => router.push("/buycredits")}
							activeOpacity={0.7}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 4,
								backgroundColor: isDark
									? Colors.dark.background
									: "#fef9c3",
								borderRadius: 20,
								paddingHorizontal: 10,
								paddingVertical: 5,
								marginRight: 4,
							}}>
							<Icon
								as={Zap}
								size='sm'
								style={{ color: Colors.light.warning }}
							/>
							<Text
								size='sm'
								style={{
									fontWeight: "700",
									color: Colors.light.warning,
								}}>
								{userCompany?.last_minute_credits ?? 0}
							</Text>
						</TouchableOpacity>
					),
				}}
			/>
			<Box
				style={{
					flex: 1,
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.background,
				}}>
				{/* Progress Bar */}
				<Box
					style={{
						paddingTop: 15,
						paddingHorizontal: 20,
						paddingBottom: 15,
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderBottomWidth: 1,
						borderBottomColor: isDark
							? Colors.dark.border
							: Colors.light.border,
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								{STEPS[currentStep - 1].title}
							</Text>
							<Text
								size='xs'
								style={{
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
								}}>
								Étape {currentStep}/{STEPS.length}
							</Text>
						</HStack>
						{/* Barre de progression animée */}
						<Box
							style={{
								width: "100%",
								height: 8,
								backgroundColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
									backgroundColor: Colors.light.tint,
									borderRadius: 4,
								}}
							/>
						</Box>
						{/* Crédits d'annonces restants — plan standard uniquement */}
						{userCompany?.subscription_status === "standard" &&
							jobCount !== null &&
							(() => {
								const remaining = Math.max(0, 3 - jobCount);
								return (
									<HStack
										space='xs'
										style={{
											alignItems: "center",
											marginTop: 4,
											// backgroundColor: "pink",
										}}>
										<Icon
											as={FileText}
											size='xs'
											style={{
												color:
													remaining === 0
														? Colors.dark.danger
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
											}}
										/>
										<Text
											size='xs'
											style={{
												color:
													remaining === 0
														? Colors.dark.danger
														: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
											}}>
											{remaining === 0
												? "Aucune annonce gratuite restante"
												: `${remaining} annonce${remaining > 1 ? "s" : ""} gratuite${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} (30j)`}
										</Text>
									</HStack>
								);
							})()}
					</VStack>
				</Box>

				{/* Steps Container - Conditional Rendering pour fix scroll Android */}
				{/* Overlay quota épuisé — plans standard et standard_plus */}
				{(userCompany?.subscription_status === "standard" ||
					userCompany?.subscription_status === "standard_plus") &&
					jobCount !== null &&
					jobCount >=
						(userCompany?.subscription_status === "standard_plus"
							? 10
							: 3) && (
						<Box
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								zIndex: 10,
								justifyContent: "center",
								alignItems: "center",
								paddingHorizontal: 24,
								backgroundColor: isDark
									? "rgba(17,24,39,0.6)"
									: "rgba(249,250,251,0.6)",
							}}>
							<Card
								style={{
									padding: 24,
									borderRadius: 16,
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.cardBackground,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
									width: "100%",
									alignItems: "center",
									gap: 12,
								}}>
								<Icon
									as={FileText}
									size='xl'
									style={{ color: Colors.dark.danger }}
								/>
								<Heading
									size='md'
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
										textAlign: "center",
									}}>
									Quota atteint
								</Heading>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										textAlign: "center",
									}}>
									Vous avez utilisé vos{" "}
									{userCompany?.subscription_status ===
									"standard_plus"
										? 10
										: 3}{" "}
									annonces sur les 30 derniers jours.{" "}
									{userCompany?.subscription_status ===
									"standard_plus" ? (
										<>
											Passez à{" "}
											<Text
												size='sm'
												style={{
													fontWeight: "700",
													color: "#8b5cf6",
												}}>
												Premium
											</Text>{" "}
											pour publier sans limite.
										</>
									) : (
										<>
											Passez à{" "}
											<Text
												size='sm'
												style={{
													fontWeight: "700",
													color: "#7c3aed",
												}}>
												Standard+
											</Text>{" "}
											(10/mois) ou{" "}
											<Text
												size='sm'
												style={{
													fontWeight: "700",
													color: "#8b5cf6",
												}}>
												Premium
											</Text>{" "}
											pour plus d'annonces.
										</>
									)}
								</Text>
								<Button
									style={{
										backgroundColor: Colors.light.tint,
										borderRadius: 12,
										marginTop: 4,
										width: "100%",
									}}
									onPress={() =>
										router.push("/subscription")
									}>
									<ButtonText
										style={{
											color: Colors.light.cardBackground,
										}}>
										Voir les abonnements
									</ButtonText>
								</Button>
							</Card>
						</Box>
					)}
				<Box
					style={{
						flex: 1,
						opacity: (() => {
							const _s = userCompany?.subscription_status;
							const _max = _s === "standard_plus" ? 10 : 3;
							return (_s === "standard" ||
								_s === "standard_plus") &&
								jobCount !== null &&
								jobCount >= _max
								? 0.3
								: 1;
						})(),
					}}
					pointerEvents={(() => {
						const _s = userCompany?.subscription_status;
						const _max = _s === "standard_plus" ? 10 : 3;
						return (_s === "standard" || _s === "standard_plus") &&
							jobCount !== null &&
							jobCount >= _max
							? "none"
							: "auto";
					})()}>
					{/* Étape 1: Informations principales */}
					{currentStep === 1 && (
						<Box
							style={{
								width: SCREEN_WIDTH,
								flex: 1,
								paddingBottom: 30,
							}}>
							<KeyboardAvoidingView
								behavior={
									Platform.OS === "ios" ? "padding" : "height"
								}
								style={{ flex: 1 }}
								keyboardVerticalOffset={100}>
								<ScrollView
									ref={(ref) =>
										(scrollViewRefs.current[0] = ref)
									}
									keyboardShouldPersistTaps='handled'>
									<VStack
										space='lg'
										style={{
											padding: 20,
											paddingBottom: 100,
										}}>
										<Card
											style={{
												padding: 20,
												paddingBottom: 40,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
													<Zap color='orange' />
													<VStack style={{ flex: 1 }}>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Offre dernière
															minute
														</Text>
														<Text
															size='xs'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															Visible avec un
															badge urgence
														</Text>
													</VStack>
													<Switch
														value={
															formData.isLastMinute
														}
														onValueChange={(
															value,
														) =>
															updateField(
																"isLastMinute",
																value,
															)
														}
														trackColor={{
															false: isDark
																? Colors.dark
																		.border
																: Colors.light
																		.border,
															true: Colors.light
																.tint,
														}}
													/>
												</HStack>

												{/* Avertissement crédits LM */}
												{formData.isLastMinute && (
													<Card
														style={{
															padding: 12,
															borderRadius: 10,
															borderWidth: 1,
															borderColor:
																(userCompany?.last_minute_credits ??
																	0) > 0
																	? Colors
																			.light
																			.warning
																	: Colors
																			.dark
																			.danger,
															backgroundColor:
																(userCompany?.last_minute_credits ??
																	0) > 0
																	? isDark
																		? "#451a03"
																		: "#fffbeb"
																	: isDark
																		? "#450a0a"
																		: "#fef2f2",
														}}>
														{(userCompany?.last_minute_credits ??
															0) > 0 ? (
															<HStack
																space='sm'
																style={{
																	alignItems:
																		"flex-start",
																}}>
																<Icon
																	as={Zap}
																	size='xs'
																	style={{
																		color: Colors
																			.light
																			.warning,
																		marginTop: 2,
																	}}
																/>
																<Text
																	size='xs'
																	style={{
																		color: isDark
																			? "#fcd34d"
																			: "#92400e",
																		flex: 1,
																	}}>
																	1 crédit
																	Last Minute
																	sera débité
																	(
																	{
																		userCompany.last_minute_credits
																	}{" "}
																	disponible
																	{userCompany.last_minute_credits >
																	1
																		? "s"
																		: ""}
																	).
																</Text>
															</HStack>
														) : (
															<VStack space='xs'>
																<HStack
																	space='sm'
																	style={{
																		alignItems:
																			"flex-start",
																	}}>
																	<Icon
																		as={Zap}
																		size='xs'
																		style={{
																			color: Colors
																				.dark
																				.danger,
																			marginTop: 2,
																		}}
																	/>
																	<Text
																		size='xs'
																		style={{
																			color: isDark
																				? Colors
																						.dark
																						.danger
																				: Colors
																						.light
																						.danger,
																			flex: 1,
																		}}>
																		Aucun
																		crédit
																		disponible.
																		Cette
																		annonce
																		sera
																		facturée{" "}
																		<Text
																			size='xs'
																			style={{
																				fontWeight:
																					"700",
																				color: isDark
																					? Colors
																							.dark
																							.danger
																					: Colors
																							.light
																							.danger,
																			}}>
																			5 €
																		</Text>{" "}
																		avant
																		publication.
																	</Text>
																</HStack>
																<TouchableOpacity
																	onPress={() =>
																		router.push(
																			"/buycredits",
																		)
																	}
																	style={{
																		alignSelf:
																			"flex-start",
																		marginTop: 4,
																	}}>
																	<Text
																		size='xs'
																		style={{
																			color: Colors
																				.light
																				.tint,
																			fontWeight:
																				"600",
																			textDecorationLine:
																				"underline",
																		}}>
																		Acheter
																		des
																		crédits
																		— 10
																		crédits
																		pour 30
																		€ (3
																		€/crédit)
																	</Text>
																</TouchableOpacity>
															</VStack>
														)}
													</Card>
												)}

												{/* Titre */}
												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
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
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Catégorie *
													</Text>
													<TouchableOpacity
														activeOpacity={0.7}
														onPress={() =>
															setShowCategorySheet(
																true,
															)
														}>
														<Box
															style={{
																flexDirection:
																	"row",
																alignItems:
																	"center",
																justifyContent:
																	"space-between",
																padding: 12,
																borderRadius: 8,
																borderWidth: 1,
																borderColor:
																	formData.category
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
																	isDark
																		? Colors
																				.dark
																				.cardBackground
																		: Colors
																				.light
																				.cardBackground,
															}}>
															<Text
																style={{
																	flex: 1,
																	color: formData.category
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																	fontWeight:
																		formData.category
																			? "600"
																			: "400",
																}}>
																{formData.category
																	? getCategoryLabel(
																			formData.category,
																		)
																	: "Sélectionnez une catégorie"}
															</Text>
															<Icon
																as={ChevronDown}
																size='sm'
																style={{
																	color: formData.category
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																}}
															/>
														</Box>
													</TouchableOpacity>
												</VStack>

												{/* Description */}
												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Description du poste *
													</Text>
													<VStack
														ref={
															descriptionInputRef
														}>
														<Textarea
															size='md'
															style={{
																backgroundColor:
																	isDark
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Missions principales
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
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
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}
															/>
														</Input>
													</VStack>
													<Button
														size='md'
														onPress={addMission}
														style={{
															backgroundColor:
																Colors.light
																	.tint,
														}}>
														<ButtonIcon
															as={Plus}
															style={{
																color: Colors
																	.light
																	.cardBackground,
															}}
														/>
													</Button>
												</HStack>
												{formData.missions.length >
													0 && (
													<VStack
														space='xs'
														style={{
															marginTop: 8,
														}}>
														{formData.missions.map(
															(
																mission,
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
																				? Colors
																						.dark
																						.background
																				: Colors
																						.light
																						.background,
																		borderRadius: 8,
																	}}>
																	<Box
																		style={{
																			width: 6,
																			height: 6,
																			borderRadius: 3,
																			backgroundColor:
																				Colors
																					.light
																					.tint,
																		}}
																	/>
																	<Text
																		size='sm'
																		style={{
																			flex: 1,
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}>
																		{
																			mission
																		}
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
										</Card>

										{/* Profil recherché */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Profil recherché
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
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
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}
															/>
														</Input>
													</VStack>
													<Button
														size='md'
														onPress={addProfile}
														style={{
															backgroundColor:
																Colors.light
																	.tint,
														}}>
														<ButtonIcon
															as={Plus}
															style={{
																color: Colors
																	.light
																	.cardBackground,
															}}
														/>
													</Button>
												</HStack>
												{formData.searched_profile
													.length > 0 && (
													<VStack
														space='xs'
														style={{
															marginTop: 8,
														}}>
														{formData.searched_profile.map(
															(
																profile,
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
																				? Colors
																						.dark
																						.background
																				: Colors
																						.light
																						.background,
																		borderRadius: 8,
																	}}>
																	<Box
																		style={{
																			width: 6,
																			height: 6,
																			borderRadius: 3,
																			backgroundColor:
																				Colors
																					.light
																					.success,
																		}}
																	/>
																	<Text
																		size='sm'
																		style={{
																			flex: 1,
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}>
																		{
																			profile
																		}
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
										</Card>

										{/* Diplômes requis */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Diplômes requis
													</Text>
												</HStack>
												<TouchableOpacity
													activeOpacity={0.7}
													onPress={() =>
														setShowDiplomaSheet(
															true,
														)
													}>
													<Box
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															padding: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																formData
																	.diplomas_required
																	.length > 0
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
																isDark
																	? Colors
																			.dark
																			.cardBackground
																	: Colors
																			.light
																			.cardBackground,
														}}>
														<Text
															style={{
																flex: 1,
																color:
																	formData
																		.diplomas_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																fontWeight:
																	formData
																		.diplomas_required
																		.length >
																	0
																		? "600"
																		: "400",
															}}>
															{formData
																.diplomas_required
																.length > 0
																? `${formData.diplomas_required.length} diplôme${formData.diplomas_required.length > 1 ? "s" : ""} sélectionné${formData.diplomas_required.length > 1 ? "s" : ""}`
																: "Sélectionnez les diplômes requises"}
														</Text>
														<Icon
															as={ChevronDown}
															size='sm'
															style={{
																color:
																	formData
																		.diplomas_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
															}}
														/>
													</Box>
												</TouchableOpacity>
												{formData.diplomas_required
													.length > 0 && (
													<HStack
														space='xs'
														style={{
															flexWrap: "wrap",
															marginTop: 6,
														}}>
														{formData.diplomas_required.map(
															(acronym) => (
																<Box
																	key={
																		acronym
																	}
																	style={{
																		paddingHorizontal: 8,
																		paddingVertical: 3,
																		borderRadius: 6,
																		backgroundColor:
																			Colors
																				.light
																				.tint,
																		marginBottom: 4,
																	}}>
																	<Text
																		style={{
																			fontSize: 11,
																			fontWeight:
																				"800",
																			color: Colors
																				.light
																				.cardBackground,
																		}}>
																		{
																			acronym
																		}
																	</Text>
																</Box>
															),
														)}
													</HStack>
												)}
											</VStack>
										</Card>

										{/* Certifications requises */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
											}}>
											<VStack space='md'>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Icon
														as={Award}
														size='lg'
														style={{
															color: isDark
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Certifications requises
													</Text>
												</HStack>
												<TouchableOpacity
													activeOpacity={0.7}
													onPress={() =>
														setShowCertificationSheet(
															true,
														)
													}>
													<Box
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															padding: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																formData
																	.certifications_required
																	.length > 0
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
																isDark
																	? Colors
																			.dark
																			.cardBackground
																	: Colors
																			.light
																			.cardBackground,
														}}>
														<Text
															style={{
																flex: 1,
																color:
																	formData
																		.certifications_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																fontWeight:
																	formData
																		.certifications_required
																		.length >
																	0
																		? "600"
																		: "400",
															}}>
															{formData
																.certifications_required
																.length > 0
																? `${formData.certifications_required.length} certification${formData.certifications_required.length > 1 ? "s" : ""} sélectionné${formData.certifications_required.length > 1 ? "s" : ""}`
																: "Sélectionnez les certifications requis"}
														</Text>
														<Icon
															as={ChevronDown}
															size='sm'
															style={{
																color:
																	formData
																		.certifications_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
															}}
														/>
													</Box>
												</TouchableOpacity>
												{formData
													.certifications_required
													.length > 0 && (
													<HStack
														space='xs'
														style={{
															flexWrap: "wrap",
															marginTop: 6,
														}}>
														{formData.certifications_required.map(
															(acronym) => (
																<Box
																	key={
																		acronym
																	}
																	style={{
																		paddingHorizontal: 8,
																		paddingVertical: 3,
																		borderRadius: 6,
																		backgroundColor:
																			Colors
																				.light
																				.tint,
																		marginBottom: 4,
																	}}>
																	<Text
																		style={{
																			fontSize: 11,
																			fontWeight:
																				"800",
																			color: Colors
																				.light
																				.cardBackground,
																		}}>
																		{
																			acronym
																		}
																	</Text>
																</Box>
															),
														)}
													</HStack>
												)}
											</VStack>
										</Card>
										{/* Cartes CNAPS requises */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
											}}>
											<VStack space='md'>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Icon
														as={IdCard}
														size='lg'
														style={{
															color: isDark
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Cartes CNAPS requises
													</Text>
												</HStack>
												<TouchableOpacity
													activeOpacity={0.7}
													onPress={() =>
														setShowCnapsSheet(true)
													}>
													<Box
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															padding: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																formData
																	.cnaps_required
																	.length > 0
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
																isDark
																	? Colors
																			.dark
																			.cardBackground
																	: Colors
																			.light
																			.cardBackground,
														}}>
														<Text
															style={{
																flex: 1,
																color:
																	formData
																		.cnaps_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																fontWeight:
																	formData
																		.cnaps_required
																		.length >
																	0
																		? "600"
																		: "400",
															}}>
															{formData
																.cnaps_required
																.length > 0
																? `${formData.cnaps_required.length} carte${formData.cnaps_required.length > 1 ? "s" : ""} sélectionnée${formData.cnaps_required.length > 1 ? "s" : ""}`
																: "Sélectionnez les cartes CNAPS requises"}
														</Text>
														<Icon
															as={ChevronDown}
															size='sm'
															style={{
																color:
																	formData
																		.cnaps_required
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
															}}
														/>
													</Box>
												</TouchableOpacity>
												{formData.cnaps_required
													.length > 0 && (
													<HStack
														space='xs'
														style={{
															flexWrap: "wrap",
															marginTop: 6,
														}}>
														{formData.cnaps_required.map(
															(acronym) => (
																<Box
																	key={
																		acronym
																	}
																	style={{
																		paddingHorizontal: 8,
																		paddingVertical: 3,
																		borderRadius: 6,
																		backgroundColor:
																			Colors
																				.light
																				.tint,
																		marginBottom: 4,
																	}}>
																	<Text
																		style={{
																			fontSize: 11,
																			fontWeight:
																				"800",
																			color: Colors
																				.light
																				.cardBackground,
																		}}>
																		{
																			acronym
																		}
																	</Text>
																</Box>
															),
														)}
													</HStack>
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
									ref={(ref) =>
										(scrollViewRefs.current[1] = ref)
									}
									keyboardShouldPersistTaps='handled'>
									<VStack
										space='lg'
										style={{
											padding: 20,
											paddingBottom: 100,
										}}>
										{/* Localisation */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Localisation
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
													}}
												/>

												{/* Code postal */}
												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Code postal *
													</Text>
													<HStack
														space='sm'
														ref={postcodeInputRef}>
														<Input
															variant='outline'
															size='md'
															style={{
																flex: 1,
																backgroundColor:
																	isDark
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
															}}>
															<InputField
																placeholder='Entrez le code postal'
																value={
																	postcodeInput
																}
																keyboardType='numeric'
																maxLength={5}
																onChangeText={(
																	text,
																) => {
																	const digits =
																		text
																			.replace(
																				/\D/g,
																				"",
																			)
																			.slice(
																				0,
																				5,
																			);
																	setPostcodeInput(
																		digits,
																	);
																	if (
																		formData.city
																	) {
																		setFormData(
																			(
																				prev,
																			) => ({
																				...prev,
																				city: "",
																				postcode:
																					"",
																				department:
																					"",
																				region: "",
																				department_code:
																					"",
																				region_code:
																					"",
																				latitude:
																					null,
																				longitude:
																					null,
																			}),
																		);
																	}
																	setCities(
																		[],
																	);
																}}
																onFocus={() =>
																	scrollToInput(
																		postcodeInputRef,
																		1,
																	)
																}
																style={{
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}
															/>
														</Input>
														<TouchableOpacity
															onPress={
																searchCities
															}
															disabled={
																postcodeInput.length !==
																	5 ||
																cityLoading
															}
															activeOpacity={0.7}
															style={{
																backgroundColor:
																	postcodeInput.length ===
																	5
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
																borderRadius: 8,
																paddingHorizontal: 16,
																paddingVertical: 5,
																minWidth: 100,
																justifyContent:
																	"center",
																alignItems:
																	"center",
															}}>
															{cityLoading ? (
																<ActivityIndicator
																	size='small'
																	color={
																		Colors
																			.light
																			.cardBackground
																	}
																/>
															) : (
																<Text
																	style={{
																		color:
																			postcodeInput.length ===
																			5
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
																		fontWeight:
																			"600",
																	}}>
																	Rechercher
																</Text>
															)}
														</TouchableOpacity>
													</HStack>
												</VStack>

												{/* Liste des villes */}
												{cities.length > 0 && (
													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Sélectionnez la
															ville
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
																					isDark
																						? Colors
																								.dark
																								.cardBackground
																						: Colors
																								.light
																								.background,
																				borderRadius: 8,
																				borderWidth: 1,
																				borderColor:
																					formData.city ===
																					cityData.nom
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
																					color: isDark
																						? Colors
																								.dark
																								.text
																						: Colors
																								.light
																								.text,
																				}}>
																				{
																					cityData.nom
																				}{" "}
																				(
																				{
																					cityData.department_code
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
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
															}}
														/>

														<VStack space='xs'>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}>
																Ville
																sélectionnée
															</Text>
															<Box
																style={{
																	padding: 12,
																	backgroundColor:
																		isDark
																			? Colors
																					.dark
																					.cardBackground
																			: Colors
																					.light
																					.cardBackground,
																	borderRadius: 8,
																	borderWidth: 1,
																	borderColor:
																		Colors
																			.light
																			.tint,
																}}>
																<Text
																	style={{
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																		fontWeight:
																			"600",
																	}}>
																	{
																		formData.city
																	}
																</Text>
																{/* <Text
														size='sm'
														style={{
															color: isDark ? Colors.dark.muted : Colors.light.muted,
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
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
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
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
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
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
											}}>
											<HStack
												space='md'
												style={{
													justifyContent:
														"space-between",
													alignItems: "center",
												}}>
												<Zap color='orange' />
												<VStack style={{ flex: 1 }}>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Offre dernière minute
													</Text>
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
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
															? Colors.dark.border
															: Colors.light
																	.border,
														true: Colors.light.tint,
													}}
												/>
											</HStack>

											{/* Avertissement crédits LM */}
											{formData.isLastMinute && (
												<Card
													style={{
														marginTop: 10,
														padding: 12,
														borderRadius: 10,
														borderWidth: 1,
														borderColor:
															(userCompany?.last_minute_credits ??
																0) > 0
																? Colors.light
																		.warning
																: Colors.dark
																		.danger,
														backgroundColor:
															(userCompany?.last_minute_credits ??
																0) > 0
																? isDark
																	? "#451a03"
																	: "#fffbeb"
																: isDark
																	? "#450a0a"
																	: "#fef2f2",
													}}>
													{(userCompany?.last_minute_credits ??
														0) > 0 ? (
														<HStack
															space='sm'
															style={{
																alignItems:
																	"flex-start",
															}}>
															<Icon
																as={Zap}
																size='xs'
																style={{
																	color: Colors
																		.light
																		.warning,
																	marginTop: 2,
																}}
															/>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? "#fcd34d"
																		: "#92400e",
																	flex: 1,
																}}>
																1 crédit Last
																Minute sera
																débité (
																{
																	userCompany.last_minute_credits
																}{" "}
																disponible
																{userCompany.last_minute_credits >
																1
																	? "s"
																	: ""}
																).
															</Text>
														</HStack>
													) : (
														<VStack space='xs'>
															<HStack
																space='sm'
																style={{
																	alignItems:
																		"flex-start",
																}}>
																<Icon
																	as={Zap}
																	size='xs'
																	style={{
																		color: Colors
																			.dark
																			.danger,
																		marginTop: 2,
																	}}
																/>
																<Text
																	size='xs'
																	style={{
																		color: isDark
																			? Colors
																					.dark
																					.danger
																			: Colors
																					.light
																					.danger,
																		flex: 1,
																	}}>
																	Aucun crédit
																	disponible.
																	Cette
																	annonce sera
																	facturée{" "}
																	<Text
																		size='xs'
																		style={{
																			fontWeight:
																				"700",
																			color: isDark
																				? Colors
																						.dark
																						.danger
																				: Colors
																						.light
																						.danger,
																		}}>
																		5 €
																	</Text>{" "}
																	avant
																	publication.
																</Text>
															</HStack>
															<TouchableOpacity
																onPress={() =>
																	router.push(
																		"/buycredits",
																	)
																}
																style={{
																	alignSelf:
																		"flex-start",
																	marginTop: 4,
																}}>
																<Text
																	size='xs'
																	style={{
																		color: Colors
																			.light
																			.tint,
																		fontWeight:
																			"600",
																		textDecorationLine:
																			"underline",
																	}}>
																	Acheter des
																	crédits — 10
																	crédits pour
																	30 € (3
																	€/crédit)
																</Text>
															</TouchableOpacity>
														</VStack>
													)}
												</Card>
											)}
										</Card>

										{/* Type de contrat */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
											}}>
											<VStack space='md'>
												<Text
													size='sm'
													style={{
														fontWeight: "600",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													Type de contrat *
												</Text>
												<HStack
													space='sm'
													style={{
														flexWrap: "wrap",
													}}>
													{CONTRACT_TYPES.map(
														(type) => (
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
																	minWidth:
																		"45%",
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
																			formData.contract_type ===
																			type
																				? isDark
																					? Colors
																							.dark
																							.cardBackground
																					: Colors
																							.light
																							.background
																				: isDark
																					? Colors
																							.dark
																							.cardBackground
																					: Colors
																							.light
																							.background,
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
																		}}>
																		{type}
																	</Text>
																</Box>
															</Pressable>
														),
													)}
												</HStack>
											</VStack>
										</Card>

										{/* Dates */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
											}}>
											<VStack space='md'>
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<Icon
														as={CalendarDays}
														size='lg'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Dates
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
													}}
												/>

												{/* Sélecteur de mode — uniquement pour CDD */}
												{formData.contract_type ===
													"CDD" && (
													<VStack space='xs'>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Mode de
															planification *
														</Text>
														<HStack space='sm'>
															<Pressable
																onPress={() =>
																	updateField(
																		"date_mode",
																		"dates",
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
																			formData.date_mode ===
																			"dates"
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
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.background,
																		alignItems:
																			"center",
																	}}>
																	<Text
																		style={{
																			fontWeight:
																				"600",
																			fontSize: 13,
																			textAlign:
																				"center",
																			color:
																				formData.date_mode ===
																				"dates"
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
																		}}>
																		Dates
																		début/fin
																	</Text>
																</Box>
															</Pressable>
															<Pressable
																onPress={() =>
																	updateField(
																		"date_mode",
																		"vacations",
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
																			formData.date_mode ===
																			"vacations"
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
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.background,
																		alignItems:
																			"center",
																	}}>
																	<Text
																		style={{
																			fontWeight:
																				"600",
																			fontSize: 13,
																			textAlign:
																				"center",
																			color:
																				formData.date_mode ===
																				"vacations"
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
																		}}>
																		Vacations
																	</Text>
																</Box>
															</Pressable>
														</HStack>
													</VStack>
												)}

												{/* Mode "dates" : pour CDI ou si date_mode = dates */}
												{(formData.contract_type ===
													"CDI" ||
													formData.date_mode ===
														"dates") && (
													<>
														{/* Date de début */}
														<VStack
															space='xs'
															ref={
																startDateInputRef
															}>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}>
																{formData.contract_type ===
																"CDI"
																	? "Date de début"
																	: "Date de début *"}
															</Text>
															{/* Toggle Dès que possible — CDI uniquement */}
															{formData.contract_type ===
																"CDI" && (
																<HStack
																	style={{
																		alignItems:
																			"center",
																		justifyContent:
																			"space-between",
																		paddingVertical: 10,
																		paddingHorizontal: 14,
																		borderRadius: 10,
																		borderWidth: 1,
																		borderColor:
																			formData.start_date_asap
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
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.background,
																	}}>
																	<Text
																		size='sm'
																		style={{
																			fontWeight:
																				"600",
																			color: formData.start_date_asap
																				? Colors
																						.light
																						.tint
																				: isDark
																					? Colors
																							.dark
																							.text
																					: Colors
																							.light
																							.muted,
																		}}>
																		Dès que
																		possible
																	</Text>
																	<Switch
																		value={
																			formData.start_date_asap
																		}
																		onValueChange={(
																			v,
																		) =>
																			setFormData(
																				(
																					prev,
																				) => ({
																					...prev,
																					start_date_asap:
																						v,
																					start_date:
																						v
																							? null
																							: prev.start_date,
																				}),
																			)
																		}
																		trackColor={{
																			false: isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																			true: Colors
																				.light
																				.tint,
																		}}
																	/>
																</HStack>
															)}
															{!formData.start_date_asap && (
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
																					? Colors
																							.dark
																							.background
																					: Colors
																							.light
																							.cardBackground,
																			borderColor:
																				isDark
																					? Colors
																							.dark
																							.border
																					: Colors
																							.light
																							.border,
																		}}>
																		<InputField
																			value={formatDate(
																				formData.start_date,
																			)}
																			editable={
																				false
																			}
																			style={{
																				color: formData.start_date
																					? isDark
																						? Colors
																								.dark
																								.text
																						: Colors
																								.light
																								.text
																					: Colors
																							.dark
																							.muted,
																			}}
																		/>
																	</Input>
																</TouchableOpacity>
															)}
														</VStack>

														{/* Date de fin — CDD uniquement */}
														{formData.contract_type ===
															"CDD" && (
															<VStack space='xs'>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Date de fin
																	*
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
																					? Colors
																							.dark
																							.background
																					: Colors
																							.light
																							.cardBackground,
																			borderColor:
																				isDark
																					? Colors
																							.dark
																							.border
																					: Colors
																							.light
																							.border,
																		}}>
																		<InputField
																			value={formatDate(
																				formData.end_date,
																			)}
																			editable={
																				false
																			}
																			style={{
																				color: formData.end_date
																					? isDark
																						? Colors
																								.dark
																								.text
																						: Colors
																								.light
																								.text
																					: Colors
																							.dark
																							.muted,
																			}}
																		/>
																	</Input>
																</TouchableOpacity>
															</VStack>
														)}
													</>
												)}

												{/* Mode "vacations" — uniquement pour CDD */}
												{formData.contract_type ===
													"CDD" &&
													formData.date_mode ===
														"vacations" && (
														<VStack space='md'>
															<HStack
																style={{
																	justifyContent:
																		"space-between",
																	alignItems:
																		"center",
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Vacations (
																	{
																		formData
																			.vacations
																			.length
																	}
																	/7)
																</Text>
																{formData
																	.vacations
																	.length >=
																	7 && (
																	<Text
																		size='xs'
																		style={{
																			color: Colors
																				.dark
																				.danger,
																			fontWeight:
																				"500",
																		}}>
																		Limite
																		atteinte
																	</Text>
																)}
															</HStack>

															{/* Formulaire ajout vacation */}
															{formData.vacations
																.length < 7 && (
																<VStack
																	space='sm'
																	style={{
																		padding: 12,
																		borderRadius: 10,
																		borderWidth: 1,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.background
																				: Colors
																						.light
																						.background,
																	}}>
																	<Text
																		size='sm'
																		style={{
																			fontWeight:
																				"600",
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}>
																		Nouvelle
																		vacation
																	</Text>

																	{/* Date */}
																	<VStack space='xs'>
																		<Text
																			size='xs'
																			style={{
																				fontWeight:
																					"500",
																				color: isDark
																					? Colors
																							.dark
																							.muted
																					: Colors
																							.light
																							.muted,
																			}}>
																			Date
																			*
																		</Text>
																		<TouchableOpacity
																			onPress={() => {
																				Keyboard.dismiss();
																				setShowVacationDatePicker(
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
																							? Colors
																									.dark
																									.cardBackground
																							: Colors
																									.light
																									.cardBackground,
																					borderColor:
																						isDark
																							? Colors
																									.dark
																									.border
																							: Colors
																									.light
																									.border,
																				}}>
																				<InputField
																					value={
																						currentVacation.date
																							? formatDate(
																									currentVacation.date,
																								)
																							: ""
																					}
																					placeholder='Sélectionner une date'
																					editable={
																						false
																					}
																					style={{
																						color: currentVacation.date
																							? isDark
																								? Colors
																										.dark
																										.text
																								: Colors
																										.light
																										.text
																							: Colors
																									.dark
																									.muted,
																					}}
																				/>
																			</Input>
																		</TouchableOpacity>
																	</VStack>

																	{/* Heures */}
																	<HStack space='md'>
																		<VStack
																			space='xs'
																			style={{
																				flex: 1,
																			}}>
																			<Text
																				size='xs'
																				style={{
																					fontWeight:
																						"500",
																					color: isDark
																						? Colors
																								.dark
																								.muted
																						: Colors
																								.light
																								.muted,
																				}}>
																				Heure
																				début
																				*
																			</Text>
																			<Input
																				variant='outline'
																				size='md'
																				style={{
																					backgroundColor:
																						isDark
																							? Colors
																									.dark
																									.cardBackground
																							: Colors
																									.light
																									.cardBackground,
																					borderColor:
																						isDark
																							? Colors
																									.dark
																									.border
																							: Colors
																									.light
																									.border,
																				}}>
																				<InputField
																					placeholder='HH:MM'
																					value={
																						currentVacation.start_time
																					}
																					onChangeText={(
																						v,
																					) =>
																						formatVacationTimeInput(
																							v,
																							"start_time",
																						)
																					}
																					keyboardType='numeric'
																					maxLength={
																						5
																					}
																					style={{
																						color: isDark
																							? Colors
																									.dark
																									.text
																							: Colors
																									.light
																									.text,
																					}}
																				/>
																			</Input>
																		</VStack>
																		<VStack
																			space='xs'
																			style={{
																				flex: 1,
																			}}>
																			<Text
																				size='xs'
																				style={{
																					fontWeight:
																						"500",
																					color: isDark
																						? Colors
																								.dark
																								.muted
																						: Colors
																								.light
																								.muted,
																				}}>
																				Heure
																				fin
																				*
																			</Text>
																			<Input
																				variant='outline'
																				size='md'
																				style={{
																					backgroundColor:
																						isDark
																							? Colors
																									.dark
																									.cardBackground
																							: Colors
																									.light
																									.cardBackground,
																					borderColor:
																						isDark
																							? Colors
																									.dark
																									.border
																							: Colors
																									.light
																									.border,
																				}}>
																				<InputField
																					placeholder='HH:MM'
																					value={
																						currentVacation.end_time
																					}
																					onChangeText={(
																						v,
																					) =>
																						formatVacationTimeInput(
																							v,
																							"end_time",
																						)
																					}
																					keyboardType='numeric'
																					maxLength={
																						5
																					}
																					style={{
																						color: isDark
																							? Colors
																									.dark
																									.text
																							: Colors
																									.light
																									.text,
																					}}
																				/>
																			</Input>
																		</VStack>
																	</HStack>

																	<Button
																		size='md'
																		onPress={
																			addVacation
																		}
																		style={{
																			backgroundColor:
																				Colors
																					.light
																					.tint,
																		}}>
																		<ButtonIcon
																			as={
																				Plus
																			}
																			style={{
																				color: Colors
																					.light
																					.cardBackground,
																			}}
																		/>
																		<ButtonText
																			style={{
																				color: Colors
																					.light
																					.cardBackground,
																			}}>
																			Ajouter
																		</ButtonText>
																	</Button>
																</VStack>
															)}

															{/* Liste des vacations */}
															{formData.vacations
																.length > 0 && (
																<VStack space='xs'>
																	{formData.vacations.map(
																		(
																			vacation,
																			index,
																		) => {
																			const isWarned =
																				vacationWarnings.has(
																					index,
																				);
																			return (
																				<VStack
																					key={
																						index
																					}
																					space='none'>
																					<HStack
																						space='sm'
																						style={{
																							alignItems:
																								"center",
																							padding: 12,
																							backgroundColor:
																								isWarned
																									? isDark
																										? "#431407"
																										: "#fff7ed"
																									: isDark
																										? Colors
																												.dark
																												.cardBackground
																										: Colors
																												.light
																												.cardBackground,
																							borderRadius: 8,
																							borderWidth: 1,
																							borderColor:
																								isWarned
																									? Colors
																											.light
																											.warning
																									: Colors
																											.light
																											.tint,
																						}}>
																						<VStack
																							style={{
																								flex: 1,
																							}}>
																							<Text
																								size='sm'
																								style={{
																									fontWeight:
																										"700",
																									color: isWarned
																										? Colors
																												.light
																												.warning
																										: isDark
																											? Colors
																													.dark
																													.tint
																											: Colors
																													.light
																													.tint,
																								}}>
																								{formatDate(
																									vacation.date,
																								)}
																							</Text>
																							<Text
																								size='xs'
																								style={{
																									color: isWarned
																										? "#fb923c"
																										: isDark
																											? Colors
																													.dark
																													.tint
																											: Colors
																													.light
																													.tint,
																								}}>
																								{
																									vacation.start_time
																								}{" "}
																								→{" "}
																								{
																									vacation.end_time
																								}
																							</Text>
																						</VStack>
																						<Button
																							size='xs'
																							variant='link'
																							onPress={() =>
																								removeVacation(
																									index,
																								)
																							}>
																							<ButtonIcon
																								as={
																									Trash2
																								}
																								size='sm'
																								style={{
																									color: Colors
																										.dark
																										.danger,
																								}}
																							/>
																						</Button>
																					</HStack>
																					{isWarned && (
																						<Text
																							size='xs'
																							style={{
																								color: Colors
																									.light
																									.warning,
																								fontStyle:
																									"italic",
																								paddingHorizontal: 12,
																								paddingBottom: 4,
																							}}>
																							⚠️
																							Plus
																							de
																							7
																							jours
																							—
																							incompatible
																							avec
																							«
																							Dernière
																							minute
																							»
																						</Text>
																					)}
																				</VStack>
																			);
																		},
																	)}
																</VStack>
															)}
														</VStack>
													)}
											</VStack>
										</Card>

										{/* Temps de travail — masqué en mode vacations */}
										{!(
											formData.contract_type === "CDD" &&
											formData.date_mode === "vacations"
										) && (
											<Card
												style={{
													padding: 20,
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.cardBackground,
													borderRadius: 12,
													borderWidth: 1,
													borderColor: isDark
														? Colors.dark.border
														: Colors.light.border,
												}}>
												<VStack space='md'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Temps de travail *
													</Text>
													<HStack
														space='sm'
														style={{
															flexWrap: "wrap",
														}}>
														{WORK_TIME.map(
															(time) => (
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
																		minWidth:
																			"45%",
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
																				isDark
																					? Colors
																							.dark
																							.cardBackground
																					: Colors
																							.light
																							.background,
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
																			}}>
																			{
																				time
																			}
																		</Text>
																	</Box>
																</Pressable>
															),
														)}
													</HStack>
												</VStack>
											</Card>
										)}

										{/* Horaires de travail — masqué en mode vacations */}
										{!(
											formData.contract_type === "CDD" &&
											formData.date_mode === "vacations"
										) && (
											<Card
												style={{
													padding: 20,
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.cardBackground,
													borderRadius: 12,
													borderWidth: 1,
													borderColor: isDark
														? Colors.dark.border
														: Colors.light.border,
												}}>
												<VStack space='md'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Horaires de travail
													</Text>
													<HStack
														space='sm'
														style={{
															flexWrap: "wrap",
														}}>
														{WORK_SCHEDULE.map(
															(schedule) => (
																<Pressable
																	key={
																		schedule
																	}
																	onPress={() =>
																		updateField(
																			"work_schedule",
																			formData.work_schedule ===
																				schedule
																				? ""
																				: schedule,
																		)
																	}
																	style={{
																		flex: 1,
																		minWidth:
																			"30%",
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
																				isDark
																					? Colors
																							.dark
																							.cardBackground
																					: Colors
																							.light
																							.background,
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
																			}}>
																			{
																				schedule
																			}
																		</Text>
																	</Box>
																</Pressable>
															),
														)}
													</HStack>

													{/* Horaires */}
													{(formData.work_schedule ===
														"Jour" ||
														formData.work_schedule ===
															"Nuit") && (
														<HStack space='md'>
															{/* Heure de début */}
															<VStack
																ref={
																	startTimeInputRef
																}
																space='xs'
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Heure de
																	début
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	isDisabled={
																		false
																	}
																	isInvalid={
																		false
																	}
																	isReadOnly={
																		false
																	}>
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
																		maxLength={
																			5
																		}
																	/>
																</Input>
															</VStack>

															{/* Heure de fin */}
															<VStack
																ref={
																	endTimeInputRef
																}
																space='xs'
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Heure de fin
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	isDisabled={
																		false
																	}
																	isInvalid={
																		false
																	}
																	isReadOnly={
																		false
																	}>
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
																		maxLength={
																			5
																		}
																	/>
																</Input>
															</VStack>
														</HStack>
													)}
												</VStack>
											</Card>
										)}

										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Rémunération
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
													}}
												/>

												{/* Sélection du type de salaire */}
												<VStack space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Type de rémunération *
													</Text>
													{(() => {
														const isVacMode =
															formData.contract_type ===
																"CDD" &&
															formData.date_mode ===
																"vacations";
														const salaryOptions = [
															{
																label: "Selon profil",
																value: "selon_profil",
															},
															{
																label: "Taux horaire",
																value: "hourly",
															},
															{
																label: "Salaire mensuel fixe",
																value: "monthly_fixed",
															},
															{
																label: "Salaire annuel fixe",
																value: "annual_fixed",
															},
															{
																label: "Fourchette mensuelle",
																value: "monthly_range",
															},
															{
																label: "Fourchette annuelle",
																value: "annual_range",
															},
														];
														return (
															<VStack space='xs'>
																{salaryOptions.map(
																	(opt) => {
																		const isSelected =
																			formData.salary_type ===
																			opt.value;
																		const isDisabled =
																			isVacMode &&
																			opt.value !==
																				"hourly";
																		return (
																			<Pressable
																				key={
																					opt.value
																				}
																				onPress={() =>
																					!isDisabled &&
																					setFormData(
																						(
																							prev,
																						) => ({
																							...prev,
																							salary_type:
																								opt.value,
																							salary_hourly:
																								"",
																							salary_amount:
																								"",
																							salary_min:
																								"",
																							salary_max:
																								"",
																							weekly_hours:
																								"",
																							daily_hours:
																								"",
																						}),
																					)
																				}>
																				<Box
																					style={{
																						paddingHorizontal: 14,
																						paddingVertical: 12,
																						borderRadius: 10,
																						borderWidth: 2,
																						borderColor:
																							isDisabled
																								? isDark
																									? Colors
																											.dark
																											.border
																									: Colors
																											.light
																											.border
																								: isSelected
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
																							isDisabled
																								? isDark
																									? Colors
																											.dark
																											.background
																									: Colors
																											.light
																											.background
																								: isDark
																									? Colors
																											.dark
																											.cardBackground
																									: Colors
																											.light
																											.background,
																						opacity:
																							isDisabled
																								? 0.45
																								: 1,
																						flexDirection:
																							"row",
																						alignItems:
																							"center",
																						justifyContent:
																							"space-between",
																					}}>
																					<Text
																						style={{
																							fontWeight:
																								"600",
																							fontSize: 14,
																							color: isDisabled
																								? isDark
																									? Colors
																											.dark
																											.muted
																									: Colors
																											.light
																											.muted
																								: isSelected
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
																						}}>
																						{
																							opt.label
																						}
																					</Text>
																					{isDisabled && (
																						<Text
																							size='xs'
																							style={{
																								color: isDark
																									? Colors
																											.dark
																											.muted
																									: Colors
																											.light
																											.muted,
																								fontStyle:
																									"italic",
																							}}>
																							Non
																							disponible
																							en
																							vacations
																						</Text>
																					)}
																				</Box>
																			</Pressable>
																		);
																	},
																)}
															</VStack>
														);
													})()}
												</VStack>

												{/* Taux horaire */}
												{formData.salary_type ===
													"hourly" && (
													<>
														<HStack space='md'>
															<VStack
																ref={
																	salaryInputRef
																}
																space='xs'
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Taux horaire
																	(€) *
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	style={{
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.background
																				: Colors
																						.light
																						.cardBackground,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
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
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}
																	/>
																</Input>
															</VStack>
														</HStack>

														{/* Sélecteur semaine/jour — masqué en mode vacations */}
														{!(
															formData.contract_type ===
																"CDD" &&
															formData.date_mode ===
																"vacations"
														) && (
															<VStack space='xs'>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Période de
																	travail *
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
																					isDark
																						? Colors
																								.dark
																								.cardBackground
																						: Colors
																								.light
																								.background,
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
																					isDark
																						? Colors
																								.dark
																								.cardBackground
																						: Colors
																								.light
																								.background,
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
																				}}>
																				Par
																				jour
																			</Text>
																		</Box>
																	</Pressable>
																</HStack>
															</VStack>
														)}

														{/* Input heures par semaine — masqué en mode vacations */}
														{!(
															formData.contract_type ===
																"CDD" &&
															formData.date_mode ===
																"vacations"
														) &&
															formData.work_hours_type ===
																"semaine" && (
																<VStack
																	space='xs'
																	ref={
																		hoursInputRef
																	}>
																	<Text
																		size='sm'
																		style={{
																			fontWeight:
																				"600",
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}>
																		Heures/semaine
																		*
																	</Text>
																	<Input
																		variant='outline'
																		size='md'
																		style={{
																			backgroundColor:
																				isDark
																					? Colors
																							.dark
																							.background
																					: Colors
																							.light
																							.cardBackground,
																			borderColor:
																				isDark
																					? Colors
																							.dark
																							.border
																					: Colors
																							.light
																							.border,
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
																					? Colors
																							.dark
																							.text
																					: Colors
																							.light
																							.text,
																			}}
																		/>
																	</Input>
																</VStack>
															)}

														{/* Input heures par jour — masqué en mode vacations */}
														{formData.work_hours_type ===
															"jour" &&
															!(
																formData.contract_type ===
																	"CDD" &&
																formData.date_mode ===
																	"vacations"
															) && (
																<VStack
																	space='xs'
																	ref={
																		hoursInputRef
																	}>
																	<Text
																		size='sm'
																		style={{
																			fontWeight:
																				"600",
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}>
																		{!(
																			formData.contract_type ===
																				"CDD" &&
																			formData.date_mode ===
																				"vacations"
																		)
																			? "Heures/jour *"
																			: "Heures/jour"}
																	</Text>
																	<Input
																		variant='outline'
																		size='md'
																		style={{
																			backgroundColor:
																				isDark
																					? Colors
																							.dark
																							.background
																					: Colors
																							.light
																							.cardBackground,
																			borderColor:
																				isDark
																					? Colors
																							.dark
																							.border
																					: Colors
																							.light
																							.border,
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
																					? Colors
																							.dark
																							.text
																					: Colors
																							.light
																							.text,
																			}}
																		/>
																	</Input>
																</VStack>
															)}
														{/* Calcul du salaire mensuel */}
														{false &&
															formData.salary_hourly &&
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
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.cardBackground,
																		borderRadius: 10,
																		borderWidth: 1,
																		borderColor:
																			Colors
																				.light
																				.tint,
																	}}>
																	<VStack space='xs'>
																		<Text
																			size='sm'
																			style={{
																				color: isDark
																					? Colors
																							.dark
																							.tint
																					: Colors
																							.light
																							.tint,
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
																				color: Colors
																					.light
																					.tint,
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
																					? Colors
																							.dark
																							.tint
																					: Colors
																							.light
																							.tint,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}>
																Salaire mensuel
																brut (€) *
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? Colors
																					.dark
																					.cardBackground
																			: Colors
																					.light
																					.cardBackground,
																	borderColor:
																		isDark
																			? Colors
																					.dark
																					.border
																			: Colors
																					.light
																					.border,
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}>
																Salaire annuel
																brut (€) *
															</Text>
															<Input
																variant='outline'
																size='md'
																style={{
																	backgroundColor:
																		isDark
																			? Colors
																					.dark
																					.cardBackground
																			: Colors
																					.light
																					.cardBackground,
																	borderColor:
																		isDark
																			? Colors
																					.dark
																					.border
																			: Colors
																					.light
																					.border,
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Salaire min.
																	(€) *
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	style={{
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.cardBackground,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}
																	/>
																</Input>
															</VStack>

															<VStack
																space='xs'
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Salaire max.
																	(€) *
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	style={{
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.cardBackground,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
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
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Salaire min.
																	(€) *
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	style={{
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.cardBackground,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
																		}}
																	/>
																</Input>
															</VStack>

															<VStack
																space='xs'
																style={{
																	flex: 1,
																}}>
																<Text
																	size='sm'
																	style={{
																		fontWeight:
																			"600",
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	Salaire max.
																	(€) *
																</Text>
																<Input
																	variant='outline'
																	size='md'
																	style={{
																		backgroundColor:
																			isDark
																				? Colors
																						.dark
																						.cardBackground
																				: Colors
																						.light
																						.cardBackground,
																		borderColor:
																			isDark
																				? Colors
																						.dark
																						.border
																				: Colors
																						.light
																						.border,
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
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
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
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
																		? Colors
																				.dark
																				.cardBackground
																		: Colors
																				.light
																				.cardBackground,
																borderRadius: 10,
																borderWidth: 1,
																borderColor:
																	Colors.light
																		.tint,
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
																			? Colors
																					.dark
																					.tint
																			: Colors
																					.light
																					.tint,
																		fontWeight:
																			"500",
																		textAlign:
																			"center",
																	}}>
																	💡 Le
																	salaire sera
																	déterminé
																	selon le
																	profil du
																	candidat
																</Text>
																<Text
																	size='xs'
																	style={{
																		color: isDark
																			? Colors
																					.dark
																					.tint
																			: Colors
																					.light
																					.tint,
																		textAlign:
																			"center",
																	}}>
																	Cette option
																	permet plus
																	de
																	flexibilité
																	dans les
																	négociations
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
									ref={(ref) =>
										(scrollViewRefs.current[2] = ref)
									}
									keyboardShouldPersistTaps='handled'>
									<VStack
										space='lg'
										style={{
											padding: 20,
											paddingBottom: 100,
										}}>
										{/* Permis de conduire */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Permis de conduire
													</Text>
												</HStack>
												<TouchableOpacity
													activeOpacity={0.7}
													onPress={() =>
														setShowDrivingLicenseSheet(
															true,
														)
													}>
													<Box
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															padding: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																formData
																	.driving_licenses
																	.length > 0
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
																isDark
																	? Colors
																			.dark
																			.cardBackground
																	: Colors
																			.light
																			.cardBackground,
														}}>
														<Text
															style={{
																flex: 1,
																color:
																	formData
																		.driving_licenses
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																fontWeight:
																	formData
																		.driving_licenses
																		.length >
																	0
																		? "600"
																		: "400",
															}}>
															{formData
																.driving_licenses
																.length > 0
																? `${formData.driving_licenses.length} permis sélectionné${
																		formData
																			.driving_licenses
																			.length >
																		1
																			? "s"
																			: ""
																	}`
																: "Sélectionnez les permis requis"}
														</Text>
														<Icon
															as={ChevronDown}
															size='sm'
															style={{
																color:
																	formData
																		.driving_licenses
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
															}}
														/>
													</Box>
												</TouchableOpacity>
												{formData.driving_licenses
													.length > 0 && (
													<HStack
														space='xs'
														style={{
															flexWrap: "wrap",
															marginTop: 6,
														}}>
														{formData.driving_licenses.map(
															(acronym) => (
																<Box
																	key={
																		acronym
																	}
																	style={{
																		paddingHorizontal: 8,
																		paddingVertical: 3,
																		borderRadius: 6,
																		backgroundColor:
																			Colors
																				.light
																				.tint,
																		marginBottom: 4,
																	}}>
																	<Text
																		style={{
																			fontSize: 11,
																			fontWeight:
																				"800",
																			color: Colors
																				.light
																				.cardBackground,
																		}}>
																		{
																			acronym
																		}
																	</Text>
																</Box>
															),
														)}
													</HStack>
												)}
											</VStack>
										</Card>

										{/* Langues demandées */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Langues demandées
													</Text>
												</HStack>
												<TouchableOpacity
													activeOpacity={0.7}
													onPress={() =>
														setShowLanguageSheet(
															true,
														)
													}>
													<Box
														style={{
															flexDirection:
																"row",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															padding: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																formData
																	.languages
																	.length > 0
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
																isDark
																	? Colors
																			.dark
																			.cardBackground
																	: Colors
																			.light
																			.cardBackground,
														}}>
														<Text
															style={{
																flex: 1,
																color:
																	formData
																		.languages
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
																fontWeight:
																	formData
																		.languages
																		.length >
																	0
																		? "600"
																		: "400",
															}}>
															{formData.languages
																.length > 0
																? `${formData.languages.length} langue${formData.languages.length > 1 ? "s" : ""} sélectionnée${formData.languages.length > 1 ? "s" : ""}`
																: "Sélectionnez les langues demandées"}
														</Text>
														<Icon
															as={ChevronDown}
															size='sm'
															style={{
																color:
																	formData
																		.languages
																		.length >
																	0
																		? Colors
																				.light
																				.tint
																		: isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted,
															}}
														/>
													</Box>
												</TouchableOpacity>
												{formData.languages.length >
													0 && (
													<HStack
														space='xs'
														style={{
															flexWrap: "wrap",
															marginTop: 6,
														}}>
														{formData.languages.map(
															(code) => (
																<Box
																	key={code}
																	style={{
																		paddingHorizontal: 8,
																		paddingVertical: 3,
																		borderRadius: 6,
																		backgroundColor:
																			Colors
																				.light
																				.tint,
																		marginBottom: 4,
																	}}>
																	<Text
																		style={{
																			fontSize: 11,
																			fontWeight:
																				"800",
																			color: Colors
																				.light
																				.cardBackground,
																		}}>
																		{code}
																	</Text>
																</Box>
															),
														)}
													</HStack>
												)}
											</VStack>
										</Card>

										{/* Remboursements */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Remboursements
													</Text>
												</HStack>
												<HStack space='sm'>
													<VStack
														ref={
															reimbursementInputRef
														}
														style={{ flex: 1 }}>
														<Input
															variant='outline'
															size='md'
															style={{
																backgroundColor:
																	isDark
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.cardBackground,
																borderColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}
															/>
														</Input>
													</VStack>
													<Button
														size='md'
														onPress={
															addReimbursement
														}
														style={{
															backgroundColor:
																Colors.light
																	.tint,
														}}>
														<ButtonIcon
															as={Plus}
															style={{
																color: Colors
																	.light
																	.cardBackground,
															}}
														/>
													</Button>
												</HStack>
												{/* Liste des remboursements */}
												{formData.reimbursements
													.length > 0 && (
													<VStack
														space='xs'
														style={{
															marginTop: 8,
														}}>
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
																				? Colors
																						.dark
																						.background
																				: Colors
																						.light
																						.background,
																		borderRadius: 8,
																	}}>
																	<Box
																		style={{
																			width: 6,
																			height: 6,
																			borderRadius: 3,
																			backgroundColor:
																				Colors
																					.light
																					.tint,
																		}}
																	/>
																	<Text
																		size='sm'
																		style={{
																			flex: 1,
																			color: isDark
																				? Colors
																						.dark
																						.text
																				: Colors
																						.light
																						.text,
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
										</Card>

										{/* Options */}
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}
													/>
													<Heading
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Options
													</Heading>
												</HStack>

												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
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
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Panier repas
														</Text>
														<Text
															size='xs'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															Panier repas fourni
														</Text>
													</VStack>
													<Switch
														value={
															formData.packed_lunch
														}
														onValueChange={(
															value,
														) =>
															updateField(
																"packed_lunch",
																value,
															)
														}
														trackColor={{
															false: isDark
																? Colors.dark
																		.border
																: Colors.light
																		.border,
															true: Colors.light
																.tint,
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
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
															}}>
															Hébergement
														</Text>
														<Text
															size='xs'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
															}}>
															Hébergement fourni
														</Text>
													</VStack>
													<Switch
														value={
															formData.accommodations
														}
														onValueChange={(
															value,
														) =>
															updateField(
																"accommodations",
																value,
															)
														}
														trackColor={{
															false: isDark
																? Colors.dark
																		.border
																: Colors.light
																		.border,
															true: Colors.light
																.tint,
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
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.light.tint
												: "#bfdbfe",
										}}>
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={FileText}
												size='lg'
												style={{
													color: Colors.light.tint,
												}}
											/>
											<VStack style={{ flex: 1 }}>
												<Text
													size='md'
													style={{
														fontWeight: "700",
														color: isDark
															? Colors.dark.tint
															: Colors.light.tint,
													}}>
													Vérifiez votre annonce
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.tint
															: Colors.light.tint,
													}}>
													Relisez les informations
													avant de publier
												</Text>
											</VStack>
										</HStack>
									</Card>

									{/* Infos principales */}
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}>
										<VStack space='md'>
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={Briefcase}
													size='md'
													style={{
														color: Colors.light
															.tint,
													}}
												/>
												<Text
													size='md'
													style={{
														fontWeight: "700",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													Informations principales
												</Text>
											</HStack>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark.border
														: Colors.light.border,
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Titre
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Catégorie
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
															flex: 2,
															textAlign: "right",
														}}>
														{(() => {
															const cat =
																CATEGORIES.find(
																	(c) =>
																		c.id ===
																		formData.category,
																);
															return cat
																? `${cat.acronym} - ${cat.name}`
																: formData.category ||
																		"—";
														})()}
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Type
														</Text>
														<HStack
															space='xs'
															style={{
																justifyContent:
																	"flex-end",
																alignItems:
																	"center",
															}}>
															<Zap
																color='#f59e0b'
																size={12}
															/>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: Colors
																		.light
																		.warning,
																	textAlign:
																		"right",
																}}>
																Last Minute
															</Text>
														</HStack>
													</HStack>
												)}
											</VStack>
											{formData.description ? (
												<>
													<Divider
														style={{
															backgroundColor:
																isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
														}}
													/>
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														Description
													</Text>
													<Text
														size='sm'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
														}}>
														{formData.description}
													</Text>
												</>
											) : null}
											{formData.missions.length > 0 && (
												<>
													<Divider
														style={{
															backgroundColor:
																isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
														}}
													/>
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
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
																				Colors
																					.light
																					.tint,
																			marginTop: 6,
																		}}
																	/>
																	<Text
																		size='sm'
																		style={{
																			flex: 1,
																			color: isDark
																				? Colors
																						.dark
																						.muted
																				: Colors
																						.light
																						.muted,
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
															backgroundColor:
																isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
														}}
													/>
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
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
																				Colors
																					.light
																					.success,
																			marginTop: 6,
																		}}
																	/>
																	<Text
																		size='sm'
																		style={{
																			flex: 1,
																			color: isDark
																				? Colors
																						.dark
																						.muted
																				: Colors
																						.light
																						.muted,
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
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}>
										<VStack space='md'>
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={MapPin}
													size='md'
													style={{
														color: Colors.light
															.tint,
													}}
												/>
												<Text
													size='md'
													style={{
														fontWeight: "700",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													Localisation & Contrat
												</Text>
											</HStack>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark.border
														: Colors.light.border,
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Ville
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Département
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
																flex: 2,
																textAlign:
																	"right",
															}}>
															{
																formData.department
															}
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Contrat
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Temps de travail
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
															flex: 2,
															textAlign: "right",
														}}>
														{formData.work_time ||
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Horaires
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
															flex: 2,
															textAlign: "right",
														}}>
														{formData.work_schedule ||
															"—"}
													</Text>
												</HStack>
												{!(
													formData.contract_type ===
														"CDD" &&
													formData.date_mode ===
														"vacations"
												) && (
													<HStack
														style={{
															justifyContent:
																"space-between",
														}}>
														<Text
															size='sm'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Date de début
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
																flex: 2,
																textAlign:
																	"right",
															}}>
															{formData.start_date_asap
																? "Dès que possible"
																: formatDate(
																		formData.start_date,
																	)}
														</Text>
													</HStack>
												)}
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Date de fin
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
																flex: 2,
																textAlign:
																	"right",
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Horaire
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
																flex: 2,
																textAlign:
																	"right",
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
												{/* Vacations — mode CDD vacations */}
												{formData.contract_type ===
													"CDD" &&
													formData.date_mode ===
														"vacations" &&
													formData.vacations.length >
														0 && (
														<>
															<Divider
																style={{
																	backgroundColor:
																		isDark
																			? Colors
																					.dark
																					.border
																			: Colors
																					.light
																					.border,
																}}
															/>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
																}}>
																Vacations
															</Text>
															<VStack space='xs'>
																{formData.vacations.map(
																	(v, i) => (
																		<HStack
																			key={
																				i
																			}
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
																						? Colors
																								.dark
																								.muted
																						: Colors
																								.light
																								.muted,
																					flex: 0.4,
																				}}>
																				{`${i + 1}.`}
																			</Text>
																			<Text
																				size='sm'
																				style={{
																					fontWeight:
																						"600",
																					color: isDark
																						? Colors
																								.dark
																								.text
																						: Colors
																								.light
																								.text,
																					flex: 2.6,
																					textAlign:
																						"right",
																				}}>
																				{`${formatDate(v.date)}  ${v.start_time} → ${v.end_time}`}
																			</Text>
																		</HStack>
																	),
																)}
															</VStack>
														</>
													)}
											</VStack>
										</VStack>
									</Card>

									{/* Rémunération */}
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isDark
												? Colors.dark.border
												: Colors.light.border,
										}}>
										<VStack space='md'>
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Icon
													as={BadgeEuro}
													size='md'
													style={{
														color: Colors.light
															.tint,
													}}
												/>
												<Text
													size='md'
													style={{
														fontWeight: "700",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													Rémunération
												</Text>
											</HStack>
											<Divider
												style={{
													backgroundColor: isDark
														? Colors.dark.border
														: Colors.light.border,
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															flex: 1,
														}}>
														Salaire
													</Text>
													<Text
														size='sm'
														style={{
															fontWeight: "600",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
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
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																flex: 1,
															}}>
															Heures
														</Text>
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.text,
																flex: 2,
																textAlign:
																	"right",
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
									{(formData.cnaps_required.length > 0 ||
										formData.diplomas_required.length > 0 ||
										formData.certifications_required
											.length > 0 ||
										formData.driving_licenses.length > 0 ||
										formData.languages.length > 0 ||
										formData.reimbursements.length > 0 ||
										formData.packed_lunch ||
										formData.accommodations) && (
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isDark
													? Colors.dark.border
													: Colors.light.border,
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
														style={{
															color: Colors.light
																.tint,
														}}
													/>
													<Text
														size='md'
														style={{
															fontWeight: "700",
															color: isDark
																? Colors.dark
																		.text
																: Colors.light
																		.text,
														}}>
														Compétences & Avantages
													</Text>
												</HStack>
												<Divider
													style={{
														backgroundColor: isDark
															? Colors.dark.border
															: Colors.light
																	.border,
													}}
												/>
												<VStack space='sm'>
													{formData.cnaps_required
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
																	flex: 1,
																}}>
																Cartes CNAPS
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																	flex: 2,
																	textAlign:
																		"right",
																}}>
																{formData.cnaps_required.join(
																	", ",
																)}
															</Text>
														</HStack>
													)}
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
													{formData
														.certifications_required
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
																	flex: 1,
																}}>
																Certifications
															</Text>
															<Text
																size='sm'
																style={{
																	fontWeight:
																		"600",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																	flex: 2,
																	textAlign:
																		"right",
																}}>
																{formData.certifications_required.join(
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
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
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
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
																	.filter(
																		Boolean,
																	)
																	.join(", ")}
															</Text>
														</HStack>
													)}
												</VStack>
											</VStack>
										</Card>
									)}
									{/* Sponsoring */}
									{!formData.isLastMinute && (
										<Card
											style={{
												padding: 20,
												backgroundColor: isDark
													? Colors.dark.cardBackground
													: Colors.light
															.cardBackground,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: isSponsored
													? isDark
														? "#92400e"
														: "#fde68a"
													: isDark
														? Colors.dark.border
														: Colors.light.border,
											}}>
											<VStack space='md'>
												<HStack
													style={{
														alignItems: "center",
														justifyContent:
															"space-between",
													}}>
													<HStack
														space='sm'
														style={{
															alignItems:
																"center",
															flex: 1,
														}}>
														<Box
															style={{
																width: 32,
																height: 32,
																borderRadius: 8,
																backgroundColor:
																	isDark
																		? "#451a03"
																		: "#fefce8",
																justifyContent:
																	"center",
																alignItems:
																	"center",
															}}>
															<Sparkles
																size={16}
																color={
																	isDark
																		? Colors
																				.dark
																				.warning
																		: Colors
																				.light
																				.warning
																}
															/>
														</Box>
														<VStack
															style={{ flex: 1 }}>
															<Text
																size='md'
																style={{
																	fontWeight:
																		"700",
																	color: isDark
																		? Colors
																				.dark
																				.text
																		: Colors
																				.light
																				.text,
																}}>
																Sponsoriser
																l'annonce
															</Text>
															<Text
																size='xs'
																style={{
																	color: isDark
																		? Colors
																				.dark
																				.muted
																		: Colors
																				.light
																				.muted,
																}}>
																Votre annonce
																apparaîtra en
																tête de liste
															</Text>
														</VStack>
													</HStack>
													<Switch
														value={isSponsored}
														onValueChange={(
															val,
														) => {
															setIsSponsored(val);
															if (!val) {
																setSponsorshipDuration(
																	null,
																);
															} else {
																setSponsorshipDuration(
																	"1w",
																);
																setTimeout(
																	() => {
																		scrollViewRefs.current[3]?.scrollToEnd(
																			{
																				animated: true,
																			},
																		);
																	},
																	150,
																);
															}
														}}
														trackColor={{
															false: isDark
																? Colors.dark
																		.border
																: Colors.light
																		.border,
															true: Colors.light
																.warning,
														}}
														thumbColor='#ffffff'
													/>
												</HStack>

												{isSponsored && (
													<>
														<Divider
															style={{
																backgroundColor:
																	isDark
																		? Colors
																				.dark
																				.border
																		: Colors
																				.light
																				.border,
															}}
														/>
														<Text
															size='sm'
															style={{
																color: isDark
																	? Colors
																			.dark
																			.muted
																	: Colors
																			.light
																			.muted,
																fontWeight:
																	"600",
															}}>
															Durée du sponsoring
														</Text>
														<HStack space='sm'>
															{[
																{
																	key: "1w",
																	label: "1 semaine",
																	price: "7,99 €",
																},
																{
																	key: "2w",
																	label: "2 semaines",
																	price: "13,99 €",
																},
																{
																	key: "1m",
																	label: "1 mois",
																	price: "24,99 €",
																},
															].map((opt) => {
																const active =
																	sponsorshipDuration ===
																	opt.key;
																return (
																	<TouchableOpacity
																		key={
																			opt.key
																		}
																		onPress={() =>
																			setSponsorshipDuration(
																				opt.key,
																			)
																		}
																		activeOpacity={
																			0.7
																		}
																		style={{
																			flex: 1,
																			paddingVertical: 10,
																			alignItems:
																				"center",
																			borderRadius: 10,
																			borderWidth: 1.5,
																			borderColor:
																				active
																					? Colors
																							.light
																							.warning
																					: isDark
																						? Colors
																								.dark
																								.border
																						: Colors
																								.light
																								.border,
																			backgroundColor:
																				active
																					? isDark
																						? "#451a03"
																						: "#fefce8"
																					: isDark
																						? Colors
																								.dark
																								.background
																						: Colors
																								.light
																								.background,
																		}}>
																		<Text
																			size='sm'
																			style={{
																				fontWeight:
																					active
																						? "700"
																						: "500",
																				color: active
																					? isDark
																						? Colors
																								.dark
																								.warning
																						: Colors
																								.light
																								.warning
																					: isDark
																						? Colors
																								.dark
																								.muted
																						: Colors
																								.light
																								.muted,
																			}}>
																			{
																				opt.label
																			}
																		</Text>
																		<Text
																			size='xs'
																			style={{
																				fontWeight:
																					"700",
																				color: active
																					? isDark
																						? Colors
																								.dark
																								.warning
																						: Colors
																								.light
																								.warning
																					: isDark
																						? Colors
																								.dark
																								.muted
																						: Colors
																								.light
																								.muted,
																				marginTop: 2,
																			}}>
																			{
																				opt.price
																			}
																		</Text>
																	</TouchableOpacity>
																);
															})}
														</HStack>
													</>
												)}
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
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderTopWidth: 1,
						borderTopColor: isDark
							? Colors.dark.border
							: Colors.light.border,
					}}>
					<HStack space='md'>
						{currentStep > 1 && (
							<Button
								variant='outline'
								size='lg'
								onPress={goToPreviousStep}
								style={{
									flex: 1,
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
								}}>
								<ButtonIcon
									as={ChevronLeft}
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}
								/>
								<ButtonText
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
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
										? Colors.light.success
										: Colors.light.tint,
							}}>
							{currentStep === STEPS.length ? (
								<>
									<ButtonIcon
										as={Save}
										style={{
											color: Colors.light.cardBackground,
										}}
									/>
									<ButtonText
										style={{
											color: Colors.light.cardBackground,
										}}>
										{loading ? "Publication..." : "Publier"}
									</ButtonText>
								</>
							) : (
								<>
									<ButtonText
										style={{
											color: Colors.light.cardBackground,
										}}>
										Suivant
									</ButtonText>
									<ButtonIcon
										as={ChevronRight}
										style={{
											color: Colors.light.cardBackground,
										}}
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
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.cardBackground,
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
										style={{ color: Colors.light.success }}
									/>
								</Box>
								<Heading
									size='md'
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
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
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
									textAlign: "center",
									lineHeight: 20,
								}}>
								Votre annonce
								{formData.title
									? ` "${formData.title}"`
									: ""}{" "}
								sera visible par tous les candidats.
								Confirmez-vous la publication ?
							</Text>
						</AlertDialogBody>
						<AlertDialogFooter style={{ paddingTop: 8 }}>
							<HStack space='md' style={{ width: "100%" }}>
								<Button
									variant='outline'
									size='lg'
									style={{
										flex: 1,
										borderColor: isDark
											? Colors.dark.border
											: Colors.light.border,
									}}
									onPress={() => setShowConfirmModal(false)}>
									<ButtonText
										style={{
											color: isDark
												? Colors.dark.text
												: Colors.light.muted,
										}}>
										Annuler
									</ButtonText>
								</Button>
								<Button
									size='lg'
									style={{
										flex: 1,
										backgroundColor: Colors.light.success,
									}}
									isDisabled={loading}
									onPress={() => {
										setShowConfirmModal(false);
										handleSubmit();
									}}>
									<ButtonIcon
										as={Save}
										style={{
											color: Colors.light.cardBackground,
										}}
									/>
									<ButtonText
										style={{
											color: Colors.light.cardBackground,
										}}>
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
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.cardBackground,
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
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
								textColor={
									isDark
										? Colors.dark.text
										: Colors.light.text
								}
							/>
							<Button
								size='md'
								onPress={() => setShowStartDatePicker(false)}
								style={{
									backgroundColor: Colors.light.tint,
									width: "100%",
									marginTop: 8,
								}}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
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
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.cardBackground,
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
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
								textColor={
									isDark
										? Colors.dark.text
										: Colors.light.text
								}
							/>
							<Button
								size='md'
								onPress={() => setShowEndDatePicker(false)}
								style={{
									backgroundColor: Colors.light.tint,
									width: "100%",
									marginTop: 8,
								}}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Confirmer
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Catégorie */}
				<Actionsheet
					isOpen={showCategorySheet}
					onClose={() => setShowCategorySheet(false)}>
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
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 17,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
									paddingHorizontal: 4,
									marginBottom: 8,
								}}>
								Catégorie du poste
							</Text>
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%" }}>
								<VStack
									space='lg'
									style={{ paddingBottom: 60 }}>
									{(() => {
										const CATEGORY_GROUP_LABELS = {
											surveillance_humaine:
												"Surveillance humaine",
											securite_incendie:
												"Sécurité Incendie",
											cynophile: "Cynophile",
											protection_rapprochee:
												"Protection Rapprochée",
											transport_fonds:
												"Transport de Fonds",
											videosurveillance:
												"Vidéosurveillance",
											surete_aeroportuaire:
												"Sûreté Aéroportuaire",
											encadrement: "Encadrement",
											specialisation: "Spécialisations",
										};
										const grouped = CATEGORIES.reduce(
											(acc, cat) => {
												if (!acc[cat.category])
													acc[cat.category] = [];
												acc[cat.category].push(cat);
												return acc;
											},
											{},
										);
										return Object.entries(grouped).map(
											([groupKey, items]) => (
												<VStack
													key={groupKey}
													space='sm'>
													<Text
														style={{
															fontSize: 12,
															fontWeight: "700",
															letterSpacing: 0.8,
															textTransform:
																"uppercase",
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															paddingHorizontal: 4,
														}}>
														{CATEGORY_GROUP_LABELS[
															groupKey
														] || groupKey}
													</Text>
													<VStack space='xs'>
														{items.map((cat) => {
															const isSelected =
																formData.category ===
																cat.id;
															return (
																<Pressable
																	key={cat.id}
																	onPress={() => {
																		updateField(
																			"category",
																			cat.id,
																		);
																		setShowCategorySheet(
																			false,
																		);
																	}}>
																	<Box
																		style={{
																			padding: 14,
																			borderRadius: 10,
																			borderWidth: 2,
																			borderColor:
																				isSelected
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
																				isDark
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
																						isSelected
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
																						color: isSelected
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
																						cat.acronym
																					}
																				</Text>
																			</Box>
																			<Text
																				style={{
																					flex: 1,
																					fontSize: 14,
																					color: isSelected
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
																						isSelected
																							? "600"
																							: "400",
																				}}>
																				{
																					cat.name
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
							</ScrollView>
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
							maxHeight: "80%",
							paddingBottom: 32,
						}}>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
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
								{formData.driving_licenses.length > 0 && (
									<Pressable
										onPress={() =>
											setFormData((prev) => ({
												...prev,
												driving_licenses: [],
											}))
										}>
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
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%", maxHeight: 380 }}>
								<VStack
									space='lg'
									style={{ paddingBottom: 16 }}>
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
											acc[dl.category].push({
												key,
												...dl,
											});
											return acc;
										}, {});
										return Object.entries(grouped).map(
											([groupKey, items]) => (
												<VStack
													key={groupKey}
													space='sm'>
													<Text
														style={{
															fontSize: 12,
															fontWeight: "700",
															letterSpacing: 0.8,
															textTransform:
																"uppercase",
															color: isDark
																? Colors.dark
																		.muted
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
																formData.driving_licenses.includes(
																	dl.acronym,
																);
															return (
																<Pressable
																	key={dl.key}
																	onPress={() =>
																		setFormData(
																			(
																				prev,
																			) => ({
																				...prev,
																				driving_licenses:
																					isSel
																						? prev.driving_licenses.filter(
																								(
																									v,
																								) =>
																									v !==
																									dl.acronym,
																							)
																						: [
																								...prev.driving_licenses,
																								dl.acronym,
																							],
																			}),
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
																				isDark
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
							</ScrollView>
							<Button
								style={{
									backgroundColor: Colors.light.tint,
									marginTop: 8,
								}}
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
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Diplômes requis */}
				<Actionsheet
					isOpen={showDiplomaSheet}
					onClose={() => setShowDiplomaSheet(false)}>
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
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
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
									Diplômes requis
								</Text>
								{formData.diplomas_required.length > 0 && (
									<Pressable
										onPress={() =>
											setFormData((prev) => ({
												...prev,
												diplomas_required: [],
											}))
										}>
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
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%", maxHeight: 380 }}>
								<VStack
									space='lg'
									style={{ paddingBottom: 16 }}>
									{(() => {
										const DIPLOMA_GROUP_LABELS = {
											surveillance_humaine:
												"Surveillance humaine",
											cynophile: "Cynophile",
											protection_rapprochee:
												"Protection rapprochée",
											videoprotection: "Vidéoprotection",
											securite_incendie:
												"Sécurité Incendie",
										};
										const grouped = Object.entries(
											DIPLOMAS,
										).reduce((acc, [key, d]) => {
											if (!acc[d.category])
												acc[d.category] = [];
											acc[d.category].push({
												key,
												...d,
											});
											return acc;
										}, {});
										return Object.entries(grouped).map(
											([groupKey, items]) => (
												<VStack
													key={groupKey}
													space='sm'>
													<Text
														style={{
															fontSize: 12,
															fontWeight: "700",
															letterSpacing: 0.8,
															textTransform:
																"uppercase",
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															paddingHorizontal: 4,
														}}>
														{DIPLOMA_GROUP_LABELS[
															groupKey
														] || groupKey}
													</Text>
													<VStack space='xs'>
														{items.map((d) => {
															const isSel =
																formData.diplomas_required.includes(
																	d.acronym,
																);
															return (
																<Pressable
																	key={d.key}
																	onPress={() =>
																		setFormData(
																			(
																				prev,
																			) => ({
																				...prev,
																				diplomas_required:
																					isSel
																						? prev.diplomas_required.filter(
																								(
																									v,
																								) =>
																									v !==
																									d.acronym,
																							)
																						: [
																								...prev.diplomas_required,
																								d.acronym,
																							],
																			}),
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
																				isDark
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
																						d.acronym
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
																					d.name
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
							</ScrollView>
							<Button
								style={{
									backgroundColor: Colors.light.tint,
									marginTop: 8,
								}}
								onPress={() => setShowDiplomaSheet(false)}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Confirmer
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Certifications requises */}
				<Actionsheet
					isOpen={showCertificationSheet}
					onClose={() => setShowCertificationSheet(false)}>
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
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
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
									Certifications requises
								</Text>
								{formData.certifications_required.length >
									0 && (
									<Pressable
										onPress={() =>
											setFormData((prev) => ({
												...prev,
												certifications_required: [],
											}))
										}>
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
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%", maxHeight: 380 }}>
								<VStack
									space='lg'
									style={{ paddingBottom: 16 }}>
									{(() => {
										const CERTIF_GROUP_LABELS = {
											secourisme: "Secourisme",
											habilitation: "Habilitation",
											evenementiel: "Événementiel",
											protection_rapprochee:
												"Protection rapprochée",
											surete_aeroportuaire:
												"Sûreté aéroportuaire",
											securite_incendie:
												"Sécurité Incendie",
											cynophile: "Cynophile",
										};
										const grouped = Object.entries(
											CERTIFICATIONS,
										).reduce((acc, [key, c]) => {
											if (!acc[c.category])
												acc[c.category] = [];
											acc[c.category].push({
												key,
												...c,
											});
											return acc;
										}, {});
										return Object.entries(grouped).map(
											([groupKey, items]) => (
												<VStack
													key={groupKey}
													space='sm'>
													<Text
														style={{
															fontSize: 12,
															fontWeight: "700",
															letterSpacing: 0.8,
															textTransform:
																"uppercase",
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
															paddingHorizontal: 4,
														}}>
														{CERTIF_GROUP_LABELS[
															groupKey
														] || groupKey}
													</Text>
													<VStack space='xs'>
														{items.map((c) => {
															const isSel =
																formData.certifications_required.includes(
																	c.acronym,
																);
															return (
																<Pressable
																	key={c.key}
																	onPress={() =>
																		setFormData(
																			(
																				prev,
																			) => ({
																				...prev,
																				certifications_required:
																					isSel
																						? prev.certifications_required.filter(
																								(
																									v,
																								) =>
																									v !==
																									c.acronym,
																							)
																						: [
																								...prev.certifications_required,
																								c.acronym,
																							],
																			}),
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
																				isDark
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
																						c.acronym
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
																					c.name
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
							</ScrollView>
							<Button
								style={{
									backgroundColor: Colors.light.tint,
									marginTop: 8,
								}}
								onPress={() =>
									setShowCertificationSheet(false)
								}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Confirmer
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Cartes CNAPS requises */}
				<Actionsheet
					isOpen={showCnapsSheet}
					onClose={() => setShowCnapsSheet(false)}>
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
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
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
									Cartes CNAPS requises
								</Text>
								{formData.cnaps_required.length > 0 && (
									<Pressable
										onPress={() =>
											setFormData((prev) => ({
												...prev,
												cnaps_required: [],
											}))
										}>
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
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%", maxHeight: 380 }}>
								<VStack
									space='xs'
									style={{ paddingBottom: 16 }}>
									{Object.entries(CNAPS_CARDS).map(
										([key, card]) => {
											const isSel =
												formData.cnaps_required.includes(
													card.acronym,
												);
											return (
												<Pressable
													key={key}
													onPress={() =>
														setFormData((prev) => ({
															...prev,
															cnaps_required:
																isSel
																	? prev.cnaps_required.filter(
																			(
																				v,
																			) =>
																				v !==
																				card.acronym,
																		)
																	: [
																			...prev.cnaps_required,
																			card.acronym,
																		],
														}))
													}>
													<Box
														style={{
															padding: 14,
															borderRadius: 10,
															borderWidth: 2,
															borderColor: isSel
																? Colors.light
																		.tint
																: isDark
																	? Colors
																			.dark
																			.border
																	: Colors
																			.light
																			.border,
															backgroundColor:
																isDark
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
																		card.acronym
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
																{card.name}
															</Text>
														</HStack>
													</Box>
												</Pressable>
											);
										},
									)}
								</VStack>
							</ScrollView>
							<Button
								style={{
									backgroundColor: Colors.light.tint,
									marginTop: 8,
								}}
								onPress={() => setShowCnapsSheet(false)}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Confirmer
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Langues demandées */}
				<Actionsheet
					isOpen={showLanguageSheet}
					onClose={() => setShowLanguageSheet(false)}>
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
						<VStack
							style={{ width: "100%", paddingTop: 8 }}
							space='sm'>
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
									Langues demandées
								</Text>
								{formData.languages.length > 0 && (
									<Pressable
										onPress={() =>
											setFormData((prev) => ({
												...prev,
												languages: [],
											}))
										}>
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
							<ScrollView
								showsVerticalScrollIndicator={false}
								style={{ width: "100%", maxHeight: 380 }}>
								<VStack
									space='xs'
									style={{ paddingBottom: 16 }}>
									{LANGUAGES.map((lang) => {
										const isSel =
											formData.languages.includes(
												lang.code,
											);
										return (
											<Pressable
												key={lang.code}
												onPress={() =>
													setFormData((prev) => ({
														...prev,
														languages: isSel
															? prev.languages.filter(
																	(v) =>
																		v !==
																		lang.code,
																)
															: [
																	...prev.languages,
																	lang.code,
																],
													}))
												}>
												<Box
													style={{
														padding: 14,
														borderRadius: 10,
														borderWidth: 2,
														borderColor: isSel
															? Colors.light.tint
															: isDark
																? Colors.dark
																		.border
																: Colors.light
																		.border,
														backgroundColor: isDark
															? Colors.dark
																	.cardBackground
															: Colors.light
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
																{lang.code}
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
															{lang.name}
														</Text>
													</HStack>
												</Box>
											</Pressable>
										);
									})}
								</VStack>
							</ScrollView>
							<Button
								style={{
									backgroundColor: Colors.light.tint,
									marginTop: 8,
								}}
								onPress={() => setShowLanguageSheet(false)}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Valider
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				{/* Actionsheet — Date vacation */}
				<Actionsheet
					isOpen={showVacationDatePicker}
					onClose={() => setShowVacationDatePicker(false)}>
					<ActionsheetBackdrop />
					<ActionsheetContent
						style={{
							paddingBottom: 32,
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.cardBackground,
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
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Date de la vacation
							</Text>
							<DateTimePicker
								value={currentVacation.date || new Date()}
								mode='date'
								display='spinner'
								onChange={handleVacationDateChange}
								minimumDate={new Date()}
								style={{ width: "100%" }}
								textColor={
									isDark
										? Colors.dark.text
										: Colors.light.text
								}
							/>
							<Button
								size='md'
								onPress={() => setShowVacationDatePicker(false)}
								style={{
									backgroundColor: Colors.light.tint,
									width: "100%",
									marginTop: 8,
								}}>
								<ButtonText
									style={{
										color: Colors.light.cardBackground,
									}}>
									Confirmer
								</ButtonText>
							</Button>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>
			</Box>
		</>
	);
};

export default PostJob;
