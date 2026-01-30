import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
// import { Image } from "@/components/ui/image";
// import { Link, LinkText } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";
import { width } from "dom-helpers";
import { BackpackIcon } from "lucide-react-native";

const ApplyCard = ({
	id,
	name,
	title,
	category,
	company_id,
	isRefused,
	apply_id,
	status,
}) => {
	const router = useRouter();
	return (
		<Pressable
			onPress={() =>
				router.push({
					pathname: "/application",
					params: {
						id,
						title,
						company_id,
						category,
						apply_id,
						name,
					},
				})
			}>
			{({ pressed }) => (
				<Card
					size='lg'
					variant='filled'
					style={{
						width: "100%",
						backgroundColor: pressed ? "#F0F0F0" : "#F7F7F7",
					}}>
					{name && (
						<Heading size='md' className='mb-1'>
							{name}
						</Heading>
					)}
					<Heading size='md' className='mb-1'>
						{title}
					</Heading>
					<Text>{id}</Text>
					<HStack style={{ marginTop: 15, gap: 10 }}>
						<Badge size='md' variant='solid' action='warning'>
							<BadgeText>{category}</BadgeText>
						</Badge>
						<Badge size='md' variant='solid' action='info'>
							<BadgeText>{status}</BadgeText>
						</Badge>
					</HStack>
				</Card>
			)}
		</Pressable>
	);
};

export default ApplyCard;
