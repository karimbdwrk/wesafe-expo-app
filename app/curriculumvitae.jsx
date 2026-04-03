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
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/components/ui/toast";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import {
	CATEGORY as CATEGORIES,
	getCategoryLabel,
} from "@/constants/categories";
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

const CurriculumScreen = () => {
	const { user } = useAuth();
	const { getAll, create, update, remove, trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const toast = useToast();
	const router = useRouter();

	const [experiences, setExperiences] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [expToDelete, setExpToDelete] = useState(null);

	// États pour le formulaire
	const [showCategorySheet, setShowCategorySheet] = useState(false);
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
						padding: 10,
						paddingTop: 15,
						paddingBottom: 30,
					}}>
					{/* En-tête */}
					{/* <HStack
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
									color: textPrimary,
								}}>
								Mes expériences
							</Text>
						</HStack>
					</HStack> */}

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
					{/* <Divider /> */}

					{experiences.length === 0 ? (
						<Card
							size='md'
							variant='outline'
							style={{
								backgroundColor: isDark
									? Colors.dark.elevated
									: Colors.light.elevated,
								padding: 15,
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
									<VStack space='md' style={{ padding: 5 }}>
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
											<HStack
												space='xs'
												// style={{
												// 	backgroundColor: "pink",
												// }}
											>
												<TouchableOpacity
													onPress={() =>
														handleEdit(exp)
													}>
													<Box
														style={{
															padding: 5,
															borderRadius: 5,
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
															size={14}
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
															padding: 5,
															borderRadius: 5,
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
															size={14}
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
											<Box
												style={{
													alignSelf: "flex-start",
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 6,
													borderWidth: 1,
													borderColor: isDark
														? Colors.dark.border
														: Colors.light.border,
													backgroundColor: isDark
														? Colors.dark
																.cardBackground
														: Colors.light
																.background,
												}}>
												<Text
													style={{
														fontSize: 12,
														fontWeight: "700",
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													{getCategoryLabel(
														exp.category,
													)}
												</Text>
											</Box>
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
									color: textPrimary,
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
						backgroundColor: cardBg,
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
							paddingHorizontal: 5,
							paddingTop: 8,
							paddingBottom: 16,
							marginBottom: 15,
							borderBottomWidth: 1,
							borderBottomColor: isDark
								? Colors.dark.border
								: Colors.light.border,
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
									color: textPrimary,
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
								paddingHorizontal: 5,
								paddingBottom: 48,
							}}>
							<VStack space='md'>
								{/* Titre */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Titre du poste *
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
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
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								{/* Entreprise */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Entreprise
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
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
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								{/* Lieu */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Lieu
									</Text>
									<Input
										style={{
											backgroundColor: bg,
											borderColor: cardBorder,
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
												color: textPrimary,
											}}
										/>
									</Input>
								</VStack>

								{/* Catégorie */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Catégorie *
									</Text>
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() =>
											setShowCategorySheet(true)
										}>
										<Box
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "space-between",
												padding: 12,
												borderRadius: 8,
												borderWidth: 1,
												borderColor: category
													? Colors.light.tint
													: cardBorder,
												backgroundColor: bg,
											}}>
											<Text
												style={{
													flex: 1,
													color: category
														? Colors.light.tint
														: textSecondary,
													fontWeight: category
														? "600"
														: "400",
												}}>
												{category
													? getCategoryLabel(category)
													: "Sélectionnez une catégorie"}
											</Text>
											<Icon
												as={ChevronDownIcon}
												size='sm'
												style={{
													color: category
														? Colors.light.tint
														: textSecondary,
												}}
											/>
										</Box>
									</TouchableOpacity>
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
												isReadOnly
												pointerEvents='none'
												style={{
													backgroundColor: bg,
													borderColor: cardBorder,
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
														color: textPrimary,
													}}
												/>
												<InputSlot pr='$3'>
													<InputIcon
														as={Calendar}
														color={textSecondary}
													/>
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
												isReadOnly
												pointerEvents='none'
												style={{
													backgroundColor: bg,
													borderColor: cardBorder,
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
														color: textPrimary,
													}}
												/>
												<InputSlot pr='$3'>
													<InputIcon
														as={Calendar}
														color={textSecondary}
													/>
												</InputSlot>
											</Input>
										</TouchableOpacity>
									</VStack>
								</HStack>

								{/* Description */}
								<VStack space='sm'>
									<Text
										size='sm'
										style={{
											fontWeight: "600",
											color: textPrimary,
										}}>
										Description
									</Text>
									<Textarea
										size='md'
										style={{
											minHeight: 100,
											backgroundColor: bg,
											borderColor: cardBorder,
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
												color: textPrimary,
											}}
										/>
									</Textarea>
								</VStack>

								{/* Boutons */}
								<HStack space='md' style={{ marginTop: 8 }}>
									<Button
										flex={1}
										variant='outline'
										onPress={resetForm}
										style={{
											borderColor: cardBorder,
											backgroundColor: cardBg,
										}}>
										<ButtonText
											style={{ color: textPrimary }}>
											Annuler
										</ButtonText>
									</Button>
									<Button
										flex={1}
										onPress={handleSubmit}
										isDisabled={loading}
										style={{ backgroundColor: tint }}>
										<ButtonText
											style={{
												color: Colors.light
													.cardBackground,
											}}>
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
					<VStack style={{ width: "100%", paddingTop: 8 }} space='sm'>
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
							<VStack space='lg' style={{ paddingBottom: 60 }}>
								{(() => {
									const CATEGORY_GROUP_LABELS = {
										surveillance_humaine:
											"Surveillance humaine",
										securite_incendie: "Sécurité Incendie",
										cynophile: "Cynophile",
										protection_rapprochee:
											"Protection Rapprochée",
										transport_fonds: "Transport de Fonds",
										videoprotection: "Vidéoprotection",
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
											<VStack key={groupKey} space='sm'>
												<Text
													style={{
														fontSize: 12,
														fontWeight: "700",
														letterSpacing: 0.8,
														textTransform:
															"uppercase",
														color: isDark
															? Colors.dark.muted
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
															category === cat.id;
														return (
															<Pressable
																key={cat.id}
																onPress={() => {
																	setCategory(
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
																			isSelected
																				? isDark
																					? Colors
																							.dark
																							.tint
																					: "#dbeafe"
																				: isDark
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

			{/* FAB — Ajouter une expérience */}
			<TouchableOpacity
				onPress={() => setIsSheetOpen(true)}
				activeOpacity={0.85}
				style={{
					position: "absolute",
					bottom: 32,
					right: 24,
					width: 42,
					height: 42,
					borderRadius: 21,
					backgroundColor: isDark
						? Colors.dark.tint
						: Colors.light.tint,
					justifyContent: "center",
					alignItems: "center",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.2,
					shadowRadius: 8,
					elevation: 6,
				}}>
				<Plus size={18} color='#fff' />
			</TouchableOpacity>
		</KeyboardAvoidingView>
	);
};

export default CurriculumScreen;
