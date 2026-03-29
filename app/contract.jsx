import React, { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";

import { ScrollView } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import {
	Building2,
	User,
	Calendar,
	MapPin,
	Banknote,
	Clock,
	FileText,
	CheckCircle,
	Download,
	Pen,
	Signature,
} from "lucide-react-native";
import {
	Modal,
	ModalBackdrop,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@/components/ui/modal";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useDataContext } from "@/context/DataContext";
import { SEND_CONTRACT_OTP, SIGN_CONTRACT } from "@/utils/activityEvents";

import { createSupabaseClient } from "@/lib/supabase";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import axios from "axios";

import { OtpCodeInput } from "@/components/OtpCodeInput";
import { sendRecruitmentStatusEmail } from "@/utils/sendRecruitmentStatusEmail";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;
const SUPABASE_STORAGE_BUCKET = "contracts";

// Formater le SIRET avec des espaces : 123 456 789 00013
const formatSiret = (value) => {
	if (!value) return value;
	const cleaned = value.toString().replace(/\s/g, "");
	const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,5})$/);
	if (match) {
		return [match[1], match[2], match[3], match[4]]
			.filter(Boolean)
			.join(" ");
	}
	return value;
};

const formatDateFR = (iso) => {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleDateString("fr-FR");
	} catch {
		return "—";
	}
};

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
		trackActivity,
	} = useDataContext();
	const toast = useToast();
	const { isDark } = useTheme();

	// Style constants
	const bg = isDark ? "#111827" : "#f3f4f6";
	const cardBg = isDark ? "#1f2937" : "#ffffff";
	const cardBorder = isDark ? "#374151" : "#e5e7eb";
	const textPrimary = isDark ? "#f3f4f6" : "#111827";
	const textSecondary = isDark ? "#9ca3af" : "#6b7280";
	const cardStyle = {
		backgroundColor: cardBg,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: cardBorder,
		padding: 16,
		marginBottom: 12,
	};

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
			"applications",
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
		trackActivity(SEND_CONTRACT_OTP, { apply_id });
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
		trackActivity(SIGN_CONTRACT, { apply_id });
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
            <p><strong>${company.name}</strong><br>SIRET : ${formatSiret(company.siret)}<br>Adresse : 12 rue de la Sécurité, Paris</p>
      
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

	// Données d'affichage depuis les snapshots du contrat
	const displayCompany = contract?.company_snapshot;
	const displayCandidate = contract?.candidate_snapshot;
	const schedule = contract?.schedule || {};
	const weekSchedule = schedule.week_schedule || {};
	const vacations = schedule.vacations || [];
	const scheduleKnown = schedule.schedule_known || false;

	// Gestion des lieux de travail multiples
	const wLocType = contract?.work_location_type || "single";
	let multipleLocations = null;
	if (wLocType === "multiple" && contract?.work_location) {
		try {
			const parsed = Array.isArray(contract.work_location)
				? contract.work_location
				: JSON.parse(contract.work_location);
			multipleLocations = Array.isArray(parsed) ? parsed : null;
		} catch {
			multipleLocations = null;
		}
	}

	// Composant ligne d'information
	const InfoRow = ({ label, value }) => {
		if (value === null || value === undefined || value === "") return null;
		return (
			<HStack
				style={{
					justifyContent: "space-between",
					paddingVertical: 8,
					borderBottomWidth: 1,
					borderBottomColor: cardBorder,
				}}>
				<Text style={{ color: textSecondary, fontSize: 13, flex: 1 }}>
					{label}
				</Text>
				<Text
					style={{
						color: textPrimary,
						fontSize: 13,
						fontWeight: "500",
						flex: 1.2,
						textAlign: "right",
					}}>
					{String(value)}
				</Text>
			</HStack>
		);
	};

	// En-tête de section
	const SectionHeader = ({ icon, title }) => (
		<HStack space='sm' style={{ alignItems: "center", marginBottom: 14 }}>
			<Icon as={icon} size='sm' style={{ color: "#3b82f6" }} />
			<Text
				style={{
					fontSize: 15,
					fontWeight: "700",
					color: textPrimary,
				}}>
				{title}
			</Text>
		</HStack>
	);

	// Config badge statut
	const statusLabel =
		contract?.status === "published"
			? "Publié"
			: contract?.status === "draft"
				? "Brouillon"
				: contract?.status || "—";
	const statusColor =
		contract?.status === "published" ? "#3b82f6" : "#6b7280";
	const statusBg = isDark
		? contract?.status === "published"
			? "#1e3a5f"
			: "#374151"
		: contract?.status === "published"
			? "#dbeafe"
			: "#f3f4f6";

	return (
		<Box style={{ flex: 1, backgroundColor: bg }}>
			<ScrollView
				contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}>
				{/* Badges : type contrat + statut + signé */}
				<HStack
					space='sm'
					style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
					{contract?.contract_type ? (
						<Box
							style={{
								paddingHorizontal: 12,
								paddingVertical: 4,
								borderRadius: 20,
								backgroundColor:
									contract.contract_type === "CDI"
										? isDark
											? "#052e16"
											: "#dcfce7"
										: isDark
											? "#451a03"
											: "#fef3c7",
							}}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "700",
									color:
										contract.contract_type === "CDI"
											? "#16a34a"
											: "#b45309",
								}}>
								{contract.contract_type}
							</Text>
						</Box>
					) : null}
					{contract?.status ? (
						<Box
							style={{
								paddingHorizontal: 12,
								paddingVertical: 4,
								borderRadius: 20,
								backgroundColor: statusBg,
							}}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color: statusColor,
								}}>
								{statusLabel}
							</Text>
						</Box>
					) : null}
					{isSigned && isProSigned ? (
						<Box
							style={{
								paddingHorizontal: 12,
								paddingVertical: 4,
								borderRadius: 20,
								backgroundColor: isDark ? "#052e16" : "#dcfce7",
							}}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color: "#16a34a",
								}}>
								Signé
							</Text>
						</Box>
					) : null}
				</HStack>

				{/* Titre et description du poste */}
				{contract?.job_title ? (
					<Box style={{ marginBottom: 16 }}>
						<Text
							style={{
								fontSize: 22,
								fontWeight: "700",
								color: textPrimary,
								lineHeight: 30,
							}}>
							{contract.job_title}
						</Text>
						{contract?.job_description ? (
							<Text
								style={{
									fontSize: 14,
									color: textSecondary,
									marginTop: 6,
									lineHeight: 20,
								}}>
								{contract.job_description}
							</Text>
						) : null}
					</Box>
				) : null}

				{/* Card : Entreprise */}
				<Box style={cardStyle}>
					<SectionHeader icon={Building2} title='Entreprise' />
					<InfoRow
						label='Raison sociale'
						value={displayCompany?.name}
					/>
					<InfoRow
						label='SIRET'
						value={formatSiret(displayCompany?.siret)}
					/>
					{displayCompany?.address ? (
						<InfoRow
							label='Adresse'
							value={displayCompany.address}
						/>
					) : displayCompany?.street ||
					  displayCompany?.postcode ||
					  displayCompany?.city ? (
						<InfoRow
							label='Adresse'
							value={[
								displayCompany.street,
								displayCompany.postcode,
								displayCompany.city,
							]
								.filter(Boolean)
								.join(", ")}
						/>
					) : null}
					{displayCompany?.legal_representative ? (
						<InfoRow
							label='Représentant légal'
							value={displayCompany.legal_representative}
						/>
					) : null}
				</Box>

				{/* Card : Candidat */}
				<Box style={cardStyle}>
					<SectionHeader icon={User} title='Candidat' />
					<InfoRow
						label='Nom'
						value={
							`${displayCandidate?.firstname || ""} ${displayCandidate?.lastname || ""}`.trim() ||
							null
						}
					/>
					{displayCandidate?.birth_date ? (
						<InfoRow
							label='Date de naissance'
							value={formatDateFR(displayCandidate.birth_date)}
						/>
					) : null}
					{displayCandidate?.address ? (
						<InfoRow
							label='Adresse'
							value={displayCandidate.address}
						/>
					) : null}
				</Box>

				{/* Card : Informations contractuelles */}
				<Box style={cardStyle}>
					<SectionHeader icon={Calendar} title='Contrat' />
					<InfoRow
						label='Type de contrat'
						value={contract?.contract_type}
					/>
					{contract?.category ? (
						<InfoRow
							label='Classification'
							value={contract.category}
						/>
					) : null}
					{contract?.contract_reason ? (
						<InfoRow
							label='Motif de recrutement'
							value={contract.contract_reason}
						/>
					) : null}
					<InfoRow
						label='Date de début'
						value={formatDateFR(contract?.start_date)}
					/>
					{contract?.end_date ? (
						<InfoRow
							label='Date de fin'
							value={formatDateFR(contract.end_date)}
						/>
					) : null}
					{contract?.total_hours != null ? (
						<InfoRow
							label='Volume horaire'
							value={`${contract.total_hours}h`}
						/>
					) : null}
					{contract?.trial_period ? (
						<InfoRow
							label="Période d'essai"
							value={contract.trial_period}
						/>
					) : null}
				</Box>

				{/* Card : Lieu de travail */}
				{contract?.work_location || contract?.work_location_name ? (
					<Box style={cardStyle}>
						<SectionHeader icon={MapPin} title='Lieu de travail' />
						{contract?.work_location_name ? (
							<Text
								style={{
									fontSize: 14,
									fontWeight: "600",
									color: textPrimary,
									marginBottom: 8,
								}}>
								{contract.work_location_name}
							</Text>
						) : null}
						{wLocType === "multiple" && multipleLocations ? (
							<VStack style={{ gap: 6 }}>
								{multipleLocations.map((loc, i) => (
									<HStack
										key={i}
										style={{
											alignItems: "center",
											paddingVertical: 6,
											borderBottomWidth: 1,
											borderBottomColor: cardBorder,
										}}>
										<Box
											style={{
												width: 6,
												height: 6,
												borderRadius: 3,
												backgroundColor: "#3b82f6",
												marginRight: 10,
											}}
										/>
										<Text
											style={{
												color: textPrimary,
												fontSize: 14,
											}}>
											{loc}
										</Text>
									</HStack>
								))}
							</VStack>
						) : wLocType === "zone" ? (
							<Text
								style={{
									color: textPrimary,
									fontSize: 14,
									lineHeight: 20,
								}}>
								{contract.work_location}
							</Text>
						) : (
							<Text
								style={{
									color: textPrimary,
									fontSize: 14,
									lineHeight: 20,
								}}>
								{contract.work_location}
							</Text>
						)}
					</Box>
				) : null}

				{/* Card : Rémunération */}
				<Box style={cardStyle}>
					<SectionHeader icon={Banknote} title='Rémunération' />
					{contract?.hourly_rate != null ? (
						<InfoRow
							label='Taux horaire brut'
							value={`${contract.hourly_rate} €/h`}
						/>
					) : null}
					{contract?.overtime_rate != null ? (
						<InfoRow
							label='Taux heures supplémentaires'
							value={`${contract.overtime_rate} €/h`}
						/>
					) : null}
					{contract?.meal_bonus != null ? (
						<InfoRow
							label='Prime de repas'
							value={`${contract.meal_bonus} €`}
						/>
					) : null}
					{contract?.transport_bonus != null ? (
						<InfoRow
							label='Prime de transport'
							value={`${contract.transport_bonus} €`}
						/>
					) : null}
					{contract?.is_night && contract?.night_bonus != null ? (
						<InfoRow
							label='Majoration nuit'
							value={`${contract.night_bonus} €`}
						/>
					) : null}
					{contract?.is_sunday && contract?.sunday_bonus != null ? (
						<InfoRow
							label='Majoration dimanche'
							value={`${contract.sunday_bonus} €`}
						/>
					) : null}
					{contract?.is_holiday && contract?.holiday_bonus != null ? (
						<InfoRow
							label='Majoration jour férié'
							value={`${contract.holiday_bonus} €`}
						/>
					) : null}
				</Box>

				{/* Card : Planning */}
				{scheduleKnown ? (
					<Box style={cardStyle}>
						<SectionHeader icon={Clock} title='Planning' />
						{Object.entries(weekSchedule)
							.filter(([, v]) => v?.enabled)
							.map(([day, hours]) => (
								<HStack
									key={day}
									style={{
										justifyContent: "space-between",
										paddingVertical: 8,
										borderBottomWidth: 1,
										borderBottomColor: cardBorder,
									}}>
									<Text
										style={{
											color: textSecondary,
											fontSize: 13,
											textTransform: "capitalize",
										}}>
										{day}
									</Text>
									<Text
										style={{
											color: textPrimary,
											fontSize: 13,
											fontWeight: "500",
										}}>
										{hours.start} — {hours.end}
									</Text>
								</HStack>
							))}
						{vacations.length > 0 ? (
							<>
								<Text
									style={{
										color: textSecondary,
										fontSize: 11,
										fontWeight: "700",
										marginTop: 12,
										marginBottom: 6,
										textTransform: "uppercase",
										letterSpacing: 0.5,
									}}>
									Vacations ponctuelles
								</Text>
								{vacations.map((v, i) => (
									<HStack
										key={i}
										style={{
											justifyContent: "space-between",
											paddingVertical: 8,
											borderBottomWidth: 1,
											borderBottomColor: cardBorder,
										}}>
										<Text
											style={{
												color: textSecondary,
												fontSize: 13,
											}}>
											{v.date
												? formatDateFR(v.date)
												: "—"}
										</Text>
										<Text
											style={{
												color: textPrimary,
												fontSize: 13,
												fontWeight: "500",
											}}>
											{v.start_time} — {v.end_time}
										</Text>
									</HStack>
								))}
							</>
						) : null}
						{Object.entries(weekSchedule).filter(
							([, v]) => v?.enabled,
						).length === 0 && vacations.length === 0 ? (
							<Text
								style={{
									color: textSecondary,
									fontSize: 13,
									fontStyle: "italic",
								}}>
								Horaires à définir
							</Text>
						) : null}
					</Box>
				) : null}

				{/* Card : Équipement & Clauses */}
				{contract?.equipment_provided || contract?.custom_clauses ? (
					<Box style={cardStyle}>
						<SectionHeader
							icon={FileText}
							title='Clauses & Équipement'
						/>
						{contract?.equipment_provided ? (
							<>
								<HStack
									style={{
										alignItems: "center",
										paddingVertical: 8,
										borderBottomWidth: 1,
										borderBottomColor: cardBorder,
									}}>
									<Icon
										as={CheckCircle}
										size='xs'
										style={{
											color: "#16a34a",
											marginRight: 8,
										}}
									/>
									<Text
										style={{
											color: textPrimary,
											fontSize: 13,
										}}>
										Équipement fourni par l'entreprise
									</Text>
								</HStack>
								{contract?.equipment_details ? (
									<Text
										style={{
											color: textSecondary,
											fontSize: 13,
											marginTop: 6,
											lineHeight: 18,
										}}>
										{contract.equipment_details}
									</Text>
								) : null}
							</>
						) : null}
						{contract?.custom_clauses ? (
							<>
								<Text
									style={{
										color: textSecondary,
										fontSize: 11,
										fontWeight: "700",
										marginTop: contract?.equipment_provided
											? 12
											: 0,
										marginBottom: 4,
										textTransform: "uppercase",
										letterSpacing: 0.5,
									}}>
									Clauses particulières
								</Text>
								<Text
									style={{
										color: textPrimary,
										fontSize: 13,
										lineHeight: 20,
									}}>
									{contract.custom_clauses}
								</Text>
							</>
						) : null}
					</Box>
				) : null}

				{/* Card : Mentions légales */}
				<Box style={cardStyle}>
					<SectionHeader icon={FileText} title='Mentions légales' />
					<Text
						style={{
							color: textSecondary,
							fontSize: 13,
							lineHeight: 20,
						}}>
						Convention collective applicable :{"\n"}
						<Text
							style={{
								color: textPrimary,
								fontWeight: "600",
								fontSize: 13,
							}}>
							Convention collective nationale des entreprises de
							sécurité privée
						</Text>
					</Text>
				</Box>

				{/* Card : Signatures */}
				<Box style={cardStyle}>
					<SectionHeader icon={Signature} title='Signatures' />
					{/* Candidat */}
					<HStack
						style={{
							justifyContent: "space-between",
							alignItems: "center",
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderBottomColor: cardBorder,
						}}>
						<VStack style={{ gap: 2 }}>
							<Text
								style={{
									color: textSecondary,
									fontSize: 11,
									fontWeight: "700",
									textTransform: "uppercase",
									letterSpacing: 0.5,
								}}>
								Candidat
							</Text>
							<Text
								style={{
									color: textPrimary,
									fontSize: 14,
									fontWeight: "500",
								}}>
								{`${displayCandidate?.firstname || ""} ${displayCandidate?.lastname || ""}`.trim() ||
									"—"}
							</Text>
						</VStack>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Icon
								as={CheckCircle}
								size='sm'
								style={{
									color: isSigned ? "#16a34a" : "#9ca3af",
								}}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color: isSigned ? "#16a34a" : "#9ca3af",
								}}>
								{isSigned ? "Signé" : "En attente"}
							</Text>
						</HStack>
					</HStack>
					{/* Entreprise */}
					<HStack
						style={{
							justifyContent: "space-between",
							alignItems: "center",
							paddingVertical: 12,
						}}>
						<VStack style={{ gap: 2 }}>
							<Text
								style={{
									color: textSecondary,
									fontSize: 11,
									fontWeight: "700",
									textTransform: "uppercase",
									letterSpacing: 0.5,
								}}>
								Entreprise
							</Text>
							<Text
								style={{
									color: textPrimary,
									fontSize: 14,
									fontWeight: "500",
								}}>
								{displayCompany?.name || "—"}
							</Text>
						</VStack>
						<HStack space='xs' style={{ alignItems: "center" }}>
							<Icon
								as={CheckCircle}
								size='sm'
								style={{
									color: isProSigned ? "#16a34a" : "#9ca3af",
								}}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color: isProSigned ? "#16a34a" : "#9ca3af",
								}}>
								{isProSigned ? "Signé" : "En attente"}
							</Text>
						</HStack>
					</HStack>
				</Box>

				{/* Action : Modifier le contrat (pro uniquement, pas encore signé des deux côtés) */}
				{role === "pro" && !(isSigned && isProSigned) ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						<Button
							onPress={() =>
								router.push({
									pathname: "/contractgeneration",
									params: { application_id: apply_id },
								})
							}
							style={{
								backgroundColor: isDark ? "#374151" : "#e5e7eb",
								borderRadius: 10,
								height: 48,
							}}>
							<ButtonIcon
								as={Pen}
								style={{ color: textPrimary }}
							/>
							<ButtonText
								style={{
									color: textPrimary,
									fontSize: 15,
									marginLeft: 6,
								}}>
								Modifier le contrat
							</ButtonText>
						</Button>
					</Box>
				) : null}

				{/* Action : Candidat — signer */}
				{role === "candidat" && !isSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						{!candidate?.signature_url ? (
							<Button
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "profiles" },
									})
								}
								style={{
									backgroundColor: "#3b82f6",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonText
									style={{
										color: "#ffffff",
										fontSize: 15,
									}}>
									Enregistrer une signature
								</ButtonText>
							</Button>
						) : (
							<Button
								onPress={() => setShowSignModal(true)}
								style={{
									backgroundColor: "#16a34a",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonIcon
									as={Signature}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText
									style={{
										color: "#ffffff",
										fontSize: 15,
										marginLeft: 6,
									}}>
									Signer le contrat
								</ButtonText>
							</Button>
						)}
					</Box>
				) : null}

				{/* Action : Pro — signer */}
				{role === "pro" && isSigned && !isProSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						{!company?.signature_url || !company?.stamp_url ? (
							<Button
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "companies" },
									})
								}
								style={{
									backgroundColor: "#3b82f6",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonText
									style={{
										color: "#ffffff",
										fontSize: 15,
									}}>
									Enregistrer signature et tampon
								</ButtonText>
							</Button>
						) : (
							<Button
								onPress={() => setShowSignModal(true)}
								style={{
									backgroundColor: "#16a34a",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonIcon
									as={Signature}
									style={{ color: "#ffffff" }}
								/>
								<ButtonText
									style={{
										color: "#ffffff",
										fontSize: 15,
										marginLeft: 6,
									}}>
									Signer et tamponner le contrat
								</ButtonText>
							</Button>
						)}
					</Box>
				) : null}

				{/* Action : Télécharger PDF */}
				{isSigned && isProSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						{contract?.pdf_url ? (
							<Button
								onPress={() =>
									downloadAndOpenPdf(contract.pdf_url)
								}
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#e5e7eb",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonIcon
									as={Download}
									style={{ color: textPrimary }}
								/>
								<ButtonText
									style={{
										color: textPrimary,
										fontSize: 15,
										marginLeft: 6,
									}}>
									Télécharger le PDF
								</ButtonText>
							</Button>
						) : (
							<Button
								onPress={handleDownloadAndUploadPdf}
								style={{
									backgroundColor: isDark
										? "#374151"
										: "#e5e7eb",
									borderRadius: 10,
									height: 48,
								}}>
								<ButtonIcon
									as={Download}
									style={{ color: textPrimary }}
								/>
								<ButtonText
									style={{
										color: textPrimary,
										fontSize: 15,
										marginLeft: 6,
									}}>
									Générer et télécharger le PDF
								</ButtonText>
							</Button>
						)}
					</Box>
				) : null}
			</ScrollView>

			{/* Modal signature OTP */}
			<Modal
				isOpen={showSignModal}
				onClose={() => setShowSignModal(false)}>
				<ModalBackdrop />
				<ModalContent
					style={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						borderRadius: 16,
						marginHorizontal: 24,
					}}>
					<ModalHeader>
						<Heading size='md' style={{ color: textPrimary }}>
							Confirmer la signature
						</Heading>
					</ModalHeader>
					<ModalBody>
						<Text
							style={{
								fontSize: 14,
								color: textSecondary,
								lineHeight: 20,
							}}>
							{role === "pro"
								? "\u00cates-vous sûr de vouloir signer et tamponner ce contrat ? Cette action est définitive."
								: "\u00cates-vous sûr de vouloir signer ce contrat ? Cette action est définitive."}
						</Text>

						{otpSent ? (
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
									<Text
										style={{
											color: "#ef4444",
											fontSize: 13,
										}}>
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
									<Text
										style={{
											fontSize: 12,
											color: textSecondary,
										}}>
										Renvoyer le code dans {resendTimer}s
									</Text>
								)}
							</VStack>
						) : null}

						{!otpSent ? (
							<Button
								onPress={async () => {
									try {
										if (role === "pro") {
											await sendContractOtp(
												user.email,
												company.name,
												candidate.firstname,
												contractId,
											);
										} else {
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
								style={{
									backgroundColor: "#3b82f6",
									borderRadius: 10,
									height: 44,
									marginTop: 16,
								}}>
								<ButtonText style={{ color: "#ffffff" }}>
									Envoyer le code par email
								</ButtonText>
							</Button>
						) : null}
					</ModalBody>
					<ModalFooter style={{ gap: 10 }}>
						<Button
							variant='outline'
							onPress={() => setShowSignModal(false)}
							style={{
								flex: 1,
								borderColor: isDark ? "#4b5563" : "#d1d5db",
								borderRadius: 10,
								height: 44,
							}}>
							<ButtonText style={{ color: textPrimary }}>
								Annuler
							</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
};

export default ContractScreen;
