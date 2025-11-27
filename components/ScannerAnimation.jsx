import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, { Rect, Path, G, Line } from "react-native-svg";

const ScannerAnimation = () => {
	const animation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.timing(animation, {
				toValue: 1,
				duration: 2500,
				useNativeDriver: true,
			})
		).start();
	}, [animation]);

	const translateY = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 198],
	});

	return (
		<View style={styles.container}>
			<Svg width='200' height='200' viewBox='0 0 200 200'>
				{/* Frame corners */}
				{/* <Path d='M5,5 h30 v10 h-20 v20 h-10 z' fill='black' />
				<Path d='M195,5 h-30 v10 h20 v20 h10 z' fill='black' />
				<Path d='M5,195 h30 v-10 h-20 v-20 h-10 z' fill='black' />
				<Path d='M195,195 h-30 v-10 h20 v-20 h10 z' fill='black' /> */}

				<G stroke='black' strokeWidth='3'>
					{/* Top Left */}
					<Line x1='10' y1='10' x2='40' y2='10' />
					<Line x1='10' y1='10' x2='10' y2='40' />
					{/* Top Right */}
					<Line x1='160' y1='10' x2='190' y2='10' />
					<Line x1='190' y1='10' x2='190' y2='40' />
					{/* Bottom Left */}
					<Line x1='10' y1='160' x2='10' y2='190' />
					<Line x1='10' y1='190' x2='40' y2='190' />
					{/* Bottom Right */}
					<Line x1='190' y1='160' x2='190' y2='190' />
					<Line x1='160' y1='190' x2='190' y2='190' />
				</G>

				{/* Stylized QR code blocks */}
				{/* <G>
					<Rect x='60' y='60' width='10' height='10' fill='#000' />
					<Rect x='85' y='85' width='8' height='8' fill='#000' />
					<Rect x='110' y='60' width='8' height='8' fill='#000' />
					<Rect x='135' y='85' width='10' height='10' fill='#000' />
					<Rect x='145' y='115' width='6' height='6' fill='#000' />
					<Rect x='90' y='130' width='10' height='10' fill='#000' />
				</G> */}
			</Svg>

			{/* Scanning line */}
			<Animated.View
				style={[
					styles.scanLineContainer,
					{
						transform: [{ translateY }],
					},
				]}>
				<Svg width='200' height='2'>
					<Rect x='5' y='0' width='190' height='2' fill='red' />
				</Svg>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: 200,
		height: 200,
		position: "relative",
	},
	scanLineContainer: {
		position: "absolute",
		top: 0,
		left: 0,
	},
});

export default ScannerAnimation;
