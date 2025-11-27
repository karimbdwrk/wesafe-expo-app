import React, { useRef } from "react";
import { View } from "react-native";
import Signature from "react-native-signature-canvas";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";

const SignatureCapture = ({ onSave }) => {
	const ref = useRef();

	const handleOK = (signature) => {
		// signature is a base64 encoded png
		onSave(signature);
	};

	const handleClear = () => {
		ref.current.clearSignature();
	};

	const handleConfirm = () => {
		ref.current.readSignature();
	};

	return (
		<VStack style={{ flex: 1, padding: 15 }}>
			<Heading>Signer ici :</Heading>
			<View
				style={{
					flex: 1,
					borderRadius: 16,
					overflow: "hidden",
					borderWidth: 1,
					borderColor: "#ccc",
				}}>
				<Signature
					ref={ref}
					onOK={handleOK}
					webStyle={`
                        .m-signature-pad--footer {display: none;} 
                        .m-signature-pad {
                            border-radius: 16px;
                            overflow: hidden;
                        }
                        .m-signature-pad--body {
                            border-radius: 16px;
                        }`}
					backgroundColor='transparent'
					penColor='black'
				/>
			</View>
			<HStack
				style={{
					justifyContent: "space-between",
					paddingBottom: 60,
					paddingTop: 15,
				}}>
				<Button onPress={handleConfirm} style={{ width: "45%" }}>
					<ButtonText>Valider</ButtonText>
				</Button>
				<Button
					variant='outline'
					onPress={handleClear}
					style={{ width: "45%" }}>
					<ButtonText>Effacer</ButtonText>
				</Button>
			</HStack>
		</VStack>
	);
};

export default SignatureCapture;
