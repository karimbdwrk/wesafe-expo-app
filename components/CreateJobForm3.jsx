import React, { useState, useEffect, useRef } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
	FlatList,
} from "react-native";
import PagerView from "react-native-pager-view";
import { ProgressSteps, ProgressStep } from "react-native-progress-steps";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import axios from "axios";
import Constants from "expo-constants";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import {
	CircleCheck,
	CircleCheckBig,
	Circle,
	Check,
} from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const CreateJobForm3 = () => {
	const { user } = useAuth();
	const { create } = useDataContext();

	const pagerRef = useRef(null);
	const [activePage, setActivePage] = useState(0);
	const numPages = 2;

	const [activeStep, setActiveStep] = useState(0);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState("");
	const [isLastMinute, setIsLastMinute] = useState(false);
	const [category, setCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

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

	useEffect(() => {
		console.log("title & description :", title, " ", description);
	}, [title, description]);

	useEffect(() => {
		console.log("date :", date);
	}, [date]);

	useEffect(() => {
		console.log("category :", category);
	}, [category]);

	useEffect(() => {
		console.log("isLastMinute :", isLastMinute);
	}, [isLastMinute]);

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
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

	const handleConfirm = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		console.warn("A date has been picked: ", simpleDate);
		setDate(simpleDate);
		hideDatePicker();
	};

	const handleSubmit = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const newJob = await create("jobs", {
				company_id: user.id,
				title,
				date,
				category,
				isLastMinute,
			});
			console.log("new job :", newJob);
			setMessage("Job created successfully!");
			setTitle("");
			setDate("");
			setCategory("");
			setIsLastMinute(false);
		} catch (err) {
			console.error(
				"Error creating job:",
				err.response?.data || err.message
			);
			setMessage("Error creating job");
		} finally {
			setLoading(false);
		}
	};

	return (
		<VStack style={{ flex: 1, width: "100%" }}>
			<VStack>
				<ProgressSteps
					activeStep={activeStep}
					labelFontSize={10}
					topOffset={15}
					marginBottom={15}>
					<ProgressStep label='Secteur' removeBtnRow={true} />
					<ProgressStep label='Ville' removeBtnRow={true} />
					<ProgressStep label='Titre' removeBtnRow={true} />
					<ProgressStep label='Informations' removeBtnRow={true} />
					<ProgressStep label='Publication' removeBtnRow={true} />
				</ProgressSteps>
			</VStack>
			<PagerView
				ref={pagerRef}
				style={styles.pagerView}
				scrollEnabled={false}
				initialPage={0}
				onPageSelected={(e) => {
					setActivePage(e.nativeEvent.position); // Met à jour la page active
				}}>
				<VStack
					key='1'
					style={{
						backgroundColor: "lightgreen",
						padding: 15,
						justifyContent: "space-between",
					}}>
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
													AGENT DE SÉCURITÉ
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
											display: "flex",
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
										}}>
										<Text style={{ color: "#000" }}>
											{item}
										</Text>
										{category === item ? (
											<CircleCheck color={"black"} />
										) : (
											<Circle color={"lightgrey"} />
										)}
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
										backgroundColor: "$backgroundDark950",
									},
								}}>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													PROTECTION RAPPROCHÉE
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
									Yes, you can disable the whole accordion by
									setting the isDisabled prop to true on the
									Accordion component.
								</AccordionContentText>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem
							value='c'
							className='border-b border-outline-300'>
							<AccordionHeader className='bg-background-0'>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													SSIAP
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
									components where the state and behaviors are
									controlled by the Parent component. You can
									make the accordion a controlled component by
									passing the value prop to the Accordion
									component and setting the onValueChange prop
									to update the value prop. Refer to the
									controlled accordion example in the docs.
								</AccordionContentText>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem
							value='d'
							className='border-b border-outline-300'>
							<AccordionHeader className='bg-background-0'>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													CYNOPHILE
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
									components where the state and behaviors are
									controlled by the Parent component. You can
									make the accordion a controlled component by
									passing the value prop to the Accordion
									component and setting the onValueChange prop
									to update the value prop. Refer to the
									controlled accordion example in the docs.
								</AccordionContentText>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem
							value='e'
							className='border-b border-outline-300'>
							<AccordionHeader className='bg-background-0'>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													TRANSPORTEUR
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
									components where the state and behaviors are
									controlled by the Parent component. You can
									make the accordion a controlled component by
									passing the value prop to the Accordion
									component and setting the onValueChange prop
									to update the value prop. Refer to the
									controlled accordion example in the docs.
								</AccordionContentText>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value='f'>
							<AccordionHeader className='bg-background-0'>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													DÉTECTIVE PRIVÉ
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
									components where the state and behaviors are
									controlled by the Parent component. You can
									make the accordion a controlled component by
									passing the value prop to the Accordion
									component and setting the onValueChange prop
									to update the value prop. Refer to the
									controlled accordion example in the docs.
								</AccordionContentText>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<HStack
						style={{
							justifyContent: "space-between",
							padding: 15,
							paddingBottom: 30,
						}}>
						<Button
							isDisabled={category === ""}
							style={{ width: "100%" }}
							onPress={() => {
								pagerRef.current.setPage(1);
								setActiveStep(() => 1);
							}}>
							<ButtonText>Next</ButtonText>
						</Button>
					</HStack>
				</VStack>
				<VStack
					key='2'
					style={{
						backgroundColor: "lightcoral",
						padding: 15,
						justifyContent: "space-between",
					}}>
					<Input>
						<InputField
							placeholder='Ville'
							value={city}
							onChangeText={setCity}
						/>
					</Input>
					{results.length > 0 && (
						<>
							{(results.length === 1 && selectedCity !== null) ||
								(results.length > 1 &&
									results.map((city) => (
										<TouchableOpacity
											key={
												city.nom + city.codesPostaux[0]
											}
											onPress={() =>
												handleSelectCity(city)
											}
											style={{ paddingVertical: 10 }}>
											<Text>
												{city.nom} (
												{city.departement.code})
											</Text>
										</TouchableOpacity>
									)))}
						</>
					)}

					{selectedCity && (
						<View style={{ marginTop: 20 }}>
							{/* <Text>✅ Ville sélectionnée :</Text>
							<Text>Ville : {selectedCity.nom}</Text>
							<Text>Code postal : {selectedCity.codePostal}</Text>
							<Text>
								Département : {selectedCity.codeDepartement}
							</Text>
							<Text>Région : {selectedCity.codeRegion}</Text>
							<Text>Lat : {selectedCity.lat}</Text>
							<Text>Lon : {selectedCity.lon}</Text> */}
							{selectedCity.postcode && (
								<Text>
									Code postaux :{selectedCity.postcode.length}
								</Text>
							)}
							<HStack
								style={{
									flexWrap: "wrap",
									justifyContent: "space-between",
									gap: 15,
								}}>
								{selectedCity.postcodes.length > 1 &&
									selectedCity.postcodes.map((pc) => (
										<Button
											key={pc}
											onPress={() =>
												setSelectedPostcode(pc)
											}>
											<ButtonText>{pc}</ButtonText>
											<ButtonIcon
												as={
													selectedPostcode === pc
														? CircleCheck
														: Circle
												}
											/>
										</Button>
									))}
							</HStack>
						</View>
					)}
					<HStack
						style={{
							justifyContent: "space-between",
							padding: 15,
							paddingBottom: 30,
						}}>
						<Button
							variant='outline'
							style={{ width: "48%" }}
							onPress={() => {
								pagerRef.current.setPage(0);
								setActiveStep(() => 0);
							}}>
							<ButtonText>Prev</ButtonText>
						</Button>
						<Button
							isDisabled={selectedCity === null}
							style={{ width: "48%" }}
							onPress={() => {
								pagerRef.current.setPage(2);
								setActiveStep(() => 2);
							}}>
							<ButtonText>Next</ButtonText>
						</Button>
					</HStack>
				</VStack>
				<VStack
					key='3'
					style={{
						backgroundColor: "beige",
						padding: 15,
						gap: 15,
					}}>
					<Input>
						<InputField
							placeholder='Job Title'
							value={title}
							onChangeText={setTitle}
						/>
					</Input>
					<Textarea
						isReadOnly={false}
						isInvalid={false}
						isDisabled={false}>
						<TextareaInput
							placeholder='Description'
							value={description}
							onChangeText={setDescription}
						/>
					</Textarea>
					<HStack
						style={{
							justifyContent: "space-between",
							padding: 15,
							paddingBottom: 30,
						}}>
						<Button
							variant='outline'
							style={{ width: "48%" }}
							onPress={() => {
								pagerRef.current.setPage(1);
								setActiveStep(() => 1);
							}}>
							<ButtonText>Prev</ButtonText>
						</Button>
						<Button
							isDisabled={!title || !description}
							style={{ width: "48%" }}
							onPress={() => {
								pagerRef.current.setPage(3);
								setActiveStep(() => 3);
							}}>
							<ButtonText>Next</ButtonText>
						</Button>
					</HStack>
				</VStack>
				<VStack
					key='4'
					style={{
						backgroundColor: "lightgrey",
						padding: 15,
						justifyContent: "space-between",
					}}>
					<Text>
						contrat, start date, end date, driving license,
						languages, salary, reimbursement, packed lunch, night
						work
					</Text>
				</VStack>
				<VStack
					key='5'
					style={{
						backgroundColor: "yellow",
						padding: 15,
						justifyContent: "space-between",
					}}>
					<Text>Fifth page</Text>
				</VStack>
			</PagerView>
			<VStack>
				<Text>Active page : {activePage}</Text>
				<HStack
					style={{
						justifyContent: "space-between",
						padding: 15,
						paddingBottom: 30,
					}}>
					{activePage !== 0 && (
						<Button
							variant='outline'
							style={{ width: "48%" }}
							onPress={() => {
								pagerRef.current.setPage(activePage - 1);
								setActiveStep(() => activeStep - 1);
							}}>
							<ButtonText>Prev</ButtonText>
						</Button>
					)}
					<Button
						style={{ width: activePage !== 0 ? "48%" : "100%" }}
						onPress={() => {
							pagerRef.current.setPage(activePage + 1);
							setActiveStep(() => activeStep + 1);
						}}>
						<ButtonText>Next</ButtonText>
					</Button>
				</HStack>
			</VStack>
			{/* <Input>
				<InputField
					placeholder='Job Title'
					value={title}
					onChangeText={setTitle}
				/>
			</Input>
			<Input isReadOnly>
				<InputField
					onPress={showDatePicker}
					placeholder='Date (YYYY-MM-DD)'
					value={date}
					onChangeText={setDate}
				/>
				<InputSlot onPress={showDatePicker} style={{ marginRight: 15 }}>
					<InputIcon as={CalendarDaysIcon} />
				</InputSlot>
			</Input>
			<HStack space='md'>
				<Switch
					onValueChange={() => setIsLastMinute(!isLastMinute)}
					value={isLastMinute}
					trackColor={{
						false: colors.gray[300],
						true: colors.gray[500],
					}}
					thumbColor={colors.gray[50]}
					activeThumbColor={colors.gray[50]}
					ios_backgroundColor={colors.gray[300]}
				/>
				<Text size='sm'>isLastMinute</Text>
			</HStack>
			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode='date'
				onConfirm={handleConfirm}
				onCancel={hideDatePicker}
			/>
			<Select onValueChange={setCategory}>
				<SelectTrigger variant='outline' size='md'>
					<SelectInput placeholder='Select option' />
					<SelectIcon className='mr-3' as={ChevronDownIcon} />
				</SelectTrigger>
				<SelectPortal>
					<SelectBackdrop />
					<SelectContent style={{ paddingBottom: 90 }}>
						<SelectDragIndicatorWrapper>
							<SelectDragIndicator />
						</SelectDragIndicatorWrapper>
						<SelectItem label='SSIAP1' value='SSIAP1' />
						<SelectItem label='APR' value='APR' />
						<SelectItem label='APS' value='APS' />
					</SelectContent>
				</SelectPortal>
			</Select>

			<Button onPress={handleSubmit} isDisabled={loading}>
				<ButtonText>
					{loading ? "Creating..." : "Create Job"}
				</ButtonText>
			</Button>

			{message && <Text>{message}</Text>} */}
		</VStack>
	);
};

const styles = StyleSheet.create({
	pagerView: {
		flex: 1,
		height: "50%",
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
});

export default CreateJobForm3;
