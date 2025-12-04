import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	Platform,
	TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
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
	MapPin,
	Ticket,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 5;
const today = new Date();

export default function JobsList({
	pageNbr = 1,
	itemsPerPage = ITEMS_PER_PAGE,
	isLastMinute = false,
}) {
	const scrollRef = useRef(null);
	const { userProfile } = useAuth();
	const { getAll } = useDataContext();

	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	// single source of truth for sheets: null | 'values' | 'keywords'
	const [activeSheet, setActiveSheet] = useState(null);

	// filters & UI state
	const [values, setValues] = useState([]);
	const [filters, setFilters] = useState("");
	const [keywords, setKeywords] = useState("");

	// geo / city autocomplete
	const [userLat, setUserLat] = useState(userProfile?.latitude || null);
	const [userLon, setUserLon] = useState(userProfile?.longitude || null);
	const [userCity, setUserCity] = useState(userProfile?.city || "");
	const [userCitySelected, setUserCitySelected] = useState(
		Boolean(userProfile?.city)
	);
	const [results, setResults] = useState([]);
	const [distanceKm, setDistanceKm] = useState(0);

	// jobs data + pagination
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(pageNbr);
	const [jobs, setJobs] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

	// open/close helpers
	const handleOpenBottomSheet = (type) => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
		setActiveSheet(type);
		if (type === "values") {
			setPage(1);
			setKeywords("");
		} else if (type === "keywords") {
			setPage(1);
			setValues([]);
			setDistanceKm(0);
		}
	};
	const handleCloseSheet = () => setActiveSheet(null);

	// debounce fetch cities
	useEffect(() => {
		if (!userCity || userCity.length < 2) {
			setResults([]);
			return;
		}
		const id = setTimeout(async () => {
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
					}
				);
				setResults(res.data || []);
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
				setUserCity(userProfile.city || "");
				setUserCitySelected(Boolean(userProfile?.city));
				setDistanceKm(0);
			}
		}, [userProfile])
	);

	// load jobs
	const loadDataJobs = useCallback(async () => {
		try {
			const { data, totalCount } = await getAll(
				"jobs",
				"*,companies(logo_url)",
				`&isArchived=eq.FALSE${filters}&isLastMinute=eq.${isLastMinute}${
					isLastMinute
						? "&date=gte." + today.toISOString().split("T")[0]
						: ""
				}`,
				page,
				itemsPerPage,
				"date.desc"
			);
			console.log("Jobs data:", data[0]);
			setJobs(data || []);
			setTotalCount(totalCount || 0);
		} catch (err) {
			console.error("Erreur chargement jobs:", err);
		}
	}, [filters, page, itemsPerPage, isLastMinute, getAll]);

	useEffect(() => {
		loadDataJobs();
	}, [loadDataJobs]);

	// filter builders
	useEffect(() => {
		// values + distance => filters
		let filterString = "";
		if (values.length > 0) {
			const formatted = values.map((c) => `"${c}"`).join(",");
			filterString += `&category=in.(${formatted})`;
		}
		if (userLat != null && userLon != null && distanceKm > 0) {
			const bbox = getBoundingBox(userLat, userLon, distanceKm);
			if (bbox.minLat !== undefined) {
				filterString += `&latitude=gte.${bbox.minLat}&latitude=lte.${bbox.maxLat}`;
				filterString += `&longitude=gte.${bbox.minLon}&longitude=lte.${bbox.maxLon}`;
			}
		}
		setFilters(filterString);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [values, distanceKm, userLat, userLon, userCity]);

	useEffect(() => {
		// keywords filter
		if (keywords.trim() !== "") {
			const encodedKeyword = encodeURIComponent(`%${keywords}%`);
			setFilters(
				`&or=(title.ilike.${encodedKeyword},category.ilike.${encodedKeyword})`
			);
		} else {
			// when keywords cleared, recompute from values/distance — handled by previous effect
			// trigger reload by clearing filters state handled above
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [keywords]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataJobs();
		setRefreshing(false);
	}, [loadDataJobs]);

	const handleResetKeywords = () => setKeywords("");
	const handleRemoveValue = (value) =>
		setValues((prev) => prev.filter((v) => v !== value));

	const handleNext = () => {
		setPage((p) => Math.min(p + 1, totalPages));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};
	const handlePrev = () => {
		setPage((p) => Math.max(p - 1, 1));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	// helper: pick a city from suggestions
	const pickCity = (item) => {
		setUserCity(item.nom);
		setUserLat(item.centre.coordinates[1]);
		setUserLon(item.centre.coordinates[0]);
		setResults([]);
		setUserCitySelected(true);
		setDistanceKm(20);
	};

	return (
		<>
			{/* <VStack style={{ flex: 1 }}>
				<Button onPress={() => setShowActionsheet(true)}>
					<ButtonText>Open Actionsheet</ButtonText>
				</Button>
				<Actionsheet
					// snapPoints={["75%"]}
					isOpen={showActionsheet}
					onClose={handleClose}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<ActionsheetScrollView style={{ paddingBottom: 20 }}>
							<VStack
								style={{
									paddingHorizontal: 15,
									paddingTop: 10,
								}}>
								<Heading>Localisation</Heading>
								<Input>
									<InputSlot className='pl-3'>
										<InputIcon as={MapPin} />
									</InputSlot>
									<InputField
										placeholder='Ville...'
										value={userCity}
										onChangeText={(text) => {
											setUserCity(text);
											setUserCitySelected(false);
										}}
									/>
								</Input>

								{!userCitySelected && results.length > 0 && (
									<VStack
										style={{
											maxHeight: 220,
											marginTop: 10,
										}}>
										{results.map((item) => (
											<TouchableOpacity
												key={
													item.nom +
													(item.codesPostaux?.[0] ??
														"")
												}
												onPress={() => pickCity(item)}
												style={{ paddingVertical: 10 }}>
												<Text>
													{item.nom} (
													{item.codeDepartement})
												</Text>
											</TouchableOpacity>
										))}
									</VStack>
								)}

								<VStack style={{ marginTop: 15 }}>
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
											paddingHorizontal: 15,
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

								<VStack style={{ marginTop: 10 }}>
									<CheckboxGroup
										value={values}
										onChange={(keys) => setValues(keys)}>
										<VStack space='xl'>
											<Checkbox value='SSIAP1'>
												<CheckboxIndicator>
													<CheckboxIcon as={Check} />
												</CheckboxIndicator>
												<CheckboxLabel>
													SSIAP1
												</CheckboxLabel>
											</Checkbox>
											<Checkbox value='APS'>
												<CheckboxIndicator>
													<CheckboxIcon as={Check} />
												</CheckboxIndicator>
												<CheckboxLabel>
													APS
												</CheckboxLabel>
											</Checkbox>
											<Checkbox value='APR'>
												<CheckboxIndicator>
													<CheckboxIcon as={Check} />
												</CheckboxIndicator>
												<CheckboxLabel>
													APR
												</CheckboxLabel>
											</Checkbox>
										</VStack>
									</CheckboxGroup>
								</VStack>

								<HStack
									style={{
										marginTop: 20,
										justifyContent: "flex-end",
									}}>
									<Button
										onPress={() => {
											handleCloseSheet();
										}}>
										<Text>Fermer</Text>
									</Button>
								</HStack>
							</VStack>
						</ActionsheetScrollView>
					</ActionsheetContent>
				</Actionsheet>
			</VStack> */}
			{/* VALUES sheet */}
			<Actionsheet
				snapPoints={[60]}
				isOpen={activeSheet === "values"}
				onClose={handleCloseSheet}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					{/* Single ActionsheetScrollView only */}
					<ActionsheetScrollView style={{ paddingBottom: 20 }}>
						<VStack
							style={{
								paddingHorizontal: 15,
								paddingTop: 10,
							}}>
							<Heading>Localisation</Heading>
							<Input>
								<InputSlot className='pl-3'>
									<InputIcon as={MapPin} />
								</InputSlot>
								<InputField
									placeholder='Ville...'
									value={userCity}
									onChangeText={(text) => {
										setUserCity(text);
										setUserCitySelected(false);
									}}
								/>
							</Input>

							{!userCitySelected && results.length > 0 && (
								<VStack
									style={{
										maxHeight: 220,
										marginTop: 10,
									}}>
									{results.map((item) => (
										<TouchableOpacity
											key={
												item.nom +
												(item.codesPostaux?.[0] ?? "")
											}
											onPress={() => pickCity(item)}
											style={{ paddingVertical: 10 }}>
											<Text>
												{item.nom} (
												{item.codeDepartement})
											</Text>
										</TouchableOpacity>
									))}
								</VStack>
							)}

							<VStack style={{ marginTop: 15 }}>
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
										paddingHorizontal: 15,
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

							<VStack style={{ marginTop: 10 }}>
								<CheckboxGroup
									value={values}
									onChange={(keys) => setValues(keys)}>
									<VStack space='xl'>
										<Checkbox value='SSIAP1'>
											<CheckboxIndicator>
												<CheckboxIcon as={Check} />
											</CheckboxIndicator>
											<CheckboxLabel>
												SSIAP1
											</CheckboxLabel>
										</Checkbox>
										<Checkbox value='APS'>
											<CheckboxIndicator>
												<CheckboxIcon as={Check} />
											</CheckboxIndicator>
											<CheckboxLabel>APS</CheckboxLabel>
										</Checkbox>
										<Checkbox value='APR'>
											<CheckboxIndicator>
												<CheckboxIcon as={Check} />
											</CheckboxIndicator>
											<CheckboxLabel>APR</CheckboxLabel>
										</Checkbox>
									</VStack>
								</CheckboxGroup>
							</VStack>
							{/* 
							<HStack
								style={{
									marginTop: 20,
									justifyContent: "flex-end",
								}}>
								<Button
									onPress={() => {
										handleCloseSheet();
									}}>
									<Text>Fermer</Text>
								</Button>
							</HStack> */}
						</VStack>
					</ActionsheetScrollView>
				</ActionsheetContent>
			</Actionsheet>

			{/* KEYWORDS sheet */}
			<Actionsheet
				// snapPoints={[40]}
				isOpen={activeSheet === "keywords"}
				onClose={handleCloseSheet}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>

					<ActionsheetScrollView style={{ paddingBottom: 20 }}>
						<VStack
							style={{
								paddingHorizontal: 15,
								paddingTop: 10,
							}}>
							<Input>
								<InputSlot className='pl-3'>
									<InputIcon as={Search} />
								</InputSlot>
								<InputField
									placeholder='Search...'
									value={keywords}
									onChangeText={(text) => setKeywords(text)}
								/>
							</Input>

							{/* <HStack
								style={{
									marginTop: 20,
									justifyContent: "flex-end",
								}}>
								<Button onPress={() => handleCloseSheet()}>
									<Text>Fermer</Text>
								</Button>
							</HStack> */}
						</VStack>
					</ActionsheetScrollView>
				</ActionsheetContent>
			</Actionsheet>
			<VStack style={styles.container}>
				{/* floating action buttons */}
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

				{/* active filters badges */}
				{(values.length > 0 ||
					keywords ||
					(userCity && distanceKm > 0)) && (
					<VStack style={styles.filtersRow}>
						<HStack style={styles.filterWrap}>
							{values.map((value) => (
								<Badge
									key={value}
									size='md'
									variant='solid'
									action='muted'>
									<BadgeIcon as={Ticket} className='mr-2' />
									<BadgeText>{value}</BadgeText>
									<BadgeIcon
										as={X}
										className='ml-2'
										onPress={() => handleRemoveValue(value)}
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
					style={styles.scrollView}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}>
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
									department={job?.department_code}
									logo={job?.companies?.logo_url}
								/>
							))
						)}

						{totalPages > 1 && (
							<HStack
								justifyContent='center'
								alignItems='center'
								space='md'>
								<Button
									isDisabled={page === 1}
									onPress={handlePrev}
									variant='link'>
									<ButtonIcon as={ChevronLeft} />
								</Button>
								<Text>
									Page {page} / {totalPages}
								</Text>
								<Button
									isDisabled={page >= totalPages}
									onPress={handleNext}
									variant='link'>
									<ButtonIcon as={ChevronRight} />
								</Button>
							</HStack>
						)}
					</View>
				</ScrollView>
			</VStack>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		width: "100%",
		backgroundColor: "white",
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
		paddingHorizontal: 15,
	},
	jobList: {
		flex: 1,
		gap: 15,
		width: "100%",
		marginVertical: 15,
	},
});
