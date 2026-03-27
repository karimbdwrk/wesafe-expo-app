import React, { useState, useRef, useEffect } from "react";
import {
	ScrollView,
	Platform,
	TouchableOpacity,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
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
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import { Badge, BadgeText } from "@/components/ui/badge";

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

import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
	{ id: 1, title: "Informations du contrat" },
	{ id: 2, title: "Poste & Lieu de travail" },
	{ id: 3, title: "Rémunération" },
	{ id: 4, title: "Clauses & Équipement" },
	{ id: 5, title: "Récapitulatif" },
];

const CONTRACT_TYPES = ["CDD", "CDI", "Intérim", "Saisonnier"];

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
	const router = useRouter();
	const toast = useToast();

	const [currentStep, setCurrentStep] = useState(1);
	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);

	const scrollX = useRef(new Animated.Value(0)).current;
	const scrollViewRefs = useRef([null, null, null, null, null]);

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
		schedule: [],
		// Step 2
		work_location: "",
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
		equipment_provided: true,
		equipment_details: "",
		trial_period: "",
		custom_clauses: "",
	});

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const toggleScheduleDay = (day) => {
		setFormData((prev) => {
			const current = prev.schedule;
			if (current.includes(day)) {
				return { ...prev, schedule: current.filter((d) => d !== day) };
			}
			return { ...prev, schedule: [...current, day] };
		});
	};

	const goToNextStep = () => {
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
				<Toast nativeID={id} action='muted' variant='outline'>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Icon as={AlertCircle} className='text-red-500' />
						<VStack>
							<ToastTitle>{message}</ToastTitle>
							{/* <ToastDescription>
                                Veuillez remplir le nom, le SIRET {"\n"}et
                                l'email de l'entreprise.
                            </ToastDescription> */}
						</VStack>
					</HStack>
				</Toast>
			),
		});
	};

	const validateStep = () => {
		if (currentStep === 1) {
			if (!formData.contract_type)
				return showError("Veuillez choisir un type de contrat");
			if (!formData.start_date)
				return showError("Veuillez saisir une date de début");
		}
		if (currentStep === 2) {
			if (!formData.job_title.trim())
				return showError("Veuillez saisir l'intitulé du poste");
			if (!formData.work_location.trim())
				return showError("Veuillez saisir le lieu de travail");
		}
		if (currentStep === 3) {
			if (!formData.hourly_rate)
				return showError("Veuillez saisir le taux horaire");
		}
		goToNextStep();
	};

	const handleSubmit = () => {
		console.log("Contract form data:", formData);
		toast.show({
			placement: "top",
			render: ({ id }) => (
				<Toast nativeID={id} action='muted' variant='outline'>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Icon as={CheckCircle} className='text-green-500' />
						<VStack>
							<ToastTitle>Contrat généré avec succès</ToastTitle>
							{/* <ToastDescription>
								Les informations ont été enregistrées avec
								succès.
							</ToastDescription> */}
						</VStack>
					</HStack>
				</Toast>
			),
		});
	};

	const formatDate = (date) => {
		if (!date) return "";
		return date.toLocaleDateString("fr-FR");
	};

	// ─── Styles partagés ───────────────────────────────────────────────────────
	const cardStyle = {
		backgroundColor: isDark ? "#374151" : "#ffffff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	};
	const labelStyle = {
		fontSize: 13,
		fontWeight: "600",
		color: isDark ? "#d1d5db" : "#374151",
		marginBottom: 6,
	};
	const inputStyle = {
		backgroundColor: isDark ? "#1f2937" : "#f9fafb",
		borderColor: isDark ? "#4b5563" : "#d1d5db",
	};
	const inputTextStyle = { color: isDark ? "#f3f4f6" : "#111827" };

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
										? "#3b82f6"
										: isDark
											? "#4b5563"
											: "#d1d5db",
								backgroundColor:
									formData.contract_type === type
										? "#3b82f6"
										: "transparent",
							}}>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color:
										formData.contract_type === type
											? "#ffffff"
											: isDark
												? "#d1d5db"
												: "#374151",
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
					<Text style={labelStyle}>Motif de recours</Text>
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
					onPress={() => setShowStartDatePicker(true)}
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
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
					/>
					<Text
						style={{
							color: formData.start_date
								? isDark
									? "#f3f4f6"
									: "#111827"
								: isDark
									? "#6b7280"
									: "#9ca3af",
						}}>
						{formData.start_date
							? formatDate(formData.start_date)
							: "Sélectionner une date"}
					</Text>
				</TouchableOpacity>
				{showStartDatePicker && (
					<DateTimePicker
						value={formData.start_date || new Date()}
						mode='date'
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={(_, date) => {
							setShowStartDatePicker(false);
							if (date) updateField("start_date", date);
						}}
					/>
				)}
			</Card>

			{formData.contract_type !== "CDI" && (
				<Card style={cardStyle}>
					<Text style={labelStyle}>Date de fin</Text>
					<TouchableOpacity
						onPress={() => setShowEndDatePicker(true)}
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
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
						/>
						<Text
							style={{
								color: formData.end_date
									? isDark
										? "#f3f4f6"
										: "#111827"
									: isDark
										? "#6b7280"
										: "#9ca3af",
							}}>
							{formData.end_date
								? formatDate(formData.end_date)
								: "Sélectionner une date"}
						</Text>
					</TouchableOpacity>
					{showEndDatePicker && (
						<DateTimePicker
							value={formData.end_date || new Date()}
							mode='date'
							display={
								Platform.OS === "ios" ? "spinner" : "default"
							}
							onChange={(_, date) => {
								setShowEndDatePicker(false);
								if (date) updateField("end_date", date);
							}}
						/>
					)}
				</Card>
			)}

			{/* Durée hebdomadaire */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Nombre d'heures total</Text>
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

			{/* Jours de travail */}
			<Card style={cardStyle}>
				<Text style={labelStyle}>Jours travaillés</Text>
				<HStack style={{ flexWrap: "wrap", gap: 8 }}>
					{WEEK_DAYS.map((day) => (
						<TouchableOpacity
							key={day}
							onPress={() => toggleScheduleDay(day)}
							activeOpacity={0.7}
							style={{
								paddingHorizontal: 12,
								paddingVertical: 6,
								borderRadius: 16,
								borderWidth: 1.5,
								borderColor: formData.schedule.includes(day)
									? "#3b82f6"
									: isDark
										? "#4b5563"
										: "#d1d5db",
								backgroundColor: formData.schedule.includes(day)
									? "#3b82f6"
									: "transparent",
							}}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color: formData.schedule.includes(day)
										? "#ffffff"
										: isDark
											? "#d1d5db"
											: "#374151",
								}}>
								{day.slice(0, 3)}
							</Text>
						</TouchableOpacity>
					))}
				</HStack>
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
				<Text style={labelStyle}>Lieu de travail *</Text>
				<Input style={inputStyle}>
					<InputField
						placeholder="Ex : Centre commercial Grand Place, Villeneuve-d'Ascq"
						value={formData.work_location}
						onChangeText={(v) => updateField("work_location", v)}
						style={inputTextStyle}
					/>
				</Input>
			</Card>

			<Card style={cardStyle}>
				<Text style={labelStyle}>Description des missions</Text>
				<Textarea style={{ ...inputStyle, minHeight: 120 }}>
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
									color: isDark ? "#9ca3af" : "#6b7280",
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
									color: isDark ? "#d1d5db" : "#374151",
									fontSize: 14,
								}}>
								{label}
							</Text>
							<Switch
								value={formData[key]}
								onValueChange={(v) => updateField(key, v)}
								trackColor={{
									false: isDark ? "#4b5563" : "#d1d5db",
									true: "#3b82f6",
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
						marginBottom: 12,
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
							false: isDark ? "#4b5563" : "#d1d5db",
							true: "#3b82f6",
						}}
					/>
				</HStack>
				{formData.equipment_provided && (
					<>
						<Text
							style={{
								fontSize: 12,
								color: isDark ? "#9ca3af" : "#6b7280",
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
						color: isDark ? "#f3f4f6" : "#111827",
					}}>
					Vérifiez les informations
				</Text>
				<Text
					style={{
						fontSize: 13,
						color: isDark ? "#9ca3af" : "#6b7280",
					}}>
					Confirmez avant de générer le contrat.
				</Text>
			</VStack>

			<Card
				style={{
					...cardStyle,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: isDark ? "#93c5fd" : "#1d4ed8",
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
							label: "Jours travaillés",
							value:
								formData.schedule && formData.schedule.length
									? formData.schedule
											.map((d) => d.slice(0, 3))
											.join(", ")
									: null,
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
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
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
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: isDark ? "#93c5fd" : "#1d4ed8",
						marginBottom: 10,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}>
					Poste
				</Text>
				<VStack space='sm'>
					{[
						{ label: "Intitulé", value: formData.job_title },
						{ label: "Lieu", value: formData.work_location },
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
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
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
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: isDark ? "#93c5fd" : "#1d4ed8",
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
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
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
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "700",
						color: isDark ? "#93c5fd" : "#1d4ed8",
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
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{label}
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
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
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
			keyboardVerticalOffset={80}>
			<Box
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}>
				{/* ── Progress Bar ── */}
				<Box
					style={{
						paddingTop: 14,
						paddingHorizontal: 20,
						paddingBottom: 14,
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderBottomWidth: 1,
						borderBottomColor: isDark ? "#4b5563" : "#e5e7eb",
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
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								{STEPS[currentStep - 1].title}
							</Text>
							<Text
								style={{
									fontSize: 12,
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Étape {currentStep}/{STEPS.length}
							</Text>
						</HStack>
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

				{/* ── Bottom Fixed Navigation ── */}
				<Box
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						padding: 16,
						paddingBottom: Platform.OS === "ios" ? 32 : 20,
						backgroundColor: isDark ? "#1f2937" : "#f9fafb",
						borderTopWidth: 1,
						borderTopColor: isDark ? "#374151" : "#e5e7eb",
					}}>
					<HStack space='md'>
						{currentStep > 1 ? (
							<Button
								variant='outline'
								onPress={goToPreviousStep}
								style={{
									flex: 1,
									borderColor: isDark ? "#4b5563" : "#d1d5db",
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
						) : (
							<Button
								variant='outline'
								onPress={() => router.back()}
								style={{
									flex: 1,
									borderColor: isDark ? "#4b5563" : "#d1d5db",
								}}>
								<ButtonText
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Annuler
								</ButtonText>
							</Button>
						)}

						{currentStep < STEPS.length ? (
							<Button
								onPress={validateStep}
								style={{ flex: 2, backgroundColor: "#3b82f6" }}>
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
								onPress={handleSubmit}
								style={{ flex: 2, backgroundColor: "#16a34a" }}>
								<ButtonIcon
									as={CheckCircle}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText style={{ color: "#ffffff" }}>
									Générer le contrat
								</ButtonText>
							</Button>
						)}
					</HStack>
				</Box>
			</Box>
		</KeyboardAvoidingView>
	);
};

export default ContractGenerationScreen;
