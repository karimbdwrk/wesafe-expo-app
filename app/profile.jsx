import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	ActionsheetItem,
	ActionsheetItemText,
} from "@/components/ui/actionsheet";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Briefcase,
	Award,
	FileText,
	CheckCircle,
	Star,
	StarOff,
	IdCard,
	MessageSquare,
	MessageCircle,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ProfileScreen = () => {
	const { accessToken, signOut, user } = useAuth();
	const { getById, getAll, create, remove } = useDataContext();
	const { isDark } = useTheme();
	const { profile_id } = useLocalSearchParams();

	const [profile, setProfile] = useState(null);
	const [isAdded, setIsAdded] = useState(false);
	const [listUUID, setListUUID] = useState(null);
	const [showContactSheet, setShowContactSheet] = useState(false);

	const loadData = async () => {
		const data = await getById("profiles", profile_id, `*`);
		console.log("data profile :", data);
		setProfile(data);
	};

	const loadList = async () => {
		const { data, totalCount } = await getAll(
			"profilelist",
			"*",
			`&candidate_id=eq.${profile_id}&company_id=eq.${user.id}`,
			1,
			1,
			"created_at.desc",
		);
		console.log("total count :", totalCount, data);
		totalCount === 1 && setIsAdded(true);
		totalCount === 1 && setListUUID(data[0].id);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
			user && profile_id && loadList();
		}, []),
	);

	useEffect(() => {
		console.log("list profile uuid :", listUUID);
	}, [listUUID]);

	const handleToggle = () => {
		if (isAdded) {
			handleRemove();
		} else {
			handleAdd();
		}
	};

	const handleAdd = async () => {
		console.log("handle add in profile list ok !");
		try {
			const newProfile = await create("profilelist", {
				candidate_id: profile_id,
				company_id: user.id,
			});
			console.warn("new profile in list :", newProfile);
			setIsAdded(true);
			loadList();
		} catch (err) {
			console.error(
				"Error add in profile list:",
				err.response?.data || err.message,
			);
		}
	};

	const handleRemove = async () => {
		console.log("handle add in profile list ok !");
		try {
			const profil = await remove("profilelist", listUUID);
			console.log("remove from list :", profil);
			setIsAdded(false);
			// setListUUID(null);
			loadList();
		} catch (err) {
			console.error(
				"Error remove in profile list:",
				err.response?.data || err.message,
			);
		}
	};

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView style={{ flex: 1 }}>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 90 }}>
					{/* Header Card avec Avatar et Info */}
					<Card
						style={{
							padding: 24,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
							alignItems: "center",
						}}>
						<VStack
							space='lg'
							style={{ alignItems: "center", width: "100%" }}>
							{/* Avatar */}
							<Avatar size='2xl'>
								{profile?.avatar_url && (
									<AvatarImage
										source={{ uri: profile.avatar_url }}
									/>
								)}
								<AvatarFallbackText>
									{profile?.firstname?.[0]}
									{profile?.lastname?.[0]}
								</AvatarFallbackText>
							</Avatar>

							{/* Nom et Prénom */}
							<VStack space='xs' style={{ alignItems: "center" }}>
								<Heading
									size='2xl'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										textAlign: "center",
									}}>
									{profile?.firstname} {profile?.lastname}
								</Heading>
								{profile?.category && (
									<Text
										size='md'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
											textAlign: "center",
										}}>
										{profile?.category}
									</Text>
								)}
							</VStack>

							{/* Badges */}
							<HStack
								space='sm'
								style={{
									flexWrap: "wrap",
									justifyContent: "center",
								}}>
								<Badge size='md' variant='solid' action='info'>
									<BadgeIcon as={IdCard} />
									<BadgeText className='ml-1'>
										Carte Pro
									</BadgeText>
								</Badge>
								<Badge
									size='md'
									variant='solid'
									action='success'>
									<BadgeIcon as={CheckCircle} />
									<BadgeText className='ml-1'>
										Vérifié
									</BadgeText>
								</Badge>
							</HStack>

							{/* Bouton Favoris */}
							<Button
								onPress={handleToggle}
								action={isAdded ? "secondary" : "positive"}
								variant={isAdded ? "outline" : "solid"}
								style={{ width: "100%" }}>
								<ButtonIcon as={isAdded ? StarOff : Star} />
								<ButtonText>
									{isAdded
										? "Retirer des favoris"
										: "Ajouter aux favoris"}
								</ButtonText>
							</Button>

							{/* Bouton Contacter */}
							<Button
								onPress={() => setShowContactSheet(true)}
								action='primary'
								variant='solid'
								style={{ width: "100%" }}>
								<ButtonIcon as={MessageCircle} />
								<ButtonText>Contacter</ButtonText>
							</Button>
							{/* <Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Coordonnées
							</Heading> */}
							<Divider
								style={{
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
								}}
							/>

							{profile?.email && (
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: isDark
												? "#1f2937"
												: "#f3f4f6",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Mail}
											size='lg'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Email
										</Text>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{profile.email}
										</Text>
									</VStack>
								</HStack>
							)}

							{profile?.phone && (
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: isDark
												? "#1f2937"
												: "#f3f4f6",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Phone}
											size='lg'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Téléphone
										</Text>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{profile.phone}
										</Text>
									</VStack>
								</HStack>
							)}

							{profile?.city && (
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: isDark
												? "#1f2937"
												: "#f3f4f6",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={MapPin}
											size='lg'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Localisation
										</Text>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{profile.city}
										</Text>
									</VStack>
								</HStack>
							)}

							{profile?.birthdate && (
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: isDark
												? "#1f2937"
												: "#f3f4f6",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Calendar}
											size='lg'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Date de naissance
										</Text>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{new Date(
												profile.birthdate,
											).toLocaleDateString("fr-FR")}
										</Text>
									</VStack>
								</HStack>
							)}
						</VStack>
					</Card>

					{/* Expériences */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='md' style={{ alignItems: "center" }}>
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
										as={Briefcase}
										size='xl'
										style={{ color: "#2563eb" }}
									/>
								</Box>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										flex: 1,
									}}>
									Expériences professionnelles
								</Heading>
							</HStack>
							<Text
								size='md'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Les expériences professionnelles du candidat
								seront affichées ici.
							</Text>
						</VStack>
					</Card>

					{/* Certifications */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='md'>
							<HStack space='md' style={{ alignItems: "center" }}>
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
										as={Award}
										size='xl'
										style={{ color: "#16a34a" }}
									/>
								</Box>
								<Heading
									size='lg'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										flex: 1,
									}}>
									Certifications & Diplômes
								</Heading>
							</HStack>
							<VStack space='sm'>
								{profile?.ssiap1_document_url && (
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={CheckCircle}
											size='md'
											style={{ color: "#16a34a" }}
										/>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											SSIAP 1
										</Text>
									</HStack>
								)}
								{profile?.ssiap2_document_url && (
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={CheckCircle}
											size='md'
											style={{ color: "#16a34a" }}
										/>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											SSIAP 2
										</Text>
									</HStack>
								)}
								{profile?.ssiap3_document_url && (
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										<Icon
											as={CheckCircle}
											size='md'
											style={{ color: "#16a34a" }}
										/>
										<Text
											size='md'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											SSIAP 3
										</Text>
									</HStack>
								)}
								{!profile?.ssiap1_document_url &&
									!profile?.ssiap2_document_url &&
									!profile?.ssiap3_document_url && (
										<Text
											size='md'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Aucune certification SSIAP
											enregistrée
										</Text>
									)}
							</VStack>
						</VStack>
					</Card>
				</VStack>
			</ScrollView>

			{/* ActionSheet Contact */}
			<Actionsheet
				isOpen={showContactSheet}
				onClose={() => setShowContactSheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<VStack space='md' style={{ width: "100%", padding: 20 }}>
						<Heading
							size='lg'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
								marginBottom: 8,
							}}>
							Contacter {profile?.firstname}
						</Heading>

						{/* Bouton Appel */}
						<TouchableOpacity
							onPress={() => {
								setShowContactSheet(false);
								// Linking.openURL(`tel:${profile?.phone}`);
							}}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
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
											as={Phone}
											size='xl'
											style={{ color: "#16a34a" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Appeler
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Lancer un appel téléphonique
										</Text>
									</VStack>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Bouton SMS */}
						<TouchableOpacity
							onPress={() => {
								setShowContactSheet(false);
								// Linking.openURL(`sms:${profile?.phone}`);
							}}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
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
											as={MessageSquare}
											size='xl'
											style={{ color: "#2563eb" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Envoyer un SMS
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Ouvrir l'application SMS
										</Text>
									</VStack>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Bouton WhatsApp */}
						<TouchableOpacity
							onPress={() => {
								setShowContactSheet(false);
								// Linking.openURL(`whatsapp://send?phone=${profile?.phone}`);
							}}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
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
											as={MessageCircle}
											size='xl'
											style={{ color: "#25D366" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Contacter sur WhatsApp
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Ouvrir WhatsApp
										</Text>
									</VStack>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Bouton Email */}
						<TouchableOpacity
							onPress={() => {
								setShowContactSheet(false);
								// Linking.openURL(`mailto:${profile?.email}`);
							}}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 16,
									backgroundColor: isDark
										? "#1f2937"
										: "#f9fafb",
									borderRadius: 12,
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#e5e7eb",
								}}>
								<HStack
									space='md'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#fef3c7",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Mail}
											size='xl'
											style={{ color: "#f59e0b" }}
										/>
									</Box>
									<VStack style={{ flex: 1 }}>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Envoyer un email
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
											}}>
											Ouvrir l'application email
										</Text>
									</VStack>
								</HStack>
							</Card>
						</TouchableOpacity>
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
		</Box>
	);
};

export default ProfileScreen;
