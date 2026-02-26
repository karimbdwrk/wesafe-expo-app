import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
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
	Trash2,
	AlertTriangle,
} from "lucide-react-native";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useDataContext } from "@/context/DataContext";

const Settings = () => {
	const { user, role, accessToken, signOut } = useAuth();
	const { colorMode, setTheme, isDark } = useTheme();
	const { update } = useDataContext();
	const toast = useToast();

	const showToast = (message) => {
		toast.show({
			placement: "top",
			render: ({ id }) => (
				<Toast nativeID={id} action='success' variant='solid'>
					<ToastTitle>{message}</ToastTitle>
				</Toast>
			),
		});
	};

	const router = useRouter();

	const [notifications, setNotifications] = useState(true);
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [twoFactor, setTwoFactor] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Charger les préférences depuis Supabase
	const loadNotifPrefs = useCallback(async () => {
		if (!user?.id || !accessToken) return;
		try {
			const { createSupabaseClient } = await import("@/lib/supabase");
			const supabase = createSupabaseClient(accessToken);
			const table = role === "pro" ? "companies" : "profiles";
			const { data, error } = await supabase
				.from(table)
				.select("push_notifications, email_notifications")
				.eq("id", user.id)
				.single();
			if (error || !data) return;
			setNotifications(data.push_notifications ?? true);
			setEmailNotifications(data.email_notifications ?? true);
		} catch (e) {
			console.error("loadNotifPrefs error:", e);
		}
	}, [user?.id, role, accessToken]);

	useEffect(() => {
		loadNotifPrefs();
	}, [loadNotifPrefs]);

	// Sauvegarder via le DataContext
	const saveNotifPref = useCallback(
		(field, value) => {
			if (!user?.id) return;
			const table = role === "pro" ? "companies" : "profiles";
			update(table, user.id, { [field]: value });
		},
		[user?.id, role, update],
	);

	const handlePushToggle = (value) => {
		setNotifications(value);
		saveNotifPref("push_notifications", value);
		showToast(
			value
				? "Notifications push activées"
				: "Notifications push désactivées",
		);
	};

	const handleEmailToggle = (value) => {
		setEmailNotifications(value);
		saveNotifPref("email_notifications", value);
		showToast(
			value
				? "Notifications email activées"
				: "Notifications email désactivées",
		);
	};

	const handleThemeToggle = (value) => {
		setTheme(value ? "dark" : "light");
	};

	const handleLogout = async () => {
		await signOut();
		router.replace("/connexion");
	};

	const handleDeleteAccount = async () => {
		if (!user?.id) return;
		setIsDeleting(true);
		try {
			// L'archivage ET l'email sont gérés côté serveur (bypass RLS)
			const res = await fetch(
				`https://hzvbylhdptwgblpdondm.supabase.co/functions/v1/delete-account-notification`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						email: user.email,
						role,
						userId: user.id,
					}),
				},
			);

			if (!res.ok) {
				const err = await res.text();
				console.error("Edge function error:", err);
				setIsDeleting(false);
				return;
			}

			setShowDeleteDialog(false);
			await signOut();
			router.replace("/connexion");
		} catch (e) {
			console.error("Delete account error:", e);
			setIsDeleting(false);
		}
	};

	const SettingItem = ({
		icon,
		title,
		subtitle,
		onPress,
		showChevron = true,
	}) => (
		<>
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				<HStack
					space='md'
					style={{
						alignItems: "center",
						paddingVertical: 16,
					}}>
					<Icon
						as={icon}
						size='lg'
						style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
					/>
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
							style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
						/>
					)}
				</HStack>
			</TouchableOpacity>
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
				{/* <Card
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
				</Card> */}

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
							onValueChange={handlePushToggle}
						/>
						<SettingToggle
							icon={Mail}
							title='Notifications email'
							subtitle='Recevoir des emails de notification'
							value={emailNotifications}
							onValueChange={handleEmailToggle}
						/>
					</VStack>
				</Card>

				{/* Sécurité */}
				{/* <Card
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
				</Card> */}

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
							onPress={() => {
								router.push("/faq");
							}}
						/>
						<SettingItem
							icon={Globe}
							title='Langue'
							subtitle='Français'
							onPress={() => {}}
						/>
					</VStack>
				</Card>
				<Divider />
				<Button
					action='negative'
					variant='link'
					style={{ marginTop: 8 }}
					onPress={() => setShowDeleteDialog(true)}>
					<ButtonIcon as={Trash2} />
					<ButtonText>Supprimer mon compte</ButtonText>
				</Button>
				<Text
					style={{
						textAlign: "center",
						color: "#9ca3af",
						fontSize: 12,
						marginTop: 16,
					}}>
					Version 2.0.0
				</Text>
			</VStack>

			{/* Modal suppression compte */}
			<AlertDialog
				isOpen={showDeleteDialog}
				onClose={() => !isDeleting && setShowDeleteDialog(false)}>
				<AlertDialogBackdrop />
				<AlertDialogContent
					style={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						borderRadius: 16,
						padding: 24,
					}}>
					<AlertDialogHeader>
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Icon
								as={AlertTriangle}
								size='lg'
								style={{ color: "#ef4444" }}
							/>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Supprimer mon compte
							</Heading>
						</HStack>
					</AlertDialogHeader>
					<AlertDialogBody>
						<VStack space='md' style={{ marginTop: 12 }}>
							<Text
								style={{
									color: isDark ? "#d1d5db" : "#374151",
									fontSize: 15,
									lineHeight: 22,
								}}>
								Votre compte sera{" "}
								<Text
									style={{
										fontWeight: "700",
										color: "#ef4444",
									}}>
									définitivement supprimé dans 30 jours
								</Text>
								. Toutes vos données seront effacées et cette
								action ne pourra pas être annulée après ce
								délai.
							</Text>
							<Text
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									fontSize: 14,
									lineHeight: 20,
								}}>
								Si vous changez d'avis, envoyez-nous un email à{" "}
								<Text
									style={{
										color: isDark ? "#60a5fa" : "#2563eb",
										fontWeight: "600",
									}}>
									support@wesafe.fr
								</Text>{" "}
								avant la fin du délai.
							</Text>
							<Text
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
									fontSize: 13,
									fontStyle: "italic",
								}}>
								Un email de confirmation vous sera envoyé à{" "}
								{user?.email}.
							</Text>
						</VStack>
					</AlertDialogBody>
					<AlertDialogFooter style={{ marginTop: 24 }}>
						<HStack space='md' style={{ width: "100%" }}>
							<Button
								variant='outline'
								action='secondary'
								onPress={() => setShowDeleteDialog(false)}
								isDisabled={isDeleting}
								style={{ flex: 1 }}>
								<ButtonText>Annuler</ButtonText>
							</Button>
							<Button
								action='negative'
								onPress={handleDeleteAccount}
								isDisabled={isDeleting}
								style={{ flex: 1 }}>
								<ButtonIcon as={Trash2} />
								<ButtonText>
									{isDeleting
										? "Suppression..."
										: "Confirmer"}
								</ButtonText>
							</Button>
						</HStack>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ScrollView>
	);
};

export default Settings;
