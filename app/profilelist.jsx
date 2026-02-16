import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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

import {
	ChevronLeft,
	ChevronRight,
	Info,
	Plus,
	QrCode,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ITEMS_PER_PAGE = 5;

const ProfileListScreen = () => {
	const scrollRef = useRef(null);
	const router = useRouter();
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [profileList, setProfileList] = useState([]);

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
			"profilelist",
			"*, profiles(*, procards(*))",
			`&company_id=eq.${
				user.id
			}&profiles.procards.status=eq.verified&profiles.procards.validity_date=gte.${today(
				"UTC"
			).toString()}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc"
		);
		console.log("data profile list :", data, data.length);
		setProfileList(data);
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
					{!profileList.length && (
						<HStack
							justifyContent='center'
							style={{ paddingVertical: 90 }}>
							<Badge size='md' variant='solid' action='warning'>
								<BadgeIcon as={Info} className='mr-2' />
								<BadgeText>Aucun résultat</BadgeText>
							</Badge>
						</HStack>
					)}
					{profileList.map((pro) => (
						<Card key={pro.id} variant='filled'>
							<Heading>
								{pro.profiles.lastname +
									" " +
									pro.profiles.firstname}
							</Heading>
							<Text size='xs'>{pro.candidate_id}</Text>
							<HStack style={{ paddingVertical: 5, gap: 10 }}>
								{pro.profiles.procards.map((card) => (
									<Badge
										key={card.id}
										size='md'
										variant='solid'
										action='info'>
										<BadgeText>{card.category}</BadgeText>
									</Badge>
								))}
								{pro.profiles.procards.length === 0 && (
									<Badge
										size='md'
										variant='solid'
										action='warning'>
										<BadgeText>
											Aucune carte pro valide
										</BadgeText>
									</Badge>
								)}
							</HStack>
							<Button
								onPress={() =>
									router.push({
										pathname: "/profile",
										params: {
											profile_id: pro.candidate_id,
										},
									})
								}>
								<ButtonText>Voir profil</ButtonText>
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
				<Button onPress={() => router.push("/scanner")}>
					<ButtonIcon as={QrCode} />
					<ButtonText>Scanner un nouveau profil</ButtonText>
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

export default ProfileListScreen;
