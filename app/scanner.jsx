import { useState, useRef, useEffect } from "react";
import {
	View,
	TouchableOpacity,
	StyleSheet,
	useWindowDimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ShieldAlert, Camera, QrCode } from "lucide-react-native";
import {
	AlertDialog,
	AlertDialogBackdrop,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
} from "@/components/ui/alert-dialog";

import ScannerAnimation from "@/components/ScannerAnimation";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const ScannerScreen = () => {
	const router = useRouter();
	const { accessToken } = useAuth();
	const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const [errorMsg, setErrorMsg] = useState(null);

	const FRAME = 260;
	// Position verticale exacte du trou dans l'overlay
	const holeTop = (screenHeight - FRAME) / 2;

	useEffect(() => {
		if (!permission) return;
		if (!permission.granted) requestPermission();
	}, [permission]);

	useEffect(() => {
		setScanned(false);
	}, []);

	const handleBarCodeScanned = async ({ data }) => {
		if (scanned) return;
		setScanned(true);

		console.log("[Scanner] QR data scannée :", data);

		if (data.startsWith("wesafe://profile?token=")) {
			const token = data.split("wesafe://profile?token=")[1];
			console.log("[Scanner] Token extrait :", token);

			try {
				const supabaseClient = createSupabaseClient(accessToken);
				const { data: result, error } =
					await supabaseClient.functions.invoke("verify-qr-token", {
						body: { token },
					});

				if (error) {
					console.warn("[Scanner] Erreur edge function :", error);
					setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
					setTimeout(() => setScanned(false), 1500);
					return;
				}

				if (result?.success) {
					console.log("[Scanner] Profile ID :", result.profile?.id);
					router.replace({
						pathname: "/profile",
						params: { profile_id: result.profile?.id },
					});
				} else if (result?.expired) {
					setErrorMsg(
						"Ce QR code a expiré. Demandez un nouveau code.",
					);
					setTimeout(() => setScanned(false), 1500);
				} else {
					setErrorMsg("QR code invalide.");
					setTimeout(() => setScanned(false), 1500);
				}
			} catch (err) {
				console.warn("[Scanner] Exception verify-qr-token :", err);
				setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
				setTimeout(() => setScanned(false), 1500);
			}
		} else if (data.startsWith("supabaseapp://profile/")) {
			const id = data.split("supabaseapp://profile/")[1];
			console.log("[Scanner] Ancien format — profile_id :", id);
			router.replace({
				pathname: `/profile`,
				params: { profile_id: id },
			});
		} else {
			console.warn("[Scanner] QR non reconnu :", data);
			setErrorMsg("QR code non reconnu.");
			setTimeout(() => setScanned(false), 1500);
		}
	};

	/* ── Permission non encore chargée ── */
	if (!permission) {
		return <Box style={{ flex: 1, backgroundColor: "#000" }} />;
	}

	/* ── Permission refusée ── */
	if (!permission.granted) {
		return (
			<Box
				style={{
					flex: 1,
					backgroundColor: "#111827",
					padding: 20,
					justifyContent: "center",
				}}>
				<Card
					style={{
						backgroundColor: "#1f2937",
						borderRadius: 16,
						padding: 32,
						borderWidth: 1,
						borderColor: "#374151",
						alignItems: "center",
					}}>
					<VStack space='xl' style={{ alignItems: "center" }}>
						<Box
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: "rgba(239,68,68,0.15)",
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
									color: "#f3f4f6",
									textAlign: "center",
								}}>
								Accès caméra requis
							</Heading>
							<Text
								size='sm'
								style={{
									color: "#9ca3af",
									textAlign: "center",
									lineHeight: 20,
								}}>
								Pour scanner un QR code, nous avons besoin
								d'accéder à votre caméra.
							</Text>
						</VStack>
						<Button
							size='lg'
							onPress={requestPermission}
							style={{
								backgroundColor: "#2563eb",
								borderRadius: 12,
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
									color: "#9ca3af",
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

	/* ── Scanner ── */
	return (
		<>
			<Box style={{ flex: 1, backgroundColor: "#000" }}>
				<CameraView
					style={StyleSheet.absoluteFill}
					facing='back'
					barCodeScannerSettings={{ barCodeTypes: ["qr"] }}
					onBarcodeScanned={
						scanned ? undefined : handleBarCodeScanned
					}
				/>

				{/* Overlay sombre sur les bords */}
				<Box style={StyleSheet.absoluteFill} pointerEvents='none'>
					{/* Top */}
					<Box style={[styles.overlayColor, { height: holeTop }]} />
					{/* Middle row */}
					<View style={{ flexDirection: "row", height: FRAME }}>
						<Box style={styles.overlaySide} />
						<Box style={{ width: FRAME, height: FRAME }} />
						<Box style={styles.overlaySide} />
					</View>
					{/* Bottom */}
					<Box style={[styles.overlayColor, { flex: 1 }]} />
				</Box>

				{/* Top bar avec inset safe area */}
				<HStack
					style={{
						position: "absolute",
						top: topInset + 8,
						left: 0,
						right: 0,
						paddingHorizontal: 20,
						justifyContent: "space-between",
						alignItems: "center",
						zIndex: 10,
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
						Scanner un QR code
					</Text>

					<Box style={{ width: 40 }} />
				</HStack>

				{/* ScannerAnimation centrée exactement sur le trou */}
				<Box
					style={{
						position: "absolute",
						top: holeTop,
						left: 0,
						right: 0,
						height: FRAME,
						justifyContent: "center",
						alignItems: "center",
					}}>
					<ScannerAnimation />
				</Box>

				{/* Hint bas */}
				<Box
					style={{
						position: "absolute",
						top: holeTop + FRAME + 20,
						left: 0,
						right: 0,
						alignItems: "center",
					}}>
					<Text
						size='sm'
						style={{
							color: "rgba(255,255,255,0.65)",
							textAlign: "center",
						}}>
						Placez le QR code dans le cadre
					</Text>
				</Box>

				{/* Hint bas scan auto */}
				<HStack
					space='xs'
					style={{
						position: "absolute",
						bottom: bottomInset + 28,
						left: 0,
						right: 0,
						justifyContent: "center",
						alignItems: "center",
						opacity: 0.5,
					}}>
					<QrCode size={14} color='#ffffff' />
					<Text size='xs' style={{ color: "#ffffff" }}>
						Scan automatique
					</Text>
				</HStack>
			</Box>

			{/* AlertDialog erreur */}
			<AlertDialog isOpen={!!errorMsg} onClose={() => setErrorMsg(null)}>
				<AlertDialogBackdrop />
				<AlertDialogContent>
					<AlertDialogHeader>
						<Heading size='md'>QR Code invalide</Heading>
					</AlertDialogHeader>
					<AlertDialogBody>
						<Text size='sm'>{errorMsg}</Text>
					</AlertDialogBody>
					<AlertDialogFooter>
						<Button size='sm' onPress={() => setErrorMsg(null)}>
							<ButtonText>OK</ButtonText>
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

const OVERLAY_COLOR = "rgba(0,0,0,0.62)";

const styles = StyleSheet.create({
	overlayColor: {
		width: "100%",
		backgroundColor: OVERLAY_COLOR,
	},
	overlaySide: {
		flex: 1,
		backgroundColor: OVERLAY_COLOR,
	},
});

export default ScannerScreen;
