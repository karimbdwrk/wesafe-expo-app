import { useEffect, useRef, useState, useCallback } from "react";
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
import { useFocusEffect } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { toast } from "sonner-native";

import { Check } from "lucide-react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text } from "@/components/ui/text";
import CreateJobForm from "../components/CreateJobForm";
import CreateJobForm3 from "../components/CreateJobForm3";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

export default function AddJobScreen() {
	const {
		signIn,
		user,
		checkSubscription,
		hasSubscription,
		userCompany,
		loadUserData,
		accessToken,
	} = useAuth();
	const { getAll, isLoading } = useDataContext();

	const [jobCount, setJobCount] = useState(null);
	const [remainingJobs, setRemainingJobs] = useState(0);

	useEffect(() => {
		console.log("hasSubscription @ jobcount :", hasSubscription, jobCount);
		setRemainingJobs(3 - (jobCount || 0));
	}, [jobCount]);

	const fetchJobCount = async () => {
		console.log("hasSubscription :", hasSubscription);
		if (!user || hasSubscription) return; // Premium : ne rien faire

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30); // ← 30 derniers jours
		startDate.setHours(0, 0, 0, 0);
		const fromDate = startDate.toISOString();
		console.log("dates :", fromDate);

		const { data, totalCount } = await getAll(
			"jobs",
			"id,company_id",
			`&company_id=eq.${userCompany.id}&created_at=gte.${fromDate}`,
			1,
			5,
			"created_at.desc"
		);
		console.log("data :", data);
		console.log("count :", totalCount);
		setJobCount(totalCount);
	};

	useEffect(() => {
		loadUserData(userCompany.id, accessToken);
		fetchJobCount();
		console.log("company credits :", userCompany.last_minute_credits);
	}, [user]);

	const handleJobCreated = (isSubmitted) => {
		if (isSubmitted) {
			toast.success(`Job publié sur WeSafe`, {
				// style: { backgroundColor: "blue" },
				description: "Everything worked as expected.",
				duration: 2500,
				icon: <Check />,
			});
			console.log("Job soumis avec succès !");
			console.log("handleJobCreated ok!");
			loadUserData(userCompany.id, accessToken);
			fetchJobCount();
		} else {
			console.log("Job non soumis");
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Ajuste si tu as un header
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps='handled'>
				{!hasSubscription && jobCount !== null && (
					<View style={{ padding: 16, backgroundColor: "pink" }}>
						<Text
							style={{
								marginBottom: 12,
								fontWeight: "bold",
								color: "#555",
							}}>
							🎯 Vous pouvez encore poster {remainingJobs} annonce
							{remainingJobs !== 1 ? "s" : ""} ce mois-ci
						</Text>
					</View>
				)}
				<View style={{ padding: 16, backgroundColor: "lightgreen" }}>
					<Text
						style={{
							marginBottom: 12,
							fontWeight: "bold",
							color: "#555",
						}}>
						🎯 Vous avez {userCompany?.last_minute_credits} crédit
						{userCompany?.last_minute_credits !== 1 ? "s " : " "}
						pour des last minute jobs
					</Text>
				</View>
				{remainingJobs > 0 ? (
					<View style={styles.container}>
						<CreateJobForm3 />
					</View>
				) : (
					<Text>Abonnez-vous pour des annonces en illimité</Text>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
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
