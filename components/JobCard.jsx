import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { MapPin, Timer, IdCard } from "lucide-react-native";

const JobCard = ({
	id,
	title,
	category,
	company_id,
	city,
	department,
	isArchived,
	isLastMinute,
	logo,
}) => {
	const router = useRouter();
	const { isDark } = useTheme();

	return (
		<TouchableOpacity
			onPress={() =>
				router.push({
					pathname: "/job",
					params: { id, title, company_id, category },
				})
			}
			activeOpacity={0.7}>
			<Card
				style={{
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderRadius: 8,
					padding: 16,
					marginBottom: 12,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				{isLastMinute && (
					<Timer
						size={20}
						color='#f59e0b'
						style={{ position: "absolute", right: 16, top: 16 }}
					/>
				)}
				<VStack space='md'>
					<HStack space='md' style={{ alignItems: "center" }}>
						<Image
							size='md'
							source={{
								uri:
									logo ||
									"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
							}}
							alt='logo'
							style={{
								width: 60,
								height: 60,
								borderRadius: 8,
							}}
						/>
						<VStack style={{ flex: 1 }}>
							<Heading
								size='lg'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									lineHeight: 24,
								}}>
								{title}
							</Heading>
							{city && (
								<HStack
									space='xs'
									style={{
										alignItems: "center",
										marginTop: 4,
									}}>
									<MapPin
										size={14}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{city + " (" + department + ")"}
									</Text>
								</HStack>
							)}
						</VStack>
					</HStack>

					<HStack
						space='sm'
						style={{ alignItems: "center", flexWrap: "wrap" }}>
						<Badge size='sm' variant='solid' action='info'>
							<BadgeIcon as={IdCard} className='mr-2' />
							<BadgeText>{category}</BadgeText>
						</Badge>
						{isArchived && (
							<Badge size='sm' variant='solid' action='warning'>
								<BadgeText>Archivé</BadgeText>
							</Badge>
						)}
					</HStack>
				</VStack>
			</Card>
		</TouchableOpacity>
	);
};

export default JobCard;
