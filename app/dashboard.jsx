import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

import { BadgeCheckIcon } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";

import LogoUploader from "@/components/LogoUploader";
import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const DashboardScreen = () => {
	const { accessToken, userCompany, user, hasSubscription } = useAuth();
	const { getById } = useDataContext();
	const { image } = useImage();

	const router = useRouter();

	const [company, setCompany] = useState(null);

	const loadData = async () => {
		const data = await getById("companies", user.id, `*`);
		setCompany(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);

	return (
		<VStack style={{ padding: 15 }}>
			<LogoUploader image={image} />
			<HStack alignItems='center' className='mt-2 mb-2' space={2}>
				<Text>{company?.name}</Text>
				{company?.isConfirmed && (
					<Badge
						size='sm'
						variant='solid'
						action='success'
						className='ml-1'>
						<BadgeText>Verified</BadgeText>
						<BadgeIcon as={BadgeCheckIcon} className='ml-1' />
					</Badge>
				)}
			</HStack>
			<Text>{company?.siret}</Text>
			<Text>{company?.description}</Text>
			<Button
				onPress={() => {
					router.push({
						pathname: "/updatecompany",
						params: {
							companyName: company.name,
							companySiret: company.siret,
							companyDescription: company.description,
						},
					});
				}}>
				<ButtonText>Update company</ButtonText>
				{/* <ProcessStamp /> */}
			</Button>
			<Button
				onPress={() => {
					router.push({
						pathname: "/stamp",
						params: {
							companyName: company.name,
						},
					});
				}}>
				<ButtonText>Stamp</ButtonText>
				{/* <ProcessStamp /> */}
			</Button>
			<Button
				onPress={() => {
					router.push({
						pathname: "/signature",
						params: {
							signatureUrl: company.signature_url,
							type: "companies",
						},
					});
				}}
				style={{ width: "100%" }}>
				<ButtonText>Sign</ButtonText>
			</Button>
			<Button
				onPress={() => {
					router.push({
						pathname: "/scanner",
					});
				}}>
				<ButtonText>Scanner un profile WeSafe</ButtonText>
				{/* <ProcessStamp /> */}
			</Button>
			<Button
				onPress={() => {
					router.push({
						pathname: "/buycredits",
					});
				}}>
				<ButtonText>Acheter des Crédits</ButtonText>
			</Button>
			<Text>{hasSubscription ? "Abonné" : "Non abonné"}</Text>
			{/* <Button onPress={() => checkSubscription(userCompany.id)}>
				<ButtonText>Check Subscription</ButtonText>
			</Button> */}
		</VStack>
	);
};

export default DashboardScreen;
