import { View, Text } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useColorScheme } from "nativewind";
import Colors from "@/constants/Colors";

const CustomToast = ({ id, icon, color, title, description }) => {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;

	return (
		<View
			nativeID={id}
			style={{
				backgroundColor: cardBg,
				borderRadius: 8,
				borderWidth: 1,
				borderColor: color,
				padding: 12,
				flexDirection: "row",
				alignItems: "center",
				gap: 8,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 4,
				elevation: 4,
				minWidth: 260,
				maxWidth: 340,
			}}>
			<Icon as={icon} color={color} />
			<View style={{ flex: 1 }}>
				<Text style={{ color: textPrimary, fontWeight: "600", fontSize: 14 }}>
					{title}
				</Text>
				{description ? (
					<Text style={{ color: textSecondary, fontSize: 13, marginTop: 2 }}>
						{description}
					</Text>
				) : null}
			</View>
		</View>
	);
};

export default CustomToast;
