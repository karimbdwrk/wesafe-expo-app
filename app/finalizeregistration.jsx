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
import Colors from "@/constants/Colors";

const FinalizeRegistrationScreen = () => {
	const router = useRouter();
	const { signOut } = useAuth();
	const { isDark } = useTheme();

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
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
							style={{ color: isDark ? Colors.dark.danger : Colors.light.danger }}
						/>
						<Text
							size='sm'
							style={{ color: isDark ? Colors.dark.danger : Colors.light.danger, fontWeight: "600" }}>
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
							color: isDark ? Colors.dark.text : Colors.light.text,
							marginTop: 20,
							letterSpacing: -0.5,
							textAlign: "center",
							lineHeight: 30,
						}}>
						Bienvenue sur WeSafe !
					</Text>
					<Text
						size='sm'
						style={{
							color: isDark ? Colors.dark.muted : Colors.light.muted,
							textAlign: "center",
							marginTop: 8,
							lineHeight: 16,
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
								backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: isDark ? Colors.dark.border : Colors.light.border,
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: isDark
											? Colors.dark.tint20
											: Colors.light.tint20,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={User}
										size='lg'
										style={{
											color: isDark
												? Colors.dark.tint
												: Colors.light.tint,
										}}
									/>
								</Box>
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 16,
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										Je suis un candidat
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
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
								backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: isDark ? Colors.dark.border : Colors.light.border,
							}}>
							<HStack space='md' style={{ alignItems: "center" }}>
								<Box
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: isDark
											? Colors.dark.success20
											: Colors.light.success20,
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Icon
										as={Briefcase}
										size='lg'
										style={{
											color: isDark
												? Colors.dark.success
												: Colors.light.success,
										}}
									/>
								</Box>
								<VStack space='xs' style={{ flex: 1 }}>
									<Text
										style={{
											fontWeight: "700",
											fontSize: 16,
											color: isDark
												? Colors.dark.text
												: Colors.light.text,
										}}>
										Je suis une entreprise
									</Text>
									<Text
										size='sm'
										style={{
											color: isDark
												? Colors.dark.muted
												: Colors.light.muted,
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
