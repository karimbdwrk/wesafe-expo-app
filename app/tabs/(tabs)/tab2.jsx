import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	ScrollView,
	StyleSheet,
	View,
	RefreshControl,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { today } from "@internationalized/date";

import { Text } from "@/components/ui/text";
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
} from "@/components/ui/actionsheet";
import {
	Checkbox,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxIcon,
	CheckboxGroup,
} from "@/components/ui/checkbox";

import JobCard from "@/components/JobCard";

import {
	ChevronLeft,
	ChevronRight,
	Info,
	SlidersHorizontal,
	Check,
	Search,
	X,
} from "lucide-react-native";

import { useDataContext } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

import JobsList from "@/components/JobsList";

const ITEMS_PER_PAGE = 5;
const currentDate = today("UTC").toString();

export default function Tab2() {
	const scrollRef = useRef(null);
	const { user } = useAuth();
	const { getAll, isLoading } = useDataContext();
	const { isDark } = useTheme();
	const params = useLocalSearchParams();
	// const [searchParams, setSearchParams] = useState(params.search || "");

	const [showActionsheet, setShowActionsheet] = useState(false);
	const handleClose = () => setShowActionsheet(false);

	const [showActionsheet2, setShowActionsheet2] = useState(false);
	const handleClose2 = () => setShowActionsheet2(false);

	const [values, setValues] = useState([]);
	const [resetValues, setResetValues] = useState(false);
	const [filters, setFilters] = useState("");
	const [keywords, setKeywords] = useState("");

	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const [jobs, setJobs] = useState([]);

	const [totalCount, setTotalCount] = useState(0);
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	useEffect(() => {
		console.log("Received search params:", params);
	}, [params]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadDataJobs();
		setRefreshing(false);
	}, [filters, page]);

	const loadDataJobs = async () => {
		const { data, totalCount } = await getAll(
			"jobs",
			"*",
			`&isArchived=eq.FALSE${filters}&isLastMinute=eq.TRUE&date=eq.${currentDate}`,
			page,
			ITEMS_PER_PAGE,
			"date.desc",
		);
		setJobs(data);
		setTotalCount(totalCount);
	};

	useEffect(() => {
		let filter = "";
		if (values.length > 0 && resetValues) {
			setKeywords("");
			setResetValues(false);
			const formatted = values.map((c) => `"${c}"`).join(",");
			filter = `&category=in.(${formatted})`;
		} else {
			loadDataJobs();
		}
		setFilters(filter);
	}, [values]);

	useEffect(() => {
		let filter = "";

		if (keywords.trim() !== "") {
			const encodedKeyword = encodeURIComponent(`%${keywords}%`);
			filter = `&or=(title.ilike.${encodedKeyword},category.ilike.${encodedKeyword})`;
		}
		setResetValues(true);
		setFilters(filter);
	}, [keywords]);

	useEffect(() => {
		loadDataJobs();
	}, [page, filters]);

	useFocusEffect(
		useCallback(() => {
			loadDataJobs();
		}, [page]),
	);

	const handleResetKeywords = () => {
		setKeywords("");
	};

	const handleRemoveValue = (value) => {
		setValues((prevValues) => prevValues.filter((v) => v !== value));
	};

	const handleNext = () => {
		setPage((prev) => prev + 1);
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};
	const handlePrev = () => {
		setPage((prev) => Math.max(prev - 1, 1));
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	return (
		<VStack
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f9fafb",
			}}>
			<JobsList pageNbr={1} itemsPerPage={10} isLastMinute={false} />
		</VStack>
	);
}
