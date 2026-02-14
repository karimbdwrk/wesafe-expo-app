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

import {
	Briefcase,
	Clock,
	MessageCircle,
	CheckCircle,
	XCircle,
	FileText,
	IdCard,
} from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";

const STATUS_ORDER = [
	"applied",
	"selected",
	"contract_sent",
	"contract_signed_candidate",
	"contract_signed_pro",
];

const STATUS_CONFIG = {
	applied: {
		title: "Candidature envoyée",
		action: "success",
		icon: CheckCircle,
	},
	selected: {
		title: "Profil sélectionné",
		action: "info",
		icon: CheckCircle,
	},
	contract_sent: {
		title: "Contrat envoyé",
		action: "warning",
		icon: FileText,
	},
	contract_signed_candidate: {
		title: "Contrat signé",
		action: "success",
		icon: CheckCircle,
	},
	contract_signed_pro: {
		title: "Contrat finalisé",
		action: "success",
		icon: CheckCircle,
		isFinal: true,
	},
	rejected: {
		title: "Candidature refusée",
		action: "error",
		icon: XCircle,
		isFinal: true,
	},
};

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

	// Obtenir la config du status actuel
	const statusConfig = STATUS_CONFIG[status] || {
		title: "En attente",
		action: "muted",
		icon: Clock,
	};

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
					borderRadius: 16,
					padding: 16,
					marginBottom: 12,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<VStack space='md'>
					{/* Header with title and company */}
					<VStack space='xs'>
						<Heading
							size='lg'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
								lineHeight: 24,
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
					</VStack>

					{/* Info row with badges */}
					<HStack
						space='sm'
						style={{ alignItems: "center", flexWrap: "wrap" }}>
						{/* Category */}
						<Badge size='sm' variant='solid' action='muted'>
							<BadgeIcon as={IdCard} className='mr-2' />
							<BadgeText>{category}</BadgeText>
						</Badge>

						{/* Status */}
						<Badge
							size='sm'
							variant='solid'
							action={statusConfig.action}>
							<BadgeIcon
								as={statusConfig.icon}
								className='mr-2'
							/>
							<BadgeText>{statusConfig.title}</BadgeText>
						</Badge>

						{/* Unread Messages */}
						{unreadMessagesCount > 0 && (
							<Badge size='sm' variant='solid' action='error'>
								<BadgeIcon
									as={MessageCircle}
									className='mr-2'
								/>
								<BadgeText>{unreadMessagesCount}</BadgeText>
							</Badge>
						)}
					</HStack>
				</VStack>
			</Card>
		</TouchableOpacity>
	);
};

export default ApplyCard;
