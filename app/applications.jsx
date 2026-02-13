import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";

import ApplyCard from "@/components/ApplyCard";

import {
	ChevronLeft,
	ChevronRight,
	Info,
	Briefcase,
	Inbox,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 5;

const ApplicationsScreen = () => {
	const scrollRef = useRef(null);
	const { accessToken, user, signOut } = useAuth();
	const { getAll, isLoading } = useDataContext();
	const { isDark } = useTheme();

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
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}>
			<VStack space='lg' style={{ padding: 16 }}>
				{/* Header Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: "#10b981",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon as={Briefcase} size={24} color='#ffffff' />
						</Box>
						<VStack style={{ flex: 1 }}>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Mes candidatures
							</Heading>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								{totalCount} candidature
								{totalCount > 1 ? "s" : ""}
							</Text>
						</VStack>
					</HStack>
				</Card>

				{/* Applications List */}
				{!applications.length && (
					<Card
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							padding: 40,
							alignItems: "center",
						}}>
						<Box
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
								justifyContent: "center",
								alignItems: "center",
								marginBottom: 16,
							}}>
							<Icon
								as={Inbox}
								size={40}
								color={isDark ? "#9ca3af" : "#6b7280"}
							/>
						</Box>
						<Heading
							size='md'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
								marginBottom: 8,
							}}>
							Aucune candidature
						</Heading>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
								textAlign: "center",
							}}>
							Vous n'avez pas encore postulé à une offre
						</Text>
					</Card>
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
						status={app.current_status}
					/>
				))}

				{/* Pagination */}
				{totalPages > 1 && (
					<HStack
						space='md'
						style={{
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<Button
							isDisabled={page === 1}
							onPress={handlePrev}
							variant='outline'
							style={{
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
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
							}}>
							Page {page} / {totalPages}
						</Text>
						<Button
							isDisabled={page >= totalPages}
							onPress={handleNext}
							variant='outline'
							style={{
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<ButtonIcon
								as={ChevronRight}
								color={isDark ? "#f3f4f6" : "#111827"}
							/>
						</Button>
					</HStack>
				)}
			</VStack>
		</ScrollView>
	);
};

export default ApplicationsScreen;
