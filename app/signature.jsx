import React, { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { decode } from "base64-arraybuffer";

import { Image } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import SignatureCapture from "@/components/SignatureCapture";

import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import { useDataContext } from "@/context/DataContext";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const BUCKET_NAME = "signatures";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const SignatureScreen = () => {
	const { setSignature, signature } = useImage();
	const { user, accessToken, loadUserData } = useAuth();
	const { update } = useDataContext();
	const { signatureUrl, isPro, type } = useLocalSearchParams();

	const [signatureImg, setSignatureImg] = useState(null);

	useEffect(() => {
		// console.log("signature in context :", signature, signatureImg);
		signatureUrl && setSignatureImg(signatureUrl);
		console.log("signature url param and is Pro :", signatureUrl);
	}, [signatureUrl]);

	const handleSaveSign = (signature) => {
		setSignatureImg(signature);
		setSignature(signature);
	};

	useEffect(() => {
		signature && handleUpload(signature);
	}, [signature]);

	const handleUpload = async (signatureBase64) => {
		try {
			const bucket = "signatures";
			const fileName = `${user.id}-${Date.now()}.png`;
			const filePath = `${bucket}/${fileName}`;

			// Strip the base64 header
			const base64Data = signatureBase64.replace(
				/^data:image\/\w+;base64,/,
				""
			);

			// Convert base64 to ArrayBuffer (works in React Native)
			const arrayBuffer = decode(base64Data);

			const response = await fetch(
				`${SUPABASE_URL}/storage/v1/object/${filePath}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "image/png",
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
					},
					body: arrayBuffer,
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Upload failed: ${response.status} - ${errorText}`
				);
			}

			const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;

			await update(type, user.id, {
				signature_url: publicUrl,
			});
			loadUserData(user.id, accessToken);
			setSignature(null);

			console.log("✅ Upload successful:", publicUrl);
		} catch (error) {
			console.error("❌ Upload error:", error.message || error);
		}
	};

	return (
		<VStack space='md' flex={1}>
			<VStack
				style={{
					justifyContent: "center",
					alignItems: "center",
					flex: 1,
				}}>
				{signatureImg && (
					<>
						<Heading>Aperçu de votre signature</Heading>
						<Image
							source={{ uri: signatureImg }}
							style={{ width: 500, height: 250 }}
							resizeMode='contain'
						/>
					</>
				)}
			</VStack>

			{/* Signature pad */}
			<SignatureCapture onSave={handleSaveSign} />
		</VStack>
	);
};

export default SignatureScreen;
