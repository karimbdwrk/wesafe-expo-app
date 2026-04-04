/**
 * CropPreview
 * Affiche une image avec un cadre 4:3 fixe.
 * L'utilisateur peut déplacer (1 doigt) et zoomer (2 doigts / pinch).
 * "Utiliser" rogne l'image selon la position/zoom choisis.
 * "Reprendre" appelle onCancel.
 */
import { useEffect, useRef, useState } from "react";
import {
	Animated,
	PanResponder,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { X } from "lucide-react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";

const BUTTON_BAR_H = 116; // padding(20) + button(52) + paddingBottom(40) + 4

export default function CropPreview({
	uri,
	naturalWidth,
	naturalHeight,
	screenWidth,
	tint,
	onConfirm,
	onCancel,
	onClose,
}) {
	const [containerH, setContainerH] = useState(0);

	const FRAME_W = Math.round(screenWidth * 0.88);
	const FRAME_H = Math.round(FRAME_W * 0.75);

	// Animated values
	const pan = useRef(new Animated.ValueXY()).current;
	const scale = useRef(new Animated.Value(1)).current;

	// Refs to read current values synchronously
	const panVal = useRef({ x: 0, y: 0 });
	const scaleVal = useRef(1);

	// Pinch tracking
	const pinchRef = useRef({ startDist: null, startScale: 1 });

	useEffect(() => {
		const pl = pan.addListener((v) => {
			panVal.current = v;
		});
		const sl = scale.addListener((v) => {
			scaleVal.current = v.value;
		});
		return () => {
			pan.removeListener(pl);
			scale.removeListener(sl);
		};
	}, []);

	const getDistance = (t0, t1) => {
		const dx = t0.pageX - t1.pageX;
		const dy = t0.pageY - t1.pageY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				pan.extractOffset();
				pinchRef.current = {
					startDist: null,
					startScale: scaleVal.current,
				};
			},
			onPanResponderMove: (evt, gs) => {
				const touches = evt.nativeEvent.touches;
				if (touches.length >= 2) {
					const d = getDistance(touches[0], touches[1]);
					if (pinchRef.current.startDist === null) {
						pinchRef.current.startDist = d;
						pinchRef.current.startScale = scaleVal.current;
					}
					const ratio = d / pinchRef.current.startDist;
					scale.setValue(
						Math.max(
							0.5,
							Math.min(6, pinchRef.current.startScale * ratio),
						),
					);
				} else {
					pinchRef.current.startDist = null;
					pan.setValue({ x: gs.dx, y: gs.dy });
				}
			},
			onPanResponderRelease: () => {
				pan.flattenOffset();
			},
		}),
	).current;

	const handleConfirm = async () => {
		if (!containerH || !naturalWidth || !naturalHeight) return;
		// s0 = scale initiale qui couvre le cadre
		const s0 = Math.max(FRAME_W / naturalWidth, FRAME_H / naturalHeight);
		const totalScale = s0 * scaleVal.current;
		// Dimensions de la zone cropée en pixels image
		const cropW = FRAME_W / totalScale;
		const cropH = FRAME_H / totalScale;
		// Centre du cadre en coordonnées image
		const cx = naturalWidth / 2 - panVal.current.x / totalScale;
		const cy = naturalHeight / 2 - panVal.current.y / totalScale;
		// Origine du crop (clampée)
		const originX = Math.round(
			Math.max(0, Math.min(naturalWidth - cropW, cx - cropW / 2)),
		);
		const originY = Math.round(
			Math.max(0, Math.min(naturalHeight - cropH, cy - cropH / 2)),
		);
		const safeCropW = Math.round(Math.min(cropW, naturalWidth - originX));
		const safeCropH = Math.round(Math.min(cropH, naturalHeight - originY));
		try {
			const result = await ImageManipulator.manipulateAsync(
				uri,
				[
					{
						crop: {
							originX,
							originY,
							width: safeCropW,
							height: safeCropH,
						},
					},
				],
				{ compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
			);
			onConfirm(result);
		} catch (e) {
			console.error("CropPreview confirm error:", e);
		}
	};

	// s0 : scale initiale minimum pour couvrir le cadre
	const s0 =
		naturalWidth > 0 && naturalHeight > 0
			? Math.max(FRAME_W / naturalWidth, FRAME_H / naturalHeight)
			: 1;
	const imgW = naturalWidth * s0;
	const imgH = naturalHeight * s0;
	const frameTop = containerH > 0 ? (containerH - FRAME_H) / 2 : 0;

	return (
		<View
			style={{ flex: 1, backgroundColor: "#000" }}
			onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}>
			{containerH > 0 && (
				<>
					{/* Image animée */}
					<Animated.Image
						source={{ uri }}
						style={{
							position: "absolute",
							width: imgW,
							height: imgH,
							left: (screenWidth - imgW) / 2,
							top: (containerH - imgH) / 2,
							transform: [
								{ translateX: pan.x },
								{ translateY: pan.y },
								{ scale },
							],
						}}
						resizeMode='cover'
					/>

					{/* Masque sombre avec fenêtre 4:3 */}
					<View style={StyleSheet.absoluteFill} pointerEvents='none'>
						<View
							style={{
								height: frameTop,
								backgroundColor: "rgba(0,0,0,0.55)",
							}}
						/>
						<View style={{ flexDirection: "row", height: FRAME_H }}>
							<View
								style={{
									flex: 1,
									backgroundColor: "rgba(0,0,0,0.55)",
								}}
							/>
							<View
								style={{
									width: FRAME_W,
									height: FRAME_H,
									borderWidth: 2,
									borderColor: "rgba(255,255,255,0.9)",
									borderRadius: 10,
								}}
							/>
							<View
								style={{
									flex: 1,
									backgroundColor: "rgba(0,0,0,0.55)",
								}}
							/>
						</View>
						<View
							style={{
								flex: 1,
								backgroundColor: "rgba(0,0,0,0.55)",
							}}>
							<Box
								style={{
									alignItems: "center",
									paddingTop: 10,
								}}>
								<Text
									style={{
										color: "rgba(255,255,255,0.7)",
										fontSize: 12,
										textAlign: "center",
									}}>
									Déplacez et zoomez pour ajuster le recadrage
								</Text>
							</Box>
						</View>
					</View>

					{/* Bouton fermer */}
					<TouchableOpacity
						onPress={onClose}
						style={{
							position: "absolute",
							top: 56,
							right: 16,
							zIndex: 20,
							backgroundColor: "rgba(0,0,0,0.5)",
							borderRadius: 20,
							padding: 8,
						}}>
						<X size={22} color='#fff' />
					</TouchableOpacity>

					{/* Couche geste (hors barre boutons) */}
					<View
						style={{
							...StyleSheet.absoluteFillObject,
							bottom: BUTTON_BAR_H,
						}}
						{...panResponder.panHandlers}
					/>

					{/* Barre de boutons */}
					<View
						style={{
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: BUTTON_BAR_H,
							flexDirection: "row",
							gap: 12,
							paddingHorizontal: 20,
							paddingTop: 20,
							paddingBottom: 40,
							backgroundColor: "rgba(0,0,0,0.7)",
						}}>
						<Button
							onPress={onCancel}
							variant='outline'
							style={{
								flex: 1,
								borderRadius: 12,
								height: 52,
								borderColor: "#fff",
							}}>
							<ButtonText
								style={{ color: "#fff", fontWeight: "600" }}>
								Reprendre
							</ButtonText>
						</Button>
						<Button
							onPress={handleConfirm}
							style={{
								flex: 1,
								borderRadius: 12,
								height: 52,
								backgroundColor: tint,
							}}>
							<ButtonText
								style={{ color: "#fff", fontWeight: "700" }}>
								Utiliser
							</ButtonText>
						</Button>
					</View>
				</>
			)}
		</View>
	);
}
