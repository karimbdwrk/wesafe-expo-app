import { useEffect, useRef, useState } from "react";

import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import StampCaptureUploader from "@/components/StampCaptureUploader";

const UpdateStampScreen = () => {
	// const { user, userCompany } = useAuth();

	// useEffect(() => {
	// 	console.log("userCompany :", userCompany);
	// }, [userCompany]);

	return (
		<VStack style={{ justifyContent: "center" }}>
			<StampCaptureUploader />
		</VStack>
	);
};

export default UpdateStampScreen;
