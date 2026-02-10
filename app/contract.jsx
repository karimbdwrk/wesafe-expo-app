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

import { createSupabaseClient } from "@/lib/supabase";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import axios from "axios";

import { OtpCodeInput } from "@/components/OtpCodeInput";
import { sendRecruitmentStatusEmail } from "@/utils/sendRecruitmentStatusEmail";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const SUPABASE_STORAGE_BUCKET = "contracts";

const ContractScreen = () => {
	const { apply_id } = useLocalSearchParams();
	const router = useRouter();
	const { user, role, accessToken } = useAuth();
	const {
		getById,
		getAll,
		create,
		update,
		updateApplicationStatus,
		createNotification,
	} = useDataContext();
	const toast = useToast();

	const [isSigned, setIsSigned] = useState(false);
	const [isProSigned, setIsProSigned] = useState(false);
	const [showSignModal, setShowSignModal] = useState(false);
	const [candidate, setCandidate] = useState(null);
	const [company, setCompany] = useState(null);
	const [job, setJob] = useState(null);
	const [apply, setApply] = useState(null);

	const [contract, setContract] = useState(null);
	const [contractId, setContractId] = useState(null);

	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [error, setError] = useState("");
	const [resendTimer, setResendTimer] = useState(0);
	const [canResend, setCanResend] = useState(false);

	useEffect(() => {
		// console.log("OTP actuel:", otp, otp.length);
		if (otp.length === 6) {
			handleConfirm();
		}
	}, [otp]);

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

	// 1. ENVOYER OTP (avec JWT)
	const sendContractOtp = async (
		email,
		candidateName,
		companyName,
		contractIdParam = null,
	) => {
		// console.log("OTP contract ID :", contractIdParam);
		setOtpSent(true);
		setResendTimer(30);
		setCanResend(false);
		const supabase = createSupabaseClient(accessToken);

		const body = {
			candidate_email: email,
			candidate_name: candidateName,
			company_name: companyName,
		};

		// Si on a un contractId (cas du pro), on l'ajoute
		if (contractIdParam) {
			body.contract_id = contractIdParam;
		}
		// console.log("Envoi OTP avec body:", body);

		const { data, error } = await supabase.functions.invoke(
			"send-contract-otp",
			{
				body,
				// ➕ JWT automatique via headers
				headers: {
					Authorization: `Bearer ${accessToken}`, // ton accessToken du useAuth
				},
			},
		);

		if (error) throw error;
		console.log("✅ OTP envoyé:", data);
		return data;
	};

	const handleConfirm = async () => {
		console.log("Confirmer avec OTP:", otp);
		console.log("Contract ID:", contractId);
		if (otp.length !== 6) {
			setError("Code invalide");
			return;
		}
		setError("");

		try {
			// Vérifier l'OTP avant de confirmer
			const result = await verifyContractOtp(contractId, otp);
			// console.log("result verifyOTP :", result);
			if (result) {
				confirmSign();
			}
		} catch (error) {
			console.error("Erreur vérification OTP:", error);

			// Afficher un message plus clair selon le type d'erreur
			let errorMessage = "Code invalide ou expiré";
			if (error.message) {
				errorMessage = error.message;
			}

			setError(errorMessage);

			toast.show({
				placement: "top",
				render: ({ id }) => (
					<Toast
						nativeID={"toast-" + id}
						className='px-5 py-3 gap-4 bg-error-500'>
						<ToastTitle className='text-white'>
							{errorMessage}
						</ToastTitle>
					</Toast>
				),
			});
		}
	};

	// 2. VÉRIFIER OTP (avec JWT)
	const verifyContractOtp = async (contractId, otpCode) => {
		// console.log(
		// 	"Vérification OTP - contractId:",
		// 	contractId,
		// 	"otp:",
		// 	otpCode,
		// );
		const supabase = createSupabaseClient(accessToken);
		const { data, error } = await supabase.functions.invoke(
			"verify-contract-otp",
			{
				body: {
					contract_id: contractId,
					otp: otpCode,
				},
				headers: {
					Authorization: `Bearer ${accessToken}`, // JWT envoyé automatiquement
				},
			},
		);

		if (error) {
			console.error("Erreur Edge Function:", error);
			console.error("Status:", error.context?.status);

			// Erreur 404 = fonction non trouvée
			if (error.context?.status === 404) {
				throw new Error(
					"La fonction de vérification OTP n'est pas déployée",
				);
			}

			// Lire le body de l'erreur pour les autres cas
			let errorMessage = "Erreur lors de la vérification";
			try {
				const errorBody = await error.context.json();
				console.error("Error body:", errorBody);
				errorMessage =
					errorBody.error || errorBody.message || errorMessage;
			} catch (parseError) {
				console.error("Could not parse error body");
			}

			throw new Error(errorMessage);
		}
		// console.log("✅ OTP vérifié:", data);
		return data;
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
			// setIsSigned(true);
			setContract(data[0]);
			setContractId(data[0].id);
			if (data[0].isSigned) {
				setIsSigned(true);
			}
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

	// useEffect(() => {
	// 	console.log("contract id :", contractId);
	// }, [contractId]);

	// Timer pour le renvoi OTP
	useEffect(() => {
		let interval;
		if (resendTimer > 0) {
			interval = setInterval(() => {
				setResendTimer((prev) => {
					if (prev <= 1) {
						setCanResend(true);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [resendTimer]);

	const handleSign = () => {
		setShowSignModal(true);
	};

	// Créer le contrat pour le candidat avant d'envoyer l'OTP
	const createContract = async () => {
		try {
			// console.log("Vérification de l'existence d'un contrat...");

			// Vérifier si un contrat existe déjà
			const { data: existingContracts } = await getAll(
				"contracts",
				"*",
				`&apply_id=eq.${apply.id}`,
				1,
				1,
				"created_at.desc",
			);

			if (existingContracts && existingContracts.length > 0) {
				const contractId = existingContracts[0].id;
				setContractId(contractId);
				// console.log(
				// 	"✅ Un contrat existe déjà pour cette candidature:",
				// 	contractId,
				// );

				// Envoyer l'OTP au candidat
				await sendContractOtp(
					candidate.email,
					candidate.firstname,
					company.name,
					contractId,
				);

				return contractId;
			}

			// console.log(
			// 	"❌ Aucun contrat trouvé, création d'un nouveau contrat...",
			// );
			const newContract = await create("contracts", {
				job_id: job.id,
				company_id: company.id,
				candidate_id: candidate.id,
				apply_id: apply.id,
				category: job.category,
				isSigned: false, // Pas encore signé
			});
			// console.log("Contrat créé - response:", newContract);

			// Vérifier si c'est une réponse Axios avec status 201
			if (newContract?.status === 201) {
				// Le contrat a été créé, récupérer son ID via getAll
				// console.log(
				// 	"Contrat créé avec succès, récupération de l'ID...",
				// );
				const { data: contracts } = await getAll(
					"contracts",
					"*",
					`&apply_id=eq.${apply.id}`,
					1,
					1,
					"created_at.desc",
				);

				if (contracts && contracts.length > 0) {
					const contractId = contracts[0].id;
					setContractId(contractId);
					// console.log(
					// 	"✅ Nouveau contrat créé avec succès, ID:",
					// 	contractId,
					// );

					// Envoyer l'OTP au candidat
					await sendContractOtp(
						candidate.email,
						candidate.firstname,
						company.name,
						contractId,
					);

					return contractId;
				}
			}

			// Sinon, essayer de récupérer l'ID directement
			const contractId =
				newContract?.id ||
				newContract?.data?.id ||
				newContract?.[0]?.id;
			if (contractId) {
				setContractId(contractId);
				// console.log(
				// 	"✅ Nouveau contrat créé avec succès, ID:",
				// 	contractId,
				// );

				// Envoyer l'OTP au candidat
				await sendContractOtp(
					candidate.email,
					candidate.firstname,
					company.name,
					contractId,
				);

				return contractId;
			}

			// console.error("Pas de contract ID trouvé dans:", newContract);
			return null;
		} catch (error) {
			console.error("error create contract", error);
			toast.show({
				placement: "top",
				render: ({ id }) => (
					<Toast
						nativeID={"toast-" + id}
						className='px-5 py-3 gap-4 bg-error-500'>
						<ToastTitle className='text-white'>
							Erreur lors de la création du contrat
						</ToastTitle>
					</Toast>
				),
			});
			return null;
		}
	};

	const confirmSign = async () => {
		try {
			if (role === "pro") {
				// Signature Pro
				await update("contracts", contractId, {
					isProSigned: true,
				});

				await updateApplicationStatus(
					apply_id,
					"contract_signed_pro",
					"company",
				);

				setIsProSigned(true);
				setShowSignModal(false);
				setOtpSent(false);
				setOtp("");
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
				await createNotification({
					recipientId: candidate.id,
					actorId: company.id,
					type: "contract_signed_pro",
					title: "Contrat signé et tamponné par l'entreprise",
					body: "L'entreprise a signé et tamponné le contrat.",
					entityType: "application",
					entityId: apply_id,
				});

				// Envoyer l'email au candidat
				await sendRecruitmentStatusEmail(
					candidate.email,
					`${candidate.firstname} ${candidate.lastname}`,
					company.name,
					"contract_signed_pro",
					job.title,
					"candidate",
					accessToken,
				);
			} else {
				// Signature Candidat
				await update("contracts", contractId, {
					isSigned: true,
				});

				await updateApplicationStatus(
					apply_id,
					"contract_signed_candidate",
					"candidate",
				);

				setIsSigned(true);
				setShowSignModal(false);
				setOtpSent(false);
				setOtp("");
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
				await createNotification({
					recipientId: company.id,
					actorId: candidate.id,
					type: "contract_signed_candidate",
					title: "Contrat signé par le candidat",
					body: "Le candidat a signé le contrat.",
					entityType: "application",
					entityId: apply_id,
				});

				// Envoyer l'email au pro
				const statusEmail = await sendRecruitmentStatusEmail(
					company.email,
					company.name,
					`${candidate.firstname} ${candidate.lastname}`,
					"contract_signed_candidate",
					job.title,
					"company",
					accessToken,
				);
				// console.log(
				// 	"Email de notification de statut envoyé:",
				// 	statusEmail,
				// );
			}
		} catch (error) {
			console.log("error sign contract", error);
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
				{/* <Button
					onPress={() =>
						sendContractOtp(
							candidate.email,
							candidate.firstname,
							company.name,
						)
					}>
					<ButtonText>Send OTP test</ButtonText>
				</Button> */}
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
							<Button
								onPress={() =>
									// sendContractOtp(
									// 	candidate.email,
									// 	candidate.firstname,
									// 	company.name,
									// 	contractId,
									// )
									setShowSignModal(true)
								}>
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
							<Button
								onPress={() =>
									// sendContractOtp(
									// 	user.email,
									// 	company.name,
									// 	candidate.firstname,
									// 	contractId,
									// )
									setShowSignModal(true)
								}>
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
				isOpen={showSignModal}
				onClose={() => setShowSignModal(false)}>
				<ModalBackdrop />
				<ModalContent className='max-w-[375px]'>
					<ModalHeader>
						<Heading size='md'>Confirmer la signature</Heading>
					</ModalHeader>
					<ModalBody>
						<Text>
							{role === "pro"
								? "Êtes-vous sûr de vouloir signer et tamponner ce contrat ? Cette action est définitive."
								: "Êtes-vous sûr de vouloir signer ce contrat ? Cette action est définitive."}
						</Text>

						{otpSent && (
							<VStack
								style={{
									marginTop: 20,
									gap: 10,
									width: "100%",
									alignItems: "center",
								}}>
								<OtpCodeInput
									value={otp}
									onChange={setOtp}
									isInvalid={!!error}
									onComplete={handleConfirm}
								/>
								{error ? (
									<Text color='$red600' fontSize='$sm'>
										{error}
									</Text>
								) : null}

								{canResend ? (
									<Button
										variant='link'
										onPress={() => {
											if (role === "pro") {
												sendContractOtp(
													user.email,
													company.name,
													candidate.firstname,
													contractId,
												);
											} else {
												sendContractOtp(
													candidate.email,
													candidate.firstname,
													company.name,
													contractId,
												);
											}
										}}
										className='mt-2'>
										<ButtonText>
											Renvoyer le code
										</ButtonText>
									</Button>
								) : (
									<Text className='mt-2 text-sm text-gray-500'>
										Renvoyer le code dans {resendTimer}s
									</Text>
								)}
							</VStack>
						)}

						{!otpSent && (
							<Button
								onPress={async () => {
									try {
										console.log(
											"Bouton envoi OTP cliqué, role:",
											role,
										);
										if (role === "pro") {
											console.log(
												"Envoi OTP pour pro, contractId:",
												contractId,
											);
											await sendContractOtp(
												user.email,
												company.name,
												candidate.firstname,
												contractId,
											);
										} else {
											console.log(
												"Envoi OTP pour candidat",
											);
											// Créer le contrat d'abord pour le candidat (envoie l'OTP automatiquement)
											await createContract();
										}
									} catch (error) {
										console.error(
											"Erreur envoi OTP:",
											error,
										);
										toast.show({
											placement: "top",
											render: ({ id }) => (
												<Toast
													nativeID={"toast-" + id}
													className='px-5 py-3 gap-4 bg-error-500'>
													<ToastTitle className='text-white'>
														Erreur lors de l'envoi
														du code
													</ToastTitle>
												</Toast>
											),
										});
									}
								}}
								className='mt-4'>
								<ButtonText>
									Envoyer le code par email
								</ButtonText>
							</Button>
						)}
					</ModalBody>
					<ModalFooter className='w-full gap-3'>
						<Button
							variant='outline'
							action='secondary'
							onPress={() => setShowSignModal(false)}
							className='flex-1'>
							<ButtonText>Annuler</ButtonText>
						</Button>
						{/* {otpSent && (
							<Button
								action='positive'
								onPress={handleConfirm}
								className='flex-1'>
								<ButtonText>Confirmer</ButtonText>
							</Button>
						)} */}
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
