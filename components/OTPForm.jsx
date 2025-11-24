import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function OTPForm({ onSubmit }) {
	const [otp, setOtp] = useState(new Array(6).fill(""));
	const inputs = useRef([]);

	const handleChange = (text, index) => {
		if (/^\d$/.test(text)) {
			const newOtp = [...otp];
			newOtp[index] = text;
			setOtp(newOtp);
			if (index < 5) {
				inputs.current[index + 1].focus();
			} else {
				onSubmit(newOtp.join(""));
			}
		} else if (text === "") {
			const newOtp = [...otp];
			newOtp[index] = "";
			setOtp(newOtp);
		}
	};

	const handleKeyPress = (e, index) => {
		if (
			e.nativeEvent.key === "Backspace" &&
			otp[index] === "" &&
			index > 0
		) {
			inputs.current[index - 1].focus();
		}
	};

	return (
		<View style={{ padding: 15 }}>
			<HStack style={{ gap: 12 }} justifyContent='center'>
				{otp.map((digit, index) => (
					<TextInput
						key={index}
						ref={(ref) => (inputs.current[index] = ref)}
						style={styles.input}
						keyboardType='number-pad'
						maxLength={1}
						value={digit}
						onChangeText={(text) => handleChange(text, index)}
						onKeyPress={(e) => handleKeyPress(e, index)}
						textAlign='center'
					/>
				))}
			</HStack>
		</View>
	);
}

const styles = StyleSheet.create({
	input: {
		width: 40,
		height: 50,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		fontSize: 18,
		// marginHorizontal: 5,
	},
});
