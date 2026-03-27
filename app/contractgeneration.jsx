import React from "react";

import { useLocalSearchParams } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

const ContractGenerationScreen = () => {
	const { application_id } = useLocalSearchParams();
	return (
		<VStack>
			<Heading>Contract Generation</Heading>
			<Text>Application ID: {application_id}</Text>
		</VStack>
	);
};

export default ContractGenerationScreen;
