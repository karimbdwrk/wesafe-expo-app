import React, { useRef } from "react";
import { View } from "react-native";
import Signature from "react-native-signature-canvas";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const SignatureCapture = ({ onSave }) => {
	const ref = useRef();
	const { isDark } = useTheme();

	const handleOK = (signature) => {
		onSave(signature);
	};

	const handleClear = () => {
		ref.current.clearSignature();
	};

	const handleConfirm = () => {
		ref.current.readSignature();
	};

	return (
		<VStack>
			{/* Canvas */}
			<View
				style={{
					height: 180,
					width: "100%",
				}}>
				<Signature
					ref={ref}
					onOK={handleOK}
					style={{ flex: 1 }}
					webStyle={`
						.m-signature-pad--footer { display: none; }
						body { margin: 0; }
						.m-signature-pad { box-shadow: none; border: none; margin: 0; width: 100%; height: 100%; }
						.m-signature-pad--body { border: none; width: 100%; height: 100%; }`}
					backgroundColor={isDark ? "#374151" : "#ffffff"}
					penColor={isDark ? "#f3f4f6" : "#111827"}
				/>
			</View>

			{/* Boutons */}
			<HStack
				space='sm'
				style={{
					paddingHorizontal: 16,
					paddingVertical: 12,
					borderTopWidth: 1,
					borderTopColor: isDark ? "#4b5563" : "#e5e7eb",
				}}>
				<Button
					variant='outline'
					onPress={handleClear}
					style={{
						flex: 1,
						borderRadius: 8,
						borderColor: isDark ? "#4b5563" : "#d1d5db",
					}}>
					<ButtonIcon
						as={Trash2}
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
					/>
					<ButtonText
						style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
						Effacer
					</ButtonText>
				</Button>
				<Button
					onPress={handleConfirm}
					style={{
						flex: 2,
						borderRadius: 8,
						backgroundColor: "#3b82f6",
					}}>
					<ButtonIcon as={Check} style={{ color: "#ffffff" }} />
					<ButtonText style={{ color: "#ffffff" }}>
						Enregistrer la signature
					</ButtonText>
				</Button>
			</HStack>
		</VStack>
	);
};

export default SignatureCapture;
