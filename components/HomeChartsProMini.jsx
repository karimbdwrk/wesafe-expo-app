import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { ChartNoAxesCombined } from "lucide-react-native";

const HomeChartsProMini = () => {
	const router = useRouter();
	return (
		<Box>
			<Text>HomeChartsProMini</Text>
			<Button
				size='lg'
				action='primary'
				variant='outline'
				style={{
					borderColor: "#3b82f6",
					backgroundColor: "transparent",
					color: "#3b82f6",
					borderRadius: 8,
				}}
				onPress={() => router.push("/analytics")}>
				<ButtonIcon
					as={ChartNoAxesCombined}
					style={{
						color: "#3b82f6",
					}}
				/>
				<ButtonText
					style={{
						color: "#3b82f6",
					}}>
					Analytics
				</ButtonText>
			</Button>
		</Box>
	);
};

export default HomeChartsProMini;
