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
} from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";

const FAQScreen = () => {
	const { isDark } = useTheme();
	const router = useRouter();
	const [expandedItems, setExpandedItems] = useState([]);

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
					answer: "Pour créer un compte, cliquez sur 'Inscription' sur l'écran de connexion. Remplissez vos informations personnelles (nom, prénom, email, mot de passe) et validez. Vous recevrez un email de confirmation pour activer votre compte.",
				},
				{
					id: "account-2",
					question: "J'ai oublié mon mot de passe, que faire ?",
					answer: "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe. Le lien est valable 24 heures.",
				},
				{
					id: "account-3",
					question:
						"Comment modifier mes informations personnelles ?",
					answer: "Accédez à votre profil, puis cliquez sur 'Informations personnelles'. Vous pourrez modifier votre nom, prénom, adresse, numéro de téléphone et autres informations. N'oubliez pas de sauvegarder vos modifications.",
				},
			],
		},
		{
			id: 2,
			category: "Candidatures",
			icon: Briefcase,
			questions: [
				{
					id: "jobs-1",
					question: "Comment postuler à une offre ?",
					answer: "Recherchez une offre qui vous intéresse, cliquez dessus pour voir les détails, puis cliquez sur 'Postuler'. Assurez-vous que votre profil est complet et que vos documents sont à jour avant de postuler.",
				},
				{
					id: "jobs-2",
					question: "Puis-je annuler une candidature ?",
					answer: "Oui, accédez à 'Mes candidatures' depuis votre profil. Trouvez la candidature que vous souhaitez annuler et cliquez sur 'Annuler la candidature'. Attention, cette action est irréversible.",
				},
				{
					id: "jobs-3",
					question: "Comment suivre l'état de mes candidatures ?",
					answer: "Dans la section 'Mes candidatures', vous pouvez voir toutes vos candidatures avec leur statut : En attente, Acceptée, Refusée, ou En cours. Vous recevrez également des notifications pour chaque changement de statut.",
				},
			],
		},
		{
			id: 3,
			category: "Documents professionnels",
			icon: Shield,
			questions: [
				{
					id: "docs-1",
					question: "Quels documents dois-je fournir ?",
					answer: "Vous devez fournir : votre carte professionnelle de sécurité (obligatoire), votre pièce d'identité, votre carte vitale, et tout diplôme ou certification pertinent (SSIAP, CQP, etc.). Ces documents doivent être valides et lisibles.",
				},
				{
					id: "docs-2",
					question: "Comment ajouter ma carte professionnelle ?",
					answer: "Allez dans 'Documents professionnels', cliquez sur 'Ajouter une carte', puis scannez ou téléchargez votre carte professionnelle. Remplissez les informations demandées (numéro, date de validité, catégorie). Le document sera vérifié par nos équipes.",
				},
				{
					id: "docs-3",
					question: "Combien de temps prend la vérification ?",
					answer: "La vérification de vos documents prend généralement entre 24 et 48 heures ouvrées. Vous recevrez une notification dès que vos documents sont validés ou si des informations complémentaires sont nécessaires.",
				},
			],
		},
		{
			id: 4,
			category: "Paiements",
			icon: CreditCard,
			questions: [
				{
					id: "payment-1",
					question: "Comment fonctionne l'abonnement ?",
					answer: "L'abonnement vous donne accès à toutes les fonctionnalités premium de l'application. Vous pouvez choisir entre un abonnement mensuel ou annuel. Le paiement est automatiquement renouvelé sauf si vous résiliez avant la date de renouvellement.",
				},
				{
					id: "payment-2",
					question: "Puis-je annuler mon abonnement ?",
					answer: "Oui, vous pouvez annuler votre abonnement à tout moment depuis les paramètres. L'annulation prendra effet à la fin de la période en cours. Vous conserverez l'accès aux fonctionnalités premium jusqu'à cette date.",
				},
				{
					id: "payment-3",
					question: "Quels moyens de paiement sont acceptés ?",
					answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et Apple Pay / Google Pay. Tous les paiements sont sécurisés via notre plateforme de paiement certifiée.",
				},
			],
		},
		{
			id: 5,
			category: "Assistance",
			icon: HelpCircle,
			questions: [
				{
					id: "support-1",
					question: "Comment contacter le support ?",
					answer: "Vous pouvez nous contacter via la section 'Contact' dans les paramètres, par email à support@wesafe.fr, ou directement depuis l'application via le chat en direct. Notre équipe vous répond sous 24h.",
				},
				{
					id: "support-2",
					question: "L'application ne fonctionne pas correctement",
					answer: "Essayez d'abord de redémarrer l'application. Si le problème persiste, vérifiez que vous avez la dernière version installée. Vous pouvez également vider le cache dans les paramètres. Si rien ne fonctionne, contactez le support avec une description détaillée du problème.",
				},
				{
					id: "support-3",
					question: "Comment signaler un problème avec une offre ?",
					answer: "Sur la page de l'offre, cliquez sur les trois points en haut à droite et sélectionnez 'Signaler'. Décrivez le problème rencontré (offre frauduleuse, informations incorrectes, etc.). Nous traiterons votre signalement dans les plus brefs délais.",
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
						backgroundColor: isDark ? "#374151" : "#ffffff",
						borderRadius: 12,
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#e5e7eb",
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
								color: isDark ? "#f3f4f6" : "#111827",
							}}>
							{item.question}
						</Text>
						<Icon
							as={isExpanded ? ChevronUp : ChevronDown}
							size='lg'
							style={{
								color: isDark ? "#60a5fa" : "#2563eb",
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
									color: isDark ? "#d1d5db" : "#4b5563",
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
				<Icon
					as={category.icon}
					size='lg'
					style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
				/>
				<Heading
					size='lg'
					style={{
						color: isDark ? "#f3f4f6" : "#111827",
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
				backgroundColor: isDark ? "#1f2937" : "#f9fafb",
			}}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
				<VStack space='xl'>
					{/* Header */}
					<Card
						style={{
							padding: 20,
							backgroundColor: isDark ? "#374151" : "#ffffff",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#4b5563" : "#e5e7eb",
						}}>
						<VStack space='sm' style={{ alignItems: "center" }}>
							<Icon
								as={HelpCircle}
								size='xl'
								style={{
									color: isDark ? "#60a5fa" : "#2563eb",
								}}
							/>
							<Heading
								size='xl'
								style={{
									color: isDark ? "#f3f4f6" : "#111827",
									textAlign: "center",
								}}>
								Foire aux questions
							</Heading>
							<Text
								style={{
									fontSize: 14,
									color: isDark ? "#9ca3af" : "#6b7280",
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
							backgroundColor: isDark ? "#1e3a8a" : "#dbeafe",
							borderRadius: 12,
							borderWidth: 1,
							borderColor: isDark ? "#1e40af" : "#93c5fd",
						}}>
						<VStack space='md'>
							<Heading
								size='md'
								style={{
									color: isDark ? "#dbeafe" : "#1e40af",
								}}>
								Vous ne trouvez pas de réponse ?
							</Heading>
							<Text
								style={{
									fontSize: 14,
									color: isDark ? "#bfdbfe" : "#1e40af",
								}}>
								Notre équipe de support est là pour vous aider.
								Contactez-nous directement depuis l'application.
							</Text>
						</VStack>
					</Card>
				</VStack>
			</ScrollView>
		</Box>
	);
};

export default FAQScreen;
