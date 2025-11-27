import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const ProfileScreen = () => {
	const { accessToken, signOut, user } = useAuth();
	const { getById, getAll, create, remove } = useDataContext();
	const { profile_id } = useLocalSearchParams();

	const [profile, setProfile] = useState(null);
	const [isAdded, setIsAdded] = useState(false);
	const [listUUID, setListUUID] = useState(null);

	const loadData = async () => {
		const data = await getById("profiles", profile_id, `*`);
		console.log("data profile :", data);
		setProfile(data);
	};

	const loadList = async () => {
		const { data, totalCount } = await getAll(
			"profilelist",
			"*",
			`&candidate_id=eq.${profile_id}&company_id=eq.${user.id}`,
			1,
			1,
			"created_at.desc"
		);
		console.log("total count :", totalCount, data);
		totalCount === 1 && setIsAdded(true);
		totalCount === 1 && setListUUID(data[0].id);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
			user && profile_id && loadList();
		}, [])
	);

	useEffect(() => {
		console.log("list profile uuid :", listUUID);
	}, [listUUID]);

	const handleToggle = () => {
		if (isAdded) {
			handleRemove();
		} else {
			handleAdd();
		}
	};

	const handleAdd = async () => {
		console.log("handle add in profile list ok !");
		try {
			const newProfile = await create("profilelist", {
				candidate_id: profile_id,
				company_id: user.id,
			});
			console.warn("new profile in list :", newProfile);
			setIsAdded(true);
			loadList();
		} catch (err) {
			console.error(
				"Error add in profile list:",
				err.response?.data || err.message
			);
		}
	};

	const handleRemove = async () => {
		console.log("handle add in profile list ok !");
		try {
			const profil = await remove("profilelist", listUUID);
			console.log("remove from list :", profil);
			setIsAdded(false);
			// setListUUID(null);
			loadList();
		} catch (err) {
			console.error(
				"Error remove in profile list:",
				err.response?.data || err.message
			);
		}
	};

	return (
		<VStack style={{ padding: 15 }}>
			<VStack
				style={{
					height: 250,
					justifyContent: "center",
					alignItems: "center",
				}}>
				{profile?.avatar_url && (
					<Image
						size='xl'
						source={{ uri: profile.avatar_url }}
						alt='Avatar image'
					/>
				)}
			</VStack>
			<Heading>Profile Screen</Heading>
			<Text>{profile_id}</Text>
			<Button onPress={handleToggle}>
				<ButtonText>{isAdded ? "is Added" : "Add"}</ButtonText>
			</Button>
		</VStack>
	);
};

export default ProfileScreen;
