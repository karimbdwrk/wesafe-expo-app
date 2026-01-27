import { useRouter, useFocusEffect } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";

const Documents = () => {
	const router = useRouter();

	return (
		<Box flex={1} bg='$backgroundLight0' style={{ padding: 15 }}>
			<VStack space='xl' p='$6'>
				<Text>Documents</Text>
				<Button onPress={() => router.push("/iddocumentverification")}>
					<ButtonText>ID Document</ButtonText>
				</Button>
				<Button
					onPress={() =>
						router.push("/socialsecuritydocumentverification")
					}>
					<ButtonText>Social Security Document</ButtonText>
				</Button>
			</VStack>
		</Box>
	);
};

export default Documents;
