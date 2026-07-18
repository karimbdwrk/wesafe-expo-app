import React, { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import {
	ChevronDown,
	ChevronUp,
	HelpCircle,
	User,
	Briefcase,
	Shield,
	QrCode,
	FileText,
} from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const FAQScreen = () => {
	const { isDark } = useTheme();
	const router = useRouter();
	const [expandedItems, setExpandedItems] = useState([]);

	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const border = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textMuted = isDark
		? Colors.dark.textSecondary
		: Colors.light.textSecondary;
	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const tint20 = isDark ? Colors.dark.tint20 : Colors.light.tint20;

	const toggleItem = (id) => {
		setExpandedItems((prev) =>
			prev.includes(id)
				? prev.filter((item) => item !== id)
				: [...prev, id],
		);
	};

	const faqData = [
		{
			id: 1,
			category: "Compte",
			icon: User,
			questions: [
				{
					id: "account-1",
					question: "Comment créer un compte ?",
					answer: "Téléchargez WeSafe et touchez 'Inscription'. Renseignez vos informations personnelles (prénom, nom, email, mot de passe) et confirmez votre email. Votre dossier devra ensuite être complété et vérifié par notre équipe avant de pouvoir postuler à des offres.",
				},
				{
					id: "account-2",
					question: "J'ai oublié mon mot de passe, que faire ?",
					answer: "Sur l'écran de connexion, touchez 'Mot de passe oublié'. Saisissez votre adresse email et vous recevrez un lien pour créer un nouveau mot de passe.",
				},
				{
					id: "account-3",
					question: "Comment modifier mes informations personnelles ?",
					answer: "Depuis Mon profil, touchez 'Informations personnelles'. Vous pouvez y modifier votre prénom, nom, numéro de téléphone, date de naissance, ville et les langues que vous parlez.",
				},
				{
					id: "account-4",
					question: "Qu'est-ce que le statut 'Profil vérifié' ?",
					answer: "Avant de pouvoir postuler, WeSafe vérifie votre identité et votre dossier professionnel. Une fois tous vos documents soumis et validés par notre équipe, votre profil passe au statut 'Vérifié'. Ce processus prend généralement entre 24 et 48 heures ouvrées.",
				},
			],
		},
		{
			id: 2,
			category: "Profil & Documents",
			icon: Shield,
			questions: [
				{
					id: "docs-1",
					question: "Quels documents sont nécessaires pour compléter mon dossier ?",
					answer: "Pour obtenir un profil vérifié, vous devez fournir : une photo de profil, une pièce d'identité en cours de validité, votre numéro de sécurité sociale, une signature électronique, et au minimum un document professionnel (carte CNAPS, diplôme ou certification).",
				},
				{
					id: "docs-2",
					question: "Comment ajouter ma carte CNAPS ?",
					answer: "Depuis Mon profil → Documents professionnels, sélectionnez 'Carte CNAPS' puis choisissez le type de carte. Téléchargez une photo ou un PDF lisible de votre carte, renseignez le numéro et la date de validité. Le document sera examiné par notre équipe sous 48h ouvrées.",
				},
				{
					id: "docs-3",
					question: "Quels diplômes et certifications puis-je ajouter ?",
					answer: "Vous pouvez ajouter vos diplômes professionnels (TFP APS, SSIAP 1/2/3, TFP ASC…) et vos certifications (SST, H0B0, PSE1, PSE2, MAC SSIAP…). Ces documents enrichissent votre profil et le rendent plus attractif auprès des entreprises.",
				},
				{
					id: "docs-4",
					question: "Comment créer ma signature électronique ?",
					answer: "Depuis Mon profil → Signature, dessinez votre signature directement à l'écran du bout du doigt. Elle sera soumise à vérification et utilisée automatiquement lors de la signature de vos contrats de mission dans l'application.",
				},
				{
					id: "docs-5",
					question: "Combien de temps prend la vérification des documents ?",
					answer: "La vérification prend généralement entre 24 et 48 heures ouvrées. Vous recevrez une notification dès qu'un document est validé ou si une correction est nécessaire. Dès qu'un document est soumis, il apparaît en statut 'En attente' dans votre dossier.",
				},
			],
		},
		{
			id: 3,
			category: "Offres d'emploi",
			icon: Briefcase,
			questions: [
				{
					id: "jobs-1",
					question: "Comment trouver des offres d'emploi ?",
					answer: "Les offres disponibles sont accessibles depuis l'onglet Offres. Elles sont mises à jour en temps réel par les entreprises de sécurité. Vous pouvez filtrer les annonces pour affiner votre recherche selon vos critères.",
				},
				{
					id: "jobs-2",
					question: "Qu'est-ce que les annonces Last Minute ?",
					answer: "Les annonces Last Minute sont des missions urgentes publiées par des entreprises qui ont un besoin immédiat de personnel. Retrouvez-les dans l'onglet Last Minute. Ces offres nécessitent une réponse rapide.",
				},
				{
					id: "jobs-3",
					question: "Comment sauvegarder une offre pour plus tard ?",
					answer: "Sur la page d'une offre, touchez l'icône favoris pour l'ajouter à votre Wishlist. Retrouvez toutes vos offres sauvegardées depuis l'onglet Wishlist de votre profil pour les consulter ou postuler ultérieurement.",
				},
				{
					id: "jobs-4",
					question: "Mon profil doit-il être vérifié pour postuler ?",
					answer: "Oui, votre profil doit être au statut 'Vérifié' pour pouvoir postuler à une offre. Complétez votre dossier dans Mon profil et notre équipe le validera sous 48 heures ouvrées.",
				},
			],
		},
		{
			id: 4,
			category: "Candidatures & Contrats",
			icon: FileText,
			questions: [
				{
					id: "apply-1",
					question: "Comment suivre mes candidatures ?",
					answer: "Depuis l'onglet Candidatures, retrouvez toutes vos candidatures avec leur statut mis à jour en temps réel. Vous recevez également une notification à chaque changement de statut.",
				},
				{
					id: "apply-2",
					question: "Quelles sont les étapes d'une candidature ?",
					answer: "Une candidature suit ce parcours : En attente → Profil sélectionné → Contrat envoyé → Contrat signé → Mission confirmée. Si votre candidature n'est pas retenue à une étape, vous en êtes notifié immédiatement.",
				},
				{
					id: "apply-3",
					question: "Comment signer un contrat ?",
					answer: "Lorsqu'une entreprise vous sélectionne et génère un contrat, vous recevez une notification. Ouvrez la candidature concernée dans l'onglet Candidatures pour consulter et signer le contrat directement dans l'application grâce à votre signature électronique enregistrée.",
				},
				{
					id: "apply-4",
					question: "WeSafe gère-t-il le paiement de mes missions ?",
					answer: "Non. La rémunération est gérée directement entre vous et l'entreprise en dehors de l'application. WeSafe s'occupe uniquement de la mise en relation et de la gestion des contrats de mission.",
				},
			],
		},
		{
			id: 5,
			category: "QR Code profil",
			icon: QrCode,
			questions: [
				{
					id: "qr-1",
					question: "À quoi sert le QR code de mon profil ?",
					answer: "Votre QR code personnel permet à une entreprise de sécurité d'accéder instantanément à votre profil WeSafe vérifié. C'est un moyen rapide et professionnel de vous présenter lors d'un entretien ou d'une prise de contact directe.",
				},
				{
					id: "qr-2",
					question: "Comment partager mon QR code à une entreprise ?",
					answer: "Depuis votre profil, touchez l'icône QR code pour afficher votre code personnel. Montrez-le à l'entreprise : elle peut le scanner avec l'application WeSafe pour consulter directement votre dossier complet.",
				},
			],
		},
		{
			id: 6,
			category: "Assistance",
			icon: HelpCircle,
			questions: [
				{
					id: "support-1",
					question: "Comment contacter le support ?",
					answer: "Vous pouvez nous contacter par email à contact@wesafeapp.fr ou depuis la section Contact dans les paramètres de l'application. Notre équipe vous répond sous 24 heures ouvrées.",
				},
				{
					id: "support-2",
					question: "L'application ne fonctionne pas correctement, que faire ?",
					answer: "Commencez par forcer la fermeture et relancer l'application. Si le problème persiste, vérifiez que vous disposez de la dernière version disponible sur l'App Store ou Google Play. En dernier recours, contactez-nous à contact@wesafeapp.fr en décrivant précisément le problème.",
				},
				{
					id: "support-3",
					question: "Mon profil a été rejeté ou suspendu, que faire ?",
					answer: "Si votre profil est rejeté, un message vous indique la raison. Corrigez les informations ou documents concernés et soumettez à nouveau votre dossier. En cas de suspension de compte, contactez notre équipe à contact@wesafeapp.fr pour obtenir des explications et régulariser la situation.",
				},
			],
		},
	];

	const FAQItem = ({ item }) => {
		const isExpanded = expandedItems.includes(item.id);

		return (
			<TouchableOpacity
				onPress={() => toggleItem(item.id)}
				activeOpacity={0.7}>
				<Card
					style={{
						padding: 16,
						backgroundColor: cardBg,
						borderRadius: 12,
						borderWidth: 1,
						borderColor: border,
						marginBottom: 12,
					}}>
					<HStack
						space='md'
						style={{
							alignItems: "center",
							justifyContent: "space-between",
						}}>
						<Text
							style={{
								flex: 1,
								fontWeight: "600",
								fontSize: 15,
								color: textPrimary,
							}}>
							{item.question}
						</Text>
						<Icon
							as={isExpanded ? ChevronUp : ChevronDown}
							size='lg'
							style={{
								color: tint,
							}}
						/>
					</HStack>
					{isExpanded && (
						<>
							<Divider style={{ marginVertical: 12 }} />
							<Text
								style={{
									fontSize: 14,
									lineHeight: 20,
									color: textMuted,
								}}>
								{item.answer}
							</Text>
						</>
					)}
				</Card>
			</TouchableOpacity>
		);
	};

	const CategorySection = ({ category }) => (
		<VStack space='md' style={{ marginBottom: 24 }}>
			<HStack space='sm' style={{ alignItems: "center" }}>
				<Icon as={category.icon} size='lg' style={{ color: tint }} />
				<Heading
					size='lg'
					style={{
						color: textPrimary,
					}}>
					{category.category}
				</Heading>
			</HStack>
			<VStack space='sm'>
				{category.questions.map((question) => (
					<FAQItem key={question.id} item={question} />
				))}
			</VStack>
		</VStack>
	);

	return (
		<Box
			style={{
				flex: 1,
				backgroundColor: bg,
			}}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
				<VStack space='xl'>
					{/* Header */}
					<Card
						style={{
							padding: 20,
							backgroundColor: cardBg,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: border,
						}}>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Icon
								as={HelpCircle}
								size='xl'
								style={{
									color: tint,
								}}
							/>
							<Heading
								size='xl'
								style={{
									color: textPrimary,
									textAlign: "center",
								}}>
								Foire aux questions
							</Heading>
							<Text
								style={{
									fontSize: 14,
									color: textMuted,
									textAlign: "center",
								}}>
								Trouvez rapidement des réponses à vos questions
								les plus fréquentes
							</Text>
						</VStack>
					</Card>

					{/* FAQ Categories */}
					{faqData.map((category) => (
						<CategorySection
							key={category.id}
							category={category}
						/>
					))}

					{/* Contact Support Card */}
					<Card
						style={{
							padding: 20,
							backgroundColor: tint20,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: tint,
						}}>
						<VStack space='md'>
							<Heading
								size='md'
								style={{
									color: tint,
								}}>
								Vous ne trouvez pas de réponse ?
							</Heading>
							<Text
								style={{
									fontSize: 14,
									color: textMuted,
								}}>
								Notre équipe est disponible par email à contact@wesafeapp.fr ou depuis la section Contact dans les paramètres.
							</Text>
						</VStack>
					</Card>
				</VStack>
			</ScrollView>
		</Box>
	);
};

export default FAQScreen;
