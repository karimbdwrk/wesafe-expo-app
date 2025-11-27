import React from "react";
import { useRouter } from "expo-router";

import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { SafeAreaView } from "react-native";
import { Power } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";

const FinalizeRegistrationScreen = () => {
	const router = useRouter();
	const { user, signOut } = useAuth();

	return (
		<SafeAreaView>
			<VStack
				style={{
					justifyContent: "center",
					alignItems: "center",
					gap: 20,
					width: "100%",
					height: "100%",
					padding: 15,
				}}>
				<Button
					style={{ position: "absolute", top: 15, right: 15 }}
					onPress={signOut}
					action='negative'
					variant='link'>
					<ButtonIcon as={Power} />
				</Button>
				<VStack>
					<Heading>Finalize Registration</Heading>
					<Text>
						Thank you for registering! Please complete your profile.
					</Text>
				</VStack>
				<VStack
					style={{
						gap: 20,
						width: "100%",
					}}>
					<Button onPress={() => router.push("/createprofile")}>
						<ButtonText>Un candidat</ButtonText>
					</Button>
					<Button onPress={() => router.push("/createcompany")}>
						<ButtonText>Une entreprise</ButtonText>
					</Button>
				</VStack>
			</VStack>
		</SafeAreaView>
	);
};

export default FinalizeRegistrationScreen;
