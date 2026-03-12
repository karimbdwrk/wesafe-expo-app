import React, { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";

import { Globe, Check, Lock, Info } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";

const LANGUAGES = [
	{
		key: "fr",
		label: "Français",
		nativeLabel: "Français",
		flag: "🇫🇷",
		available: true,
	},
	{
		key: "en",
		label: "Anglais",
		nativeLabel: "English",
		flag: "🇬🇧",
		available: false,
	},
];

const LanguagesScreen = () => {
	const { isDark } = useTheme();
	const [selected, setSelected] = useState("fr");

	return (
		<ScrollView
			style={{
				flex: 1,
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<VStack style={{ padding: 16, gap: 24, paddingBottom: 100 }}>
				{/* Header */}
				<VStack style={{ gap: 6, marginTop: 8 }}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Icon
							as={Globe}
							size='xl'
							style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
						/>
						<Heading
							size='2xl'
							style={{ color: isDark ? "#f3f4f6" : "#111827" }}>
							Langue
						</Heading>
					</HStack>
					<Text
						size='md'
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
						Choisissez la langue d'affichage de l'application
					</Text>
				</VStack>

				{/* Liste des langues */}
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
							Langue disponibles
						</Text>

						{LANGUAGES.map((lang, index) => (
							<React.Fragment key={lang.key}>
								<TouchableOpacity
									activeOpacity={lang.available ? 0.7 : 1}
									onPress={() =>
										lang.available && setSelected(lang.key)
									}>
									<HStack
										space='md'
										style={{
											alignItems: "center",
											paddingVertical: 16,
											opacity: lang.available ? 1 : 0.45,
										}}>
										{/* Flag */}
										<Text style={{ fontSize: 28 }}>
											{lang.flag}
										</Text>

										{/* Labels */}
										<VStack style={{ flex: 1 }}>
											<Text
												style={{
													fontWeight: "600",
													fontSize: 16,
													color: isDark
														? "#f3f4f6"
														: "#111827",
												}}>
												{lang.label}
											</Text>
											<Text
												style={{
													fontSize: 13,
													color: isDark
														? "#9ca3af"
														: "#6b7280",
													marginTop: 1,
												}}>
												{lang.nativeLabel}
												{!lang.available &&
													" · Bientôt disponible"}
											</Text>
										</VStack>

										{/* État droit */}
										{lang.available ? (
											selected === lang.key ? (
												<HStack
													space='xs'
													style={{
														alignItems: "center",
														backgroundColor: isDark
															? "rgba(16,185,129,0.15)"
															: "rgba(16,185,129,0.1)",
														paddingHorizontal: 10,
														paddingVertical: 4,
														borderRadius: 20,
														borderWidth: 1,
														borderColor: isDark
															? "rgba(16,185,129,0.4)"
															: "rgba(16,185,129,0.3)",
													}}>
													<Icon
														as={Check}
														size='xs'
														style={{
															color: "#10b981",
														}}
													/>
													<Text
														size='xs'
														style={{
															color: "#10b981",
															fontWeight: "600",
														}}>
														Sélectionné
													</Text>
												</HStack>
											) : null
										) : (
											<Icon
												as={Lock}
												size='sm'
												style={{
													color: isDark
														? "#6b7280"
														: "#9ca3af",
												}}
											/>
										)}
									</HStack>
								</TouchableOpacity>
								{index < LANGUAGES.length - 1 && <Divider />}
							</React.Fragment>
						))}
					</VStack>
				</Card>

				{/* Info Card */}
				<Card
					style={{
						backgroundColor: isDark
							? "rgba(59, 130, 246, 0.1)"
							: "rgba(59, 130, 246, 0.05)",
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: isDark
							? "rgba(59, 130, 246, 0.3)"
							: "rgba(59, 130, 246, 0.2)",
					}}>
					<HStack space='sm' style={{ alignItems: "flex-start" }}>
						<Icon
							as={Info}
							size='sm'
							style={{
								color: isDark ? "#60a5fa" : "#2563eb",
								marginTop: 2,
							}}
						/>
						<Text
							size='sm'
							style={{
								color: isDark ? "#bfdbfe" : "#1e40af",
								lineHeight: 20,
								flex: 1,
							}}>
							D'autres langues seront disponibles prochainement.
							La langue affecte l'interface de l'application mais
							pas le contenu des offres.
						</Text>
					</HStack>
				</Card>
			</VStack>
		</ScrollView>
	);
};

export default LanguagesScreen;
