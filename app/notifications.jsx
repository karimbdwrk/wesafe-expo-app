import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import {
	Bell,
	Briefcase,
	Circle,
	FileText,
	MessageCircleMore,
	User,
	CheckCheck,
	MailOpen,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const Notifications = () => {
	const { user, accessToken } = useAuth();
	const { getAll, update } = useDataContext();
	const { isDark } = useTheme();
	const {
		notifications,
		unreadCount,
		markNotificationAsRead,
		markAllAsRead,
		refreshNotifications,
		isLoading,
	} = useNotifications();

	const router = useRouter();
	// const [notifications, setNotifications] = useState([]);

	const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

	// const supabaseTest = createClient(SUPABASE_URL, SUPABASE_API_KEY, {
	// 	global: {
	// 		headers: {
	// 			Authorization: accessToken
	// 				? `Bearer ${accessToken}`
	// 				: undefined,
	// 		},
	// 	},
	// });

	// const loadNotifications = async () => {
	// 	try {
	// 		const { data } = await getAll(
	// 			"notifications",
	// 			"*",
	// 			`&recipient_id=eq.${user.id}`,
	// 			1,
	// 			50,
	// 			"created_at.desc",
	// 		);
	// 		setNotifications(data);
	// 		// console.log("Notifications loaded:", data);
	// 	} catch (error) {
	// 		console.error("Error loading notifications:", error);
	// 	}
	// };

	useFocusEffect(
		useCallback(() => {
			refreshNotifications();
		}, []),
	);

	const handleMarkAllAsRead = async () => {
		console.log("Marking all as read...");
		try {
			// Marquer toutes les notifications non lues dans la base de données
			const unreadNotifications = notifications.filter((n) => !n.is_read);

			if (unreadNotifications.length === 0) {
				console.log("No unread notifications");
				return;
			}

			// Mettre à jour toutes les notifications non lues
			const updatePromises = unreadNotifications.map((notification) =>
				update("notifications", notification.id, {
					is_read: true,
					read_at: new Date().toISOString(),
				}),
			);

			await Promise.all(updatePromises);
			console.log("All notifications marked as read");

			// Rafraîchir les notifications après mise à jour
			setTimeout(() => {
				refreshNotifications();
			}, 500);
		} catch (error) {
			console.error("Error marking all as read:", error);
		}
	};

	// const renderNotification = ({ item }) => (
	// 	<NotificationItem
	// 		notification={item}
	// 		onPress={() => markNotificationAsRead(item.id)}
	// 	/>
	// );

	// useFocusEffect(
	// 	useCallback(() => {
	// 		if (user?.id) {
	// 			loadNotifications();
	// 		}
	// 	}, [user]),
	// );

	const handleNotificationPress = async (notification) => {
		console.log("Notification pressed:", notification);

		// Marquer la notification comme lue
		if (!notification.is_read) {
			try {
				await update("notifications", notification.id, {
					is_read: true,
					read_at: new Date().toISOString(),
				});
				// Recharger les notifications pour mettre à jour l'affichage
				markNotificationAsRead();
				// loadNotifications();
			} catch (error) {
				console.error("Error marking notification as read:", error);
			}
		}

		// Navigation selon le type de notification
		if (
			notification.type === "new_message" &&
			notification.metadata?.apply_id
		) {
			// Rediriger vers la page de candidature
			router.push({
				pathname: "/application",
				params: {
					apply_id: notification.metadata.apply_id,
					id: user.id,
					title: notification.title || "Candidature",
				},
			});
		} else if (
			notification.entity_type === "message" &&
			notification.entity_id
		) {
			// Notification de message groupé - entity_id contient l'apply_id
			router.replace({
				pathname: "/application",
				params: {
					apply_id: notification.entity_id,
					id: user.id,
					openMessaging: "true",
					title: notification.title || "Candidature",
				},
			});
		} else if (
			notification.entity_type === "application" &&
			notification.entity_id
		) {
			router.replace({
				pathname: "/application",
				params: {
					apply_id: notification.entity_id,
					id: user.id,
					title: notification.title || "Candidature",
				},
			});
		} else if (
			notification.type === "job_offer" &&
			notification.entity_id
		) {
			router.replace({
				pathname: "/job",
				params: { id: notification.entity_id },
			});
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now - date;
		const hours = Math.floor(diff / (1000 * 60 * 60));

		if (hours < 1) {
			const minutes = Math.floor(diff / (1000 * 60));
			if (minutes < 2) {
				return "À l'instant";
			}
			return `Il y a ${minutes} min`;
		} else if (hours < 24) {
			return `Il y a ${hours}h`;
		} else {
			const days = Math.floor(hours / 24);
			return `Il y a ${days}j`;
		}
	};

	const getNotificationIcon = (type) => {
		switch (type) {
			case "application":
				return Briefcase;
			case "application_selected":
				return Briefcase;
			case "application_rejected":
				return Briefcase;
			case "contract_sent":
				return FileText;
			case "contract_signed_candidate":
				return FileText;
			case "contract_signed_pro":
				return FileText;
			case "job_offer":
				return Briefcase;
			case "message":
				return MessageCircleMore;
			default:
				return Bell;
		}
	};

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack space='lg' style={{ padding: 20 }}>
				{/* Header Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<HStack
						space='md'
						style={{
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<HStack
							space='md'
							style={{ alignItems: "center", flex: 1 }}>
							<Box
								style={{
									width: 48,
									height: 48,
									borderRadius: 24,
									backgroundColor: "#2563eb",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Icon as={Bell} size={24} color='#ffffff' />
							</Box>
							<VStack style={{ flex: 1 }}>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Notifications
								</Heading>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										marginTop: 2,
									}}>
									{unreadCount > 0
										? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
										: "Aucune notification non lue"}
								</Text>
							</VStack>
						</HStack>
						{unreadCount > 0 && (
							<TouchableOpacity onPress={handleMarkAllAsRead}>
								<Box
									style={{
										paddingHorizontal: 12,
										paddingVertical: 8,
										borderRadius: 8,
										backgroundColor: isDark
											? "#1f2937"
											: "#f3f4f6",
									}}>
									<HStack
										space='xs'
										style={{ alignItems: "center" }}>
										<Icon
											as={CheckCheck}
											size={16}
											color='#2563eb'
										/>
										<Text
											size='xs'
											style={{
												color: "#2563eb",
												fontWeight: "600",
											}}>
											Tout lire
										</Text>
									</HStack>
								</Box>
							</TouchableOpacity>
						)}
					</HStack>
				</Card>

				{/* Notifications List */}
				{notifications.length > 0 ? (
					<VStack space='md'>
						{notifications.map((notification) => (
							<TouchableOpacity
								key={notification.id}
								onPress={() =>
									handleNotificationPress(notification)
								}
								activeOpacity={0.7}>
								<Card
									style={{
										backgroundColor: notification.is_read
											? isDark
												? "#374151"
												: "#ffffff"
											: isDark
												? "#1e3a5f"
												: "#eff6ff",
										borderRadius: 12,
										padding: 16,
										borderWidth: notification.is_read
											? 0
											: 1,
										borderColor: "#2563eb",
									}}>
									<HStack
										space='md'
										style={{ alignItems: "flex-start" }}>
										{/* Icon */}
										<Box
											style={{
												width: 40,
												height: 40,
												borderRadius: 20,
												backgroundColor:
													notification.is_read
														? isDark
															? "#1f2937"
															: "#f3f4f6"
														: "#dbeafe",
												justifyContent: "center",
												alignItems: "center",
												position: "relative",
											}}>
											<Icon
												as={getNotificationIcon(
													notification.entity_type,
												)}
												size={20}
												color={
													notification.is_read
														? isDark
															? "#9ca3af"
															: "#6b7280"
														: "#2563eb"
												}
											/>
											{!notification.is_read && (
												<Box
													style={{
														position: "absolute",
														top: -2,
														right: -2,
														width: 10,
														height: 10,
														borderRadius: 5,
														backgroundColor:
															"#2563eb",
														borderWidth: 2,
														borderColor: isDark
															? "#1e3a5f"
															: "#eff6ff",
													}}
												/>
											)}
										</Box>

										{/* Content */}
										<VStack style={{ flex: 1 }} space='xs'>
											<HStack
												style={{
													justifyContent:
														"space-between",
													alignItems: "flex-start",
												}}>
												<VStack
													style={{ flex: 1 }}
													space='xs'>
													<Text
														size='sm'
														style={{
															fontWeight: "700",
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														{notification.title}
													</Text>
													{notification.body && (
														<Text
															size='sm'
															style={{
																fontWeight:
																	"600",
																color: isDark
																	? "#d1d5db"
																	: "#374151",
															}}>
															{notification.body}
														</Text>
													)}
												</VStack>
												<Text
													size='xs'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														marginLeft: 8,
													}}>
													{formatDate(
														notification.created_at,
													)}
												</Text>
											</HStack>
											{notification.message && (
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
														lineHeight: 18,
													}}>
													{notification.message}
												</Text>
											)}
										</VStack>
									</HStack>
								</Card>
							</TouchableOpacity>
						))}
					</VStack>
				) : (
					<Card
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							padding: 40,
						}}>
						<VStack
							space='md'
							style={{
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
								}}>
								<Icon
									as={MailOpen}
									size={40}
									color={isDark ? "#6b7280" : "#9ca3af"}
								/>
							</Box>
							<VStack space='xs' style={{ alignItems: "center" }}>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Aucune notification
								</Heading>
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textAlign: "center",
									}}>
									Vous êtes à jour !
								</Text>
							</VStack>
						</VStack>
					</Card>
				)}
			</VStack>
		</ScrollView>
	);
};

export default Notifications;
