import React, { useState, useCallback, useRef, useMemo } from "react";
import {
	SectionList,
	TouchableOpacity,
	TouchableHighlight,
	RefreshControl,
	ActivityIndicator,
	View,
	Text as RNText,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import {
	Avatar,
	AvatarFallbackText,
	AvatarImage,
} from "@/components/ui/avatar";

import { ChevronRight, Info, QrCode } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { CNAPS_CARDS } from "@/constants/cnapscards";
import { CATEGORY } from "@/constants/categories";
import { JOB_REQUIREMENTS } from "@/constants/jobrequirements";

// Charge tout d'un coup pour pouvoir trier/grouper côté client
const ITEMS_PER_PAGE = 500;

// Normalise une lettre (enlève accents) pour le classement
const normalize = (str) =>
	(str || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toUpperCase();

/**
 * Calcule les métiers accessibles pour un profil à partir de ses documents vérifiés.
 * Logique identique à SuggestedJobs.jsx.
 */
const getEligibleJobs = (profileData) => {
	const now = new Date();

	const cnapsSet = new Set(
		(profileData?.user_cnaps_cards ?? [])
			.filter(
				(c) =>
					c.status === "verified" &&
					(!c.expires_at || new Date(c.expires_at) > now),
			)
			.map(
				(c) =>
					CNAPS_CARDS[c.type?.toLowerCase()]?.acronym ??
					c.type?.toUpperCase(),
			)
			.filter(Boolean),
	);

	const diplomasSet = new Set(
		(profileData?.user_diplomas ?? [])
			.filter((d) => d.status === "verified")
			.map((d) => d.type?.toUpperCase())
			.filter(Boolean),
	);

	const certsSet = new Set(
		(profileData?.user_certifications ?? [])
			.filter((c) => c.status === "verified")
			.map((c) => c.type?.toUpperCase())
			.filter(Boolean),
	);

	return Object.entries(JOB_REQUIREMENTS)
		.filter(([, req]) => {
			const hasCnaps =
				req.cnaps.length === 0 ||
				req.cnaps.every((c) => cnapsSet.has(c));
			const hasDiploma =
				req.diplomas.length === 0 ||
				req.diplomas.some((d) => diplomasSet.has(d));
			return hasCnaps && hasDiploma;
		})
		.map(([key]) => CATEGORY.find((c) => c.id === key))
		.filter(Boolean);
};

const ProfileListScreen = () => {
	const sectionListRef = useRef(null);
	const router = useRouter();
	const { user } = useAuth();
	const { getAll } = useDataContext();
	const { isDark } = useTheme();

	const [refreshing, setRefreshing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [profileList, setProfileList] = useState([]);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			// 1. Récupérer la liste des profils scannés
			const { data: listData } = await getAll(
				"profilelist",
				"*, profiles(id, firstname, lastname, avatar_url)",
				`&company_id=eq.${user.id}`,
				1,
				ITEMS_PER_PAGE,
				"created_at.desc",
			);
			const entries = listData || [];

			if (entries.length === 0) {
				setProfileList([]);
				return;
			}

			// 2. Récupérer les documents de tous les profils en parallèle
			const userIds = entries.map((e) => e.profiles?.id).filter(Boolean);
			const inFilter = `(${userIds.join(",")})`;

			const [cnapsRes, diplomasRes, certsRes] = await Promise.all([
				getAll(
					"user_cnaps_cards",
					"user_id,type,status,expires_at",
					`&user_id=in.${inFilter}`,
					1,
					1000,
				),
				getAll(
					"user_diplomas",
					"user_id,type,status",
					`&user_id=in.${inFilter}`,
					1,
					1000,
				),
				getAll(
					"user_certifications",
					"user_id,type,status",
					`&user_id=in.${inFilter}`,
					1,
					1000,
				),
			]);

			// 3. Indexer par user_id pour récupération O(1)
			const cnapsMap = {};
			const diplomasMap = {};
			const certsMap = {};
			(cnapsRes.data || []).forEach((r) => {
				if (!cnapsMap[r.user_id]) cnapsMap[r.user_id] = [];
				cnapsMap[r.user_id].push(r);
			});
			(diplomasRes.data || []).forEach((r) => {
				if (!diplomasMap[r.user_id]) diplomasMap[r.user_id] = [];
				diplomasMap[r.user_id].push(r);
			});
			(certsRes.data || []).forEach((r) => {
				if (!certsMap[r.user_id]) certsMap[r.user_id] = [];
				certsMap[r.user_id].push(r);
			});

			// 4. Enrichir chaque entrée avec ses documents
			const enriched = entries.map((e) => {
				const uid = e.profiles?.id;
				return {
					...e,
					profiles: {
						...e.profiles,
						user_cnaps_cards: cnapsMap[uid] ?? [],
						user_diplomas: diplomasMap[uid] ?? [],
						user_certifications: certsMap[uid] ?? [],
					},
				};
			});

			setProfileList(enriched);
		} finally {
			setIsLoading(false);
		}
	}, [user.id]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, [loadData]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	// Tri + groupement par première lettre du lastname
	const { sections, letters } = useMemo(() => {
		const sorted = [...profileList].sort((a, b) => {
			const la = normalize(a.profiles?.lastname);
			const lb = normalize(b.profiles?.lastname);
			if (la < lb) return -1;
			if (la > lb) return 1;
			return normalize(a.profiles?.firstname) <
				normalize(b.profiles?.firstname)
				? -1
				: 1;
		});

		const grouped = {};
		sorted.forEach((pro) => {
			const letter = normalize(pro.profiles?.lastname)?.[0] || "#";
			if (!grouped[letter]) grouped[letter] = [];
			grouped[letter].push(pro);
		});

		const letters = Object.keys(grouped).sort();
		const sections = letters.map((letter) => ({
			title: letter,
			data: grouped[letter],
		}));

		return { sections, letters };
	}, [profileList]);

	// Styles couleurs
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const elevated = isDark ? Colors.dark.elevated : Colors.light.elevated;
	const borderColor = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textMuted = isDark ? Colors.dark.muted : Colors.light.muted;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const warning = isDark ? Colors.dark.warning : Colors.light.warning;
	const sectionBg = isDark ? Colors.dark.background : Colors.light.background;
	const sectionText = isDark ? Colors.dark.muted : Colors.light.muted;
	const indexText = isDark ? Colors.dark.tint : Colors.light.tint;

	const renderItem = ({ item: pro, index, section }) => {
		const isLast = index === section.data.length - 1;
		const firstname = pro.profiles?.firstname || "";
		const lastname = pro.profiles?.lastname || "";
		const initials = [firstname[0], lastname[0]]
			.filter(Boolean)
			.join("")
			.toUpperCase();
		const eligibleJobs = getEligibleJobs(pro.profiles);

		return (
			<TouchableHighlight
				underlayColor={elevated}
				onPress={() =>
					router.push({
						pathname: "/profile",
						params: { profile_id: pro.candidate_id },
					})
				}>
				<View
					style={{
						backgroundColor: cardBg,
						paddingHorizontal: 16,
						paddingVertical: 11,
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
					}}>
					<Avatar size='md'>
						{pro.profiles?.avatar_url ? (
							<AvatarImage
								source={{ uri: pro.profiles.avatar_url }}
							/>
						) : null}
						<AvatarFallbackText>{initials}</AvatarFallbackText>
					</Avatar>

					<VStack style={{ flex: 1, gap: 2 }}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "500",
								color: textPrimary,
							}}>
							{lastname
								? lastname + (firstname ? " " + firstname : "")
								: "—"}
						</Text>
						{eligibleJobs.length > 0 ? (
							<HStack style={{ flexWrap: "wrap", gap: 5 }}>
								{eligibleJobs.map((job) => (
									<Badge
										key={job.id}
										size='sm'
										variant='solid'
										action='info'>
										<BadgeText>{job.acronym}</BadgeText>
									</Badge>
								))}
							</HStack>
						) : (
							<Text style={{ fontSize: 12, color: warning }}>
								Aucun métier qualifié
							</Text>
						)}
					</VStack>

					<ChevronRight size={16} color={textMuted} />

					{/* Séparateur interne (sauf dernier) */}
					{!isLast && (
						<View
							style={{
								position: "absolute",
								bottom: 0,
								left: 74,
								right: 0,
								height: 0.5,
								backgroundColor: borderColor,
							}}
						/>
					)}
				</View>
			</TouchableHighlight>
		);
	};

	const renderSectionHeader = ({ section }) => (
		<View
			style={{
				backgroundColor: sectionBg,
				paddingHorizontal: 16,
				paddingVertical: 4,
			}}>
			<RNText
				style={{
					fontSize: 13,
					fontWeight: "700",
					color: sectionText,
					letterSpacing: 0.5,
				}}>
				{section.title}
			</RNText>
		</View>
	);

	return (
		<View style={{ flex: 1, backgroundColor: bg }}>
			{isLoading && !refreshing ? (
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}>
					<ActivityIndicator size='large' color={tint} />
				</View>
			) : !profileList.length ? (
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}>
					<Info size={40} color={textMuted} />
					<Text
						style={{
							marginTop: 12,
							color: textMuted,
							fontSize: 15,
						}}>
						Aucun profil scanné
					</Text>
					<Button
						style={{ marginTop: 20, borderRadius: 12 }}
						onPress={() => router.push("/scanner")}>
						<ButtonIcon as={QrCode} />
						<ButtonText style={{ marginLeft: 8 }}>
							Scanner un profil
						</ButtonText>
					</Button>
				</View>
			) : (
				<View style={{ flex: 1 }}>
					<SectionList
						ref={sectionListRef}
						sections={sections}
						keyExtractor={(item) => item.id}
						renderItem={renderItem}
						renderSectionHeader={renderSectionHeader}
						stickySectionHeadersEnabled
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={onRefresh}
							/>
						}
						contentContainerStyle={{ paddingBottom: 100 }}
						// Séparateur entre sections (ligne complète)
						SectionSeparatorComponent={() => (
							<View
								style={{
									height: 0.5,
									backgroundColor: borderColor,
								}}
							/>
						)}
					/>

					{/* Index alphabétique latéral — masqué si moins de 10 contacts */}
					{profileList.length >= 10 && (
						<View
							style={{
								position: "absolute",
								right: 4,
								top: 0,
								bottom: 80,
								justifyContent: "center",
								alignItems: "center",
								gap: 1,
							}}>
							{letters.map((letter, i) => (
								<TouchableOpacity
									key={letter}
									hitSlop={{
										top: 4,
										bottom: 4,
										left: 8,
										right: 8,
									}}
									onPress={() => {
										sectionListRef.current?.scrollToLocation(
											{
												sectionIndex: i,
												itemIndex: 0,
												animated: true,
												viewOffset: 0,
											},
										);
									}}>
									<RNText
										style={{
											fontSize: 11,
											fontWeight: "600",
											color: indexText,
											lineHeight: 14,
										}}>
										{letter}
									</RNText>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>
			)}

			{/* FAB Scanner */}
			{!!profileList.length && (
				<Box
					style={{
						position: "absolute",
						bottom: 24,
						right: 24,
					}}>
					<Button
						size='lg'
						onPress={() => router.push("/scanner")}
						style={{
							borderRadius: 50,
							paddingHorizontal: 20,
							paddingVertical: 0,
							shadowColor: textMuted,
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.15,
							shadowRadius: 8,
							elevation: 6,
						}}>
						<ButtonIcon as={QrCode} />
						<ButtonText style={{ marginLeft: 8, fontSize: 16 }}>
							Scanner
						</ButtonText>
					</Button>
				</Box>
			)}
		</View>
	);
};

export default ProfileListScreen;
