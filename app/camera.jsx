import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import { Pressable } from "@/components/ui/pressable";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import {
	Camera,
	CameraOff,
	RotateCcw,
	Trash2,
	Image as ImageIcon,
	X,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { useImage } from "@/context/ImageContext";

export default function CameraScreen() {
	const router = useRouter();
	const { setImage, image } = useImage();

	const [facing, setFacing] = useState("front");
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedPhoto, setCapturedPhoto] = useState(null);
	const [showCamera, setShowCamera] = useState(true);
	const cameraRef = useRef(null);

	if (!permission) {
		return (
			<Center flex={1} bg='$backgroundLight50'>
				<Text color='$textLight600'>Loading camera permissions...</Text>
			</Center>
		);
	}

	if (!permission.granted) {
		return (
			<Center flex={1} bg='$backgroundLight50' p='$5'>
				<VStack space='lg' alignItems='center'>
					<Camera size={80} color='#666' />
					<Heading size='xl' textAlign='center'>
						Camera Access Required
					</Heading>
					<Text color='$textLight600' textAlign='center' size='md'>
						We need access to your camera to take photos
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

	const takePhoto = async () => {
		if (!cameraRef.current) return;

		try {
			console.log("Taking photo...");
			const photo = await cameraRef.current.takePictureAsync({
				quality: 1,
				base64: false,
			});

			console.log("Photo taken:", photo);
			setCapturedPhoto(photo.uri);
			setImage(photo);
			setShowCamera(false);
			toast.success("Photo captured successfully!");

			// Here you can call your handleUpload function
			// handleUpload({ uri: photo.uri });
		} catch (error) {
			console.error("Error taking photo:", error);
			toast.error("Failed to take photo");
		}
	};

	const toggleCameraFacing = () => {
		setFacing((current) => (current === "back" ? "front" : "back"));
	};

	const openCamera = () => {
		console.log("Opening camera...");
		setShowCamera(true);
	};

	const closeCamera = () => {
		setShowCamera(false);
	};

	const retakePhoto = () => {
		setCapturedPhoto(null);
		setShowCamera(true);
	};

	if (showCamera) {
		return (
			<Box flex={1} bg='$black'>
				<CameraView
					style={{ flex: 1 }}
					facing={facing}
					ref={cameraRef}></CameraView>
				<Box flex={1}>
					{/* Top Controls */}
					<HStack justifyContent='center' pt='$16' px='$5'>
						{/* <Pressable
							bg='rgba(0,0,0,0.6)'
							p='$3'
							borderRadius='$full'
							onPress={closeCamera}>
							<X size={28} color='white' />
						</Pressable> */}
						{/* <Pressable
							bg='rgba(0,0,0,0.6)'
							p='$3'
							borderRadius='$full'
							onPress={toggleCameraFacing}>
							<RotateCcw size={28} color='white' />
						</Pressable> */}
						<Button onPress={takePhoto}>
							<ButtonText>Take Photo</ButtonText>
						</Button>
					</HStack>

					{/* Bottom Controls */}
					{/* <Box position='absolute' bottom='$90' left={0} right={0}>
						<Center>
							<Pressable onPress={takePhoto}>
								<Box
									w='$20'
									h='$20'
									borderRadius='$full'
									bg='$white'
									justifyContent='center'
									alignItems='center'
									borderWidth='$1'
									borderColor='rgba(255,255,255,0.3)'>
									<Box
										w='$15'
										h='$15'
										borderRadius='$full'
										bg='$white'
									/>
								</Box>
							</Pressable>
						</Center>
					</Box> */}
				</Box>
			</Box>
		);
	}

	return (
		<Box flex={1} bg='$backgroundLight50'>
			{/* Header */}
			{/* <Box bg='$white' p='$5' pt='$16'>
				<Center>
					<Heading size='2xl' mb='$2'>
						Camera App
					</Heading>
					<Text color='$textLight600' size='md'>
						Tap the button below to open camera
					</Text>
				</Center>
			</Box> */}

			{/* Photo Display or Placeholder */}
			<Box flex={1} p='$5'>
				{capturedPhoto ? (
					<VStack space='lg' alignItems='center' flex={1}>
						{/* <Heading size='lg'>Last Captured Photo</Heading> */}
						<Image
							source={{ uri: capturedPhoto }}
							style={{
								width: 300,
								height: 300,
								borderRadius: 15,
							}}
						/>
						<HStack space='md' justifyContent='center'>
							<Button
								size='lg'
								bg='$blue600'
								borderRadius='$full'
								onPress={retakePhoto}>
								<HStack space='sm' alignItems='center'>
									<Camera size={20} color='white' />
									<ButtonText>Retake</ButtonText>
								</HStack>
							</Button>
							{/* <Button
								onPress={() =>
									router.replace({
										pathname: "/account",
										params: { result: "myresult" },
									})
								}>
								<ButtonText>Retour</ButtonText>
							</Button> */}
							{/* <Button
								size='lg'
								bg='$red600'
								borderRadius='$full'
								onPress={() => setCapturedPhoto(null)}>
								<HStack space='sm' alignItems='center'>
									<Trash2 size={20} color='white' />
									<ButtonText>Delete</ButtonText>
								</HStack>
							</Button> */}
						</HStack>
					</VStack>
				) : (
					<Center flex={1}>
						<VStack space='md' alignItems='center'>
							<ImageIcon size={100} color='#ccc' />
							<Text color='$textLight400' size='md'>
								No photos captured yet
							</Text>
						</VStack>
					</Center>
				)}
			</Box>

			{/* Open Camera Button */}
			{/* <Box m='$5'>
				<Button
					size='lg'
					bg='$blue600'
					borderRadius='$full'
					onPress={openCamera}>
					<HStack space='sm' alignItems='center'>
						<Camera size={24} color='white' />
						<ButtonText size='lg'>Open Camera</ButtonText>
					</HStack>
				</Button>
			</Box> */}
		</Box>
	);
}
