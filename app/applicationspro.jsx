import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createSupabaseClient } from "@/lib/supabase";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";

import ApplyCard from "@/components/ApplyCard";

import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ITEMS_PER_PAGE = 5;

const ApplicationsProScreen = () => {
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
			"applications",
			"*,jobs(*),profiles(*)",
			`&jobs.isArchived=eq.FALSE&jobs=not.is.null&company_id=eq.${user.id}`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc",
		);
		setApplications(data);
		setTotalCount(totalCount);
	};

	useEffect(() => {
		if (user?.id) {
			loadDataApplications();
		}
	}, [page, user?.id]);

	// Abonnement real-time pour mettre à jour les applications
	useEffect(() => {
		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`applications-list-pro-${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "applications",
					filter: `company_id=eq.${user.id}`,
				},
				(payload) => {
					console.log(
						"✅ Real-time applications pro:",
						payload.new.id,
						"- company_notification:",
						payload.new.company_notification,
					);
					// Mettre à jour l'application dans la liste en préservant les relations
					setApplications((prevApps) =>
						prevApps.map((app) =>
							app.id === payload.new.id
								? {
										...app,
										current_status:
											payload.new.current_status,
										candidate_notification:
											payload.new.candidate_notification,
										company_notification:
											payload.new.company_notification,
										updated_at: payload.new.updated_at,
										isRefused: payload.new.isRefused,
									}
								: app,
						),
					);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id, accessToken]);

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
						key={`${app.id}-${app.candidate_notification}-${app.company_notification}-${app.current_status}`}
						id={app.job_id}
						name={
							app.profiles.lastname + " " + app.profiles.firstname
						}
						title={app.jobs.title}
						category={app.jobs.category}
						company_id={app.company_id}
						isRefused={app.isRefused}
						apply_id={app.id}
						status={app.current_status}
						application={app}
					/>
				))}
				{totalPages > 1 && (
					<HStack justifyContent='space-between' alignItems='center'>
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

export default ApplicationsProScreen;
