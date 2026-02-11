import React from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeft } from "lucide-react-native";
import MessageThread from "@/components/MessageThread";

const MessagingScreen = () => {
	const router = useRouter();
	const { apply_id, other_party_name, is_read_only } = useLocalSearchParams();

	const isReadOnly = is_read_only === "true";

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<HStack
					space='md'
					className='items-center p-4 border-b border-outline-200'>
					<Button
						size='sm'
						variant='link'
						onPress={() => router.back()}>
						<ButtonIcon as={ArrowLeft} />
					</Button>
					<Heading size='md'>
						{other_party_name || "Messagerie"}
					</Heading>
				</HStack>
			</View>

			<View style={styles.content}>
				<MessageThread
					applyId={apply_id}
					isReadOnly={isReadOnly}
					otherPartyName={other_party_name}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	content: {
		flex: 1,
	},
});

export default MessagingScreen;
