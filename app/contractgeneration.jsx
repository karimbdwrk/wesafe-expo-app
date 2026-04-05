import React, { useState, useRef, useEffect } from "react";
import {
	ScrollView,
	Platform,
	TouchableOpacity,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Keyboard,
	TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
} from "@/components/ui/actionsheet";

import {
	ChevronLeft,
	ChevronRight,
	FileText,
	MapPin,
	BadgeEuro,
	Settings2,
	Plus,
	Trash2,
	CalendarDays,
	Clock,
	CheckCircle,
	AlertCircle,
} from "lucide-react-native";

import { createSupabaseClient } from "@/lib/supabase";
import { regions } from "@/constants/regions";
import { departements } from "@/constants/departements";

import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
	{ id: 1, title: "Informations du contrat" },
	{ id: 2, title: "Poste & Lieu de travail" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Clauses & Équipement" },
	{ id: 5, title: "Récapitulatif" },
];

// const CONTRACT_TYPES = ["CDD", "CDI", "Intérim", "Saisonnier"];
const CONTRACT_TYPES = ["CDD", "CDI"];

const WEEK_DAYS = [
	"Lundi",
	"Mardi",
	"Mercredi",
	"Jeudi",
	"Vendredi",
	"Samedi",
	"Dimanche",
];

