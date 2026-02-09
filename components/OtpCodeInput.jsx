import React, { useRef } from "react";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";

export const OtpCodeInput = ({
	value,
	onChange,
	length = 6,
	isInvalid = false,
	// onComplete,
}) => {
	const inputsRef = useRef([]);

	const handleChange = (text, index) => {
		// On ne garde qu'un chiffre
		const char = text.slice(-1).replace(/[^0-9]/g, "");
		const valueArray = value.split("");

		valueArray[index] = char;
		const newValue = valueArray.join("");
		onChange(newValue);
		console.log("OTP VALUE:", newValue);

		// Focus input suivant si rempli
		if (char && index < length - 1) {
			inputsRef.current[index + 1]?.focus();
		}

		// // Appeler onComplete si tous les champs sont remplis
		// if (char && newValue.length === length && onComplete) {
		// 	onComplete(newValue);
		// }
	};

	const handleKeyPress = (e, index) => {
		if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
			inputsRef.current[index - 1]?.focus();
		}
	};

	const handleFocus = (index) => {
		// Si l'input est vide, ne pas placer le curseur au milieu
		if (!value[index]) {
			const valueArray = value.split("");
			valueArray[index] = "";
			onChange(valueArray.join(""));
		}
	};

	return (
		<HStack
			style={{
				width: "100%",
				justifyContent: "space-around",
			}}>
			{Array.from({ length }).map((_, index) => (
				<Input
					key={index}
					variant='outline'
					size='lg'
					isInvalid={isInvalid}
					style={{
						width: 36,
						height: 50,
					}}
					textAlign='center'>
					<InputField
						ref={(el) => (inputsRef.current[index] = el)}
						keyboardType='number-pad'
						maxLength={1}
						value={value[index] ?? ""}
						onChangeText={(text) => handleChange(text, index)}
						onKeyPress={(e) => handleKeyPress(e, index)}
						onFocus={() => handleFocus(index)}
						textAlign='center'
						fontSize={18}
					/>
				</Input>
			))}
		</HStack>
	);
};
