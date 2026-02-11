import React, { useState } from "react";
import { View, SafeAreaView, StyleSheet, Animated, Easing } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { ArrowLeft } from "lucide-react-native";
import MessageThread from "@/components/MessageThread";
import { useAuth } from "@/context/AuthContext";

// Animation de points pour l'indicateur de saisie
const TypingAnimation = () => {
	const dot1Opacity = React.useRef(new Animated.Value(0)).current;
	const dot2Opacity = React.useRef(new Animated.Value(0)).current;
	const dot3Opacity = React.useRef(new Animated.Value(0)).current;

	React.useEffect(() => {
		const animateDot = (dotOpacity, delay) => {
			return Animated.sequence([
				Animated.delay(delay),
				Animated.timing(dotOpacity, {
					toValue: 1,
					duration: 300,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
				Animated.timing(dotOpacity, {
					toValue: 0,
					duration: 300,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
			]);
		};

		const animation = Animated.loop(
			Animated.parallel([
				animateDot(dot1Opacity, 0),
				animateDot(dot2Opacity, 200),
				animateDot(dot3Opacity, 400),
			]),
		);

		animation.start();

		return () => animation.stop();
	}, []);

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				marginLeft: 6,
			}}>
			<Animated.View
				style={{
					width: 5,
					height: 5,
					borderRadius: 2.5,
					backgroundColor: "#667eea",
					marginHorizontal: 1.5,
					opacity: dot1Opacity,
				}}
			/>
			<Animated.View
				style={{
					width: 5,
					height: 5,
					borderRadius: 2.5,
					backgroundColor: "#667eea",
					marginHorizontal: 1.5,
					opacity: dot2Opacity,
				}}
			/>
			<Animated.View
				style={{
					width: 5,
					height: 5,
					borderRadius: 2.5,
					backgroundColor: "#667eea",
					marginHorizontal: 1.5,
					opacity: dot3Opacity,
				}}
			/>
		</View>
	);
};

const MessagingScreen = () => {
	const router = useRouter();
	const { apply_id, other_party_name, is_read_only } = useLocalSearchParams();
	const [isTyping, setIsTyping] = useState(false);
	const { user } = useAuth();

	const isReadOnly = is_read_only === "true";

	// const handleBackPress = () => {
	// 	router.push({
	// 		pathname: "/application",
	// 		params: { apply_id: apply_id, id: user.id },
	// 	});
	// };

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<HStack
					space='md'
					className='items-center p-4 border-b border-outline-200'>
					<Button
						size='sm'
						variant='link'
						onPress={() => router.back()}>
						<ButtonIcon as={ArrowLeft} />
					</Button>
					<View style={{ flex: 1, minHeight: 44 }}>
						<Heading size='md'>
							{other_party_name || "Messagerie"}
						</Heading>
						{isTyping && !isReadOnly && (
							<HStack space='xs' style={styles.typingIndicator}>
								<Text style={styles.typingText}>
									en train d'écrire
								</Text>
								<TypingAnimation />
							</HStack>
						)}
					</View>
				</HStack>
			</View>

			<View style={styles.content}>
				<MessageThread
					applyId={apply_id}
					isReadOnly={isReadOnly}
					otherPartyName={other_party_name}
					onTypingChange={setIsTyping}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	content: {
		flex: 1,
	},
	typingIndicator: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
		height: 16,
	},
	typingText: {
		fontSize: 10,
		color: "#9ca3af",
		fontStyle: "italic",
	},
});

export default MessagingScreen;
