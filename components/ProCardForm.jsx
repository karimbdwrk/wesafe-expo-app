import React, { useState, useEffect, useCallback } from "react";

import { VStack } from "@/components/ui/vstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
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

const ProCardForm = ({ procards }) => {
	const { user } = useAuth();
	const { create, getById } = useDataContext();

	const [title, setTitle] = useState("");
	const [procardNum, setProcardNum] = useState(null);
	const [date, setDate] = useState("");
	const [category, setCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	useEffect(() => {
		console.log("procardNum :", procardNum);
	}, [procardNum]);

	useEffect(() => {
		console.log("date :", date);
	}, [date]);

	useEffect(() => {
		console.log("category :", category);
	}, [category]);

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
	};

	// // Fonction utilitaire pour déterminer si une catégorie doit être désactivée
	// const shouldDisableCategory = (categoryValue) => {
	// 	const statusEntry = procards.find(
	// 		(item) => item.category === categoryValue
	// 	);
	// 	// Si l'entrée existe ET que isValid est false, alors elle est désactivée
	// 	return statusEntry ? !statusEntry.isValid : false;
	// };

	const shouldDisableCategory = (categoryValue) => {
		const statusEntry = procards.find(
			(item) => item.category === categoryValue
		);

		if (statusEntry) {
			// Si la carte est marquée comme non valide (isValid: false), elle ne devrait jamais désactiver,
			// car vous voulez activer les cartes expirées. C'est une condition déjà non valide.
			// if (!statusEntry.isValid) {
			// 	return false; // N'est PAS désactivée (car déjà invalide)
			// }

			// Si la carte est marquée comme valide (isValid: true), on vérifie la date
			if (statusEntry.validity_date) {
				const validityDate = new Date(statusEntry.validity_date);
				const currentDate = new Date();

				// Si la date de validité est ultérieure à la date actuelle, la carte est encore valide.
				// Donc, nous la désactivons.
				return validityDate > currentDate;
			}
		}

		// Par défaut (catégorie non trouvée dans jobCategoriesStatus, ou pas de date, ou isValid: false)
		// l'option n'est pas désactivée.
		return false;
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
			const newProcard = await create("procards", {
				profile_id: user.id,
				procard_num: procardNum,
				validity_date: date,
				category,
			});
			console.log("new Procard :", newProcard);
			setMessage("Procard created successfully!");
			setProcardNum("");
			setDate("");
			setCategory("");
			// router.replace("/(tabs)");
		} catch (err) {
			console.error(
				"Error creating Procard:",
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
					placeholder='7 derniers chiffres de la carte professionnelle'
					value={procardNum}
					onChangeText={setProcardNum}
				/>
			</Input>
			<Input isReadOnly>
				<InputField
					onPress={showDatePicker}
					placeholder='Date de fin de validité (YYYY-MM-DD)'
					value={date}
					onChangeText={setDate}
				/>
				<InputSlot onPress={showDatePicker} style={{ marginRight: 15 }}>
					<InputIcon as={CalendarDaysIcon} />
				</InputSlot>
			</Input>
			{/* <Button onPress={showDatePicker}>
				<ButtonText>Show Date Picker</ButtonText>
			</Button> */}
			{/* <Button onPress={() => setTitle("Example title")}>
				<ButtonText>Generate title</ButtonText>
			</Button> */}
			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode='date'
				onConfirm={handleConfirm}
				onCancel={hideDatePicker}
				minimumDate={new Date()}
			/>
			<Select onValueChange={setCategory} placeholder='Catégorie'>
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
						<SelectItem
							label='SSIAP1'
							value='SSIAP1'
							isDisabled={shouldDisableCategory("SSIAP1")}
							style={{
								opacity: shouldDisableCategory("SSIAP1")
									? 0.3
									: 1,
							}}
						/>
						<SelectItem
							label='APR'
							value='APR'
							isDisabled={shouldDisableCategory("APR")}
							style={{
								opacity: shouldDisableCategory("APR") ? 0.3 : 1,
							}}
						/>
						<SelectItem
							label='APS'
							value='APS'
							isDisabled={shouldDisableCategory("APS")}
							style={{
								opacity: shouldDisableCategory("APS") ? 0.3 : 1,
							}}
						/>
					</SelectContent>
				</SelectPortal>
			</Select>

			<Button onPress={handleSubmit} isDisabled={loading}>
				<ButtonText>
					{loading ? "Creating..." : "Create Pro Card"}
				</ButtonText>
			</Button>

			{message && <Text>{message}</Text>}
		</VStack>
	);
};

export default ProCardForm;
