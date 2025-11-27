import React, { useRef, useState, useEffect } from "react";
import Constants from "expo-constants";
import {
	View,
	FlatList,
	Dimensions,
	TouchableOpacity,
	Text as RNText,
} from "react-native";
import axios from "axios";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionTitleText,
	AccordionContent,
	AccordionContentText,
	AccordionIcon,
} from "@/components/ui/accordion";
import { Pressable } from "@/components/ui/pressable";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import colors from "tailwindcss/colors";

import {
	ChevronDownIcon,
	ChevronUpIcon,
	CalendarDaysIcon,
} from "@/components/ui/icon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react-native";

import { useStripePaymentHandler } from "@/services/stripeApi";

const { width } = Dimensions.get("window");

const CreateJobForm = ({ onJobCreated }) => {
	const flatListRef = useRef(null);
	const { user, userCompany, loadUserData, accessToken } = useAuth();
	const { create, update } = useDataContext();

	const { initiateAndPresentPayment } = useStripePaymentHandler();

	const [lastMinuteCredits, setLastMinuteCredits] = useState(
		userCompany?.last_minute_credits || 0
	);

	const [step, setStep] = useState(0);
	const [title, setTitle] = useState("");

	const [city, setCity] = useState("");
	const [results, setResults] = useState([]);
	const [selectedCity, setSelectedCity] = useState(null);
	const [selectedPostcode, setSelectedPostcode] = useState(null);
	const [selectedDepartment, setSelectedDepartment] = useState(null);
	const [selectedDepartmentCode, setSelectedDepartmentCode] = useState(null);
	const [selectedRegion, setSelectedRegion] = useState(null);
	const [selectedRegionCode, setSelectedRegionCode] = useState(null);
	const [selectedLatitude, setSelectedLatitude] = useState(null);
	const [selectedLongitude, setSelectedLongitude] = useState(null);

	const [category, setCategory] = useState("");
	const [date, setDate] = useState("");
	const [isLastMinute, setIsLastMinute] = useState(false);
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [message, setMessage] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		console.log("selected postcode :", selectedPostcode);
	}, [selectedPostcode]);

	useEffect(() => {
		console.log("selected city :", selectedCity);
	}, [selectedCity]);

	const scrollToStep = (index) => {
		setStep(index);
		flatListRef.current.scrollToIndex({ index });
	};

	const nextStep = () => {
		if (step < 5) scrollToStep(step + 1);
	};

	const prevStep = () => {
		if (step > 0) scrollToStep(step - 1);
	};

	useEffect(() => {
		const fetchCities = async () => {
			if (city.length < 2) return setResults([]);
			try {
				const res = await axios.get(
					`https://geo.api.gouv.fr/communes`,
					{
						params: {
							nom: city,
							fields: "nom,codesPostaux,departement,region,codeRegion,centre",
							limit: 5,
							boost: "population",
						},
					}
				);
				setResults(res.data);
				console.log("result data :", res.data);
			} catch (err) {
				console.error("Erreur de géolocalisation :", err);
			}
		};
		const timeout = setTimeout(fetchCities, 300); // debounce
		return () => clearTimeout(timeout);
	}, [city]);

	const handleSelectCity = (city) => {
		setSelectedCity({
			nom: city.nom,
			codePostal: city.codesPostaux[0],
			codeDepartement: city.departement.code,
			departement: city.departement.nom,
			codeRegion: city.region.code,
			region: city.region.nom,
			lat: city.centre.coordinates[1],
			lon: city.centre.coordinates[0],
			postcodes: city.codesPostaux,
		});
		setCity(city.nom);
		setSelectedDepartment(city.departement.nom);
		setSelectedDepartmentCode(city.departement.code);
		setSelectedRegion(city.region.nom);
		setSelectedRegionCode(city.region.code);
		setSelectedLongitude(city.centre.coordinates[0]);
		setSelectedLatitude(city.centre.coordinates[1]);
		city.codesPostaux.length === 1 &&
			setSelectedPostcode(city.codesPostaux[0]);
		setResults([]);
	};

	const handleConfirmDate = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		setDate(simpleDate);
		setDatePickerVisibility(false);
	};

	const handlePayOneShotAd = async () => {
		console.log("Handling one-shot ad payment...");
		const paymentResult = await initiateAndPresentPayment(
			user.id,
			500,
			"oneshot_ad"
		);
		if (paymentResult.success) {
			handleSubmit(false);
		} else {
			console.error("Payment failed:", paymentResult.error);
		}
	};

	const handleCheckCredits = () => {
		if (isLastMinute && lastMinuteCredits <= 0) {
			console.log("Crédits insuffisants pour la dernière minute");
			handlePayOneShotAd();
		} else if (isLastMinute && lastMinuteCredits > 0) {
			console.log("Crédits suffisants pour la dernière minute");
			handleSubmit(true);
		} else {
			console.log("Pas de crédits nécessaires pour ce job");
			handleSubmit(false);
		}
	};

	const handleSubmit = async (chargeACredit) => {
		setLoading(true);
		setMessage(null);
		try {
			const newJob = await create("jobs", {
				company_id: user.id,
				title,
				date,
				category,
				isLastMinute,
				region: selectedRegion,
				regioncode: selectedRegionCode,
				department: selectedDepartment,
				departmentcode: selectedDepartmentCode,
				city: city,
				postcode: selectedPostcode,
				latitude: selectedLatitude,
				longitude: selectedLongitude,
			});
			console.log("✅ Job created successfully!");
			setMessage("✅ Job created successfully!");
			scrollToStep(0);
			setTitle("");
			setDate("");
			setCategory("");
			setIsLastMinute(false);
			setCity("");
			setSelectedCity(null);
			setSelectedDepartment(null);
			setSelectedDepartmentCode(null);
			setSelectedRegion(null);
			setSelectedRegionCode(null);
			setSelectedLongitude(null);
			setSelectedLatitude(null);
			setSelectedPostcode(null);
			if (onJobCreated) {
				console.log("onJobCreated est défini, appel avec true");
				onJobCreated(true);
				if (chargeACredit) {
					const result = await update("companies", userCompany.id, {
						last_minute_credits: lastMinuteCredits - 1,
					});
					console.log(
						"Crédits restants après création :",
						result.last_minute_credits
					);
				}
			} else {
				console.log("onJobCreated n'est pas défini");
			}
		} catch (err) {
			setMessage("❌ Error creating job");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const renderStep = ({ item }) => {
		switch (item.key) {
			case "city":
				return (
					<VStack space='lg' style={{ width, padding: 15 }}>
						<Input>
							<InputField
								placeholder='Ville'
								value={city}
								onChangeText={setCity}
							/>
						</Input>
						{/* <TextInput
							placeholder='Tape ta ville'
							value={city}
							onChangeText={setCity}
							style={{
								borderWidth: 1,
								borderColor: "#ccc",
								borderRadius: 8,
								padding: 10,
								marginBottom: 8,
							}}
						/> */}
						{results.length > 0 && (
							<FlatList
								data={results}
								keyExtractor={(item) =>
									item.nom + item.codesPostaux[0]
								}
								renderItem={({ item }) => (
									<TouchableOpacity
										onPress={() => handleSelectCity(item)}
										style={{ paddingVertical: 10 }}>
										<Text>
											{item.nom} ({item.departement.code})
										</Text>
									</TouchableOpacity>
								)}
							/>
						)}

						{selectedCity && (
							<View style={{ marginTop: 20 }}>
								{/* <Text>✅ Ville sélectionnée :</Text>
								<Text>Ville : {selectedCity.nom}</Text>
								<Text>
									Code postal : {selectedCity.codePostal}
								</Text>
								<Text>
									Département : {selectedCity.codeDepartement}
								</Text>
								<Text>Région : {selectedCity.codeRegion}</Text>
								<Text>Lat : {selectedCity.lat}</Text>
								<Text>Lon : {selectedCity.lon}</Text>
								{selectedCity.postcode && (
									<Text>
										Code postaux :
										{selectedCity.postcode.length}
									</Text>
								)} */}
								<HStack
									style={{
										flexWrap: "wrap",
										justifyContent: "space-between",
										gap: 25,
									}}>
									{selectedCity.postcodes.length > 1 &&
										selectedCity.postcodes.map((pc) => (
											<Button
												key={pc}
												onPress={() =>
													setSelectedPostcode(pc)
												}>
												<ButtonText>{pc}</ButtonText>
												{selectedPostcode === pc && (
													<ButtonIcon as={Check} />
												)}
											</Button>
										))}
								</HStack>
							</View>
						)}
					</VStack>
				);
			case "title":
				return (
					<VStack space='lg' style={{ width, padding: 15 }}>
						<Input>
							<InputField
								placeholder='Job Title'
								value={title}
								onChangeText={setTitle}
							/>
						</Input>
					</VStack>
				);
			case "category":
				return (
					<VStack space='lg' style={{ width, padding: 15 }}>
						{/* <Select onChange={(value) => setCategory(value)}>
							<SelectItem label='SSIAP1' value='SSIAP1' />
							<SelectItem label='APR' value='APR' />
							<SelectItem label='APS' value='APS' />
						</Select> */}
						<Accordion
							className='border border-outline-300'
							type='single'>
							<AccordionItem
								value='a'
								className='border-b border-outline-300'>
								<AccordionHeader className='bg-background-0'>
									<AccordionTrigger>
										{({ isExpanded }) => {
											return (
												<>
													<AccordionTitleText>
														What does the "type"
														prop of the Accordion
														component do?
													</AccordionTitleText>
													{isExpanded ? (
														<AccordionIcon
															as={ChevronUpIcon}
														/>
													) : (
														<AccordionIcon
															as={ChevronDownIcon}
														/>
													)}
												</>
											);
										}}
									</AccordionTrigger>
								</AccordionHeader>
								<AccordionContent className='mt-0 pt-2 bg-background-50'>
									{/* <AccordionContentText>
										The type prop determines whether one or
										multiple items can be opened at the same
										time. The default value is "single"
										which means only one item can be opened
										at a time.
									</AccordionContentText> */}
									{["SSIAP1", "APR", "APS"].map((item) => (
										<Pressable
											key={item}
											onPress={() => {
												setCategory(item);
												// setCategoryModalVisible(false);
											}}
											style={{
												padding: 15,
												borderWidth: 1,
												borderColor: "#ccc",
											}}>
											<RNText style={{ color: "#000" }}>
												{item}
											</RNText>
										</Pressable>
									))}
								</AccordionContent>
							</AccordionItem>
							<AccordionItem
								value='b'
								className='border-b border-outline-300'>
								<AccordionHeader
									sx={{
										backgroundColor: "$backgroundLight0",
										_dark: {
											backgroundColor:
												"$backgroundDark950",
										},
									}}>
									<AccordionTrigger>
										{({ isExpanded }) => {
											return (
												<>
													<AccordionTitleText>
														Can I disable the whole
														accordion?
													</AccordionTitleText>
													{isExpanded ? (
														<AccordionIcon
															as={ChevronUpIcon}
														/>
													) : (
														<AccordionIcon
															as={ChevronDownIcon}
														/>
													)}
												</>
											);
										}}
									</AccordionTrigger>
								</AccordionHeader>
								<AccordionContent className='mt-0 pt-2 bg-background-50'>
									<AccordionContentText>
										Yes, you can disable the whole accordion
										by setting the isDisabled prop to true
										on the Accordion component.
									</AccordionContentText>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value='c'>
								<AccordionHeader className='bg-background-0'>
									<AccordionTrigger>
										{({ isExpanded }) => {
											return (
												<>
													<AccordionTitleText>
														What is a controlled
														accordion? How can I
														make it controlled?
													</AccordionTitleText>
													{isExpanded ? (
														<AccordionIcon
															as={ChevronUpIcon}
														/>
													) : (
														<AccordionIcon
															as={ChevronDownIcon}
														/>
													)}
												</>
											);
										}}
									</AccordionTrigger>
								</AccordionHeader>
								<AccordionContent className='mt-0 pt-2 bg-background-50'>
									<AccordionContentText>
										Controlled components refer to the
										components where the state and behaviors
										are controlled by the Parent component.
										You can make the accordion a controlled
										component by passing the value prop to
										the Accordion component and setting the
										onValueChange prop to update the value
										prop. Refer to the controlled accordion
										example in the docs.
									</AccordionContentText>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
						{/* {["SSIAP1", "APR", "APS"].map((item) => (
							<Pressable
								key={item}
								onPress={() => {
									setCategory(item);
									// setCategoryModalVisible(false);
								}}
								style={{
									padding: 15,
									borderWidth: 1,
									borderColor: "#ccc",
								}}>
								<RNText style={{ color: "#000" }}>
									{item}
								</RNText>
							</Pressable>
						))} */}
						<VStack>
							<Text>{category}</Text>
						</VStack>
					</VStack>
				);
			case "date":
				return (
					<VStack space='lg' style={{ width, padding: 15 }}>
						{!isLastMinute ? (
							<>
								<TouchableOpacity
									onPress={() =>
										setDatePickerVisibility(true)
									}>
									<RNText style={{ fontSize: 16 }}>
										{date || "Sélectionner une date"}
									</RNText>
								</TouchableOpacity>
								<DateTimePickerModal
									isVisible={isDatePickerVisible}
									mode='date'
									onConfirm={handleConfirmDate}
									onCancel={() =>
										setDatePickerVisibility(false)
									}
									minimumDate={new Date()}
								/>
							</>
						) : (
							<Button
								onPress={() =>
									setDate(new Date().toISOString())
								}>
								<ButtonText>
									Aujourd'hui (jusqu'a minuit)
								</ButtonText>
							</Button>
						)}
					</VStack>
				);
			case "lastMinute":
				return (
					<VStack space='lg' style={{ width, padding: 15 }}>
						<HStack space='md'>
							<Switch
								onValueChange={() =>
									setIsLastMinute(!isLastMinute)
								}
								value={isLastMinute}
							/>
							<RNText>Dernière minute</RNText>
						</HStack>
						<VStack>
							<RNText>
								Crédits restants : {lastMinuteCredits}
							</RNText>
						</VStack>
					</VStack>
				);
			case "review":
				return (
					<VStack space='md' style={{ width, padding: 15 }}>
						<RNText>Titre : {title}</RNText>
						<RNText>Catégorie : {category}</RNText>
						<RNText>Date : {date}</RNText>
						<RNText>
							Dernière minute : {isLastMinute ? "Oui" : "Non"}
						</RNText>
						<Button
							onPress={handleCheckCredits}
							isDisabled={loading}>
							<ButtonText>
								{loading ? "Création..." : "Créer le Job"}
							</ButtonText>
						</Button>
						{message && <RNText>{message}</RNText>}
					</VStack>
				);
		}
	};

	return (
		<VStack style={{ flex: 1 }}>
			<FlatList
				ref={flatListRef}
				data={[
					{ key: "city" },
					{ key: "category" },
					{ key: "lastMinute" },
					{ key: "date" },
					{ key: "title" },
					{ key: "review" },
				]}
				renderItem={renderStep}
				horizontal
				scrollEnabled={false}
				pagingEnabled
				keyExtractor={(item) => item.key}
			/>

			<HStack
				space='md'
				justifyContent='space-between'
				style={{ padding: 20 }}>
				{step > 0 && (
					<Button onPress={prevStep}>
						<ButtonText>Précédent</ButtonText>
					</Button>
				)}
				{step < 5 && (
					<Button onPress={nextStep}>
						<ButtonText>Suivant</ButtonText>
					</Button>
				)}
			</HStack>
		</VStack>
	);
};

export default CreateJobForm;
