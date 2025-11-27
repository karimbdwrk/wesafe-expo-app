import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	Platform,
} from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

import SubscriptionPaymentSheet from "../components/SubscriptionPaymentSheet";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

const SubscriptionScreen = () => {
	const {
		accessToken,
		userCompany,
		user,
		hasSubscription,
		checkSubscription,
	} = useAuth();
	const { getAll } = useDataContext();

	const router = useRouter();

	const [subscriptions, setSubscriptions] = useState([]);

	const getAllSubscription = async () => {
		console.log("get all subs");
		const { data, totalCount } = await getAll(
			"subscriptions",
			"*",
			``,
			1,
			5,
			"created_at.desc"
		);
		console.log(data, totalCount);
		setSubscriptions(data);
		// setTotalCount(totalCount);
	};

	useFocusEffect(
		useCallback(() => {
			checkSubscription(user.id, accessToken);
		}, [])
	);

	useEffect(() => {
		console.log("has sub in sub screen :", hasSubscription);
		getAllSubscription();
	}, [hasSubscription]);

	return (
		<VStack style={{ padding: 15 }}>
			<Heading>Subscription Screen</Heading>
			<Text>This is subscription screen</Text>
			<Text>{hasSubscription ? "Abonné" : "Non abonné"}</Text>
			{hasSubscription && subscriptions.length > 0 && (
				<>
					{subscriptions[0].status === "active" ? (
						<Text>
							Renouvellement de l'abonnement :{" "}
							{subscriptions[0].current_period_end}
						</Text>
					) : (
						<Text>
							Abonnement jusqu'au :{" "}
							{subscriptions[0].current_period_end}
						</Text>
					)}
				</>
			)}
			{!hasSubscription && (
				<VStack style={{ marginVertical: 15 }}>
					<SubscriptionPaymentSheet
						// user_id={user.id}
						company_id={userCompany.id}
						email={user.email}
					/>
				</VStack>
			)}
			{hasSubscription &&
				subscriptions.length > 0 &&
				subscriptions[0].status === "active" && (
					<VStack style={{ marginVertical: 15 }}>
						<Button
							onPress={() =>
								router.push({
									pathname: "/cancelsubscription",
									params: {
										subscription_id:
											subscriptions[0]
												.stripe_subscription_id,
									},
								})
							}>
							<ButtonText>Cancel subscription</ButtonText>
						</Button>
					</VStack>
				)}
		</VStack>
	);
};

export default SubscriptionScreen;
