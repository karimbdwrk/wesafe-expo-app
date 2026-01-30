import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";

import ApplyCard from "@/components/ApplyCard";

import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ITEMS_PER_PAGE = 5;

const ApplicationsScreen = () => {
	const scrollRef = useRef(null);
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [applications, setApplications] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataApplications();
		setRefreshing(false);
	}, []);

	const loadDataApplications = async () => {
		const { data, totalCount } = await getAll(
			"applies",
			"*,jobs(*)",
			`&jobs.isArchived=eq.FALSE&jobs=not.is.null&candidate_id=eq.${user.id}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc",
		);
		setApplications(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadDataApplications();
		}, [page]),
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
				{!applications.length && (
					<HStack
						justifyContent='center'
						style={{ paddingVertical: 90 }}>
						<Badge size='md' variant='solid' action='warning'>
							<BadgeIcon as={Info} className='mr-2' />
							<BadgeText>Aucun résultat</BadgeText>
						</Badge>
					</HStack>
				)}
				{applications.map((app) => (
					<ApplyCard
						key={app.id}
						id={app.job_id}
						title={app.jobs.title}
						category={app.jobs.category}
						company_id={app.company_id}
						isRefused={app.isRefused}
						apply_id={app.id}
						status={app.status}
					/>
				))}
				{totalPages > 1 && (
					<HStack
						justifyContent='space-between'
						alignItems='center'
						style={{ padding: 15 }}>
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

export default ApplicationsScreen;
