import React, { useState, useEffect, useCallback, useRef, use } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import axios from "axios";
import PagerView from "react-native-pager-view";
import { useActionSheet } from "@expo/react-native-action-sheet";
// import Modal from "react-native-modal";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
// import {
// 	Actionsheet,
// 	ActionsheetContent,
// 	ActionsheetItem,
// 	ActionsheetItemText,
// 	ActionsheetDragIndicator,
// 	ActionsheetDragIndicatorWrapper,
// 	ActionsheetBackdrop,
// 	ActionsheetScrollView,
// } from "@/components/ui/actionsheet";
import {
	Checkbox,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxIcon,
	CheckboxGroup,
} from "@/components/ui/checkbox";
import { Center } from "@/components/ui/center";
import {
	Slider,
	SliderThumb,
	SliderTrack,
	SliderFilledTrack,
} from "@/components/ui/slider";

import JobCard from "@/components/JobCard";

import {
	ChevronLeft,
	ChevronRight,
	Info,
	SlidersHorizontal,
	Check,
	Search,
	X,
	Pin,
	MapPin,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import JobsList from "@/components/JobsList";
import MiniJobsList from "@/components/MiniJobsList";
import ApplicationsProList from "@/components/ApplicationsProList";

const ITEMS_PER_PAGE = 5;
const today = new Date();

export default function Tab1() {
	const scrollRef = useRef(null);
	const { user, accessToken, role, userProfile, userCompany, loadSession } =
		useAuth();
	const { getAll, isLoading } = useDataContext();

	const router = useRouter();

	const { showActionSheetWithOptions } = useActionSheet();
	const [visible, setVisible] = useState(false);

	const openSheet = () => setVisible(true);
	const closeSheet = () => setVisible(false);

	const pagerRef = useRef(null);
	const [activePage, setActivePage] = useState(0);
	const numPages = 2;

	const goToPage = (pageIndex) => {
		pagerRef.current?.setPage(pageIndex);
	};

	const [showActionsheet, setShowActionsheet] = useState(false);
	const handleClose = () => setShowActionsheet(false);

	const [showActionsheet2, setShowActionsheet2] = useState(false);
	const handleClose2 = () => setShowActionsheet2(false);

	const [values, setValues] = useState([]);
	const [resetValues, setResetValues] = useState(false);
	const [filters, setFilters] = useState("");
	const [keywords, setKeywords] = useState("");
	const [switchToKeywords, setSwitchToKeywords] = useState(false);

	const [userLat, setUserLat] = useState(userProfile?.latitude || null);
	const [userLon, setUserLon] = useState(userProfile?.longitude || null);
	const [userCity, setUserCity] = useState(userProfile?.city || null);
	const [userCitySelected, setUserCitySelected] = useState(true);
	const [results, setResults] = useState([]);

	const [myProcards, setMyProcards] = useState([]);
	const [myCategories, setMyCategories] = useState([]);

	const [minLat, setMinLat] = useState(null);
	const [maxLat, setMaxLat] = useState(null);
	const [minLon, setMinLon] = useState(null);
	const [maxLon, setMaxLon] = useState(null);
	const [distanceKm, setDistanceKm] = useState(0);

	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const [jobs, setJobs] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	useFocusEffect(
		useCallback(() => {
			loadSession();
			if (userProfile) {
				setMyProcards(userProfile.procards || []);
			}
		}, [userProfile]),
	);

	useEffect(() => {
		const newCategories = new Set();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		myProcards.forEach((card) => {
			const cardValidityDate = new Date(card.validity_date);
			cardValidityDate.setHours(0, 0, 0, 0);
			if (card.isValid && cardValidityDate >= today) {
				newCategories.add(card.category);
			}
		});
		setMyCategories(Array.from(newCategories));
	}, [myProcards]);

	useEffect(() => {
		const fetchCities = async () => {
			if (userCity && userCity.length < 2) return setResults([]);
			try {
				const res = await axios.get(
					`https://geo.api.gouv.fr/communes`,
					{
						params: {
							nom: userCity,
							fields: "nom,codesPostaux,codeDepartement,centre",
							limit: 5,
							boost: "population",
						},
					},
				);
				setResults(res.data);
			} catch (err) {
				console.error("Erreur de géolocalisation :", err);
			}
		};
		const timeout = setTimeout(fetchCities, 300); // debounce
		return () => clearTimeout(timeout);
	}, [userCity]);

	const getBoundingBox = (centerLat, centerLon, distanceKm) => {
		const earthRadiusKm = 6371; // Rayon moyen de la Terre en kilomètres

		// Convertir la latitude centrale en radians pour le calcul du cosinus
		const centerLatRad = centerLat * (Math.PI / 180);

		// Calcul de la variation en degrés de latitude pour la distance donnée
		// 1 degré de latitude est environ 111 km
		const deltaLat = (distanceKm / earthRadiusKm) * (180 / Math.PI); // Variation en degrés de latitude

		// Calcul de la variation en degrés de longitude pour la distance donnée
		// La distance d'un degré de longitude diminue avec la latitude (cosinus)
		const deltaLon =
			(distanceKm / (earthRadiusKm * Math.cos(centerLatRad))) *
			(180 / Math.PI); // Variation en degrés de longitude

		// Calcul des min/max latitudes et longitudes
		const minLat = centerLat - deltaLat;
		const maxLat = centerLat + deltaLat;
		const minLon = centerLon - deltaLon;
		const maxLon = centerLon + deltaLon;

		// Retourne les valeurs
		return { minLat, maxLat, minLon, maxLon };
	};

	useFocusEffect(
		useCallback(() => {
			if (userProfile && !userCity) {
				setUserLat(userProfile.latitude);
				setUserLon(userProfile.longitude);
				setUserCity(userProfile.city);
				setDistanceKm(0);
			}
		}, [userProfile]),
	);

	const loadDataJobs = async () => {
		const { data, totalCount } = await getAll(
			"jobs",
			"*",
			`&isArchived=eq.FALSE${filters}`,
			page,
			ITEMS_PER_PAGE,
			"date.desc",
		);
		setJobs(data);
		setTotalCount(totalCount);
	};

	const handleFilterByValues = () => {
		let filterString = ""; // Variable locale pour construire la chaîne de filtre

		// 1. Gérer le filtre de catégorie
		if (values.length > 0) {
			const formattedCategories = values.map((c) => `"${c}"`).join(",");
			filterString += `&category=in.(${formattedCategories})`;
		}

		// 2. Gérer le filtre de distance
		if (userLat !== null && userLon !== null && distanceKm > 0) {
			const bbox = getBoundingBox(userLat, userLon, distanceKm);

			// AJOUT DES FILTRES LATITUDE ET LONGITUDE (GTE/LTE)
			filterString += `&latitude=gte.${bbox.minLat}&latitude=lte.${bbox.maxLat}`;
			filterString += `&longitude=gte.${bbox.minLon}&longitude=lte.${bbox.maxLon}`;
		}

		// Mettre à jour l'état `filters` et déclencher le chargement des jobs
		setFilters(filterString);
		// loadDataJobs(filterString);
	};

	const handleFilterByKeywords = () => {
		let filter = "";
		if (keywords.trim() !== "") {
			setSwitchToKeywords(true);
			const encodedKeyword = encodeURIComponent(`%${keywords}%`);
			filter = `&or=(title.ilike.${encodedKeyword},category.ilike.${encodedKeyword})`;
		}
		setFilters(filter);
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataJobs();
		setRefreshing(false);
	}, [filters, page]);

	useEffect(() => {
		handleFilterByValues();
	}, [values, distanceKm, userCity]);

	useEffect(() => {
		handleFilterByKeywords();
	}, [keywords]);

	useEffect(() => {
		loadDataJobs();
	}, [page, filters]);

	return (
		<ScrollView backgroundColor='white'>
			<VStack style={{ flex: 1 }}>
				<VStack
					style={{
						height: 75,
						padding: 15,
					}}>
					<Text>Bienvenue,</Text>
					{role === "candidat" ? (
						<Heading>
							{userProfile?.firstname +
								" " +
								userProfile?.lastname}
						</Heading>
					) : (
						<Heading>{userCompany?.name}</Heading>
					)}
				</VStack>
				<VStack>
					<PagerView
						ref={pagerRef}
						style={styles.pagerView}
						initialPage={0}
						onPageSelected={(e) => {
							setActivePage(e.nativeEvent.position); // Met à jour la page active
						}}>
						<View key='1' style={{ backgroundColor: "lightgreen" }}>
							<Text>First page</Text>
						</View>
						<View key='2' style={{ backgroundColor: "lightcoral" }}>
							<Text>Second page</Text>
						</View>
					</PagerView>
					<View style={styles.paginationDotsContainer}>
						{Array.from({ length: numPages }).map((_, index) => (
							<TouchableOpacity
								key={index}
								style={[
									styles.dot,
									activePage === index
										? styles.activeDot
										: styles.inactiveDot, // Applique un style différent pour la page active
								]}
								onPress={() => goToPage(index)} // Navigue vers la page correspondante au clic sur le dot
							/>
						))}
					</View>
				</VStack>
				{role === "candidat" ? (
					<>
						<VStack style={{ padding: 15 }}>
							<MiniJobsList
								heading='Nos offres Last Minute'
								subtitle='Voici nos offres de dernière minute dans votre secteur'
								pageNbr={1}
								itemsPerPage={3}
								regionCode={userProfile?.region_code}
								regionName={userProfile?.region}
								category={myCategories}
								filtersSup={
									"&isLastMinute=eq.true&date=gte." +
									today.toISOString().split("T")[0]
								}
							/>
							<Button onPress={() => router.push("/lastminute")}>
								<ButtonText>
									Voir toutes les offres Last Minute
								</ButtonText>
							</Button>
						</VStack>
						<VStack style={{ padding: 15 }}>
							{/* <JobsList pageNbr={1} itemsPerPage={5} /> */}
							<MiniJobsList
								heading='Offres recommandées'
								subtitle='* Basées sur vos informations personnelles'
								pageNbr={1}
								itemsPerPage={5}
								regionCode={userProfile?.region_code}
								regionName={userProfile?.region}
								category={myCategories}
								filtersSup={"&isLastMinute=eq.false"}
							/>
							<Button
								onPress={() =>
									router.replace("/tabs/(tabs)/tab2")
								}>
								<ButtonText>Voir toutes les offres</ButtonText>
							</Button>
						</VStack>
					</>
				) : (
					<VStack style={{ padding: 15 }}>
						{user && (
							<ApplicationsProList
								title='Vos dernières candidatures'
								userId={user.id}
							/>
						)}
					</VStack>
				)}
				<VStack style={{ padding: 15 }}>
					<Button
						variant='outline'
						onPress={() => router.push("/contactus")}>
						<ButtonText>Contactez-nous</ButtonText>
					</Button>
				</VStack>
			</VStack>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	pagerView: {
		// flex: 1,
		height: 200,
		backgroundColor: "lightblue",
	},
	paginationDotsContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
		backgroundColor: "#fff", // Fond pour les dots
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5, // Pour faire un cercle
		marginHorizontal: 5, // Espacement entre les dots
	},
	activeDot: {
		backgroundColor: "#303030", // Couleur du dot actif (bleu par défaut)
	},
	inactiveDot: {
		backgroundColor: "#d0d0d0", // Couleur du dot inactif (gris clair)
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	button: {
		backgroundColor: "#3478f6",
		padding: 14,
		borderRadius: 8,
	},
	buttonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
	modal: {
		justifyContent: "flex-end",
		margin: 0,
	},
	sheet: {
		backgroundColor: "white", // ← SANS ÇA = INVISIBLE
		padding: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 20,
	},
	option: {
		paddingVertical: 14,
	},
	optionText: {
		fontSize: 18,
	},
	deleteText: {
		fontSize: 18,
		color: "red",
	},
	cancel: {
		marginTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#ddd",
	},
	cancelText: {
		fontSize: 18,
		textAlign: "center",
		marginTop: 10,
	},
});
