import React, { useState, useCallback, useLayoutEffect } from "react";
import { View, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { useRouter, useFocusEffect, Stack } from "expo-router";
import SvgQRCode from "react-native-qrcode-svg";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import AvatarUploader from "@/components/AvatarUploader";
import {
	IdCard,
	BookmarkIcon,
	Briefcase,
	User,
	FileText,
	Signature,
	Upload,
	ChevronRight,
	CheckIcon,
	QrCode,
	X,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useImage } from "@/context/ImageContext";
import { width } from "dom-helpers";

const AccountScreen = () => {
	const { user } = useAuth();
	const { getById } = useDataContext();
	const { isDark } = useTheme();
	const { unreadCount } = useNotifications();
	const { image } = useImage();
	const router = useRouter();

	const [profile, setProfile] = useState(null);
	const [showQRModal, setShowQRModal] = useState(false);

	const loadData = async () => {
		const data = await getById("profiles", user.id, `*`);
		setProfile(data);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	useLayoutEffect(() => {
		// Ne rien faire ici, le header est défini dans _layout.jsx
	}, []);

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

	const qrUrl = user?.id ? `supabaseapp://profile/${user.id}` : "";

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<TouchableOpacity
							onPress={() => setShowQRModal(true)}
							activeOpacity={0.7}>
							<Icon
								as={QrCode}
								size='xl'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
						</TouchableOpacity>
					),
				}}
			/>
			<Modal
				visible={showQRModal}
				transparent={true}
				animationType='fade'
				onRequestClose={() => setShowQRModal(false)}>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						justifyContent: "center",
						alignItems: "center",
					}}>
					<View
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 20,
							padding: 30,
							alignItems: "center",
							width: "85%",
							maxWidth: 400,
						}}>
						<TouchableOpacity
							onPress={() => setShowQRModal(false)}
							activeOpacity={0.7}
							style={{
								position: "absolute",
								top: 15,
								right: 15,
								zIndex: 10,
							}}>
							<Icon
								as={X}
								size='xl'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}
							/>
						</TouchableOpacity>
						<Text
							size='xl'
							style={{
								fontWeight: "700",
								color: isDark ? "#f3f4f6" : "#111827",
								marginBottom: 20,
							}}>
							Mon QR Code
						</Text>
						<View
							style={{
								backgroundColor: "#ffffff",
								padding: 20,
								borderRadius: 15,
							}}>
							{qrUrl && <SvgQRCode value={qrUrl} size={200} />}
						</View>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
								marginTop: 20,
								textAlign: "center",
							}}>
							Partagez ce code pour afficher votre profil
						</Text>
					</View>
				</View>
			</Modal>
			<Box
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ padding: 20 }}>
					<VStack space='2xl'>
						{/* Profile Header Card */}
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<VStack space='lg' style={{ alignItems: "center" }}>
								{/* Avatar Section - Centré et cliquable */}
								<VStack
									space='md'
									style={{
										alignItems: "center",
										justifyContent: "center",
										height: 120,
										width: 120,
										// backgroundColor: "pink",
									}}>
									<AvatarUploader image={image} />
								</VStack>

								<Divider />

								<HStack
									style={{
										alignItems: "center",
										justifyContent: "space-between",
									}}>
									<VStack style={{ flex: 1 }} space='xs'>
										<Text
											size='lg'
											style={{
												fontWeight: "600",
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											{profile?.firstname}{" "}
											{profile?.lastname}
										</Text>
										{profile?.email && (
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												{profile.email}
											</Text>
										)}
									</VStack>
								</HStack>

								{profile?.qualifications &&
									profile.qualifications.length > 0 && (
										<>
											<Divider />
											<HStack
												space='sm'
												style={{
													flexWrap: "wrap",
												}}>
												{profile.qualifications.map(
													(qual, index) => (
														<Badge
															key={index}
															size='sm'>
															<BadgeIcon
																as={IdCard}
																className='mr-1'
															/>
															<BadgeText>
																{qual}
															</BadgeText>
														</Badge>
													),
												)}
											</HStack>
										</>
									)}
							</VStack>
						</Card>

						{/* Navigation Cards */}
						<VStack space='lg'>
							<Text
								size='lg'
								style={{
									fontWeight: "600",
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Actions rapides
							</Text>

							<ActionCard
								icon={IdCard}
								title='Cartes professionnelles'
								subtitle='Gérez vos cartes pro'
								onPress={() => router.push("/procards")}
							/>

							<ActionCard
								icon={BookmarkIcon}
								title='Liste de souhaits'
								subtitle='Vos missions favorites'
								onPress={() => router.push("/wishlist")}
							/>

							<ActionCard
								icon={Briefcase}
								title='Candidatures'
								subtitle='Suivez vos candidatures'
								onPress={() => router.push("/applications")}
								badgeText={
									unreadCount > 0
										? unreadCount.toString()
										: null
								}
							/>

							<ActionCard
								icon={User}
								title='Informations personnelles'
								subtitle='Modifiez votre profil'
								onPress={() => router.push("/updateprofile")}
							/>

							<ActionCard
								icon={FileText}
								title='CV'
								subtitle='Gérez votre curriculum vitae'
								onPress={() => router.push("/curriculum")}
							/>

							<ActionCard
								icon={Signature}
								title='Signature'
								subtitle='Créez votre signature'
								onPress={() => router.push("/signature")}
								badgeText={profile?.signature_url ? "✓" : null}
							/>

							<ActionCard
								icon={Upload}
								title='Documents'
								subtitle="Documents d'identité et sécurité sociale"
								onPress={() => router.push("/documents")}
							/>
						</VStack>
					</VStack>
				</ScrollView>
			</Box>
		</>
	);
};

export default AccountScreen;
