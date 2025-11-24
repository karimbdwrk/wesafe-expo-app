import React from "react";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetItem,
	ActionsheetItemText,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";

export default function Tab1() {
	const [showActionsheet, setShowActionsheet] = React.useState(false);
	const handleClose = () => setShowActionsheet(false);

	return (
		<>
			<Center className='flex-1'>
				<Heading className='font-bold text-2xl'>Expo - Tab 1</Heading>
				<Divider className='my-[30px] w-[80%]' />
				<Text className='p-4'>
					Example below to use gluestack-ui components.
				</Text>
				<EditScreenInfo path='app/(app)/(tabs)/tab1.tsx' />
				<Button onPress={() => setShowActionsheet(true)}>
					<ButtonText>Open Actionsheet</ButtonText>
				</Button>
			</Center>
			<Actionsheet isOpen={showActionsheet} onClose={handleClose}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<ActionsheetItem onPress={handleClose}>
						<ActionsheetItemText>Edit Message</ActionsheetItemText>
					</ActionsheetItem>
					<ActionsheetItem onPress={handleClose}>
						<ActionsheetItemText>Mark Unread</ActionsheetItemText>
					</ActionsheetItem>
					<ActionsheetItem onPress={handleClose}>
						<ActionsheetItemText>Remind Me</ActionsheetItemText>
					</ActionsheetItem>
					<ActionsheetItem onPress={handleClose}>
						<ActionsheetItemText>
							Add to Saved Items
						</ActionsheetItemText>
					</ActionsheetItem>
					<ActionsheetItem isDisabled onPress={handleClose}>
						<ActionsheetItemText>Delete</ActionsheetItemText>
					</ActionsheetItem>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
}
