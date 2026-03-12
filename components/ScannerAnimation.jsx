import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, {
	Rect,
	G,
	Line,
	Defs,
	LinearGradient,
	Stop,
} from "react-native-svg";

const FRAME = 260;
const LINE_TRAVEL = FRAME - 4;
const CORNER = 30;
const STROKE = 3;
const CORNER_COLOR = "#ffffff";
const LINE_COLOR = "#2563eb";

const ScannerAnimation = () => {
	const animation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(animation, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true,
				}),
				Animated.timing(animation, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: true,
				}),
			]),
		).start();
	}, []);

	const translateY = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [2, LINE_TRAVEL],
	});

	return (
		<View style={{ width: FRAME, height: FRAME, position: "relative" }}>
			<Svg width={FRAME} height={FRAME} viewBox={`0 0 ${FRAME} ${FRAME}`}>
				<G
					stroke={CORNER_COLOR}
					strokeWidth={STROKE}
					strokeLinecap='round'>
					{/* Top Left */}
					<Line x1='10' y1='10' x2={10 + CORNER} y2='10' />
					<Line x1='10' y1='10' x2='10' y2={10 + CORNER} />
					{/* Top Right */}
					<Line
						x1={FRAME - 10 - CORNER}
						y1='10'
						x2={FRAME - 10}
						y2='10'
					/>
					<Line
						x1={FRAME - 10}
						y1='10'
						x2={FRAME - 10}
						y2={10 + CORNER}
					/>
					{/* Bottom Left */}
					<Line
						x1='10'
						y1={FRAME - 10 - CORNER}
						x2='10'
						y2={FRAME - 10}
					/>
					<Line
						x1='10'
						y1={FRAME - 10}
						x2={10 + CORNER}
						y2={FRAME - 10}
					/>
					{/* Bottom Right */}
					<Line
						x1={FRAME - 10}
						y1={FRAME - 10 - CORNER}
						x2={FRAME - 10}
						y2={FRAME - 10}
					/>
					<Line
						x1={FRAME - 10 - CORNER}
						y1={FRAME - 10}
						x2={FRAME - 10}
						y2={FRAME - 10}
					/>
				</G>
			</Svg>

			{/* Scan line animée */}
			<Animated.View
				style={[styles.scanLine, { transform: [{ translateY }] }]}>
				<Svg width={FRAME} height={4}>
					<Defs>
						<LinearGradient
							id='lineGrad'
							x1='0'
							y1='0'
							x2='1'
							y2='0'>
							<Stop
								offset='0'
								stopColor={LINE_COLOR}
								stopOpacity='0'
							/>
							<Stop
								offset='0.2'
								stopColor={LINE_COLOR}
								stopOpacity='1'
							/>
							<Stop
								offset='0.8'
								stopColor={LINE_COLOR}
								stopOpacity='1'
							/>
							<Stop
								offset='1'
								stopColor={LINE_COLOR}
								stopOpacity='0'
							/>
						</LinearGradient>
					</Defs>
					<Rect
						x='0'
						y='1'
						width={FRAME}
						height='2'
						fill='url(#lineGrad)'
					/>
				</Svg>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	scanLine: {
		position: "absolute",
		top: 0,
		left: 0,
	},
});

export default ScannerAnimation;
