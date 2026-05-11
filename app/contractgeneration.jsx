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
import { useRouter, useLocalSearchParams } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
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
	ChevronDown,
	MapPin,
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
import { sendRecruitmentStatusEmail } from "@/utils/sendRecruitmentStatusEmail";

import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
	{ id: 1, title: "Informations du contrat" },
	{ id: 2, title: "Poste & Lieu de travail" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Clauses & Équipement" },
	{ id: 5, title: "Récapitulatif" },
];

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

const BONUS_FIELDS = [
	{ key: "meal_bonus", label: "Prime panier repas (€)" },
	{ key: "transport_bonus", label: "Indemnité transport (€)" },
	{ key: "night_bonus", label: "Prime nuit (€)" },
	{ key: "sunday_bonus", label: "Prime dimanche (€)" },
	{ key: "holiday_bonus", label: "Prime jour férié (€)" },
];

const CONDITION_FIELDS = [
	{ key: "is_night", label: "Travail de nuit" },
	{ key: "is_sunday", label: "Travail le dimanche" },
	{ key: "is_holiday", label: "Travail les jours fériés" },
];

const LOCATION_TYPES = [
	{ value: "single", label: "Adresse unique" },
	{ value: "multiple", label: "Plusieurs adresses" },
	{ value: "zone", label: "Zone / Région" },
];

const CDD_REASON_CODES = [
	{ value: "remplacement", label: "Remplacement d'un salarié" },
	{
		value: "accroissement_temporaire",
		label: "Accroissement temporaire d'activité",
	},
	{ value: "evenementiel", label: "Événementiel" },
	{ value: "saisonnier", label: "Emploi saisonnier" },
];

// ─── Utility helpers ────────────────────────────────────────────────────────────

const formatDate = (date) => date?.toLocaleDateString("fr-FR") ?? "";

const formatTime = (date) => {
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
};

const formatDateISO = (d) => (d ? d.toISOString().split("T")[0] : null);

const isoToDate = (iso) => (iso ? new Date(iso) : null);

const toFloatOrNull = (v) => (v ? parseFloat(v) : null);

// ─── Sub-components ─────────────────────────────────────────────────────────────

// Single label/value row used in the recap step
const SummaryRow = ({ label, value, muted, textPrimary }) => {
	if (!value) return null;
	return (
		<HStack style={{ justifyContent: "space-between", paddingVertical: 2 }}>
			<Text style={{ fontSize: 13, color: muted }}>{label}</Text>
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
	);
};

// Titled recap card with a list of label/value rows
const SummarySection = ({
	title,
	rows,
	cardStyle,
	tint,
	border,
	muted,
	textPrimary,
}) => (
	<Card style={{ ...cardStyle, borderWidth: 1, borderColor: border }}>
		<Text
			style={{
				fontSize: 12,
				fontWeight: "700",
				color: tint,
				marginBottom: 10,
				textTransform: "uppercase",
				letterSpacing: 0.5,
			}}>
			{title}
		</Text>
		<VStack space='sm'>
			{rows.map(({ label, value }) => (
				<SummaryRow
					key={label}
					label={label}
					value={value}
					muted={muted}
					textPrimary={textPrimary}
				/>
			))}
		</VStack>
	</Card>
);

// Tappable date selector showing formatted date or placeholder
const DatePickerButton = ({
	value,
	placeholder = "Sélectionner une date",
	onPress,
	bg,
	border,
	muted,
	textPrimary,
	style: extraStyle,
}) => (
	<TouchableOpacity
		onPress={onPress}
		activeOpacity={0.7}
		style={{
			backgroundColor: bg,
			borderColor: border,
			borderWidth: 1,
			borderRadius: 8,
			padding: 12,
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			...extraStyle,
		}}>
		<Icon as={CalendarDays} size='sm' style={{ color: muted }} />
		<Text style={{ color: value ? textPrimary : muted }}>
			{value ? formatDate(value) : placeholder}
		</Text>
	</TouchableOpacity>
);

// Tappable time selector button (flex: 1, centered text)
const TimePickerButton = ({ value, placeholder, onPress, bg, border, muted, textPrimary }) => (
	<TouchableOpacity
		onPress={onPress}
		activeOpacity={0.7}
		style={{
			backgroundColor: bg,
			borderColor: border,
			borderWidth: 1,
			borderRadius: 8,
			padding: 10,
			flex: 1,
			alignItems: "center",
		}}>
		<Text style={{ fontSize: 13, color: value ? textPrimary : muted }}>
			{value || placeholder}
		</Text>
	</TouchableOpacity>
);

// Clock icon + start→end time selectors in a row
const TimeRangePicker = ({
	startValue,
	endValue,
	onStartPress,
	onEndPress,
	bg,
	border,
	muted,
	textPrimary,
}) => (
	<HStack space='sm' style={{ alignItems: "center" }}>
		<Icon as={Clock} size='xs' style={{ color: muted }} />
		<TimePickerButton
			value={startValue}
			placeholder='Début'
			onPress={onStartPress}
			bg={bg}
			border={border}
			muted={muted}
			textPrimary={textPrimary}
		/>
		<Text style={{ color: muted, fontWeight: "600" }}>→</Text>
		<TimePickerButton
			value={endValue}
			placeholder='Fin'
			onPress={onEndPress}
			bg={bg}
			border={border}
			muted={muted}
			textPrimary={textPrimary}
		/>
	</HStack>
);

