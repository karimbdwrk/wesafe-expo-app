import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createSupabaseClient } from "@/lib/supabase";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

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

const ITEMS_PER_PAGE = 10;

const ApplicationsScreen = () => {
	// Fonctions de pagination
	const scrollRef = useRef(null);
	const { accessToken, user, signOut, role } = useAuth();
	const { getAll, isLoading } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);

	const [page, setPage] = useState(1);
	const [applications, setApplications] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
	const [currentScrollY, setCurrentScrollY] = useState(0);

	// Fonction pour charger les candidatures paginées
	const loadDataApplications = async () => {
		setRefreshing(true);
		try {
			const { data, totalCount } = await getAll(
				"applications",
				"*,jobs(*), companies(*)",
				`&jobs.isArchived=eq.FALSE&jobs=not.is.null&candidate_id=eq.${user.id}`,
				page,
				ITEMS_PER_PAGE,
				"updated_at.desc.nullslast,created_at.desc",
			);
			setApplications(data);
			setTotalCount(totalCount);
		} finally {
			if (currentScrollY !== 0) {
				scrollRef.current?.scrollTo({ y: 0, animated: true });
			}
			setRefreshing(false);
		}
	};

	// Rafraîchissement manuel
	const onRefresh = () => {
		loadDataApplications();
	};

	// Chargement initial et à chaque changement de page
	useEffect(() => {
		if (user && user.id) {
			loadDataApplications();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, user]);

	// Recharger les applications quand on revient sur le screen
	useFocusEffect(
		useCallback(() => {
			if (!user?.id || !accessToken) return;

			// Recharger uniquement les applications qui ont candidate_notification=true
			const appsWithNotification = applications.filter(
				(app) => app.candidate_notification,
			);

			if (appsWithNotification.length === 0) return;

			console.log(
				"🔄 Refresh applications avec notifications:",
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
							"candidate_notification:",
							data.candidate_notification,
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
			.channel(`notifications-trigger-${user.id}`)
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
						"📢 Notification INSERT:",
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
								"candidate_notification:",
								data.candidate_notification,
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
					{/* Header Card */}
					{/* ...existing code... */}
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
									backgroundColor: isDark
										? "#1f2937"
										: "#f3f4f6",
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
							key={`${app.id}-${app.candidate_notification}-${app.company_notification}-${app.current_status}`}
							id={app.job_id}
							title={app.jobs.title}
							category={app.jobs.category}
							company_id={app.company_id}
							isRefused={app.isRefused}
							apply_id={app.id}
							status={app.current_status}
							application={app}
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
	);
	// ...existing code...
};

export default ApplicationsScreen;
