import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createSupabaseClient } from "@/lib/supabase";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";

import ApplyCard from "@/components/ApplyCard";

import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 5;

const ApplicationsProScreen = () => {
	const scrollRef = useRef(null);
	const { isDark } = useTheme();
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
			"*,jobs(*), profiles(*), companies(*)",
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

	// Recharger les applications quand on revient sur le screen
	useFocusEffect(
		useCallback(() => {
			if (!user?.id || !accessToken) return;

			// Recharger uniquement les applications qui ont company_notification=true
			const appsWithNotification = applications.filter(
				(app) => app.company_notification,
			);

			if (appsWithNotification.length === 0) return;

			console.log(
				"🔄 Refresh applications pro avec notifications:",
				appsWithNotification.length,
			);

			const supabase = createSupabaseClient(accessToken);
			Promise.all(
				appsWithNotification.map((app) =>
					supabase
						.from("applications")
						.select("*")
						.eq("id", app.id)
						.single(),
				),
			).then((results) => {
				results.forEach(({ data, error }) => {
					if (!error && data) {
						console.log(
							"✅ App rechargée:",
							data.id,
							"company_notification:",
							data.company_notification,
						);
						setApplications((prevApps) =>
							prevApps.map((app) =>
								app.id === data.id
									? {
											...app,
											candidate_notification:
												data.candidate_notification,
											company_notification:
												data.company_notification,
											current_status: data.current_status,
											updated_at: data.updated_at,
										}
									: app,
							),
						);
					}
				});
			});
		}, [user?.id, accessToken, applications]),
	);

	// Mettre à jour une application quand une notification arrive
	useEffect(() => {
		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);

		// Écouter les INSERT sur la table notifications
		const channel = supabase
			.channel(`notifications-trigger-pro-${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: `recipient_id=eq.${user.id}`,
				},
				async (payload) => {
					console.log(
						"📢 Notification INSERT pro:",
						payload.new.entity_id,
					);

					// Si c'est une notification de type message, recharger l'application
					if (
						payload.new.entity_type === "message" &&
						payload.new.entity_id
					) {
						console.log(
							"🔔 Notification reçue, refresh application:",
							payload.new.entity_id,
						);

						const { data, error } = await supabase
							.from("applications")
							.select("*")
							.eq("id", payload.new.entity_id)
							.single();

						if (!error && data) {
							console.log(
								"✅ App rechargée:",
								data.id,
								"company_notification:",
								data.company_notification,
							);
							setApplications((prevApps) => {
								// Retirer l'application de sa position actuelle
								const otherApps = prevApps.filter(
									(app) => app.id !== data.id,
								);

								// Trouver l'application originale pour conserver les relations
								const originalApp = prevApps.find(
									(app) => app.id === data.id,
								);

								if (!originalApp) return prevApps;

								// Créer l'application mise à jour avec relations préservées
								const updatedApp = {
									...originalApp,
									candidate_notification:
										data.candidate_notification,
									company_notification:
										data.company_notification,
									current_status: data.current_status,
									updated_at: data.updated_at,
								};

								// Remettre l'application mise à jour en premier
								return [updatedApp, ...otherApps];
							});
						}
					}
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
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView
				ref={scrollRef}
				style={styles.scrollView}
				contentContainerStyle={{
					paddingBottom: totalPages > 1 ? 80 : 0,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
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
								app.profiles.lastname +
								" " +
								app.profiles.firstname
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
				</View>
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
		</Box>
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
