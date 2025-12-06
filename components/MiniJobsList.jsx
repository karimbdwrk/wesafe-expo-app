import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
	Actionsheet,
	ActionsheetContent,
	ActionsheetItem,
	ActionsheetItemText,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetBackdrop,
	ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import {
	Checkbox,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxIcon,
	CheckboxGroup,
} from "@/components/ui/checkbox";
import { Center } from "@/components/ui/center";
import {
	Slider,
	SliderThumb,
	SliderTrack,
	SliderFilledTrack,
} from "@/components/ui/slider";

import JobCard from "@/components/JobCard";

import {
	ChevronLeft,
	ChevronRight,
	Info,
	SlidersHorizontal,
	Check,
	Search,
	X,
	Pin,
	MapPin,
	IdCard,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 5;

const MiniJobsList = ({
	heading,
	subtitle,
	pageNbr,
	itemsPerPage,
	regionName,
	regionCode,
	category,
	filtersSup,
}) => {
	const scrollRef = useRef(null);
	const { user, accessToken, userProfile } = useAuth();
	const { getAll, isLoading } = useDataContext();
	const [filters, setFilters] = useState("");
	const [jobs, setJobs] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const loadDataJobs = async () => {
		const { data, totalCount } = await getAll(
			"jobs",
			"*,companies(logo_url)",
			`&isArchived=eq.FALSE${filtersSup}&region_code=eq.${regionCode}${filters}`,
			1,
			itemsPerPage,
			"date.desc"
		);
		setJobs(data);
		setTotalCount(totalCount);
	};

	useEffect(() => {
		loadDataJobs();
	}, [filters]);

	useEffect(() => {
		if (category && category.length > 0) {
			let filterString = "";
			const formattedCategories = category.map((c) => `"${c}"`).join(",");
			filterString += `&category=in.(${formattedCategories})`;
			setFilters(filterString);
		}
	}, [category]);

	return (
		<VStack style={styles.container}>
			<VStack
				style={{
					// paddingHorizontal: 15,
					paddingTop: 15,
					justifyContent: "flex-start",
					width: "100%",
				}}>
				<Heading>{heading}</Heading>
				<Text size='xs' italic>
					{subtitle}
				</Text>
				<HStack style={{ gap: 10, paddingVertical: 10 }}>
					<Badge size='md' variant='solid' action='muted'>
						<BadgeIcon as={MapPin} className='mr-2' />
						<BadgeText>{regionName}</BadgeText>
					</Badge>
					{category &&
						category.length > 0 &&
						category.map((cat) => (
							<Badge
								key={cat}
								size='md'
								variant='solid'
								action='muted'>
								<BadgeIcon as={IdCard} className='mr-2' />
								<BadgeText>{cat}</BadgeText>
							</Badge>
						))}
				</HStack>
			</VStack>
			<VStack style={styles.jobList}>
				{!jobs.length && (
					<HStack
						justifyContent='center'
						style={{ paddingVertical: 90 }}>
						<Badge size='md' variant='solid' action='warning'>
							<BadgeIcon as={Info} className='mr-2' />
							<BadgeText>Aucun résultat</BadgeText>
						</Badge>
					</HStack>
				)}
				{jobs.map((job) => (
					<JobCard
						key={job?.id}
						id={job?.id}
						title={job?.title}
						category={job?.category}
						company_id={job?.company_id}
						city={job?.city}
						department={job?.department_code}
						isLastMinute={job?.isLastMinute}
					/>
				))}
			</VStack>
		</VStack>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		backgroundColor: "white",
	},
	scrollView: {
		flex: 1,
		width: "100%",
		paddingHorizontal: 15,
	},
	jobList: {
		flex: 1,
		gap: 15,
		width: "100%",
		marginVertical: 15,
		// paddingHorizontal: 15,
	},
});

export default MiniJobsList;
