import React, { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";

import { View, Image, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { Signature } from "lucide-react-native";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";

import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import axios from "axios";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const SUPABASE_STORAGE_BUCKET = "contracts";

const ContractScreen = () => {
	const { apply_id } = useLocalSearchParams();
	const router = useRouter();
	const { user, role, accessToken } = useAuth();
	const { getById, getAll, create, update, updateApplicationStatus } =
		useDataContext();
	const toast = useToast();

	const [isSigned, setIsSigned] = useState(false);
	const [isProSigned, setIsProSigned] = useState(false);
	const [showProSignModal, setShowProSignModal] = useState(false);
	const [showCandidateSignModal, setShowCandidateSignModal] = useState(false);
	const [candidate, setCandidate] = useState(null);
	const [company, setCompany] = useState(null);
	const [job, setJob] = useState(null);
	const [apply, setApply] = useState(null);

	const [contract, setContract] = useState(null);
	const [contractId, setContractId] = useState(null);

	const getAllData = async () => {
		const response = await getById(
			"applies",
			apply_id,
			"*,jobs(*), profiles(*), companies(*)",
		);
		setApply(response);
		setCandidate(response.profiles);
		setCompany(response.companies);
		setJob(response.jobs);
	};

	const getContract = async () => {
		const { data } = await getAll(
			"contracts",
			"*",
			`&apply_id=eq.${apply_id}`,
			1,
			10,
			"created_at.desc",
		);
		if (data.length) {
			setIsSigned(true);
			setContract(data[0]);
			setContractId(data[0].id);
			if (data[0].isProSigned) {
				setIsProSigned(true);
			}
		}
	};

	useFocusEffect(
		useCallback(() => {
			getAllData();
			getContract();
		}, []),
	);

	useEffect(() => {
		console.log("contract id :", contractId);
	}, [contractId]);

	const handleProSign = () => {
		setShowProSignModal(true);
	};

	const confirmProSign = async () => {
		try {
			await update("contracts", contractId, {
				isProSigned: true,
			});

			// Mettre à jour le statut de la candidature
			await updateApplicationStatus(
				apply_id,
				"contract_signed_pro",
				"company",
			);

			setIsProSigned(true);
			setShowProSignModal(false);
			toast.show({
				placement: "top",
				render: ({ id }) => (
					<Toast
						nativeID={"toast-" + id}
						className='px-5 py-3 gap-4 shadow-soft-1 items-center flex-row'>
						<Icon
							as={Signature}
							size='xl'
							className='text-typography-white'
						/>
						<ToastTitle size='sm'>
							Contrat signé et tamponné !
						</ToastTitle>
					</Toast>
				),
			});
		} catch (error) {
			console.log("error sign contract as pro", error);
		}
	};

	const handleSign = () => {
		setShowCandidateSignModal(true);
	};

	const confirmCandidateSign = async () => {
		try {
			await create("contracts", {
				job_id: job.id,
				company_id: company.id,
				candidate_id: candidate.id,
				apply_id: apply.id,
				category: job.category,
				isSigned: true,
			});

			// Mettre à jour le statut de la candidature
			await updateApplicationStatus(
				apply_id,
				"contract_signed_candidate",
				"candidate",
			);

			setShowCandidateSignModal(false);
			getContract();
			toast.show({
				placement: "top",
				render: ({ id }) => (
					<Toast
						nativeID={"toast-" + id}
						className='px-5 py-3 gap-4 shadow-soft-1 items-center flex-row'>
						<Icon
							as={Signature}
							size='xl'
							className='text-typography-white'
						/>
						<ToastTitle size='sm'>Contrat signé !</ToastTitle>
					</Toast>
				),
			});
		} catch (error) {
			console.log("error create Contract", error);
		}
	};

	const handleDownloadAndUploadPdf = async () => {
		if (!company || !candidate || !job) return;

		const htmlContent = `
          <html>
            <head>
                <style>
                @page {
                    size: A4;
                    margin: 20mm;
                }
                body {
                    width: 794px;
                    height: 1123px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    box-sizing: border-box;
                }
                </style>
            </head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center;">Contrat de travail</h1>
            <h3>Entreprise :</h3>
            <p><strong>${company.name}</strong><br>SIRET : ${company.siret}<br>Adresse : 12 rue de la Sécurité, Paris</p>
      
            <h3>Candidat :</h3>
            <p>${candidate.firstname} ${candidate.lastname}</p>
      
            <h3>Poste :</h3>
            <p>ID du poste : ${job.id}</p>
            <p>ID de la candidature : ${apply?.id}</p>
      
            <h3>Signatures :</h3>
            <div style="margin-top:20px; position:relative;">
              <p><strong>Entreprise :</strong></p>
              <img src="${company.stamp_url}" width="100" style="position:absolute; left:50px; top:10px; opacity:0.5;" />
              <img src="${company.signature_url}" width="150" style="position:absolute; left:40px; top:0;" />
            </div>
      
            <div style="margin-top:140px;">
              <p><strong>Candidat :</strong></p>
              <img src="${candidate.signature_url}" width="150" />
            </div>
          </body>
          </html>
        `;

		try {
			// Générer le PDF localement
			const { uri } = await Print.printToFileAsync({ html: htmlContent });

			// Créer un objet FormData
			const formData = new FormData();

			// Récupérer nom fichier depuis uri
			const fileName = `contract-${apply.id}-${Date.now()}.pdf`;

			// Dans React Native, pour FormData, il faut passer un objet avec uri, type et name
			formData.append("file", {
				uri,
				type: "application/pdf",
				name: fileName,
			});

			// Faire la requête POST vers Supabase Storage API (upload)
			const res = await axios.post(
				`${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${fileName}`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						apikey: SUPABASE_API_KEY,
						"Content-Type": "multipart/form-data",
					},
				},
			);

			if (res.status !== 200) {
				throw new Error("Upload échoué: " + JSON.stringify(res.data));
			}

			const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${fileName}`;

			console.log("✅ Upload réussi :", publicUrl);

			await handleUpdatePdfUrl(publicUrl);

			await Sharing.shareAsync(uri);
		} catch (error) {
			console.error("❌ Erreur PDF ou upload :", error);
		}
	};

	const handleUpdatePdfUrl = async (url) => {
		try {
			const updateContract = await update("contracts", contractId, {
				pdf_url: url,
			});
			console.log("update pdf url in contract :", updateContract);
			getContract();
		} catch (error) {
			console.log("error update pdf url in contract :", error);
		}
	};

	const downloadAndOpenPdf = async (pdfUrl) => {
		console.log("downloadAndOpenPdf :", pdfUrl);
		try {
			// Extract the filename from the URL
			const urlParts = pdfUrl.split("/");
			const fileName = urlParts[urlParts.length - 1] || "contract.pdf";

			// Define the local path with the original file name
			const fileUri = FileSystem.documentDirectory + fileName;

			// Download the file
			const { uri } = await FileSystem.downloadAsync(pdfUrl, fileUri);

			console.log("File downloaded to:", uri);

			// Open/share the file
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(uri);
			} else {
				alert("Le partage n'est pas disponible sur cet appareil.");
			}
		} catch (error) {
			console.error(
				"Erreur lors du téléchargement ou partage du PDF:",
				error,
			);
		}
	};

	return (
		<VStack style={{ flex: 1, backgroundColor: "#FFF" }}>
			<ScrollView contentContainerStyle={styles.container}>
				<Heading>Contrat de travail</Heading>

				<View style={styles.section}>
					<Text style={styles.subtitle}>Entreprise :</Text>
					<Text>{company?.name}</Text>
					<Text>SIRET : {company?.siret}</Text>
					<Text>Adresse : 12 rue de la Sécurité, Paris</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.subtitle}>Candidat :</Text>
					<Text>
						{candidate?.firstname} {candidate?.lastname}
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.subtitle}>Poste :</Text>
					<Text>{job?.id}</Text>
				</View>

				{/* {isProSigned && (
					<VStack
						style={{
							position: "relative",
							height: 200,
							marginBottom: 20,
						}}>
						<Text style={styles.subtitle}>
							Signature entreprise :
						</Text>
						<Image
							source={{ uri: company?.stamp_url }}
							style={{
								position: "absolute",
								top: 50,
								left: 50,
								width: 100,
								height: 100,
								opacity: 0.5,
							}}
						/>
						<Image
							source={{ uri: company?.signature_url }}
							style={{
								position: "absolute",
								top: 25,
								left: 25,
								width: 200,
								height: 200,
							}}
						/>
					</VStack>
				)} */}

				<View style={styles.section}>
					<Text style={styles.subtitle}>Signature du candidat :</Text>
					{isSigned ? (
						<Image
							source={{ uri: candidate?.signature_url }}
							style={{ width: 200, height: 200 }}
						/>
					) : (
						<Text style={styles.italic}>
							{role === "pro"
								? "Le candidat n'a pas encore signé."
								: "Vous n'avez pas encore signé."}
						</Text>
					)}
				</View>

				<View style={styles.section}>
					<Text style={styles.subtitle}>
						Signature et tampon entreprise :
					</Text>
					{isProSigned ? (
						<VStack
							style={{
								position: "relative",
								height: 200,
								marginBottom: 20,
							}}>
							<Image
								source={{ uri: company?.stamp_url }}
								style={{
									position: "absolute",
									top: 50,
									left: 50,
									width: 100,
									height: 100,
									opacity: 0.5,
								}}
							/>
							<Image
								source={{ uri: company?.signature_url }}
								style={{
									position: "absolute",
									top: 25,
									left: 25,
									width: 200,
									height: 200,
								}}
							/>
						</VStack>
					) : (
						<Text style={styles.italic}>
							{role === "pro"
								? "Vous n'avez pas encore signé le contrat."
								: "L'entreprise n'a pas encore signé le contrat."}
						</Text>
					)}
				</View>

				{role === "candidat" && !isSigned && (
					<View style={styles.buttonContainer}>
						{!candidate?.signature_url ? (
							<Button
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "profiles" },
									})
								}>
								<ButtonText>
									Enregistrer une signature
								</ButtonText>
							</Button>
						) : (
							<Button onPress={handleSign}>
								<ButtonText>Signer le contrat</ButtonText>
							</Button>
						)}
					</View>
				)}

				{role === "pro" && isSigned && !isProSigned && (
					<View style={styles.buttonContainer}>
						{!company?.signature_url || !company?.stamp_url ? (
							<Button
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "companies" },
									})
								}>
								<ButtonText>
									Enregistrer signature et tampon
								</ButtonText>
							</Button>
						) : (
							<Button onPress={handleProSign}>
								<ButtonText>
									Signer et tamponner le contrat
								</ButtonText>
							</Button>
						)}
					</View>
				)}

				{isSigned && isProSigned && (
					<View style={styles.buttonContainer}>
						{(!contract || !contract.pdf_url) && (
							<Button onPress={handleDownloadAndUploadPdf}>
								<ButtonText>
									Télécharger et envoyer le PDF
								</ButtonText>
							</Button>
						)}
						{contract?.pdf_url && (
							<Button
								onPress={() =>
									downloadAndOpenPdf(contract.pdf_url)
								}>
								<ButtonText>
									Télécharger et envoyer le PDF
								</ButtonText>
							</Button>
						)}
					</View>
				)}
			</ScrollView>

			<Modal
				isOpen={showProSignModal}
				onClose={() => setShowProSignModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>Confirmer la signature</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							Êtes-vous sûr de vouloir signer et tamponner ce
							contrat ? Cette action est définitive.
						</Text>
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowProSignModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							action='positive'
							onPress={confirmProSign}
							className='flex-1'>
							<ButtonText>Confirmer</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Modal
				isOpen={showCandidateSignModal}
				onClose={() => setShowCandidateSignModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>Confirmer la signature</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							Êtes-vous sûr de vouloir signer ce contrat ? Cette
							action est définitive.
						</Text>
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowCandidateSignModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						<Button
							action='positive'
							onPress={confirmCandidateSign}
							className='flex-1'>
							<ButtonText>Confirmer</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</VStack>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
		paddingTop: 15,
		paddingBottom: 60,
		backgroundColor: "#fff",
	},
	section: {
		marginBottom: 25,
	},
	subtitle: {
		fontWeight: "bold",
		marginBottom: 5,
	},
	italic: {
		fontStyle: "italic",
	},
	buttonContainer: {
		marginTop: 20,
	},
});

export default ContractScreen;
