import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import axios from "axios";

import * as ImagePicker from "expo-image-picker";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
} from "@/components/ui/actionsheet";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import {
	Camera,
	User,
	SquarePen,
	Plus,
	Images,
	UserPlus,
} from "lucide-react-native";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "avatars";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const AvatarUploader = ({ image, onUpload }) => {
	const { user, userProfile, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { setImage } = useImage();
	const router = useRouter();

	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		image && handleUpload(image);
	}, [image]);

	const pickImage = async () => {
		console.log("open picker clicked !");
		setShowActionsheet(false);

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		});

		console.log("result :", result);

		if (result.assets) {
			console.log("result assets mimeType :", result.assets[0].mimeType);
			handleUpload(result.assets[0]);
		}
	};

	const handleUpload = async (values) => {
		console.log("handleUpload values", values, accessToken);

		try {
			console.log("values to upload", values);
			const formData = new FormData();
			let filename = values.uri.split("/").pop();
			let match = /\.(\w+)$/.exec(filename);
			let type = match ? `image/${match[1]}` : `image`;
			formData.append("files", { uri: values.uri, name: filename, type });

			const response = await axios.post(
				`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
				}
			);
			console.log("Response upload:", response.data);
			const publicUrl = `${STORAGE_URL}/${filename}`;
			await update("profiles", user.id, { avatar_url: publicUrl });
			setAvatarUrl(publicUrl);
			await loadUserData(user.id, accessToken);
			setImage(null);
			onUpload();
		} catch (error) {
			console.error("Error upload:", error);
		}
	};

	return (
		<Pressable
			onPress={() => setShowActionsheet(true)}
			style={{
				width: "100%",
				height: "100%",
				position: "absolute",
				top: 0,
			}}>
			<Center>
				<VStack space='lg' alignItems='center'>
					{loading ? (
						<Spinner size='large' />
					) : (
						<>
							<VStack
								style={{
									width: "100%",
									height: "100%",
									alignItems: "center",
									justifyContent: "center",
								}}>
								{!avatarUrl && <Camera color='lightgrey' />}
							</VStack>
							<Actionsheet
								isOpen={showActionsheet}
								onClose={handleClose}>
								<ActionsheetBackdrop />
								<ActionsheetContent>
									<ActionsheetDragIndicatorWrapper>
										<ActionsheetDragIndicator />
									</ActionsheetDragIndicatorWrapper>
									<HStack
										style={{
											gap: 15,
											paddingTop: 15,
											paddingBottom: 30,
										}}>
										<Button
											onPress={pickImage}
											style={{ width: "45%" }}>
											<ButtonIcon as={Images} />
											<ButtonText>Galerie</ButtonText>
										</Button>
										<Button
											onPress={() => {
												router.push("/camera");
												setShowActionsheet(false);
											}}
											style={{ width: "45%" }}>
											<ButtonIcon as={Camera} />
											<ButtonText>
												Appareil photo
											</ButtonText>
										</Button>
									</HStack>
								</ActionsheetContent>
							</Actionsheet>
						</>
					)}
				</VStack>
			</Center>
		</Pressable>
	);
};

export default AvatarUploader;
