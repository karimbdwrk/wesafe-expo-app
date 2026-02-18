import React, { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";

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
	Radio,
	RadioGroup,
	RadioIcon,
	RadioIndicator,
	RadioLabel,
} from "@/components/ui/radio";

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
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

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

const PostJob = () => {
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();
	const { create } = useDataContext();
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [missionsList, setMissionsList] = useState([]);
	const [currentMission, setCurrentMission] = useState("");
	const [profileList, setProfileList] = useState([]);
	const [currentProfile, setCurrentProfile] = useState("");
	const [formData, setFormData] = useState({
		title: "",
		category: "",
		description: "",
		city: "",
		postcode: "",
		department_code: "",
		contract_type: "CDI",
		work_time: "Temps plein",
		work_schedule: "Jour",
		start_date: "",
		end_date: "",
		salary_type: "mois",
		salary_amount: "",
		weekly_hours: "",
		experience_required: "",
		diplomas_required: "",
		isLastMinute: false,
	});

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
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

	const removeProfile = (index) => {
		setProfileList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async () => {
		// Validation
		if (
			!formData.title ||
			!formData.category ||
			!formData.city ||
			!formData.start_date
		) {
			toast.error("Erreur", {
				description: "Veuillez remplir tous les champs obligatoires",
			});
			return;
		}

		// Validation date de fin pour CDD/Intérim/Vacation
		if (formData.contract_type !== "CDI" && !formData.end_date) {
			toast.error("Erreur", {
				description:
					"La date de fin est obligatoire pour ce type de contrat",
			});
			return;
		}

		setLoading(true);
		try {
			// Convertir les listes en strings (une par ligne)
			const missionsString = missionsList.join("\n");
			const profileString = profileList.join("\n");

			// Construire le string de salaire
			let salaryString = "";
			if (formData.salary_amount) {
				salaryString = `${formData.salary_amount}€/${formData.salary_type}`;
				if (formData.weekly_hours) {
					salaryString += ` - ${formData.weekly_hours}h/semaine`;
				}
			}

			await create("jobs", {
				...formData,
				missions: missionsString,
				profile_sought: profileString,
				salary: salaryString,
				company_id: user.id,
				isArchived: false,
			});

			toast.success("Offre publiée", {
				description: "Votre offre d'emploi a été publiée avec succès",
			});

			router.back();
		} catch (error) {
			console.error("Erreur création offre:", error);
			toast.error("Erreur", {
				description: "Impossible de publier l'offre",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 100 }}>
					{/* Header */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: "#dbeafe",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={Briefcase}
										size='xl'
										style={{ color: "#2563eb" }}
									/>
								</Box>
								<VStack style={{ flex: 1 }}>
									<Heading
										size='xl'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Nouvelle offre
									</Heading>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Publiez une offre d'emploi
									</Text>
								</VStack>
							</HStack>
						</VStack>
					</Card>

					{/* Informations principales */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<Heading
								size='md'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Informations principales
							</Heading>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* Titre */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
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
										color: isDark ? "#f3f4f6" : "#111827",
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
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Description du poste
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
											updateField("description", value)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Textarea>
							</VStack>

							{/* Missions */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Missions principales
								</Text>
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
											onChangeText={setCurrentMission}
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
									<VStack space='xs' style={{ marginTop: 8 }}>
										{missionsList.map((mission, index) => (
											<HStack
												key={index}
												space='sm'
												style={{
													alignItems: "center",
													padding: 8,
													backgroundColor: isDark
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
														removeMission(index)
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
										))}
									</VStack>
								)}
							</VStack>
						</VStack>
					</Card>

					{/* Localisation */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={MapPin}
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
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

							{/* Ville */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Ville *
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
										placeholder='Ex: Paris'
										value={formData.city}
										onChangeText={(value) =>
											updateField("city", value)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							<HStack space='md'>
								{/* Code postal */}
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Code postal
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
											placeholder='75001'
											value={formData.postcode}
											onChangeText={(value) =>
												updateField("postcode", value)
											}
											keyboardType='numeric'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
										/>
									</Input>
								</VStack>

								{/* Département */}
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Département
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
											placeholder='75'
											value={formData.department_code}
											onChangeText={(value) =>
												updateField(
													"department_code",
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
								</VStack>
							</HStack>
						</VStack>
					</Card>

					{/* Conditions */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={FileText}
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Conditions
								</Heading>
							</HStack>

							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{/* Type de contrat */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Type de contrat
								</Text>
								<RadioGroup
									value={formData.contract_type}
									onChange={(value) =>
										updateField("contract_type", value)
									}>
									<HStack
										space='lg'
										style={{ flexWrap: "wrap" }}>
										{CONTRACT_TYPES.map((type) => (
											<Radio
												key={type}
												value={type}
												size='md'>
												<RadioIndicator
													style={{
														borderColor: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													<RadioIcon
														style={{
															color: "#3b82f6",
														}}
													/>
												</RadioIndicator>
												<RadioLabel
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{type}
												</RadioLabel>
											</Radio>
										))}
									</HStack>
								</RadioGroup>
							</VStack>

							{/* Dates */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Date de début *
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
										placeholder='JJ/MM/AAAA'
										value={formData.start_date}
										onChangeText={(value) =>
											updateField("start_date", value)
										}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
							</VStack>

							{/* Date de fin (seulement si CDD, Intérim ou Vacation) */}
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
											placeholder='JJ/MM/AAAA'
											value={formData.end_date}
											onChangeText={(value) =>
												updateField("end_date", value)
											}
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
										/>
									</Input>
								</VStack>
							)}

							{/* Temps de travail */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Temps de travail
								</Text>
								<RadioGroup
									value={formData.work_time}
									onChange={(value) =>
										updateField("work_time", value)
									}>
									<HStack space='lg'>
										{WORK_TIME.map((time) => (
											<Radio
												key={time}
												value={time}
												size='md'>
												<RadioIndicator
													style={{
														borderColor: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													<RadioIcon
														style={{
															color: "#3b82f6",
														}}
													/>
												</RadioIndicator>
												<RadioLabel
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{time}
												</RadioLabel>
											</Radio>
										))}
									</HStack>
								</RadioGroup>
							</VStack>

							{/* Horaires de travail */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Horaires de travail
								</Text>
								<RadioGroup
									value={formData.work_schedule}
									onChange={(value) =>
										updateField("work_schedule", value)
									}>
									<HStack space='lg'>
										{WORK_SCHEDULE.map((schedule) => (
											<Radio
												key={schedule}
												value={schedule}
												size='md'>
												<RadioIndicator
													style={{
														borderColor: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													<RadioIcon
														style={{
															color: "#3b82f6",
														}}
													/>
												</RadioIndicator>
												<RadioLabel
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{schedule}
												</RadioLabel>
											</Radio>
										))}
									</HStack>
								</RadioGroup>
							</VStack>

							{/* Salaire */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Type de rémunération
								</Text>
								<RadioGroup
									value={formData.salary_type}
									onChange={(value) =>
										updateField("salary_type", value)
									}>
									<HStack space='lg'>
										<Radio value='heure' size='md'>
											<RadioIndicator
												style={{
													borderColor: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												<RadioIcon
													style={{
														color: "#3b82f6",
													}}
												/>
											</RadioIndicator>
											<RadioLabel
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												À l'heure
											</RadioLabel>
										</Radio>
										<Radio value='mois' size='md'>
											<RadioIndicator
												style={{
													borderColor: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												<RadioIcon
													style={{
														color: "#3b82f6",
													}}
												/>
											</RadioIndicator>
											<RadioLabel
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Au mois
											</RadioLabel>
										</Radio>
									</HStack>
								</RadioGroup>
							</VStack>

							<HStack space='md'>
								{/* Montant du salaire */}
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Montant (€)
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
											placeholder={
												formData.salary_type === "heure"
													? "Ex: 15"
													: "Ex: 2000"
											}
											value={formData.salary_amount}
											onChangeText={(value) =>
												updateField(
													"salary_amount",
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
								</VStack>

								{/* Heures par semaine */}
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Heures/semaine
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
											value={formData.weekly_hours}
											onChangeText={(value) =>
												updateField(
													"weekly_hours",
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
								</VStack>
							</HStack>
						</VStack>
					</Card>

					{/* Profil recherché */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={Users}
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}
								/>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
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

							{/* Compétences */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Compétences et qualifications
								</Text>
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
											onChangeText={setCurrentProfile}
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
									<VStack space='xs' style={{ marginTop: 8 }}>
										{profileList.map((profile, index) => (
											<HStack
												key={index}
												space='sm'
												style={{
													alignItems: "center",
													padding: 8,
													backgroundColor: isDark
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
														removeProfile(index)
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
										))}
									</VStack>
								)}
							</VStack>

							{/* Expérience */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Expérience requise
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
										placeholder='Ex: 2 ans minimum'
										value={formData.experience_required}
										onChangeText={(value) =>
											updateField(
												"experience_required",
												value,
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

							{/* Diplômes */}
							<VStack space='xs'>
								<Text
									size='sm'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Diplômes requis
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
										placeholder='Ex: SSIAP 1, CQP APS'
										value={formData.diplomas_required}
										onChangeText={(value) =>
											updateField(
												"diplomas_required",
												value,
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
					</Card>

					{/* Options */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<Heading
								size='md'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Options
							</Heading>

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
								<HStack
									space='sm'
									style={{ alignItems: "center", flex: 1 }}>
									<Icon
										as={Timer}
										size='lg'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
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
											Visible avec un badge urgence
										</Text>
									</VStack>
								</HStack>
								<Switch
									value={formData.isLastMinute}
									onValueChange={(value) =>
										updateField("isLastMinute", value)
									}
									trackColor={{
										false: isDark ? "#4b5563" : "#d1d5db",
										true: "#3b82f6",
									}}
								/>
							</HStack>
						</VStack>
					</Card>

					{/* Boutons d'action */}
					<HStack space='md'>
						<Button
							variant='outline'
							size='lg'
							onPress={() => router.back()}
							style={{
								flex: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<ButtonIcon
								as={X}
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}
							/>
							<ButtonText
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Annuler
							</ButtonText>
						</Button>
						<Button
							size='lg'
							onPress={handleSubmit}
							isDisabled={loading}
							style={{
								flex: 1,
								backgroundColor: "#3b82f6",
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
				</VStack>
			</ScrollView>
		</Box>
	);
};

export default PostJob;
