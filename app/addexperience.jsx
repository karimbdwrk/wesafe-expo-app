import { useEffect, useRef, useState } from "react";
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

import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import CreateExpForm from "../components/CreateExpForm";

export default function AddExperienceScreen() {
	const { signIn, user } = useAuth();

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Ajuste si tu as un header
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps='handled'>
				<CreateExpForm />
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