const ContractGenerationScreen = () => {
	const { application_id } = useLocalSearchParams();
	const { isDark } = useTheme();
	const scheme = isDark ? "dark" : "light";
	const bg = Colors[scheme].background;
	const cardBg = Colors[scheme].cardBackground;
	const border = Colors[scheme].border;
	const textPrimary = Colors[scheme].text;
	const muted = Colors[scheme].muted;
	const tint = Colors[scheme].tint;
	const success = Colors[scheme].success;
	const danger = Colors[scheme].danger;
	const router = useRouter();
	const toast = useToast();
	const { accessToken } = useAuth();
	const { getById, updateApplicationStatus } = useDataContext();

	const [applicationData, setApplicationData] = useState(null);
	const [existingContractId, setExistingContractId] = useState(null);
	const [existingContractStatus, setExistingContractStatus] = useState(null);

	useEffect(() => {
		if (!application_id) return;
		const fetchApplicationData = async () => {
			try {
				const supabase = createSupabaseClient(accessToken);

				const data = await getById(
					"applications",
					application_id,
					"*,jobs(*), profiles(*), companies(*)",
				);
				setApplicationData(data);

				const isoToDate = (iso) => (iso ? new Date(iso) : null);
				const parseVacations = (raw) => {
					if (!raw || !Array.isArray(raw)) return [];
					return raw.map((v) => ({
						date: v.date ? new Date(v.date) : null,
						start_time: v.start_time || "",
						end_time: v.end_time || "",
					}));
				};

				// Vérifier si un contrat existe déjà pour cette candidature (draft ou published)
				const { data: existingContract } = await supabase
					.from("contracts")
					.select("*")
					.eq("apply_id", application_id)
					.in("status", ["draft", "published"])
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle();

				if (existingContract) {
					// Contrat trouvé → pré-remplir depuis le contrat
					setExistingContractId(existingContract.id);
					setExistingContractStatus(existingContract.status);
					const c = existingContract;
					const schedule = c.schedule || {};
					const wLocType = c.work_location_type || "single";
					const wLocs =
						wLocType === "multiple"
							? (() => {
									try {
										return (
											JSON.parse(c.work_location) || [""]
										);
									} catch {
										return [""];
									}
								})()
							: [""];

					setFormData((prev) => ({
						...prev,
						contract_type: c.contract_type || "",
						contract_reason: c.contract_reason || "",
						start_date: isoToDate(c.start_date),
						end_date: isoToDate(c.end_date),
						total_hours:
							c.total_hours != null ? String(c.total_hours) : "",
						schedule_known: schedule.schedule_known ?? false,
						week_schedule:
							schedule.week_schedule ?? prev.week_schedule,
						vacations: parseVacations(schedule.vacations),
						work_location:
							wLocType !== "multiple"
								? c.work_location || ""
								: "",
						work_location_name: c.work_location_name || "",
						work_location_type: wLocType,
						work_locations: wLocs,
						job_title: c.job_title || "",
						job_description: c.job_description || "",
						hourly_rate:
							c.hourly_rate != null ? String(c.hourly_rate) : "",
						meal_bonus:
							c.meal_bonus != null ? String(c.meal_bonus) : "",
						transport_bonus:
							c.transport_bonus != null
								? String(c.transport_bonus)
								: "",
						night_bonus:
							c.night_bonus != null ? String(c.night_bonus) : "",
						sunday_bonus:
							c.sunday_bonus != null
								? String(c.sunday_bonus)
								: "",
						holiday_bonus:
							c.holiday_bonus != null
								? String(c.holiday_bonus)
								: "",
						overtime_rate:
							c.overtime_rate != null
								? String(c.overtime_rate)
								: "",
						is_night: c.is_night ?? false,
						is_sunday: c.is_sunday ?? false,
						is_holiday: c.is_holiday ?? false,
						equipment_provided: c.equipment_provided ?? false,
						equipment_details: c.equipment_details || "",
						trial_period: c.trial_period || "",
						custom_clauses: c.custom_clauses || "",
					}));
					return; // Ne pas écraser avec les données du job
				}

				// Pas de brouillon → pré-remplir depuis le job
				const job = data?.jobs;
				if (!job) return;

				const mapContractType = (v) => {
					if (!v) return "";
					const upper = v.toUpperCase();
					if (upper === "CDI" || upper === "CDD") return upper;
					return "";
				};

				const vacations = parseVacations(job.vacations);
				const contractType = mapContractType(job.contract_type);

				setFormData((prev) => ({
					...prev,
					contract_type: contractType || prev.contract_type,
					start_date: isoToDate(job.start_date) ?? prev.start_date,
					end_date: isoToDate(job.end_date) ?? prev.end_date,
					job_title: job.title || prev.job_title,
					hourly_rate: job.salary_hourly
						? String(job.salary_hourly)
						: prev.hourly_rate,
					...(vacations.length > 0 && {
						schedule_known: true,
						vacations,
					}),
				}));
			} catch (err) {
				console.error("[ContractGen] Erreur fetch application :", err);
			}
		};
		fetchApplicationData();
	}, [application_id]);

	const [currentStep, setCurrentStep] = useState(1);
	const [showContractDatePicker, setShowContractDatePicker] = useState(null);
	const [tempContractDate, setTempContractDate] = useState(new Date());
	const [showVacationDatePicker, setShowVacationDatePicker] = useState(null);
	const [tempVacationDate, setTempVacationDate] = useState(new Date());
	const [showTimePicker, setShowTimePicker] = useState(null);
	const [tempTime, setTempTime] = useState(new Date());

	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null, null]);
	const currentStepRef = useRef(currentStep);

	useEffect(() => {
		currentStepRef.current = currentStep;
	}, [currentStep]);

	// Autoscroll pour centrer l'input focalisé dans l'espace visible
	useEffect(() => {
		const event =
			Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const sub = Keyboard.addListener(event, (e) => {
			const keyboardHeight = e.endCoordinates.height;
			const focused = TextInput.State.currentlyFocusedInput?.();
			if (!focused) return;
			const scrollRef =
				scrollViewRefs.current[currentStepRef.current - 1];
			if (!scrollRef) return;
			focused.measureInWindow((x, y, width, height) => {
				const windowHeight = Dimensions.get("window").height;
				const visibleHeight = windowHeight - keyboardHeight;
				const inputCenterY = y + height / 2;
				const targetScrollOffset = inputCenterY - visibleHeight / 2;
				if (targetScrollOffset > 0) {
					scrollRef.scrollTo({
						y: targetScrollOffset,
						animated: true,
					});
				}
			});
		});
		return () => sub.remove();
	}, []);

	const progressAnim = useRef(
		new Animated.Value(((currentStep - 1) / (STEPS.length - 1)) * 100),
	).current;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: ((currentStep - 1) / (STEPS.length - 1)) * 100,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [currentStep]);

	const [formData, setFormData] = useState({
		// Step 1
		contract_type: "",
		contract_reason: "",
		start_date: null,
		end_date: null,
		total_hours: "",
		schedule_known: false,
		week_schedule: {
			Lundi: { enabled: false, start: "", end: "" },
			Mardi: { enabled: false, start: "", end: "" },
			Mercredi: { enabled: false, start: "", end: "" },
			Jeudi: { enabled: false, start: "", end: "" },
			Vendredi: { enabled: false, start: "", end: "" },
			Samedi: { enabled: false, start: "", end: "" },
			Dimanche: { enabled: false, start: "", end: "" },
		},
		vacations: [],
		// Step 2
		work_location_name: "",
		work_location: "",
		work_location_type: "single",
		work_locations: [""],
		job_title: "",
		job_description: "",
		// Step 3
		hourly_rate: "",
		meal_bonus: "",
		transport_bonus: "",
		night_bonus: "",
		sunday_bonus: "",
		holiday_bonus: "",
		overtime_rate: "",
		is_night: false,
		is_sunday: false,
		is_holiday: false,
		// Step 4
		equipment_provided: false,
		equipment_details: "",
		trial_period: "",
		custom_clauses: "",
	});

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const updateWeekDay = (day, field, value) => {
		setFormData((prev) => ({
			...prev,
			week_schedule: {
				...prev.week_schedule,
				[day]: { ...prev.week_schedule[day], [field]: value },
			},
		}));
	};

	const addVacation = () => {
		setFormData((prev) => ({
			...prev,
			vacations: [
				...prev.vacations,
				{ date: null, start_time: "", end_time: "" },
			],
		}));
	};

	const removeVacation = (index) => {
		setFormData((prev) => ({
			...prev,
			vacations: prev.vacations.filter((_, i) => i !== index),
		}));
	};

	const updateVacation = (index, field, value) => {
		setFormData((prev) => {
			const updated = [...prev.vacations];
			updated[index] = { ...updated[index], [field]: value };
			return { ...prev, vacations: updated };
		});
	};

	const goToNextStep = () => {
		Keyboard.dismiss();
		if (currentStep < STEPS.length) {
			Animated.timing(scrollX, {
				toValue: -SCREEN_WIDTH * currentStep,
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep + 1);
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
		Keyboard.dismiss();
		if (currentStep > 1) {
			Animated.timing(scrollX, {
				toValue: -SCREEN_WIDTH * (currentStep - 2),
				duration: 300,
				useNativeDriver: true,
			}).start();
			setCurrentStep(currentStep - 1);
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

	const showError = (message) => {
		toast.show({
			placement: "top",
			render: ({ id }) => (
				<CustomToast
					id={id}
					icon={AlertCircle}
					color={danger}
					title={message}
				/>
			),
		});
	};

	const searchAddress = async (query, callback) => {
		if (!query || query.length < 3) {
			callback([]);
			return;
		}
		try {
			const res = await fetch(
				`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
			);
			const data = await res.json();
			callback(
				(data.features || []).map((item) => ({
					label: item.properties.label,
					city: item.properties.city,
					postcode: item.properties.postcode,
					street: item.properties.name,
				})),
			);
		} catch {
			callback([]);
		}
	};

	const validateStep = () => {
		Keyboard.dismiss();
		if (currentStep === 1) {
			if (!formData.contract_type)
				return showError("Veuillez choisir un type de contrat");
			if (!formData.start_date)
				return showError("Veuillez saisir une date de début");
			if (formData.contract_type === "CDD" && !formData.end_date)
				return showError("La date de fin est obligatoire pour un CDD");
			if (
				formData.contract_type === "CDD" &&
				!formData.contract_reason?.trim()
			)
				return showError(
					"Le motif de recours est obligatoire pour un CDD",
				);
			if (!formData.total_hours || formData.total_hours.trim() === "")
				return showError("Le nombre d'heures est obligatoire");
		}
		if (currentStep === 2) {
			if (!formData.job_title.trim())
				return showError("Veuillez saisir l'intitulé du poste");
			if (formData.work_location_type === "multiple") {
				if (
					formData.work_locations.length === 0 ||
					formData.work_locations.every((a) => !a.trim())
				)
					return showError("Veuillez saisir au moins une adresse");
			} else {
				if (!formData.work_location.trim())
					return showError("Veuillez saisir le lieu de travail");
			}
			if (!formData.job_description?.trim())
				return showError("La description des missions est obligatoire");
		}
		if (currentStep === 3) {
			if (!formData.hourly_rate)
				return showError("Veuillez saisir le taux horaire");
		}
		goToNextStep();
	};

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Autocomplete zone / région
	const [zoneQuery, setZoneQuery] = useState("");
	const [zoneResults, setZoneResults] = useState([]);
	const [zoneSelected, setZoneSelected] = useState(null);

	const searchZone = (query) => {
		if (!query || query.length < 3) {
			setZoneResults([]);
			return;
		}
		const q = query.toLowerCase();
		const depMatches = departements
			.filter(
				(d) =>
					d.nom.toLowerCase().includes(q) ||
					d.code.toLowerCase().includes(q),
			)
			.slice(0, 5)
			.map((d) => ({ label: `${d.nom} (${d.code})`, type: "dep" }));
		const regMatches = regions
			.filter((r) => r.nom.toLowerCase().includes(q))
			.slice(0, 5)
			.map((r) => ({ label: `Région ${r.nom}`, type: "reg" }));
		const combined = [...depMatches, ...regMatches].slice(0, 5);
		setZoneResults(combined);
	};

	// Autocomplete adresse unique
	const [singleAddressQuery, setSingleAddressQuery] = useState("");
	const [singleAddressResults, setSingleAddressResults] = useState([]);
	const [singleSelectedAddress, setSingleSelectedAddress] = useState(null);
	// Autocomplete plusieurs adresses
	const [multiAddressQueries, setMultiAddressQueries] = useState([""]);
	const [multiAddressResults, setMultiAddressResults] = useState([[]]);
	const [multiSelectedAddresses, setMultiSelectedAddresses] = useState([
		null,
	]);

	const handleSubmit = async (status = "draft") => {
		setIsSubmitting(true);
		try {
			const supabase = createSupabaseClient(accessToken);
			const formatDateISO = (d) =>
				d ? d.toISOString().split("T")[0] : null;

			const editablePayload = {
				contract_type: formData.contract_type,
				contract_reason: formData.contract_reason || null,
				start_date: formatDateISO(formData.start_date),
				end_date: formatDateISO(formData.end_date),
				total_hours: formData.total_hours
					? parseFloat(formData.total_hours)
					: null,
				schedule: {
					schedule_known: formData.schedule_known,
					week_schedule: formData.week_schedule,
					vacations: formData.vacations,
				},
				work_location:
					formData.work_location_type === "multiple"
						? JSON.stringify(
								formData.work_locations.filter((a) => a.trim()),
							)
						: formData.work_location,
				work_location_type: formData.work_location_type,
				work_location_name: formData.work_location_name || null,
				job_title: formData.job_title,
				job_description: formData.job_description || null,
				hourly_rate: formData.hourly_rate
					? parseFloat(formData.hourly_rate)
					: null,
				overtime_rate: formData.overtime_rate
					? parseFloat(formData.overtime_rate)
					: null,
				meal_bonus: formData.meal_bonus
					? parseFloat(formData.meal_bonus)
					: null,
				transport_bonus: formData.transport_bonus
					? parseFloat(formData.transport_bonus)
					: null,
				night_bonus: formData.night_bonus
					? parseFloat(formData.night_bonus)
					: null,
				sunday_bonus: formData.sunday_bonus
					? parseFloat(formData.sunday_bonus)
					: null,
				holiday_bonus: formData.holiday_bonus
					? parseFloat(formData.holiday_bonus)
					: null,
				is_night: formData.is_night,
				is_sunday: formData.is_sunday,
				is_holiday: formData.is_holiday,
				equipment_provided: formData.equipment_provided,
				equipment_details: formData.equipment_details || null,
				trial_period: formData.trial_period || null,
				custom_clauses: formData.custom_clauses || null,
				status: status,
			};

			let error;
			if (existingContractId) {
				// Brouillon existant → mise à jour (on rafraîchit aussi les snapshots)
				({ error } = await supabase
					.from("contracts")
					.update({
						...editablePayload,
						company_snapshot: applicationData?.companies ?? null,
						candidate_snapshot: applicationData?.profiles ?? null,
					})
					.eq("id", existingContractId));
			} else {
				// Nouveau contrat → insertion
				({ error } = await supabase.from("contracts").insert({
					...editablePayload,
					apply_id: application_id,
					job_id: applicationData?.jobs?.id ?? null,
					company_id: applicationData?.companies?.id ?? null,
					candidate_id: applicationData?.profiles?.id ?? null,
					company_snapshot: applicationData?.companies ?? null,
					candidate_snapshot: applicationData?.profiles ?? null,
					generated_at: new Date().toISOString(),
					isSigned: false,
					isProSigned: false,
				}));
			}

			if (error) throw error;

			// Si c'est la première publication (pas encore published avant)
			if (
				status === "published" &&
				existingContractStatus !== "published"
			) {
				await updateApplicationStatus(
					application_id,
					"contract_sent",
					"company",
				);
			}

			toast.show({
				placement: "top",
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={CheckCircle}
						color={success}
						title={
							status === "published"
								? "Contrat publié avec succès"
								: "Brouillon enregistré"
						}
					/>
				),
			});
			router.back();
		} catch (err) {
			console.error("[ContractGen] Erreur insert :", err);
			showError("Erreur lors de l'enregistrement du contrat");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDate = (date) => {
		if (!date) return "";
		return date.toLocaleDateString("fr-FR");
	};

	const parseTimeToDate = (timeStr) => {
		const d = new Date();
		if (timeStr) {
			const [h, m] = timeStr.split(":").map(Number);
			if (!isNaN(h)) d.setHours(h, isNaN(m) ? 0 : m, 0, 0);
		}
		return d;
	};

	const formatTime = (date) => {
		const h = String(date.getHours()).padStart(2, "0");
		const m = String(date.getMinutes()).padStart(2, "0");
		return `${h}:${m}`;
	};

	// ─── Styles partagés ───────────────────────────────────────────────────────
	const cardStyle = {
		backgroundColor: cardBg,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	};
	const labelStyle = {
		fontSize: 13,
		fontWeight: "600",
		color: textPrimary,
		marginBottom: 6,
	};
	const inputStyle = {
		backgroundColor: bg,
		borderColor: border,
	};
	const inputTextStyle = { color: textPrimary };

	// ─── Step 1 : Informations du contrat ─────────────────────────────────────
	const renderStep1 = () => (
		<ScrollView
			ref={(ref) => (scrollViewRefs.current[0] = ref)}
			style={{ flex: 1 }}
			contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}>
			{/* Type de contrat */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Type de contrat *</Text>
				<HStack space='sm' style={{ flexWrap: "wrap", gap: 8 }}>
					{CONTRACT_TYPES.map((type) => (
						<TouchableOpacity
							key={type}
							onPress={() => updateField("contract_type", type)}
							activeOpacity={0.7}
							style={{
								paddingHorizontal: 16,
								paddingVertical: 8,
								borderRadius: 20,
								borderWidth: 1.5,
								borderColor:
									formData.contract_type === type
										? tint
										: border,
								backgroundColor:
									formData.contract_type === type
										? tint
										: "transparent",
							}}>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color:
										formData.contract_type === type
											? "#ffffff"
											: textPrimary,
								}}>
								{type}
							</Text>
						</TouchableOpacity>
					))}
				</HStack>
			</Card>

			{/* Motif de recours */}
			{(formData.contract_type === "CDD" ||
				formData.contract_type === "Intérim") && (
				<Card style={cardStyle}>
					<Text style={labelStyle}>
						Motif de recours
						{formData.contract_type === "CDD" ? " *" : ""}
					</Text>
					<Textarea style={{ ...inputStyle, minHeight: 80 }}>
						<TextareaInput
							placeholder="Ex : Remplacement d'un salarié absent, accroissement temporaire..."
							value={formData.contract_reason}
							onChangeText={(v) =>
								updateField("contract_reason", v)
							}
							style={inputTextStyle}
						/>
					</Textarea>
				</Card>
			)}

			{/* Dates */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Date de début *</Text>
				<TouchableOpacity
					onPress={() => {
						setTempContractDate(formData.start_date || new Date());
						setShowContractDatePicker("start");
					}}
					style={{
						...inputStyle,
						borderWidth: 1,
						borderRadius: 8,
						padding: 12,
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
					}}>
					<Icon
						as={CalendarDays}
						size='sm'
						style={{ color: muted }}
					/>
					<Text
						style={{
							color: formData.start_date ? textPrimary : muted,
						}}>
						{formData.start_date
							? formatDate(formData.start_date)
							: "Sélectionner une date"}
					</Text>
				</TouchableOpacity>
			</Card>

			{formData.contract_type !== "CDI" && (
				<Card style={cardStyle}>
					<Text style={labelStyle}>
						Date de fin
						{formData.contract_type === "CDD" ? " *" : ""}
					</Text>
					<TouchableOpacity
						onPress={() => {
							setTempContractDate(
								formData.end_date || new Date(),
							);
							setShowContractDatePicker("end");
						}}
						style={{
							...inputStyle,
							borderWidth: 1,
							borderRadius: 8,
							padding: 12,
							flexDirection: "row",
							alignItems: "center",
							gap: 8,
						}}>
						<Icon
							as={CalendarDays}
							size='sm'
							style={{ color: muted }}
						/>
						<Text
							style={{
								color: formData.end_date ? textPrimary : muted,
							}}>
							{formData.end_date
								? formatDate(formData.end_date)
								: "Sélectionner une date"}
						</Text>
					</TouchableOpacity>
				</Card>
			)}

			{/* Durée hebdomadaire */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>
					{formData.contract_type === "CDI" ||
					(formData.start_date &&
						formData.end_date &&
						formData.end_date >=
							new Date(
								new Date(formData.start_date).setMonth(
									new Date(formData.start_date).getMonth() +
										1,
								),
							))
						? "Nombre d'heures mensuelles *"
						: "Nombre d'heures au total *"}
				</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder='Ex : 151.67'
						value={formData.total_hours}
						onChangeText={(v) => updateField("total_hours", v)}
						keyboardType='decimal-pad'
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			{/* Planning */}
			<Card style={cardStyle}>
				<HStack
					style={{
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: formData.schedule_known ? 16 : 0,
					}}>
					<Text
						style={{
							fontSize: 13,
							fontWeight: "600",
							color: textPrimary,
						}}>
						Planning connu ?
					</Text>
					<Switch
						value={formData.schedule_known}
						onValueChange={(v) => updateField("schedule_known", v)}
					/>
				</HStack>

				{/* CDI – Semaine type */}
				{formData.schedule_known &&
					formData.contract_type === "CDI" && (
						<VStack space='xs'>
							{WEEK_DAYS.map((day, idx) => (
								<VStack key={day}>
									{idx > 0 && (
										<Divider
											style={{
												marginVertical: 8,
												backgroundColor: border,
											}}
										/>
									)}
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: formData
												.week_schedule[day].enabled
												? 8
												: 0,
										}}>
										<Text
											style={{
												fontSize: 13,
												fontWeight: "600",
												color: textPrimary,
												width: 88,
											}}>
											{day}
										</Text>
										<Switch
											value={
												formData.week_schedule[day]
													.enabled
											}
											onValueChange={(v) =>
												updateWeekDay(day, "enabled", v)
											}
										/>
									</HStack>
									{formData.week_schedule[day].enabled && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Clock}
												size='xs'
												style={{
													color: muted,
												}}
											/>
											<TouchableOpacity
												onPress={() => {
													setTempTime(
														new Date(
															new Date().setHours(
																8,
																0,
																0,
																0,
															),
														),
													);
													setShowTimePicker({
														source: "cdi",
														day,
														field: "start",
													});
												}}
												activeOpacity={0.7}
												style={{
													...inputStyle,
													borderWidth: 1,
													borderRadius: 8,
													padding: 10,
													flex: 1,
													alignItems: "center",
												}}>
												<Text
													style={{
														fontSize: 13,
														color: formData
															.week_schedule[day]
															.start
															? textPrimary
															: muted,
													}}>
													{formData.week_schedule[day]
														.start || "Début"}
												</Text>
											</TouchableOpacity>
											<Text
												style={{
													color: muted,
													fontWeight: "600",
												}}>
												→
											</Text>
											<TouchableOpacity
												onPress={() => {
													setTempTime(
														new Date(
															new Date().setHours(
																18,
																0,
																0,
																0,
															),
														),
													);
													setShowTimePicker({
														source: "cdi",
														day,
														field: "end",
													});
												}}
												activeOpacity={0.7}
												style={{
													...inputStyle,
													borderWidth: 1,
													borderRadius: 8,
													padding: 10,
													flex: 1,
													alignItems: "center",
												}}>
												<Text
													style={{
														fontSize: 13,
														color: formData
															.week_schedule[day]
															.end
															? textPrimary
															: muted,
													}}>
													{formData.week_schedule[day]
														.end || "Fin"}
												</Text>
											</TouchableOpacity>
										</HStack>
									)}
								</VStack>
							))}
						</VStack>
					)}

				{/* CDD – Vacations */}
				{formData.schedule_known &&
					formData.contract_type !== "CDI" && (
						<VStack space='sm'>
							{formData.vacations.map((vacation, index) => (
								<Card
									key={index}
									style={{
										backgroundColor: bg,
										borderRadius: 8,
										padding: 12,
										marginBottom: 0,
									}}>
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: 10,
										}}>
										<Text
											style={{
												fontSize: 12,
												fontWeight: "700",
												color: muted,
											}}>
											Vacation {index + 1}
										</Text>
										<TouchableOpacity
											onPress={() =>
												removeVacation(index)
											}
											activeOpacity={0.7}>
											<Icon
												as={Trash2}
												size='sm'
												style={{ color: danger }}
											/>
										</TouchableOpacity>
									</HStack>

									{/* Date */}
									<TouchableOpacity
										onPress={() => {
											setTempVacationDate(
												vacation.date || new Date(),
											);
											setShowVacationDatePicker(index);
										}}
										style={{
											...inputStyle,
											borderWidth: 1,
											borderRadius: 8,
											padding: 10,
											flexDirection: "row",
											alignItems: "center",
											gap: 8,
											marginBottom: 8,
										}}>
										<Icon
											as={CalendarDays}
											size='xs'
											style={{
												color: muted,
											}}
										/>
										<Text
											style={{
												fontSize: 13,
												color: vacation.date
													? textPrimary
													: muted,
											}}>
											{vacation.date
												? formatDate(vacation.date)
												: "Date de la vacation"}
										</Text>
									</TouchableOpacity>
									{/* Heures */}
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={Clock}
											size='xs'
											style={{
												color: muted,
											}}
										/>
										<TouchableOpacity
											onPress={() => {
												setTempTime(
													new Date(
														new Date().setHours(
															8,
															0,
															0,
															0,
														),
													),
												);
												setShowTimePicker({
													source: "vacation",
													index,
													field: "start_time",
												});
											}}
											activeOpacity={0.7}
											style={{
												...inputStyle,
												borderWidth: 1,
												borderRadius: 8,
												padding: 10,
												flex: 1,
												alignItems: "center",
											}}>
											<Text
												style={{
													fontSize: 13,
													color: vacation.start_time
														? textPrimary
														: muted,
												}}>
												{vacation.start_time || "Début"}
											</Text>
										</TouchableOpacity>
										<Text
											style={{
												color: muted,
												fontWeight: "600",
											}}>
											→
										</Text>
										<TouchableOpacity
											onPress={() => {
												setTempTime(
													new Date(
														new Date().setHours(
															18,
															0,
															0,
															0,
														),
													),
												);
												setShowTimePicker({
													source: "vacation",
													index,
													field: "end_time",
												});
											}}
											activeOpacity={0.7}
											style={{
												...inputStyle,
												borderWidth: 1,
												borderRadius: 8,
												padding: 10,
												flex: 1,
												alignItems: "center",
											}}>
											<Text
												style={{
													fontSize: 13,
													color: vacation.end_time
														? textPrimary
														: muted,
												}}>
												{vacation.end_time || "Fin"}
											</Text>
										</TouchableOpacity>
									</HStack>
								</Card>
							))}

							<TouchableOpacity
								onPress={addVacation}
								activeOpacity={0.7}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									gap: 8,
									paddingVertical: 10,
									borderRadius: 8,
									borderWidth: 1.5,
									borderStyle: "dashed",
									borderColor: border,
								}}>
								<Icon
									as={Plus}
									size='sm'
									style={{
										color: muted,
									}}
								/>
								<Text
									style={{
										fontSize: 13,
										color: muted,
									}}>
									Ajouter une vacation
								</Text>
							</TouchableOpacity>
						</VStack>
					)}
			</Card>
		</ScrollView>
	);

	// ─── Step 2 : Poste & Lieu ────────────────────────────────────────────────
	const renderStep2 = () => (
		<ScrollView
			ref={(ref) => (scrollViewRefs.current[1] = ref)}
			style={{ flex: 1 }}
			contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}>
			<Card style={cardStyle}>
				<Text style={labelStyle}>Intitulé du poste *</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder='Ex : Agent de sécurité SSIAP 1'
						value={formData.job_title}
						onChangeText={(v) => updateField("job_title", v)}
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			<Card style={cardStyle}>
				<Text style={labelStyle}>Nom du lieu (optionnel)</Text>
				<Input style={{ ...inputStyle, marginBottom: 16 }}>
					<InputField
						placeholder='Ex : Centre Commercial Qwartz, Entrepôt Nord...'
						value={formData.work_location_name}
						onChangeText={(v) =>
							updateField("work_location_name", v)
						}
						style={inputTextStyle}
					/>
				</Input>

				<Text style={labelStyle}>Type de lieu *</Text>
				<HStack style={{ flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
					{[
						{ value: "single", label: "Adresse unique" },
						{ value: "multiple", label: "Plusieurs adresses" },
						{ value: "zone", label: "Zone / Région" },
					].map(({ value, label }) => (
						<TouchableOpacity
							key={value}
							onPress={() => {
								updateField("work_location_type", value);
								updateField("work_location", "");
								updateField("work_locations", [""]);
								updateField("work_location_name", "");
								setSingleAddressQuery("");
								setSingleAddressResults([]);
								setSingleSelectedAddress(null);
								setMultiAddressQueries([""]);
								setMultiAddressResults([[]]);
								setMultiSelectedAddresses([null]);
								setZoneQuery("");
								setZoneResults([]);
								setZoneSelected(null);
							}}
							activeOpacity={0.7}
							style={{
								paddingHorizontal: 14,
								paddingVertical: 7,
								borderRadius: 20,
								borderWidth: 1.5,
								borderColor:
									formData.work_location_type === value
										? tint
										: border,
								backgroundColor:
									formData.work_location_type === value
										? tint
										: "transparent",
							}}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color:
										formData.work_location_type === value
											? "#ffffff"
											: textPrimary,
								}}>
								{label}
							</Text>
						</TouchableOpacity>
					))}
				</HStack>

				{/* Adresse unique – autocomplete */}
				{formData.work_location_type === "single" && (
					<VStack space='sm'>
						<Input style={inputStyle}>
							<InputField
								placeholder='Rechercher une adresse...'
								value={singleAddressQuery}
								onChangeText={(v) => {
									setSingleAddressQuery(v);
									updateField("work_location", v);
									setSingleSelectedAddress(null);
									searchAddress(v, setSingleAddressResults);
								}}
								style={inputTextStyle}
							/>
						</Input>
						{singleAddressResults.length > 0 && (
							<VStack
								style={{
									borderRadius: 8,
									overflow: "hidden",
									borderWidth: 1,
									borderColor: border,
								}}>
								{singleAddressResults.map((item, idx) => (
									<TouchableOpacity
										key={idx}
										onPress={() => {
											setSingleSelectedAddress(item);
											setSingleAddressQuery("");
											setSingleAddressResults([]);
											updateField(
												"work_location",
												item.label,
											);
										}}
										activeOpacity={0.7}
										style={{
											padding: 12,
											backgroundColor: cardBg,
											borderBottomWidth:
												idx <
												singleAddressResults.length - 1
													? 1
													: 0,
											borderBottomColor: border,
										}}>
										<Text
											style={{
												fontSize: 14,
												color: textPrimary,
											}}>
											{item.label}
										</Text>
									</TouchableOpacity>
								))}
							</VStack>
						)}
						{singleSelectedAddress && (
							<HStack
								style={{
									padding: 12,
									borderRadius: 8,
									backgroundColor: isDark
										? "#1e3a5f"
										: "#eff6ff",
									alignItems: "center",
									gap: 8,
								}}>
								<Icon
									as={MapPin}
									size='sm'
									style={{ color: tint }}
								/>
								<Text
									style={{
										fontSize: 14,
										color: tint,
										flex: 1,
									}}>
									{singleSelectedAddress.label}
								</Text>
							</HStack>
						)}
					</VStack>
				)}

				{/* Plusieurs adresses – autocomplete par ligne */}
				{formData.work_location_type === "multiple" && (
					<VStack space='sm'>
						{formData.work_locations.map((addr, i) => (
							<VStack key={i} space='xs'>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Input style={{ ...inputStyle, flex: 1 }}>
										<InputField
											placeholder={`Rechercher adresse ${i + 1}...`}
											value={multiAddressQueries[i] ?? ""}
											onChangeText={(v) => {
												const uq = [
													...multiAddressQueries,
												];
												uq[i] = v;
												setMultiAddressQueries(uq);
												const ul = [
													...formData.work_locations,
												];
												ul[i] = v;
												updateField(
													"work_locations",
													ul,
												);
												const us = [
													...multiSelectedAddresses,
												];
												us[i] = null;
												setMultiSelectedAddresses(us);
												searchAddress(v, (results) => {
													const ur = [
														...multiAddressResults,
													];
													ur[i] = results;
													setMultiAddressResults(ur);
												});
											}}
											style={inputTextStyle}
										/>
									</Input>
									{formData.work_locations.length > 1 && (
										<TouchableOpacity
											onPress={() => {
												updateField(
													"work_locations",
													formData.work_locations.filter(
														(_, idx) => idx !== i,
													),
												);
												setMultiAddressQueries(
													multiAddressQueries.filter(
														(_, idx) => idx !== i,
													),
												);
												setMultiAddressResults(
													multiAddressResults.filter(
														(_, idx) => idx !== i,
													),
												);
												setMultiSelectedAddresses(
													multiSelectedAddresses.filter(
														(_, idx) => idx !== i,
													),
												);
											}}
											activeOpacity={0.7}>
											<Icon
												as={Trash2}
												size='sm'
												style={{ color: danger }}
											/>
										</TouchableOpacity>
									)}
								</HStack>
								{(multiAddressResults[i] || []).length > 0 && (
									<VStack
										style={{
											borderRadius: 8,
											overflow: "hidden",
											borderWidth: 1,
											borderColor: border,
										}}>
										{(multiAddressResults[i] || []).map(
											(item, idx) => (
												<TouchableOpacity
													key={idx}
													onPress={() => {
														const us = [
															...multiSelectedAddresses,
														];
														us[i] = item;
														setMultiSelectedAddresses(
															us,
														);
														const uq = [
															...multiAddressQueries,
														];
														uq[i] = "";
														setMultiAddressQueries(
															uq,
														);
														const ur = [
															...multiAddressResults,
														];
														ur[i] = [];
														setMultiAddressResults(
															ur,
														);
														const ul = [
															...formData.work_locations,
														];
														ul[i] = item.label;
														updateField(
															"work_locations",
															ul,
														);
													}}
													activeOpacity={0.7}
													style={{
														padding: 12,
														backgroundColor: cardBg,
														borderBottomWidth:
															idx <
															(
																multiAddressResults[
																	i
																] || []
															).length -
																1
																? 1
																: 0,
														borderBottomColor:
															border,
													}}>
													<Text
														style={{
															fontSize: 14,
															color: textPrimary,
														}}>
														{item.label}
													</Text>
												</TouchableOpacity>
											),
										)}
									</VStack>
								)}
								{multiSelectedAddresses[i] && (
									<HStack
										style={{
											padding: 12,
											borderRadius: 8,
											backgroundColor: isDark
												? "#1e3a5f"
												: "#eff6ff",
											alignItems: "center",
											gap: 8,
										}}>
										<Icon
											as={MapPin}
											size='sm'
											style={{ color: tint }}
										/>
										<Text
											style={{
												fontSize: 14,
												color: tint,
												flex: 1,
											}}>
											{multiSelectedAddresses[i].label}
										</Text>
									</HStack>
								)}
							</VStack>
						))}
						<TouchableOpacity
							onPress={() => {
								updateField("work_locations", [
									...formData.work_locations,
									"",
								]);
								setMultiAddressQueries([
									...multiAddressQueries,
									"",
								]);
								setMultiAddressResults([
									...multiAddressResults,
									[],
								]);
								setMultiSelectedAddresses([
									...multiSelectedAddresses,
									null,
								]);
							}}
							activeOpacity={0.7}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
								paddingVertical: 10,
								borderRadius: 8,
								borderWidth: 1.5,
								borderStyle: "dashed",
								borderColor: border,
							}}>
							<Icon
								as={Plus}
								size='sm'
								style={{
									color: muted,
								}}
							/>
							<Text
								style={{
									fontSize: 13,
									color: muted,
								}}>
								Ajouter une adresse
							</Text>
						</TouchableOpacity>
					</VStack>
				)}

				{/* Zone / Région */}
				{formData.work_location_type === "zone" && (
					<VStack space='sm'>
						<Input style={inputStyle}>
							<InputField
								placeholder='Rechercher un département ou une région...'
								value={zoneQuery}
								onChangeText={(v) => {
									setZoneQuery(v);
									updateField("work_location", v);
									setZoneSelected(null);
									searchZone(v);
								}}
								style={inputTextStyle}
							/>
						</Input>
						{zoneResults.length > 0 && (
							<VStack
								style={{
									borderRadius: 8,
									overflow: "hidden",
									borderWidth: 1,
									borderColor: border,
								}}>
								{zoneResults.map((item, idx) => (
									<TouchableOpacity
										key={idx}
										onPress={() => {
											setZoneSelected(item);
											setZoneQuery("");
											setZoneResults([]);
											updateField(
												"work_location",
												item.label,
											);
										}}
										activeOpacity={0.7}
										style={{
											padding: 12,
											backgroundColor: cardBg,
											borderBottomWidth:
												idx < zoneResults.length - 1
													? 1
													: 0,
											borderBottomColor: border,
										}}>
										<HStack
											style={{
												alignItems: "center",
												gap: 8,
											}}>
											<Text
												style={{
													fontSize: 10,
													fontWeight: "700",
													color:
														item.type === "reg"
															? "#8b5cf6"
															: tint,
													paddingHorizontal: 6,
													paddingVertical: 2,
													borderRadius: 4,
													backgroundColor:
														item.type === "reg"
															? isDark
																? "#3b1f6f"
																: "#ede9fe"
															: isDark
																? "#1e3a5f"
																: "#dbeafe",
												}}>
												{item.type === "reg"
													? "RÉG"
													: "DEP"}
											</Text>
											<Text
												style={{
													fontSize: 14,
													color: textPrimary,
												}}>
												{item.label}
											</Text>
										</HStack>
									</TouchableOpacity>
								))}
							</VStack>
						)}
						{zoneSelected && (
							<HStack
								style={{
									padding: 12,
									borderRadius: 8,
									backgroundColor: isDark
										? zoneSelected.type === "reg"
											? "#3b1f6f"
											: "#1e3a5f"
										: zoneSelected.type === "reg"
											? "#ede9fe"
											: "#eff6ff",
									alignItems: "center",
									gap: 8,
								}}>
								<Icon
									as={MapPin}
									size='sm'
									style={{
										color:
											zoneSelected.type === "reg"
												? "#8b5cf6"
												: tint,
									}}
								/>
								<Text
									style={{
										fontSize: 14,
										color:
											zoneSelected.type === "reg"
												? isDark
													? "#c4b5fd"
													: "#7c3aed"
												: tint,
										flex: 1,
									}}>
									{zoneSelected.label}
								</Text>
							</HStack>
						)}
					</VStack>
				)}
			</Card>

			<Card style={cardStyle}>
				<Text style={labelStyle}>Description des missions *</Text>
				<Textarea
					style={{ ...inputStyle, minHeight: 120, marginBottom: 30 }}>
					<TextareaInput
						placeholder='Détaillez les missions et responsabilités du poste...'
						value={formData.job_description}
						onChangeText={(v) => updateField("job_description", v)}
						style={inputTextStyle}
					/>
				</Textarea>
			</Card>
		</ScrollView>
	);

	// ─── Step 3 : Rémunération ────────────────────────────────────────────────
	const renderStep3 = () => (
		<ScrollView
			ref={(ref) => (scrollViewRefs.current[2] = ref)}
			style={{ flex: 1 }}
			contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}>
			<Card style={cardStyle}>
				<Text style={labelStyle}>Taux horaire brut (€) *</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder='Ex : 12.50'
						value={formData.hourly_rate}
						onChangeText={(v) => updateField("hourly_rate", v)}
						keyboardType='decimal-pad'
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			<Card style={cardStyle}>
				<Text style={labelStyle}>Taux heures supplémentaires (€)</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder='Ex : 15.63'
						value={formData.overtime_rate}
						onChangeText={(v) => updateField("overtime_rate", v)}
						keyboardType='decimal-pad'
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			{/* Primes */}
			<Card style={cardStyle}>
				<Text style={{ ...labelStyle, marginBottom: 12 }}>Primes</Text>
				<VStack space='md'>
					{[
						{ key: "meal_bonus", label: "Prime panier repas (€)" },
						{
							key: "transport_bonus",
							label: "Indemnité transport (€)",
						},
						{ key: "night_bonus", label: "Prime nuit (€)" },
						{ key: "sunday_bonus", label: "Prime dimanche (€)" },
						{ key: "holiday_bonus", label: "Prime jour férié (€)" },
					].map(({ key, label }) => (
						<VStack key={key} space='xs'>
							<Text
								style={{
									fontSize: 12,
									color: muted,
								}}>
								{label}
							</Text>
							<Input style={inputStyle}>
								<InputField
									placeholder='0.00'
									value={formData[key]}
									onChangeText={(v) => updateField(key, v)}
									keyboardType='decimal-pad'
									style={inputTextStyle}
								/>
							</Input>
						</VStack>
					))}
				</VStack>
			</Card>

			{/* Conditions particulières */}
			<Card style={cardStyle}>
				<Text style={{ ...labelStyle, marginBottom: 12 }}>
					Conditions particulières
				</Text>
				<VStack space='md'>
					{[
						{ key: "is_night", label: "Travail de nuit" },
						{ key: "is_sunday", label: "Travail le dimanche" },
						{
							key: "is_holiday",
							label: "Travail les jours fériés",
						},
					].map(({ key, label }) => (
						<HStack
							key={key}
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<Text
								style={{
									color: textPrimary,
									fontSize: 14,
								}}>
								{label}
							</Text>
							<Switch
								value={formData[key]}
								onValueChange={(v) => updateField(key, v)}
								trackColor={{
									false: border,
									true: tint,
								}}
							/>
						</HStack>
					))}
				</VStack>
			</Card>
		</ScrollView>
	);

	// ─── Step 4 : Clauses & Équipement ────────────────────────────────────────
	const renderStep4 = () => (
		<ScrollView
			ref={(ref) => (scrollViewRefs.current[3] = ref)}
			style={{ flex: 1 }}
			contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}>
			{/* Équipement */}
			<Card style={cardStyle}>
				<HStack
					style={{
						alignItems: "center",
						justifyContent: "space-between",
						// marginBottom: 12,
					}}>
					<Text style={labelStyle}>
						Équipement fourni par l'employeur
					</Text>
					<Switch
						value={formData.equipment_provided}
						onValueChange={(v) =>
							updateField("equipment_provided", v)
						}
						trackColor={{
							false: border,
							true: tint,
						}}
					/>
				</HStack>
				{formData.equipment_provided && (
					<>
						<Text
							style={{
								fontSize: 12,
								color: muted,
								marginTop: 12,
								marginBottom: 6,
							}}>
							Détail de l'équipement
						</Text>
						<Textarea style={{ ...inputStyle, minHeight: 80 }}>
							<TextareaInput
								placeholder="Ex : Tenue de sécurité, radio, badge d'accès..."
								value={formData.equipment_details}
								onChangeText={(v) =>
									updateField("equipment_details", v)
								}
								style={inputTextStyle}
							/>
						</Textarea>
					</>
				)}
			</Card>

			{/* Période d'essai */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Période d'essai</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder='Ex : 1 mois renouvelable une fois'
						value={formData.trial_period}
						onChangeText={(v) => updateField("trial_period", v)}
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			{/* Clauses personnalisées */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Clauses particulières</Text>
				<Textarea style={{ ...inputStyle, minHeight: 140 }}>
					<TextareaInput
						placeholder='Ajoutez ici toute clause spécifique à ce contrat...'
						value={formData.custom_clauses}
						onChangeText={(v) => updateField("custom_clauses", v)}
						style={inputTextStyle}
					/>
				</Textarea>
			</Card>
		</ScrollView>
	);

	// ─── Step 5 : Récapitulatif ───────────────────────────────────────────────
	const renderStep5 = () => (
		<ScrollView
			ref={(ref) => (scrollViewRefs.current[4] = ref)}
			style={{ flex: 1 }}
			contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
			showsVerticalScrollIndicator={false}>
			<VStack space='xs' style={{ marginBottom: 16 }}>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "700",
						color: textPrimary,
					}}>
					Vérifiez les informations
				</Text>
				<Text
					style={{
						fontSize: 13,
						color: muted,
					}}>
					Confirmez avant de générer le contrat.
				</Text>
			</VStack>

			<Card
				style={{
					...cardStyle,
					borderWidth: 1,
					borderColor: border,
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: tint,
						marginBottom: 10,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}>
					Contrat
				</Text>
				<VStack space='sm'>
					{[
						{ label: "Type", value: formData.contract_type },
						{
							label: "Début",
							value: formData.start_date
								? formatDate(formData.start_date)
								: null,
						},
						{
							label: "Fin",
							value: formData.end_date
								? formatDate(formData.end_date)
								: null,
						},
						{
							label: "Heures totales",
							value: formData.total_hours
								? `${formData.total_hours} h`
								: null,
						},
						{
							label: "Planning",
							value: !formData.schedule_known
								? "Non communiqué"
								: formData.contract_type === "CDI"
									? Object.entries(formData.week_schedule)
											.filter(([, v]) => v.enabled)
											.map(
												([d, v]) =>
													`${d.slice(0, 3)}${
														v.start
															? ` ${v.start}→${v.end}`
															: ""
													}`,
											)
											.join(", ") || "Aucun jour"
									: formData.vacations.length
										? `${formData.vacations.length} vacation(s)`
										: "Aucune vacation",
						},
					].map(({ label, value }) =>
						value ? (
							<HStack
								key={label}
								style={{
									justifyContent: "space-between",
									paddingVertical: 2,
								}}>
								<Text
									style={{
										fontSize: 13,
										color: muted,
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: textPrimary,
										maxWidth: "55%",
										textAlign: "right",
									}}>
									{value}
								</Text>
							</HStack>
						) : null,
					)}
				</VStack>
			</Card>

			<Card
				style={{
					...cardStyle,
					borderWidth: 1,
					borderColor: border,
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: tint,
						marginBottom: 10,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}>
					Poste
				</Text>
				<VStack space='sm'>
					{[
						{ label: "Intitulé", value: formData.job_title },
						{
							label: "Lieu",
							value:
								formData.work_location_type === "multiple"
									? formData.work_locations
											.filter((a) => a.trim())
											.join(", ") || null
									: formData.work_location || null,
						},
						{
							label: "Description",
							value: formData.job_description,
						},
					].map(({ label, value }) =>
						value ? (
							<HStack
								key={label}
								style={{
									justifyContent: "space-between",
									paddingVertical: 2,
								}}>
								<Text
									style={{
										fontSize: 13,
										color: muted,
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: textPrimary,
										maxWidth: "55%",
										textAlign: "right",
									}}>
									{value}
								</Text>
							</HStack>
						) : null,
					)}
				</VStack>
			</Card>

			<Card
				style={{
					...cardStyle,
					borderWidth: 1,
					borderColor: border,
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: tint,
						marginBottom: 10,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}>
					Rémunération
				</Text>
				<VStack space='sm'>
					{[
						{
							label: "Taux horaire",
							value: formData.hourly_rate
								? `${formData.hourly_rate} €/h`
								: null,
						},
						{
							label: "Heures supp.",
							value: formData.overtime_rate
								? `${formData.overtime_rate} €/h`
								: null,
						},
						{
							label: "Prime panier",
							value: formData.meal_bonus
								? `${formData.meal_bonus} €`
								: null,
						},
						{
							label: "Transport",
							value: formData.transport_bonus
								? `${formData.transport_bonus} €`
								: null,
						},
						{
							label: "Prime nuit",
							value: formData.night_bonus
								? `${formData.night_bonus} €`
								: null,
						},
						{
							label: "Prime dimanche",
							value: formData.sunday_bonus
								? `${formData.sunday_bonus} €`
								: null,
						},
						{
							label: "Prime férié",
							value: formData.holiday_bonus
								? `${formData.holiday_bonus} €`
								: null,
						},
						{
							label: "Travail de nuit",
							value: formData.is_night ? "Oui" : null,
						},
						{
							label: "Travail dimanche",
							value: formData.is_sunday ? "Oui" : null,
						},
						{
							label: "Jours fériés",
							value: formData.is_holiday ? "Oui" : null,
						},
					].map(({ label, value }) =>
						value ? (
							<HStack
								key={label}
								style={{
									justifyContent: "space-between",
									paddingVertical: 2,
								}}>
								<Text
									style={{
										fontSize: 13,
										color: muted,
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: textPrimary,
									}}>
									{value}
								</Text>
							</HStack>
						) : null,
					)}
				</VStack>
			</Card>

			<Card
				style={{
					...cardStyle,
					borderWidth: 1,
					borderColor: border,
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: tint,
						marginBottom: 10,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}>
					Clauses & Équipement
				</Text>
				<VStack space='sm'>
					{[
						{
							label: "Équipement fourni",
							value: formData.equipment_provided ? "Oui" : "Non",
						},
						{
							label: "Détail équipement",
							value: formData.equipment_details || null,
						},
						{
							label: "Période d'essai",
							value: formData.trial_period || null,
						},
						{
							label: "Clauses particulières",
							value: formData.custom_clauses || null,
						},
					].map(({ label, value }) =>
						value ? (
							<HStack
								key={label}
								style={{
									justifyContent: "space-between",
									paddingVertical: 2,
								}}>
								<Text
									style={{
										fontSize: 13,
										color: muted,
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: textPrimary,
										maxWidth: "55%",
										textAlign: "right",
									}}>
									{value}
								</Text>
							</HStack>
						) : null,
					)}
				</VStack>
			</Card>
		</ScrollView>
	);

	return (
		<>
			<KeyboardAvoidingView
				behavior='height'
				style={{ flex: 1 }}
				keyboardVerticalOffset={80}>
				<Box
					style={{
						flex: 1,
						backgroundColor: bg,
					}}>
					{/* ── Progress Bar ── */}
					<Box
						style={{
							paddingTop: 14,
							paddingHorizontal: 20,
							paddingBottom: 14,
							backgroundColor: cardBg,
							borderBottomWidth: 1,
							borderBottomColor: border,
						}}>
						<VStack space='sm'>
							<HStack
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<Text
									style={{
										fontSize: 14,
										fontWeight: "600",
										color: textPrimary,
									}}>
									{STEPS[currentStep - 1].title}
								</Text>
								<Text
									style={{
										fontSize: 12,
										color: muted,
									}}>
									Étape {currentStep}/{STEPS.length}
								</Text>
							</HStack>
							<Box
								style={{
									width: "100%",
									height: 8,
									backgroundColor: border,
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
										backgroundColor: tint,
										borderRadius: 4,
									}}
								/>
							</Box>
						</VStack>
					</Box>

					{/* ── Steps Content ── */}
					<Box style={{ flex: 1, overflow: "hidden" }}>
						<Animated.View
							style={{
								flex: 1,
								flexDirection: "row",
								width: SCREEN_WIDTH * STEPS.length,
								transform: [{ translateX: scrollX }],
							}}>
							<Box style={{ width: SCREEN_WIDTH }}>
								{renderStep1()}
							</Box>
							<Box style={{ width: SCREEN_WIDTH }}>
								{renderStep2()}
							</Box>
							<Box style={{ width: SCREEN_WIDTH }}>
								{renderStep3()}
							</Box>
							<Box style={{ width: SCREEN_WIDTH }}>
								{renderStep4()}
							</Box>
							<Box style={{ width: SCREEN_WIDTH }}>
								{renderStep5()}
							</Box>
						</Animated.View>
					</Box>
				</Box>
			</KeyboardAvoidingView>

			{/* ── Bottom Fixed Navigation ── */}
			<Box
				style={{
					padding: 16,
					paddingBottom: Platform.OS === "ios" ? 32 : 20,
					backgroundColor: bg,
					borderTopWidth: 1,
					borderTopColor: border,
				}}>
				<HStack space='md'>
					{currentStep > 1 ? (
						<Button
							variant='outline'
							onPress={goToPreviousStep}
							style={{
								flex: 1,
								borderColor: border,
							}}>
							<ButtonIcon
								as={ChevronLeft}
								style={{
									color: textPrimary,
								}}
							/>
							<ButtonText
								style={{
									color: textPrimary,
								}}>
								Précédent
							</ButtonText>
						</Button>
					) : null}

					{currentStep < STEPS.length ? (
						<Button
							onPress={validateStep}
							style={{
								flex: 2,
								backgroundColor: tint,
							}}>
							<ButtonText style={{ color: "#ffffff" }}>
								Suivant
							</ButtonText>
							<ButtonIcon
								as={ChevronRight}
								style={{ color: "#ffffff" }}
							/>
						</Button>
					) : (
						<Button
							onPress={() => setShowConfirmDialog(true)}
							disabled={isSubmitting}
							style={{
								flex: 2,
								backgroundColor: isSubmitting ? muted : success,
							}}>
							<ButtonIcon
								as={CheckCircle}
								style={{ color: "#ffffff" }}
							/>
							<ButtonText style={{ color: "#ffffff" }}>
								{isSubmitting
									? "Enregistrement..."
									: "Générer le contrat"}
							</ButtonText>
						</Button>
					)}
				</HStack>
			</Box>

			{/* Alert Dialog : confirmation génération contrat */}
			<AlertDialog
				isOpen={showConfirmDialog}
				onClose={() => setShowConfirmDialog(false)}>
				<AlertDialogBackdrop />
				<AlertDialogContent
					style={{
						backgroundColor: cardBg,
						borderRadius: 16,
						margin: 24,
					}}>
					<AlertDialogHeader>
						<Text
							style={{
								fontSize: 17,
								fontWeight: "700",
								color: textPrimary,
							}}>
							{existingContractStatus === "published"
								? "Enregistrer les modifications"
								: "Générer le contrat"}
						</Text>
					</AlertDialogHeader>
					<AlertDialogBody>
						<Text
							style={{
								fontSize: 14,
								color: muted,
								lineHeight: 20,
								marginBottom: 16,
							}}>
							Contrat pour{" "}
							<Text
								style={{
									fontWeight: "700",
									color: textPrimary,
								}}>
								{applicationData?.profiles?.firstname}{" "}
								{applicationData?.profiles?.lastname}
							</Text>{" "}
							— poste{" "}
							<Text
								style={{
									fontWeight: "700",
									color: textPrimary,
								}}>
								{formData.job_title}
							</Text>
						</Text>
						<VStack space='sm'>
							{/* Option Brouillon — masquée si contrat déjà publié */}
							{existingContractStatus !== "published" && (
								<TouchableOpacity
									onPress={() => {
										setShowConfirmDialog(false);
										handleSubmit("draft");
									}}
									activeOpacity={0.7}
									style={{
										borderWidth: 1.5,
										borderColor: border,
										borderRadius: 12,
										padding: 14,
										backgroundColor: bg,
									}}>
									<Text
										style={{
											fontSize: 14,
											fontWeight: "700",
											color: textPrimary,
											marginBottom: 4,
										}}>
										📝 Enregistrer en brouillon
									</Text>
									<Text
										style={{
											fontSize: 12,
											color: muted,
											lineHeight: 18,
										}}>
										Sauvegarder pour compléter ou modifier
										plus tard. Le candidat ne pourra pas
										encore le signer.
									</Text>
								</TouchableOpacity>
							)}
							{/* Option Publier */}
							<TouchableOpacity
								onPress={() => {
									setShowConfirmDialog(false);
									handleSubmit("published");
								}}
								activeOpacity={0.7}
								style={{
									borderWidth: 1.5,
									borderColor: success,
									borderRadius: 12,
									padding: 14,
									backgroundColor: isDark
										? "#052e16"
										: "#f0fdf4",
								}}>
								<Text
									style={{
										fontSize: 14,
										fontWeight: "700",
										color: success,
										marginBottom: 4,
									}}>
									{existingContractStatus === "published"
										? "✅ Enregistrer les modifications"
										: "✅ Publier le contrat"}
								</Text>
								<Text
									style={{
										fontSize: 12,
										color: isDark ? "#86efac" : "#166534",
										lineHeight: 18,
									}}>
									{existingContractStatus === "published"
										? "Ce contrat est déjà publié. Les modifications seront enregistrées et visibles immédiatement par le candidat."
										: "Finaliser et envoyer au candidat pour signature. Cette action est irréversible."}
								</Text>
							</TouchableOpacity>
						</VStack>
					</AlertDialogBody>
					<AlertDialogFooter style={{ paddingTop: 12 }}>
						<Button
							variant='outline'
							onPress={() => setShowConfirmDialog(false)}
							style={{
								flex: 1,
								borderColor: border,
							}}>
							<ButtonText
								style={{
									color: textPrimary,
								}}>
								Annuler
							</ButtonText>
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Actionsheet : date picker contrat (début / fin) */}
			<Actionsheet
				isOpen={showContractDatePicker !== null}
				onClose={() => setShowContractDatePicker(null)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: cardBg,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						style={{
							width: "100%",
							padding: 20,
							paddingBottom: 32,
						}}
						space='md'>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "700",
								color: textPrimary,
								textAlign: "center",
							}}>
							{showContractDatePicker === "start"
								? "Date de début"
								: "Date de fin"}
						</Text>
						<DateTimePicker
							value={tempContractDate}
							mode='date'
							display='spinner'
							onChange={(_, date) => {
								if (date) setTempContractDate(date);
							}}
							style={{ width: "100%" }}
						/>
						<Button
							onPress={() => {
								if (showContractDatePicker === "start") {
									updateField("start_date", tempContractDate);
								} else if (showContractDatePicker === "end") {
									updateField("end_date", tempContractDate);
								}
								setShowContractDatePicker(null);
							}}
							style={{
								backgroundColor: tint,
								borderRadius: 12,
							}}>
							<ButtonText
								style={{ color: "#ffffff", fontWeight: "700" }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>

			{/* Actionsheet : time picker */}
			<Actionsheet
				isOpen={showTimePicker !== null}
				onClose={() => setShowTimePicker(null)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: cardBg,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						style={{
							width: "100%",
							padding: 20,
							paddingBottom: 32,
						}}
						space='md'>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "700",
								color: textPrimary,
								textAlign: "center",
							}}>
							{showTimePicker?.field === "start" ||
							showTimePicker?.field === "start_time"
								? "Heure de début"
								: "Heure de fin"}
						</Text>
						<DateTimePicker
							value={tempTime}
							mode='time'
							display='spinner'
							is24Hour
							minuteInterval={5}
							onChange={(_, time) => {
								if (time) setTempTime(time);
							}}
							style={{ width: "100%" }}
						/>
						<Button
							onPress={() => {
								if (showTimePicker !== null) {
									const formatted = formatTime(tempTime);
									if (showTimePicker.source === "cdi") {
										updateWeekDay(
											showTimePicker.day,
											showTimePicker.field,
											formatted,
										);
									} else {
										updateVacation(
											showTimePicker.index,
											showTimePicker.field,
											formatted,
										);
									}
								}
								setShowTimePicker(null);
							}}
							style={{
								backgroundColor: tint,
								borderRadius: 12,
							}}>
							<ButtonText
								style={{ color: "#ffffff", fontWeight: "700" }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>

			{/* Actionsheet : date picker vacation */}
			<Actionsheet
				isOpen={showVacationDatePicker !== null}
				onClose={() => setShowVacationDatePicker(null)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: cardBg,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						style={{
							width: "100%",
							padding: 20,
							paddingBottom: 32,
						}}
						space='md'>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "700",
								color: textPrimary,
								textAlign: "center",
							}}>
							Date de la vacation
						</Text>
						<DateTimePicker
							value={tempVacationDate}
							mode='date'
							display='spinner'
							onChange={(_, date) => {
								if (date) setTempVacationDate(date);
							}}
							style={{ width: "100%" }}
						/>
						<Button
							onPress={() => {
								if (showVacationDatePicker !== null) {
									updateVacation(
										showVacationDatePicker,
										"date",
										tempVacationDate,
									);
								}
								setShowVacationDatePicker(null);
							}}
							style={{
								backgroundColor: tint,
								borderRadius: 12,
							}}>
							<ButtonText
								style={{ color: "#ffffff", fontWeight: "700" }}>
								Confirmer
							</ButtonText>
						</Button>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
};

export default ContractGenerationScreen;
