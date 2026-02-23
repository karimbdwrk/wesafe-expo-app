import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";

import JobCard from "@/components/JobCard";

import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 10;

const OffersScreen = () => {
	const scrollRef = useRef(null);
	const { accessToken, user, signOut } = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
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
		setIsLoading(true);
		const { data, totalCount } = await getAll(
			"jobs",
			"*, companies(name, logo_url)",
			`&company_id=eq.${user.id}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc",
		);
		console.log(data, data.length);
		setOffers(data);
		setTotalCount(totalCount);
		setIsLoading(false);
	};

	useFocusEffect(
		useCallback(() => {
			loadDataOffers();
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
		<VStack
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView
				ref={scrollRef}
				style={{
					width: "100%",
					paddingHorizontal: 15,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				contentContainerStyle={{
					paddingBottom: totalPages > 1 ? 80 : 0,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				{isLoading ? (
					<Spinner />
				) : (
					<VStack
						style={{
							gap: 15,
							width: "100%",
							marginVertical: 15,
						}}>
						{!offers.length && (
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
						{offers.map((offer) => (
							<JobCard
								key={offer?.id}
								id={offer?.id}
								title={offer?.title}
								category={offer?.category}
								company_id={offer?.company_id}
								city={offer?.city}
								postcode={offer?.postcode}
								department={offer?.department_code}
								logo={offer?.companies?.logo_url}
								company_name={offer?.companies?.name}
								isArchived={!offer.isArchived ? false : true}
								contract_type={offer?.contract_type}
								working_time={offer?.work_time}
								salary_hourly={offer?.salary_hourly}
								salary_amount={offer?.salary_amount}
								salary_min={offer?.salary_min}
								salary_max={offer?.salary_max}
								salary_type={offer?.salary_type}
								salary_monthly_fixed={
									offer?.salary_monthly_fixed
								}
								salary_monthly_min={offer?.salary_monthly_min}
								salary_monthly_max={offer?.salary_monthly_max}
								salary_annual_fixed={offer?.salary_annual_fixed}
								salary_annual_min={offer?.salary_annual_min}
								salary_annual_max={offer?.salary_annual_max}
							/>
						))}
					</VStack>
				)}
			</ScrollView>
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
		</VStack>
	);
};

export default OffersScreen;
