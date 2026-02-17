import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import axios from "axios";
import Constants from "expo-constants";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";

import {
	BadgeCheck,
	Building2,
	Pencil,
	Stamp,
	Signature,
	QrCode,
	CreditCard,
	ChevronRight,
	FileText,
	Settings,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";

import LogoUploader from "@/components/LogoUploader";
import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const DashboardScreen = () => {
	const { accessToken, userCompany, user, hasSubscription } = useAuth();
	const { getById } = useDataContext();
	const { image } = useImage();
	const { isDark } = useTheme();

	const router = useRouter();

	const [company, setCompany] = useState(null);

	const loadData = async () => {
		const data = await getById("companies", user.id, `*`);
		setCompany(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	const ActionCard = ({ icon, title, subtitle, onPress, badgeText }) => (
		<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
			<Card
				style={{
					padding: 16,
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
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={icon}
								size='lg'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
						</Box>
						<VStack style={{ flex: 1 }} space='xs'>
							<Text
								size='md'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								{title}
							</Text>
							{subtitle && (
								<Text
									size='sm'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{subtitle}
								</Text>
							)}
						</VStack>
					</HStack>
					<HStack space='sm' style={{ alignItems: "center" }}>
						{badgeText && (
							<Badge size='sm' variant='solid' action='success'>
								<BadgeText>{badgeText}</BadgeText>
							</Badge>
						)}
						<Icon
							as={ChevronRight}
							size='lg'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
							}}
						/>
					</HStack>
				</HStack>
			</Card>
		</TouchableOpacity>
	);

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}
			showsVerticalScrollIndicator={false}>
			<Box style={{ padding: 20, paddingBottom: 40 }}>
				<VStack space='2xl'>
					{/* Header */}
					{/* <VStack space='md'>
						<Heading
							size='2xl'
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Tableau de bord
						</Heading>
						<Text
							size='md'
							style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
							Gérez votre entreprise et vos documents
						</Text>
					</VStack> */}

					{/* Company Info Card */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='lg'>
							{/* Logo Section - Centré et cliquable */}
							<VStack space='md' style={{ alignItems: "center" }}>
								<LogoUploader image={image} />
							</VStack>

							<Divider />

							<HStack
								style={{
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<VStack style={{ flex: 1 }} space='xs'>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{company?.name || "Mon entreprise"}
										</Text>
										{company?.isConfirmed && (
											<Badge
												size='sm'
												variant='solid'
												action='success'>
												<BadgeIcon
													as={BadgeCheck}
													className='mr-1'
												/>
												<BadgeText>Vérifié</BadgeText>
											</Badge>
										)}
									</HStack>
									{company?.siret && (
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											SIRET: {company.siret}
										</Text>
									)}
								</VStack>
							</HStack>

							{company?.description && (
								<>
									<Divider />
									<Text
										size='sm'
										style={{
											color: isDark
												? "#d1d5db"
												: "#374151",
										}}>
										{company.description}
									</Text>
								</>
							)}

							<Divider />

							{/* Subscription Status */}
							<TouchableOpacity
								onPress={() => router.push("/subscription")}
								activeOpacity={0.7}>
								<HStack
									style={{
										alignItems: "center",
										justifyContent: "space-between",
									}}>
									<HStack
										space='sm'
										style={{
											alignItems: "center",
											flex: 1,
										}}>
										<Text
											size='sm'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Statut d'abonnement
										</Text>
										<Badge
											size='md'
											variant='solid'
											action={
												hasSubscription
													? "success"
													: "warning"
											}>
											<BadgeText>
												{hasSubscription
													? "Abonné"
													: "Non abonné"}
											</BadgeText>
										</Badge>
									</HStack>
									<Icon
										as={ChevronRight}
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								</HStack>
							</TouchableOpacity>
						</VStack>
					</Card>

					{/* Actions Section */}
					<VStack space='md'>
						<Text
							size='lg'
							style={{
								fontWeight: "600",
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Actions rapides
						</Text>

						<ActionCard
							icon={Pencil}
							title="Modifier l'entreprise"
							subtitle='Mettre à jour les informations'
							onPress={() => {
								router.push({
									pathname: "/updatecompany",
									params: {
										companyName: company?.name,
										companySiret: company?.siret,
										companyDescription:
											company?.description,
									},
								});
							}}
						/>

						<ActionCard
							icon={Stamp}
							title='Tampon'
							subtitle="Gérer le tampon de l'entreprise"
							onPress={() => {
								router.push({
									pathname: "/stamp",
									params: {
										companyName: company?.name,
									},
								});
							}}
						/>

						<ActionCard
							icon={Signature}
							title='Signature'
							subtitle='Gérer votre signature'
							onPress={() => {
								router.push({
									pathname: "/signature",
									params: {
										signatureUrl: company?.signature_url,
										type: "companies",
									},
								});
							}}
						/>

						<ActionCard
							icon={QrCode}
							title='Scanner un profil'
							subtitle='Scanner un QR code WeSafe'
							onPress={() => {
								router.push({
									pathname: "/scanner",
								});
							}}
						/>

						<ActionCard
							icon={FileText}
							title='Vérification KBIS'
							subtitle='Télécharger votre extrait KBIS'
							onPress={() => {
								router.push({
									pathname: "/kbisdocumentverification",
								});
							}}
						/>

						<ActionCard
							icon={CreditCard}
							title='Acheter des crédits'
							subtitle='Recharger votre compte'
							onPress={() => {
								router.push({
									pathname: "/buycredits",
								});
							}}
						/>

						<ActionCard
							icon={Settings}
							title='Paramètres'
							subtitle="Paramètres de l'application"
							onPress={() => router.push("/settings")}
						/>
					</VStack>
				</VStack>
			</Box>
		</ScrollView>
	);
};

export default DashboardScreen;
