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

const ApplyCard = ({
	id,
	name,
	title,
	category,
	company_id,
	isRefused,
	apply_id,
}) => {
	const router = useRouter();
	return (
		<Card size='lg' variant='filled' style={styles.card}>
			{name && (
				<Heading size='md' className='mb-1'>
					{name}
				</Heading>
			)}
			<Heading size='md' className='mb-1'>
				{title}
			</Heading>
			<Text>{id}</Text>
			<HStack style={{ paddingVertical: 15, gap: 10 }}>
				<Badge size='md' variant='solid' action='warning'>
					<BadgeText>{category}</BadgeText>
				</Badge>
				{isRefused && (
					<Badge size='md' variant='solid' action='error'>
						<BadgeText>Refusé</BadgeText>
					</Badge>
				)}
			</HStack>
			<Button
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
				<ButtonText>Voir la candidature</ButtonText>
			</Button>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default ApplyCard;
