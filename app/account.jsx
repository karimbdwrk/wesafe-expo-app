import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Image } from "@/components/ui/image";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionTitleText,
	AccordionContentText,
	AccordionIcon,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	ChevronUpIcon,
	ChevronDownIcon,
	ChevronRight,
} from "@/components/ui/icon";

import {
	IdCard,
	InfoIcon,
	CheckIcon,
	Signature,
	FileUserIcon,
	BookmarkIcon,
	Book,
	FileText,
	Heart,
	Briefcase,
	User,
	Edit,
	Upload,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";

import AvatarUploader from "@/components/AvatarUploader";
import FlipCardProfile from "@/components/FlipCardProfile";

const AccountScreen = () => {
	const { user } = useAuth();
	const { image } = useImage();
	const { getById } = useDataContext();
	const { isDark } = useTheme();

	const router = useRouter();

	const [profile, setProfile] = useState(null);

	const loadData = async () => {
		const data = await getById("profiles", user.id, `*`);
		setProfile(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack space='lg' style={{ padding: 20 }}>
				{/* Profile Card */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 20,
					}}>
					<VStack space='md'>
						<FlipCardProfile />
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								{profile?.firstname + " " + profile?.lastname}
							</Heading>
							<HStack
								space='sm'
								style={{
									flexWrap: "wrap",
									justifyContent: "center",
								}}>
								<Badge action='info' variant='solid'>
									<BadgeIcon as={IdCard} />
									<BadgeText>APS</BadgeText>
								</Badge>
								<Badge action='info' variant='solid'>
									<BadgeIcon as={IdCard} />
									<BadgeText>SSIAP1</BadgeText>
								</Badge>
							</HStack>
						</VStack>
					</VStack>
				</Card>

				{/* Quick Actions */}
				<VStack space='md'>
					<HStack space='md'>
						<TouchableOpacity
							style={{ flex: 1 }}
							onPress={() => router.push(`/procards`)}
							activeOpacity={0.7}>
							<Card
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									padding: 20,
									aspectRatio: 1,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<VStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#2563eb",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={IdCard}
											size={24}
											color='#ffffff'
										/>
									</Box>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
											textAlign: "center",
										}}>
										Cartes pro
									</Text>
								</VStack>
							</Card>
						</TouchableOpacity>

						<TouchableOpacity
							style={{ flex: 1 }}
							onPress={() => router.push(`/wishlist`)}
							activeOpacity={0.7}>
							<Card
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									padding: 20,
									aspectRatio: 1,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<VStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#64748b",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={BookmarkIcon}
											size={24}
											color='#ffffff'
										/>
									</Box>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
											textAlign: "center",
										}}>
										Wishlist
									</Text>
								</VStack>
							</Card>
						</TouchableOpacity>

						<TouchableOpacity
							style={{ flex: 1 }}
							onPress={() => router.push(`/applications`)}
							activeOpacity={0.7}>
							<Card
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#ffffff",
									borderRadius: 12,
									padding: 20,
									aspectRatio: 1,
									justifyContent: "center",
									alignItems: "center",
									position: "relative",
								}}>
								<Badge
									style={{
										position: "absolute",
										top: 8,
										right: 8,
										backgroundColor: "#ef4444",
										borderRadius: 12,
										minWidth: 24,
										height: 24,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<BadgeText
										style={{
											color: "#ffffff",
											fontSize: 12,
										}}>
										2
									</BadgeText>
								</Badge>
								<VStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Box
										style={{
											width: 48,
											height: 48,
											borderRadius: 24,
											backgroundColor: "#10b981",
											justifyContent: "center",
											alignItems: "center",
										}}>
										<Icon
											as={Briefcase}
											size={24}
											color='#ffffff'
										/>
									</Box>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
											fontWeight: "600",
											textAlign: "center",
										}}>
										Candidatures
									</Text>
								</VStack>
							</Card>
						</TouchableOpacity>
					</HStack>
				</VStack>

				{/* Accordion Sections */}
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						padding: 0,
						overflow: "hidden",
					}}>
					<Accordion
						size='md'
						variant='unfilled'
						type='single'
						isCollapsible={true}
						isDisabled={false}>
						<AccordionItem
							value='a'
							style={{ borderBottomWidth: 0 }}>
							<AccordionHeader
								style={{
									paddingHorizontal: 20,
									paddingVertical: 16,
								}}>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<HStack
												space='md'
												style={{
													width: "100%",
													alignItems: "center",
												}}>
												<Box
													style={{
														width: 40,
														height: 40,
														borderRadius: 20,
														backgroundColor: isDark
															? "#1f2937"
															: "#f3f4f6",
														justifyContent:
															"center",
														alignItems: "center",
													}}>
													<Icon
														as={User}
														size={20}
														color={
															isDark
																? "#9ca3af"
																: "#6b7280"
														}
													/>
												</Box>
												<VStack style={{ flex: 1 }}>
													<Heading
														size='sm'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Informations
													</Heading>
												</VStack>
												{profile?.signature_url && (
													<Badge
														action='success'
														size='sm'
														variant='solid'>
														<BadgeIcon
															as={CheckIcon}
														/>
														<BadgeText>
															Complété
														</BadgeText>
													</Badge>
												)}
												<Icon
													as={
														isExpanded
															? ChevronUpIcon
															: ChevronDownIcon
													}
													size={20}
													color={
														isDark
															? "#9ca3af"
															: "#6b7280"
													}
												/>
											</HStack>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent
								style={{
									paddingHorizontal: 20,
									paddingBottom: 20,
								}}>
								<VStack space='sm' style={{ marginBottom: 16 }}>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Genre
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Homme
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Date de naissance
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											02/01/1990
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											N° de sécurité sociale
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											1 90 01 92 345 678
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Département
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Hauts-de-Seine (92)
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Ville
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Gennevilliers
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Permis
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											B
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Véhiculé
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											Oui
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
											alignItems: "flex-start",
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
												flex: 1,
											}}>
											Langues parlées
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
												textAlign: "right",
												flex: 1,
											}}>
											Français, Anglais, Arabe, Espagnol
										</Text>
									</HStack>
								</VStack>
								<Button
									onPress={() => {
										router.push({
											pathname: "/updateprofile",
											params: {
												firstname: profile.firstname,
												lastname: profile.lastname,
											},
										});
									}}
									style={{
										width: "100%",
										backgroundColor: "#2563eb",
									}}>
									<ButtonIcon
										as={Edit}
										size={20}
										color='#ffffff'
									/>
									<ButtonText style={{ color: "#ffffff" }}>
										Modifier
									</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>
						<AccordionItem
							value='b'
							style={{ borderBottomWidth: 0 }}>
							<AccordionHeader
								style={{
									paddingHorizontal: 20,
									paddingVertical: 16,
								}}>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<HStack
												space='md'
												style={{
													width: "100%",
													alignItems: "center",
												}}>
												<Box
													style={{
														width: 40,
														height: 40,
														borderRadius: 20,
														backgroundColor: isDark
															? "#1f2937"
															: "#f3f4f6",
														justifyContent:
															"center",
														alignItems: "center",
													}}>
													<Icon
														as={FileText}
														size={20}
														color={
															isDark
																? "#9ca3af"
																: "#6b7280"
														}
													/>
												</Box>
												<VStack style={{ flex: 1 }}>
													<Heading
														size='sm'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Curriculum Vitae
													</Heading>
												</VStack>
												{profile?.signature_url && (
													<Badge
														action='success'
														size='sm'
														variant='solid'>
														<BadgeIcon
															as={CheckIcon}
														/>
														<BadgeText>
															Complété
														</BadgeText>
													</Badge>
												)}
												<Icon
													as={
														isExpanded
															? ChevronUpIcon
															: ChevronDownIcon
													}
													size={20}
													color={
														isDark
															? "#9ca3af"
															: "#6b7280"
													}
												/>
											</HStack>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent
								style={{
									paddingHorizontal: 20,
									paddingBottom: 20,
								}}>
								<VStack space='sm' style={{ marginBottom: 16 }}>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Experience 1
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											01/2015 - 09/2018
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Experience 2
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											01/2015 - 09/2018
										</Text>
									</HStack>
									<Divider
										style={{
											backgroundColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}
									/>
									<HStack
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
										}}>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#9ca3af"
													: "#6b7280",
												fontWeight: "600",
											}}>
											Experience 3
										</Text>
										<Text
											size='sm'
											style={{
												color: isDark
													? "#f3f4f6"
													: "#111827",
											}}>
											01/2015 - 09/2018
										</Text>
									</HStack>
								</VStack>
								<Button
									onPress={() => {
										router.push("/curriculum");
									}}
									style={{
										width: "100%",
										backgroundColor: "#2563eb",
									}}>
									<ButtonIcon
										as={FileText}
										size={20}
										color='#ffffff'
									/>
									<ButtonText style={{ color: "#ffffff" }}>
										Voir CV
									</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
						<Divider
							style={{
								backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
							}}
						/>
						<AccordionItem
							value='c'
							style={{ borderBottomWidth: 0 }}>
							<AccordionHeader
								style={{
									paddingHorizontal: 20,
									paddingVertical: 16,
								}}>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<HStack
												space='md'
												style={{
													width: "100%",
													alignItems: "center",
												}}>
												<Box
													style={{
														width: 40,
														height: 40,
														borderRadius: 20,
														backgroundColor: isDark
															? "#1f2937"
															: "#f3f4f6",
														justifyContent:
															"center",
														alignItems: "center",
													}}>
													<Icon
														as={Signature}
														size={20}
														color={
															isDark
																? "#9ca3af"
																: "#6b7280"
														}
													/>
												</Box>
												<VStack style={{ flex: 1 }}>
													<Heading
														size='sm'
														style={{
															color: isDark
																? "#f3f4f6"
																: "#111827",
														}}>
														Signature
													</Heading>
												</VStack>
												{profile?.signature_url && (
													<Badge
														action='success'
														size='sm'
														variant='solid'>
														<BadgeIcon
															as={CheckIcon}
														/>
														<BadgeText>
															Complété
														</BadgeText>
													</Badge>
												)}
												<Icon
													as={
														isExpanded
															? ChevronUpIcon
															: ChevronDownIcon
													}
													size={20}
													color={
														isDark
															? "#9ca3af"
															: "#6b7280"
													}
												/>
											</HStack>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent
								style={{
									paddingHorizontal: 20,
									paddingBottom: 20,
								}}>
								{profile?.signature_url && (
									<Box
										style={{
											alignItems: "center",
											padding: 20,
											backgroundColor: isDark
												? "#1f2937"
												: "#f9fafb",
											borderRadius: 8,
											marginBottom: 16,
										}}>
										<Image
											source={{
												uri: profile?.signature_url,
											}}
											size={"2xl"}
											resizeMode='contain'
											borderRadius={8}
											alt='profile signature'
										/>
									</Box>
								)}
								<Button
									onPress={() => {
										router.push({
											pathname: "/signature",
											params: {
												signatureUrl:
													profile.signature_url,
												type: "profiles",
											},
										});
									}}
									style={{
										width: "100%",
										backgroundColor: "#2563eb",
									}}>
									<ButtonIcon
										as={Signature}
										size={20}
										color='#ffffff'
									/>
									<ButtonText style={{ color: "#ffffff" }}>
										{profile?.signature_url
											? "Modifier"
											: "Signer"}
									</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</Card>

				{/* Upload Documents Button */}
				<Button
					onPress={() => router.push("/documents")}
					style={{
						backgroundColor: "#10b981",
					}}>
					<ButtonIcon as={Upload} size={20} color='#ffffff' />
					<ButtonText style={{ color: "#ffffff" }}>
						Télécharger mes documents
					</ButtonText>
				</Button>
			</VStack>
		</ScrollView>
	);
};

export default AccountScreen;
