import React, { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { TouchableOpacity } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";

import {
	CheckCircle,
	FileText,
	MessageCircle,
	ChevronRight,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { createSupabaseClient } from "@/lib/supabase";

const ApplicationsBlock = () => {
	const router = useRouter();
	const { user, accessToken } = useAuth();
	const { isDark } = useTheme();

	const [selectedCount, setSelectedCount] = useState(0);
	const [contractCount, setContractCount] = useState(0);
	const [totalUnread, setTotalUnread] = useState(0);

	const loadData = useCallback(async () => {
		if (!user?.id || !accessToken) return;
		try {
			const supabase = createSupabaseClient(accessToken);

			const { data: apps } = await supabase
				.from("applications")
				.select("id, current_status")
				.eq("candidate_id", user.id)
				.in("current_status", [
					"selected",
					"contract_sent",
					"contract_signed_candidate",
					"contract_signed_pro",
				]);

			if (!apps) return;

			setSelectedCount(
				apps.filter((a) => a.current_status === "selected").length,
			);
			setContractCount(
				apps.filter((a) =>
					[
						"contract_sent",
						"contract_signed_candidate",
						"contract_signed_pro",
					].includes(a.current_status),
				).length,
			);

			if (apps.length > 0) {
				const { count } = await supabase
					.from("messages")
					.select("*", { count: "exact", head: true })
					.in(
						"apply_id",
						apps.map((a) => a.id),
					)
					.neq("sender_id", user.id)
					.eq("is_read", false);
				setTotalUnread(count || 0);
			} else {
				setTotalUnread(0);
			}
		} catch (e) {
			console.error("ApplicationsBlock error:", e);
		}
	}, [user?.id, accessToken]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	if (selectedCount === 0 && contractCount === 0 && totalUnread === 0)
		return null;

	return (
		<Box
			style={{
				backgroundColor: isDark
					? Colors.dark.background
					: Colors.light.cardBackground,
				borderRadius: 12,
				borderWidth: 1,
				borderColor: isDark ? Colors.dark.border : Colors.light.border,
				padding: 14,
			}}>
			<VStack space='sm'>
				{/* Header */}
				<Text
					size='md'
					style={{
						fontWeight: "700",
						color: isDark ? Colors.dark.text : Colors.light.text,
					}}>
					Candidatures actives
				</Text>

				{/* Lignes de comptage */}
				<VStack space='xs' className='mb-2'>
					{selectedCount > 0 && (
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 28,
									height: 28,
									borderRadius: 8,
									backgroundColor: isDark
										? "#1e3a5f"
										: "#eff6ff",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<CheckCircle
									size={14}
									color={Colors.light.tint}
								/>
							</Box>
							<Text
								size='sm'
								style={{
									flex: 1,
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
								}}>
								<Text
									size='sm'
									style={{
										fontWeight: "700",
										color: Colors.light.tint,
									}}>
									{selectedCount}
								</Text>{" "}
								candidature
								{selectedCount > 1 ? "s" : ""} sélectionnée
								{selectedCount > 1 ? "s" : ""}
							</Text>
						</HStack>
					)}

					{contractCount > 0 && (
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 28,
									height: 28,
									borderRadius: 8,
									backgroundColor: isDark
										? "#451a03"
										: "#fefce8",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<FileText
									size={14}
									color={Colors.dark.warning}
								/>
							</Box>
							<Text
								size='sm'
								style={{
									flex: 1,
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
								}}>
								<Text
									size='sm'
									style={{
										fontWeight: "700",
										color: Colors.light.warning,
									}}>
									{contractCount}
								</Text>{" "}
								contrat{contractCount > 1 ? "s" : ""} à signer
							</Text>
						</HStack>
					)}

					{totalUnread > 0 && (
						<HStack space='sm' style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 28,
									height: 28,
									borderRadius: 8,
									backgroundColor: isDark
										? "#1e3a5f"
										: "#eff6ff",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<MessageCircle
									size={14}
									color={Colors.light.tint}
								/>
							</Box>
							<Text
								size='sm'
								style={{
									flex: 1,
									color: isDark
										? Colors.dark.muted
										: Colors.light.muted,
								}}>
								<Text
									size='sm'
									style={{
										fontWeight: "700",
										color: Colors.light.tint,
									}}>
									{totalUnread}
								</Text>{" "}
								message{totalUnread > 1 ? "s" : ""} non lu
								{totalUnread > 1 ? "s" : ""}
							</Text>
						</HStack>
					)}
				</VStack>

				<TouchableOpacity
					onPress={() => router.push("/applications")}
					activeOpacity={0.75}
					style={{
						backgroundColor: isDark
							? Colors.dark.cardBackground
							: Colors.light.cardBackground,
						borderRadius: 10,
						paddingVertical: 11,
						alignItems: "center",
						borderWidth: 1,
						borderColor: isDark
							? Colors.dark.border
							: Colors.light.border,
						flexDirection: "row",
						justifyContent: "center",
						gap: 6,
					}}>
					<Text
						style={{
							fontWeight: "700",
							fontSize: 14,
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
						}}>
						Voir candidatures
					</Text>
					<ChevronRight
						size={16}
						color={isDark ? Colors.dark.muted : Colors.light.muted}
					/>
				</TouchableOpacity>
			</VStack>
		</Box>
	);
};

export default ApplicationsBlock;
