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
import { Divider } from "@/components/ui/divider";

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
	BadgeEuro,
} from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import { height, width } from "dom-helpers";

// Tableau des catégories
import { getCategoryLabel } from "@/constants/categories";

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
	contract_type,
	working_time,
	salary_hourly,
	salary_amount,
	salary_min,
	salary_max,
	salary_type,
	salary_monthly_fixed,
	salary_monthly_min,
	salary_monthly_max,
	salary_annual_fixed,
	salary_annual_min,
	salary_annual_max,
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

	const formatSalary = (salary_type) => {
		if (!salary_type) return "Non spécifié";

		switch (salary_type) {
			case "selon_profil":
				return "Selon profil";
			case "hourly":
				return salary_hourly ? `${salary_hourly}€/h` : "Non spécifié";
			case "monthly_fixed":
				return salary_monthly_fixed
					? `${salary_monthly_fixed}€/mois`
					: "Non spécifié";
			case "annual_fixed":
				return salary_annual_fixed
					? `${salary_annual_fixed}€/an`
					: "Non spécifié";
			case "monthly_range":
				return salary_monthly_min && salary_monthly_max
					? `${salary_monthly_min}€ - ${salary_monthly_max}€/mois`
					: "Non spécifié";
			case "annual_range":
				return salary_annual_min && salary_annual_max
					? `${salary_annual_min}€ - ${salary_annual_max}€/an`
					: "Non spécifié";
			default:
				return "Non spécifié";
		}
	};

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
				<VStack
					style={{
						position: "absolute",
						top: 16,
						right: 16,
						zIndex: 10,
					}}>
					{/* Unread Messages */}
					{unreadMessagesCount > 0 && (
						<Badge size='sm' variant='solid' action='error'>
							<BadgeIcon as={MessageCircle} className='mr-2' />
							<BadgeText>{unreadMessagesCount}</BadgeText>
						</Badge>
					)}
				</VStack>
				<HStack
					space='md'
					className='items-center justify-between mb-2'>
					<VStack space='md' style={{ width: "90%" }}>
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
							{role === "pro" && (
								<HStack space='xs' className='items-center'>
									<MapPin size={12} />
									<Text size='sm'>
										{application?.jobs?.city}
									</Text>
								</HStack>
							)}
							{/* {name && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{name}
								</Text>
							)} */}
						</VStack>

						{/* {role === "candidat" ? (
							<HStack space='md' className='items-center'>
								<Avatar size='md'>
									<AvatarFallbackText>
										{application?.companies?.name}
									</AvatarFallbackText>
									<AvatarImage
										source={{
											uri: application?.companies
												?.logo_url,
										}}
									/>
								</Avatar>
								<VStack>
									<Heading
										size='md'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
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
						) : (
							<HStack space='xs' className='items-center'>
								<MapPin size={12} />
								<Text size='sm'>{application?.jobs?.city}</Text>
							</HStack>
						)} */}

						<HStack space='md' className='items-center'>
							<Avatar size='md'>
								<AvatarFallbackText>
									{role === "candidat"
										? application?.companies?.name
										: application?.profiles?.firstname +
											" " +
											application?.profiles?.lastname}
								</AvatarFallbackText>
								<AvatarImage
									source={{
										uri:
											role === "candidat"
												? application?.companies
														?.logo_url
												: application?.profiles
														?.avatar_url,
									}}
								/>
							</Avatar>
							<VStack>
								<Heading
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{role === "candidat"
										? application?.companies?.name
										: application?.profiles?.firstname +
											" " +
											application?.profiles?.lastname}
								</Heading>
								{/* <HStack space='xs' className='items-center'>
									<MapPin size={12} />
									<Text size='sm'>
										{application?.jobs?.city}
									</Text>
								</HStack> */}
							</VStack>
						</HStack>

						<VStack>
							{/* Category */}
							<HStack>
								<Badge size='sm' variant='solid' action='muted'>
									<BadgeIcon as={IdCard} className='mr-2' />
									<BadgeText>
										{getCategoryLabel(category)}
									</BadgeText>
								</Badge>
							</HStack>
							{/* Info row with badges */}
							<HStack
								space='sm'
								style={{
									alignItems: "center",
									flexWrap: "wrap",
								}}
								className='mt-2'>
								{salary_type && (
									<Badge
										size='sm'
										variant='solid'
										action='warning'>
										<BadgeIcon
											as={BadgeEuro}
											className='mr-2'
										/>
										<BadgeText>
											{formatSalary(salary_type)}
										</BadgeText>
									</Badge>
								)}
							</HStack>
						</VStack>
						<Divider />
						<HStack>
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
						</HStack>
					</VStack>
					<VStack
						style={{
							alignItems: "center",
							width: "10%",
							justifyContent: "center",
						}}>
						<Icon
							as={ChevronRight}
							size='lg'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}
						/>
					</VStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);
};

export default ApplyCard;
