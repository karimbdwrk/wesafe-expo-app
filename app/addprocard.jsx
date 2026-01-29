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
	TouchableOpacity,
} from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import ProCardForm from "@/components/ProCardForm";
import SSIAPDiploma from "@/components/SSIAPDiploma";

const ITEMS_PER_PAGE = 10;

export default function AddProCardScreen() {
	const { signIn, user } = useAuth();
	const { getAll } = useDataContext();

	const [cardType, setCardType] = useState(null); // 'procard' ou 'ssiap'

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
			"created_at.desc",
		);
		setProcards(data);
		setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [page]),
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
					<Text style={styles.title}>Ajouter un document</Text>

					{/* Sélecteur de type de carte */}
					<View style={styles.cardTypeSelector}>
						<TouchableOpacity
							style={[
								styles.cardTypeButton,
								cardType === "procard" &&
									styles.cardTypeButtonActive,
							]}
							onPress={() => setCardType("procard")}>
							<Text
								style={[
									styles.cardTypeButtonText,
									cardType === "procard" &&
										styles.cardTypeButtonTextActive,
								]}>
								Carte Pro
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.cardTypeButton,
								cardType === "ssiap" &&
									styles.cardTypeButtonActive,
							]}
							onPress={() => setCardType("ssiap")}>
							<Text
								style={[
									styles.cardTypeButtonText,
									cardType === "ssiap" &&
										styles.cardTypeButtonTextActive,
								]}>
								Diplôme SSIAP
							</Text>
						</TouchableOpacity>
					</View>

					{/* Affichage conditionnel des formulaires */}
					{cardType === "procard" && (
						<View style={styles.formContainer}>
							<Text style={styles.subtitle}>
								Nouvelle carte pro
							</Text>
							<ProCardForm procards={procards} />
						</View>
					)}

					{cardType === "ssiap" && (
						<View style={styles.formContainer}>
							<Text style={styles.subtitle}>
								Nouveau diplôme SSIAP
							</Text>
							<SSIAPDiploma />
						</View>
					)}

					{!cardType && (
						<View style={styles.placeholder}>
							<Text style={styles.placeholderText}>
								Sélectionnez un type de document à ajouter
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-start",
		width: "100%",
		paddingTop: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	subtitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 15,
		marginTop: 10,
	},
	cardTypeSelector: {
		flexDirection: "row",
		gap: 15,
		marginBottom: 30,
		paddingHorizontal: 20,
	},
	cardTypeButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: "#ccc",
		backgroundColor: "#fff",
		alignItems: "center",
	},
	cardTypeButtonActive: {
		borderColor: "#007AFF",
		backgroundColor: "#007AFF",
	},
	cardTypeButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	cardTypeButtonTextActive: {
		color: "#fff",
	},
	formContainer: {
		width: "100%",
		paddingHorizontal: 20,
	},
	placeholder: {
		marginTop: 50,
		paddingHorizontal: 40,
	},
	placeholderText: {
		fontSize: 16,
		color: "#999",
		textAlign: "center",
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
