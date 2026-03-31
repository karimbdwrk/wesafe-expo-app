import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	Platform,
	TouchableOpacity,
	Animated,
	Easing,
	KeyboardAvoidingView,
	ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetItem,
	ActionsheetItemText,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
	ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { Center } from "@/components/ui/center";
import { Icon } from "@/components/ui/icon";
import {
	Slider,
	SliderThumb,
	SliderTrack,
	SliderFilledTrack,
} from "@/components/ui/slider";

import { LoaderKitView } from "react-native-loader-kit";

import JobCard from "@/components/JobCard";

import {
	ChevronLeft,
	ChevronRight,
	Info,
	SlidersHorizontal,
	Search,
	X,
	MapPin,
	Ticket,
	IdCard,
	FileText,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { CATEGORY } from "@/constants/categories";
import { regions } from "@/constants/regions";
import { departements } from "@/constants/departements";
import { Pressable } from "@/components/ui/pressable";

const ITEMS_PER_PAGE = 100;

// Génère toutes les variantes accentuées/désaccentuées d'un mot
// pour rendre la recherche insensible aux accents côté client
const ACCENT_MAP = {
	e: ["é", "è", "ê", "ë"],
	a: ["à", "â", "ä"],
	u: ["ù", "û", "ü"],
	i: ["î", "ï"],
	o: ["ô"],
	c: ["ç"],
};

const buildAccentVariants = (kw) => {
	const lower = kw.toLowerCase();
	const stripped = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	const variants = new Set([lower, stripped]);
	const uniqueLetters = [...new Set(stripped.split(""))];
	for (const letter of uniqueLetters) {
		if (ACCENT_MAP[letter]) {
			for (const accented of ACCENT_MAP[letter]) {
				variants.add(stripped.replaceAll(letter, accented));
			}
		}
	}
	return [...variants];
};

export default function JobsList({
	pageNbr = 1,
	itemsPerPage = ITEMS_PER_PAGE,
	isLastMinute = false,
}) {
	const scrollRef = useRef(null);
	const { userProfile } = useAuth();
	const { getAll, create } = useDataContext();
	const { isDark } = useTheme();

	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	// single source of truth for sheets: null | 'values' | 'keywords'
	const [activeSheet, setActiveSheet] = useState(null);

	// filters & UI state
	const [values, setValues] = useState([]);
	const [contractTypes, setContractTypes] = useState([]);
	const [workingTimes, setWorkingTimes] = useState([]);
	const [filters, setFilters] = useState("");
	const [keywords, setKeywords] = useState("");

	// geo / city autocomplete
	const [userLat, setUserLat] = useState(userProfile?.latitude || null);
	const [userLon, setUserLon] = useState(userProfile?.longitude || null);
	const [userCity, setUserCity] = useState("");
	const [userCitySelected, setUserCitySelected] = useState(false);
	const [selectedCityName, setSelectedCityName] = useState("");
	const [results, setResults] = useState([]);
	const [distanceKm, setDistanceKm] = useState(0);

	// jobs data + pagination
	const [isLoading, setIsLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(pageNbr);
	const [jobs, setJobs] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

	useEffect(() => {
		console.log(
			"🔄 JobsList useEffect - filters:",
			filters,
			"keywords:",
			keywords,
		);
	}, [filters]);

	// open/close helpers
	const handleOpenBottomSheet = (type) => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
		const previousSheet = activeSheet;
		setActiveSheet(type);
		if (type === "values") {
			// toujours reset le keyword en ouvrant values
			// le useEffect filter se chargera de recalculer filters="" automatiquement
			setPage(1);
			setKeywords("");
		} else if (type === "keywords") {
			// reset et reload uniquement si on venait de values
			if (previousSheet === "values") {
				setPage(1);
				setValues([]);
				setDistanceKm(0);
			}
		}
	};
	const handleCloseSheet = () => setActiveSheet(null);

	// Recherche par code postal — cache Supabase d'abord, sinon API gouv
	useEffect(() => {
		if (!userCity || userCity.length !== 5) {
			setResults([]);
			return;
		}
		const id = setTimeout(async () => {
			// 1. Vérifier le cache Supabase
			try {
				const { data: cached } = await getAll(
					"cities",
					"*",
					`&postcode=eq.${userCity}`,
					1,
					50,
				);
				if (cached && cached.length > 0) {
					console.log("📦 Villes depuis cache Supabase:", cached);
					setResults(cached);
					return;
				}
			} catch (cacheErr) {
				console.warn("Cache cities indisponible:", cacheErr?.message);
			}

			// 2. Fallback API gouv
			try {
				const res = await axios.get(
					`https://geo.api.gouv.fr/communes?codePostal=${userCity}&fields=nom,code,codeDepartement,codeRegion&geometry=centre&format=geojson`,
				);
				const features = res.data.features || [];
				const normalized = features.map((f) => ({
					postcode: userCity,
					code: f.properties.code,
					nom: f.properties.nom,
					department_code: f.properties.codeDepartement,
					region_code: f.properties.codeRegion,
					latitude: f.geometry?.coordinates?.[1] ?? null,
					longitude: f.geometry?.coordinates?.[0] ?? null,
				}));
				// Sauvegarder en background
				normalized.forEach((city) => {
					create("cities", city).catch((e) =>
						console.warn("Erreur save city:", e?.message),
					);
				});
				console.log("🌐 Villes depuis API:", normalized);
				setResults(normalized);
			} catch (err) {
				console.error("Erreur géolocalisation:", err);
			}
		}, 300);
		return () => clearTimeout(id);
	}, [userCity]);

	// bounding box helper
	const getBoundingBox = (centerLat, centerLon, distanceKm) => {
		if (centerLat == null || centerLon == null) return {};
		const earthRadiusKm = 6371;
		const centerLatRad = (centerLat * Math.PI) / 180;
		const deltaLat = (distanceKm / earthRadiusKm) * (180 / Math.PI);
		const deltaLon =
			(distanceKm / (earthRadiusKm * Math.cos(centerLatRad))) *
			(180 / Math.PI);
		return {
			minLat: centerLat - deltaLat,
			maxLat: centerLat + deltaLat,
			minLon: centerLon - deltaLon,
			maxLon: centerLon + deltaLon,
		};
	};

	// sync userProfile coords when focus
	useFocusEffect(
		useCallback(() => {
			if (userProfile && !userCity) {
				setUserLat(userProfile.latitude);
				setUserLon(userProfile.longitude);
				setUserCity(userProfile.postcode || "");
				setSelectedCityName(userProfile.city || "");
				setUserCitySelected(Boolean(userProfile?.city));
				setDistanceKm(0);
			}
		}, [userProfile]),
	);

	// load jobs
	const loadDataJobs = useCallback(async () => {
		setIsLoading(true);
		try {
			// Limite max : 7 jours après création
			const limit7d = new Date(
				Date.now() - 7 * 24 * 60 * 60 * 1000,
			).toISOString();
			// Pour les annonces LM avec une start_date : masquer dès le lendemain de la mission
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayISO = today.toISOString().split("T")[0];

			const lmFilters = isLastMinute
				? `&created_at=gte.${limit7d}&or=(start_date.is.null,start_date.gte.${todayISO})`
				: "";

			const { data, totalCount } = await getAll(
				"jobs",
				"*,companies(logo_url, name)",
				`&is_archived=eq.FALSE${filters}&isLastMinute=eq.${isLastMinute}${lmFilters}`,
				page,
				itemsPerPage,
				"sponsorship_date.desc.nullslast,date.desc",
			);
			setJobs(data || []);
			setTotalCount(totalCount || 0);
		} catch (err) {
			console.error("Erreur chargement jobs:", err);
		} finally {
			setIsLoading(false);
		}
	}, [filters, page, itemsPerPage, isLastMinute, getAll]);

	useEffect(() => {
		loadDataJobs();
	}, [loadDataJobs]);

	// filter builder unique — keywords OU values/distance, jamais les deux ensemble
	useEffect(() => {
		if (keywords.trim() !== "") {
			const variants = buildAccentVariants(keywords.trim());
			const fields = ["title", "description", "category"];
			const conditions = variants.flatMap((t) =>
				fields.map((f) => `${f}.ilike.*${t}*`),
			);
			setFilters(`&or=(${conditions.join(",")})`);
		} else {
			let filterString = "";
			if (values.length > 0) {
				const formatted = values.map((c) => `"${c}"`).join(",");
				filterString += `&category=in.(${formatted})`;
			}
			if (contractTypes.length > 0) {
				const formatted = contractTypes.map((c) => `"${c}"`).join(",");
				filterString += `&contract_type=in.(${formatted})`;
			}
			if (workingTimes.length > 0) {
				const formatted = workingTimes.map((c) => `"${c}"`).join(",");
				filterString += `&work_time=in.(${formatted})`;
			}
			if (userLat != null && userLon != null && distanceKm > 0) {
				const bbox = getBoundingBox(userLat, userLon, distanceKm);
				if (bbox.minLat !== undefined) {
					filterString += `&latitude=gte.${bbox.minLat}&latitude=lte.${bbox.maxLat}`;
					filterString += `&longitude=gte.${bbox.minLon}&longitude=lte.${bbox.maxLon}`;
				}
			}
			setFilters(filterString);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		keywords,
		values,
		contractTypes,
		workingTimes,
		distanceKm,
		userLat,
		userLon,
		userCity,
	]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataJobs();
		setRefreshing(false);
	}, [loadDataJobs]);

	const handleResetKeywords = () => {
		setKeywords("");
		setValues([]);
		setContractTypes([]);
		setWorkingTimes([]);
		setDistanceKm(0);
		setUserCity("");
		setUserCitySelected(false);
		setFilters("");
		setPage(1);
	};
	const handleRemoveValue = (value) =>
		setValues((prev) => prev.filter((v) => v !== value));
	const handleRemoveContractType = (ct) =>
		setContractTypes((prev) => prev.filter((v) => v !== ct));
	const handleRemoveWorkingTime = (wt) =>
		setWorkingTimes((prev) => prev.filter((v) => v !== wt));

	const handleNext = () => {
		setPage((p) => Math.min(p + 1, totalPages));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};
	const handlePrev = () => {
		setPage((p) => Math.max(p - 1, 1));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	// helper: pick a city from suggestions (comme dans postjob.jsx)
	const pickCity = (item) => {
		setSelectedCityName(item.nom);
		setUserLat(item.latitude);
		setUserLon(item.longitude);
		setUserCitySelected(true);
		if (distanceKm === 0) setDistanceKm(20);
	};

	return (
		<>
			<Actionsheet
				snapPoints={[80]}
				isOpen={activeSheet === "values"}
				onClose={handleCloseSheet}>
				<ActionsheetBackdrop />
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={{ width: "100%" }}>
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							style={{
								width: "100%",
								paddingHorizontal: 10,
								paddingVertical: 14,
								borderBottomWidth: 1,
								borderBottomColor: isDark
									? Colors.dark.background
									: Colors.light.background,
								alignItems: "center",
								gap: 10,
							}}>
							<Box
								style={{
									backgroundColor: isDark
										? "#1e3a5f"
										: "#dbeafe",
									borderRadius: 10,
									padding: 8,
								}}>
								<Icon
									as={SlidersHorizontal}
									size='md'
									color={
										isDark
											? Colors.dark.tint
											: Colors.light.tint
									}
								/>
							</Box>
							<VStack style={{ gap: 1 }}>
								<Heading
									size='md'
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Filtres
								</Heading>
								<Text
									size='xs'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}>
									Localisation, distance, catégories
								</Text>
							</VStack>
						</HStack>
						<ActionsheetScrollView
							style={{ paddingBottom: 20, paddingTop: 10 }}>
							<VStack
								space='md'
								style={{
									paddingHorizontal: 10,
									paddingTop: 10,
								}}>
								<Heading>Localisation</Heading>
								<Input>
									<InputSlot className='pl-3'>
										<InputIcon as={MapPin} />
									</InputSlot>
									<InputField
										placeholder='Code postal...'
										keyboardType='numeric'
										maxLength={5}
										value={userCity}
										onChangeText={(text) => {
											const digits = text
												.replace(/\D/g, "")
												.slice(0, 5);
											setUserCity(digits);
											setUserCitySelected(false);
											setSelectedCityName("");
										}}
									/>
								</Input>

								{results.length > 0 && (
									<VStack
										space='sm'
										style={{ marginTop: 10 }}>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											Sélectionnez la ville
										</Text>
										<VStack space='xs'>
											{results.map((item) => (
												<TouchableOpacity
													key={item.code}
													onPress={() =>
														pickCity(item)
													}>
													<Box
														style={{
															padding: 12,
															backgroundColor:
																selectedCityName ===
																item.nom
																	? isDark
																		? "#1f2937"
																		: "#dbeafe"
																	: isDark
																		? Colors
																				.dark
																				.background
																		: Colors
																				.light
																				.background,
															borderRadius: 8,
															borderWidth: 1,
															borderColor:
																selectedCityName ===
																item.nom
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
															{item.nom} (
															{
																item.department_code
															}
															)
														</Text>
													</Box>
												</TouchableOpacity>
											))}
										</VStack>
									</VStack>
								)}

								{userCitySelected && (
									<VStack
										space='sm'
										style={{ marginTop: 15 }}>
										<HStack
											style={{
												justifyContent: "space-between",
												alignItems: "center",
											}}>
											<Heading>Distance</Heading>
											<Text>{distanceKm} km</Text>
										</HStack>
										<Center
											style={{
												paddingHorizontal: 0,
												paddingVertical: 10,
											}}>
											<Slider
												defaultValue={30}
												size='lg'
												orientation='horizontal'
												onChange={(value) =>
													setDistanceKm(value)
												}
												value={distanceKm}
												minValue={0}
												maxValue={200}
												step={5}>
												<SliderTrack>
													<SliderFilledTrack />
												</SliderTrack>
												<SliderThumb />
											</Slider>
										</Center>
									</VStack>
								)}
								<VStack space='sm' style={{ marginTop: 10 }}>
									<Heading>Type de contrat</Heading>
									<HStack
										style={{
											flexWrap: "wrap",
											gap: 8,
											marginTop: 8,
										}}>
										{["CDI", "CDD"].map((ct) => {
											const selected =
												contractTypes.includes(ct);
											return (
												<Pressable
													key={ct}
													onPress={() =>
														setContractTypes(
															(prev) =>
																prev.includes(
																	ct,
																)
																	? []
																	: [ct],
														)
													}
													style={{
														paddingHorizontal: 14,
														paddingVertical: 7,
														borderRadius: 20,
														borderWidth: 1.5,
														borderColor: selected
															? Colors.light.tint
															: Colors.light
																	.border,
														backgroundColor:
															selected
																? Colors.light
																		.tint
																: "transparent",
													}}>
													<Text
														style={{
															color: selected
																? "#fff"
																: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.muted,
															fontWeight: selected
																? "700"
																: "400",
															fontSize: 13,
														}}>
														{ct}
													</Text>
												</Pressable>
											);
										})}
									</HStack>
								</VStack>
								<VStack space='sm' style={{ marginTop: 15 }}>
									<Heading>Temps de travail</Heading>
									<HStack
										style={{
											flexWrap: "wrap",
											gap: 8,
											marginTop: 8,
										}}>
										{[
											{
												label: "TEMPS PARTIEL",
												value: "parttime",
											},
											{
												label: "TEMPS PLEIN",
												value: "fulltime",
											},
										].map((opt) => {
											const selected =
												workingTimes.includes(
													opt.value,
												);
											return (
												<Pressable
													key={opt.value}
													onPress={() =>
														setWorkingTimes(
															(prev) =>
																prev.includes(
																	opt.value,
																)
																	? []
																	: [
																			opt.value,
																		],
														)
													}
													style={{
														paddingHorizontal: 14,
														paddingVertical: 7,
														borderRadius: 20,
														borderWidth: 1.5,
														borderColor: selected
															? Colors.light.tint
															: Colors.light
																	.border,
														backgroundColor:
															selected
																? Colors.light
																		.tint
																: "transparent",
													}}>
													<Text
														style={{
															color: selected
																? "#fff"
																: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.muted,
															fontWeight: selected
																? "700"
																: "400",
															fontSize: 13,
														}}>
														{opt.label}
													</Text>
												</Pressable>
											);
										})}
									</HStack>
								</VStack>
								<VStack space='sm' style={{ marginTop: 15 }}>
									<Heading>Catégories</Heading>
									<HStack
										style={{
											flexWrap: "wrap",
											gap: 8,
											marginTop: 8,
										}}>
										{CATEGORY.map((cat) => {
											const selected = values.includes(
												cat.id,
											);
											return (
												<Pressable
													key={cat.id}
													onPress={() =>
														setValues((prev) =>
															prev.includes(
																cat.id,
															)
																? prev.filter(
																		(v) =>
																			v !==
																			cat.id,
																	)
																: [
																		...prev,
																		cat.id,
																	],
														)
													}
													style={{
														paddingHorizontal: 14,
														paddingVertical: 7,
														borderRadius: 20,
														borderWidth: 1.5,
														borderColor: selected
															? Colors.light.tint
															: Colors.light
																	.border,
														backgroundColor:
															selected
																? Colors.light
																		.tint
																: "transparent",
													}}>
													<Text
														style={{
															color: selected
																? "#fff"
																: isDark
																	? Colors
																			.dark
																			.text
																	: Colors
																			.light
																			.muted,
															fontWeight: selected
																? "700"
																: "400",
															fontSize: 13,
														}}>
														{cat.acronym}
													</Text>
												</Pressable>
											);
										})}
									</HStack>
								</VStack>
							</VStack>
						</ActionsheetScrollView>
					</ActionsheetContent>
				</KeyboardAvoidingView>
			</Actionsheet>
			<Actionsheet
				isOpen={activeSheet === "keywords"}
				onClose={handleCloseSheet}>
				<ActionsheetBackdrop />
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={{ width: "100%" }}>
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							style={{
								width: "100%",
								paddingHorizontal: 10,
								paddingVertical: 14,
								borderBottomWidth: 1,
								borderBottomColor: isDark
									? Colors.dark.background
									: Colors.light.background,
								alignItems: "center",
								gap: 10,
							}}>
							<Box
								style={{
									backgroundColor: isDark
										? "#1e3a5f"
										: "#dbeafe",
									borderRadius: 10,
									padding: 8,
								}}>
								<Icon
									as={Search}
									size='md'
									color={
										isDark
											? Colors.dark.tint
											: Colors.light.tint
									}
								/>
							</Box>
							<VStack style={{ gap: 1 }}>
								<Heading
									size='md'
									style={{
										color: isDark
											? Colors.dark.text
											: Colors.light.text,
									}}>
									Recherche
								</Heading>
								<Text
									size='xs'
									style={{
										color: isDark
											? Colors.dark.muted
											: Colors.light.muted,
									}}>
									Recherche par mots-clés
								</Text>
							</VStack>
						</HStack>

						<ActionsheetScrollView style={{ paddingBottom: 20 }}>
							<VStack
								style={{
									paddingHorizontal: 5,
									paddingTop: 10,
								}}>
								<Input style={{ borderRadius: 12 }}>
									<InputField
										placeholder='Search...'
										value={keywords}
										onChangeText={(text) => {
											setKeywords(text);
											setValues([]);
											setDistanceKm(0);
											setUserCity(
												userProfile?.postcode || "",
											);
											setSelectedCityName(
												userProfile?.city || "",
											);
											setUserCitySelected(false);
										}}
									/>
									<InputSlot className='pr-3'>
										<InputIcon as={Search} />
									</InputSlot>
								</Input>
							</VStack>
						</ActionsheetScrollView>
					</ActionsheetContent>
				</KeyboardAvoidingView>
			</Actionsheet>
			<VStack style={styles.container}>
				<HStack
					style={{
						width: "100%",
						justifyContent: "flex-end",
						position: "absolute",
						bottom:
							totalPages > 1
								? isLastMinute
									? 84
									: 60
								: isLastMinute
									? 24
									: 0,
						right: 0,
						zIndex: 999,
					}}>
					<Button
						onPress={() => handleOpenBottomSheet("values")}
						size='xl'
						className='rounded-full p-3.5'
						action='secondary'
						style={styles.fabValues}>
						<ButtonIcon as={SlidersHorizontal} />
					</Button>
					<Button
						onPress={() => handleOpenBottomSheet("keywords")}
						size='xl'
						className='rounded-full p-3.5'
						action='secondary'
						style={styles.fabKeywords}>
						<ButtonIcon as={Search} />
					</Button>
				</HStack>
				{(values.length > 0 ||
					contractTypes.length > 0 ||
					workingTimes.length > 0 ||
					keywords ||
					(selectedCityName && distanceKm > 0)) && (
					<VStack style={styles.filtersRow}>
						<HStack style={styles.filterWrap}>
							{values.map((value) => (
								<Badge
									key={value}
									size='md'
									variant='solid'
									action='muted'>
									<BadgeIcon as={IdCard} className='mr-2' />
									<BadgeText>{value}</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={() => handleRemoveValue(value)}
									/>
								</Badge>
							))}
							{contractTypes.map((ct) => (
								<Badge
									key={ct}
									size='md'
									variant='solid'
									action='muted'>
									<BadgeIcon as={FileText} className='mr-2' />
									<BadgeText>{ct}</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={() =>
											handleRemoveContractType(ct)
										}
									/>
								</Badge>
							))}
							{workingTimes.map((wt) => (
								<Badge
									key={wt}
									size='md'
									variant='solid'
									action='muted'>
									<BadgeText>
										{wt === "fulltime"
											? "Temps plein"
											: "Temps partiel"}
									</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={() =>
											handleRemoveWorkingTime(wt)
										}
									/>
								</Badge>
							))}
							{keywords ? (
								<Badge size='md' variant='solid' action='muted'>
									<BadgeIcon as={Search} className='mr-2' />
									<BadgeText>{keywords}</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={handleResetKeywords}
									/>
								</Badge>
							) : null}
							{distanceKm > 0 ? (
								<Badge size='md' variant='solid' action='muted'>
									<BadgeIcon as={MapPin} className='mr-2' />
									<BadgeText>{`${userCity} < ${distanceKm} km`}</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={() => setDistanceKm(0)}
									/>
								</Badge>
							) : null}
						</HStack>
						<HStack style={{ justifyContent: "flex-end" }}>
							<Text size='sm'>
								{totalCount} résultat{totalCount > 1 ? "s" : ""}
							</Text>
						</HStack>
					</VStack>
				)}

				{/* main list */}
				<ScrollView
					ref={scrollRef}
					style={[
						styles.scrollView,
						{
							backgroundColor: isDark
								? Colors.dark.background
								: Colors.light.background,
						},
					]}
					contentContainerStyle={{
						paddingBottom: totalPages > 1 ? 80 : 0,
					}}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}>
					{isLoading ? (
						<Center style={{ paddingVertical: 90 }}>
							<ActivityIndicator
								size='large'
								color={
									isDark
										? Colors.light.tint
										: Colors.light.tint
								}
							/>
						</Center>
					) : (
						<View style={styles.jobList}>
							{!jobs.length ? (
								<HStack
									justifyContent='center'
									style={{ paddingVertical: 90 }}>
									<Badge
										size='md'
										variant='solid'
										action='warning'>
										<BadgeIcon as={Info} className='mr-2' />
										<BadgeText>Aucun résultat</BadgeText>
									</Badge>
								</HStack>
							) : (
								jobs.map((job) => (
									<JobCard
										key={job?.id}
										id={job?.id}
										title={job?.title}
										category={job?.category}
										company_id={job?.company_id}
										city={job?.city}
										postcode={job?.postcode}
										department={job?.department_code}
										logo={job?.companies?.logo_url}
										company_name={job?.companies?.name}
										contract_type={job?.contract_type}
										working_time={job?.work_time}
										salary_hourly={job?.salary_hourly}
										salary_amount={job?.salary_amount}
										salary_min={job?.salary_min}
										salary_max={job?.salary_max}
										salary_type={job?.salary_type}
										salary_monthly_fixed={
											job?.salary_monthly_fixed
										}
										salary_monthly_min={
											job?.salary_monthly_min
										}
										salary_monthly_max={
											job?.salary_monthly_max
										}
										salary_annual_fixed={
											job?.salary_annual_fixed
										}
										salary_annual_min={
											job?.salary_annual_min
										}
										salary_annual_max={
											job?.salary_annual_max
										}
										isLastMinute={job?.isLastMinute}
										vacations={job?.vacations}
										date_mode={job?.date_mode}
										start_date_asap={job?.start_date_asap}
										start_date={job?.start_date}
										end_date={job?.end_date}
										sponsorship_date={job?.sponsorship_date}
									/>
								))
							)}
						</View>
					)}
				</ScrollView>

				{/* Pagination (fixed bottom) */}
				{totalPages > 1 && (
					<Box
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: isDark
								? Colors.dark.cardBackground
								: Colors.light.cardBackground,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: -2 },
							shadowOpacity: 0.08,
							shadowRadius: 8,
							elevation: 8,
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
							paddingVertical: 16,
							paddingHorizontal: 28,
							paddingBottom: isLastMinute ? 30 : 14,
							alignItems: "center",
						}}>
						<HStack
							space='md'
							className='w-full justify-between items-center'>
							<Button
								isDisabled={page === 1}
								onPress={handlePrev}
								variant='outline'
								style={{
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
									borderRadius: 12,
								}}>
								<ButtonIcon
									as={ChevronLeft}
									color={
										isDark
											? Colors.dark.text
											: Colors.light.text
									}
								/>
							</Button>
							<Text
								style={{
									color: isDark
										? Colors.dark.text
										: Colors.light.text,
									fontWeight: "600",
									fontSize: 16,
								}}>
								Page {page} / {totalPages}
							</Text>
							<Button
								isDisabled={page >= totalPages}
								onPress={handleNext}
								variant='outline'
								style={{
									borderColor: isDark
										? Colors.dark.border
										: Colors.light.border,
									borderRadius: 12,
								}}>
								<ButtonIcon
									as={ChevronRight}
									color={
										isDark
											? Colors.dark.text
											: Colors.light.text
									}
								/>
							</Button>
						</HStack>
					</Box>
				)}
			</VStack>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		width: "100%",
		// backgroundColor: "white",
	},
	fabValues: {
		position: "absolute",
		bottom: 10,
		right: 10,
		zIndex: 9999,
	},
	fabKeywords: {
		position: "absolute",
		bottom: 10,
		right: 60,
		zIndex: 9999,
	},
	filtersRow: {
		width: "100%",
		padding: 15,
		gap: 10,
	},
	filterWrap: {
		width: "100%",
		gap: 10,
		justifyContent: "flex-start",
		alignItems: "center",
		flexWrap: "wrap",
	},
	scrollView: {
		flex: 1,
		width: "100%",
		paddingHorizontal: 10,
	},
	jobList: {
		flex: 1,
		gap: 5,
		width: "100%",
		marginVertical: 15,
	},
});
