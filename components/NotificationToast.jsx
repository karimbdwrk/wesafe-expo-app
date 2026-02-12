import React, { useEffect, useRef } from "react";
import {
	Animated,
	SafeAreaView,
	Pressable,
	PanResponder,
	Platform,
} from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import {
	Bell,
	Briefcase,
	FileText,
	MessageCircleMore,
} from "lucide-react-native";

const NotificationToast = ({ notification, onPress, onDismiss }) => {
	const translateY = useRef(new Animated.Value(-100)).current;

	useEffect(() => {
		// Animation d'entrée
		Animated.spring(translateY, {
			toValue: 0,
			useNativeDriver: true,
			tension: 65,
			friction: 8,
		}).start();

		return () => {
			// Animation de sortie
			Animated.timing(translateY, {
				toValue: -100,
				duration: 200,
				useNativeDriver: true,
			}).start();
		};
	}, []);

	const handleDismiss = () => {
		Animated.timing(translateY, {
			toValue: -100,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			if (onDismiss) onDismiss();
		});
	};

	const handlePress = () => {
		console.log("Toast pressed");
		try {
			if (onPress) {
				onPress();
			}
		} catch (error) {
			console.error("Error in toast onPress:", error);
		}
	};

	// PanResponder pour gérer le swipe
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				return Math.abs(gestureState.dy) > 5;
			},
			onPanResponderMove: (_, gestureState) => {
				if (gestureState.dy < 0) {
					translateY.setValue(gestureState.dy);
				}
			},
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dy < -50) {
					// Swipé vers le haut
					handleDismiss();
				} else if (
					Math.abs(gestureState.dx) < 10 &&
					Math.abs(gestureState.dy) < 10
				) {
					// Tap (pas de mouvement significatif)
					Animated.spring(translateY, {
						toValue: 0,
						useNativeDriver: true,
					}).start();
					handlePress();
				} else {
					// Retour à la position
					Animated.spring(translateY, {
						toValue: 0,
						useNativeDriver: true,
						tension: 65,
						friction: 8,
					}).start();
				}
			},
		}),
	).current;

	const getNotificationIcon = (type) => {
		switch (type) {
			case "application":
			case "application_selected":
			case "application_rejected":
			case "job_offer":
				return Briefcase;
			case "contract_sent":
			case "contract_signed_candidate":
			case "contract_signed_pro":
				return FileText;
			case "message":
				return MessageCircleMore;
			default:
				return Bell;
		}
	};

	const IconComponent = getNotificationIcon(notification.type);

	return (
		<SafeAreaView
			style={{
				position: "absolute",
				top: Platform.OS === "android" ? 40 : 0,
				left: 0,
				right: 0,
				zIndex: 9999,
			}}>
			<Animated.View
				{...panResponder.panHandlers}
				style={{
					transform: [{ translateY }],
				}}>
				<HStack
					style={{
						backgroundColor: "white",
						borderRadius: 12,
						padding: 16,
						marginHorizontal: 16,
						marginTop: 8,
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 8,
						elevation: 5,
						alignItems: "center",
						gap: 12,
					}}>
					<Icon
						as={IconComponent}
						size='lg'
						style={{ color: "#2563eb" }}
					/>
					<VStack style={{ flex: 1, gap: 4 }}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 14,
								color: "#1f2937",
							}}>
							{notification.title}
						</Text>
						<Text
							numberOfLines={2}
							style={{
								fontSize: 13,
								color: "#6b7280",
							}}>
							{notification.body}
						</Text>
					</VStack>
				</HStack>
			</Animated.View>
		</SafeAreaView>
	);
};

export default NotificationToast;
