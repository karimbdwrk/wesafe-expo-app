import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
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
import LogoTitle from "@/assets/icons/Logo";
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

export default function Connexion() {
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
				<View style={{ marginBottom: 32 }}>
					<LogoTitle
						colorScheme={isDark ? "dark" : "light"}
						size={120}
					/>
				</View>
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
					<LogoTitle
						colorScheme={isDark ? "dark" : "light"}
						size={90}
					/>
					<Svg
						viewBox='0 0 266.25 77.95'
						width={120}
						height={35}
						style={{ marginTop: 16 }}>
						<Path
							fill={textPrimary}
							d='M35.15,20.26l-9.08,32.91h-11.6L0,1.05h12.93l8.38,33.82L29.97,1.05h10.76l8.59,33.82L57.78,1.05h12.37l-14.53,52.12h-11.6l-8.87-32.91Z'
						/>
						<Path
							fill={textPrimary}
							d='M73.58,1.05h30.18v10.97h-17.75v9.57h15.93v9.99h-15.93v10.62h18.31v10.97h-30.74V1.05Z'
						/>
						<Path
							fill={textPrimary}
							d='M135.27,12.86c-2.24-1.61-5.24-2.8-7.96-2.8-3.56,0-5.31,1.4-5.31,3.49,0,2.59,2.59,4.33,7.34,8.66,8.38,7.55,11.11,11.95,11.11,17.4,0,9.01-8.1,14.39-18.31,14.39-4.68,0-10.69-1.33-14.67-3.63l4.33-9.57c3.28,1.82,6.5,3.14,10.27,3.14,3.56,0,5.73-1.89,5.73-4.12,0-2.65-2.52-5.03-7.48-9.5-8.38-7.27-11.32-10.62-11.32-16.77,0-6.99,5.59-13.56,18.03-13.56,4.12,0,8.87,1.4,12.65,3.35l-4.4,9.5Z'
						/>
						<Path
							fill={textPrimary}
							d='M178.6,45.42h-20.82l-2.79,7.76h-12.93L162.25,1.05h12.3l20.19,52.12h-13.35l-2.79-7.76ZM175.1,35.63l-6.85-19.07-6.92,19.07h13.77Z'
						/>
						<Path
							fill={textPrimary}
							d='M198.16,1.05h31.79v10.97h-19.35v11.11h16.98v10.97h-16.98v19.07h-12.44V1.05Z'
						/>
						<Path
							fill={textPrimary}
							d='M235.13,1.05h30.18v10.97h-17.75v9.57h15.93v9.99h-15.93v10.62h18.31v10.97h-30.74V1.05Z'
						/>
						<Path
							fill={muted}
							d='M110.38,57.75h4.67c3.96,0,6.19,2.12,6.19,5.51s-2.26,5.59-5.4,6.3l5.93,7.76h-3.57l-5.77-7.53h-.24l-.81,7.53h-3.07l2.07-19.57ZM113.16,60.58l-.68,6.5h1.68c2.47,0,3.99-1.57,3.99-3.67,0-1.52-.94-2.83-3.25-2.83h-1.73Z'
						/>
						<Path
							fill={muted}
							d='M125.48,57.75h10.07l-.29,2.7h-7l-.55,5.33h6.37l-.29,2.65h-6.37l-.66,6.19h7.21l-.29,2.7h-10.28l2.07-19.57Z'
						/>
						<Path
							fill={muted}
							d='M152.23,61.34c-1.23-.84-2.68-1.39-4.64-1.39-4.51,0-8.18,3.49-8.18,7.9,0,3.83,2.91,7.27,7.24,7.27,1.36,0,2.75-.37,4.28-1.26l1.18,2.46c-1.94,1.23-3.93,1.63-5.74,1.63-5.82,0-10.05-4.46-10.05-9.89,0-6.22,5.01-10.94,11.31-10.94,2.31,0,4.28.6,6.16,1.94l-1.55,2.28Z'
						/>
						<Path
							fill={muted}
							d='M156.16,57.75h4.67c3.96,0,6.19,2.12,6.19,5.51s-2.26,5.59-5.4,6.3l5.93,7.76h-3.57l-5.77-7.53h-.24l-.81,7.53h-3.07l2.07-19.57ZM158.94,60.58l-.68,6.5h1.68c2.47,0,3.99-1.57,3.99-3.67,0-1.52-.94-2.83-3.25-2.83h-1.73Z'
						/>
						<Path
							fill={muted}
							d='M175.7,77.95c-4.72,0-7.4-3.31-6.87-8.47l1.26-11.72h3.07l-1.31,12.38c-.34,3.33,1.63,5.01,3.93,5.01,2.07,0,4.22-1.6,4.56-4.91l1.34-12.49h3.07l-1.26,11.8c-.6,5.59-3.33,8.39-7.79,8.39Z'
						/>
						<Path
							fill={muted}
							d='M187.42,57.75h3.09l-2.1,19.57h-3.07l2.07-19.57Z'
						/>
						<Path
							fill={muted}
							d='M195.26,60.5h-3.44l.29-2.75h10.02l-.29,2.75h-3.49l-1.78,16.81h-3.07l1.76-16.81Z'
						/>
						<Path
							fill={muted}
							d='M205.62,57.75h3.07l3.23,14.01,4.3-14.01h3.07l2.99,19.57h-3.12l-1.97-13.82-4.41,13.82h-2.36l-3.36-13.95-3.38,13.95h-3.17l5.11-19.57Z'
						/>
						<Path
							fill={muted}
							d='M225.73,57.75h10.07l-.29,2.7h-7l-.55,5.33h6.37l-.29,2.65h-6.37l-.66,6.19h7.21l-.29,2.7h-10.28l2.07-19.57Z'
						/>
						<Path
							fill={muted}
							d='M240.97,62.86l-1.55,14.45h-3.07l2.07-19.57h3.1l8.52,14.37,1.52-14.37h3.1l-2.07,19.57h-3.02l-8.6-14.45Z'
						/>
						<Path
							fill={muted}
							d='M259.38,60.5h-3.44l.29-2.75h10.02l-.29,2.75h-3.49l-1.78,16.81h-3.07l1.76-16.81Z'
						/>
					</Svg>
					<Text
						size='md'
						style={{
							color: muted,
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
				{/* <Box style={{ flex: 1 }} /> */}

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
