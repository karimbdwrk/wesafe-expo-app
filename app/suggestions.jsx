import { useLocalSearchParams } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const SuggestionsScreen = () => {
	const params = useLocalSearchParams();
	const regionCode = params.region_code;
	const { isDark } = useTheme();
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;

	return (
		<VStack className='flex-1 p-4'>
			<Heading size='lg' className='mb-4' style={{ color: textPrimary }}>
				Suggestions screen
			</Heading>
			<Text style={{ color: textPrimary }}>
				Region code: {regionCode}
			</Text>
		</VStack>
	);
};

export default SuggestionsScreen;
