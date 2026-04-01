import React, { useState, useCallback, useRef } from "react";
import {
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	Dimensions,
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
import { useToast } from "@/components/ui/toast";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import CustomToast from "@/components/CustomToast";
import {
	Plus,
	Calendar,
	MapPin,
	Briefcase,
	Edit,
	Trash2,
	ChevronDownIcon,
	X,
	CheckCircle,
	AlertCircle,
	AlertTriangle,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import Colors from "@/constants/Colors";
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
	const { getAll, create, update, remove, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();
	const router = useRouter();

	const [experiences, setExperiences] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [expToDelete, setExpToDelete] = useState(null);

	// États pour le formulaire
	const [isSheetOpen, setIsSheetOpen] = useState(false);
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

	const scrollViewRef = useRef(null);
	const formScrollRef = useRef(null);
	const titleRef = useRef(null);
	const companyRef = useRef(null);
	const locationRef = useRef(null);
	const descriptionRef = useRef(null);

	const scrollToInput = (inputRef, offset = 120) => {
		if (inputRef.current && formScrollRef.current) {
			setTimeout(() => {
				inputRef.current.measureLayout(
					formScrollRef.current,
					(x, y) => {
						formScrollRef.current.scrollTo({
							y: y - offset,
							animated: true,
						});
					},
					() => {},
				);
			}, 100);
		}
	};

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
		setIsSheetOpen(false);
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
		setIsSheetOpen(true);
	};

	const handleDelete = (exp) => {
		setExpToDelete(exp);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!expToDelete) return;

		try {
			await remove("experiences", expToDelete.id);
			trackActivity("experience_deleted");
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={CheckCircle}
						color={
							isDark ? Colors.dark.success : Colors.light.success
						}
						title='Succès'
						description='Expérience supprimée'
					/>
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
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title='Erreur'
						description='Impossible de supprimer'
					/>
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
					<CustomToast
						id={id}
						icon={AlertTriangle}
						color={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
						title='Attention'
						description='Veuillez remplir les champs obligatoires'
					/>
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
				trackActivity("experience_updated");
				toast.show({
					placement: "top",
					duration: 3000,
					render: ({ id }) => (
						<CustomToast
							id={id}
							icon={CheckCircle}
							color={
								isDark
									? Colors.dark.success
									: Colors.light.success
							}
							title='Succès'
							description='Expérience modifiée'
						/>
					),
				});
			} else {
				await create("experiences", expData);
				trackActivity("experience_created");
				toast.show({
					placement: "top",
					duration: 3000,
					render: ({ id }) => (
						<CustomToast
							id={id}
							icon={CheckCircle}
							color={
								isDark
									? Colors.dark.success
									: Colors.light.success
							}
							title='Succès'
							description='Expérience ajoutée'
						/>
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
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title='Erreur'
						description='Une erreur est survenue'
					/>
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
				backgroundColor: isDark
					? Colors.dark.background
					: Colors.light.background,
			}}>
			<ScrollView
				ref={scrollViewRef}
				keyboardShouldPersistTaps='handled'
				style={{
					flex: 1,
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.background,
				}}>
				<VStack
					space='lg'
					style={{
						padding: 16,
					}}>
					{/* En-tête */}
					<HStack
						style={{
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 10,
									backgroundColor: isDark
										? Colors.dark.tint20
										: Colors.light.tint20,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Briefcase
									size={16}
									color={
										isDark
											? Colors.dark.tint
											: Colors.light.tint
									}
								/>
							</Box>
							<Text
								size='lg'
								style={{
									fontWeight: "700",
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Mes expériences
							</Text>
						</HStack>
						<Button
							size='sm'
							action='primary'
							onPress={() => setIsSheetOpen(true)}>
							<ButtonIcon as={Plus} />
							<ButtonText>Ajouter</ButtonText>
						</Button>
					</HStack>

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
								backgroundColor: isDark
									? Colors.dark.elevated
									: Colors.light.elevated,
								padding: 32,
								alignItems: "center",
							}}>
							<VStack space='md' style={{ alignItems: "center" }}>
								<Briefcase
									size={48}
									color={
										isDark
											? Colors.dark.muted
											: Colors.light.muted
									}
								/>
								<Text
									size='md'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										textAlign: "center",
									}}>
									Aucune expérience pour le moment
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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
											? Colors.dark.elevated
											: Colors.light.cardBackground,
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
															? Colors.dark.text
															: Colors.light.text,
													}}>
													{exp.title}
												</Text>
												{exp.company && (
													<Text
														size='md'
														style={{
															color: isDark
																? Colors.dark
																		.textSecondary
																: Colors.light
																		.textSecondary,
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
																	? Colors
																			.dark
																			.elevated
																	: Colors
																			.light
																			.elevated,
														}}>
														<Edit
															size={18}
															color={
																isDark
																	? Colors
																			.dark
																			.tint
																	: Colors
																			.light
																			.tint
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
																	? Colors
																			.dark
																			.elevated
																	: Colors
																			.light
																			.elevated,
														}}>
														<Trash2
															size={18}
															color={
																isDark
																	? Colors
																			.dark
																			.danger
																	: Colors
																			.light
																			.danger
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
																? Colors.dark
																		.muted
																: Colors.light
																		.muted
														}
													/>
													<Text
														size='sm'
														style={{
															color: isDark
																? Colors.dark
																		.muted
																: Colors.light
																		.muted,
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
															? Colors.dark.muted
															: Colors.light.muted
													}
												/>
												<Text
													size='sm'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
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
															? Colors.dark
																	.textSecondary
															: Colors.light
																	.textSecondary,
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
							backgroundColor: isDark
								? Colors.dark.elevated
								: Colors.light.cardBackground,
						}}>
						<AlertDialogHeader>
							<Heading
								size='md'
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Confirmer la suppression
							</Heading>
						</AlertDialogHeader>
						<AlertDialogBody>
							<VStack space='sm'>
								<Text
									size='md'
									style={{
										color: isDark
											? Colors.dark.textSecondary
											: Colors.light.textSecondary,
									}}>
									Êtes-vous sûr de vouloir supprimer cette
									expérience ?
								</Text>
								{expToDelete && (
									<Box
										style={{
											padding: 12,
											backgroundColor: isDark
												? Colors.dark.elevated
												: Colors.light.elevated,
											borderRadius: 8,
											marginTop: 8,
										}}>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											{expToDelete.title}
										</Text>
										{expToDelete.company && (
											<Text
												size='xs'
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
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
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
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

			{/* Actionsheet formulaire ajout/modification expérience */}
			<Actionsheet isOpen={isSheetOpen} onClose={resetForm}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark
							? Colors.dark.elevated
							: Colors.light.cardBackground,
						paddingBottom: 0,
						maxHeight: "92%",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					{/* Header */}
					<HStack
						style={{
							width: "100%",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							paddingTop: 8,
							paddingBottom: 16,
						}}>
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 10,
									backgroundColor: isDark
										? Colors.dark.tint20
										: Colors.light.tint20,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Briefcase
									size={16}
									color={
										isDark
											? Colors.dark.tint
											: Colors.light.tint
									}
								/>
							</Box>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 16,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								{editingId
									? "Modifier l'expérience"
									: "Nouvelle expérience"}
							</Text>
						</HStack>
						<TouchableOpacity
							onPress={resetForm}
							activeOpacity={0.7}>
							<X
								size={20}
								color={
									isDark
										? Colors.dark.muted
										: Colors.light.muted
								}
							/>
						</TouchableOpacity>
					</HStack>

					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						style={{ width: "100%" }}>
						<ScrollView
							ref={formScrollRef}
							keyboardShouldPersistTaps='handled'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: 16,
								paddingBottom: 48,
							}}>
							<VStack space='md'>
								{/* Titre */}
								<VStack space='xs'>
									<Text
										size='sm'
										style={{
											fontWeight: "500",
											color: isDark
												? Colors.dark.textSecondary
												: Colors.light.textSecondary,
										}}>
										Titre du poste *
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? Colors.dark.elevated
												: Colors.light.elevated,
										}}>
										<InputField
											ref={titleRef}
											placeholder='Ex: Agent de sécurité'
											value={title}
											onChangeText={setTitle}
											onFocus={() =>
												scrollToInput(titleRef)
											}
											style={{
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
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
												? Colors.dark.textSecondary
												: Colors.light.textSecondary,
										}}>
										Entreprise
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? Colors.dark.elevated
												: Colors.light.elevated,
										}}>
										<InputField
											ref={companyRef}
											placeholder='Ex: Société de sécurité XYZ'
											value={company}
											onChangeText={setCompany}
											onFocus={() =>
												scrollToInput(companyRef)
											}
											style={{
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
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
												? Colors.dark.textSecondary
												: Colors.light.textSecondary,
										}}>
										Lieu
									</Text>
									<Input
										variant='outline'
										size='md'
										style={{
											backgroundColor: isDark
												? Colors.dark.elevated
												: Colors.light.elevated,
										}}>
										<InputField
											ref={locationRef}
											placeholder='Ex: Paris, France'
											value={location}
											onChangeText={setLocation}
											onFocus={() =>
												scrollToInput(locationRef)
											}
											style={{
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
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
												? Colors.dark.textSecondary
												: Colors.light.textSecondary,
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
														? Colors.dark.text
														: Colors.light.text,
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
													? Colors.dark.textSecondary
													: Colors.light
															.textSecondary,
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
														? Colors.dark.elevated
														: Colors.light.elevated,
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
															? Colors.dark.text
															: Colors.light.text,
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
													? Colors.dark.textSecondary
													: Colors.light
															.textSecondary,
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
														? Colors.dark.elevated
														: Colors.light.elevated,
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
															? Colors.dark.text
															: Colors.light.text,
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
												? Colors.dark.textSecondary
												: Colors.light.textSecondary,
										}}>
										Description
									</Text>
									<Textarea
										size='md'
										style={{
											minHeight: 100,
											backgroundColor: isDark
												? Colors.dark.elevated
												: Colors.light.elevated,
										}}>
										<TextareaInput
											ref={descriptionRef}
											placeholder='Décrivez vos missions et responsabilités...'
											value={description}
											onChangeText={setDescription}
											onFocus={() =>
												scrollToInput(
													descriptionRef,
													80,
												)
											}
											style={{
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
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
						</ScrollView>
					</KeyboardAvoidingView>
				</ActionsheetContent>
			</Actionsheet>
		</KeyboardAvoidingView>
	);
};

export default CurriculumScreen;
