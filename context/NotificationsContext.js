// context/NotificationsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
	const { user, accessToken } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		if (!user?.id || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);

		const channel = supabase
			.channel(`user:${user.id}:notifications`)
			.on("broadcast", { event: "new_notification" }, () => {
				setUnreadCount((prev) => prev + 1);
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id, accessToken]);

	// ✅ appelé quand UNE notif est lue
	const markNotificationAsRead = () => {
		setUnreadCount((prev) => Math.max(prev - 1, 0));
	};

	// ✅ utile si tu marques tout comme lu
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
