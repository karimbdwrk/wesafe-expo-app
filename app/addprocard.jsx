import { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { IdCard, GraduationCap } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import ProCardForm from "@/components/ProCardForm";
import SSIAPDiploma from "@/components/SSIAPDiploma";

const ITEMS_PER_PAGE = 10;

export default function AddProCardScreen() {
	const { signIn, user } = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const [cardType, setCardType] = useState(null); // 'procard' ou 'ssiap'

	const [page, setPage] = useState(1);
	const [procards, setProcards] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const loadData = async () => {
		const { data, totalCount } = await getAll(
			"procards",
			"category, status, validity_date",
			`&profile_id=eq.${user.id}&isDeleted=eq.false`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc",
		);
		setProcards(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [page]),
	);

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
			<ScrollView
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				showsVerticalScrollIndicator={false}>
				<Box style={{ padding: 20, paddingBottom: 40 }}>
					<VStack space='2xl'>
						{/* Header */}
						<VStack space='md'>
							<Heading
								size='2xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
								}}>
								Ajouter un document
							</Heading>
							<Text
								size='md'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
								}}>
								Sélectionnez le type de document à ajouter à
								votre profil
							</Text>
						</VStack>

						{/* Document Type Selection */}
						{!cardType && (
							<VStack space='lg'>
								<Text
									size='lg'
									style={{
										fontWeight: "600",
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									Choisissez votre type de document
								</Text>

								<TouchableOpacity
									onPress={() => setCardType("procard")}
									activeOpacity={0.7}>
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? "#374151"
												: "#ffffff",
											borderRadius: 12,
											borderWidth: 2,
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<HStack
											space='md'
											style={{ alignItems: "center" }}>
											<Box
												style={{
													width: 48,
													height: 48,
													borderRadius: 24,
													backgroundColor: isDark
														? "#1f2937"
														: "#f3f4f6",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={IdCard}
													size='xl'
													style={{
														color: isDark
															? "#60a5fa"
															: "#2563eb",
													}}
												/>
											</Box>
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Carte Professionnelle
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Agents de sécurité,
													cynophiles, etc.
												</Text>
											</VStack>
										</HStack>
									</Card>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() => setCardType("ssiap")}
									activeOpacity={0.7}>
									<Card
										style={{
											padding: 20,
											backgroundColor: isDark
												? "#374151"
												: "#ffffff",
											borderRadius: 12,
											borderWidth: 2,
											borderColor: isDark
												? "#4b5563"
												: "#e5e7eb",
										}}>
										<HStack
											space='md'
											style={{ alignItems: "center" }}>
											<Box
												style={{
													width: 48,
													height: 48,
													borderRadius: 24,
													backgroundColor: isDark
														? "#1f2937"
														: "#f3f4f6",
													justifyContent: "center",
													alignItems: "center",
												}}>
												<Icon
													as={GraduationCap}
													size='xl'
													style={{
														color: isDark
															? "#60a5fa"
															: "#2563eb",
													}}
												/>
											</Box>
											<VStack
												space='xs'
												style={{ flex: 1 }}>
												<Text
													size='lg'
													style={{
														fontWeight: "600",
														color: isDark
															? "#f3f4f6"
															: "#111827",
													}}>
													Diplôme SSIAP
												</Text>
												<Text
													size='sm'
													style={{
														color: isDark
															? "#9ca3af"
															: "#6b7280",
													}}>
													Service de Sécurité Incendie
													et d'Assistance aux
													Personnes
												</Text>
											</VStack>
										</HStack>
									</Card>
								</TouchableOpacity>
							</VStack>
						)}

						{/* ProCard Form */}
						{cardType === "procard" && (
							<VStack space='lg'>
								<HStack
									style={{
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<Text
										size='xl'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Nouvelle carte pro
									</Text>
									<TouchableOpacity
										onPress={() => setCardType(null)}
										activeOpacity={0.7}>
										<Text
											size='sm'
											style={{
												color: "#2563eb",
												fontWeight: "600",
											}}>
											Changer
										</Text>
									</TouchableOpacity>
								</HStack>
								<ProCardForm procards={procards} />
							</VStack>
						)}

						{/* SSIAP Diploma Form */}
						{cardType === "ssiap" && (
							<VStack space='lg'>
								<HStack
									style={{
										justifyContent: "space-between",
										alignItems: "center",
									}}>
									<Text
										size='xl'
										style={{
											fontWeight: "600",
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}>
										Nouveau diplôme SSIAP
									</Text>
									<TouchableOpacity
										onPress={() => setCardType(null)}
										activeOpacity={0.7}>
										<Text
											size='sm'
											style={{
												color: "#2563eb",
												fontWeight: "600",
											}}>
											Changer
										</Text>
									</TouchableOpacity>
								</HStack>
								<SSIAPDiploma />
							</VStack>
						)}
					</VStack>
				</Box>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
