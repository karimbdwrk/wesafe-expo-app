import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import SvgQRCode from "react-native-qrcode-svg";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolate,
} from "react-native-reanimated";

import { Camera, User, QrCode, SquareUserRound } from "lucide-react-native";

import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Button, ButtonIcon } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";

import AvatarUploader from "@/components/AvatarUploader";

const FlipCardProfile = () => {
	const { user, userProfile, loadUserData } = useAuth();
	const { image } = useImage();

	const [profileUrl, setProfileUrl] = useState(null);

	const [flipped, setFlipped] = useState(false);
	const rotate = useSharedValue(0);

	// useFocusEffect(
	// 	useCallback(() => {
	// 		loadUserData();
	// 	}, [])
	// );

	useEffect(() => {
		if (user && user.id) {
			const url = `supabaseapp://profile/${user.id}`;
			setProfileUrl(url);
		}
	}, [user]);

	const flipCard = () => {
		console.log("FLIP !", flipped);
		setFlipped(!flipped);
		rotate.value = withTiming(flipped ? 0 : 180, { duration: 500 });
	};

	const flipCardToAvatar = () => {
		console.log("FLIP !", flipped);
		setFlipped(false);
		rotate.value = withTiming(0, { duration: 500 });
	};

	const frontAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotateY: `${interpolate(
						rotate.value,
						[0, 180],
						[0, 180]
					)}deg`,
				},
			],
			backfaceVisibility: "hidden",
		};
	});

	const backAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotateY: `${interpolate(
						rotate.value,
						[0, 180],
						[180, 360]
					)}deg`,
				},
			],
			backfaceVisibility: "hidden",
			position: "absolute",
		};
	});

	return (
		<VStack style={{ paddingTop: 20 }}>
			<VStack style={styles.container}>
				<VStack style={styles.flipContainer}>
					<Animated.View style={[styles.card, frontAnimatedStyle]}>
						{userProfile?.avatar_url ? (
							<Image
								source={{ uri: userProfile?.avatar_url }}
								style={{
									width: 150,
									height: 150,
									borderRadius: 15,
								}}
							/>
						) : (
							<VStack
								style={{
									width: 150,
									height: 150,
									borderRadius: 15,
									borderWidth: 2,
									borderColor: "lightgrey",
									borderStyle: "dashed",
									justifyContent: "center",
									alignItems: "center",
								}}></VStack>
						)}
					</Animated.View>
					<Animated.View style={[styles.card, backAnimatedStyle]}>
						<VStack
							style={{
								padding: 15,
								backgroundColor: "white",
								borderRadius: 15,
								// borderWidth: 1,
								// borderColor: "lightgrey",
							}}>
							{profileUrl && (
								<SvgQRCode value={profileUrl} size={120} />
							)}
						</VStack>
					</Animated.View>
					<AvatarUploader image={image} onUpload={flipCardToAvatar} />
				</VStack>
			</VStack>
			{userProfile?.avatar_url && (
				<Button
					onPress={flipCard}
					size='xl'
					className='rounded-full p-3.5'
					style={{
						position: "absolute",
						bottom: -15,
						right: 100,
						zIndex: 9,
					}}>
					<ButtonIcon as={flipped ? SquareUserRound : QrCode} />
				</Button>
			)}
		</VStack>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 9,
		position: "relative",
	},
	flipContainer: {
		width: 150,
		height: 150,
	},
	card: {
		// width: 300,
		// height: 300,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backfaceVisibility: "hidden",
	},
	avatar: {
		width: 200,
		height: 200,
	},
	button: {
		backgroundColor: "#2e86de",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 30,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
	},
});

export default FlipCardProfile;
