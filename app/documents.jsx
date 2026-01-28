import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icon";

import { useAuth } from "@/context/AuthContext";

const Documents = () => {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const router = useRouter();

	const [socialSecurityDocumentVerified, setSocialSecurityDocumentVerified] =
		useState(false);
	const [IDDocumentVerified, setIDDocumentVerified] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadUserData(user.id, accessToken);
		}, []),
	);

	useEffect(() => {
		console.log("User profile updated:", userProfile);
		setSocialSecurityDocumentVerified(
			userProfile?.social_security_verification_status === "verified",
		);
		setIDDocumentVerified(
			userProfile?.id_verification_status === "verified",
		);
	}, [userProfile]);

	return (
		<Box flex={1} bg='$backgroundLight0' style={{ padding: 15 }}>
			<VStack space='xl' p='$6'>
				<Text>Documents</Text>
				<Button onPress={() => router.push("/iddocumentverification")}>
					<ButtonText>ID Document</ButtonText>
					{IDDocumentVerified && <ButtonIcon as={CheckIcon} />}
				</Button>
				<Button
					onPress={() =>
						router.push("/socialsecuritydocumentverification")
					}>
					<ButtonText>Social Security Document</ButtonText>
					{socialSecurityDocumentVerified && (
						<ButtonIcon as={CheckIcon} />
					)}
				</Button>
			</VStack>
		</Box>
	);
};

export default Documents;
