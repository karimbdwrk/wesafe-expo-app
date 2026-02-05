// // context/NotificationsContext.jsx
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { createSupabaseClient } from "@/lib/supabase";
// import { useAuth } from "@/context/AuthContext";

// const NotificationsContext = createContext();

// export const NotificationsProvider = ({ children }) => {
// 	const { user, accessToken } = useAuth();
// 	const [unreadCount, setUnreadCount] = useState(0);

// 	useEffect(() => {
// 		if (!user?.id || !accessToken) return;

// 		const supabase = createSupabaseClient(accessToken);

// 		const channel = supabase
// 			.channel(`user:${user.id}:notifications`)
// 			.on("broadcast", { event: "new_notification" }, () => {
// 				setUnreadCount((prev) => prev + 1);
// 			})
// 			.subscribe();

// 		return () => {
// 			supabase.removeChannel(channel);
// 		};
// 	}, [user?.id, accessToken]);

// 	// ✅ appelé quand UNE notif est lue
// 	const markNotificationAsRead = () => {
// 		setUnreadCount((prev) => Math.max(prev - 1, 0));
// 	};

// 	// ✅ utile si tu marques tout comme lu
// 	const resetUnreadCount = () => {
// 		setUnreadCount(0);
// 	};

// 	return (
// 		<NotificationsContext.Provider
// 			value={{
// 				unreadCount,
// 				markNotificationAsRead,
// 				resetUnreadCount,
// 			}}>
// 			{children}
// 		</NotificationsContext.Provider>
// 	);
// };

// export const useNotifications = () => useContext(NotificationsContext);

// context/NotificationsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
	const { user, accessToken } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		console.log("🔔 NOTIF EFFECT start", {
			userId: user?.id,
			hasToken: !!accessToken,
		});

		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);

		const channel = supabase
			.channel("debug:notifications")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications", // ← ici
				},
				(payload) => {
					console.log("🔴 NOTIFICATIONS PAYLOAD", payload);
					// Vérifie que c'est bien une notif pour ton user
					if (payload.new.recipient_id === user.id) {
						// adapte selon ta colonne
						setUnreadCount((prev) => prev + 1);
					}
				},
			)
			// .on(
			// 	"postgres_changes",
			// 	{
			// 		event: "*",
			// 		schema: "public",
			// 		table: "test_realtime",
			// 	},
			// 	(payload) => {
			// 		console.log("🔴 TEST REALTIME PAYLOAD", payload);
			// 		setUnreadCount((prev) => prev + 1);
			// 	},
			// )
			.subscribe((status) => {
				console.log("📡 SUBSCRIBE STATUS", status);
			});

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
	};

	return (
		<NotificationsContext.Provider
			value={{
				unreadCount,
				markNotificationAsRead,
				resetUnreadCount,
			}}>
			{children}
		</NotificationsContext.Provider>
	);
};

export const useNotifications = () => useContext(NotificationsContext);
