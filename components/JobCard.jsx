import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { toast } from "sonner-native";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
	MapPin,
	Timer,
	IdCard,
	Bookmark,
	BookmarkCheck,
	Check,
	Building2,
	FileText,
	Clock,
	Banknote,
	BadgeEuro,
	ChevronRight,
} from "lucide-react-native";
import { width } from "dom-helpers";
import { getCategoryLabel } from "@/constants/categories";
import { formatSalary } from "@/constants/salary";

const JobCard = ({
	id,
	title,
	category,
	company_id,
	company_name,
	city,
	postcode,
	department,
	isArchived,
	isLastMinute,
	logo,
	contract_type,
	working_time,
	salary_hourly,
	salary_amount,
	salary_min,
	salary_max,
	salary_type,
	salary_monthly_fixed,
	salary_monthly_min,
	salary_monthly_max,
	salary_annual_fixed,
	salary_annual_min,
	salary_annual_max,
}) => {
	const router = useRouter();
	const { isDark } = useTheme();
	const { user, role } = useAuth();
	const { toggleWishlistJob, isJobInWishlist } = useDataContext();
	const isFocused = useIsFocused();
	const [isInWishlist, setIsInWishlist] = useState(false);

	useEffect(() => {
		console.log("company_name dans JobCard:", company_name);
	}, [company_name]);

	useEffect(() => {
		const checkWishlist = async () => {
			if (user?.id && id) {
				const inWishlist = await isJobInWishlist(id, user.id);
				setIsInWishlist(inWishlist);
			}
		};
		checkWishlist();
	}, [id, user?.id, isFocused]);

	const handleToggleWishlist = async (e) => {
		e.stopPropagation();
		const isNowInWishlist = await toggleWishlistJob(id, user.id);
		setIsInWishlist(isNowInWishlist);
		toast.success(
			isNowInWishlist ? "Ajouté aux favoris" : "Retiré des favoris",
			{
				description: isNowInWishlist
					? "Cette offre a été ajoutée à votre liste de favoris"
					: "Cette offre a été retirée de votre liste de favoris",
				duration: 2000,
				icon: <Check />,
			},
		);
	};

	return (
		<TouchableOpacity
			onPress={() =>
				router.push({
					pathname: "/job",
					params: { id, title, company_id, category },
				})
			}
			activeOpacity={0.7}>
			<Card
				style={{
					backgroundColor: isDark ? "#374151" : "#ffffff",
					borderRadius: 8,
					padding: 16,
					marginBottom: 12,
					borderWidth: 1,
					borderColor: isDark ? "#4b5563" : "#e5e7eb",
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				{isLastMinute && (
					<Timer
						size={20}
						color='#f59e0b'
						style={{ position: "absolute", right: 50, top: 16 }}
					/>
				)}
				{role !== "pro" && (
					<TouchableOpacity
						onPress={handleToggleWishlist}
						style={{
							position: "absolute",
							right: 16,
							top: 16,
							zIndex: 10,
						}}
						activeOpacity={0.7}>
						<Icon
							as={isInWishlist ? BookmarkCheck : Bookmark}
							size='xl'
							style={{
								color: isInWishlist
									? "#3b82f6"
									: isDark
										? "#9ca3af"
										: "#6b7280",
							}}
						/>
					</TouchableOpacity>
				)}
				<VStack space='md' style={{ width: "90%" }}>
					<Heading
						size='lg'
						style={{
							color: isDark ? "#f3f4f6" : "#111827",
							lineHeight: 24,
						}}>
						{title}
					</Heading>

					<HStack space='md' style={{ alignItems: "center" }}>
						<Avatar size='md'>
							<AvatarFallbackText>
								{company_name || "Company"}
							</AvatarFallbackText>
							{logo && <AvatarImage source={{ uri: logo }} />}
						</Avatar>
						<VStack style={{ flex: 1 }}>
							<HStack
								space='xs'
								style={{
									alignItems: "center",
									marginTop: 2,
								}}>
								{/* <Building2
									size={14}
									color={isDark ? "#f3f4f6" : "#111827"}
								/> */}
								<Text
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
										fontWeight: "500",
									}}>
									{company_name || "Entreprise"}
								</Text>
							</HStack>
							{city && (
								<HStack
									space='xs'
									style={{
										alignItems: "center",
										marginTop: 2,
									}}>
									<MapPin
										size={12}
										color={isDark ? "#9ca3af" : "#6b7280"}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{city + " (" + postcode + ")"}
									</Text>
								</HStack>
							)}
						</VStack>
					</HStack>

					<HStack
						space='sm'
						style={{
							alignItems: "center",
							flexWrap: "wrap",
							marginTop: 5,
						}}>
						<Badge size='sm' variant='solid' action='info'>
							<BadgeIcon as={IdCard} className='mr-2' />
							<BadgeText>{getCategoryLabel(category)}</BadgeText>
						</Badge>
						{contract_type && (
							<Badge size='sm' variant='solid' action='success'>
								<BadgeIcon as={FileText} className='mr-2' />
								<BadgeText>{contract_type}</BadgeText>
							</Badge>
						)}
						{working_time && (
							<Badge size='sm' variant='solid' action='muted'>
								<BadgeIcon as={Clock} className='mr-2' />
								<BadgeText>
									{working_time.toLowerCase().includes("part")
										? "Temps partiel"
										: "Temps plein"}
								</BadgeText>
							</Badge>
						)}
						{salary_type && (
							<Badge size='sm' variant='solid' action='warning'>
								<BadgeIcon as={BadgeEuro} className='mr-2' />
								<BadgeText>
									{formatSalary({
										salary_type,
										salary_hourly,
										salary_monthly_fixed,
										salary_annual_fixed,
										salary_monthly_min,
										salary_monthly_max,
										salary_annual_min,
										salary_annual_max,
									})}
								</BadgeText>
							</Badge>
						)}
						{isArchived && (
							<Badge size='sm' variant='solid' action='error'>
								<BadgeText>Archivé</BadgeText>
							</Badge>
						)}
					</HStack>
				</VStack>
				<HStack
					space='sm'
					style={{
						alignItems: role === "pro" ? "center" : "flex-end",
						justifyContent: "flex-end",
						width: "10%",
					}}>
					<Icon
						as={ChevronRight}
						size='lg'
						style={{
							color: isDark ? "#9ca3af" : "#6b7280",
						}}
					/>
				</HStack>
			</Card>
		</TouchableOpacity>
	);
};

export default JobCard;
