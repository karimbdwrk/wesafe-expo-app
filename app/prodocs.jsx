import React, { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
import { Input, InputField } from "@/components/ui/input";
import {
	useToast,
	Toast,
	ToastTitle,
	ToastDescription,
} from "@/components/ui/toast";
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
import { useTheme } from "@/context/ThemeContext";
import { createSupabaseClient } from "@/lib/supabase";

const DOCUMENTS_BUCKET = "pro-documents";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const CNAPS_ACTIVITIES = [
	{
		code: "SURVEILLANCE_HUMAINE",
		name: "Surveillance humaine ou gardiennage",
	},
	{ code: "CYNOPHILE", name: "Surveillance humaine avec chien" },
	{
		code: "PROTECTION_RAPPROCHEE",
		name: "Protection physique des personnes",
	},
	{ code: "TRANSPORT_FONDS", name: "Transport de fonds" },
	{ code: "SURETE_AEROPORTUAIRE", name: "Sûreté aéroportuaire" },
];

const DIPLOMAS = [
	{
		code: "TFP_APS",
		name: "Titre à Finalité Professionnelle Agent de Prévention et de Sécurité",
		acronym: "TFP APS",
		validity_years: null,
	},
	{
		code: "SSIAP_1",
		name: "Service de Sécurité Incendie et Assistance à Personnes niveau 1",
		acronym: "SSIAP 1",
		validity_years: 3,
	},
	{
		code: "SSIAP_2",
		name: "Service de Sécurité Incendie et Assistance à Personnes niveau 2",
		acronym: "SSIAP 2",
		validity_years: 3,
	},
	{
		code: "SSIAP_3",
		name: "Service de Sécurité Incendie et Assistance à Personnes niveau 3",
		acronym: "SSIAP 3",
		validity_years: 3,
	},
	{
		code: "TFP_ASC",
		name: "Titre à Finalité Professionnelle Agent de Sécurité Cynophile",
		acronym: "TFP ASC",
		validity_years: null,
	},
	{
		code: "TFP_APR",
		name: "Titre à Finalité Professionnelle Agent de Protection Rapprochée",
		acronym: "TFP APR",
		validity_years: null,
	},
	{
		code: "TFP_OTS",
		name: "Titre à Finalité Professionnelle Opérateur en Télésurveillance",
		acronym: "TFP OTS",
		validity_years: null,
	},
	{
		code: "TFP_ASA",
		name: "Titre à Finalité Professionnelle Agent de Sûreté Aéroportuaire",
		acronym: "TFP ASA",
		validity_years: null,
	},
];

const CERTIFICATIONS = [
	{
		code: "SST",
		name: "Sauveteur Secouriste du Travail",
		acronym: "SST",
		validity_years: 2,
	},
	{
		code: "MAC_SST",
		name: "Maintien et Actualisation des Compétences SST",
		acronym: "MAC SST",
		validity_years: 2,
	},
	{
		code: "H0B0",
		name: "Habilitation électrique H0B0",
		acronym: "H0B0",
		validity_years: 3,
	},
	{
		code: "MAC_SSIAP",
		name: "Maintien et Actualisation des Compétences SSIAP",
		acronym: "MAC SSIAP",
		validity_years: 3,
	},
	{
		code: "PSE1",
		name: "Premiers Secours en Équipe niveau 1",
		acronym: "PSE1",
		validity_years: 1,
	},
	{
		code: "PSE2",
		name: "Premiers Secours en Équipe niveau 2",
		acronym: "PSE2",
		validity_years: 2,
	},
];

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
			color: "#ef4444",
			icon: "expired",
		};
	if (exp <= inSixMonths)
		return {
			label: `Expire le ${formatDate(expiresAt)}`,
			color: "#f59e0b",
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

const getCategoryColor = (cat) => {
	if (cat === "cnaps") return { bg: "#eff6ff", icon: "#2563eb" };
	if (cat === "diploma") return { bg: "#f0fdf4", icon: "#16a34a" };
	return { bg: "#fdf4ff", icon: "#9333ea" };
};

const getDocInfo = (category, typeCode) => {
	if (category === "cnaps") {
		const act = CNAPS_ACTIVITIES.find((a) => a.code === typeCode);
		return { acronym: "CNAPS", name: act?.name || typeCode };
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
			const [cnapsRes, diplomasRes, certsRes] = await Promise.all([
				supabase
					.from("user_cnaps_cards")
					.select("*")
					.eq("user_id", user.id)
					.order("created_at", { ascending: false }),
				supabase
					.from("user_diplomas")
					.select("*")
					.eq("user_id", user.id)
					.order("created_at", { ascending: false }),
				supabase
					.from("user_certifications")
					.select("*")
					.eq("user_id", user.id)
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
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

		// Extension de stockage
		const storageExt =
			mime === "application/pdf"
				? "pdf"
				: mime === "image/jpeg"
					? "jpg"
					: mime.split("/")[1] || "jpg";

		const filename = `${user.id}/${selectedCategory}_${selectedType.code}_${Date.now()}.${storageExt}`;

		// Lire le fichier local → blob (React Native fetch supporte file://)
		const localResponse = await fetch(docImage.uri);
		const blob = await localResponse.blob();

		// Upload via le client Supabase (JWT injecté automatiquement)
		const supabase = createSupabaseClient(accessToken);
		const { error: uploadError } = await supabase.storage
			.from(DOCUMENTS_BUCKET)
			.upload(filename, blob, {
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
		if (!docImage) return;
		if (selectedCategory === "cnaps" && cnapsCardNumber.trim().length !== 7)
			return;
		// Garde anti-doublon
		const isDuplicate = docs.some(
			(d) =>
				d._category === selectedCategory &&
				d.type === selectedType?.code,
		);
		if (isDuplicate) {
			toast.show({
				placement: "top",
				duration: 3000,
				render: ({ id }) => (
					<Toast nativeID={id} action='warning' variant='accent'>
						<Icon
							as={AlertCircle}
							size='lg'
							style={{ color: "#f59e0b" }}
						/>
						<VStack space='xs' style={{ flex: 1, marginLeft: 8 }}>
							<ToastTitle>Document déjà soumis</ToastTitle>
							<ToastDescription>
								Ce document est déjà dans votre dossier.
							</ToastDescription>
						</VStack>
					</Toast>
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
					<Toast nativeID={id} action='success' variant='accent'>
						<Icon
							as={CheckCircle}
							size='lg'
							style={{ color: "#10b981" }}
						/>
						<VStack space='xs' style={{ flex: 1, marginLeft: 8 }}>
							<ToastTitle>Document soumis !</ToastTitle>
							<ToastDescription>
								Votre document est en cours de vérification.
							</ToastDescription>
						</VStack>
					</Toast>
				),
			});
		} catch (e) {
			console.error("handleSubmit error:", e);
			toast.show({
				placement: "top",
				duration: 4000,
				render: ({ id }) => (
					<Toast nativeID={id} action='error' variant='accent'>
						<Icon
							as={AlertCircle}
							size='lg'
							style={{ color: "#ef4444" }}
						/>
						<VStack space='xs' style={{ flex: 1, marginLeft: 8 }}>
							<ToastTitle>Erreur lors de l'envoi</ToastTitle>
							<ToastDescription>
								Veuillez réessayer.
							</ToastDescription>
						</VStack>
					</Toast>
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

	const SectionHeader = ({ title, onBack }) => (
		<HStack space='sm' style={{ alignItems: "center", marginBottom: 4 }}>
			{onBack && (
				<TouchableOpacity onPress={onBack} activeOpacity={0.7}>
					<Icon
						as={ChevronLeft}
						size='lg'
						style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
					/>
				</TouchableOpacity>
			)}
			<Heading
				size='xl'
				style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
				{title}
			</Heading>
		</HStack>
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
				color: getCategoryColor("cnaps"),
			},
			{
				key: "diploma",
				label: "Diplômes",
				icon: GraduationCap,
				color: getCategoryColor("diploma"),
			},
			{
				key: "certification",
				label: "Certifications",
				icon: Award,
				color: getCategoryColor("certification"),
			},
		];

		return (
			<VStack space='2xl'>
				{/* Header */}
				<VStack space='sm'>
					<Heading
						size='2xl'
						style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
						Documents professionnels
					</Heading>
					<Text
						size='md'
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
						Cartes CNAPS, diplômes et certifications
					</Text>
				</VStack>

				{/* Add button */}
				<Button
					size='lg'
					onPress={() => setStep("category")}
					style={{ borderRadius: 12, backgroundColor: "#2563eb" }}>
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
										? "#374151"
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
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								{label}
							</Text>
						</HStack>

						{grouped[key].length === 0 ? (
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
								}}>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
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
												? "#374151"
												: "#ffffff",
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
																			? "#f3f4f6"
																			: "#111827",
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
																		? "#9ca3af"
																		: "#6b7280",
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
																? "#60a5fa"
																: "#2563eb",
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
																		color: "#ef4444",
																	}}
																/>
															) : exp.icon ===
															  "soon" ? (
																<Icon
																	as={Clock}
																	size='2xs'
																	style={{
																		color: "#f59e0b",
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
																			? "#9ca3af"
																			: "#6b7280"),
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
															? "#6b7280"
															: "#9ca3af",
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
				color: getCategoryColor("cnaps"),
			},
			{
				key: "diploma",
				label: "Diplôme professionnel",
				subtitle: "TFP APS, SSIAP 1/2/3, TFP ASC…",
				icon: GraduationCap,
				color: getCategoryColor("diploma"),
			},
			{
				key: "certification",
				label: "Certification",
				subtitle: "SST, H0B0, PSE1/2, MAC SSIAP…",
				icon: Award,
				color: getCategoryColor("certification"),
			},
		];

		return (
			<VStack space='xl'>
				<SectionHeader
					title='Type de document'
					onBack={() => setStep("list")}
				/>
				<Text
					size='md'
					style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
					Choisissez la catégorie de votre document
				</Text>
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
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 2,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 52,
										height: 52,
										borderRadius: 26,
										backgroundColor: isDark
											? "#1f2937"
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
												? "#f3f4f6"
												: "#111827",
										}}>
										{label}
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{subtitle}
									</Text>
								</VStack>
								<Icon
									as={ChevronRight}
									size='md'
									style={{
										color: isDark ? "#6b7280" : "#9ca3af",
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
				acronym: "CNAPS",
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
				.filter((d) => d._category === selectedCategory)
				.map((d) => d.type),
		);

		return (
			<VStack space='xl'>
				<SectionHeader
					title={categoryLabel}
					onBack={() => {
						setStep("category");
						setSelectedCategory(null);
					}}
				/>
				<Text
					size='md'
					style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
					Sélectionnez votre document
				</Text>
				<VStack space='sm'>
					{items.map((item) => {
						const alreadyAdded = existingTypes.has(item.code);
						return (
						<TouchableOpacity
							key={item.code}
							activeOpacity={alreadyAdded ? 1 : 0.7}
							disabled={alreadyAdded}
							onPress={() => {
								if (alreadyAdded) return;
								setSelectedType(item);
								setStep("upload");
							}}>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: alreadyAdded
										? isDark ? "#374151" : "#f3f4f6"
										: isDark ? "#4b5563" : "#e5e7eb",
									opacity: alreadyAdded ? 0.55 : 1,
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
														? "#f3f4f6"
														: "#111827",
												}}>
												{item.acronym}
											</Text>
										) : null}
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												lineHeight: 18,
											}}>
											{item.name}
										</Text>
										{item.validity_years ? (
											<Text
												size='xs'
												style={{
													color: isDark
														? "#60a5fa"
														: "#2563eb",
												}}>
												Validité : {item.validity_years}{" "}
												an
												{item.validity_years > 1
													? "s"
													: ""}
											</Text>
										) : null}
									</VStack>
									{alreadyAdded ? (
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
									) : (
										<Icon
											as={ChevronRight}
											size='md'
											style={{
												color: isDark
													? "#6b7280"
													: "#9ca3af",
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
						backgroundColor: isDark ? "#065f46" : "#dcfce7",
						borderRadius: 12,
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Icon
							as={CategoryIcon}
							size='lg'
							style={{ color: isDark ? "#d1fae5" : "#16a34a" }}
						/>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								style={{
									fontWeight: "700",
									fontSize: 15,
									color: isDark ? "#d1fae5" : "#14532d",
								}}>
								{selectedType?.acronym || selectedType?.name}
							</Text>
							{selectedType?.acronym ? (
								<Text
									size='sm'
									style={{
										color: isDark ? "#a7f3d0" : "#166534",
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
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
						}}>
						<VStack space='md'>
							<VStack space='xs'>
								<Text
									style={{
										fontWeight: "600",
										fontSize: 15,
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Date de fin de validité
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
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
											? "#2563eb"
											: isDark
												? "#4b5563"
												: "#d1d5db",
										backgroundColor: validityDate
											? isDark
												? "#1e3a8a"
												: "#eff6ff"
											: isDark
												? "#1f2937"
												: "#f9fafb",
									}}>
									<Icon
										as={CalendarDays}
										size='md'
										style={{
											color: validityDate
												? "#2563eb"
												: "#9ca3af",
										}}
									/>
									<Text
										style={{
											flex: 1,
											fontSize: 15,
											color: validityDate
												? isDark
													? "#f3f4f6"
													: "#111827"
												: "#9ca3af",
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
												style={{ color: "#dc2626" }}
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
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
						}}>
						<VStack space='md'>
							<VStack space='xs'>
								<Text
									style={{
										fontWeight: "600",
										fontSize: 15,
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Numéro de carte
								</Text>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
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
											? "#10b981"
											: cnapsCardNumber.length > 0
												? "#f59e0b"
												: isDark
													? "#4b5563"
													: "#d1d5db",
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
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
									placeholderTextColor='#9ca3af'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontSize: 18,
										letterSpacing: 4,
										fontWeight: "700",
									}}
								/>
							</Input>
							{cnapsCardNumber.length > 0 &&
							cnapsCardNumber.length < 7 ? (
								<Text size='xs' style={{ color: "#f59e0b" }}>
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
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						borderWidth: 2,
						borderColor: docImage
							? "#10b981"
							: isDark
								? "#4b5563"
								: "#e5e7eb",
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
									color: isDark ? "#f3f4f6" : "#111827",
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
											backgroundColor: "#fee2e2",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={X}
											size='sm'
											style={{ color: "#dc2626" }}
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
											? "#1f2937"
											: "#f3f4f6",
										borderRadius: 8,
									}}>
									<Icon
										as={FileText}
										size='xl'
										style={{ color: "#2563eb" }}
									/>
									<Text
										size='sm'
										style={{
											flex: 1,
											color: isDark
												? "#d1d5db"
												: "#374151",
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
										? "#1f2937"
										: "#f9fafb",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon
									as={ImageIcon}
									size='xl'
									style={{
										color: isDark ? "#6b7280" : "#d1d5db",
									}}
								/>
								<Text
									size='sm'
									style={{ color: "#9ca3af", marginTop: 8 }}>
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
									backgroundColor: "#16a34a",
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
								? "#16a34a"
								: "#d1d5db",
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
							color: isDark ? "#9ca3af" : "#6b7280",
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
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
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
