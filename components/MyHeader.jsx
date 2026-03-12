import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function MyHeader({ title, headerRight, showBack }) {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			{/* LEFT */}
			<View style={styles.left}>
				{showBack && (
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name='chevron-back' size={26} color='black' />
					</TouchableOpacity>
				)}
			</View>

			{/* CENTER */}
			<Text style={styles.title}>{title}</Text>

			{/* RIGHT */}
			<View style={styles.right}>
				{headerRight ? headerRight() : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 90,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
	},
	left: {
		width: 60,
	},
	right: {
		width: 60,
		alignItems: "flex-end",
	},
	title: {
		flex: 1,
		textAlign: "center",
		color: "black",
		fontSize: 18,
		fontWeight: "600",
	},
});
