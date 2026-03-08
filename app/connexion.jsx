import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Shield, Briefcase, FileCheck, Users } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const Feature = ({ icon, label, isDark }) => (
	<HStack space='sm' style={{ alignItems: "center" }}>
		<Box
			style={{
				width: 36,
				height: 36,
				borderRadius: 18,
				backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
				justifyContent: "center",
				alignItems: "center",
			}}>
			<Icon
				as={icon}
				size='sm'
				style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
			/>
		</Box>
		<Text
			size='sm'
			style={{ color: isDark ? "#d1d5db" : "#374151", flex: 1 }}>
			{label}
		</Text>
	</HStack>
);

export default function Connexion() {
	const router = useRouter();
	const { loading: authLoading } = useAuth();
	const { isDark } = useTheme();

	if (authLoading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: isDark ? "#111827" : "#f9fafb",
				}}>
				<Image
					source={require("@/assets/images/logo-wesafe-v2.png")}
					style={{ width: 120, height: 120, marginBottom: 32 }}
					resizeMode='contain'
				/>
				<ActivityIndicator
					size='large'
					color={isDark ? "#60a5fa" : "#2563eb"}
				/>
			</View>
		);
	}

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f9fafb",
			}}>
			<VStack style={{ flex: 1, paddingHorizontal: 28 }}>
				{/* Logo */}
				<VStack
					style={{
						alignItems: "center",
						paddingTop: 56,
						paddingBottom: 32,
					}}>
					<Image
						source={require("@/assets/images/logo-wesafe-v2.png")}
						style={{ width: 110, height: 110 }}
						resizeMode='contain'
					/>
					<Text
						style={{
							fontSize: 28,
							fontWeight: "800",
							color: isDark ? "#f9fafb" : "#111827",
							marginTop: 20,
							letterSpacing: -0.5,
							lineHeight: 32,
						}}>
						WeSafe
					</Text>
					<Text
						size='md'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
							textAlign: "center",
							marginTop: 8,
							lineHeight: 18,
						}}>
						La plateforme de sécurité privée{"\n"}qui connecte les
						professionnels
					</Text>
				</VStack>

				<Divider style={{ marginBottom: 32 }} />

				{/* Features */}
				<VStack space='lg' style={{ marginBottom: 40 }}>
					<Feature
						icon={Shield}
						label='Vérification des documents professionnels (CNAPS, diplômes, certifications)'
						isDark={isDark}
					/>
					<Feature
						icon={Briefcase}
						label='Candidatures aux missions de sécurité en quelques clics'
						isDark={isDark}
					/>
					<Feature
						icon={FileCheck}
						label='Gestion de vos contrats, feuilles de paie et signature électronique'
						isDark={isDark}
					/>
					<Feature
						icon={Users}
						label='Mise en relation directe entre agents et employeurs'
						isDark={isDark}
					/>
				</VStack>

				{/* Spacer */}
				<Box style={{ flex: 1 }} />

				{/* CTA Buttons */}
				<VStack space='md' style={{ paddingBottom: 32 }}>
					<Button
						size='lg'
						style={{
							backgroundColor: "#2563eb",
							borderRadius: 12,
							height: 52,
						}}
						onPress={() => router.push("/signin")}>
						<ButtonText
							style={{
								fontWeight: "700",
								fontSize: 16,
								color: "#ffffff",
							}}>
							Se connecter
						</ButtonText>
					</Button>

					<Button
						size='lg'
						variant='outline'
						style={{
							borderRadius: 12,
							height: 52,
							borderColor: isDark ? "#4b5563" : "#d1d5db",
						}}
						onPress={() => router.push("/signup")}>
						<ButtonText
							style={{
								fontWeight: "600",
								fontSize: 16,
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							Créer un compte
						</ButtonText>
					</Button>

					<Text
						size='xs'
						style={{
							color: isDark ? "#6b7280" : "#9ca3af",
							textAlign: "center",
							marginTop: 8,
						}}>
						En continuant, vous acceptez nos conditions
						d'utilisation
					</Text>
				</VStack>
			</VStack>
		</SafeAreaView>
	);
}
