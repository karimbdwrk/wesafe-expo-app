// context/NotificationsContext.jsx
import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import NotificationToast from "@/components/NotificationToast";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
	const { user, accessToken } = useAuth();
	const [notifications, setNotifications] = useState([]); // ➕ LISTE
	const [unreadCount, setUnreadCount] = useState(0);
	const [isInitialized, setIsInitialized] = useState(false);
	const [currentToast, setCurrentToast] = useState(null);
	const [toastVisible, setToastVisible] = useState(false);

	// ➕ FETCH INITIAL DES NOTIFS
	const fetchNotifications = useCallback(async () => {
		if (!user?.id || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			const { data, error, count } = await supabase
				.from("notifications")
				.select(
					`
                    id, title, body, entity_type, entity_id, 
                    is_read, read_at, metadata, created_at
                    `,
					{
						count: "exact",
						order: "created_at",
						ascending: false,
					},
				)
				.eq("recipient_id", user.id)
				.order("created_at", { ascending: false });

			if (!error) {
				setNotifications(data || []);
				setUnreadCount(
					count?.unread ||
						data?.filter((n) => !n.is_read).length ||
						0,
				);
				console.log("🔔 NOTIFS LOADED:", data?.length);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
	}, [user?.id, accessToken]);

	// INITIALISATION
	useEffect(() => {
		if (!user?.id || !accessToken || isInitialized) return;
		fetchNotifications();
		setIsInitialized(true);
	}, [fetchNotifications, isInitialized]);

	// ➕ REALTIME pour LISTE + COUNT
	useEffect(() => {
		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`user:${user.id}:notifications`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "notifications",
					filter: `recipient_id=eq.${user.id}`,
				},
				(payload) => {
					console.log("🔴 NOTIF CHANGE:", payload.eventType);

					if (payload.eventType === "INSERT") {
						// ➕ Nouvelle notif en tête de liste
						if (!payload.new.is_read) {
							setUnreadCount((prev) => prev + 1);
						}
						setNotifications((prev) => [payload.new, ...prev]);

						// 🆕 AFFICHER LE TOAST
						showToast(payload.new);
					} else if (payload.eventType === "UPDATE") {
						// ➕ Remplace la notif mise à jour
						setNotifications((prev) =>
							prev.map((n) =>
								n.id === payload.new.id ? payload.new : n,
							),
						);

						// Gère le count
						const wasUnread = payload.old && !payload.old.is_read;
						const isUnread = !payload.new.is_read;
						if (wasUnread && !isUnread) {
							setUnreadCount((prev) => Math.max(prev - 1, 0));
						}
					} else if (payload.eventType === "DELETE") {
						// ➕ Supprime de la liste
						setNotifications((prev) =>
							prev.filter((n) => n.id !== payload.old.id),
						);
						if (payload.old && !payload.old.is_read) {
							setUnreadCount((prev) => Math.max(prev - 1, 0));
						}
					}
				},
			)
			.subscribe();

		return () => supabase.removeChannel(channel);
	}, [user?.id, accessToken]);

	// ➕ MARQUER UNE NOTIF COMME LUE
	const markNotificationAsRead = useCallback(
		async (notificationId) => {
			if (!accessToken) return;

			const supabase = createSupabaseClient(accessToken);
			const { error } = await supabase
				.from("notifications")
				.update({
					is_read: true,
					read_at: new Date().toISOString(),
				})
				.eq("id", notificationId)
				.eq("recipient_id", user.id);

			if (!error) {
				setUnreadCount((prev) => Math.max(prev - 1, 0));
			}
		},
		[accessToken, user?.id],
	);

	// ➕ MARQUER TOUTES COMME LUES
	const markAllAsRead = useCallback(async () => {
		if (!accessToken || notifications.length === 0) return;

		const supabase = createSupabaseClient(accessToken);
		const { error } = await supabase.rpc("mark_all_notifications_as_read", {
			recipient_id: user.id,
		}); // ou UPDATE direct

		if (!error) {
			setUnreadCount(0);
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, is_read: true })),
			);
		}
	}, [accessToken, user?.id, notifications.length]);

	// ➕ REFRESH MANUEL (pour useFocusEffect)
	const refreshUnreadCount = useCallback(async () => {
		await fetchNotifications();
	}, [fetchNotifications]);

	// 🆕 AFFICHER LE TOAST
	const showToast = (notification) => {
		setCurrentToast(notification);
		setToastVisible(true);

		// Auto-hide après 5 secondes
		setTimeout(() => {
			dismissToast();
		}, 5000);
	};

	// 🆕 FERMER LE TOAST
	const dismissToast = () => {
		setToastVisible(false);
		setTimeout(() => setCurrentToast(null), 300);
	};

	// 🆕 GÉRER LE CLIC SUR LE TOAST
	const handleToastPress = useCallback(
		async (notification) => {
			try {
				console.log(
					"🔵 Toast press - Start",
					notification?.entity_type,
				);

				// Fermer le toast
				dismissToast();
				console.log("🔵 Toast dismissed");

				// Marquer comme lue
				if (!notification.is_read) {
					console.log("🔵 Marking as read...");
					await markNotificationAsRead(notification.id);
					console.log("🔵 Marked as read");
				}

				// Petit délai pour laisser le toast se fermer
				await new Promise((resolve) => setTimeout(resolve, 100));

				console.log("🔵 Getting router...");
				// Importer le router dynamiquement pour éviter les dépendances circulaires
				const { router } = require("expo-router");
				console.log("🔵 Router obtained");

				// Navigation selon le type
				if (
					notification.type === "new_message" &&
					notification.metadata?.apply_id
				) {
					console.log("🔵 Navigating to application (new_message)");
					router.push({
						pathname: "/application",
						params: {
							apply_id: notification.metadata.apply_id,
							id: user.id,
						},
					});
				} else if (
					notification.entity_type === "message" &&
					notification.entity_id
				) {
					console.log("🔵 Navigating to application (message)");
					router.push({
						pathname: "/application",
						params: {
							apply_id: notification.entity_id,
							id: user.id,
							openMessaging: "true",
						},
					});
				} else if (
					notification.entity_type === "application" &&
					notification.entity_id
				) {
					console.log("🔵 Navigating to application");
					router.push({
						pathname: "/application",
						params: {
							apply_id: notification.entity_id,
							id: user.id,
						},
					});
				} else if (
					notification.type === "job_offer" &&
					notification.entity_id
				) {
					console.log("🔵 Navigating to job");
					router.push({
						pathname: "/job",
						params: { id: notification.entity_id },
					});
				}
				console.log("🔵 Toast press - End");
			} catch (error) {
				console.error("❌ Error handling toast press:", error);
				console.error("❌ Error stack:", error.stack);
			}
		},
		[user?.id, markNotificationAsRead, dismissToast],
	);

	return (
		<NotificationsContext.Provider
			value={{
				notifications, // ➕ LA LISTE
				unreadCount,
				markNotificationAsRead, // ➕ avec ID
				markAllAsRead, // ➕ toutes
				refreshUnreadCount,
				refreshNotifications: fetchNotifications, // ➕ refresh complet
				isLoading: !isInitialized,
			}}>
			{children}
			{toastVisible && currentToast && (
				<NotificationToast
					notification={currentToast}
					onPress={() => handleToastPress(currentToast)}
					onDismiss={dismissToast}
				/>
			)}
		</NotificationsContext.Provider>
	);
};

export const useNotifications = () => useContext(NotificationsContext);
