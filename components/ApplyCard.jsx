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
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";

import {
	Briefcase,
	Clock,
	MessageCircle,
	CheckCircle,
	XCircle,
	FileText,
	IdCard,
	ChevronRight,
	MapPin,
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
	application,
	status,
}) => {
	const router = useRouter();
	const { user, accessToken, role } = useAuth();
	const { isDark } = useTheme();

	// États locaux pour les données real-time
	const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
	const [currentStatus, setCurrentStatus] = useState(status);
	const [candidateNotification, setCandidateNotification] = useState(
		application?.candidate_notification || false,
	);
	const [companyNotification, setCompanyNotification] = useState(
		application?.company_notification || false,
	);

	// Synchroniser avec les props si elles changent
	useEffect(() => {
		setCurrentStatus(status);
	}, [status, apply_id]);

	useEffect(() => {
		setCandidateNotification(Boolean(application?.candidate_notification));
		setCompanyNotification(Boolean(application?.company_notification));
	}, [
		application?.candidate_notification,
		application?.company_notification,
		apply_id,
	]);

	// Abonnement real-time pour les messages
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

		const supabase = createSupabaseClient(accessToken);
		const messagesChannel = supabase
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
			supabase.removeChannel(messagesChannel);
		};
	}, [user?.id, apply_id, accessToken]);

	// Obtenir la config du status actuel
	const statusConfig = STATUS_CONFIG[currentStatus] || {
		title: "En attente",
		action: "muted",
		icon: Clock,
	};

	// Déterminer si la carte doit être mise en évidence avec une bordure spéciale
	const hasNotification =
		(role === "candidat" && candidateNotification) ||
		(role === "pro" && companyNotification);

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
					borderRadius: 8,
					padding: 16,
					marginBottom: 12,
					borderWidth: 1,
					borderColor: hasNotification
						? "#3b82f6"
						: isDark
							? "#4b5563"
							: "#e5e7eb",
				}}>
				<HStack
					space='md'
					className='items-center justify-between mb-2'>
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

						<HStack space='md' className='items-center'>
							<Avatar size='md'>
								<AvatarFallbackText>
									{application?.companies?.name}
								</AvatarFallbackText>
								<AvatarImage
									source={{
										uri: application?.companies?.logo_url,
									}}
								/>
							</Avatar>
							<VStack>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{application?.companies?.name}
								</Heading>
								<HStack space='xs' className='items-center'>
									<MapPin size={12} />
									<Text size='sm'>
										{application?.jobs?.city}
									</Text>
								</HStack>
							</VStack>
						</HStack>

						{/* Info row with badges */}
						<HStack
							space='sm'
							style={{ alignItems: "center", flexWrap: "wrap" }}
							className='mt-2'>
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
					<Icon
						as={ChevronRight}
						size='lg'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}
					/>
				</HStack>
			</Card>
		</TouchableOpacity>
	);
};

export default ApplyCard;
