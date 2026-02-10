import React, { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";

import Gradient from "@/assets/icons/Gradient";
import Logo from "@/assets/icons/Logo";
import { Box } from "@/components/ui/box";
import { ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { Layers } from "lucide-react-native";

const FeatureCard = ({ iconSvg: IconSvg, name, desc }) => {
	return (
		<Box
			className='flex-column md:flex-1 m-2 p-4 rounded-lg bg-background-0/40'
			key={name}>
			<Box className='items-center flex flex-row'>
				<Icon as={IconSvg} />
				<Text className='font-medium ml-2 text-xl'>{name}</Text>
			</Box>
			<Text className='mt-2'>{desc}</Text>
		</Box>
	);
};

export default function Home() {
	const router = useRouter();
	const {
		accessToken,
		role,
		signOut,
		user,
		userProfile,
		userCompany,
		loadUserData,
		loadSession,
		checkSubscription,
		hasSubscription,
		loading: authLoading,
	} = useAuth();

	return (
		<Box className='flex-1 bg-background-300 h-[100vh]'>
			<Box className='absolute h-[500px] w-[500px] lg:w-[700px] lg:h-[700px]'>
				<Gradient />
			</Box>
		</Box>
	);
}
