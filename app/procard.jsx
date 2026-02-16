import React, { useState, useEffect, useCallback, useRef } from "react";
import { View } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";

import { useLocalSearchParams } from "expo-router";
import { parseDate, today } from "@internationalized/date";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ProCardScreen = () => {
	const { id } = useLocalSearchParams();
	const { user } = useAuth();
	const { getById, proCardDelete } = useDataContext();

	const [proCard, setProCard] = useState(null);
	const [isDeleted, setIsDeleted] = useState(false);

	const checkDateValidity = (dateString) => {
		const inputDate = parseDate(dateString); // Ex: 2027-05-24
		const currentDate = today("UTC"); // You can also use 'en-US', 'fr-FR', etc.

		if (inputDate.compare(currentDate) >= 0) {
			console.log("✅ Date is still valid (today or future)");
			return true;
		} else {
			console.log("❌ Date is in the past (invalid)");
			return false;
		}
	};

	const fetchDataById = async () => {
		try {
			const data = await getById("procards", id, "*");
			console.log("Fetched data pro card :", data);
			setProCard(data);
		} catch (error) {
			console.error("Error fetching data by ID:", error.message);
		}
	};

	useEffect(() => {
		fetchDataById();
	}, []);

	const handleDelete = async () => {
		try {
			const data = await proCardDelete(id);
			console.log("deleted pro card :", data);
			setIsDeleted(true);
		} catch (error) {
			console.error("Error deleted pro card:", error.message);
		}
	};

	return (
		<VStack style={{ padding: 15 }}>
			<Heading>Pro Card Screen</Heading>
			<Text size='xs'>{id}</Text>
			{proCard && (
				<HStack style={{ paddingVertical: 15, gap: 10 }}>
					{checkDateValidity(proCard.validity_date) && (
						<>
							{proCard.status === "verified" ? (
								<Badge
									size='md'
									variant='solid'
									action='success'>
									<BadgeText>Validé par WeSafe</BadgeText>
								</Badge>
							) : proCard.status === "rejected" ? (
								<Badge
									size='md'
									variant='solid'
									action='error'>
									<BadgeText>
										Rejetée
									</BadgeText>
								</Badge>
							) : (
								<Badge
									size='md'
									variant='solid'
									action='warning'>
									<BadgeText>
										En attente de validation
									</BadgeText>
								</Badge>
							)}
						</>
					)}
					{proCard.status === "verified" &&
						!checkDateValidity(proCard.validity_date) && (
							<Badge size='md' variant='solid' action='error'>
								<BadgeText>Expirée</BadgeText>
							</Badge>
						)}
				</HStack>
			)}
			<Button onPress={handleDelete}>
				<ButtonText>
					{!isDeleted
						? "Supprimer la carte professionnelle"
						: "Carte professionnelle supprimée"}
				</ButtonText>
			</Button>
		</VStack>
	);
};

export default ProCardScreen;
