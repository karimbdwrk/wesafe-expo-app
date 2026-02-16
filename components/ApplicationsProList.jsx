import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";

import ApplyCard from "@/components/ApplyCard";

import { useDataContext } from "@/context/DataContext";

const ApplicationsProList = ({ userId, title }) => {
	const { getAll, isLoading } = useDataContext();

	const [applications, setApplications] = useState([]);

	const router = useRouter();

	const loadDataApplications = async () => {
		const { data } = await getAll(
			"applications",
			"*,jobs(*),profiles(*)",
			`&jobs.isArchived=eq.FALSE&jobs=not.is.null&company_id=eq.${userId}`,
			1,
			5,
			"created_at.desc",
		);
		setApplications(data);
	};

	useFocusEffect(
		useCallback(() => {
			console.log("userId in ApplicationsProList:", userId);
			userId && loadDataApplications();
		}, [userId]),
	);

	return (
		<VStack>
			<Heading style={{ paddingBottom: 15 }}>{title}</Heading>
			{applications.map((app) => (
				<ApplyCard
					key={app.id}
					id={app.job_id}
					name={app.profiles.lastname + " " + app.profiles.firstname}
					title={app.jobs.title}
					category={app.jobs.category}
					company_id={app.company_id}
					isRefused={app.isRefused}
					apply_id={app.id}
					status={app.current_status}
				/>
			))}
			<Button>
				<ButtonText onPress={() => router.push("/applicationspro")}>
					Voir toutes les candidatures
				</ButtonText>
			</Button>
		</VStack>
	);
};

export default ApplicationsProList;
