import React, { useState } from "react";
import { ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import {
	Bell,
	Moon,
	Sun,
	Globe,
	Lock,
	HelpCircle,
	LogOut,
	ChevronRight,
	User,
	Shield,
	Smartphone,
	Mail,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const Settings = () => {
	const router = useRouter();
	const { user, logout } = useAuth();
	const { colorMode, setTheme, isDark } = useTheme();
	const [notifications, setNotifications] = useState(true);
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [twoFactor, setTwoFactor] = useState(false);

	const handleThemeToggle = (value) => {
		setTheme(value ? "dark" : "light");
	};

	const handleLogout = async () => {
		await logout();
		router.replace("/connexion");
	};

	const SettingItem = ({
		icon,
		title,
		subtitle,
		onPress,
		showChevron = true,
	}) => (
		<>
			<Button
				variant='link'
				onPress={onPress}
				style={{
					justifyContent: "flex-start",
					paddingVertical: 16,
					paddingHorizontal: 0,
				}}>
				<HStack space='md' style={{ alignItems: "center", flex: 1 }}>
					<Icon as={icon} size='lg' style={{ color: "#2563eb" }} />
					<VStack style={{ flex: 1 }}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 16,
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							{title}
						</Text>
						{subtitle && (
							<Text
								style={{
									fontSize: 14,
									color: isDark ? "#9ca3af" : "#6b7280",
									marginTop: 2,
								}}>
								{subtitle}
							</Text>
						)}
					</VStack>
					{showChevron && (
						<Icon
							as={ChevronRight}
							size='lg'
							style={{ color: "#9ca3af" }}
						/>
					)}
				</HStack>
			</Button>
			<Divider />
		</>
	);

	const SettingToggle = ({ icon, title, subtitle, value, onValueChange }) => (
		<>
			<HStack
				space='md'
				style={{
					alignItems: "center",
					paddingVertical: 16,
				}}>
				<Icon as={icon} size='lg' style={{ color: "#2563eb" }} />
				<VStack style={{ flex: 1 }}>
					<Text
						style={{
							fontWeight: "600",
							fontSize: 16,
							color: isDark ? "#f3f4f6" : "#111827",
						}}>
						{title}
					</Text>
					{subtitle && (
						<Text
							style={{
								fontSize: 14,
								color: isDark ? "#9ca3af" : "#6b7280",
								marginTop: 2,
							}}>
							{subtitle}
						</Text>
					)}
				</VStack>
				<Switch value={value} onValueChange={onValueChange} size='md' />
			</HStack>
			<Divider />
		</>
	);

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack style={{ padding: 16, gap: 24, paddingBottom: 100 }}>
				{/* Header */}
				{/* <VStack style={{ gap: 8, marginTop: 16 }}>
					<Heading size='2xl'>Paramètres</Heading>
					<Text style={{ color: "#6b7280" }}>
						Gérez vos préférences et votre compte
					</Text>
				</VStack> */}

				{/* Compte */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<VStack>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color: isDark ? "#9ca3af" : "#6b7280",
								marginBottom: 8,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}>
							Compte
						</Text>
						<SettingItem
							icon={User}
							title='Profil'
							subtitle='Modifier vos informations personnelles'
							onPress={() => router.push("/updateprofile")}
						/>
						<SettingItem
							icon={Mail}
							title='Email'
							subtitle={user?.email}
							onPress={() => {}}
						/>
						<SettingItem
							icon={Lock}
							title='Mot de passe'
							subtitle='Changer votre mot de passe'
							onPress={() => {}}
						/>
					</VStack>
				</Card>

				{/* Apparence */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<VStack>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color: isDark ? "#9ca3af" : "#6b7280",
								marginBottom: 8,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}>
							Apparence
						</Text>
						<SettingToggle
							icon={isDark ? Moon : Sun}
							title='Mode sombre'
							subtitle='Activer le thème sombre'
							value={isDark}
							onValueChange={handleThemeToggle}
						/>
					</VStack>
				</Card>

				{/* Notifications */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<VStack>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color: isDark ? "#9ca3af" : "#6b7280",
								marginBottom: 8,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}>
							Notifications
						</Text>
						<SettingToggle
							icon={Bell}
							title='Notifications push'
							subtitle='Recevoir des notifications sur votre appareil'
							value={notifications}
							onValueChange={setNotifications}
						/>
						<SettingToggle
							icon={Mail}
							title='Notifications email'
							subtitle='Recevoir des emails de notification'
							value={emailNotifications}
							onValueChange={setEmailNotifications}
						/>
					</VStack>
				</Card>

				{/* Sécurité */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<VStack>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color: isDark ? "#9ca3af" : "#6b7280",
								marginBottom: 8,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}>
							Sécurité
						</Text>
						<SettingToggle
							icon={Shield}
							title='Authentification à deux facteurs'
							subtitle='Sécurisez votre compte avec 2FA'
							value={twoFactor}
							onValueChange={setTwoFactor}
						/>
						<SettingItem
							icon={Smartphone}
							title='Appareils connectés'
							subtitle='Gérer vos sessions actives'
							onPress={() => {}}
						/>
					</VStack>
				</Card>

				{/* Autres */}
				<Card
					style={{
						padding: 16,
						backgroundColor: isDark ? "#374151" : "#ffffff",
					}}>
					<VStack>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color: isDark ? "#9ca3af" : "#6b7280",
								marginBottom: 8,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}>
							Aide & Support
						</Text>
						<SettingItem
							icon={HelpCircle}
							title="Centre d'aide"
							subtitle='FAQ et documentation'
							onPress={() => {}}
						/>
						<SettingItem
							icon={Globe}
							title='Langue'
							subtitle='Français'
							onPress={() => {}}
						/>
					</VStack>
				</Card>

				{/* Déconnexion */}
				<Button
					action='negative'
					onPress={handleLogout}
					style={{ marginTop: 8 }}>
					<ButtonIcon as={LogOut} />
					<ButtonText>Déconnexion</ButtonText>
				</Button>

				<Text
					style={{
						textAlign: "center",
						color: "#9ca3af",
						fontSize: 12,
						marginTop: 16,
					}}>
					Version 1.0.0
				</Text>
			</VStack>
		</ScrollView>
	);
};

export default Settings;
