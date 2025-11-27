import React, { useState, useEffect } from "react";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
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

import { ChevronDownIcon, CalendarDaysIcon } from "@/components/ui/icon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import Constants from "expo-constants";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const CreateJobForm2 = () => {
	const { user } = useAuth();
	const { create } = useDataContext();

	const [title, setTitle] = useState("");
	const [date, setDate] = useState("");
	const [isLastMinute, setIsLastMinute] = useState(false);
	const [category, setCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	useEffect(() => {
		console.log("title :", title);
	}, [title]);

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
		<VStack space='lg' p='$4' style={{ width: "100%", padding: 15 }}>
			<Input>
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

			{message && <Text>{message}</Text>}
		</VStack>
	);
};

export default CreateJobForm2;
