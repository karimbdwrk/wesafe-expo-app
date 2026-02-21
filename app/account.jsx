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
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";
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
	Calendar,
	MapPin,
	Shield,
	Car,
	Languages,
	Ruler,
	GraduationCap,
	Settings,
	LogOut,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useImage } from "@/context/ImageContext";
import { width } from "dom-helpers";

const AccountScreen = () => {
	const { user, signOut } = useAuth();
	const { getById, getAll } = useDataContext();
	const { isDark } = useTheme();
	const { unreadCount } = useNotifications();
	const { image } = useImage();
	const router = useRouter();

	const [profile, setProfile] = useState(null);
	const [procards, setProcards] = useState([]);
	const [showQRModal, setShowQRModal] = useState(false);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);

	const loadData = async () => {
		const data = await getById("profiles", user.id, `*`);
		setProfile(data);
	};

	const loadProcards = async () => {
		try {
			const { data } = await getAll(
				"procards",
				"*",
				`&profile_id=eq.${user.id}&isDeleted=eq.false`,
				1,
				100,
				"created_at.desc",
			);
			setProcards(data || []);
		} catch (error) {
			console.error("Error loading procards:", error);
			setProcards([]);
		}
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
			loadProcards();
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
				<TouchableOpacity
					style={{
						flex: 1,
						backgroundColor: "rgba(0, 0, 0, 0.75)",
						justifyContent: "center",
						alignItems: "center",
					}}
					activeOpacity={1}
					onPress={() => setShowQRModal(false)}>
					<TouchableOpacity
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 20,
							padding: 30,
							alignItems: "center",
							width: "85%",
							maxWidth: 400,
						}}
						activeOpacity={1}>
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
							{qrUrl && (
								<SvgQRCode
									value={qrUrl}
									size={200}
									logo={require("@/assets/images/logo-wesafe-v2.png")}
									logoSize={40}
									logoBackgroundColor='#ffffff'
									logoBorderRadius={8}
								/>
							)}
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
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
			<Box
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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

								<Divider />

								{/* Informations personnelles */}
								<VStack space='md' style={{ width: "100%" }}>
									{profile?.gender && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={User}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{profile.gender === "male"
													? "Homme"
													: profile.gender ===
														  "female"
														? "Femme"
														: "Autre"}
											</Text>
										</HStack>
									)}

									{profile?.birthday && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Calendar}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{new Date(
													profile.birthday,
												).toLocaleDateString("fr-FR")}
											</Text>
										</HStack>
									)}

									{(profile?.height || profile?.weight) && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Ruler}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{profile?.height &&
													`${profile.height} cm`}
												{profile?.height &&
													profile?.weight &&
													" • "}
												{profile?.weight &&
													`${profile.weight} kg`}
											</Text>
										</HStack>
									)}

									{(profile?.city ||
										profile?.department ||
										profile?.region) && (
										<HStack
											space='sm'
											style={{
												alignItems: "flex-start",
											}}>
											<Icon
												as={MapPin}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													marginTop: 2,
												}}
											/>
											<VStack style={{ flex: 1 }}>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#d1d5db"
															: "#374151",
													}}>
													{[
														profile?.postcode,
														profile?.city,
													]
														.filter(Boolean)
														.join(" ")}
												</Text>
												{(profile?.department ||
													profile?.region) && (
													<Text
														size='xs'
														style={{
															color: isDark
																? "#9ca3af"
																: "#6b7280",
														}}>
														{[
															profile?.department,
															profile?.region,
														]
															.filter(Boolean)
															.join(", ")}
													</Text>
												)}
											</VStack>
										</HStack>
									)}

									{profile?.former_soldier && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Shield}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												Ancien militaire
											</Text>
										</HStack>
									)}

									{profile?.driving_licenses && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Car}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												Permis{" "}
												{profile.driving_licenses}
											</Text>
										</HStack>
									)}

									{profile?.languages && (
										<HStack
											space='sm'
											style={{ alignItems: "center" }}>
											<Icon
												as={Languages}
												size='sm'
												style={{
													color: isDark
														? "#9ca3af"
														: "#6b7280",
												}}
											/>
											<Text
												size='sm'
												style={{
													color: isDark
														? "#d1d5db"
														: "#374151",
												}}>
												{profile.languages}
											</Text>
										</HStack>
									)}
								</VStack>

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

								{/* Cartes professionnelles */}
								{procards && procards.length > 0 && (
									<>
										<Divider />
										<VStack
											space='xs'
											style={{ width: "100%" }}>
											{/* <Text
												size='sm'
												style={{
													fontWeight: "600",
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												Cartes professionnelles
											</Text> */}
											<HStack
												space='sm'
												style={{
													flexWrap: "wrap",
													justifyContent:
														"flex-start",
													width: "100%",
												}}>
												{profile?.ssiap1_verification_status ===
													"verified" && (
													<Badge
														size='sm'
														variant='solid'
														action='success'>
														<BadgeIcon
															as={GraduationCap}
															className='mr-1'
														/>
														<BadgeText>
															SSIAP 1
														</BadgeText>
													</Badge>
												)}
												{profile?.ssiap2_verification_status ===
													"verified" && (
													<Badge
														size='sm'
														variant='solid'
														action='success'>
														<BadgeIcon
															as={GraduationCap}
															className='mr-1'
														/>
														<BadgeText>
															SSIAP 2
														</BadgeText>
													</Badge>
												)}
												{profile?.ssiap3_verification_status ===
													"verified" && (
													<Badge
														size='sm'
														variant='solid'
														action='success'>
														<BadgeIcon
															as={GraduationCap}
															className='mr-1'
														/>
														<BadgeText>
															SSIAP 3
														</BadgeText>
													</Badge>
												)}
												{procards
													.filter((card) => {
														const validityDate =
															new Date(
																card.validity_date,
															);
														const isExpired =
															validityDate <
															new Date();
														return (
															card.status ===
																"verified" &&
															!isExpired
														);
													})
													.map((card) => {
														return (
															<Badge
																key={card.id}
																size='sm'
																variant='solid'
																action='success'>
																<BadgeIcon
																	as={IdCard}
																	className='mr-1'
																/>
																<BadgeText>
																	{
																		card.category
																	}
																</BadgeText>
															</Badge>
														);
													})}
											</HStack>
										</VStack>
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
								title='Documents professionnelles'
								subtitle='Cartes professionnels, diplômes, attestations...'
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
								onPress={() => router.push("/curriculumvitae")}
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

							<ActionCard
								icon={Settings}
								title='Paramètres'
								subtitle="Paramètres de l'application"
								onPress={() => router.push("/settings")}
							/>
							<Divider />
							<Button
								action='negative'
								onPress={() => setShowLogoutDialog(true)}
								style={{ marginTop: 8 }}>
								<ButtonIcon as={LogOut} />
								<ButtonText>Déconnexion</ButtonText>
							</Button>
						</VStack>
					</VStack>
				</ScrollView>

				{/* Modal de confirmation de déconnexion */}
				<AlertDialog
					isOpen={showLogoutDialog}
					onClose={() => setShowLogoutDialog(false)}>
					<AlertDialogBackdrop />
					<AlertDialogContent
						style={{
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							padding: 24,
						}}>
						<AlertDialogHeader>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Déconnexion
							</Heading>
						</AlertDialogHeader>
						<AlertDialogBody>
							<Text
								style={{
									color: isDark ? "#d1d5db" : "#4b5563",
									marginTop: 8,
								}}>
								Êtes-vous sûr de vouloir vous déconnecter ?
							</Text>
						</AlertDialogBody>
						<AlertDialogFooter style={{ marginTop: 24 }}>
							<HStack space='md' style={{ width: "100%" }}>
								<Button
									variant='outline'
									action='secondary'
									onPress={() => setShowLogoutDialog(false)}
									style={{ flex: 1 }}>
									<ButtonText>Annuler</ButtonText>
								</Button>
								<Button
									action='negative'
									onPress={() => {
										setShowLogoutDialog(false);
										signOut();
									}}
									style={{ flex: 1 }}>
									<ButtonText>Déconnexion</ButtonText>
								</Button>
							</HStack>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Box>
		</>
	);
};

export default AccountScreen;
