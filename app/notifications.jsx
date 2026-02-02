import React, { useState, useEffect, useCallback } from "react";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { InfoIcon } from "@/components/ui/icon";

const Notifications = () => {
	return (
		<VStack style={{ flex: 1, padding: 15 }}>
			<Heading>Notifications Screen</Heading>
			<Text>This is where notifications will be displayed.</Text>
		</VStack>
	);
};

export default Notifications;
