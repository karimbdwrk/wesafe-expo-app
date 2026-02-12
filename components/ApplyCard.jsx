import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
// import { Image } from "@/components/ui/image";
// import { Link, LinkText } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";
import { width } from "dom-helpers";
import { BackpackIcon } from "lucide-react-native";

const ApplyCard = ({
	id,
	name,
	title,
	category,
	company_id,
	isRefused,
	apply_id,
	status,
}) => {
	const router = useRouter();
	const { user, accessToken } = useAuth();
	const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

	useEffect(() => {
		if (!user?.id || !apply_id || !accessToken) return;

		const loadUnreadMessagesCount = async () => {
			try {
				const supabase = createSupabaseClient(accessToken);
				const { count, error } = await supabase
					.from("messages")
					.select("*", { count: "exact", head: true })
					.eq("apply_id", apply_id)
					.neq("sender_id", user.id)
					.eq("is_read", false);

				if (!error) {
					setUnreadMessagesCount(count || 0);
				}
			} catch (error) {
				console.error("Error loading unread messages count:", error);
			}
		};

		loadUnreadMessagesCount();

		// Abonnement real-time pour les messages
		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`messages-card-${apply_id}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "messages",
					filter: `apply_id=eq.${apply_id}`,
				},
				() => {
					loadUnreadMessagesCount();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id, apply_id, accessToken]);
	return (
		<Pressable
			onPress={() =>
				router.push({
					pathname: "/application",
					params: {
						id,
						title,
						company_id,
						category,
						apply_id,
						name,
					},
				})
			}>
			{({ pressed }) => (
				<Card
					size='lg'
					variant='filled'
					style={{
						width: "100%",
						backgroundColor: pressed ? "#F0F0F0" : "#F7F7F7",
					}}>
					{name && (
						<Heading size='md' className='mb-1'>
							{name}
						</Heading>
					)}
					<Heading size='md' className='mb-1'>
						{title}
					</Heading>
					<Text>{id}</Text>
					<HStack style={{ marginTop: 15, gap: 10 }}>
						<Badge size='md' variant='solid' action='warning'>
							<BadgeText>{category}</BadgeText>
						</Badge>
						<Badge
							size='md'
							variant='solid'
							action={
								status === "rejected" ? "error" : "success"
							}>
							<BadgeText>{status}</BadgeText>
						</Badge>
						{unreadMessagesCount > 0 && (
							<Badge
								size='md'
								variant='solid'
								action='error'
								style={{
									minWidth: 24,
									height: 24,
									borderRadius: 12,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<BadgeText
									style={{
										fontSize: 12,
										fontWeight: "bold",
									}}>
									💬 {unreadMessagesCount}
								</BadgeText>
							</Badge>
						)}
					</HStack>
				</Card>
			)}
		</Pressable>
	);
};

export default ApplyCard;
