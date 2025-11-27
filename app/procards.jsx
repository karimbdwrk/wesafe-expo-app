import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { parseDate, today } from "@internationalized/date";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

import ApplyCard from "@/components/ApplyCard";

import { ChevronLeft, ChevronRight, Info, Plus } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ITEMS_PER_PAGE = 5;

const ProCardsScreen = () => {
	const scrollRef = useRef(null);
	const router = useRouter();
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [procards, setProcards] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, []);

	const loadData = async () => {
		const { data, totalCount } = await getAll(
			"procards",
			"*",
			`&profile_id=eq.${user.id}&isDeleted=eq.false`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc"
		);
		console.log("data pro cards :", data, data.length);
		setProcards(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [page])
	);

	const handleNext = () => {
		setPage((prev) => prev + 1);
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};
	const handlePrev = () => {
		setPage((prev) => Math.max(prev - 1, 1));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	return (
		<View style={{ flex: 1, backgroundColor: "white" }}>
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
					{!procards.length && (
						<HStack
							justifyContent='center'
							style={{ paddingVertical: 90 }}>
							<Badge size='md' variant='solid' action='warning'>
								<BadgeIcon as={Info} className='mr-2' />
								<BadgeText>Aucun résultat</BadgeText>
							</Badge>
						</HStack>
					)}
					{procards.map((app) => (
						<Card key={app.id} variant='filled'>
							<Heading>
								Carte professionnelle n°{app.procard_num}
							</Heading>
							<Text size='xs'>{app.id}</Text>
							<HStack style={{ paddingVertical: 5, gap: 10 }}>
								<Badge size='md' variant='solid' action='info'>
									<BadgeText>{app.category}</BadgeText>
								</Badge>
							</HStack>
							<HStack style={{ paddingVertical: 5, gap: 10 }}>
								{checkDateValidity(app.validity_date) && (
									<>
										{app.isValid ? (
											<Badge
												size='md'
												variant='solid'
												action='success'>
												<BadgeText>
													Validé par WeSafe
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
								{app.isValid &&
									!checkDateValidity(app.validity_date) && (
										<Badge
											size='md'
											variant='solid'
											action='error'>
											<BadgeText>Expirée</BadgeText>
										</Badge>
									)}
							</HStack>
							<Button
								onPress={() =>
									router.push({
										pathname: "/procard",
										params: {
											id: app.id,
										},
									})
								}>
								<ButtonText>Voir</ButtonText>
							</Button>
						</Card>
					))}
					{totalPages > 1 && (
						<HStack
							justifyContent='space-between'
							alignItems='center'
							style={{ paddingBottom: 30 }}>
							<Button
								isDisabled={page === 1}
								onPress={handlePrev}
								variant='outline'>
								<ButtonIcon as={ChevronLeft} />
							</Button>
							<Text>Page {page + "/" + totalPages}</Text>
							<Button
								isDisabled={page >= totalPages}
								onPress={handleNext}
								variant='outline'>
								<ButtonIcon as={ChevronRight} />
							</Button>
						</HStack>
					)}
				</View>
			</ScrollView>
			<VStack
				style={{
					position: "fixed",
					paddingBotttom: 90,
					bottom: 30,
					padding: 15,
					backgroundColor: "white",
				}}>
				<Button onPress={() => router.push("/addprocard")}>
					<ButtonIcon as={Plus} />
					<ButtonText>Ajouter une carte professionnelle</ButtonText>
				</Button>
			</VStack>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	scrollView: {
		flex: 1,
		width: "100%",
		paddingHorizontal: 15,
		backgroundColor: "white",
	},
	jobList: {
		flex: 1,
		gap: 15,
		width: "100%",
		marginVertical: 15,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
});

export default ProCardsScreen;