// Dropdown list of address autocomplete suggestions
const AddressSuggestionList = ({ results, onSelect, cardBg, border, textPrimary }) => {
	if (!results?.length) return null;
	return (
		<VStack
			style={{
				borderRadius: 8,
				overflow: "hidden",
				borderWidth: 1,
				borderColor: border,
			}}>
			{results.map((item, idx) => (
				<TouchableOpacity
					key={idx}
					onPress={() => onSelect(item)}
					activeOpacity={0.7}
					style={{
						padding: 12,
						backgroundColor: cardBg,
						borderBottomWidth: idx < results.length - 1 ? 1 : 0,
						borderBottomColor: border,
					}}>
					<Text style={{ fontSize: 14, color: textPrimary }}>
						{item.label}
					</Text>
				</TouchableOpacity>
			))}
		</VStack>
	);
};

// Confirmed address badge with pin icon
const SelectedAddressBadge = ({ address, isDark, tint }) => {
	if (!address) return null;
	return (
		<HStack
			style={{
				padding: 12,
				borderRadius: 8,
				backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
				alignItems: "center",
				gap: 8,
			}}>
			<Icon as={MapPin} size='sm' style={{ color: tint }} />
			<Text style={{ fontSize: 14, color: tint, flex: 1 }}>
				{address.label}
			</Text>
		</HStack>
	);
};

// Dashed "add" button (add vacation, add address…)
const AddDashedButton = ({ label, onPress, border, muted }) => (
	<TouchableOpacity
		onPress={onPress}
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
		<Icon as={Plus} size='sm' style={{ color: muted }} />
		<Text style={{ fontSize: 13, color: muted }}>{label}</Text>
	</TouchableOpacity>
);

