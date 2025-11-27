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

const WishCard = ({ id, title, category, company_id, isArchived }) => {
	const router = useRouter();
	return (
		<Card size='lg' variant='filled' style={styles.card}>
			<Heading size='md' className='mb-1'>
				{title} {isArchived && "Archivé"}
			</Heading>
			<Text>{id}</Text>
			<HStack style={{ paddingVertical: 15 }}>
				<Badge size='md' variant='solid' action='warning'>
					<BadgeText>{category}</BadgeText>
				</Badge>
			</HStack>
			<Button
				onPress={() =>
					router.push({
						pathname: "/job",
						params: { id, title, company_id, category },
					})
				}>
				<ButtonText>Voir l'offre d'emploi</ButtonText>
			</Button>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default WishCard;
