import React, { useRef, useState, useEffect } from "react";
import { View, TextInput } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

export default function OTPForm({ onSubmit, status, onReset }) {
	const [otp, setOtp] = useState(new Array(6).fill(""));
	const inputs = useRef([]);
	const { isDark } = useTheme();

	useEffect(() => {
		if (status === "error") {
			const t = setTimeout(() => {
				setOtp(new Array(6).fill(""));
				inputs.current[0]?.focus();
			}, 700);
			return () => clearTimeout(t);
		}
	}, [status]);

	const handleChange = (text, index) => {
		if (status && onReset) onReset();
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

	const borderColor =
		status === "success"
			? "#22c55e"
			: status === "error"
				? "#ef4444"
				: isDark
					? Colors.dark.border
					: Colors.light.border;

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
							borderWidth: status ? 2 : 1,
							borderColor,
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
