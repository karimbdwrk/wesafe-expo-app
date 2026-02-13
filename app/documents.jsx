import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import {
	CheckCircle,
	Clock,
	CreditCard,
	FileText,
	ChevronRight,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const Documents = () => {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { isDark } = useTheme();
	const router = useRouter();

	const [socialSecurityStatus, setSocialSecurityStatus] = useState(null);
	const [idStatus, setIdStatus] = useState(null);

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		console.log("User profile updated:", userProfile);
		setSocialSecurityStatus(
			userProfile?.social_security_verification_status || null,
		);
		setIdStatus(userProfile?.id_verification_status || null);
	}, [userProfile]);

	const getStatusBadge = (status) => {
		if (!status) return null;

		const statusConfig = {
			verified: {
				action: "success",
				icon: CheckCircle,
				label: "Vérifié",
			},
			pending: {
				action: "warning",
				icon: Clock,
				label: "En attente",
			},
		};

		const config = statusConfig[status];
		if (!config) return null;

		return (
			<Badge size='md' variant='solid' action={config.action}>
				<BadgeIcon as={config.icon} />
				<BadgeText className='ml-1'>{config.label}</BadgeText>
			</Badge>
		);
	};

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				padding: 20,
			}}>
			<VStack space='2xl'>
				{/* Header */}
				<VStack space='md'>
					<Heading
						size='2xl'
						style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
						Mes documents
					</Heading>
					<Text
						size='md'
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
						Gérez vos documents d'identité et de sécurité sociale
					</Text>
				</VStack>

				{/* Documents Cards */}
				<VStack space='lg'>
					{/* ID Document Card */}
					<TouchableOpacity
						onPress={() => router.push("/iddocumentverification")}
						activeOpacity={0.7}>
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<HStack
									space='md'
									style={{ flex: 1, alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#dbeafe",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={CreditCard}
											size='xl'
											style={{ color: "#2563eb" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Document d'identité
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Passeport ou carte d'identité
										</Text>
									</VStack>
								</HStack>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									{getStatusBadge(idStatus)}
									<Icon
										as={ChevronRight}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</HStack>
						</Card>
					</TouchableOpacity>

					{/* Social Security Document Card */}
					<TouchableOpacity
						onPress={() =>
							router.push("/socialsecuritydocumentverification")
						}
						activeOpacity={0.7}>
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<HStack
									space='md'
									style={{ flex: 1, alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#dcfce7",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={FileText}
											size='xl'
											style={{ color: "#16a34a" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Sécurité sociale
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Carte Vitale ou attestation
										</Text>
									</VStack>
								</HStack>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									{getStatusBadge(socialSecurityStatus)}
									<Icon
										as={ChevronRight}
										size='lg'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</HStack>
						</Card>
					</TouchableOpacity>
				</VStack>
			</VStack>
		</Box>
	);
};

export default Documents;
