import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
// import { Image } from "@/components/ui/image";
// import { Link, LinkText } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";
import { MapPin, Timer } from "lucide-react-native";

const JobCard = ({
	id,
	title,
	category,
	company_id,
	city,
	department,
	isArchived,
	isLastMinute,
}) => {
	const router = useRouter();

	useEffect(() => {
		console.log("JobCard props:", {
			id,
			title,
			category,
			company_id,
			city,
			department,
			isArchived,
			isLastMinute,
		});
	}, [
		id,
		title,
		category,
		company_id,
		city,
		department,
		isArchived,
		isLastMinute,
	]);

	return (
		<Card size='lg' variant='filled' style={styles.card}>
			{isLastMinute && (
				<Timer style={{ position: "absolute", right: 15, top: 15 }} />
			)}
			<Heading size='md' className='mb-1'>
				{title}
			</Heading>
			<Text size='xs'>{id}</Text>
			{city && (
				<HStack
					style={{
						gap: 5,
						alignItems: "center",
						paddingVertical: 5,
					}}>
					<MapPin size={16} />
					<Text size='md'>{city + " (" + department + ")"}</Text>
				</HStack>
			)}
			<HStack style={{ paddingVertical: 15, gap: 15 }}>
				<Badge size='md' variant='solid' action='info'>
					<BadgeText>{category}</BadgeText>
				</Badge>
				{isArchived && (
					<Badge size='md' variant='solid' action='warning'>
						<BadgeText>Archivé</BadgeText>
					</Badge>
				)}
			</HStack>
			<Button
				onPress={() =>
					router.push({
						pathname: "/job",
						params: { id, title, company_id, category },
					})
				}>
				<ButtonText>Voir l'annonce</ButtonText>
			</Button>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default JobCard;
