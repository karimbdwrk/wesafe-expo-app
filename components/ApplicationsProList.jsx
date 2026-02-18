import React, { useCallback, useState, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { createSupabaseClient } from "@/lib/supabase";

import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";

import ApplyCard from "@/components/ApplyCard";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const ApplicationsProList = ({ userId, title }) => {
	const { getAll, isLoading } = useDataContext();
	const { accessToken } = useAuth();

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

	useEffect(() => {
		if (userId) {
			console.log("userId in ApplicationsProList:", userId);
			loadDataApplications();
		}
	}, [userId]);

	// Abonnement real-time pour mettre à jour les applications
	useEffect(() => {
		if (!userId || !accessToken) return;

		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`applications-list-widget-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "applications",
					filter: `company_id=eq.${userId}`,
				},
				(payload) => {
					console.log(
						"✅ Real-time applications widget:",
						payload.new.id,
						"- company_notification:",
						payload.new.company_notification,
					);
					// Mettre à jour l'application dans la liste en préservant les relations
					setApplications((prevApps) =>
						prevApps.map((app) =>
							app.id === payload.new.id
								? {
										...app,
										current_status:
											payload.new.current_status,
										candidate_notification:
											payload.new.candidate_notification,
										company_notification:
											payload.new.company_notification,
										updated_at: payload.new.updated_at,
										isRefused: payload.new.isRefused,
									}
								: app,
						),
					);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, accessToken]);

	return (
		<VStack>
			<Heading style={{ paddingBottom: 15 }}>{title}</Heading>
			{applications.map((app) => (
				<ApplyCard
					key={`${app.id}-${app.candidate_notification}-${app.company_notification}-${app.current_status}`}
					id={app.job_id}
					name={app.profiles.lastname + " " + app.profiles.firstname}
					title={app.jobs.title}
					category={app.jobs.category}
					company_id={app.company_id}
					isRefused={app.isRefused}
					apply_id={app.id}
					status={app.current_status}
					application={app}
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
