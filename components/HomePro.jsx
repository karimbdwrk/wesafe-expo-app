import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Plus } from "lucide-react-native";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import HomeChartsProMini from "./HomeChartsProMini";

import { useTheme } from "@/context/ThemeContext";

const HomePro = () => {
	const router = useRouter();
	const { isDark } = useTheme();

	return (
		<Box>
			{/* CTA nouvelle annonce */}
			<TouchableOpacity
				onPress={() => router.push("/postjob")}
				activeOpacity={0.75}
				className='mb-4'>
				<Box
					style={{
						backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
						borderRadius: 14,
						borderWidth: 1,
						borderColor: isDark ? "#1d4ed8" : "#bfdbfe",
						padding: 16,
						flexDirection: "row",
						alignItems: "center",
						gap: 14,
					}}>
					<Box
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							backgroundColor: "#2563eb",
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Plus size={22} color='#ffffff' />
					</Box>
					<VStack style={{ flex: 1 }} space='xs'>
						<Text
							style={{
								fontWeight: "700",
								fontSize: 15,
								color: isDark ? "#93c5fd" : "#1d4ed8",
							}}>
							Créer une nouvelle annonce
						</Text>
						<Text
							size='xs'
							style={{
								color: isDark ? "#60a5fa" : "#3b82f6",
							}}>
							Publiez une offre classique ou Last Minute
						</Text>
					</VStack>
					<ChevronRight
						size={18}
						color={isDark ? "#3b82f6" : "#2563eb"}
					/>
				</Box>
			</TouchableOpacity>
			<HomeChartsProMini />
		</Box>
	);
};

export default HomePro;
