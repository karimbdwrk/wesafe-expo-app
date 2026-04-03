import { useState, useRef } from "react";
import {
	View,
	TouchableOpacity,
	Image as RNImage,
	StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Camera,
	RotateCcw,
	X,
	Check,
	RefreshCcw,
	UserCircle2,
	ShieldAlert,
} from "lucide-react-native";

import { useImage } from "@/context/ImageContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

export default function CameraScreen() {
	const router = useRouter();
	const { setImage } = useImage();
	const { isDark } = useTheme();

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark ? Colors.dark.elevated : Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textColor = isDark ? Colors.dark.text : Colors.light.text;
	const muted = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const danger = isDark ? Colors.dark.danger : Colors.light.danger;

	const [facing, setFacing] = useState("front");
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedPhoto, setCapturedPhoto] = useState(null);
	const cameraRef = useRef(null);

	/* ── Permission non encore chargée ── */
	if (!permission) {
		return (
			<Box
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: bg,
				}}
			/>
		);
	}

	/* ── Permission refusée ── */
	if (!permission.granted) {
		return (
			<Box
				style={{
					flex: 1,
					backgroundColor: bg,
					padding: 20,
					justifyContent: "center",
				}}>
				<Card
					style={{
						backgroundColor: cardBg,
						borderRadius: 16,
						padding: 32,
						borderWidth: 1,
						borderColor: cardBorder,
						alignItems: "center",
					}}>
					<VStack space='xl' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: isDark
									? Colors.dark.danger20
									: Colors.light.danger20,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={ShieldAlert}
								size='xl'
								style={{ color: danger }}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: textColor,
									textAlign: "center",
								}}>
								Accès caméra requis
							</Heading>
							<Text
								size='sm'
								style={{
									color: muted,
									textAlign: "center",
									lineHeight: 20,
								}}>
								Pour prendre votre photo de profil, nous avons
								besoin d'accéder à votre caméra.
							</Text>
						</VStack>
						<Button
							size='lg'
							onPress={requestPermission}
							style={{
								backgroundColor: tint,
								borderRadius: 10,
								justifyContent: "center",
							}}>
							<ButtonIcon
								as={Camera}
								style={{
									color: Colors.light.cardBackground,
								}}
							/>
							<ButtonText
								style={{
									color: Colors.light.cardBackground,
								}}>
								Autoriser l'accès
							</ButtonText>
						</Button>
						<TouchableOpacity onPress={() => router.back()}>
							<Text
								size='sm'
								style={{
									color: muted,
									textDecorationLine: "underline",
								}}>
								Annuler
							</Text>
						</TouchableOpacity>
					</VStack>
				</Card>
			</Box>
		);
	}

	/* ── Prise de vue ── */
	const takePhoto = async () => {
		if (!cameraRef.current) return;
		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.85,
				base64: false,
			});
			setCapturedPhoto(photo.uri);
		} catch {
			// silencieux
		}
	};

	const confirmPhoto = () => {
		setImage({ uri: capturedPhoto });
		router.back();
	};

	const retakePhoto = () => {
		setCapturedPhoto(null);
	};

	/* ── Aperçu après capture ── */
	if (capturedPhoto) {
		return (
			<Box style={{ flex: 1, backgroundColor: "#000" }}>
				<RNImage
					source={{ uri: capturedPhoto }}
					style={StyleSheet.absoluteFill}
					resizeMode='cover'
				/>
				{/* Overlay sombre */}
				<Box
					style={{
						...StyleSheet.absoluteFillObject,
						backgroundColor: "rgba(0,0,0,0.45)",
					}}
				/>

				<SafeAreaView style={{ flex: 1 }}>
					<VStack
						style={{ flex: 1, justifyContent: "space-between" }}>
						{/* Top */}
						<HStack
							style={{
								paddingHorizontal: 20,
								paddingTop: 8,
								justifyContent: "center",
							}}>
							<Text
								size='lg'
								style={{
									color: "#ffffff",
									fontWeight: "600",
									opacity: 0.9,
								}}>
								Vérifiez votre photo
							</Text>
						</HStack>

						{/* Photo preview circulaire */}
						<Box style={{ alignItems: "center" }}>
							<Box
								style={{
									width: 260,
									height: 260,
									borderRadius: 130,
									overflow: "hidden",
									borderWidth: 4,
									borderColor: "#ffffff",
									shadowColor: "#000",
									shadowOpacity: 0.5,
									shadowRadius: 20,
									elevation: 10,
								}}>
								<RNImage
									source={{ uri: capturedPhoto }}
									style={{ width: "100%", height: "100%" }}
									resizeMode='cover'
								/>
							</Box>
							<Text
								size='sm'
								style={{
									color: "rgba(255,255,255,0.7)",
									marginTop: 16,
									textAlign: "center",
								}}>
								Aperçu de votre photo de profil
							</Text>
						</Box>

						{/* Boutons */}
						<HStack
							space='md'
							style={{
								paddingHorizontal: 20,
								paddingBottom: 20,
							}}>
							<TouchableOpacity
								onPress={retakePhoto}
								style={{
									flex: 1,
									height: 52,
									borderRadius: 12,
									backgroundColor: "rgba(255,255,255,0.15)",
									borderWidth: 1,
									borderColor: "rgba(255,255,255,0.3)",
									justifyContent: "center",
									alignItems: "center",
									flexDirection: "row",
									gap: 8,
								}}>
								<RefreshCcw size={18} color='#ffffff' />
								<Text
									style={{
										color: "#ffffff",
										fontWeight: "600",
										fontSize: 15,
									}}>
									Reprendre
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={confirmPhoto}
								style={{
									flex: 2,
									height: 52,
									borderRadius: 12,
									backgroundColor: tint,
									justifyContent: "center",
									alignItems: "center",
									flexDirection: "row",
									gap: 8,
								}}>
								<Check size={18} color='#ffffff' />
								<Text
									style={{
										color: "#ffffff",
										fontWeight: "600",
										fontSize: 15,
									}}>
									Utiliser cette photo
								</Text>
							</TouchableOpacity>
						</HStack>
					</VStack>
				</SafeAreaView>
			</Box>
		);
	}

	/* ── Caméra ── */
	return (
		<Box style={{ flex: 1, backgroundColor: "#000" }}>
			<CameraView
				style={StyleSheet.absoluteFill}
				facing={facing}
				ref={cameraRef}
			/>

			{/* Overlay */}
			<SafeAreaView style={{ flex: 1 }}>
				<VStack style={{ flex: 1, justifyContent: "space-between" }}>
					{/* Top bar */}
					<HStack
						style={{
							paddingHorizontal: 20,
							paddingTop: 8,
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<TouchableOpacity
							onPress={() => router.back()}
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: "rgba(0,0,0,0.5)",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<X size={20} color='#ffffff' />
						</TouchableOpacity>

						<Text
							size='md'
							style={{
								color: "#ffffff",
								fontWeight: "600",
								opacity: 0.9,
							}}>
							Photo de profil
						</Text>

						<TouchableOpacity
							onPress={() =>
								setFacing((f) =>
									f === "back" ? "front" : "back",
								)
							}
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: "rgba(0,0,0,0.5)",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<RotateCcw size={20} color='#ffffff' />
						</TouchableOpacity>
					</HStack>

					{/* Guide circulaire */}
					<Box style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 260,
								height: 260,
								borderRadius: 130,
								borderWidth: 2,
								borderColor: "rgba(255,255,255,0.6)",
								borderStyle: "dashed",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={UserCircle2}
								size='xl'
								style={{
									color: "rgba(255,255,255,0.25)",
									width: 80,
									height: 80,
								}}
							/>
						</Box>
						<Text
							size='sm'
							style={{
								color: "rgba(255,255,255,0.6)",
								marginTop: 12,
								textAlign: "center",
							}}>
							Centrez votre visage dans le cercle
						</Text>
					</Box>

					{/* Bouton déclencheur */}
					<Box
						style={{
							alignItems: "center",
							paddingBottom: 28,
						}}>
						<TouchableOpacity
							onPress={takePhoto}
							style={{
								width: 76,
								height: 76,
								borderRadius: 38,
								backgroundColor: "rgba(255,255,255,0.2)",
								borderWidth: 3,
								borderColor: "#ffffff",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Box
								style={{
									width: 58,
									height: 58,
									borderRadius: 29,
									backgroundColor: "#ffffff",
								}}
							/>
						</TouchableOpacity>
						<Text
							size='xs'
							style={{
								color: "rgba(255,255,255,0.5)",
								marginTop: 10,
							}}>
							Appuyez pour capturer
						</Text>
					</Box>
				</VStack>
			</SafeAreaView>
		</Box>
	);
}
