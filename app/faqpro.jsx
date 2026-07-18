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
	CreditCard,
	FileText,
	QrCode,
} from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

const FAQProScreen = () => {
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
			category: "Compte entreprise",
			icon: User,
			questions: [
				{
					id: "account-1",
					question: "Comment créer un compte entreprise ?",
					answer: "Téléchargez WeSafe et touchez 'Inscription'. Créez votre compte avec votre email professionnel, puis renseignez les informations de votre entreprise. Votre dossier devra être complété et validé par notre équipe avant de pouvoir publier des offres.",
				},
				{
					id: "account-2",
					question: "J'ai oublié mon mot de passe, que faire ?",
					answer: "Depuis l'écran de connexion, touchez 'Mot de passe oublié'. Saisissez votre adresse email et vous recevrez un lien pour créer un nouveau mot de passe.",
				},
				{
					id: "account-3",
					question: "Comment modifier les informations de mon entreprise ?",
					answer: "Depuis votre tableau de bord, accédez aux paramètres de votre entreprise. Vous pouvez y modifier le nom, la description, l'adresse, le numéro SIRET, le représentant légal et le logo.",
				},
				{
					id: "account-4",
					question: "Qu'est-ce que le statut 'Entreprise active' ?",
					answer: "Avant de pouvoir publier des offres, WeSafe vérifie votre dossier d'entreprise. Une fois tous les documents soumis et validés (KBIS, SIRET, signature, tampon…), votre compte passe au statut 'Actif'. Ce processus prend généralement entre 24 et 48 heures ouvrées.",
				},
			],
		},
		{
			id: 2,
			category: "Dossier entreprise",
			icon: Shield,
			questions: [
				{
					id: "docs-1",
					question: "Quels éléments sont nécessaires pour activer mon compte ?",
					answer: "Pour obtenir le statut 'Actif', vous devez renseigner : le logo, le nom, la description, l'adresse complète, le numéro SIRET, le nom du représentant légal, et fournir votre document KBIS, une signature d'entreprise et un tampon.",
				},
				{
					id: "docs-2",
					question: "Comment ajouter mon document KBIS ?",
					answer: "Depuis votre tableau de bord, touchez 'Document KBIS'. Téléchargez une photo ou un PDF lisible de votre extrait KBIS (de moins de 3 mois). Il sera examiné par notre équipe sous 48h ouvrées.",
				},
				{
					id: "docs-3",
					question: "Comment créer la signature et le tampon de mon entreprise ?",
					answer: "Depuis votre tableau de bord, accédez respectivement à 'Signature' et 'Tampon'. La signature se dessine directement à l'écran. Le tampon peut être importé sous forme d'image. Ces éléments seront apposés automatiquement sur les contrats générés dans l'application.",
				},
				{
					id: "docs-4",
					question: "Combien de temps prend la vérification du dossier ?",
					answer: "La vérification prend généralement entre 24 et 48 heures ouvrées. Vous recevrez une notification dès que votre dossier est validé ou si une correction est nécessaire.",
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
					question: "Comment publier une offre d'emploi ?",
					answer: "Depuis votre tableau de bord, touchez 'Nouvelle offre'. Renseignez le titre du poste, la catégorie, la localisation, le type de contrat et les détails de la mission. L'offre sera visible par les candidats vérifiés dès sa publication.",
				},
				{
					id: "jobs-2",
					question: "Combien d'offres puis-je publier ?",
					answer: "Cela dépend de votre plan : Standard (gratuit) permet 3 offres par mois, Standard+ permet 10 offres par mois, et Premium offre des annonces illimitées. Pour changer de plan, rendez-vous sur wesafeapp.fr.",
				},
				{
					id: "jobs-3",
					question: "Comment fonctionne une annonce Last Minute ?",
					answer: "Les annonces Last Minute sont des missions urgentes mises en avant pour une visibilité maximale. Chaque publication consomme 1 crédit Last Minute. Les crédits s'achètent en pack sur wesafeapp.fr (pack de 10 crédits à 30€, soit 3€ l'annonce).",
				},
				{
					id: "jobs-4",
					question: "Mes offres sont-elles mises en avant ?",
					answer: "Oui, les plans Standard+ et Premium incluent le statut 'Annonce prioritaire' qui améliore la visibilité de vos offres dans les résultats. Le plan Standard ne bénéficie pas de cette mise en avant.",
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
					question: "Comment gérer les candidatures reçues ?",
					answer: "Depuis l'onglet Candidatures, retrouvez toutes les candidatures classées par offre, avec le statut de chaque profil en temps réel. Vous pouvez sélectionner un candidat, refuser une candidature ou passer à l'étape suivante directement depuis l'application.",
				},
				{
					id: "apply-2",
					question: "Quelles sont les étapes d'une candidature ?",
					answer: "Le processus se déroule ainsi : En attente → Profil sélectionné → Contrat envoyé → Contrat signé → Mission confirmée. Le candidat est notifié à chaque étape. Vous pouvez également refuser une candidature à tout moment.",
				},
				{
					id: "apply-3",
					question: "Comment générer et envoyer un contrat ?",
					answer: "Une fois un profil sélectionné, touchez 'Générer un contrat' dans la candidature. Le contrat est créé automatiquement avec les informations de la mission et de l'entreprise (signature + tampon inclus). Il est ensuite envoyé au candidat pour signature électronique.",
				},
				{
					id: "apply-4",
					question: "Comment communiquer avec un candidat ?",
					answer: "La messagerie interne est disponible sur les plans Standard+ et Premium. Elle vous permet d'échanger directement avec les candidats dans le cadre de leurs candidatures. Vous pouvez également contacter l'équipe de support WeSafe via la messagerie dédiée.",
				},
			],
		},
		{
			id: 5,
			category: "Abonnements & Crédits",
			icon: CreditCard,
			questions: [
				{
					id: "sub-1",
					question: "Quels sont les plans disponibles ?",
					answer: "WeSafe propose 3 plans : Standard (gratuit, 3 offres/mois), Standard+ (19€/mois ou 199€/an, 10 offres/mois + messagerie + annonces prioritaires + répertoire candidats) et Premium (25€/mois ou 249€/an, offres illimitées + toutes les fonctionnalités).",
				},
				{
					id: "sub-2",
					question: "Comment souscrire ou changer de plan ?",
					answer: "Les abonnements se gèrent exclusivement sur wesafeapp.fr. Depuis l'application, touchez 'Abonnement' dans votre tableau de bord pour être redirigé vers le site. Vous pouvez passer à un plan supérieur ou inférieur à tout moment.",
				},
				{
					id: "sub-3",
					question: "Comment résilier mon abonnement ?",
					answer: "La résiliation se fait sur wesafeapp.fr depuis votre espace client. Elle prend effet à la fin de la période en cours. Vous conservez l'accès aux fonctionnalités de votre plan jusqu'à cette date, puis passez automatiquement au plan Standard gratuit.",
				},
				{
					id: "sub-4",
					question: "Comment acheter des crédits Last Minute ?",
					answer: "Les crédits Last Minute s'achètent sur wesafeapp.fr. Le pack de 10 crédits est à 30€ (3€ par annonce, au lieu de 5€ à l'unité). Vos crédits disponibles sont affichés en temps réel dans la section Crédits de votre tableau de bord.",
				},
			],
		},
		{
			id: 6,
			category: "Scanner & Répertoire",
			icon: QrCode,
			questions: [
				{
					id: "qr-1",
					question: "À quoi sert le scanner QR ?",
					answer: "Le scanner vous permet de consulter instantanément le profil WeSafe vérifié d'un candidat en scannant son QR code personnel. Vous accédez directement à son dossier complet (documents, certifications, expériences) sans avoir à le rechercher manuellement.",
				},
				{
					id: "qr-2",
					question: "Comment scanner un candidat ?",
					answer: "Depuis votre tableau de bord, touchez l'icône Scanner. Pointez l'appareil photo vers le QR code affiché par le candidat sur son application WeSafe. Le profil s'ouvre automatiquement.",
				},
				{
					id: "qr-3",
					question: "Qu'est-ce que le répertoire candidats ?",
					answer: "Le répertoire candidats (disponible sur les plans Standard+ et Premium) regroupe tous les profils que vous avez scannés. Il vous permet de retrouver rapidement un candidat rencontré, de consulter son dossier et de lui proposer une mission.",
				},
			],
		},
		{
			id: 7,
			category: "Assistance",
			icon: HelpCircle,
			questions: [
				{
					id: "support-1",
					question: "Comment contacter le support ?",
					answer: "Vous pouvez nous contacter par email à contact@wesafeapp.fr ou depuis la section Contact dans les paramètres de l'application. Les abonnés Standard+ et Premium bénéficient d'un support prioritaire via la messagerie intégrée.",
				},
				{
					id: "support-2",
					question: "Mon compte n'est pas encore activé, que faire ?",
					answer: "Vérifiez que tous les éléments de votre dossier sont bien renseignés et soumis depuis votre tableau de bord. La validation prend entre 24 et 48h ouvrées. Si le délai est dépassé, contactez-nous à contact@wesafeapp.fr.",
				},
				{
					id: "support-3",
					question: "L'application ne fonctionne pas correctement, que faire ?",
					answer: "Commencez par forcer la fermeture et relancer l'application. Si le problème persiste, vérifiez que vous disposez de la dernière version sur l'App Store ou Google Play. En dernier recours, décrivez le problème à contact@wesafeapp.fr.",
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
								Foire aux questions PRO
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
								Notre équipe est disponible à contact@wesafeapp.fr ou depuis la section Contact dans les paramètres. Les abonnés Standard+ et Premium bénéficient d'un support prioritaire.
							</Text>
						</VStack>
					</Card>
				</VStack>
			</ScrollView>
		</Box>
	);
};

export default FAQProScreen;
