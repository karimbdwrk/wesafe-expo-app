import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const StampScreen = () => {
	const { user, userCompany, refreshUser } = useAuth();

	const router = useRouter();

	// useEffect(() => {
	// 	console.log("userCompany stamp url:", userCompany?.stamp_url);
	// }, [userCompany]);

	useFocusEffect(
		useCallback(() => {
			console.log("refreshing user in StampScreen");
			refreshUser();
			if (userCompany) {
				console.log(
					"userCompany Stamp in StampScreen:",
					userCompany?.stamp_url
				);
			}
		}, [])
	);

	return (
		<VStack
			style={{
				backgroundColor: "pink",
				flex: 1,
				padding: 15,
			}}>
			<VStack
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "yellow",
					height: 500,
				}}>
				{userCompany?.stamp_url && (
					<Image
						size='2xl'
						source={{
							uri: userCompany.stamp_url,
						}}
						resizeMode='contain'
						alt='image'
					/>
				)}
			</VStack>
			<Button onPress={() => router.push("/updatestamp")}>
				<ButtonText>Update tampon</ButtonText>
			</Button>
		</VStack>
	);
};

export default StampScreen;
