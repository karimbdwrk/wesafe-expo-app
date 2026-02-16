import React, { useState, useCallback } from "react";
import {
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Divider } from "@/components/ui/divider";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectTrigger,
	SelectInput,
	SelectIcon,
	SelectPortal,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectItem,
} from "@/components/ui/select";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
import {
	Plus,
	Calendar,
	MapPin,
	Briefcase,
	Edit,
	Trash2,
	ChevronDownIcon,
	X,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const EXPERIENCE_CATEGORIES = [
	{ label: "Sécurité", value: "Sécurité" },
	{ label: "Agent de sécurité", value: "Agent de sécurité" },
	{ label: "Agent cynophile", value: "Agent cynophile" },
	{ label: "Rondier", value: "Rondier" },
	{ label: "SSIAP", value: "SSIAP" },
	{ label: "Surveillance", value: "Surveillance" },
	{ label: "Accueil", value: "Accueil" },
	{ label: "Autre", value: "Autre" },
];

const CurriculumScreen = () => {
	const { user } = useAuth();
	const { getAll, create, update, remove } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();
	const router = useRouter();

	const [experiences, setExperiences] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [expToDelete, setExpToDelete] = useState(null);

	// États pour le formulaire
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [title, setTitle] = useState("");
	const [company, setCompany] = useState("");
	const [location, setLocation] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [category, setCategory] = useState("");
	const [isStartDatePickerVisible, setStartDatePickerVisibility] =
		useState(false);
	const [isEndDatePickerVisible, setEndDatePickerVisibility] =
		useState(false);

	const loadData = async () => {
		try {
			const { data } = await getAll(
				"experiences",
				"*",
				`&profile_id=eq.${user.id}`,
				1,
				100,
				"start_date.desc",
			);
			setExperiences(data || []);
		} catch (error) {
			console.error("Erreur chargement expériences:", error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	const resetForm = () => {
		setTitle("");
		setCompany("");
		setLocation("");
		setDescription("");
		setStartDate("");
		setEndDate("");
		setCategory("");
		setEditingId(null);
		setIsFormVisible(false);
	};

	const handleEdit = (exp) => {
		setEditingId(exp.id);
		setTitle(exp.title || "");
		setCompany(exp.company || "");
		setLocation(exp.location || "");
		setDescription(exp.description || "");
		setStartDate(exp.start_date || "");
		setEndDate(exp.end_date || "");
		setCategory(exp.category || "");
		setIsFormVisible(true);
	};

	const handleDelete = (exp) => {
		setExpToDelete(exp);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!expToDelete) return;

		try {
			await remove("experiences", expToDelete.id);
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<Toast nativeID={id} action='success' variant='solid'>
						<VStack space='xs'>
							<ToastTitle>Succès</ToastTitle>
							<ToastDescription>
								Expérience supprimée
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			setShowDeleteDialog(false);
			setExpToDelete(null);
			loadData();
		} catch (error) {
			console.error("Erreur suppression:", error);
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='solid'>
						<VStack space='xs'>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Impossible de supprimer
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setShowDeleteDialog(false);
			setExpToDelete(null);
		}
	};

	const handleSubmit = async () => {
		if (!title || !startDate || !category) {
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<Toast nativeID={id} action='warning' variant='solid'>
						<VStack space='xs'>
							<ToastTitle>Attention</ToastTitle>
							<ToastDescription>
								Veuillez remplir les champs obligatoires
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
			return;
		}

		setLoading(true);
		try {
			const expData = {
				profile_id: user.id,
				title,
				company,
				location,
				description,
				start_date: startDate,
				end_date: endDate,
				category,
			};

			if (editingId) {
				await update("experiences", editingId, expData);
				toast.show({
					placement: "top",
					duration: 3000,
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='solid'>
							<VStack space='xs'>
								<ToastTitle>Succès</ToastTitle>
								<ToastDescription>
									Expérience modifiée
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			} else {
				await create("experiences", expData);
				toast.show({
					placement: "top",
					duration: 3000,
					render: ({ id }) => (
						<Toast nativeID={id} action='success' variant='solid'>
							<VStack space='xs'>
								<ToastTitle>Succès</ToastTitle>
								<ToastDescription>
									Expérience ajoutée
								</ToastDescription>
							</VStack>
						</Toast>
					),
				});
			}

			resetForm();
			loadData();
		} catch (error) {
			console.error("Erreur:", error);
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='solid'>
						<VStack space='xs'>
							<ToastTitle>Erreur</ToastTitle>
							<ToastDescription>
								Une erreur est survenue
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "";
		return new Date(dateString).toLocaleDateString("fr-FR", {
			month: "long",
			year: "numeric",
		});
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#ffffff",
			}}>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark ? "#111827" : "#ffffff",
				}}>
				<VStack
					space='lg'
					style={{
						padding: 16,
					}}>
					{/* En-tête */}
					<HStack
						space='md'
						style={{
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<Heading
							size='xl'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Mes expériences
						</Heading>
						<Button
							size='sm'
							action='primary'
							onPress={() => setIsFormVisible(!isFormVisible)}>
							<ButtonIcon as={isFormVisible ? X : Plus} />
							<ButtonText>
								{isFormVisible ? "Annuler" : "Ajouter"}
							</ButtonText>
						</Button>
					</HStack>

					{/* Formulaire d'ajout/modification */}
					{isFormVisible && (
						<Card
							size='md'
							variant='elevated'
							style={{
								backgroundColor: isDark ? "#1f2937" : "#ffffff",
							}}>
							<VStack space='md' style={{ padding: 16 }}>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{editingId
										? "Modifier l'expérience"
										: "Nouvelle expérience"}
								</Text>

								<Divider />

								{/* Titre */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "500",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Titre du poste *
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
										}}>
										<InputField
											placeholder='Ex: Agent de sécurité'
											value={title}
											onChangeText={setTitle}
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
										/>
									</Input>
								</VStack>

								{/* Entreprise */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "500",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Entreprise
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
										}}>
										<InputField
											placeholder='Ex: Société de sécurité XYZ'
											value={company}
											onChangeText={setCompany}
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
										/>
									</Input>
								</VStack>

								{/* Lieu */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "500",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Lieu
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
										}}>
										<InputField
											placeholder='Ex: Paris, France'
											value={location}
											onChangeText={setLocation}
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
											fontWeight: "500",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Catégorie *
									</Text>
									<Select
										selectedValue={category}
										onValueChange={(value) =>
											setCategory(value)
										}>
										<SelectTrigger
											variant='outline'
											size='md'>
											<SelectInput
												placeholder='Sélectionner une catégorie'
												style={{
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}
											/>
											<SelectIcon
												as={ChevronDownIcon}
												mr='$3'
											/>
										</SelectTrigger>
										<SelectPortal>
											<SelectBackdrop />
											<SelectContent>
												<SelectDragIndicatorWrapper>
													<SelectDragIndicator />
												</SelectDragIndicatorWrapper>
												{EXPERIENCE_CATEGORIES.map(
													(cat) => (
														<SelectItem
															key={cat.value}
															label={cat.label}
															value={cat.value}
														/>
													),
												)}
											</SelectContent>
										</SelectPortal>
									</Select>
								</VStack>

								{/* Dates */}
								<HStack space='md'>
									<VStack space='xs' style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												fontWeight: "500",
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}>
											Date de début *
										</Text>
										<TouchableOpacity
											onPress={() =>
												setStartDatePickerVisibility(
													true,
												)
											}>
											<Input
												variant='outline'
												size='md'
												isReadOnly
												pointerEvents='none'
												style={{
													backgroundColor: isDark
														? "#374151"
														: "#f9fafb",
												}}>
												<InputField
													placeholder='Sélectionner'
													value={
														startDate
															? formatDate(
																	startDate,
																)
															: ""
													}
													editable={false}
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
												<InputSlot pr='$3'>
													<InputIcon as={Calendar} />
												</InputSlot>
											</Input>
										</TouchableOpacity>
									</VStack>

									<VStack space='xs' style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												fontWeight: "500",
												color: isDark
													? "#d1d5db"
													: "#374151",
											}}>
											Date de fin
										</Text>
										<TouchableOpacity
											onPress={() =>
												setEndDatePickerVisibility(true)
											}>
											<Input
												variant='outline'
												size='md'
												isReadOnly
												pointerEvents='none'
												style={{
													backgroundColor: isDark
														? "#374151"
														: "#f9fafb",
												}}>
												<InputField
													placeholder='Actuel'
													value={
														endDate
															? formatDate(
																	endDate,
																)
															: ""
													}
													editable={false}
													style={{
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}
												/>
												<InputSlot pr='$3'>
													<InputIcon as={Calendar} />
												</InputSlot>
											</Input>
										</TouchableOpacity>
									</VStack>
								</HStack>

								{/* Description */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "500",
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										Description
									</Text>
									<Textarea
										size='md'
										style={{
											minHeight: 100,
											backgroundColor: isDark
												? "#374151"
												: "#f9fafb",
										}}>
										<TextareaInput
											placeholder='Décrivez vos missions et responsabilités...'
											value={description}
											onChangeText={setDescription}
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}
										/>
									</Textarea>
								</VStack>

								{/* Boutons */}
								<HStack space='md' style={{ marginTop: 8 }}>
									<Button
										flex={1}
										action='secondary'
										variant='outline'
										onPress={resetForm}>
										<ButtonText>Annuler</ButtonText>
									</Button>
									<Button
										flex={1}
										action='primary'
										onPress={handleSubmit}
										isDisabled={loading}>
										<ButtonText>
											{loading
												? "Enregistrement..."
												: editingId
													? "Modifier"
													: "Ajouter"}
										</ButtonText>
									</Button>
								</HStack>
							</VStack>
						</Card>
					)}

					{/* DatePickers */}
					<DateTimePickerModal
						isVisible={isStartDatePickerVisible}
						mode='date'
						onConfirm={(date) => {
							setStartDate(date.toISOString().split("T")[0]);
							setStartDatePickerVisibility(false);
						}}
						onCancel={() => setStartDatePickerVisibility(false)}
						locale='fr_FR'
						maximumDate={new Date()}
					/>
					<DateTimePickerModal
						isVisible={isEndDatePickerVisible}
						mode='date'
						onConfirm={(date) => {
							setEndDate(date.toISOString().split("T")[0]);
							setEndDatePickerVisibility(false);
						}}
						onCancel={() => setEndDatePickerVisibility(false)}
						locale='fr_FR'
						minimumDate={
							startDate ? new Date(startDate) : undefined
						}
						maximumDate={new Date()}
					/>

					{/* Liste des expériences */}
					<Divider />

					{experiences.length === 0 ? (
						<Card
							size='md'
							variant='outline'
							style={{
								backgroundColor: isDark ? "#1f2937" : "#f9fafb",
								padding: 32,
								alignItems: "center",
							}}>
							<VStack space='md' style={{ alignItems: "center" }}>
								<Briefcase
									size={48}
									color={isDark ? "#6b7280" : "#9ca3af"}
								/>
								<Text
									size='md'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textAlign: "center",
									}}>
									Aucune expérience pour le moment
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark ? "#6b7280" : "#9ca3af",
										textAlign: "center",
									}}>
									Ajoutez votre première expérience
									professionnelle
								</Text>
							</VStack>
						</Card>
					) : (
						<VStack space='md'>
							{experiences.map((exp) => (
								<Card
									key={exp.id}
									size='md'
									variant='elevated'
									style={{
										backgroundColor: isDark
											? "#1f2937"
											: "#ffffff",
									}}>
									<VStack space='md' style={{ padding: 16 }}>
										{/* En-tête de l'expérience */}
										<HStack
											style={{
												justifyContent: "space-between",
												alignItems: "flex-start",
											}}>
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													{exp.title}
												</Text>
												{exp.company && (
													<Text
														size='md'
														style={{
															color: isDark
																? "#d1d5db"
																: "#374151",
														}}>
														{exp.company}
													</Text>
												)}
											</VStack>
											<HStack space='sm'>
												<TouchableOpacity
													onPress={() =>
														handleEdit(exp)
													}>
													<Box
														style={{
															padding: 8,
															borderRadius: 8,
															backgroundColor:
																isDark
																	? "#374151"
																	: "#f3f4f6",
														}}>
														<Edit
															size={18}
															color={
																isDark
																	? "#60a5fa"
																	: "#3b82f6"
															}
														/>
													</Box>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() =>
														handleDelete(exp)
													}>
													<Box
														style={{
															padding: 8,
															borderRadius: 8,
															backgroundColor:
																isDark
																	? "#374151"
																	: "#f3f4f6",
														}}>
														<Trash2
															size={18}
															color={
																isDark
																	? "#f87171"
																	: "#ef4444"
															}
														/>
													</Box>
												</TouchableOpacity>
											</HStack>
										</HStack>

										{/* Informations */}
										<VStack space='sm'>
											{exp.location && (
												<HStack
													space='sm'
													style={{
														alignItems: "center",
													}}>
													<MapPin
														size={16}
														color={
															isDark
																? "#9ca3af"
																: "#6b7280"
														}
													/>
													<Text
														size='sm'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														{exp.location}
													</Text>
												</HStack>
											)}
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Calendar
													size={16}
													color={
														isDark
															? "#9ca3af"
															: "#6b7280"
													}
												/>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													{formatDate(exp.start_date)}{" "}
													-{" "}
													{exp.end_date
														? formatDate(
																exp.end_date,
															)
														: "Aujourd'hui"}
												</Text>
											</HStack>
										</VStack>

										{/* Catégorie */}
										{exp.category && (
											<Badge
												size='sm'
												variant='solid'
												action='info'
												style={{
													alignSelf: "flex-start",
												}}>
												<BadgeIcon
													as={Briefcase}
													className='mr-2'
												/>
												<BadgeText>
													{exp.category}
												</BadgeText>
											</Badge>
										)}

										{/* Description */}
										{exp.description && (
											<>
												<Divider />
												<Text
													size='sm'
													style={{
														color: isDark
															? "#d1d5db"
															: "#4b5563",
														lineHeight: 20,
													}}>
													{exp.description}
												</Text>
											</>
										)}
									</VStack>
								</Card>
							))}
						</VStack>
					)}
				</VStack>

				{/* Modal de confirmation de suppression */}
				<AlertDialog
					isOpen={showDeleteDialog}
					onClose={() => {
						setShowDeleteDialog(false);
						setExpToDelete(null);
					}}>
					<AlertDialogBackdrop />
					<AlertDialogContent
						style={{
							backgroundColor: isDark ? "#1f2937" : "#ffffff",
						}}>
						<AlertDialogHeader>
							<Heading
								size='md'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Confirmer la suppression
							</Heading>
						</AlertDialogHeader>
						<AlertDialogBody>
							<VStack space='sm'>
								<Text
									size='md'
									style={{
										color: isDark ? "#d1d5db" : "#374151",
									}}>
									Êtes-vous sûr de vouloir supprimer cette
									expérience ?
								</Text>
								{expToDelete && (
									<Box
										style={{
											padding: 12,
											backgroundColor: isDark
												? "#374151"
												: "#f3f4f6",
											borderRadius: 8,
											marginTop: 8,
										}}>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{expToDelete.title}
										</Text>
										{expToDelete.company && (
											<Text
												size='xs'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													marginTop: 4,
												}}>
												{expToDelete.company}
											</Text>
										)}
									</Box>
								)}
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										marginTop: 8,
									}}>
									Cette action est irréversible.
								</Text>
							</VStack>
						</AlertDialogBody>
						<AlertDialogFooter>
							<HStack space='md'>
								<Button
									flex={1}
									action='secondary'
									variant='outline'
									onPress={() => {
										setShowDeleteDialog(false);
										setExpToDelete(null);
									}}>
									<ButtonText>Annuler</ButtonText>
								</Button>
								<Button
									flex={1}
									action='negative'
									onPress={confirmDelete}>
									<ButtonText>Supprimer</ButtonText>
								</Button>
							</HStack>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default CurriculumScreen;
