import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Animated,
	Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState, useEffect } from "react";

function MarqueeTitle({ title, style }) {
	const translateX = useRef(new Animated.Value(0)).current;
	const [containerWidth, setContainerWidth] = useState(0);
	const [textWidth, setTextWidth] = useState(0);
	const animationRef = useRef(null);

	const needsScroll = textWidth > containerWidth && containerWidth > 0;

	useEffect(() => {
		if (animationRef.current) {
			animationRef.current.stop();
			animationRef.current = null;
		}
		translateX.setValue(0);

		if (needsScroll) {
			const offset = textWidth - containerWidth;
			animationRef.current = Animated.loop(
				Animated.sequence([
					Animated.delay(800),
					Animated.timing(translateX, {
						toValue: -offset,
						duration: Math.max(4500, offset * 8),
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
					Animated.delay(800),
					Animated.timing(translateX, {
						toValue: 0,
						duration: Math.max(4500, offset * 8),
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
				]),
			);
			animationRef.current.start();
		}

		return () => {
			if (animationRef.current) {
				animationRef.current.stop();
				animationRef.current = null;
			}
		};
	}, [textWidth, containerWidth]);

	return (
		<View
			style={style}
			onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
			{/* ScrollView horizontal pour mesurer la largeur naturelle du texte —
			    onContentSizeChange retourne la taille du CONTENU (non contrainte par le flex parent) */}
			<ScrollView
				horizontal
				scrollEnabled={false}
				pointerEvents='none'
				style={{ position: "absolute", opacity: 0 }}
				onContentSizeChange={(w) => setTextWidth(w)}>
				<Text style={styles.title}>{title}</Text>
			</ScrollView>
			{/* Conteneur de clip */}
			<View style={{ width: "100%", overflow: "hidden" }}>
				<Animated.Text
					style={[
						styles.title,
						needsScroll
							? {
									transform: [{ translateX }],
									alignSelf: "flex-start",
									width: textWidth,
								}
							: { textAlign: "center" },
					]}>
					{title}
				</Animated.Text>
			</View>
		</View>
	);
}

export default function MyHeader({ title, headerRight, showBack }) {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			{/* LEFT */}
			<View style={styles.left}>
				{showBack && (
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name='chevron-back' size={18} color='black' />
					</TouchableOpacity>
				)}
			</View>

			{/* CENTER — position absolute pour être vraiment centré indépendamment des côtés */}
			<View
				style={[styles.titleWrapper, { top: insets.top }]}
				pointerEvents='none'>
				<MarqueeTitle title={title} style={styles.titleContainer} />
			</View>

			{/* RIGHT */}
			<View style={styles.right}>
				{headerRight ? headerRight() : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 100,
		paddingHorizontal: 16,
		// paddingBottom: 10,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
	},
	left: {
		width: 60,
		zIndex: 1,
	},
	right: {
		flexShrink: 0,
		flexDirection: "row",
		alignItems: "center",
		zIndex: 1,
		marginLeft: "auto",
	},
	titleWrapper: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 70,
	},
	titleContainer: {
		width: "100%",
		alignItems: "center",
	},
	title: {
		textAlign: "center",
		color: "black",
		fontSize: 16,
		fontWeight: "600",
	},
});
