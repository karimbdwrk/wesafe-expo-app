import React, { useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
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
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const AccountScreen = () => {
	const { user } = useAuth();
	const { getById } = useDataContext();
	const { isDark } = useTheme();
	const router = useRouter();

	const [profile, setProfile] = useState(null);

	const loadData = async () => {
		const data = await getById("profiles", user.id, `*`);
		setProfile(data);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	return (
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
							padding: 24,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 16,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='lg' style={{ alignItems: "center" }}>
							{/* Avatar */}
							<View
								style={{
									width: 100,
									height: 100,
									borderRadius: 10,
									backgroundColor: isDark
										? "#4b5563"
										: "#e5e7eb",
									justifyContent: "center",
									alignItems: "center",
									overflow: "hidden",
								}}>
								{profile?.avatar_url ? (
									<Image
										source={{ uri: profile.avatar_url }}
										style={{
											width: 100,
											height: 100,
										}}
										resizeMode='cover'
									/>
								) : (
									<Icon
										as={User}
										size='xl'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}
									/>
								)}
							</View>

							{/* Profile Info */}
							<VStack space='sm' style={{ alignItems: "center" }}>
								<Heading
									size='xl'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										textAlign: "center",
									}}>
									{profile?.firstname} {profile?.lastname}
								</Heading>
								<Text
									size='md'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
										textAlign: "center",
									}}>
									{profile?.email}
								</Text>
							</VStack>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Badge>
									<BadgeIcon as={IdCard} className='mr-2' />
									<BadgeText>SSIAP1</BadgeText>
								</Badge>
								<Badge>
									<BadgeIcon as={IdCard} className='mr-2' />
									<BadgeText>APS</BadgeText>
								</Badge>
							</HStack>
						</VStack>
					</Card>

					{/* Navigation Cards */}
					<VStack space='lg'>
						{/* Cartes professionnelles */}
						<TouchableOpacity
							onPress={() => router.push("/procards")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
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
												as={IdCard}
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
												Cartes professionnelles
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Gérez vos cartes pro
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Liste de souhaits */}
						<TouchableOpacity
							onPress={() => router.push("/wishlist")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#f1f5f9",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={BookmarkIcon}
												size='xl'
												style={{ color: "#64748b" }}
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
												Liste de souhaits
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Vos missions favorites
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Candidatures */}
						<TouchableOpacity
							onPress={() => router.push("/applications")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
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
												as={Briefcase}
												size='xl'
												style={{ color: "#10b981" }}
											/>
										</Box>
										<VStack style={{ flex: 1 }} space='xs'>
											<HStack
												space='sm'
												style={{
													alignItems: "center",
												}}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Candidatures
												</Text>
												<Badge
													size='sm'
													variant='solid'
													action='info'>
													<BadgeText>2</BadgeText>
												</Badge>
											</HStack>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Suivez vos candidatures
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Informations personnelles */}
						<TouchableOpacity
							onPress={() => router.push("/updateprofile")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
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
												as={User}
												size='xl'
												style={{ color: "#f59e0b" }}
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
												Informations personnelles
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Modifiez votre profil
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* CV */}
						<TouchableOpacity
							onPress={() => router.push("/curriculum")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#e0e7ff",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={FileText}
												size='xl'
												style={{ color: "#6366f1" }}
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
												CV
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Gérez votre curriculum vitae
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Signature */}
						<TouchableOpacity
							onPress={() => router.push("/signature")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
										<Box
											style={{
												width: 48,
												height: 48,
												borderRadius: 24,
												backgroundColor: "#fce7f3",
												justifyContent: "center",
												alignItems: "center",
											}}>
											<Icon
												as={Signature}
												size='xl'
												style={{ color: "#ec4899" }}
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
												Signature
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Créez votre signature
											</Text>
										</VStack>
									</HStack>
									<HStack
										space='sm'
										style={{ alignItems: "center" }}>
										{profile?.signature_url && (
											<Badge
												size='sm'
												variant='solid'
												action='success'>
												<BadgeIcon as={CheckIcon} />
											</Badge>
										)}
										<Icon
											as={ChevronRight}
											size='xl'
											style={{
												color: isDark
													? "#d1d5db"
													: "#9ca3af",
											}}
										/>
									</HStack>
								</HStack>
							</Card>
						</TouchableOpacity>

						{/* Documents */}
						<TouchableOpacity
							onPress={() => router.push("/documents")}
							activeOpacity={0.7}>
							<Card
								style={{
									padding: 20,
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
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
										style={{
											flex: 1,
											alignItems: "center",
										}}>
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
												as={Upload}
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
												Documents
											</Text>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}>
												Documents d'identité et sécurité
												sociale
											</Text>
										</VStack>
									</HStack>
									<Icon
										as={ChevronRight}
										size='xl'
										style={{
											color: isDark
												? "#d1d5db"
												: "#9ca3af",
										}}
									/>
								</HStack>
							</Card>
						</TouchableOpacity>
					</VStack>
				</VStack>
			</ScrollView>
		</Box>
	);
};

export default AccountScreen;
