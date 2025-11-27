import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import { Camera as CameraIcon } from "lucide-react-native";

import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";

import ScannerAnimation from "@/components/ScannerAnimation";

const ScannerScreen = () => {
	const router = useRouter();
	const cameraRef = useRef(null);

	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	useEffect(() => {
		if (!permission) return;
		if (!permission.granted) requestPermission();
	}, [permission]);

	if (!permission) {
		return (
			<Center flex={1} bg='$backgroundLight50'>
				<Text>Loading camera permissions...</Text>
			</Center>
		);
	}

	if (!permission.granted) {
		return (
			<Center flex={1} bg='$backgroundLight50' p='$5'>
				<VStack space='lg' alignItems='center'>
					<CameraIcon size={80} color='#666' />
					<Heading size='xl' textAlign='center'>
						Camera Access Required
					</Heading>
					<Text color='$textLight600' textAlign='center' size='md'>
						We need access to your camera to scan a QR code.
					</Text>
					<Button
						size='lg'
						onPress={requestPermission}
						bg='$blue600'
						borderRadius='$full'>
						<ButtonText>Grant Permission</ButtonText>
					</Button>
				</VStack>
			</Center>
		);
	}

	const handleBarCodeScanned = ({ data }) => {
		if (scanned) return;
		console.log("data scan :", data);
		setScanned(true);

		if (data.startsWith("supabaseapp://profile/")) {
			const id = data.split("supabaseapp://profile/")[1];
			router.replace({
				pathname: `/profile`,
				params: { profile_id: id },
			});
		} else {
			alert("QR Code invalide ou non reconnu");
			setTimeout(() => setScanned(false), 1500);
		}
	};

	return (
		<Box flex={1} bg='$black'>
			<CameraView
				ref={cameraRef}
				style={StyleSheet.absoluteFillObject}
				facing={"back"}
				barCodeScannerSettings={{ barCodeTypes: ["qr"] }}
				onBarcodeScanned={handleBarCodeScanned}
			/>
			{scanned && (
				<Center position='absolute' bottom={20} width='100%'>
					<Button
						bg='$blue600'
						onPress={() => setScanned(false)}
						borderRadius='$full'>
						<ButtonText>Scanner à nouveau</ButtonText>
					</Button>
				</Center>
			)}
			<VStack
				style={{
					height: "100%",
					width: "100%",
					// backgroundColor: "#FF000066",
					justifyContent: "center",
					alignItems: "center",
				}}>
				<ScannerAnimation />
			</VStack>
		</Box>
	);
};

export default ScannerScreen;
