import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";

export default function TestSheet() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onPress={() => setOpen(true)}>
				<Text>Open Test Sheet</Text>
			</Button>
			<Actionsheet
				isOpen={open}
				onClose={() => setOpen(false)}
				snapPoints={[0.5]}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<Text style={{ padding: 20 }}>
						HELLO FROM GLUESTACK ACTIONSHEET
					</Text>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
}
