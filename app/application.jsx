import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

import {
	Bookmark,
	BookmarkCheck,
	Check,
	Hourglass,
	X,
	CircleSlash,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import JobCard from "@/components/JobCard";

const ApplicationScreen = () => {
	const router = useRouter();
	const { id, title, company_id, category, apply_id, name } =
		useLocalSearchParams();
	const { user, role } = useAuth();
	const {
		toggleWishlistJob,
		getWishlistJobs,
		isJobInWishlist,
		isJobApplied,
		applyToJob,
		getById,
		confirmApplication,
		selectApplication,
		refuseApplication,
	} = useDataContext();

	const [isInWishlist, setIsInWishlist] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isSelected, setIsSelected] = useState(false);
	const [isRefused, setIsRefused] = useState(false);

	const [application, setApplication] = useState([]);
	// const [totalCount, setTotalCount] = useState(0);

	const loadData = async () => {
		const data = await getById(
			"applies",
			apply_id,
			"*,jobs(*), profiles(*)"
		);
		setApplication(data);
		setIsConfirmed(data.isConfirmed);
		setIsSelected(data.isSelected);
		setIsRefused(data.isRefused);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);

	// const handleToggle = async () => {
	// 	const isNowInWishlist = await toggleWishlistJob(id, user.id);
	// 	setIsInWishlist(isNowInWishlist);
	// };

	const handleSelect = async (bool) => {
		const isNowSelected = await selectApplication(apply_id, bool);
		setIsSelected(bool);
	};

	const handleConfirm = async () => {
		const isNowConfirmed = await confirmApplication(apply_id);
		setIsConfirmed(true);
		setIsRefused(false);
	};

	const handleRefuse = async () => {
		const isNowRefused = await refuseApplication(apply_id);
		setIsRefused(true);
		setIsConfirmed(false);
	};

	const checkWishlist = async () => {
		const inWishlist = await isJobInWishlist(id, user.id);
		setIsInWishlist(inWishlist);
	};

	const checkApplication = async () => {
		const applied = await isJobApplied(user.id, id);
		setIsApplied(applied);
	};

	// useEffect(() => {
	// 	checkApplication();
	// }, [user, id]);

	useFocusEffect(
		useCallback(() => {
			checkWishlist();
		}, [])
	);

	useFocusEffect(
		useCallback(() => {
			checkApplication();
		}, [user, id])
	);

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "white" }}>
			<VStack style={{ padding: 15, gap: 15 }}>
				<VStack
					style={{
						justifyContent: "center",
						alignItems: "flex-start",
						gap: 5,
						marginBottom: 15,
					}}>
					<Heading>Candidature</Heading>
					<Text size='xs' italic>
						ID : {application.id}
					</Text>
				</VStack>
				<JobCard
					id={application?.jobs?.id}
					title={application?.jobs?.title}
					category={application?.jobs?.category}
					company_id={application?.jobs?.company_id}
					city={application?.jobs?.city}
					department={application?.jobs?.departmentcode}
				/>
				{role === "pro" && (
					<VStack>
						<Heading size='md' className='mb-1'>
							{application?.profiles?.lastname +
								" " +
								application?.profiles?.firstname}
						</Heading>
						<Button
							onPress={() =>
								router.push({
									pathname: "/profile",
									params: {
										profile_id: application.candidate_id,
									},
								})
							}>
							<ButtonText>Voir profil</ButtonText>
						</Button>
					</VStack>
				)}
				<HStack
					style={{
						// backgroundColor: "lightgray",
						padding: 10,
						marginTop: 15,
						justifyContent: "space-between",
						alignItems: "center",
						gap: 15,
					}}>
					<VStack style={{ alignItems: "center", gap: 5, width: 60 }}>
						<Center
							style={{
								height: 30,
								width: 30,
								backgroundColor: "lightgreen",
								borderRadius: 15,
							}}>
							<Check size={16} />
						</Center>
						<Text size='xs'>Envoyé</Text>
					</VStack>
					<Divider
						style={{
							backgroundColor: "#ccc",
							height: 2,
							width: 45,
							marginBottom: 20,
						}}
					/>
					{isSelected === null && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "beige",
									borderRadius: 15,
								}}>
								<Hourglass size={16} />
							</Center>
							<Text size='xs'>Selection</Text>
						</VStack>
					)}
					{isSelected === true && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "lightgreen",
									borderRadius: 15,
								}}>
								<Check size={16} />
							</Center>
							<Text size='xs'>Selectionné</Text>
						</VStack>
					)}
					{isSelected === false && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "lightcoral",
									borderRadius: 15,
								}}>
								<X size={16} />
							</Center>
							<Text size='xs' style={{ textAlign: "center" }}>
								Refusé
							</Text>
						</VStack>
					)}
					<Divider
						style={{
							backgroundColor: "#ccc",
							height: 2,
							width: 45,
							marginBottom: 20,
						}}
					/>
					{isConfirmed === null && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "beige",
									borderRadius: 15,
								}}>
								{isSelected === false ? (
									<CircleSlash size={16} />
								) : (
									<Hourglass size={16} />
								)}
							</Center>
							<Text size='xs'>Validation</Text>
						</VStack>
					)}
					{isConfirmed === false && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "lightcoral",
									borderRadius: 15,
								}}>
								<X size={16} />
							</Center>
							<Text size='xs'>Refusé</Text>
						</VStack>
					)}
					{isConfirmed === true && (
						<VStack
							style={{ alignItems: "center", gap: 5, width: 60 }}>
							<Center
								style={{
									height: 30,
									width: 30,
									backgroundColor: "lightgreen",
									borderRadius: 15,
								}}>
								<Check size={16} />
							</Center>
							<Text size='xs'>Validé</Text>
						</VStack>
					)}
				</HStack>
				{role === "pro" && (
					<VStack space='md'>
						{isSelected === null && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={() => handleSelect(true)}
									isDisabled={isSelected ? true : false}>
									<ButtonText>Sélectionner</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={() => handleSelect(false)}
									isDisabled={isSelected ? true : false}>
									<ButtonText>Refuser</ButtonText>
								</Button>
							</HStack>
						)}
						{isSelected === true && isConfirmed === null && (
							<HStack
								style={{
									gap: 10,
									justifyContent: "center",
									width: "100%",
								}}>
								<Button
									style={{ width: "49%" }}
									action='positive'
									onPress={handleConfirm}
									isDisabled={isConfirmed ? true : false}>
									<ButtonText>
										{isConfirmed ? "Confirmé" : "Confirmer"}
									</ButtonText>
								</Button>
								<Button
									style={{ width: "49%" }}
									action='negative'
									onPress={handleRefuse}
									isDisabled={isRefused ? true : false}>
									<ButtonText>
										{isRefused ? "Refusé" : "Refuser"}
									</ButtonText>
								</Button>
							</HStack>
						)}
					</VStack>
				)}
				{isConfirmed && (
					<Button
						onPress={() =>
							router.push({
								pathname: "/contract",
								params: {
									apply_id: application.id,
									candidate_id: application.candidate_id,
									company_id: application.company_id,
									job_id: application.job_id,
								},
							})
						}>
						<ButtonText>
							{role === "pro"
								? "Voir le contrat"
								: "Voir & signer mon contrat"}
						</ButtonText>
					</Button>
				)}
				{/* {role === "candidat" && (
				<Button
					size='lg'
					variant='link'
					className='rounded-full p-3.5'
					onPress={handleToggle}>
					<ButtonIcon as={isInWishlist ? BookmarkCheck : Bookmark} />
				</Button>
			)}
			{role === "candidat" && (
				<Button
					disabled={isApplied ? true : false}
					variant={isApplied ? "outline" : "solid"}
					onPress={handleApply}>
					<ButtonText>
						{isApplied ? "Vous avez déjà postulé" : "Postuler"}
					</ButtonText>
				</Button>
			)} */}
			</VStack>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	card: {
		width: "100%",
	},
});

export default ApplicationScreen;
