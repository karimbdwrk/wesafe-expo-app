import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Briefcase, User, LogOut } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const FinalizeRegistrationScreen = () => {
	const router = useRouter();
	const { signOut } = useAuth();
	const { isDark } = useTheme();

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f9fafb",
			}}>
			<VStack
				style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
				{/* Logout button */}
				<TouchableOpacity
					onPress={signOut}
					activeOpacity={0.7}
					style={{
						paddingTop: 12,
						paddingBottom: 8,
						alignSelf: "flex-end",
					}}>
					<HStack space='xs' style={{ alignItems: "center" }}>
						<Icon
							as={LogOut}
							size='sm'
							style={{ color: "#ef4444" }}
						/>
						<Text
							size='sm'
							style={{ color: "#ef4444", fontWeight: "600" }}>
							Déconnexion
						</Text>
					</HStack>
				</TouchableOpacity>

				{/* Logo + header */}
				<VStack
					style={{
						alignItems: "center",
						paddingTop: 32,
						paddingBottom: 40,
					}}>
					<Image
						source={require("@/assets/images/logo-wesafe-v2.png")}
						style={{ width: 90, height: 90 }}
						resizeMode='contain'
					/>
					<Text
						style={{
							fontSize: 24,
							fontWeight: "800",
							color: isDark ? "#f9fafb" : "#111827",
							marginTop: 20,
							letterSpacing: -0.5,
							textAlign: "center",
						}}>
						Bienvenue sur WeSafe !
					</Text>
					<Text
						size='sm'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
							textAlign: "center",
							marginTop: 8,
							lineHeight: 22,
						}}>
						Pour finaliser votre inscription,{"\n"}dites-nous qui
						vous êtes.
					</Text>
				</VStack>

				<Divider style={{ marginBottom: 32 }} />

				{/* Choice cards */}
				<VStack space='md'>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/createprofile")}>
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 16,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: isDark
											? "#1e3a5f"
											: "#eff6ff",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={User}
										size='lg'
										style={{
											color: isDark
												? "#60a5fa"
												: "#2563eb",
										}}
									/>
								</Box>
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 16,
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Je suis un candidat
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Agent de sécurité, SSIAP, vigile...
									</Text>
								</VStack>
							</HStack>
						</Card>
					</TouchableOpacity>

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => router.push("/createcompany")}>
						<Card
							style={{
								padding: 20,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderRadius: 16,
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: isDark
											? "#1a2e1a"
											: "#f0fdf4",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={Briefcase}
										size='lg'
										style={{
											color: isDark
												? "#4ade80"
												: "#16a34a",
										}}
									/>
								</Box>
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 16,
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Je suis une entreprise
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										Société de sécurité, donneur d'ordre...
									</Text>
								</VStack>
							</HStack>
						</Card>
					</TouchableOpacity>
				</VStack>
			</VStack>
		</SafeAreaView>
	);
};

export default FinalizeRegistrationScreen;
