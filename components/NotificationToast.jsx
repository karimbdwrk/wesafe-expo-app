import React, { useEffect, useRef } from "react";
import {
	Animated,
	SafeAreaView,
	Pressable,
	PanResponder,
	Platform,
	View,
	Text,
	useWindowDimensions,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { useColorScheme } from "nativewind";
import Colors from "@/constants/Colors";
import {
	Bell,
	Briefcase,
	FileText,
	MessageCircleMore,
} from "lucide-react-native";

const NotificationToast = ({ notification, onPress, onDismiss }) => {
	const translateY = useRef(new Animated.Value(-120)).current;
	const { colorScheme } = useColorScheme();
	const { width: screenWidth } = useWindowDimensions();
	const isDark = colorScheme === "dark";
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;

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
			case "new_message":
				return MessageCircleMore;
			default:
				return Bell;
		}
	};

	const getNotificationColor = (type) => {
		switch (type) {
			case "application_selected":
			case "contract_signed_pro":
				return isDark ? Colors.dark.success : Colors.light.success;
			case "application_rejected":
				return isDark ? Colors.dark.danger : Colors.light.danger;
			case "message":
			case "new_message":
				return isDark ? Colors.dark.tint : Colors.light.tint;
			default:
				return isDark ? Colors.dark.tint : Colors.light.tint;
		}
	};

	const IconComponent = getNotificationIcon(notification.type);
	const accentColor = getNotificationColor(notification.type);

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
					marginHorizontal: 10,
					marginTop: 8,
				}}>
				<View
					style={{
						backgroundColor: cardBg,
						borderRadius: 8,
						borderWidth: 1,
						borderColor: accentColor,
						padding: 12,
						flexDirection: "row",
						alignItems: "flex-start",
						gap: 8,
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.15,
						shadowRadius: 4,
						elevation: 5,
						width: screenWidth - 20,
					}}
					onTouchEnd={handlePress}>
					<Icon as={IconComponent} size='lg' color={accentColor} />
					<View style={{ flex: 1 }}>
						<Text
							style={{
								fontWeight: "600",
								fontSize: 14,
								color: textPrimary,
							}}>
							{notification.title}
						</Text>
						{notification.body ? (
							<Text
								numberOfLines={2}
								style={{
									fontSize: 13,
									color: textSecondary,
									marginTop: 2,
								}}>
								{notification.body}
							</Text>
						) : null}
					</View>
				</View>
			</Animated.View>
		</SafeAreaView>
	);
};

export default NotificationToast;