// Pill-style selector (contract type, location type…)
const PillSelector = ({ options, value, onChange, tint, border, textPrimary, size = "md" }) => {
	const ph =
		size === "sm"
			? { paddingHorizontal: 14, paddingVertical: 7 }
			: { paddingHorizontal: 16, paddingVertical: 8 };
	const fs = size === "sm" ? 12 : 13;
	return (
		<HStack style={{ flexWrap: "wrap", gap: 8 }}>
			{options.map(({ value: v, label }) => {
				const active = value === v;
				return (
					<TouchableOpacity
						key={v}
						onPress={() => onChange(v)}
						activeOpacity={0.7}
						style={{
							...ph,
							borderRadius: 20,
							borderWidth: 1.5,
							borderColor: active ? tint : border,
							backgroundColor: active ? tint : "transparent",
						}}>
						<Text
							style={{
								fontSize: fs,
								fontWeight: "600",
								color: active ? "#ffffff" : textPrimary,
							}}>
							{label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</HStack>
	);
};

// Unified date/time picker actionsheet — replaces the 3 separate actionsheets
// pickerState shape: { mode: 'date'|'time', title: string, value: Date, onConfirm: (date) => void }
const PickerActionsheet = ({ pickerState, onClose, onChange, onConfirm, cardBg, tint, textPrimary }) => (
	<Actionsheet isOpen={pickerState !== null} onClose={onClose}>
		<ActionsheetBackdrop />
		<ActionsheetContent style={{ backgroundColor: cardBg }}>
			<ActionsheetDragIndicatorWrapper>
				<ActionsheetDragIndicator />
			</ActionsheetDragIndicatorWrapper>
			<VStack
				style={{ width: "100%", padding: 20, paddingBottom: 32 }}
				space='md'>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "700",
						color: textPrimary,
						textAlign: "center",
					}}>
					{pickerState?.title}
				</Text>
				<DateTimePicker
					value={pickerState?.value || new Date()}
					mode={pickerState?.mode || "date"}
					display='spinner'
					is24Hour
					minuteInterval={pickerState?.mode === "time" ? 5 : undefined}
					onChange={onChange}
					style={{ width: "100%" }}
				/>
				<Button
					onPress={onConfirm}
					style={{ backgroundColor: tint, borderRadius: 12 }}>
					<ButtonText style={{ color: "#ffffff", fontWeight: "700" }}>
						Confirmer
					</ButtonText>
				</Button>
			</VStack>
		</ActionsheetContent>
	</Actionsheet>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const ContractGenerationScreen = () => {
	const { application_id } = useLocalSearchParams();
	const { isDark } = useTheme();
	const scheme = isDark ? "dark" : "light";
	const {
		background: bg,
		cardBackground: cardBg,
		border,
		text: textPrimary,
		muted,
		tint,
		success,
		danger,
	} = Colors[scheme];

	const router = useRouter();
	const toast = useToast();
	const { accessToken } = useAuth();
	const { getById, updateApplicationStatus } = useDataContext();

	// ─── Application state ──────────────────────────────────────────────────────

	const [applicationData, setApplicationData] = useState(null);
	const [existingContractId, setExistingContractId] = useState(null);
	const [existingContractStatus, setExistingContractStatus] = useState(null);

	// ─── UI state ───────────────────────────────────────────────────────────────

	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [showReasonCodeSheet, setShowReasonCodeSheet] = useState(false);

	// Unified picker state — replaces 6 separate picker/temp-date state vars
	const [pickerState, setPickerState] = useState(null);

	// ─── Address autocomplete state ─────────────────────────────────────────────

	const [singleAddr, setSingleAddr] = useState({ query: "", results: [], selected: null });
	// Each entry: { query, results, selected }
	const [multiAddresses, setMultiAddresses] = useState([{ query: "", results: [], selected: null }]);
	const [zoneAddr, setZoneAddr] = useState({ query: "", results: [], selected: null });

	// ─── Animations ─────────────────────────────────────────────────────────────

	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null, null]);
	const currentStepRef = useRef(currentStep);
	const progressAnim = useRef(
		new Animated.Value(((currentStep - 1) / (STEPS.length - 1)) * 100),
	).current;

	// ─── Form state ─────────────────────────────────────────────────────────────

	const [formData, setFormData] = useState({
		// Step 1
		contract_type: "",
		cdd_reason_code: "",
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

	// ─── Effects ─────────────────────────────────────────────────────────────────

	useEffect(() => {
		currentStepRef.current = currentStep;
	}, [currentStep]);

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: ((currentStep - 1) / (STEPS.length - 1)) * 100,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [currentStep]);

	// Autoscroll to keep focused input above keyboard
	useEffect(() => {
		const event =
			Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const sub = Keyboard.addListener(event, (e) => {
			const focused = TextInput.State.currentlyFocusedInput?.();
			if (!focused) return;
			const scrollRef =
				scrollViewRefs.current[currentStepRef.current - 1];
			if (!scrollRef) return;
			focused.measureInWindow((x, y, width, height) => {
				const windowHeight = Dimensions.get("window").height;
				const visibleHeight = windowHeight - e.endCoordinates.height;
				const targetScrollOffset = y + height / 2 - visibleHeight / 2;
				if (targetScrollOffset > 0)
					scrollRef.scrollTo({ y: targetScrollOffset, animated: true });
			});
		});
		return () => sub.remove();
	}, []);

	// Fetch application + existing contract, then pre-fill form
	useEffect(() => {
		if (!application_id) return;

		const parseVacations = (raw) => {
			if (!raw || !Array.isArray(raw)) return [];
			return raw.map((v) => ({
				date: v.date ? new Date(v.date) : null,
				start_time: v.start_time || "",
				end_time: v.end_time || "",
			}));
		};

		const fetchApplicationData = async () => {
			try {
				const supabase = createSupabaseClient(accessToken);
				const data = await getById(
					"applications",
					application_id,
					"*,jobs(*), profiles(*), companies(*)",
				);
				setApplicationData(data);

				const { data: existingContract } = await supabase
					.from("contracts")
					.select("*")
					.eq("apply_id", application_id)
					.in("status", ["draft", "published"])
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle();

				if (existingContract) {
					setExistingContractId(existingContract.id);
					setExistingContractStatus(existingContract.status);
					const ct = existingContract;
					const schedule = ct.schedule || {};
					const wLocType = ct.work_location_type || "single";
					const wLocs =
						wLocType === "multiple"
							? (() => {
									try {
										return (
											JSON.parse(ct.work_location) || [""]
										);
									} catch {
										return [""];
									}
								})()
							: [""];

					setFormData((prev) => ({
						...prev,
						contract_type: ct.contract_type || "",
						cdd_reason_code: ct.cdd_reason_code || "",
						contract_reason: ct.contract_reason || "",
						start_date: isoToDate(ct.start_date),
						end_date: isoToDate(ct.end_date),
						total_hours:
							ct.total_hours != null ? String(ct.total_hours) : "",
						schedule_known: schedule.schedule_known ?? false,
						week_schedule: schedule.week_schedule ?? prev.week_schedule,
						vacations: parseVacations(schedule.vacations),
						work_location:
							wLocType !== "multiple" ? ct.work_location || "" : "",
						work_location_name: ct.work_location_name || "",
						work_location_type: wLocType,
						work_locations: wLocs,
						job_title: ct.job_title || "",
						job_description: ct.job_description || "",
						hourly_rate:
							ct.hourly_rate != null ? String(ct.hourly_rate) : "",
						meal_bonus:
							ct.meal_bonus != null ? String(ct.meal_bonus) : "",
						transport_bonus:
							ct.transport_bonus != null
								? String(ct.transport_bonus)
								: "",
						night_bonus:
							ct.night_bonus != null ? String(ct.night_bonus) : "",
						sunday_bonus:
							ct.sunday_bonus != null ? String(ct.sunday_bonus) : "",
						holiday_bonus:
							ct.holiday_bonus != null
								? String(ct.holiday_bonus)
								: "",
						overtime_rate:
							ct.overtime_rate != null
								? String(ct.overtime_rate)
								: "",
						is_night: ct.is_night ?? false,
						is_sunday: ct.is_sunday ?? false,
						is_holiday: ct.is_holiday ?? false,
						equipment_provided: ct.equipment_provided ?? false,
						equipment_details: ct.equipment_details || "",
						trial_period: ct.trial_period || "",
						custom_clauses: ct.custom_clauses || "",
					}));
					return;
				}

				const job = data?.jobs;
				if (!job) return;

				const mapContractType = (v) => {
					if (!v) return "";
					const upper = v.toUpperCase();
					return upper === "CDI" || upper === "CDD" ? upper : "";
				};

				const vacations = parseVacations(job.vacations);
				setFormData((prev) => ({
					...prev,
					contract_type:
						mapContractType(job.contract_type) || prev.contract_type,
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

	// ─── Form helpers ────────────────────────────────────────────────────────────

	const updateField = (field, value) =>
		setFormData((prev) => ({ ...prev, [field]: value }));

	const updateWeekDay = (day, field, value) =>
		setFormData((prev) => ({
			...prev,
			week_schedule: {
				...prev.week_schedule,
				[day]: { ...prev.week_schedule[day], [field]: value },
			},
		}));

	const addVacation = () =>
		setFormData((prev) => ({
			...prev,
			vacations: [
				...prev.vacations,
				{ date: null, start_time: "", end_time: "" },
			],
		}));

	const removeVacation = (index) =>
		setFormData((prev) => ({
			...prev,
			vacations: prev.vacations.filter((_, i) => i !== index),
		}));

	const updateVacation = (index, field, value) =>
		setFormData((prev) => {
			const updated = [...prev.vacations];
			updated[index] = { ...updated[index], [field]: value };
			return { ...prev, vacations: updated };
		});

	// ─── Address helpers ─────────────────────────────────────────────────────────

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

	const searchZone = (query) => {
		if (!query || query.length < 3) {
			setZoneAddr((p) => ({ ...p, results: [] }));
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
		setZoneAddr((p) => ({
			...p,
			results: [...depMatches, ...regMatches].slice(0, 5),
		}));
	};

	const resetAddressState = () => {
		setSingleAddr({ query: "", results: [], selected: null });
		setMultiAddresses([{ query: "", results: [], selected: null }]);
		setZoneAddr({ query: "", results: [], selected: null });
	};

	const updateMultiAddress = (i, patch) =>
		setMultiAddresses((prev) => {
			const updated = [...prev];
			updated[i] = { ...updated[i], ...patch };
			return updated;
		});

	const handleMultiAddressQuery = (i, v) => {
		updateMultiAddress(i, { query: v, selected: null });
		const ul = [...formData.work_locations];
		ul[i] = v;
		updateField("work_locations", ul);
		searchAddress(v, (results) => updateMultiAddress(i, { results }));
	};

	const handleMultiAddressSelect = (i, item) => {
		updateMultiAddress(i, { query: "", results: [], selected: item });
		const ul = [...formData.work_locations];
		ul[i] = item.label;
		updateField("work_locations", ul);
	};

	const addMultiAddress = () => {
		setMultiAddresses((prev) => [
			...prev,
			{ query: "", results: [], selected: null },
		]);
		updateField("work_locations", [...formData.work_locations, ""]);
	};

	const removeMultiAddress = (i) => {
		setMultiAddresses((prev) => prev.filter((_, idx) => idx !== i));
		updateField(
			"work_locations",
			formData.work_locations.filter((_, idx) => idx !== i),
		);
	};

	// ─── Picker helpers ──────────────────────────────────────────────────────────

	const openPicker = (mode, title, value, onConfirm) =>
		setPickerState({ mode, title, value: value || new Date(), onConfirm });

	const handlePickerChange = (_, date) => {
		if (date) setPickerState((p) => (p ? { ...p, value: date } : null));
	};

	const handlePickerConfirm = () => {
		if (pickerState) {
			pickerState.onConfirm(pickerState.value);
			setPickerState(null);
		}
	};

	// ─── Navigation helpers ──────────────────────────────────────────────────────

	const showError = (message) =>
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

	const goToNextStep = () => {
		Keyboard.dismiss();
		if (currentStep >= STEPS.length) return;
		Animated.timing(scrollX, {
			toValue: -SCREEN_WIDTH * currentStep,
			duration: 300,
			useNativeDriver: true,
		}).start();
		setCurrentStep(currentStep + 1);
		setTimeout(() => {
			scrollViewRefs.current[currentStep]?.scrollTo({
				y: 0,
				animated: true,
			});
		}, 100);
	};

	const goToPreviousStep = () => {
		Keyboard.dismiss();
		if (currentStep <= 1) return;
		Animated.timing(scrollX, {
			toValue: -SCREEN_WIDTH * (currentStep - 2),
			duration: 300,
			useNativeDriver: true,
		}).start();
		setCurrentStep(currentStep - 1);
		setTimeout(() => {
			scrollViewRefs.current[currentStep - 2]?.scrollTo({
				y: 0,
				animated: true,
			});
		}, 100);
	};

	// ─── Submit ──────────────────────────────────────────────────────────────────

	const handleSubmit = async (status = "draft") => {
		setIsSubmitting(true);
		try {
			const supabase = createSupabaseClient(accessToken);

			const payload = {
				contract_type: formData.contract_type,
				cdd_reason_code: formData.cdd_reason_code || null,
				contract_reason: formData.contract_reason || null,
				start_date: formatDateISO(formData.start_date),
				end_date: formatDateISO(formData.end_date),
				total_hours: toFloatOrNull(formData.total_hours),
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
				hourly_rate: toFloatOrNull(formData.hourly_rate),
				overtime_rate: toFloatOrNull(formData.overtime_rate),
				meal_bonus: toFloatOrNull(formData.meal_bonus),
				transport_bonus: toFloatOrNull(formData.transport_bonus),
				night_bonus: toFloatOrNull(formData.night_bonus),
				sunday_bonus: toFloatOrNull(formData.sunday_bonus),
				holiday_bonus: toFloatOrNull(formData.holiday_bonus),
				is_night: formData.is_night,
				is_sunday: formData.is_sunday,
				is_holiday: formData.is_holiday,
				equipment_provided: formData.equipment_provided,
				equipment_details: formData.equipment_details || null,
				trial_period: formData.trial_period || null,
				custom_clauses: formData.custom_clauses || null,
				status,
			};

			const snapshots = {
				company_snapshot: applicationData?.companies ?? null,
				candidate_snapshot: applicationData?.profiles ?? null,
			};

			let error;
			if (existingContractId) {
				({ error } = await supabase
					.from("contracts")
					.update({ ...payload, ...snapshots })
					.eq("id", existingContractId));
			} else {
				({ error } = await supabase.from("contracts").insert({
					...payload,
					...snapshots,
					apply_id: application_id,
					job_id: applicationData?.jobs?.id ?? null,
					company_id: applicationData?.companies?.id ?? null,
					candidate_id: applicationData?.profiles?.id ?? null,
					generated_at: new Date().toISOString(),
					isSigned: false,
					isProSigned: false,
				}));
			}

			if (error) throw error;

			if (status === "published" && existingContractStatus !== "published") {
				await updateApplicationStatus(
					application_id,
					"contract_sent",
					"company",
				);
				try {
					const candidate = applicationData?.profiles;
					const company = applicationData?.companies;
					const job = applicationData?.jobs;
					if (candidate?.email) {
						await sendRecruitmentStatusEmail(
							candidate.email,
							candidate.firstname,
							company?.name ?? "",
							"contract_sent",
							job?.title ?? "",
							"candidate",
							accessToken,
						);
					}
				} catch (emailErr) {
					console.error(
						"[ContractGen] Erreur email candidat :",
						emailErr,
					);
				}
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

	// ─── Shared styles ────────────────────────────────────────────────────────────

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
	const inputStyle = { backgroundColor: bg, borderColor: border };
	const inputTextStyle = { color: textPrimary };

	// Shared scroll view props for each step panel
	const stepScrollProps = (idx) => ({
		ref: (ref) => (scrollViewRefs.current[idx] = ref),
		style: { flex: 1 },
		contentContainerStyle: { padding: 20, paddingBottom: 120 },
		keyboardShouldPersistTaps: "handled",
		showsVerticalScrollIndicator: false,
	});

	// Shared color props forwarded to sub-components
	const colorProps = { bg, border, muted, textPrimary };

	// ─── Step renderers ──────────────────────────────────────────────────────────

	const renderStep1 = () => (
		<ScrollView {...stepScrollProps(0)}>
			{/* Contract type */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Type de contrat *</Text>
				<PillSelector
					options={CONTRACT_TYPES.map((t) => ({ value: t, label: t }))}
					value={formData.contract_type}
					onChange={(v) => updateField("contract_type", v)}
					tint={tint}
					border={border}
					textPrimary={textPrimary}
				/>
			</Card>

			{/* Motif de recours (CDD only) */}
			{(formData.contract_type === "CDD" ||
				formData.contract_type === "Intérim") && (
				<Card style={cardStyle}>
					<Text style={labelStyle}>
						Motif de recours
						{formData.contract_type === "CDD" ? " *" : ""}
					</Text>

					{/* Reason code selector */}
					<TouchableOpacity
						onPress={() => setShowReasonCodeSheet(true)}
						activeOpacity={0.7}
						style={{
							backgroundColor: bg,
							borderColor: formData.cdd_reason_code
								? tint
								: border,
							borderWidth: 1,
							borderRadius: 8,
							paddingHorizontal: 14,
							paddingVertical: 12,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 12,
						}}>
						<Text
							style={{
								fontSize: 14,
								color: formData.cdd_reason_code
									? textPrimary
									: muted,
								flex: 1,
							}}>
							{formData.cdd_reason_code
								? CDD_REASON_CODES.find(
										(r) =>
											r.value ===
											formData.cdd_reason_code,
									)?.label
								: "Sélectionner un motif…"}
						</Text>
						<Icon
							as={ChevronDown}
							size='sm'
							style={{ color: muted }}
						/>
					</TouchableOpacity>

					{/* Optional free-text precision */}
					<Text
						style={{
							fontSize: 12,
							color: muted,
							marginBottom: 6,
						}}>
						Précisions (optionnel)
					</Text>
					<Textarea style={{ ...inputStyle, minHeight: 72 }}>
						<TextareaInput
							placeholder="Ex : Remplacement de M. Dupont en congé maladie..."
							value={formData.contract_reason}
							onChangeText={(v) =>
								updateField("contract_reason", v)
							}
							style={inputTextStyle}
						/>
					</Textarea>
				</Card>
			)}

			{/* Start date */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Date de début *</Text>
				<DatePickerButton
					value={formData.start_date}
					onPress={() =>
						openPicker("date", "Date de début", formData.start_date, (date) =>
							updateField("start_date", date),
						)
					}
					{...colorProps}
				/>
			</Card>

			{/* End date (not for CDI) */}
			{formData.contract_type !== "CDI" && (
				<Card style={cardStyle}>
					<Text style={labelStyle}>
						Date de fin
						{formData.contract_type === "CDD" ? " *" : ""}
					</Text>
					<DatePickerButton
						value={formData.end_date}
						onPress={() =>
							openPicker(
								"date",
								"Date de fin",
								formData.end_date,
								(date) => updateField("end_date", date),
							)
						}
						{...colorProps}
					/>
				</Card>
			)}

			{/* Total / monthly hours */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>
					{formData.contract_type === "CDI" ||
					(formData.start_date &&
						formData.end_date &&
						formData.end_date >=
							new Date(
								new Date(formData.start_date).setMonth(
									new Date(formData.start_date).getMonth() + 1,
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

			{/* Schedule */}
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

				{/* CDI – weekly schedule */}
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
											marginBottom: formData.week_schedule[
												day
											].enabled
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
												formData.week_schedule[day].enabled
											}
											onValueChange={(v) =>
												updateWeekDay(day, "enabled", v)
											}
										/>
									</HStack>
									{formData.week_schedule[day].enabled && (
										<TimeRangePicker
											startValue={
												formData.week_schedule[day].start
											}
											endValue={
												formData.week_schedule[day].end
											}
											onStartPress={() =>
												openPicker(
													"time",
													"Heure de début",
													new Date(
														new Date().setHours(8, 0, 0, 0),
													),
													(time) =>
														updateWeekDay(
															day,
															"start",
															formatTime(time),
														),
												)
											}
											onEndPress={() =>
												openPicker(
													"time",
													"Heure de fin",
													new Date(
														new Date().setHours(
															18,
															0,
															0,
															0,
														),
													),
													(time) =>
														updateWeekDay(
															day,
															"end",
															formatTime(time),
														),
												)
											}
											{...colorProps}
										/>
									)}
								</VStack>
							))}
						</VStack>
					)}

				{/* CDD – vacations */}
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
											onPress={() => removeVacation(index)}
											activeOpacity={0.7}>
											<Icon
												as={Trash2}
												size='sm'
												style={{ color: danger }}
											/>
										</TouchableOpacity>
									</HStack>
									<DatePickerButton
										value={vacation.date}
										placeholder='Date de la vacation'
										onPress={() =>
											openPicker(
												"date",
												"Date de la vacation",
												vacation.date,
												(date) =>
													updateVacation(
														index,
														"date",
														date,
													),
											)
										}
										style={{ padding: 10, marginBottom: 8 }}
										{...colorProps}
									/>
									<TimeRangePicker
										startValue={vacation.start_time}
										endValue={vacation.end_time}
										onStartPress={() =>
											openPicker(
												"time",
												"Heure de début",
												new Date(
													new Date().setHours(8, 0, 0, 0),
												),
												(time) =>
													updateVacation(
														index,
														"start_time",
														formatTime(time),
													),
											)
										}
										onEndPress={() =>
											openPicker(
												"time",
												"Heure de fin",
												new Date(
													new Date().setHours(18, 0, 0, 0),
												),
												(time) =>
													updateVacation(
														index,
														"end_time",
														formatTime(time),
													),
											)
										}
										{...colorProps}
									/>
								</Card>
							))}
							<AddDashedButton
								label='Ajouter une vacation'
								onPress={addVacation}
								border={border}
								muted={muted}
							/>
						</VStack>
					)}
			</Card>
		</ScrollView>
	);

	// Address sub-renderers (called from renderStep2)

	const renderSingleAddress = () => (
		<VStack space='sm'>
			<Input style={inputStyle}>
				<InputField
					placeholder='Rechercher une adresse...'
					value={singleAddr.query}
					onChangeText={(v) => {
						setSingleAddr((p) => ({ ...p, query: v, selected: null }));
						updateField("work_location", v);
						searchAddress(v, (results) =>
							setSingleAddr((p) => ({ ...p, results })),
						);
					}}
					style={inputTextStyle}
				/>
			</Input>
			<AddressSuggestionList
				results={singleAddr.results}
				onSelect={(item) => {
					setSingleAddr({ query: "", results: [], selected: item });
					updateField("work_location", item.label);
				}}
				cardBg={cardBg}
				border={border}
				textPrimary={textPrimary}
			/>
			<SelectedAddressBadge
				address={singleAddr.selected}
				isDark={isDark}
				tint={tint}
			/>
		</VStack>
	);

	const renderMultiAddress = () => (
		<VStack space='sm'>
			{multiAddresses.map((addr, i) => (
				<VStack key={i} space='xs'>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Input style={{ ...inputStyle, flex: 1 }}>
							<InputField
								placeholder={`Rechercher adresse ${i + 1}...`}
								value={addr.query}
								onChangeText={(v) =>
									handleMultiAddressQuery(i, v)
								}
								style={inputTextStyle}
							/>
						</Input>
						{multiAddresses.length > 1 && (
							<TouchableOpacity
								onPress={() => removeMultiAddress(i)}
								activeOpacity={0.7}>
								<Icon
									as={Trash2}
									size='sm'
									style={{ color: danger }}
								/>
							</TouchableOpacity>
						)}
					</HStack>
					<AddressSuggestionList
						results={addr.results}
						onSelect={(item) => handleMultiAddressSelect(i, item)}
						cardBg={cardBg}
						border={border}
						textPrimary={textPrimary}
					/>
					<SelectedAddressBadge
						address={addr.selected}
						isDark={isDark}
						tint={tint}
					/>
				</VStack>
			))}
			<AddDashedButton
				label='Ajouter une adresse'
				onPress={addMultiAddress}
				border={border}
				muted={muted}
			/>
		</VStack>
	);

	const renderZoneAddress = () => (
		<VStack space='sm'>
			<Input style={inputStyle}>
				<InputField
					placeholder='Rechercher un département ou une région...'
					value={zoneAddr.query}
					onChangeText={(v) => {
						setZoneAddr((p) => ({ ...p, query: v, selected: null }));
						updateField("work_location", v);
						searchZone(v);
					}}
					style={inputTextStyle}
				/>
			</Input>
			{zoneAddr.results.length > 0 && (
				<VStack
					style={{
						borderRadius: 8,
						overflow: "hidden",
						borderWidth: 1,
						borderColor: border,
					}}>
					{zoneAddr.results.map((item, idx) => (
						<TouchableOpacity
							key={idx}
							onPress={() => {
								setZoneAddr({
									query: "",
									results: [],
									selected: item,
								});
								updateField("work_location", item.label);
							}}
							activeOpacity={0.7}
							style={{
								padding: 12,
								backgroundColor: cardBg,
								borderBottomWidth:
									idx < zoneAddr.results.length - 1 ? 1 : 0,
								borderBottomColor: border,
							}}>
							<HStack style={{ alignItems: "center", gap: 8 }}>
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
									{item.type === "reg" ? "RÉG" : "DEP"}
								</Text>
								<Text
									style={{ fontSize: 14, color: textPrimary }}>
									{item.label}
								</Text>
							</HStack>
						</TouchableOpacity>
					))}
				</VStack>
			)}
			{zoneAddr.selected && (
				<HStack
					style={{
						padding: 12,
						borderRadius: 8,
						backgroundColor: isDark
							? zoneAddr.selected.type === "reg"
								? "#3b1f6f"
								: "#1e3a5f"
							: zoneAddr.selected.type === "reg"
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
								zoneAddr.selected.type === "reg"
									? "#8b5cf6"
									: tint,
						}}
					/>
					<Text
						style={{
							fontSize: 14,
							flex: 1,
							color:
								zoneAddr.selected.type === "reg"
									? isDark
										? "#c4b5fd"
										: "#7c3aed"
									: tint,
						}}>
						{zoneAddr.selected.label}
					</Text>
				</HStack>
			)}
		</VStack>
	);

	const renderStep2 = () => (
		<ScrollView {...stepScrollProps(1)}>
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
				<PillSelector
					options={LOCATION_TYPES}
					value={formData.work_location_type}
					onChange={(v) => {
						updateField("work_location_type", v);
						updateField("work_location", "");
						updateField("work_locations", [""]);
						updateField("work_location_name", "");
						resetAddressState();
					}}
					tint={tint}
					border={border}
					textPrimary={textPrimary}
					size='sm'
				/>

				<Box style={{ marginTop: 12 }}>
					{formData.work_location_type === "single" &&
						renderSingleAddress()}
					{formData.work_location_type === "multiple" &&
						renderMultiAddress()}
					{formData.work_location_type === "zone" &&
						renderZoneAddress()}
				</Box>
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

	const renderStep3 = () => (
		<ScrollView {...stepScrollProps(2)}>
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
				<Text style={labelStyle}>
					Taux heures supplémentaires (€)
				</Text>
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

			<Card style={cardStyle}>
				<Text style={{ ...labelStyle, marginBottom: 12 }}>Primes</Text>
				<VStack space='md'>
					{BONUS_FIELDS.map(({ key, label }) => (
						<VStack key={key} space='xs'>
							<Text style={{ fontSize: 12, color: muted }}>
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

			<Card style={cardStyle}>
				<Text style={{ ...labelStyle, marginBottom: 12 }}>
					Conditions particulières
				</Text>
				<VStack space='md'>
					{CONDITION_FIELDS.map(({ key, label }) => (
						<HStack
							key={key}
							style={{
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<Text
								style={{ color: textPrimary, fontSize: 14 }}>
								{label}
							</Text>
							<Switch
								value={formData[key]}
								onValueChange={(v) => updateField(key, v)}
								trackColor={{ false: border, true: tint }}
							/>
						</HStack>
					))}
				</VStack>
			</Card>
		</ScrollView>
	);

	const renderStep4 = () => (
		<ScrollView {...stepScrollProps(3)}>
			<Card style={cardStyle}>
				<HStack
					style={{
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text style={labelStyle}>
						Équipement fourni par l'employeur
					</Text>
					<Switch
						value={formData.equipment_provided}
						onValueChange={(v) =>
							updateField("equipment_provided", v)
						}
						trackColor={{ false: border, true: tint }}
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

			<Card style={{ ...cardStyle, paddingBottom: 60 }}>
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

	const renderStep5 = () => {
		const scheduleValue = !formData.schedule_known
			? "Non communiqué"
			: formData.contract_type === "CDI"
				? Object.entries(formData.week_schedule)
						.filter(([, v]) => v.enabled)
						.map(
							([d, v]) =>
								`${d.slice(0, 3)}${v.start ? ` ${v.start}→${v.end}` : ""}`,
						)
						.join(", ") || "Aucun jour"
				: formData.vacations.length
					? `${formData.vacations.length} vacation(s)`
					: "Aucune vacation";

		const locationValue =
			formData.work_location_type === "multiple"
				? formData.work_locations.filter((a) => a.trim()).join(", ") ||
					null
				: formData.work_location || null;

		const sectionProps = { cardStyle, tint, border, muted, textPrimary };

		return (
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
					<Text style={{ fontSize: 13, color: muted }}>
						Confirmez avant de générer le contrat.
					</Text>
				</VStack>

				<SummarySection
					title='Contrat'
					rows={[
						{ label: "Type", value: formData.contract_type },
						{
							label: "Motif",
							value: formData.cdd_reason_code
								? CDD_REASON_CODES.find(
										(r) =>
											r.value ===
											formData.cdd_reason_code,
									)?.label ?? null
								: null,
						},
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
						{ label: "Planning", value: scheduleValue },
					]}
					{...sectionProps}
				/>

				<SummarySection
					title='Poste'
					rows={[
						{ label: "Intitulé", value: formData.job_title },
						{ label: "Lieu", value: locationValue },
						{
							label: "Description",
							value: formData.job_description,
						},
					]}
					{...sectionProps}
				/>

				<SummarySection
					title='Rémunération'
					rows={[
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
					]}
					{...sectionProps}
				/>

				<SummarySection
					title='Clauses & Équipement'
					rows={[
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
					]}
					{...sectionProps}
				/>
			</ScrollView>
		);
	};

	// ─── Render ──────────────────────────────────────────────────────────────────

	return (
		<>
			<KeyboardAvoidingView
				behavior='height'
				style={{ flex: 1 }}
				keyboardVerticalOffset={80}>
				<Box style={{ flex: 1, backgroundColor: bg }}>
					{/* Progress bar */}
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
								<Text style={{ fontSize: 12, color: muted }}>
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

					{/* Steps — all rendered, translated off-screen */}
					<Box style={{ flex: 1, overflow: "hidden" }}>
						<Animated.View
							style={{
								flex: 1,
								flexDirection: "row",
								width: SCREEN_WIDTH * STEPS.length,
								transform: [{ translateX: scrollX }],
							}}>
							{[
								renderStep1,
								renderStep2,
								renderStep3,
								renderStep4,
								renderStep5,
							].map((render, i) => (
								<Box key={i} style={{ width: SCREEN_WIDTH }}>
									{render()}
								</Box>
							))}
						</Animated.View>
					</Box>
				</Box>
			</KeyboardAvoidingView>

			{/* Bottom navigation */}
			<Box
				style={{
					padding: 16,
					paddingBottom: Platform.OS === "ios" ? 32 : 20,
					backgroundColor: bg,
					borderTopWidth: 1,
					borderTopColor: border,
				}}>
				<HStack space='md'>
					{currentStep > 1 && (
						<Button
							variant='outline'
							onPress={goToPreviousStep}
							style={{ flex: 1, borderColor: border }}>
							<ButtonIcon
								as={ChevronLeft}
								style={{ color: textPrimary }}
							/>
							<ButtonText style={{ color: textPrimary }}>
								Précédent
							</ButtonText>
						</Button>
					)}
					{currentStep < STEPS.length ? (
						<Button
							onPress={validateStep}
							disabled={isSubmitting}
							style={{ flex: 2, backgroundColor: tint }}>
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

			{/* Confirm dialog */}
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
							style={{ flex: 1, borderColor: border }}>
							<ButtonText style={{ color: textPrimary }}>
								Annuler
							</ButtonText>
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* CDD reason code selector */}
			<Actionsheet
				isOpen={showReasonCodeSheet}
				onClose={() => setShowReasonCodeSheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent style={{ backgroundColor: cardBg }}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack
						style={{
							width: "100%",
							padding: 20,
							paddingBottom: 32,
						}}
						space='sm'>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "700",
								color: textPrimary,
								textAlign: "center",
								marginBottom: 8,
							}}>
							Motif de recours
						</Text>
						{CDD_REASON_CODES.map(({ value, label }) => {
							const selected =
								formData.cdd_reason_code === value;
							return (
								<TouchableOpacity
									key={value}
									onPress={() => {
										updateField("cdd_reason_code", value);
										setShowReasonCodeSheet(false);
									}}
									activeOpacity={0.7}
									style={{
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "space-between",
										paddingVertical: 14,
										paddingHorizontal: 16,
										borderRadius: 12,
										borderWidth: 1.5,
										borderColor: selected ? tint : border,
										backgroundColor: selected
											? isDark
												? "#1e3a5f"
												: "#eff6ff"
											: "transparent",
									}}>
									<Text
										style={{
											fontSize: 14,
											fontWeight: selected ? "600" : "400",
											color: selected ? tint : textPrimary,
											flex: 1,
										}}>
										{label}
									</Text>
									{selected && (
										<Icon
											as={CheckCircle}
											size='sm'
											style={{ color: tint }}
										/>
									)}
								</TouchableOpacity>
							);
						})}
					</VStack>
				</ActionsheetContent>
			</Actionsheet>

			{/* Unified date/time picker — replaces 3 separate actionsheets */}
			<PickerActionsheet
				pickerState={pickerState}
				onClose={() => setPickerState(null)}
				onChange={handlePickerChange}
				onConfirm={handlePickerConfirm}
				cardBg={cardBg}
				tint={tint}
				textPrimary={textPrimary}
			/>
		</>
	);
};

export default ContractGenerationScreen;
