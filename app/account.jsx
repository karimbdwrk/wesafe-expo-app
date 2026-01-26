import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeText, BadgeIcon } from "@/components/ui/badge";
import {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionTitleText,
	AccordionContentText,
	AccordionIcon,
	AccordionContent,
} from "@/components/ui/accordion";
import { Divider } from "@/components/ui/divider";
import { ChevronUpIcon, ChevronDownIcon } from "@/components/ui/icon";

import { IdCard, CircleCheckBig } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useImage } from "@/context/ImageContext";

import AvatarUploader from "@/components/AvatarUploader";
import FlipCardProfile from "@/components/FlipCardProfile";
import { width } from "dom-helpers";

const AccountScreen = () => {
	const { user } = useAuth();
	const { image } = useImage();
	const { getById } = useDataContext();

	const router = useRouter();

	const [profile, setProfile] = useState(null);

	const loadData = async () => {
		const data = await getById("profiles", user.id, `*`);
		setProfile(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	return (
		<VStack style={{ flex: 1, backgroundColor: "#F0f0f0" }}>
			<ScrollView>
				<VStack style={{ backgroundColor: "#F0f0f0" }}>
					{/* <AvatarUploader image={image} /> */}
					<FlipCardProfile />
					<HStack
						style={{
							justifyContent: "center",
							paddingVertical: 15,
						}}>
						<Heading>
							{profile?.firstname + " " + profile?.lastname}
						</Heading>
					</HStack>
					<HStack
						style={{
							justifyContent: "center",
							gap: 15,
							paddingBottom: 15,
						}}>
						<Badge action='info'>
							<BadgeIcon as={IdCard} className='mr-2' />
							<BadgeText>APS</BadgeText>
						</Badge>
						<Badge action='info'>
							<BadgeIcon as={IdCard} className='mr-2' />
							<BadgeText>SSIAP1</BadgeText>
						</Badge>
					</HStack>
				</VStack>
				<VStack style={{ gap: 15, backgroundColor: "#FFF" }}>
					<Accordion
						size='md'
						variant='filled'
						type='single'
						isCollapsible={true}
						isDisabled={false}>
						<AccordionItem value='a'>
							<AccordionHeader>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													Informations
												</AccordionTitleText>
												{isExpanded ? (
													<AccordionIcon
														as={ChevronUpIcon}
														className='ml-3'
													/>
												) : (
													<AccordionIcon
														as={ChevronDownIcon}
														className='ml-3'
													/>
												)}
											</>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent>
								<AccordionContentText>
									To place an order, simply select the
									products you want, proceed to checkout,
									provide shipping and payment information,
									and finalize your purchase.
								</AccordionContentText>
								<Button
									onPress={() => {
										router.push({
											pathname: "/updateprofile",
											params: {
												firstname: profile.firstname,
												lastname: profile.lastname,
											},
										});
									}}
									style={{ width: "100%" }}>
									<ButtonText>Update</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
						<Divider />
						<AccordionItem value='b'>
							<AccordionHeader>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<AccordionTitleText>
													Curriculum Vitae
												</AccordionTitleText>
												{isExpanded ? (
													<AccordionIcon
														as={ChevronUpIcon}
														className='ml-3'
													/>
												) : (
													<AccordionIcon
														as={ChevronDownIcon}
														className='ml-3'
													/>
												)}
											</>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent>
								<AccordionContentText>
									We accept all major credit cards, including
									Visa, Mastercard, and American Express. We
									also support payments through PayPal.
								</AccordionContentText>
								<Button
									onPress={() => {
										router.push("/curriculum");
									}}
									style={{ width: "100%" }}>
									<ButtonText>CV</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
						<Divider />
						<AccordionItem value='c'>
							<AccordionHeader>
								<AccordionTrigger>
									{({ isExpanded }) => {
										return (
											<>
												<HStack
													style={{
														width: "max-content",
														gap: 15,
													}}>
													<Heading size='md'>
														Signature
													</Heading>
													{profile?.signature_url && (
														<CircleCheckBig />
													)}
												</HStack>
												{isExpanded ? (
													<AccordionIcon
														as={ChevronUpIcon}
														className='ml-3'
													/>
												) : (
													<AccordionIcon
														as={ChevronDownIcon}
														className='ml-3'
													/>
												)}
											</>
										);
									}}
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent>
								<VStack
									style={{
										alignItems: "center",
										padding: 15,
									}}>
									{profile?.signature_url && (
										<Image
											source={{
												uri: profile?.signature_url,
											}}
											size={"2xl"}
											resizeMode='contain'
											borderRadius={15}
											alt='profile signature'
										/>
									)}
								</VStack>
								<Button
									onPress={() => {
										router.push({
											pathname: "/signature",
											params: {
												signatureUrl:
													profile.signature_url,
												type: "profiles",
											},
										});
									}}
									style={{ width: "100%" }}>
									<ButtonText>Sign</ButtonText>
								</Button>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</VStack>
				<VStack>
					<Button onPress={() => router.push("/documents")}>
						<ButtonText>Documents</ButtonText>
					</Button>
					{/* <Button
						onPress={() => router.push("/documentsverification")}>
						<ButtonText>Documents</ButtonText>
					</Button> */}
				</VStack>
				{/* <VStack
					style={{
						padding: 15,
						backgroundColor: "#FFF",
						height: "100%",
						gap: 15,
					}}>
					<Button
						onPress={() => {
							router.push({
								pathname: "/updateprofile",
								params: {
									firstname: profile.firstname,
									lastname: profile.lastname,
								},
							});
						}}
						style={{ width: "100%" }}>
						<ButtonText>Update</ButtonText>
					</Button>
					<Button
						onPress={() => {
							router.push("/curriculum");
						}}
						style={{ width: "100%" }}>
						<ButtonText>CV</ButtonText>
					</Button>
					<Button
						onPress={() => {
							router.push({
								pathname: "/signature",
								params: {
									signatureUrl: profile.signature_url,
									type: "profiles",
								},
							});
						}}
						style={{ width: "100%" }}>
						<ButtonText>Sign</ButtonText>
					</Button>
				</VStack> */}
			</ScrollView>
		</VStack>
	);
};

export default AccountScreen;
