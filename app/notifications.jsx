import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { InfoIcon } from "@/components/ui/icon";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const Notifications = () => {
	const { user } = useAuth();
	const { getAll } = useDataContext();
	const [notifications, setNotifications] = useState([]);

	const loadNotifications = async () => {
		try {
			const { data } = await getAll(
				"notifications",
				"*",
				`&recipient_id=eq.${user.id}`,
				1,
				50,
				"created_at.desc",
			);
			setNotifications(data);
			console.log("Notifications loaded:", data);
		} catch (error) {
			console.error("Error loading notifications:", error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			if (user?.id) {
				loadNotifications();
			}
		}, [user]),
	);

	return (
		<VStack style={{ flex: 1, padding: 15 }}>
			<Heading>Notifications</Heading>
			{notifications.length > 0 ? (
				notifications.map((notification) => (
					<Box
						key={notification.id}
						style={{
							marginTop: 10,
							padding: 10,
							borderWidth: 1,
							borderColor: "#ddd",
							borderRadius: 8,
						}}>
						<Text>
							{notification.message || notification.title}
						</Text>
					</Box>
				))
			) : (
				<Text>Aucune notification</Text>
			)}
		</VStack>
	);
};

export default Notifications;
