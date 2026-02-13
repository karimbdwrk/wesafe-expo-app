import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { useTheme } from "@/components/ui/themed/theme-provider";
import {
	Briefcase,
	Clock,
	MessageCircle,
	CheckCircle,
	XCircle,
} from "lucide-react-native";

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

	const { isDark } = useTheme();

	const getStatusConfig = (status) => {
		switch (status) {
			case "rejected":
				return {
					color: "#ef4444",
					icon: XCircle,
					label: "Refusé",
				};
			case "accepted":
				return {
					color: "#10b981",
					icon: CheckCircle,
					label: "Accepté",
				};
			default:
				return {
					color: "#f59e0b",
					icon: Clock,
					label: "En attente",
				};
		}
	};

	const statusConfig = getStatusConfig(status);

	return (
		<TouchableOpacity
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
			}
			activeOpacity={0.7}>
			<Card
				style={{
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderRadius: 12,
					padding: 16,
				}}>
				<HStack space='md' style={{ alignItems: "flex-start" }}>
					{/* Icon Circle */}
					<Box
						style={{
							width: 48,
							height: 48,
							borderRadius: 24,
							backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Icon
							as={Briefcase}
							size={24}
							color={isDark ? "#9ca3af" : "#6b7280"}
						/>
					</Box>

					{/* Content */}
					<VStack style={{ flex: 1 }} space='xs'>
						<Heading
							size='md'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							{title}
						</Heading>
						{name && (
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								{name}
							</Text>
						)}

						{/* Badges */}
						<HStack
							space='sm'
							style={{ marginTop: 8, flexWrap: "wrap" }}>
							{/* Category Badge */}
							<Badge
								size='sm'
								variant='solid'
								style={{
									backgroundColor: "#6366f1",
								}}>
								<BadgeText style={{ color: "#ffffff" }}>
									{category}
								</BadgeText>
							</Badge>

							{/* Status Badge */}
							<Badge
								size='sm'
								variant='solid'
								style={{
									backgroundColor: statusConfig.color,
								}}>
								<BadgeIcon as={statusConfig.icon} size={12} />
								<BadgeText style={{ color: "#ffffff" }}>
									{statusConfig.label}
								</BadgeText>
							</Badge>

							{/* Unread Messages Badge */}
							{unreadMessagesCount > 0 && (
								<Badge
									size='sm'
									variant='solid'
									style={{
										backgroundColor: "#ef4444",
									}}>
									<BadgeIcon as={MessageCircle} size={12} />
									<BadgeText style={{ color: "#ffffff" }}>
										{unreadMessagesCount}
									</BadgeText>
								</Badge>
							)}
						</HStack>
					</VStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);
};

export default ApplyCard;
