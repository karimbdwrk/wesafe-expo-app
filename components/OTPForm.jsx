import React, { useRef, useState } from "react";
import { View, TextInput } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

export default function OTPForm({ onSubmit }) {
	const [otp, setOtp] = useState(new Array(6).fill(""));
	const inputs = useRef([]);
	const { isDark } = useTheme();

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
						style={{
							width: 40,
							height: 50,
							borderWidth: 1,
							borderColor: isDark
								? Colors.dark.border
								: Colors.light.border,
							borderRadius: 5,
							fontSize: 18,
							textAlign: "center",
							color: isDark
								? Colors.dark.text
								: Colors.light.text,
							backgroundColor: isDark
								? Colors.dark.elevated
								: Colors.light.elevated,
						}}
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
