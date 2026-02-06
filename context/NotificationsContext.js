import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
	const { user, accessToken } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		if (!user?.id || !accessToken || isInitialized) return;

		const fetchUnreadCount = async () => {
			try {
				const supabase = createSupabaseClient(accessToken);
				const { count, error } = await supabase
					.from("notifications")
					.select("*", { count: "exact", head: true })
					.eq("is_read", false)
					.eq("recipient_id", user.id);

				if (error) throw error;

				setUnreadCount(count || 0);
				setIsInitialized(true);
				console.log("🔔 INITIAL UNREAD COUNT:", count);
			} catch (error) {
				console.error("Error fetching unread count:", error);
				setUnreadCount(0);
				setIsInitialized(true);
			}
		};

		fetchUnreadCount();
	}, [user?.id, accessToken, isInitialized]);

	useEffect(() => {
		console.log("🔔 NOTIF EFFECT start", {
			userId: user?.id,
			hasToken: !!accessToken,
		});

		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);

		const channel = supabase
			.channel(`user:${user.id}:notifications`)
			.on(
				"postgres_changes",
				{
					event: "*", // ← écoute TOUT (INSERT + UPDATE + DELETE)
					schema: "public",
					table: "notifications",
					filter: `recipient_id=eq.${user.id}`, // adapte ta colonne user
				},
				(payload) => {
					console.log(
						"🔴 NOTIF EVENT:",
						payload.eventType,
						payload.new,
					);

					if (
						payload.eventType === "INSERT" &&
						!payload.new.is_read
					) {
						// Nouvelle notif non lue → +1
						setUnreadCount((prev) => prev + 1);
					} else if (payload.eventType === "UPDATE") {
						// UPDATE : compare avant/après
						const wasUnread = !payload.old?.is_read;
						const isUnread = !payload.new.is_read;

						if (wasUnread && !isUnread) {
							// Était non lue → maintenant lue → -1
							setUnreadCount((prev) => Math.max(prev - 1, 0));
						}
						// Si UPDATE mais pas de changement is_read → on ignore
					}
				},
			)
			.subscribe();

		return () => {
			console.log("🧹 CLEANUP NOTIF CHANNEL");
			supabase.removeChannel(channel);
		};
	}, [user?.id, accessToken]);

	const markNotificationAsRead = () => {
		setUnreadCount((prev) => Math.max(prev - 1, 0));
	};

	const resetUnreadCount = () => {
		setUnreadCount(0);
		setIsInitialized(false);
	};

	const refreshUnreadCount = useCallback(async () => {
		if (!user?.id || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			const { count, error } = await supabase
				.from("notifications")
				.select("*", { count: "exact", head: true })
				.eq("is_read", false)
				.eq("recipient_id", user.id); // adapte ta colonne

			console.log("🔄 REFRESH UNREAD COUNT:", { count, error });

			if (!error && count !== null) {
				setUnreadCount(count);
				console.log("🔄 REFRESH COUNT:", count);
			}
		} catch (error) {
			console.error("Refresh unread count error:", error);
		}
	}, [user?.id, accessToken]);

	return (
		<NotificationsContext.Provider
			value={{
				unreadCount,
				markNotificationAsRead,
				resetUnreadCount,
				refreshUnreadCount,
			}}>
			{children}
		</NotificationsContext.Provider>
	);
};

export const useNotifications = () => useContext(NotificationsContext);
