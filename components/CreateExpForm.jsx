import React, { useState, useEffect } from "react";
import { Keyboard } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText } from "@/components/ui/button";
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
	ChevronDownIcon,
	EditIcon,
	CalendarDaysIcon,
} from "@/components/ui/icon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import Constants from "expo-constants";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const CreateExpForm = () => {
	const { user } = useAuth();
	const { create } = useDataContext();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [category, setCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);
	const [isStartDatePickerVisible, setStartDatePickerVisibility] =
		useState(false);
	const [isEndDatePickerVisible, setEndDatePickerVisibility] =
		useState(false);

	useEffect(() => {
		console.log("title :", title);
	}, [title]);

	// useEffect(() => {
	// 	console.log("date :", date);
	// }, [date]);

	useEffect(() => {
		console.log("category :", category);
	}, [category]);

	// const simpleDate = new Date(isoDate).toISOString().split("T")[0];

	const showStartDatePicker = () => {
		setStartDatePickerVisibility(true);
	};

	const hideStartDatePicker = () => {
		setStartDatePickerVisibility(false);
	};

	const showEndDatePicker = () => {
		setEndDatePickerVisibility(true);
	};

	const hideEndDatePicker = () => {
		setEndDatePickerVisibility(false);
	};

	const handleConfirmStartDate = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		console.warn("A start date has been picked: ", simpleDate);
		setStartDate(simpleDate);
		hideStartDatePicker();
	};

	const handleConfirmEndDate = (isoDate) => {
		const simpleDate = new Date(isoDate).toISOString().split("T")[0];
		console.warn("A end date has been picked: ", simpleDate);
		setEndDate(simpleDate);
		hideEndDatePicker();
	};

	// const handleSubmit = async () => {
	// 	setLoading(true);
	// 	setMessage(null);
	// 	try {
	// 		const response = await axios.post(
	// 			`${SUPABASE_URL}/rest/v1/jobs`,
	// 			{
	// 				title,
	// 				date,
	// 				category,
	// 			},
	// 			{
	// 				headers: {
	// 					apikey: SUPABASE_API_KEY,
	// 					"Content-Type": "application/json",
	// 					Prefer: "return=representation",
	// 				},
	// 			}
	// 		);
	// 		setMessage("Job created successfully!");
	// 		setTitle("");
	// 		setDate("");
	// 		setCategory("");
	// 	} catch (err) {
	// 		console.error(
	// 			"Error creating job:",
	// 			err.response?.data || err.message
	// 		);
	// 		setMessage("Error creating job");
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	const handleSubmit = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const newExp = await create("experiences", {
				profile_id: user.id,
				title,
				location,
				description,
				start_date: startDate,
				end_date: endDate,
				category,
			});
			console.log("new exp :", newExp);
			setMessage("Exp created successfully!");
			setTitle("");
			setLocation("");
			setDescription("");
			setStartDate("");
			setEndDate("");
			setCategory("");
			// router.replace("/(tabs)");
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
		<VStack space='lg' p='$4' style={{ width: "100%", padding: 15 }}>
			<Input>
				<InputField
					placeholder='Titre'
					value={title}
					onChangeText={setTitle}
				/>
			</Input>
			<Input>
				<InputField
					placeholder='Lieu'
					value={location}
					onChangeText={setLocation}
				/>
			</Input>
			<Textarea
				size='md'
				isReadOnly={false}
				isInvalid={false}
				isDisabled={false}>
				<TextareaInput
					placeholder='Description'
					value={description}
					onChangeText={setDescription}
				/>
			</Textarea>
			<HStack justifyContent='space-between' style={{ gap: 15 }}>
				<Input isReadOnly style={{ width: "45%" }}>
					<InputField
						onPress={showStartDatePicker}
						placeholder='Début'
						value={startDate}
						onChangeText={setStartDate}
					/>
					<InputSlot
						onPress={showStartDatePicker}
						style={{ marginRight: 15 }}>
						<InputIcon as={CalendarDaysIcon} />
					</InputSlot>
				</Input>
				<Input isReadOnly style={{ width: "45%" }}>
					<InputField
						onPress={showEndDatePicker}
						placeholder='Fin'
						value={endDate}
						onChangeText={setEndDate}
					/>
					<InputSlot
						onPress={showEndDatePicker}
						style={{ marginRight: 15 }}>
						<InputIcon as={CalendarDaysIcon} />
					</InputSlot>
				</Input>
			</HStack>
			<DateTimePickerModal
				isVisible={isStartDatePickerVisible}
				mode='date'
				onConfirm={handleConfirmStartDate}
				onCancel={hideStartDatePicker}
				maximumDate={new Date()}
			/>
			<DateTimePickerModal
				isVisible={isEndDatePickerVisible}
				mode='date'
				onConfirm={handleConfirmEndDate}
				onCancel={hideEndDatePicker}
				maximumDate={new Date()}
			/>
			<Select
				onValueChange={setCategory}
				onOpen={() => {
					Keyboard.dismiss(); // This hides the keyboard when Select is opened
				}}>
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
					{loading ? "Creating..." : "Create Exp"}
				</ButtonText>
			</Button>

			{message && <Text>{message}</Text>}
		</VStack>
	);
};

export default CreateExpForm;
