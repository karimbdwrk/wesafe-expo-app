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
import Colors from "@/constants/Colors";

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
				backgroundColor: isDark
					? Colors.dark.background
					: Colors.light.background,
				padding: 20,
			}}>
			<VStack space='2xl'>
				{/* Header */}
				<VStack space='md'>
					{/* <Heading
						size='2xl'
						style={{
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
						}}>
						Mes documents
					</Heading> */}
					<Text
						size='md'
						style={{
							color: isDark
								? Colors.dark.muted
								: Colors.light.muted,
						}}>
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
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
											backgroundColor: isDark
												? Colors.dark.tint20
												: Colors.light.tint20,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={CreditCard}
											size='xl'
											style={{
												color: isDark
													? Colors.dark.tint
													: Colors.light.tint,
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											Document d'identité
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
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
												? Colors.dark.muted
												: Colors.light.muted,
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
								backgroundColor: isDark
									? Colors.dark.cardBackground
									: Colors.light.cardBackground,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark
									? Colors.dark.border
									: Colors.light.border,
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
											backgroundColor: isDark
												? Colors.dark.success20
												: Colors.light.success20,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={FileText}
											size='xl'
											style={{
												color: isDark
													? Colors.dark.success
													: Colors.light.success,
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? Colors.dark.text
													: Colors.light.text,
											}}>
											Sécurité sociale
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? Colors.dark.muted
													: Colors.light.muted,
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
												? Colors.dark.muted
												: Colors.light.muted,
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
