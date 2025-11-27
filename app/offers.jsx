import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";

import JobCard from "@/components/JobCard";

import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ITEMS_PER_PAGE = 5;

const OffersScreen = () => {
	const scrollRef = useRef(null);
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [offers, setOffers] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataOffers();
		setRefreshing(false);
	}, []);

	const loadDataOffers = async () => {
		const { data, totalCount } = await getAll(
			"jobs",
			"*",
			`&company_id=eq.${user.id}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc"
		);
		console.log(data, data.length);
		setOffers(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadDataOffers();
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
		<ScrollView
			ref={scrollRef}
			style={styles.scrollView}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}>
			<View style={styles.jobList}>
				{!offers.length && (
					<HStack
						justifyContent='center'
						style={{ paddingVertical: 90 }}>
						<Badge size='md' variant='solid' action='warning'>
							<BadgeIcon as={Info} className='mr-2' />
							<BadgeText>Aucun résultat</BadgeText>
						</Badge>
					</HStack>
				)}
				{offers.map((offer) => (
					<JobCard
						key={offer.id}
						id={offer.id}
						title={offer.title}
						category={offer.category}
						company_id={offer.company_id}
						isArchived={!offer.isArchived ? false : true}
					/>
				))}
				{totalPages > 1 && (
					<HStack
						justifyContent='center'
						alignItems='center'
						space='md'
						style={{ paddingBottom: 45 }}>
						<Button
							isDisabled={page === 1}
							onPress={handlePrev}
							variant='link'>
							<ButtonIcon as={ChevronLeft} />
						</Button>
						<Text>Page {page + " / " + totalPages}</Text>
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

export default OffersScreen;
