import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";

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
	Star,
	StarOff,
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
			<ScrollView style={{ flex: 1 }}>
				<VStack space='lg' style={{ padding: 20, paddingBottom: 90 }}>
					{/* Hero Card */}
					<Card
						style={{
							padding: 20,
							backgroundColor: cardBg,
							borderRadius: 16,
							borderWidth: 1,
							borderColor: cardBorder,
							alignItems: "center",
						}}>
						{/* Photo carrée */}
						{profile?.avatar_url ? (
							<Box
								style={{
									width: 96,
									height: 96,
									borderRadius: 14,
									marginBottom: 14,
									overflow: "hidden",
								}}>
								<Image
									source={{ uri: profile.avatar_url }}
									alt='avatar'
									style={{ width: 96, height: 96 }}
								/>
							</Box>
						) : (
							<Box
								style={{
									width: 96,
									height: 96,
									borderRadius: 14,
									marginBottom: 14,
									backgroundColor: isDark
										? "#374151"
										: "#e5e7eb",
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										fontSize: 30,
										fontWeight: "700",
										color: isDark ? "#d1d5db" : "#6b7280",
									}}>
									{profile?.firstname?.[0]}
									{profile?.lastname?.[0]}
								</Text>
							</Box>
						)}

						{/* Nom */}
						<Text
							style={{
								fontSize: 20,
								fontWeight: "700",
								color: sT,
								textAlign: "center",
								marginBottom: 2,
							}}>
							{profile?.firstname} {profile?.lastname}
						</Text>

						{/* Métier */}
						{profile?.category && (
							<Text
								style={{
									fontSize: 13,
									color: mT,
									textAlign: "center",
									marginBottom: 12,
								}}>
								{profile.category}
							</Text>
						)}

						{/* Badge statut */}
						{profile?.profile_status === "verified" && (
							<Box style={{ marginBottom: 16 }}>
								<Badge
									size='md'
									variant='solid'
									action='success'>
									<BadgeIcon as={CheckCircle} />
									<BadgeText className='ml-1'>
										Profil vérifié
									</BadgeText>
								</Badge>
							</Box>
						)}
						{profile?.profile_status === "pending" && (
							<Box style={{ marginBottom: 16 }}>
								<Badge
									size='md'
									variant='outline'
									action='warning'>
									<BadgeIcon as={Clock} />
									<BadgeText className='ml-1'>
										En cours de vérification
									</BadgeText>
								</Badge>
							</Box>
						)}

						{/* Boutons */}
						<HStack space='sm' style={{ width: "100%" }}>
							<TouchableOpacity
								onPress={handleToggle}
								activeOpacity={0.7}
								style={{
									flex: 1,
									height: 44,
									borderRadius: 10,
									borderWidth: 1.5,
									borderColor: isAdded
										? "#ef4444"
										: isDark
											? "#4b5563"
											: "#d1d5db",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									columnGap: 6,
								}}>
								<Icon
									as={isAdded ? StarOff : Star}
									size='sm'
									style={{
										color: isAdded ? "#ef4444" : mT,
									}}
								/>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isAdded ? "#ef4444" : mT,
									}}>
									{isAdded ? "Retirer" : "Favoris"}
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => setShowContactSheet(true)}
								activeOpacity={0.7}
								style={{
									flex: 1,
									height: 44,
									borderRadius: 10,
									backgroundColor: "#2563eb",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									columnGap: 6,
								}}>
								<Icon
									as={MessageCircle}
									size='sm'
									style={{ color: "#ffffff" }}
								/>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: "#ffffff",
									}}>
									Contacter
								</Text>
							</TouchableOpacity>
						</HStack>
					</Card>

					{/* ── Informations personnelles ── */}
					<Card
						style={{
							backgroundColor: cardBg,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: cardBorder,
							padding: 16,
						}}>
						<SectionHeader
							icon={User}
							title='Informations personnelles'
							iconColor='#2563eb'
							iconBg='#dbeafe'
						/>
						<VStack space='xs'>
							{profile?.birthday ? (
								<InfoRow
									icon={Calendar}
									label='Date de naissance'
									value={`${formatDate(profile.birthday)} · ${calcAge(profile.birthday)} ans`}
								/>
							) : null}
							{profile?.gender ? (
								<InfoRow
									icon={User}
									label='Genre'
									value={
										profile.gender === "male"
											? "Homme"
											: profile.gender === "female"
												? "Femme"
												: profile.gender
									}
								/>
							) : null}
							{profile?.height || profile?.weight ? (
								<InfoRow
									icon={Dumbbell}
									label='Morphologie'
									value={[
										profile?.height &&
											`${profile.height} cm`,
										profile?.weight &&
											`${profile.weight} kg`,
									]
										.filter(Boolean)
										.join(" · ")}
								/>
							) : null}
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
							{profile?.former_soldier === true ? (
								<InfoRow
									icon={Shield}
									label='Ancien militaire'
									value='Oui'
								/>
							) : null}
						</VStack>
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
					{cnapsCards.length > 0 && (
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
							{cnapsCards.map((card) => (
								<DocCard
									key={card.id}
									title={CNAPS_LABELS[card.type] ?? card.type}
									subtitle={
										card.number ? `N° ${card.number}` : null
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
							paddingTop: 4,
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
							Contacter {profile?.firstname}
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
