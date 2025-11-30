import { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import {
	Animated,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TextInput,
	View,
	StyleSheet,
} from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import ProCardForm from "@/components/ProCardForm";

const ITEMS_PER_PAGE = 10;

export default function AddProCardScreen() {
	const { signIn, user } = useAuth();
	const { getAll } = useDataContext();

	const [page, setPage] = useState(1);
	const [procards, setProcards] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const loadData = async () => {
		const { data, totalCount } = await getAll(
			"procards",
			"category, isValid, validity_date",
			`&profile_id=eq.${user.id}&isDeleted=eq.false`,
			page,
			ITEMS_PER_PAGE,
			"created_at.desc"
		);
		setProcards(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [page])
	);

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Ajuste si tu as un header
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps='handled'>
				<View style={styles.container}>
					<Text style={styles.title}>Nouvelle carte pro</Text>
					<ProCardForm procards={procards} />
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
	uuid: {
		fontSize: 16,
		color: "gray",
	},
});
