import React, { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFocusEffect } from "expo-router";
import {
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
import {
	CheckCircle,
	Clock,
	AlertCircle,
	Camera,
	Image as ImageIcon,
	Upload,
	X,
	CreditCard,
	GraduationCap,
	Award,
	FileText,
	ChevronRight,
	ChevronLeft,
	Paperclip,
	CalendarDays,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { SUBMIT_PRODOC } from "@/utils/activityEvents";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { createSupabaseClient } from "@/lib/supabase";
import { CNAPS_CARDS } from "@/constants/cnapscards";
import { DIPLOMAS as DIPLOMAS_CONST } from "@/constants/diplomas";
import { CERTIFICATIONS as CERTIFICATIONS_CONST } from "@/constants/certifications";
import Constants from "expo-constants";

const DOCUMENTS_BUCKET = "pro-documents";

// UUID du superadmin (récupéré depuis app.json > extra, ou à saisir en dur)
const SUPERADMIN_ID = Constants.expoConfig?.extra?.SUPERADMIN_ID;

/* ------------------------------------------------------------------ */
/* Data (from /constants)                                               */
/* ------------------------------------------------------------------ */

const CNAPS_ACTIVITIES = Object.entries(CNAPS_CARDS)
	.map(([key, val]) => ({
		code: key.toUpperCase(),
		id: key,
		name: val.name,
		acronym: val.acronym,
		validity_years: 5,
	}))
	.sort((a, b) => a.name.localeCompare(b.name, "fr"));

const DIPLOMAS = Object.entries(DIPLOMAS_CONST)
	.map(([key, val]) => ({
		code: key.toUpperCase(),
		id: key,
		name: val.name,
		acronym: val.acronym,
		validity_years: val.validity_years ?? null,
	}))
	.sort((a, b) => a.name.localeCompare(b.name, "fr"));

const CERTIFICATIONS = Object.entries(CERTIFICATIONS_CONST)
	.map(([key, val]) => ({
		code: key.toUpperCase(),
		id: key,
		name: val.name,
		acronym: val.acronym,
		validity_years: val.validity_years ?? null,
	}))
	.sort((a, b) => a.name.localeCompare(b.name, "fr"));

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const getStatusConfig = (status) => {
	const map = {
		verified: { action: "success", icon: CheckCircle, label: "Vérifié" },
		pending: { action: "warning", icon: Clock, label: "En attente" },
		rejected: { action: "error", icon: AlertCircle, label: "Rejeté" },
	};
	return map[status] || map.pending;
};

const formatDate = (iso) => {
	if (!iso) return null;
	return new Date(iso).toLocaleDateString("fr-FR");
};

const getExpiryInfo = (expiresAt) => {
	if (!expiresAt) return null;
	const now = new Date();
	const exp = new Date(expiresAt);
	const inSixMonths = new Date();
	inSixMonths.setMonth(inSixMonths.getMonth() + 6);
	if (exp < now)
		return {
			label: `Expiré le ${formatDate(expiresAt)}`,
			color: isDark ? Colors.dark.danger : Colors.light.danger,
			icon: "expired",
		};
	if (exp <= inSixMonths)
		return {
			label: `Expire le ${formatDate(expiresAt)}`,
			color: isDark ? Colors.dark.warning : Colors.light.warning,
			icon: "soon",
		};
	return {
		label: `Expire le ${formatDate(expiresAt)}`,
		color: null,
		icon: null,
	};
};

const getCategoryIcon = (cat) => {
	if (cat === "cnaps") return CreditCard;
	if (cat === "diploma") return GraduationCap;
	return Award;
};

const getCategoryColor = (cat, isDark) => {
	if (cat === "cnaps")
		return {
			bg: isDark ? Colors.dark.tint20 : Colors.light.tint20,
			icon: isDark ? Colors.dark.tint : Colors.light.tint,
		};
	if (cat === "diploma")
		return {
			bg: isDark ? Colors.dark.success20 : Colors.light.success20,
			icon: isDark ? Colors.dark.success : Colors.light.success,
		};
	return {
		bg: isDark ? Colors.dark.tint20 : Colors.light.tint20,
		icon: isDark ? Colors.dark.tint : Colors.light.tint,
	};
};

const getDocInfo = (category, typeCode) => {
	if (category === "cnaps") {
		const act = CNAPS_ACTIVITIES.find((a) => a.code === typeCode);
		return { acronym: act?.acronym || null, name: act?.name || typeCode };
	} else if (category === "diploma") {
		const d = DIPLOMAS.find((d) => d.code === typeCode);
		return { acronym: d?.acronym || null, name: d?.name || typeCode };
	} else {
		const c = CERTIFICATIONS.find((c) => c.code === typeCode);
		return { acronym: c?.acronym || null, name: c?.name || typeCode };
	}
};

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

const ProDocs = ({ navigation }) => {
	const { user, accessToken } = useAuth();
	const { trackActivity } = useDataContext();
	const { isDark } = useTheme();
	const toast = useToast();

	/* --- state --- */
	const [docs, setDocs] = useState([]);
	const [loadingDocs, setLoadingDocs] = useState(true);

	// Wizard steps: list | category | type | upload
	const [step, setStep] = useState("list");
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [selectedType, setSelectedType] = useState(null);
	const [cnapsCardNumber, setCnapsCardNumber] = useState("");
	const [docImage, setDocImage] = useState(null);
	const [validityDate, setValidityDate] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/* --- load --- */
	const loadDocs = useCallback(async () => {
		if (!user?.id) return;
		setLoadingDocs(true);
		try {
			const supabase = createSupabaseClient(accessToken);
			const now = new Date().toISOString();
			const [cnapsRes, diplomasRes, certsRes] = await Promise.all([
				supabase
					.from("user_cnaps_cards")
					.select("*")
					.eq("user_id", user.id)
					.or(`expires_at.is.null,expires_at.gt.${now}`)
					.order("created_at", { ascending: false }),
				supabase
					.from("user_diplomas")
					.select("*")
					.eq("user_id", user.id)
					.or(`expires_at.is.null,expires_at.gt.${now}`)
					.order("created_at", { ascending: false }),
				supabase
					.from("user_certifications")
					.select("*")
					.eq("user_id", user.id)
					.or(`expires_at.is.null,expires_at.gt.${now}`)
					.order("created_at", { ascending: false }),
			]);
			if (cnapsRes.error) throw cnapsRes.error;
			if (diplomasRes.error) throw diplomasRes.error;
			if (certsRes.error) throw certsRes.error;
			const merged = [
				...(cnapsRes.data || []).map((d) => ({
					...d,
					_category: "cnaps",
				})),
				...(diplomasRes.data || []).map((d) => ({
					...d,
					_category: "diploma",
				})),
				...(certsRes.data || []).map((d) => ({
					...d,
					_category: "certification",
				})),
			].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			setDocs(merged);
		} catch (e) {
			console.error("loadDocs error:", e);
			setDocs([]);
		} finally {
			setLoadingDocs(false);
		}
	}, [user?.id, accessToken]);

	useFocusEffect(
		useCallback(() => {
			loadDocs();
		}, [loadDocs]),
	);

	/* --- image picker --- */
	const pickFromGallery = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") return;
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 0.8,
		});
		if (!result.canceled) setDocImage(result.assets[0]);
	};

	/* --- file picker --- */
	const pickFromFiles = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*", "application/pdf"],
				copyToCacheDirectory: true,
			});
			if (!result.canceled && result.assets?.[0]) {
				const asset = result.assets[0];
				setDocImage({
					uri: asset.uri,
					name: asset.name,
					isPdf: asset.mimeType === "application/pdf",
				});
			}
		} catch (e) {
			console.error("pickFromFiles error:", e);
		}
	};

	/* --- upload to storage --- */
	const uploadFile = async () => {
		if (!docImage?.uri) throw new Error("No file selected");

		// Déterminer le MIME type
		let mime;
		if (docImage.mimeType) {
			mime = docImage.mimeType;
		} else if (docImage.isPdf) {
			mime = "application/pdf";
		} else {
			const rawName =
				docImage.name ||
				docImage.fileName ||
				docImage.uri.split("/").pop() ||
				"file.jpg";
			const match = /\.(\w+)$/.exec(rawName);
			const ext = (match?.[1] || "jpg").toLowerCase();
			mime = `image/${ext === "jpg" ? "jpeg" : ext}`;
		}

		// Convertir HEIC/HEIF → JPEG
		let sourceUri = docImage.uri;
		if (
			mime === "image/heic" ||
			mime === "image/heif" ||
			sourceUri.toLowerCase().match(/\.hei[cf]$/)
		) {
			const converted = await ImageManipulator.manipulateAsync(
				sourceUri,
				[],
				{ compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
			);
			sourceUri = converted.uri;
			mime = "image/jpeg";
		}

		// Extension de stockage
		const storageExt =
			mime === "application/pdf"
				? "pdf"
				: mime === "image/jpeg"
					? "jpg"
					: mime.split("/")[1] || "jpg";

		const filename = `${user.id}/${selectedCategory}_${selectedType.code}_${Date.now()}.${storageExt}`;

		// Lire le fichier local en base64 (fetch→blob renvoie 0 bytes en React Native)
		const base64 = await FileSystem.readAsStringAsync(sourceUri, {
			encoding: "base64",
		});

		// Convertir base64 → Uint8Array
		const binaryStr = atob(base64);
		const bytes = new Uint8Array(binaryStr.length);
		for (let i = 0; i < binaryStr.length; i++) {
			bytes[i] = binaryStr.charCodeAt(i);
		}

		// Upload via le client Supabase (JWT injecté automatiquement)
		const supabase = createSupabaseClient(accessToken);
		const { error: uploadError } = await supabase.storage
			.from(DOCUMENTS_BUCKET)
			.upload(filename, bytes, {
				contentType: mime,
				upsert: true,
			});

		if (uploadError) {
			console.error("uploadFile failed:", JSON.stringify(uploadError));
			throw uploadError;
		}

		const { data: urlData } = supabase.storage
			.from(DOCUMENTS_BUCKET)
			.getPublicUrl(filename);

		return urlData.publicUrl;
	};

	/* --- submit --- */
	const handleSubmit = async () => {
		trackActivity(SUBMIT_PRODOC);
		if (!docImage) return;
		if (selectedCategory === "cnaps" && cnapsCardNumber.trim().length !== 7)
			return;
		// Garde anti-doublon (ignorer les documents expirés)
		const isDuplicate = docs.some(
			(d) =>
				d._category === selectedCategory &&
				d.type === selectedType?.code &&
				!(d.expires_at && new Date(d.expires_at) < new Date()),
		);
		if (isDuplicate) {
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.warning : Colors.light.warning
						}
						title='Document déjà soumis'
						description='Ce document est déjà dans votre dossier.'
					/>
				),
			});
			return;
		}
		setIsSubmitting(true);
		try {
			const fileUrl = await uploadFile();
			const dateStr = validityDate
				? validityDate.toISOString().split("T")[0]
				: null;
			const supabase = createSupabaseClient(accessToken);
			let tableName, payload;
			if (selectedCategory === "cnaps") {
				tableName = "user_cnaps_cards";
				payload = {
					user_id: user.id,
					number: cnapsCardNumber.trim(),
					type: selectedType.code,
					expires_at: dateStr,
					document_url: fileUrl,
					status: "pending",
				};
			} else if (selectedCategory === "diploma") {
				tableName = "user_diplomas";
				payload = {
					user_id: user.id,
					type: selectedType.code,
					expires_at: dateStr,
					document_url: fileUrl,
					status: "pending",
				};
			} else {
				tableName = "user_certifications";
				payload = {
					user_id: user.id,
					type: selectedType.code,
					expires_at: dateStr,
					document_url: fileUrl,
					status: "pending",
				};
			}
			const { error } = await supabase.from(tableName).insert(payload);
			if (error) throw error;

			// Notifier le superadmin d'un nouveau document à vérifier
			const docInfo = getDocInfo(selectedCategory, selectedType.code);
			const categoryLabel =
				selectedCategory === "cnaps"
					? "Carte CNAPS"
					: selectedCategory === "diploma"
						? "Diplôme"
						: "Certification";
			await supabase.from("notifications").insert({
				recipient_id: SUPERADMIN_ID,
				actor_id: user.id,
				type: "document_created",
				title: `Nouveau document à vérifier`,
				body: `${categoryLabel} — ${docInfo.acronym ? `${docInfo.acronym} · ` : ""}${docInfo.name}`,
				entity_type: selectedCategory,
				is_read: false,
				metadata: {
					user_id: user.id,
					document_type: selectedType.code,
					category: selectedCategory,
					table: tableName,
				},
			});

			await loadDocs();
			// Reset wizard
			setStep("list");
			setSelectedCategory(null);
			setSelectedType(null);
			setCnapsCardNumber("");
			setDocImage(null);
			setValidityDate(null);
			toast.show({
				placement: "top",
				duration: 5000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={CheckCircle}
						color={
							isDark ? Colors.dark.success : Colors.light.success
						}
						title='Document soumis !'
						description='Votre document est en cours de vérification.'
					/>
				),
			});
		} catch (e) {
			console.error("handleSubmit error:", e);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title="Erreur lors de l'envoi"
						description='Veuillez réessayer.'
					/>
				),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	/* ---------------------------------------------------------------- */
	/* Sub-components                                                     */
	/* ---------------------------------------------------------------- */

	const StatusBadge = ({ status }) => {
		const cfg = getStatusConfig(status);
		return (
			<Badge size='sm' variant='solid' action={cfg.action}>
				<BadgeIcon as={cfg.icon} />
				<BadgeText style={{ marginLeft: 4 }}>{cfg.label}</BadgeText>
			</Badge>
		);
	};

	const SectionHeader = ({ title, subtitle, onBack, step: stepLabel }) => (
		<VStack
			style={{
				paddingVertical: 20,
				paddingHorizontal: 4,
				gap: 12,
			}}>
			{/* Bouton retour + étape */}
			<HStack
				style={{
					alignItems: "center",
					justifyContent: "space-between",
				}}>
				{onBack ? (
					<Pressable onPress={onBack}>
						<HStack
							alignItems='center'
							gap={4}
							style={({ pressed }) => ({
								opacity: pressed ? 0.6 : 1,
							})}>
							<Icon
								as={ChevronLeft}
								size='sm'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
								}}
							/>
							<Text
								size='sm'
								style={{
									color: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									fontWeight: "600",
								}}>
								Retour
							</Text>
						</HStack>
					</Pressable>
				) : (
					<Box />
				)}
				{stepLabel && (
					<Badge size='sm' variant='solid' action='info'>
						<BadgeText>{stepLabel}</BadgeText>
					</Badge>
				)}
			</HStack>
			{/* Titre + sous-titre */}
			<VStack style={{ gap: 4 }}>
				<Heading
					size='2xl'
					style={{
						color: isDark ? Colors.dark.text : Colors.light.text,
						lineHeight: 32,
					}}>
					{title}
				</Heading>
				{subtitle && (
					<Text
						size='sm'
						style={{
							color: isDark
								? Colors.dark.muted
								: Colors.light.muted,
						}}>
						{subtitle}
					</Text>
				)}
			</VStack>
			<Divider />
		</VStack>
	);

	/* ---------------------------------------------------------------- */
	/* Step: LIST                                                         */
	/* ---------------------------------------------------------------- */

	const renderList = () => {
		const grouped = {
			cnaps: docs.filter((d) => d._category === "cnaps"),
			diploma: docs.filter((d) => d._category === "diploma"),
			certification: docs.filter((d) => d._category === "certification"),
		};

		const sections = [
			{
				key: "cnaps",
				label: "Carte CNAPS",
				icon: CreditCard,
				color: getCategoryColor("cnaps", isDark),
			},
			{
				key: "diploma",
				label: "Diplômes",
				icon: GraduationCap,
				color: getCategoryColor("diploma", isDark),
			},
			{
				key: "certification",
				label: "Certifications",
				icon: Award,
				color: getCategoryColor("certification", isDark),
			},
		];

		return (
			<VStack space='2xl'>
				{/* Header */}
				<VStack space='sm'>
					<Heading
						size='2xl'
						style={{
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
						}}>
						Documents professionnels
					</Heading>
					<Text
						size='md'
						style={{
							color: isDark
								? Colors.dark.muted
								: Colors.light.muted,
						}}>
						Cartes CNAPS, diplômes et certifications
					</Text>
				</VStack>

				{/* Add button */}
				<Button
					size='lg'
					onPress={() => setStep("category")}
					style={{
						borderRadius: 12,
						backgroundColor: isDark
							? Colors.dark.tint
							: Colors.light.tint,
					}}>
					<ButtonIcon as={Upload} />
					<ButtonText style={{ fontWeight: "700" }}>
						Ajouter un document
					</ButtonText>
				</Button>

				{/* Sections */}
				{sections.map(({ key, label, icon, color }) => (
					<VStack key={key} space='md'>
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 32,
									height: 32,
									borderRadius: 8,
									backgroundColor: isDark
										? Colors.dark.elevated
										: color.bg,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={icon}
									size='sm'
									style={{ color: color.icon }}
								/>
							</Box>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 15,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								{label}
							</Text>
						</HStack>

						{grouped[key].length === 0 ? (
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? Colors.dark.cardBackground
										: Colors.light.cardBackground,
									borderRadius: 12,
								}}>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										textAlign: "center",
									}}>
									Aucun document ajouté
								</Text>
							</Card>
						) : (
							<VStack space='sm'>
								{grouped[key].map((doc) => (
									<Card
										key={doc.id}
										style={{
											padding: 16,
											backgroundColor: isDark
												? Colors.dark.cardBackground
												: Colors.light.cardBackground,
											borderRadius: 12,
											shadowColor: "#000",
											shadowOffset: {
												width: 0,
												height: 1,
											},
											shadowOpacity: 0.04,
											shadowRadius: 4,
											elevation: 1,
										}}>
										<HStack
											style={{
												justifyContent: "space-between",
												alignItems: "flex-start",
											}}>
											<VStack
												space='xs'
												style={{
													flex: 1,
													marginRight: 12,
												}}>
												{(() => {
													const info = getDocInfo(
														doc._category,
														doc.type,
													);
													return (
														<>
															{info.acronym ? (
																<Text
																	style={{
																		fontWeight:
																			"800",
																		fontSize: 15,
																		color: isDark
																			? Colors
																					.dark
																					.text
																			: Colors
																					.light
																					.text,
																	}}>
																	{
																		info.acronym
																	}
																</Text>
															) : null}
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
																	lineHeight: 18,
																}}>
																{info.name}
															</Text>
														</>
													);
												})()}
												{doc._category === "cnaps" &&
												doc.number ? (
													<Text
														size='xs'
														style={{
															color: isDark
																? Colors.dark
																		.tint
																: Colors.light
																		.tint,
															fontWeight: "700",
															letterSpacing: 2,
														}}>
														N° ···{doc.number}
													</Text>
												) : null}
												{(() => {
													const exp = getExpiryInfo(
														doc.expires_at,
													);
													if (!exp) return null;
													return (
														<HStack
															space='xs'
															style={{
																alignItems:
																	"center",
																gap: 4,
															}}>
															{exp.icon ===
															"expired" ? (
																<Icon
																	as={
																		AlertCircle
																	}
																	size='2xs'
																	style={{
																		color: isDark
																			? Colors
																					.dark
																					.danger
																			: Colors
																					.light
																					.danger,
																	}}
																/>
															) : exp.icon ===
															  "soon" ? (
																<Icon
																	as={Clock}
																	size='2xs'
																	style={{
																		color: isDark
																			? Colors
																					.dark
																					.warning
																			: Colors
																					.light
																					.warning,
																	}}
																/>
															) : null}
															<Text
																size='xs'
																style={{
																	fontWeight:
																		exp.icon
																			? "600"
																			: "400",
																	color:
																		exp.color ??
																		(isDark
																			? Colors
																					.dark
																					.muted
																			: Colors
																					.light
																					.muted),
																}}>
																{exp.label}
															</Text>
														</HStack>
													);
												})()}
												<Text
													size='xs'
													style={{
														color: isDark
															? Colors.dark.muted
															: Colors.light
																	.muted,
													}}>
													Soumis le{" "}
													{formatDate(doc.created_at)}
												</Text>
											</VStack>
											<StatusBadge status={doc.status} />
										</HStack>
									</Card>
								))}
							</VStack>
						)}
					</VStack>
				))}
			</VStack>
		);
	};

	/* ---------------------------------------------------------------- */
	/* Step: CATEGORY                                                     */
	/* ---------------------------------------------------------------- */

	const renderCategory = () => {
		const categories = [
			{
				key: "cnaps",
				label: "Carte professionnelle CNAPS",
				subtitle: "Carte d'agent privé de sécurité — validité 5 ans",
				icon: CreditCard,
				color: getCategoryColor("cnaps", isDark),
			},
			{
				key: "diploma",
				label: "Diplôme professionnel",
				subtitle: "TFP APS, SSIAP 1/2/3, TFP ASC…",
				icon: GraduationCap,
				color: getCategoryColor("diploma", isDark),
			},
			{
				key: "certification",
				label: "Certification",
				subtitle: "SST, H0B0, PSE1/2, MAC SSIAP…",
				icon: Award,
				color: getCategoryColor("certification", isDark),
			},
		];

		return (
			<VStack space='xl'>
				<SectionHeader
					title='Type de document'
					subtitle='Choisissez la catégorie de votre document'
					step='Étape 1 / 3'
					onBack={() => setStep("list")}
				/>
				{categories.map(({ key, label, subtitle, icon, color }) => (
					<TouchableOpacity
						key={key}
						activeOpacity={0.7}
						onPress={() => {
							setSelectedCategory(key);
							setStep("type");
						}}>
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 52,
										height: 52,
										borderRadius: 26,
										backgroundColor: isDark
											? Colors.dark.background
											: color.bg,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={icon}
										size='xl'
										style={{ color: color.icon }}
									/>
								</Box>
								<VStack style={{ flex: 1 }} space='xs'>
									<Text
										size='lg'
										style={{
											fontWeight: "700",
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										{label}
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
										}}>
										{subtitle}
									</Text>
								</VStack>
								<Icon
									as={ChevronRight}
									size='md'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}
								/>
							</HStack>
						</Card>
					</TouchableOpacity>
				))}
			</VStack>
		);
	};

	/* ---------------------------------------------------------------- */
	/* Step: TYPE                                                         */
	/* ---------------------------------------------------------------- */

	const renderType = () => {
		let items = [];
		if (selectedCategory === "cnaps") {
			items = CNAPS_ACTIVITIES.map((act) => ({
				...act,
				validity_years: 5,
			}));
		} else if (selectedCategory === "diploma") {
			items = DIPLOMAS;
		} else {
			items = CERTIFICATIONS;
		}

		const categoryLabel =
			selectedCategory === "cnaps"
				? "Carte CNAPS"
				: selectedCategory === "diploma"
					? "Diplôme"
					: "Certification";

		const existingTypes = new Set(
			docs
				.filter((d) => {
					if (d._category !== selectedCategory) return false;
					// Exclure les documents expirés : ils peuvent être re-soumis
					if (d.expires_at && new Date(d.expires_at) < new Date())
						return false;
					return true;
				})
				.map((d) => d.type),
		);

		return (
			<VStack space='xl'>
				<SectionHeader
					title={categoryLabel}
					subtitle='Sélectionnez votre document'
					step='Étape 2 / 3'
					onBack={() => {
						setStep("category");
						setSelectedCategory(null);
					}}
				/>
				<VStack space='sm'>
					{items.map((item) => {
						const alreadyAdded = existingTypes.has(item.code);
						// Vérifier si le doc existe mais est expiré (re-soumission autorisée)
						const expiredDoc = docs.find(
							(d) =>
								d._category === selectedCategory &&
								d.type === item.code &&
								d.expires_at &&
								new Date(d.expires_at) < new Date(),
						);
						const isExpired = !!expiredDoc;
						return (
							<TouchableOpacity
								key={item.code}
								activeOpacity={
									alreadyAdded && !isExpired ? 1 : 0.7
								}
								disabled={alreadyAdded && !isExpired}
								onPress={() => {
									if (alreadyAdded && !isExpired) return;
									setSelectedType(item);
									setStep("upload");
								}}>
								<Card
									style={{
										padding: 16,
										backgroundColor: isDark
											? Colors.dark.cardBackground
											: Colors.light.cardBackground,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: isExpired
											? isDark
												? Colors.dark.warning
												: Colors.light.warning
											: alreadyAdded
												? isDark
													? Colors.dark.elevated
													: Colors.light.elevated
												: isDark
													? Colors.dark.border
													: Colors.light.border,
										opacity:
											alreadyAdded && !isExpired
												? 0.55
												: 1,
									}}>
									<HStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
										}}>
										<VStack
											space='xs'
											style={{ flex: 1, marginRight: 8 }}>
											{item.acronym ? (
												<Text
													style={{
														fontWeight: "800",
														fontSize: 15,
														color: isDark
															? Colors.dark.text
															: Colors.light.text,
													}}>
													{item.acronym}
												</Text>
											) : null}
											<Text
												size='sm'
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
													lineHeight: 18,
												}}>
												{item.name}
											</Text>
											{item.validity_years ? (
												<Text
													size='xs'
													style={{
														color: isDark
															? Colors.dark.tint
															: Colors.light.tint,
													}}>
													Validité :{" "}
													{item.validity_years} an
													{item.validity_years > 1
														? "s"
														: ""}
												</Text>
											) : null}
										</VStack>
										{alreadyAdded && !isExpired ? (
											<Badge
												size='sm'
												variant='solid'
												action='success'>
												<BadgeIcon as={CheckCircle} />
												<BadgeText
													style={{ marginLeft: 4 }}>
													Déjà soumis
												</BadgeText>
											</Badge>
										) : isExpired &&
										  selectedCategory === "diploma" ? (
											<Badge
												size='sm'
												variant='solid'
												action='warning'>
												<BadgeIcon as={AlertCircle} />
												<BadgeText
													style={{ marginLeft: 4 }}>
													Expiré — renouveler
												</BadgeText>
											</Badge>
										) : (
											<Icon
												as={ChevronRight}
												size='md'
												style={{
													color: isDark
														? Colors.dark.muted
														: Colors.light.muted,
												}}
											/>
										)}
									</HStack>
								</Card>
							</TouchableOpacity>
						);
					})}
				</VStack>
			</VStack>
		);
	};

	/* ---------------------------------------------------------------- */
	/* Step: UPLOAD                                                       */
	/* ---------------------------------------------------------------- */

	const renderUpload = () => {
		const CategoryIcon = getCategoryIcon(selectedCategory);

		return (
			<VStack space='xl'>
				<SectionHeader
					title='Ajouter le document'
					subtitle='Téléchargez une photo ou un PDF de votre document'
					step='Étape 3 / 3'
					onBack={() => {
						setStep("type");
						setSelectedType(null);
						setDocImage(null);
						setCnapsCardNumber("");
						setValidityDate(null);
					}}
				/>

				{/* Récapitulatif */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark
							? Colors.dark.success20
							: Colors.light.success20,
						borderRadius: 12,
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Icon
							as={CategoryIcon}
							size='lg'
							style={{
								color: isDark
									? Colors.dark.success
									: Colors.light.success,
							}}
						/>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 15,
									color: isDark
										? Colors.dark.success
										: Colors.light.success,
								}}>
								{selectedType?.acronym || selectedType?.name}
							</Text>
							{selectedType?.acronym ? (
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
									}}>
									{selectedType.name}
								</Text>
							) : null}
						</VStack>
					</HStack>
				</Card>

				{/* Date de validité */}
				{selectedType?.validity_years ? (
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark
								? Colors.dark.cardBackground
								: Colors.light.cardBackground,
							borderRadius: 12,
						}}>
						<VStack space='md'>
							<VStack space='xs'>
								<Text
									style={{
										fontWeight: "600",
										fontSize: 15,
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Date de fin de validité
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}>
									Durée de validité :{" "}
									{selectedType.validity_years} an
									{selectedType.validity_years > 1 ? "s" : ""}
								</Text>
							</VStack>
							<TouchableOpacity
								activeOpacity={0.7}
								onPress={() => setShowDatePicker(true)}>
								<HStack
									space='sm'
									style={{
										alignItems: "center",
										padding: 14,
										borderRadius: 10,
										borderWidth: 1.5,
										borderColor: validityDate
											? isDark
												? Colors.dark.tint
												: Colors.light.tint
											: isDark
												? Colors.dark.border
												: Colors.light.border,
										backgroundColor: validityDate
											? isDark
												? Colors.dark.tint20
												: Colors.light.tint20
											: isDark
												? Colors.dark.background
												: Colors.light.background,
									}}>
									<Icon
										as={CalendarDays}
										size='md'
										style={{
											color: validityDate
												? isDark
													? Colors.dark.tint
													: Colors.light.tint
												: isDark
													? Colors.dark.muted
													: Colors.light.muted,
										}}
									/>
									<Text
										style={{
											flex: 1,
											fontSize: 15,
											color: validityDate
												? isDark
													? Colors.dark.text
													: Colors.light.text
												: isDark
													? Colors.dark.muted
													: Colors.light.muted,
										}}>
										{validityDate
											? validityDate.toLocaleDateString(
													"fr-FR",
												)
											: "Sélectionner la date de fin de validité…"}
									</Text>
									{validityDate ? (
										<TouchableOpacity
											onPress={() =>
												setValidityDate(null)
											}>
											<Icon
												as={X}
												size='sm'
												style={{
													color: isDark
														? Colors.dark.danger
														: Colors.light.danger,
												}}
											/>
										</TouchableOpacity>
									) : null}
								</HStack>
							</TouchableOpacity>
						</VStack>
					</Card>
				) : null}

				<DateTimePickerModal
					isVisible={showDatePicker}
					mode='date'
					minimumDate={new Date()}
					onConfirm={(date) => {
						setValidityDate(date);
						setShowDatePicker(false);
					}}
					onCancel={() => setShowDatePicker(false)}
					locale='fr_FR'
				/>

				{/* Numéro de carte CNAPS */}
				{selectedCategory === "cnaps" ? (
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark
								? Colors.dark.cardBackground
								: Colors.light.cardBackground,
							borderRadius: 12,
						}}>
						<VStack space='md'>
							<VStack space='xs'>
								<Text
									style={{
										fontWeight: "600",
										fontSize: 15,
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Numéro de carte
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}>
									Saisissez les 7 derniers chiffres du numéro
									indiqué sur votre carte
								</Text>
							</VStack>
							<Input
								size='lg'
								variant='outline'
								style={{
									borderRadius: 10,
									borderColor:
										cnapsCardNumber.length === 7
											? isDark
												? Colors.dark.success
												: Colors.light.success
											: cnapsCardNumber.length > 0
												? isDark
													? Colors.dark.warning
													: Colors.light.warning
												: isDark
													? Colors.dark.border
													: Colors.light.border,
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.background,
								}}>
								<InputField
									value={cnapsCardNumber}
									onChangeText={(t) =>
										setCnapsCardNumber(
											t.replace(/\D/g, "").slice(0, 7),
										)
									}
									keyboardType='numeric'
									maxLength={7}
									placeholder='1234567'
									placeholderTextColor={
										isDark
											? Colors.dark.muted
											: Colors.light.muted
									}
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
										fontSize: 18,
										letterSpacing: 4,
										fontWeight: "700",
									}}
								/>
							</Input>
							{cnapsCardNumber.length > 0 &&
							cnapsCardNumber.length < 7 ? (
								<Text
									size='xs'
									style={{
										color: isDark
											? Colors.dark.warning
											: Colors.light.warning,
									}}>
									{7 - cnapsCardNumber.length} chiffre
									{7 - cnapsCardNumber.length > 1
										? "s"
										: ""}{" "}
									restant
									{7 - cnapsCardNumber.length > 1 ? "s" : ""}
								</Text>
							) : null}
						</VStack>
					</Card>
				) : null}

				{/* Upload block */}
				<Card
					style={{
						padding: 20,
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 12,
						borderWidth: 2,
						borderColor: docImage
							? isDark
								? Colors.dark.success
								: Colors.light.success
							: isDark
								? Colors.dark.border
								: Colors.light.border,
						borderStyle: docImage ? "solid" : "dashed",
					}}>
					<VStack space='md'>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
							}}>
							<Text
								style={{
									fontWeight: "600",
									fontSize: 15,
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
								}}>
								Photo / Fichier
							</Text>
							{docImage ? (
								<TouchableOpacity
									onPress={() => setDocImage(null)}>
									<Box
										style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: isDark
												? Colors.dark.danger20
												: Colors.light.danger20,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={X}
											size='sm'
											style={{
												color: isDark
													? Colors.dark.danger
													: Colors.light.danger,
											}}
										/>
									</Box>
								</TouchableOpacity>
							) : null}
						</HStack>

						{docImage ? (
							docImage.isPdf ? (
								<HStack
									space='sm'
									style={{
										alignItems: "center",
										padding: 16,
										backgroundColor: isDark
											? Colors.dark.elevated
											: Colors.light.elevated,
										borderRadius: 8,
									}}>
									<Icon
										as={FileText}
										size='xl'
										style={{
											color: isDark
												? Colors.dark.tint
												: Colors.light.tint,
										}}
									/>
									<Text
										size='sm'
										style={{
											flex: 1,
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										{docImage.name || "document.pdf"}
									</Text>
								</HStack>
							) : (
								<Box
									style={{
										borderRadius: 8,
										overflow: "hidden",
									}}>
									<Image
										source={{ uri: docImage.uri }}
										alt='document'
										style={{
											width: "100%",
											height: 200,
											borderRadius: 8,
										}}
										resizeMode='cover'
									/>
								</Box>
							)
						) : (
							<Box
								style={{
									height: 120,
									borderRadius: 8,
									backgroundColor: isDark
										? Colors.dark.background
										: Colors.light.background,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={ImageIcon}
									size='xl'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}
								/>
								<Text
									size='sm'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
										marginTop: 8,
									}}>
									Aucun fichier sélectionné
								</Text>
							</Box>
						)}

						<HStack space='sm'>
							<Button
								variant='outline'
								style={{ flex: 1, borderRadius: 8 }}
								onPress={pickFromGallery}>
								<ButtonIcon as={ImageIcon} />
								<ButtonText>Galerie</ButtonText>
							</Button>
							<Button
								variant='outline'
								style={{ flex: 1, borderRadius: 8 }}
								onPress={pickFromFiles}>
								<ButtonIcon as={Paperclip} />
								<ButtonText>Fichiers</ButtonText>
							</Button>
							<Button
								style={{
									flex: 1,
									borderRadius: 8,
									backgroundColor: isDark
										? Colors.dark.success
										: Colors.light.success,
								}}
								onPress={() =>
									navigation?.navigate("CameraScreen", {
										onCapture: setDocImage,
									})
								}>
								<ButtonIcon as={Camera} />
								<ButtonText>Caméra</ButtonText>
							</Button>
						</HStack>
					</VStack>
				</Card>

				{/* Submit */}
				<Button
					size='lg'
					isDisabled={
						!docImage ||
						isSubmitting ||
						(selectedCategory === "cnaps" &&
							cnapsCardNumber.trim().length !== 7)
					}
					onPress={handleSubmit}
					style={{
						borderRadius: 12,
						backgroundColor:
							docImage &&
							!isSubmitting &&
							(selectedCategory !== "cnaps" ||
								cnapsCardNumber.trim().length === 7)
								? isDark
									? Colors.dark.success
									: Colors.light.success
								: isDark
									? Colors.dark.border
									: Colors.light.border,
					}}>
					<ButtonIcon as={Upload} />
					<ButtonText style={{ fontSize: 16, fontWeight: "700" }}>
						{isSubmitting ? "Envoi en cours…" : "Soumettre"}
					</ButtonText>
				</Button>

				{!docImage ? (
					<Text
						size='sm'
						style={{
							color: isDark
								? Colors.dark.muted
								: Colors.light.muted,
							textAlign: "center",
						}}>
						Veuillez ajouter une photo ou un fichier du document
					</Text>
				) : null}
			</VStack>
		);
	};

	/* ---------------------------------------------------------------- */
	/* Root render                                                        */
	/* ---------------------------------------------------------------- */

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark
						? Colors.dark.background
						: Colors.light.background,
				}}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}>
				<Box style={{ padding: 20, paddingBottom: 60 }}>
					{step === "list" && renderList()}
					{step === "category" && renderCategory()}
					{step === "type" && renderType()}
					{step === "upload" && renderUpload()}
				</Box>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default ProDocs;
