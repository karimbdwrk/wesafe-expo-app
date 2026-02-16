import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { Info, ChevronLeft, ChevronRight } from "lucide-react-native";

import WishCard from "@/components/WishCard";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 5;

const WishlistScreen = () => {
	const scrollRef = useRef(null);
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [wishes, setWishes] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
	const [currentScrollY, setCurrentScrollY] = useState(0);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, []);

	const loadData = async () => {
		const { data, totalCount } = await getAll(
			"wishlists",
			"*,jobs(*, companies(*))",
			`&jobs.isArchived=eq.FALSE&jobs=not.is.null&profile_id=eq.${user.id}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc",
		);
		console.log(data, data.length);
		setWishes(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [page]),
	);

	const handleNext = () => {
		setPage((prev) => prev + 1);
		if (currentScrollY !== 0) {
			scrollRef.current?.scrollTo({ y: 0, animated: true });
		}
	};
	const handlePrev = () => {
		setPage((prev) => Math.max(prev - 1, 1));
		if (currentScrollY !== 0) {
			scrollRef.current?.scrollTo({ y: 0, animated: true });
		}
	};

	return (
		<>
			<Box style={{ flex: 1 }}>
				<ScrollView
					ref={scrollRef}
					style={{
						flex: 1,
						backgroundColor: isDark ? "#1f2937" : "#f9fafb",
					}}
					contentContainerStyle={{
						paddingBottom: totalPages > 1 ? 80 : 0,
					}}
					onScroll={(event) =>
						setCurrentScrollY(event.nativeEvent.contentOffset.y)
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}>
					<VStack space='sm' style={{ padding: 16 }}>
						{!wishes.length && (
							<HStack
								justifyContent='center'
								style={{ paddingVertical: 90 }}>
								<Badge
									size='md'
									variant='solid'
									action='warning'>
									<BadgeIcon as={Info} className='mr-2' />
									<BadgeText>Aucun résultat</BadgeText>
								</Badge>
							</HStack>
						)}
						{wishes.map((app) => (
							<WishCard
								key={app.job_id}
								id={app.job_id}
								title={app.jobs.title}
								category={app.jobs.category}
								city={app.jobs.city}
								postcode={app.jobs.postcode}
								company_id={
									app.jobs.companies
										? app.jobs.companies.id
										: null
								}
								company_name={
									app.jobs.companies
										? app.jobs.companies.name
										: "Entreprise"
								}
								company_logo={
									app.jobs.companies
										? app.jobs.companies.logo_url
										: null
								}
								isArchived={app.jobs ? false : true}
							/>
						))}
					</VStack>
				</ScrollView>
				{/* Pagination (fixed bottom) */}
				{totalPages > 1 && (
					<Box
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: isDark ? "#23272f" : "#fff",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: -2 },
							shadowOpacity: 0.08,
							shadowRadius: 8,
							elevation: 8,
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
							paddingVertical: 12,
							paddingHorizontal: 24,
							paddingBottom: 40,
							alignItems: "center",
						}}>
						<HStack
							space='md'
							className='w-full justify-between items-center'>
							<Button
								isDisabled={page === 1}
								onPress={handlePrev}
								variant='outline'
								style={{
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
									borderRadius: 12,
								}}>
								<ButtonIcon
									as={ChevronLeft}
									color={isDark ? "#f3f4f6" : "#111827"}
								/>
							</Button>
							<Text
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									fontWeight: "600",
									fontSize: 16,
								}}>
								Page {page} / {totalPages}
							</Text>
							<Button
								isDisabled={page >= totalPages}
								onPress={handleNext}
								variant='outline'
								style={{
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
									borderRadius: 12,
								}}>
								<ButtonIcon
									as={ChevronRight}
									color={isDark ? "#f3f4f6" : "#111827"}
								/>
							</Button>
						</HStack>
					</Box>
				)}
			</Box>
		</>
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

export default WishlistScreen;
