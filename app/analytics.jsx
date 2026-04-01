import HomeChartsPro from "../components/HomeChartsPro";
import { ScrollView } from "react-native-gesture-handler";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const Analytics = () => {
	const { isDark } = useTheme();

	return (
		<ScrollView
			style={{
				flex: 1,
				padding: 10,
				paddingTop: 15,
				paddingBottom: 30,
				backgroundColor: isDark
					? Colors.dark.background
					: Colors.light.background,
			}}>
			<HomeChartsPro />
		</ScrollView>
	);
};

export default Analytics;
