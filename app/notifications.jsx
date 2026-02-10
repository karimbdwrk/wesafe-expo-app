import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
	BadgeIcon,
	Bell,
	Briefcase,
	CircleSmall,
	FileText,
	User,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useNotifications } from "@/context/NotificationsContext";
import { height } from "dom-helpers";

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const Notifications = () => {
	const { user, accessToken } = useAuth();
	const { getAll, update } = useDataContext();
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
			notification.entity_type === "application" &&
			notification.entity_id
		) {
			router.replace({
				pathname: "/application",
				params: { apply_id: notification.entity_id, id: user.id },
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
			default:
				return Bell;
		}
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<VStack style={{ padding: 15, gap: 10 }}>
				{notifications.length > 0 ? (
					notifications.map((notification) => (
						<Pressable
							key={notification.id}
							onPress={() =>
								handleNotificationPress(notification)
							}>
							<Card
								style={{
									padding: 15,
									backgroundColor: notification.is_read
										? "#fff"
										: "#f0f9ff",
									borderWidth: 1,
									borderColor: notification.is_read
										? "#e5e7eb"
										: "#3b82f6",
								}}>
								<HStack
									style={{
										gap: 15,
										alignItems: "flex-start",
									}}>
									<VStack
										style={{
											justifyContent: "space-between",
											alignItems: "center",
											height: 60,
										}}>
										<Icon
											as={getNotificationIcon(
												notification.entity_type,
											)}
											size='lg'
											color={
												notification.is_read
													? "#6b7280"
													: "#3b82f6"
											}
											style={{ marginTop: 4 }}
										/>
										{!notification.is_read && (
											<Icon
												as={CircleSmall}
												size={14}
												color='#3b82f6'
											/>
										)}
									</VStack>
									<VStack>
										<HStack
											style={{
												justifyContent: "space-between",
												alignItems: "center",
											}}>
											<VStack>
												<Heading size='md'>
													{notification.title}
												</Heading>
												<Text
													style={{
														fontWeight: "600",
														fontSize: 14,
													}}>
													{notification.body}
												</Text>
											</VStack>
										</HStack>
										<Text
											style={{
												fontSize: 13,
												color: "#6b7280",
											}}>
											{notification.message}
										</Text>
										<Text
											style={{
												fontSize: 11,
												color: "#9ca3af",
											}}>
											{formatDate(
												notification.created_at,
											)}
										</Text>
									</VStack>
								</HStack>
							</Card>
						</Pressable>
					))
				) : (
					<VStack
						style={{
							alignItems: "center",
							marginTop: 40,
							gap: 10,
						}}>
						<Icon as={Bell} size='xl' color='#9ca3af' />
						<Text style={{ color: "#6b7280" }}>
							Aucune notification
						</Text>
					</VStack>
				)}
			</VStack>
		</ScrollView>
	);
};

export default Notifications;
