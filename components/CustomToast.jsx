import { View } from "react-native";
import { ToastTitle, ToastDescription } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const CustomToast = ({ id, icon, color, title, description }) => {
	const { isDark } = useTheme();
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
			<VStack style={{ flex: 1 }}>
				<ToastTitle style={{ color: textPrimary }}>{title}</ToastTitle>
				{description ? (
					<ToastDescription style={{ color: textSecondary }}>
						{description}
					</ToastDescription>
				) : null}
			</VStack>
		</View>
	);
};

export default CustomToast;
