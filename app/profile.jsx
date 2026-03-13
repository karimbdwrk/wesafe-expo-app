import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect, Stack } from "expo-router";
import { ScrollView, TouchableOpacity, Image as RNImage } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import {
	Avatar,
	AvatarImage,
	AvatarFallbackText,
} from "@/components/ui/avatar";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	ActionsheetItem,
	ActionsheetItemText,
} from "@/components/ui/actionsheet";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Briefcase,
	Award,
	FileText,
	CheckCircle,
	UserPlus,
	UserMinus,
	IdCard,
	MessageSquare,
	MessageCircle,
	Shield,
	ShieldCheck,
	GraduationCap,
	Clock,
	XCircle,
	Globe,
	Car,
	Dumbbell,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

const ProfileScreen = () => {
	const { accessToken, signOut, user } = useAuth();
	const { getById, getAll, create, remove } = useDataContext();
	const { isDark } = useTheme();
	const { profile_id } = useLocalSearchParams();

	const [profile, setProfile] = useState(null);
	const [isAdded, setIsAdded] = useState(false);
	const [listUUID, setListUUID] = useState(null);
	const [showContactSheet, setShowContactSheet] = useState(false);
	const [certifications, setCertifications] = useState([]);
	const [cnapsCards, setCnapsCards] = useState([]);
	const [diplomas, setDiplomas] = useState([]);

	const loadData = async () => {
		const data = await getById("profiles", profile_id, `*`);
		console.log("data profile :", data);
		setProfile(data);

		const [certsResult, cnapsResult, diplomasResult] = await Promise.all([
			getAll(
				"user_certifications",
				"*",
				`&user_id=eq.${profile_id}`,
				1,
				100,
				"created_at.desc",
			),
			getAll(
				"user_cnaps_cards",
				"*",
				`&user_id=eq.${profile_id}`,
				1,
				100,
				"created_at.desc",
			),
			getAll(
				"user_diplomas",
				"*",
				`&user_id=eq.${profile_id}`,
				1,
				100,
				"created_at.desc",
			),
		]);

		console.log("certifications :", certsResult.data);
		console.log("cnaps cards :", cnapsResult.data);
		console.log("diplomas :", diplomasResult.data);

		setCertifications(certsResult.data ?? []);
		setCnapsCards(cnapsResult.data ?? []);
		setDiplomas(diplomasResult.data ?? []);
	};

	const loadList = async () => {
		const { data, totalCount } = await getAll(
			"profilelist",
			"*",
			`&candidate_id=eq.${profile_id}&company_id=eq.${user.id}`,
			1,
			1,
			"created_at.desc",
		);
		console.log("total count :", totalCount, data);
		totalCount === 1 && setIsAdded(true);
		totalCount === 1 && setListUUID(data[0].id);
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
			user && profile_id && loadList();
		}, []),
	);

	useEffect(() => {
		console.log("list profile uuid :", listUUID);
	}, [listUUID]);

	const handleToggle = () => {
		if (isAdded) {
			handleRemove();
		} else {
			handleAdd();
		}
	};

	const handleAdd = async () => {
		console.log("handle add in profile list ok !");
		try {
			const newProfile = await create("profilelist", {
				candidate_id: profile_id,
				company_id: user.id,
			});
			console.warn("new profile in list :", newProfile);
			setIsAdded(true);
			loadList();
		} catch (err) {
			console.error(
				"Error add in profile list:",
				err.response?.data || err.message,
			);
		}
	};

	const handleRemove = async () => {
		console.log("handle add in profile list ok !");
		try {
			const profil = await remove("profilelist", listUUID);
			console.log("remove from list :", profil);
			setIsAdded(false);
			// setListUUID(null);
			loadList();
		} catch (err) {
			console.error(
				"Error remove in profile list:",
				err.response?.data || err.message,
			);
		}
	};

	// ── Style tokens
	const sT = isDark ? "#f3f4f6" : "#111827";
	const mT = isDark ? "#9ca3af" : "#6b7280";
	const cardBg = isDark ? "#1f2937" : "#ffffff";
	const cardBorder = isDark ? "#374151" : "#e5e7eb";

	// ── Helpers
	const formatDate = (d) =>
		d ? new Date(d).toLocaleDateString("fr-FR") : null;
	const calcAge = (b) => {
		if (!b) return null;
		const today = new Date(),
			born = new Date(b);
		let age = today.getFullYear() - born.getFullYear();
		const m = today.getMonth() - born.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
		return age;
	};
	const isExpired = (d) => (d ? new Date(d) < new Date() : false);

	const CNAPS_LABELS = {
		SURVEILLANCE_HUMAINE: "Surveillance Humaine",
		PROTECTION_RAPPROCHEE: "Protection Rapprochée",
		CYNOPHILE: "Cynophile",
		SURVEILLANCE_ELECTRONIQUE: "Surveillance Électronique",
		TRANSPORT_FONDS: "Transport de Fonds",
	};
	const DIPLOMA_LABELS = {
		TFP_APS: "TFP APS",
		TFP_APR: "TFP APR",
		BTS_MSE: "BTS Métiers de la Sécurité",
		CQP_APS: "CQP APS",
	};
	const CERT_LABELS = {
		SST: "Sauveteur Secouriste du Travail (SST)",
		PSC1: "PSC1",
		HABILITATION_ELECTRIQUE: "Habilitation Électrique",
		CACES: "CACES",
	};

	// ── Mini composants (closures sur isDark/sT/mT/cardBorder)
	const SectionHeader = ({ icon: IC, title, iconColor, iconBg }) => (
		<HStack space='sm' style={{ alignItems: "center", marginBottom: 14 }}>
			<Box
				style={{
					width: 36,
					height: 36,
					borderRadius: 18,
					backgroundColor: iconBg,
					justifyContent: "center",
					alignItems: "center",
				}}>
				<Icon as={IC} size='sm' style={{ color: iconColor }} />
			</Box>
			<Text style={{ fontSize: 15, fontWeight: "700", color: sT }}>
				{title}
			</Text>
		</HStack>
	);

	const InfoRow = ({ icon: IC, label, value }) => {
		if (!value) return null;
		return (
			<HStack
				space='sm'
				style={{ alignItems: "center", paddingVertical: 6 }}>
				<Box
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isDark ? "#374151" : "#f3f4f6",
						justifyContent: "center",
						alignItems: "center",
					}}>
					<Icon as={IC} size='xs' style={{ color: mT }} />
				</Box>
				<VStack style={{ flex: 1 }}>
					<Text size='xs' style={{ color: mT }}>
						{label}
					</Text>
					<Text size='sm' style={{ color: sT, fontWeight: "500" }}>
						{value}
					</Text>
				</VStack>
			</HStack>
		);
	};

	const DocStatusBadge = ({ status, expiresAt }) => {
		const expired = isExpired(expiresAt);
		if (expired)
			return (
				<Badge size='sm' variant='solid' action='error'>
					<BadgeIcon as={XCircle} />
					<BadgeText className='ml-1'>Expiré</BadgeText>
				</Badge>
			);
		if (status === "verified")
			return (
				<Badge size='sm' variant='solid' action='success'>
					<BadgeIcon as={CheckCircle} />
					<BadgeText className='ml-1'>Vérifié</BadgeText>
				</Badge>
			);
		if (status === "pending")
			return (
				<Badge size='sm' variant='outline' action='warning'>
					<BadgeIcon as={Clock} />
					<BadgeText className='ml-1'>En attente</BadgeText>
				</Badge>
			);
		if (status === "rejected")
			return (
				<Badge size='sm' variant='solid' action='error'>
					<BadgeIcon as={XCircle} />
					<BadgeText className='ml-1'>Rejeté</BadgeText>
				</Badge>
			);
		return null;
	};

	const DocCard = ({ title, subtitle, expiresAt, status }) => (
		<Box
			style={{
				paddingVertical: 10,
				borderTopWidth: 1,
				borderTopColor: cardBorder,
			}}>
			<HStack
				style={{
					justifyContent: "space-between",
					alignItems: "flex-start",
				}}>
				<VStack style={{ flex: 1, marginRight: 8 }}>
					<Text size='sm' style={{ color: sT, fontWeight: "600" }}>
						{title}
					</Text>
					{subtitle ? (
						<Text size='xs' style={{ color: mT, marginTop: 2 }}>
							{subtitle}
						</Text>
					) : null}
					{expiresAt ? (
						<Text
							size='xs'
							style={{
								color: isExpired(expiresAt) ? "#ef4444" : mT,
								marginTop: 2,
							}}>
							Exp. {formatDate(expiresAt)}
						</Text>
					) : null}
				</VStack>
				<DocStatusBadge status={status} expiresAt={expiresAt} />
			</HStack>
		</Box>
	);

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: isDark ? "#111827" : "#f3f4f6",
			}}>
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: profile
						? `${profile.firstname} ${profile.lastname}`
						: "",
					headerRight: () => (
						<HStack
							space='sm'
							style={{ alignItems: "center", marginRight: 0 }}>
							{profile?.profile_status === "verified" && (
								<Badge
									size='sm'
									variant='solid'
									action='success'>
									<BadgeIcon as={CheckCircle} />
									<BadgeText className='ml-1'>
										Vérifié
									</BadgeText>
								</Badge>
							)}
						</HStack>
					),
				}}
			/>
			<ScrollView style={{ flex: 1 }}>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 90 }}>
					{/* ── Informations personnelles ── */}
					<Card
						style={{
							backgroundColor: cardBg,
							borderRadius: 16,
							borderWidth: 1,
							borderColor: cardBorder,
							padding: 16,
						}}>
						<TouchableOpacity
							onPress={handleToggle}
							activeOpacity={0.7}
							style={{
								position: "absolute",
								bottom: 16,
								right: 16,
								zIndex: 10,
								flexDirection: "row",
								alignItems: "center",
								gap: 4,
								paddingHorizontal: 10,
								paddingVertical: 5,
								borderRadius: 20,
								borderWidth: 1,
								borderColor: isAdded
									? "#ef4444"
									: isDark
										? "#4b5563"
										: "#d1d5db",
								backgroundColor: isAdded
									? isDark
										? "#3b0f0f"
										: "#fef2f2"
									: isDark
										? "#1f2937"
										: "#ffffff",
							}}>
							<Icon
								as={isAdded ? UserMinus : UserPlus}
								size='xs'
								style={{ color: isAdded ? "#ef4444" : mT }}
							/>
							<Text
								style={{
									fontSize: 11,
									fontWeight: "600",
									color: isAdded ? "#ef4444" : mT,
								}}>
								{isAdded ? "Retirer" : "Répertoire"}
							</Text>
						</TouchableOpacity>
						{/* Photo + infos côte à côte */}
						<HStack space='md' style={{ alignItems: "flex-start" }}>
							{/* Photo */}
							{profile?.avatar_url ? (
								<RNImage
									source={{ uri: profile.avatar_url }}
									style={{
										width: 90,
										height: 90,
										borderRadius: 14,
									}}
									resizeMode='cover'
								/>
							) : (
								<Box
									style={{
										width: 90,
										height: 90,
										borderRadius: 14,
										backgroundColor: isDark
											? "#374151"
											: "#e5e7eb",
										justifyContent: "center",
										alignItems: "center",
									}}>
									<Text
										style={{
											fontSize: 26,
											fontWeight: "700",
											color: isDark
												? "#d1d5db"
												: "#6b7280",
										}}>
										{profile?.firstname?.[0]}
										{profile?.lastname?.[0]}
									</Text>
								</Box>
							)}

							{/* Nom + catégorie + pills */}
							<VStack style={{ flex: 1 }}>
								<Text
									style={{
										fontSize: 16,
										fontWeight: "700",
										color: sT,
										marginBottom: 5,
									}}>
									{profile?.firstname} {profile?.lastname}
								</Text>
								{profile?.category ? (
									<Text
										style={{
											fontSize: 12,
											color: mT,
											marginBottom: 8,
										}}>
										{profile.category}
									</Text>
								) : null}

								{/* Pills compactes */}
								<HStack style={{ flexWrap: "wrap", gap: 6 }}>
									{profile?.birthday ? (
										<HStack
											style={{
												alignItems: "center",
												gap: 4,
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
												borderRadius: 8,
												paddingHorizontal: 8,
												paddingVertical: 4,
											}}>
											<Icon
												as={Calendar}
												size='xs'
												style={{ color: mT }}
											/>
											<Text
												style={{
													fontSize: 11,
													color: mT,
												}}>
												{calcAge(profile.birthday)} ans
											</Text>
										</HStack>
									) : null}
									{profile?.gender ? (
										<HStack
											style={{
												alignItems: "center",
												gap: 4,
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
												borderRadius: 8,
												paddingHorizontal: 8,
												paddingVertical: 4,
											}}>
											<Icon
												as={User}
												size='xs'
												style={{ color: mT }}
											/>
											<Text
												style={{
													fontSize: 11,
													color: mT,
												}}>
												{profile.gender === "male"
													? "Homme"
													: profile.gender ===
														  "female"
														? "Femme"
														: profile.gender}
											</Text>
										</HStack>
									) : null}
									{profile?.height || profile?.weight ? (
										<HStack
											style={{
												alignItems: "center",
												gap: 4,
												backgroundColor: isDark
													? "#374151"
													: "#f3f4f6",
												borderRadius: 8,
												paddingHorizontal: 8,
												paddingVertical: 4,
											}}>
											<Icon
												as={Dumbbell}
												size='xs'
												style={{ color: mT }}
											/>
											<Text
												style={{
													fontSize: 11,
													color: mT,
												}}>
												{[
													profile?.height &&
														`${profile.height} cm`,
													profile?.weight &&
														`${profile.weight} kg`,
												]
													.filter(Boolean)
													.join(" · ")}
											</Text>
										</HStack>
									) : null}
									{profile?.former_soldier === true ? (
										<HStack
											style={{
												alignItems: "center",
												gap: 4,
												backgroundColor: isDark
													? "#1c3a2e"
													: "#dcfce7",
												borderRadius: 8,
												paddingHorizontal: 8,
												paddingVertical: 4,
											}}>
											<Icon
												as={Shield}
												size='xs'
												style={{ color: "#16a34a" }}
											/>
											<Text
												style={{
													fontSize: 11,
													color: "#16a34a",
												}}>
												Ancien militaire
											</Text>
										</HStack>
									) : null}
								</HStack>
							</VStack>
						</HStack>

						{/* Séparateur + infos supplémentaires */}
						{profile?.languages || profile?.driving_licenses ? (
							<>
								<Box
									style={{
										height: 1,
										backgroundColor: cardBorder,
										marginTop: 14,
										marginBottom: 8,
									}}
								/>
								<VStack space='xs'>
									{profile?.languages ? (
										<InfoRow
											icon={Globe}
											label='Langues'
											value={profile.languages}
										/>
									) : null}
									{profile?.driving_licenses ? (
										<InfoRow
											icon={Car}
											label='Permis de conduire'
											value={profile.driving_licenses}
										/>
									) : null}
								</VStack>
							</>
						) : null}
					</Card>

					{/* ── Vérifications ── */}
					<Card
						style={{
							backgroundColor: cardBg,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: cardBorder,
							padding: 16,
						}}>
						<SectionHeader
							icon={ShieldCheck}
							title='Vérifications'
							iconColor='#2563eb'
							iconBg='#dbeafe'
						/>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
								paddingVertical: 8,
								borderTopWidth: 1,
								borderTopColor: cardBorder,
							}}>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={IdCard}
									size='sm'
									style={{ color: mT }}
								/>
								<Text size='sm' style={{ color: sT }}>
									Pièce d'identité
								</Text>
							</HStack>
							<DocStatusBadge
								status={profile?.id_verification_status}
							/>
						</HStack>
						<HStack
							style={{
								justifyContent: "space-between",
								alignItems: "center",
								paddingVertical: 8,
								borderTopWidth: 1,
								borderTopColor: cardBorder,
							}}>
							<HStack space='sm' style={{ alignItems: "center" }}>
								<Icon
									as={FileText}
									size='sm'
									style={{ color: mT }}
								/>
								<Text size='sm' style={{ color: sT }}>
									Sécurité sociale
								</Text>
							</HStack>
							<DocStatusBadge
								status={
									profile?.social_security_verification_status
								}
							/>
						</HStack>
					</Card>

					{/* ── Cartes CNAPS ── */}
					{cnapsCards.filter((c) => !isExpired(c.expires_at)).length >
						0 && (
						<Card
							style={{
								backgroundColor: cardBg,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: cardBorder,
								padding: 16,
							}}>
							<SectionHeader
								icon={Shield}
								title='Cartes CNAPS'
								iconColor='#7c3aed'
								iconBg='#ede9fe'
							/>
							{cnapsCards
								.filter((c) => !isExpired(c.expires_at))
								.map((card) => (
									<DocCard
										key={card.id}
										title={
											CNAPS_LABELS[card.type] ?? card.type
										}
										subtitle={
											card.number
												? `N° ${card.number}`
												: null
										}
										expiresAt={card.expires_at}
										status={card.status}
									/>
								))}
						</Card>
					)}

					{/* ── Diplômes ── */}
					{diplomas.length > 0 && (
						<Card
							style={{
								backgroundColor: cardBg,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: cardBorder,
								padding: 16,
							}}>
							<SectionHeader
								icon={GraduationCap}
								title='Diplômes'
								iconColor='#0891b2'
								iconBg='#cffafe'
							/>
							{diplomas.map((d) => (
								<DocCard
									key={d.id}
									title={DIPLOMA_LABELS[d.type] ?? d.type}
									expiresAt={d.expires_at}
									status={d.status}
								/>
							))}
						</Card>
					)}

					{/* ── Certifications ── */}
					{certifications.length > 0 && (
						<Card
							style={{
								backgroundColor: cardBg,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: cardBorder,
								padding: 16,
							}}>
							<SectionHeader
								icon={Award}
								title='Certifications'
								iconColor='#16a34a'
								iconBg='#dcfce7'
							/>
							{certifications.map((c) => (
								<DocCard
									key={c.id}
									title={CERT_LABELS[c.type] ?? c.type}
									expiresAt={c.expires_at}
									status={c.status}
								/>
							))}
						</Card>
					)}
				</VStack>
			</ScrollView>

			{/* Bouton Contacter fixe en bas */}
			<Box
				style={{
					paddingHorizontal: 20,
					paddingVertical: 14,
					paddingBottom: 28,
					backgroundColor: isDark ? "#111827" : "#f3f4f6",
					borderTopWidth: 1,
					borderTopColor: cardBorder,
				}}>
				<TouchableOpacity
					onPress={() => setShowContactSheet(true)}
					activeOpacity={0.8}
					style={{
						height: 52,
						borderRadius: 14,
						backgroundColor: "#2563eb",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						columnGap: 8,
					}}>
					<Icon
						as={MessageCircle}
						size='sm'
						style={{ color: "#ffffff" }}
					/>
					<Text
						style={{
							fontSize: 15,
							fontWeight: "700",
							color: "#ffffff",
						}}>
						Contacter
					</Text>
				</TouchableOpacity>
			</Box>

			{/* ActionSheet Contact */}
			<Actionsheet
				isOpen={showContactSheet}
				onClose={() => setShowContactSheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent
					style={{
						backgroundColor: isDark ? "#111827" : "#f3f4f6",
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						paddingBottom: 32,
					}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator
							style={{
								backgroundColor: isDark ? "#4b5563" : "#d1d5db",
							}}
						/>
					</ActionsheetDragIndicatorWrapper>

					{/* Label titre */}
					<Box
						style={{
							paddingHorizontal: 20,
							paddingTop: 12,
							paddingBottom: 14,
							width: "100%",
						}}>
						<Text
							style={{
								fontSize: 11,
								fontWeight: "600",
								color: mT,
								textTransform: "uppercase",
								letterSpacing: 0.8,
							}}>
							Contacter{" "}
							{profile?.firstname + " " + profile?.lastname}
						</Text>
					</Box>

					{/* Liste d'actions groupées */}
					<Box
						style={{
							marginHorizontal: 16,
							borderRadius: 14,
							overflow: "hidden",
							borderWidth: 1,
							borderColor: cardBorder,
							width: "100%",
							alignSelf: "center",
						}}>
						{/* Appeler */}
						<TouchableOpacity
							activeOpacity={0.6}
							onPress={() => setShowContactSheet(false)}>
							<HStack
								style={{
									alignItems: "center",
									padding: 14,
									backgroundColor: cardBg,
								}}>
								<Box
									style={{
										width: 34,
										height: 34,
										borderRadius: 9,
										backgroundColor: "#dcfce7",
										justifyContent: "center",
										alignItems: "center",
										marginRight: 12,
									}}>
									<Icon
										as={Phone}
										size='sm'
										style={{ color: "#16a34a" }}
									/>
								</Box>
								<VStack style={{ flex: 1 }}>
									<Text
										style={{
											fontSize: 15,
											fontWeight: "600",
											color: sT,
										}}>
										Appeler
									</Text>
									{profile?.phone ? (
										<Text
											style={{
												fontSize: 12,
												color: mT,
											}}>
											{profile.phone}
										</Text>
									) : null}
								</VStack>
							</HStack>
						</TouchableOpacity>

						<Box
							style={{ height: 1, backgroundColor: cardBorder }}
						/>

						{/* SMS */}
						<TouchableOpacity
							activeOpacity={0.6}
							onPress={() => setShowContactSheet(false)}>
							<HStack
								style={{
									alignItems: "center",
									padding: 14,
									backgroundColor: cardBg,
								}}>
								<Box
									style={{
										width: 34,
										height: 34,
										borderRadius: 9,
										backgroundColor: "#dbeafe",
										justifyContent: "center",
										alignItems: "center",
										marginRight: 12,
									}}>
									<Icon
										as={MessageSquare}
										size='sm'
										style={{ color: "#2563eb" }}
									/>
								</Box>
								<VStack style={{ flex: 1 }}>
									<Text
										style={{
											fontSize: 15,
											fontWeight: "600",
											color: sT,
										}}>
										Envoyer un SMS
									</Text>
									{profile?.phone ? (
										<Text
											style={{
												fontSize: 12,
												color: mT,
											}}>
											{profile.phone}
										</Text>
									) : null}
								</VStack>
							</HStack>
						</TouchableOpacity>

						<Box
							style={{ height: 1, backgroundColor: cardBorder }}
						/>

						{/* WhatsApp */}
						<TouchableOpacity
							activeOpacity={0.6}
							onPress={() => setShowContactSheet(false)}>
							<HStack
								style={{
									alignItems: "center",
									padding: 14,
									backgroundColor: cardBg,
								}}>
								<Box
									style={{
										width: 34,
										height: 34,
										borderRadius: 9,
										backgroundColor: "#dcfce7",
										justifyContent: "center",
										alignItems: "center",
										marginRight: 12,
									}}>
									<Icon
										as={MessageCircle}
										size='sm'
										style={{ color: "#25D366" }}
									/>
								</Box>
								<VStack style={{ flex: 1 }}>
									<Text
										style={{
											fontSize: 15,
											fontWeight: "600",
											color: sT,
										}}>
										WhatsApp
									</Text>
									{profile?.phone ? (
										<Text
											style={{
												fontSize: 12,
												color: mT,
											}}>
											{profile.phone}
										</Text>
									) : null}
								</VStack>
							</HStack>
						</TouchableOpacity>

						<Box
							style={{ height: 1, backgroundColor: cardBorder }}
						/>

						{/* Email */}
						<TouchableOpacity
							activeOpacity={0.6}
							onPress={() => setShowContactSheet(false)}>
							<HStack
								style={{
									alignItems: "center",
									padding: 14,
									backgroundColor: cardBg,
								}}>
								<Box
									style={{
										width: 34,
										height: 34,
										borderRadius: 9,
										backgroundColor: "#fef3c7",
										justifyContent: "center",
										alignItems: "center",
										marginRight: 12,
									}}>
									<Icon
										as={Mail}
										size='sm'
										style={{ color: "#f59e0b" }}
									/>
								</Box>
								<VStack style={{ flex: 1 }}>
									<Text
										style={{
											fontSize: 15,
											fontWeight: "600",
											color: sT,
										}}>
										Email
									</Text>
									{profile?.email ? (
										<Text
											style={{
												fontSize: 12,
												color: mT,
											}}>
											{profile.email}
										</Text>
									) : null}
								</VStack>
							</HStack>
						</TouchableOpacity>
					</Box>

					{/* Bouton Annuler */}
					<TouchableOpacity
						onPress={() => setShowContactSheet(false)}
						activeOpacity={0.7}
						style={{
							marginHorizontal: 16,
							marginTop: 10,
							height: 48,
							borderRadius: 14,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderWidth: 1,
							borderColor: cardBorder,
							alignItems: "center",
							justifyContent: "center",
							width: "100%",
							alignSelf: "center",
						}}>
						<Text
							style={{
								fontSize: 15,
								fontWeight: "600",
								color: isDark ? "#d1d5db" : "#374151",
							}}>
							Annuler
						</Text>
					</TouchableOpacity>
				</ActionsheetContent>
			</Actionsheet>
		</Box>
	);
};

export default ProfileScreen;
