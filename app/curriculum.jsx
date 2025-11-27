import React, { useState, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";

import { Plus } from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const CurriculumScreen = () => {
	const scrollRef = useRef(null);
	const { user } = useAuth();
	const { getAll, remove } = useDataContext();

	const [refreshing, setRefreshing] = useState(false);

	const router = useRouter();

	const [experiences, setExperiences] = useState([]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, []);

	const loadData = async () => {
		const { data, totalCount } = await getAll(
			"experiences",
			"*",
			`&profile_id=eq.${user.id}`,
			1,
			20,
			"start_date.desc"
		);
		console.log(data, data.length);
		setExperiences(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);

	const handleRemove = async (id) => {
		const removeExp = await remove("experiences", id);
		console.log("removeExp :", removeExp);
		loadData();
	};

	return (
		<VStack style={{ flex: 1, backgroundColor: "white" }}>
			<ScrollView
				ref={scrollRef}
				style={styles.scrollView}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				<VStack style={{ gap: 15 }}>
					{experiences.map((exp) => (
						<Card key={exp.id} variant='filled'>
							<Heading>{exp.title}</Heading>
							<Text>{exp.id}</Text>
							<Button onPress={() => handleRemove(exp.id)}>
								<ButtonText>Supprimer</ButtonText>
							</Button>
						</Card>
					))}
				</VStack>
			</ScrollView>
			<VStack
				style={{
					position: "fixed",
					paddingBotttom: 90,
					bottom: 30,
					padding: 15,
					backgroundColor: "white",
				}}>
				<Button onPress={() => router.push("/addexperience")}>
					<ButtonIcon as={Plus} />
					<ButtonText>Ajouter une experience</ButtonText>
				</Button>
			</VStack>
		</VStack>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		backgroundColor: "white",
	},
	scrollView: {
		flex: 1,
		width: "100%",
		padding: 15,
		backgroundColor: "white",
	},
	jobList: {
		flex: 1,
		gap: 15,
		width: "100%",
		marginVertical: 15,
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
});

export default CurriculumScreen;
