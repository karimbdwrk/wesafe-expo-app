import React, { useEffect } from "react";
import {
	View,
	Image,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	Platform,
} from "react-native";
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
import Colors from "@/constants/Colors";

const Feature = ({ icon, label, isDark }) => {
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const tint20 = isDark ? Colors.dark.tint20 : Colors.light.tint20;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	return (
		<HStack space='sm' style={{ alignItems: "center" }}>
			<Box
				style={{
					width: 36,
					height: 36,
					borderRadius: 18,
					backgroundColor: tint20,
					justifyContent: "center",
					alignItems: "center",
				}}>
				<Icon as={icon} size='sm' style={{ color: tint }} />
			</Box>
			<Text size='sm' style={{ color: textPrimary, flex: 1 }}>
				{label}
			</Text>
		</HStack>
	);
};

export default function Home() {
	const router = useRouter();
	const { loading: authLoading } = useAuth();
	const { isDark } = useTheme();
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const border = isDark ? Colors.dark.border : Colors.light.border;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;

	if (authLoading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: bg,
				}}>
				<Image
					source={require("@/assets/images/logo-wesafe-v2.png")}
					style={{ width: 120, height: 120, marginBottom: 32 }}
					resizeMode='contain'
				/>
				<ActivityIndicator size='large' color={tint} />
			</View>
		);
	}

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: bg,
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
							color: textPrimary,
							marginTop: 20,
							letterSpacing: -0.5,
						}}>
						WeSafe
					</Text>
					<Text
						size='md'
						style={{
							color: muted,
							textAlign: "center",
							marginTop: 8,
							lineHeight: 22,
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
							backgroundColor: tint,
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
							borderColor: border,
						}}
						onPress={() => router.push("/signup")}>
						<ButtonText
							style={{
								fontWeight: "600",
								fontSize: 16,
								color: textPrimary,
							}}>
							Créer un compte
						</ButtonText>
					</Button>

					<Text
						size='xs'
						style={{
							color: muted,
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
