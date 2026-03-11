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

export default function CameraScreen() {
	const router = useRouter();
	const { setImage } = useImage();
	const { isDark } = useTheme();

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
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
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
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
					padding: 20,
					justifyContent: "center",
				}}>
				<Card
					style={{
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 16,
						padding: 32,
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#e5e7eb",
						alignItems: "center",
					}}>
					<VStack space='xl' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: isDark
									? "rgba(239,68,68,0.15)"
									: "rgba(239,68,68,0.08)",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Icon
								as={ShieldAlert}
								size='xl'
								style={{ color: "#ef4444" }}
							/>
						</Box>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Accès caméra requis
							</Heading>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
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
								backgroundColor: "#3b82f6",
								borderRadius: 10,
								width: "100%",
							}}>
							<ButtonIcon as={Camera} style={{ color: "#fff" }} />
							<ButtonText style={{ color: "#fff" }}>
								Autoriser l'accès
							</ButtonText>
						</Button>
						<TouchableOpacity onPress={() => router.back()}>
							<Text
								size='sm'
								style={{
									color: isDark ? "#9ca3af" : "#6b7280",
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
									backgroundColor: "#3b82f6",
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
						{/* Bouton shutter */}
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
