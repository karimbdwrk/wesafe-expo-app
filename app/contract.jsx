import React, { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";

import { ScrollView, View, TouchableOpacity } from "react-native";
import {
	useRouter,
	useLocalSearchParams,
	useFocusEffect,
	Stack,
} from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import CustomToast from "@/components/CustomToast";
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
	AlertCircle,
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
import Colors from "@/constants/Colors";
import { useDataContext } from "@/context/DataContext";
import { SEND_CONTRACT_OTP, SIGN_CONTRACT } from "@/utils/activityEvents";

import { createSupabaseClient } from "@/lib/supabase";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
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

// ── HTML template helpers (used in handleDownloadAndUploadPdf) ──────────────
const fr = (iso) => {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleDateString("fr-FR");
	} catch {
		return "—";
	}
};
const money = (v) => (v != null && v !== "" ? `${v} €` : null);
const row = (label, value) =>
	value
		? `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>`
		: "";
const fmt2 = (n) =>
	n != null
		? n.toLocaleString("fr-FR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
		: "—";

// ── Shared display sub-components ────────────────────────────────────────────
const InfoRow = ({ label, value, cardBorder, textSecondary, textPrimary }) => {
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

const SectionHeader = ({ icon, title, tint, textPrimary }) => (
	<HStack space='sm' style={{ alignItems: "center", marginBottom: 14 }}>
		<Icon as={icon} size='sm' style={{ color: tint }} />
		<Text style={{ fontSize: 15, fontWeight: "700", color: textPrimary }}>
			{title}
		</Text>
	</HStack>
);

const SignatureRow = ({
	label,
	name,
	signed,
	noBorder,
	cardBorder,
	textSecondary,
	textPrimary,
	signedColor,
	pendingColor,
}) => (
	<HStack
		style={{
			justifyContent: "space-between",
			alignItems: "center",
			paddingVertical: 12,
			...(noBorder
				? {}
				: { borderBottomWidth: 1, borderBottomColor: cardBorder }),
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
				{label}
			</Text>
			<Text style={{ color: textPrimary, fontSize: 14, fontWeight: "500" }}>
				{name || "—"}
			</Text>
		</VStack>
		<HStack space='xs' style={{ alignItems: "center" }}>
			<Icon
				as={Clock}
				size='sm'
				style={{ color: signed ? signedColor : pendingColor }}
			/>
			<Text
				style={{
					fontSize: 13,
					fontWeight: "600",
					color: signed ? signedColor : pendingColor,
				}}>
				{signed ? "Signé" : "En attente"}
			</Text>
		</HStack>
	</HStack>
);

// ── CSS partagé ──────────────────────────────────────────────────────────────
const buildContractCss = (ACCENT, ACCENT_LIGHT, footerText) => `
  @page {
    size: A4;
    margin: 24mm 22mm 20mm 22mm;
    @bottom-center {
      content: "${footerText} · Page " counter(page) " / " counter(pages);
      font-size: 7pt; color: #999;
    }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 5mm 6mm; }
  .doc-header { background: ${ACCENT}; color: #fff; padding: 20px 26px 16px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start; border-radius: 4px; }
  .doc-header .company-block .company-name { font-size: 15pt; font-weight: 700; margin: 0 0 4px; }
  .doc-header .company-block p { margin: 1px 0; font-size: 8pt; opacity: 0.8; }
  .doc-header .title-block { text-align: right; }
  .doc-header .title-block .contract-title { font-size: 18pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; line-height: 1.1; }
  .doc-header .title-block .contract-sub { font-size: 9pt; opacity: 0.8; margin: 4px 0 0; }
  .doc-header .title-block .ref { display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); border-radius: 20px; padding: 2px 10px; font-size: 7.5pt; margin-top: 6px; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${ACCENT}; border-left: 3.5px solid ${ACCENT}; padding: 3px 0 3px 10px; margin: 0 0 10px; background: ${ACCENT_LIGHT}; }
  .two-col { display: flex; gap: 16px; }
  .two-col > div { flex: 1; }
  .col-label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${ACCENT}; margin: 0 0 6px; padding-bottom: 3px; border-bottom: 1px solid #d0daea; }
  table.data { width: 100%; border-collapse: collapse; }
  table.data td { padding: 5px 8px; vertical-align: top; font-size: 9pt; border-bottom: 1px solid #eee; }
  table.data td.lbl { width: 40%; color: #555; font-size: 8.5pt; }
  table.data td.val { font-weight: 500; color: #1a1a1a; }
  table.data tr:nth-child(even) td { background-color: #f7f9fc; }
  .legal { font-size: 9pt; text-align: justify; color: #333; margin: 6px 0 0; line-height: 1.65; }
  .legal strong { color: #1a1a1a; }
  .info-box { background: #f7f9fc; border: 1px solid #d0daea; border-left: 3px solid ${ACCENT}; border-radius: 3px; padding: 10px 14px; font-size: 9pt; margin-top: 8px; line-height: 1.6; }
  .warn-box { background: #fff5f5; border: 1px solid #f0b4b4; border-left: 3px solid #c0392b; border-radius: 3px; padding: 10px 14px; font-size: 9pt; margin-top: 8px; line-height: 1.6; }
  .salary-box { background: #f0f5ff; border: 1.5px solid #a5b8d8; border-radius: 4px; padding: 12px 16px; margin-top: 10px; }
  .salary-box .salary-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: ${ACCENT}; margin: 0 0 8px; }
  .salary-box table { width: 100%; border-collapse: collapse; }
  .salary-box td { padding: 3px 0; font-size: 9pt; }
  .salary-box td.sl { color: #555; }
  .salary-box td.sv { font-weight: 600; text-align: right; color: #1a1a1a; }
  .salary-box .total-row td { border-top: 1.5px solid #a5b8d8; padding-top: 7px; font-weight: 700; font-size: 10pt; color: ${ACCENT}; }
  table.planning { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.planning th { background: ${ACCENT}; color: #fff; font-size: 8pt; text-align: left; padding: 5px 8px; font-weight: 600; }
  table.planning td { padding: 5px 8px; font-size: 9pt; border-bottom: 1px solid #e8e8e8; }
  table.planning tr:nth-child(even) td { background: #f7f9fc; }
  .planning-section-row td { background: #eef2f8 !important; font-size: 8pt; font-weight: 700; color: ${ACCENT}; padding: 4px 8px; }
  .sig-page { page-break-before: always; padding-top: 4px; }
  .sig-intro { font-size: 9pt; color: #444; margin-bottom: 20px; padding: 10px 14px; background: #f7f9fc; border: 1px solid #ddd; border-radius: 3px; }
  .sig-grid { display: flex; justify-content: space-between; gap: 20px; margin-top: 10px; }
  .sig-block { flex: 1; border: 1.5px solid #ccc; border-radius: 6px; padding: 16px 18px; }
  .sig-role { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; color: ${ACCENT}; letter-spacing: 0.8px; background: ${ACCENT_LIGHT}; margin: -16px -18px 12px; padding: 5px 12px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #d0daea; }
  .sig-name { font-size: 10.5pt; font-weight: 700; margin: 0 0 2px; }
  .sig-meta { font-size: 8pt; color: #666; margin-bottom: 14px; }
  .sig-img-area { min-height: 90px; position: relative; border: 1px dashed #ccc; border-radius: 4px; padding: 8px; overflow: hidden; }
  .sig-stamp { position: absolute; top: 50%; left: 50%; margin-top: -40px; margin-left: -40px; opacity: 0.25; z-index: 0; }
  .sig-stamp img { height: 80px; width: 80px; object-fit: contain; display: block; }
  .sig-img-area img.sig-img { position: relative; z-index: 1; max-height: 70px; max-width: 180px; object-fit: contain; display: block; }
  .sig-no { font-size: 8pt; color: #bbb; position: relative; z-index: 1; }
  .sig-date { margin-top: 10px; font-size: 8.5pt; color: #555; border-top: 1px solid #ddd; padding-top: 7px; }
  .paraphe-row { text-align: right; margin-top: 10px; font-size: 8pt; color: #bbb; }
  .legal-notice { background: #fffbf0; border: 1px solid #e8d88a; border-radius: 3px; padding: 10px 14px; font-size: 8.5pt; margin-top: 16px; line-height: 1.6; color: #5a4a00; }
  .section-divider { border: none; border-top: 1px solid #e0e0e0; margin: 6px 0 14px; }
`;

// ── Page signatures partagée ──────────────────────────────────────────────────
const buildSigPage = ({ dc, dd, contract, company, candidate, legalNotice }) => `
<hr class="section-divider"/>
<div class="paraphe-row">Lu et approuvé – Paraphes des parties (chaque page) : __________ / __________</div>
<div class="sig-page">
  <p class="section-title" style="font-size:10.5pt; padding:6px 0 6px 12px;">Signatures des parties</p>
  <div class="sig-intro">
    Fait en <strong>deux exemplaires originaux</strong>, à
    <strong>${dc?.city || "_______________"}</strong>,
    le <strong>${fr(contract?.signed_at_candidate || contract?.signed_at_company || new Date().toISOString())}</strong>.<br/>
    Chaque partie reconnaît avoir reçu un exemplaire et avoir pris connaissance de l'intégralité du contrat.
  </div>
  <div class="sig-grid">
    <div class="sig-block">
      <p class="sig-role">L'Employeur</p>
      <p class="sig-name">${dc?.name || "—"}</p>
      <p class="sig-meta">
        ${dc?.legal_representative ? `${dc.legal_representative}<br/>` : ""}Qualité : ${dc?.legal_representative_role || "Dirigeant"}<br/>
        SIRET : ${dc?.siret ? formatSiret(dc.siret) : "—"}
      </p>
      <div class="sig-img-area">
        ${company?.stamp_url ? `<div class="sig-stamp"><img src="${company.stamp_url}" alt="Tampon"/></div>` : ""}
        ${company?.signature_url ? `<img class="sig-img" src="${company.signature_url}" alt="Signature"/>` : `<span class="sig-no">Signature à apposer</span>`}
      </div>
      <p class="sig-date">${contract?.signed_at_company ? `✓ Signé numériquement le ${fr(contract.signed_at_company)}` : "Date et lieu : ________________________"}</p>
    </div>
    <div class="sig-block">
      <p class="sig-role">Le Salarié</p>
      <p class="sig-name">${`${dd?.firstname || ""} ${dd?.lastname || ""}`.trim() || "—"}</p>
      <p class="sig-meta">
        ${dd?.birth_date ? `Né(e) le ${fr(dd.birth_date)}<br/>` : ""}
        N° SS : ${dd?.social_security_number || "________________________"}<br/>
        <em>Mention manuscrite : « Lu et approuvé »</em>
      </p>
      <div class="sig-img-area">
        ${candidate?.signature_url ? `<img src="${candidate.signature_url}" alt="Signature"/>` : `<span class="sig-no">Signature à apposer</span>`}
      </div>
      <p class="sig-date">${contract?.signed_at_candidate ? `✓ Signé numériquement le ${fr(contract.signed_at_candidate)}` : "Date et lieu : ________________________"}</p>
    </div>
  </div>
  <div class="legal-notice" style="margin-top:20px;">${legalNotice}</div>
</div>
</html>`;

// ── Sections communes ─────────────────────────────────────────────────────────
const buildHeader = (dc, subtitle, refId, ACCENT) => `
<div class="doc-header">
  <div class="company-block">
    <p class="company-name">${dc?.name || "—"}</p>
    ${dc?.siret ? `<p>SIRET : ${formatSiret(dc.siret)}</p>` : ""}
    ${dc?.street || dc?.postcode || dc?.city ? `<p>${[dc.street, dc.postcode, dc.city].filter(Boolean).join(" · ")}</p>` : dc?.address ? `<p>${dc.address}</p>` : ""}
    ${dc?.legal_representative ? `<p>Représentant légal : ${dc.legal_representative}</p>` : ""}
  </div>
  <div class="title-block">
    <p class="contract-title">Contrat<br/>de travail</p>
    <p class="contract-sub">${subtitle}</p>
    <span class="ref">Réf. : ${refId}</span>
  </div>
</div>`;

const buildPartiesSection = (dc, dd, artFn) => `
<div class="section">
  <p class="section-title">${artFn("Parties au contrat")}</p>
  <div class="two-col">
    <div>
      <p class="col-label">L'Employeur</p>
      <table class="data">
        ${row("Raison sociale", dc?.name)}
        ${row("N° SIRET", dc?.siret ? formatSiret(dc.siret) : null)}
        ${row("Adresse du siège", dc?.street || dc?.postcode || dc?.city ? [dc.street, dc.postcode, dc.city].filter(Boolean).join(", ") : dc?.address || null)}
        ${row("Représentant légal", dc?.legal_representative)}
        ${row("Qualité", dc?.legal_representative_role || null)}
        ${row("Code NAF / APE", dc?.naf_code || null)}
      </table>
    </div>
    <div>
      <p class="col-label">Le Salarié</p>
      <table class="data">
        ${row("Nom et prénom", `${dd?.firstname || ""} ${dd?.lastname || ""}`.trim() || null)}
        ${row("Date de naissance", fr(dd?.birth_date))}
        ${row("Lieu de naissance", dd?.birth_place || null)}
        ${row("Nationalité", dd?.nationality || null)}
        ${row("N° Sécurité sociale", dd?.social_security_number || null)}
        ${row("Adresse", dd?.address || null)}
      </table>
    </div>
  </div>
</div>`;

const buildLocationSection = ({ contract, locHtml, wLocType, artFn }) => `
<div class="section">
  <p class="section-title">${artFn("Lieu de travail")}</p>
  ${contract?.work_location_name ? `<p style="font-weight:700; font-size:9.5pt; margin:0 0 4px;">${contract.work_location_name}</p>` : ""}
  <div class="info-box">${locHtml}</div>
  <p class="legal">${
    wLocType === "multiple"
      ? "Le salarié est amené à intervenir sur les différents sites listés ci-dessus."
      : wLocType === "zone"
        ? "Le salarié est susceptible d'exercer ses fonctions dans l'ensemble de la zone géographique définie ci-dessus."
        : "Le lieu de travail habituel est défini ci-dessus. Toute modification substantielle nécessiterait l'accord du salarié."
  }</p>
</div>`;

const buildRemuSection = ({ contract, remuRows, monthlyHours, hourlyRate, monthlySalary, artFn }) => `
<div class="section">
  <p class="section-title">${artFn("Rémunération")}</p>
  ${remuRows ? `<table class="data">${remuRows}</table>` : ""}
  ${monthlySalary != null ? `
  <div class="salary-box">
    <p class="salary-title">Détail du salaire brut mensuel</p>
    <table>
      <tr><td class="sl">Taux horaire brut</td><td class="sv">${fmt2(hourlyRate)}&nbsp;€ / h</td></tr>
      <tr><td class="sl">Heures mensuelles</td><td class="sv">${fmt2(monthlyHours)}&nbsp;h</td></tr>
      ${contract?.meal_bonus != null && contract.meal_bonus !== "" ? `<tr><td class="sl">Prime de repas</td><td class="sv">variable</td></tr>` : ""}
      <tr class="total-row"><td>Salaire brut mensuel de base</td><td style="text-align:right;">${fmt2(monthlySalary)}&nbsp;€ brut</td></tr>
    </table>
  </div>` : ""}
  <p class="legal">La rémunération versée est au moins égale au SMIC en vigueur (art. L. 3231-2 C. trav.) ou au salaire minimum conventionnel si plus favorable. Le bulletin de paie est remis mensuellement (art. L. 3243-2 C. trav.).</p>
</div>`;

const buildMajoBox = (contract) =>
  contract?.is_night || contract?.is_sunday || contract?.is_holiday
    ? `<div class="info-box" style="margin-top:8px;"><strong>Majorations applicables :</strong><br/>
    ${contract?.is_night && contract?.night_bonus != null ? `· Nuit : +${contract.night_bonus}&nbsp;€/h<br/>` : ""}
    ${contract?.is_sunday && contract?.sunday_bonus != null ? `· Dimanche : +${contract.sunday_bonus}&nbsp;€/h<br/>` : ""}
    ${contract?.is_holiday && contract?.holiday_bonus != null ? `· Jours fériés : +${contract.holiday_bonus}&nbsp;€/h` : ""}
    </div>`
    : "";

const buildTrialSection = (contract, artFn) =>
  contract?.trial_period
    ? `<div class="section">
  <p class="section-title">${artFn("Période d'essai")}</p>
  <p class="legal">Le présent contrat est soumis à une <strong>période d'essai de ${contract.trial_period}</strong>, renouvelable une fois dans la limite autorisée par la convention collective (art. L. 1221-19 C. trav.). Durant cette période, chaque partie peut y mettre fin en respectant les délais de prévenance légaux.</p>
</div>`
    : "";

const buildObligSection = (artFn) => `
<div class="section">
  <p class="section-title">${artFn("Obligations du salarié – Loyauté, discrétion et confidentialité")}</p>
  <p class="legal">Le salarié s'engage à observer une <strong>obligation de loyauté</strong> envers l'employeur, à exécuter de bonne foi les tâches confiées et à respecter le règlement intérieur. Il est tenu à une <strong>obligation de discrétion</strong> sur toutes les informations confidentielles auxquelles il aurait accès dans le cadre de ses fonctions, pendant et après l'exécution du contrat.</p>
</div>`;

const buildCcnSection = (artFn) => `
<div class="section">
  <p class="section-title">${artFn("Convention collective et règlement intérieur")}</p>
  <p class="legal">Le présent contrat est régi par la <strong>Convention collective nationale des entreprises de sécurité privée</strong> (IDCC 1351, Brochure JO n° 3196). Le salarié déclare avoir pris connaissance du règlement intérieur de l'entreprise et s'engage à le respecter.</p>
</div>`;

const buildRgpdSection = (artFn) => `
<div class="section">
  <p class="section-title">${artFn("Protection des données personnelles (RGPD)")}</p>
  <p class="legal">Les données personnelles du salarié sont collectées et traitées conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée. La durée de conservation est de 5 ans après la fin du contrat. Le salarié dispose d'un droit d'accès, de rectification et d'effacement en contactant l'employeur, et peut introduire une réclamation auprès de la CNIL.</p>
</div>`;

const buildOptionalSections = (contract, artFn) => [
  contract?.equipment_provided
    ? `<div class="section"><p class="section-title">${artFn("Équipements fournis")}</p><p class="legal">L'employeur met à disposition les EPI et équipements professionnels nécessaires (art. L. 4121-1 C. trav.). Ces équipements demeurent la propriété de l'employeur et devront être restitués en fin de contrat.</p>${contract?.equipment_details ? `<div class="info-box" style="margin-top:6px;"><strong>Équipements :</strong><br/>${contract.equipment_details}</div>` : ""}</div>`
    : "",
  contract?.custom_clauses
    ? `<div class="section"><p class="section-title">${artFn("Clauses particulières")}</p><p class="legal">${contract.custom_clauses}</p></div>`
    : "",
].join("");

// ── Template CDI ──────────────────────────────────────────────────────────────
const buildCdiHtml = (d) => {
  const { dc, dd, contract, company, candidate, apply, locHtml, wLocType, remuRows, monthlyHours, hourlyRate, monthlySalary, ws, DAY_FR } = d;
  const ACCENT = "#1B3A6B";
  const ACCENT_LIGHT = "#EBF0F8";
  const refId = apply?.id?.substring(0, 8)?.toUpperCase() || "—";
  let artN = 0;
  const art = (t) => `Article ${++artN} – ${t}`;
  const schedKnown = d.schedKnown;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<style>${buildContractCss(ACCENT, ACCENT_LIGHT, `${dc?.name || ""} · CDI · Réf. ${refId}`)}</style>
</head><body>

${buildHeader(dc, "CDI – Contrat à durée indéterminée", refId, ACCENT)}

${buildPartiesSection(dc, dd, art)}

<div class="section">
  <p class="section-title">${art("Engagement et nature du contrat")}</p>
  <p class="legal">L'employeur engage le salarié dans le cadre d'un <strong>contrat de travail à durée indéterminée (CDI)</strong>, régi par les dispositions du Code du travail et par la Convention collective nationale des entreprises de sécurité privée (IDCC 1351).</p>
  <table class="data" style="margin-top:8px;">
    ${row("Intitulé du poste", contract?.job_title || null)}
    ${row("Classification / Catégorie", contract?.category || null)}
    ${row("Date de prise d'effet", fr(contract?.start_date))}
    ${row("Convention collective", "Sécurité privée – IDCC 1351")}
  </table>
  ${contract?.job_description ? `<div class="info-box" style="margin-top:8px;"><strong>Description de la mission :</strong><br/>${contract.job_description}</div>` : ""}
</div>

${buildTrialSection(contract, art)}

${buildLocationSection({ contract, locHtml, wLocType, artFn: art })}

<div class="section">
  <p class="section-title">${art("Durée du travail et horaires")}</p>
  <p class="legal">La durée mensuelle de travail est fixée à <strong>${fmt2(monthlyHours)} heures / mois</strong>.</p>
  ${schedKnown && Object.entries(ws).some(([, v]) => v?.enabled)
    ? `<table class="planning" style="margin-top:8px;">
        <thead><tr><th style="width:30%">Jour</th><th style="width:35%">Horaires</th><th>Amplitude</th></tr></thead>
        <tbody>${Object.entries(ws).filter(([, v]) => v?.enabled).map(([day, h]) => {
          const s = h.start || "—"; const e = h.end || "—";
          let amp = "—";
          try { const [sh,sm] = s.split(":").map(Number); const [eh,em] = e.split(":").map(Number); const diff = eh*60+em-(sh*60+sm); if(!isNaN(diff)&&diff>0) amp=`${Math.floor(diff/60)}h${diff%60>0?String(diff%60).padStart(2,"0"):""}`;} catch{}
          return `<tr><td>${DAY_FR[day]||day}</td><td>${s} – ${e}</td><td>${amp}</td></tr>`;
        }).join("")}</tbody>
      </table>`
    : `<p class="legal" style="margin-top:4px;">Les horaires précis seront communiqués par l'employeur. Toute heure au-delà de 35 h/semaine constitue une heure supplémentaire ouvrant droit à majoration (art. L. 3121-28 C. trav.).</p>`}
  ${buildMajoBox(contract)}
</div>

${buildRemuSection({ contract, remuRows, monthlyHours, hourlyRate, monthlySalary, artFn: art })}

<div class="section">
  <p class="section-title">${art("Congés payés")}</p>
  <p class="legal">Le salarié bénéficie de <strong>2,5 jours ouvrables</strong> de congés payés par mois de travail effectif, soit 30 jours ouvrables par an (art. L. 3141-3 C. trav.). Les dates sont fixées par l'employeur après consultation du salarié, en respectant un délai de prévenance d'un mois.</p>
</div>

<div class="section">
  <p class="section-title">${art("Mutuelle, prévoyance et protection sociale")}</p>
  <p class="legal">Le salarié bénéficie du régime collectif obligatoire de frais de santé (loi n° 2013-504 du 14 juin 2013). La cotisation patronale représente au minimum 50 % de la cotisation totale. Un régime de prévoyance collective (incapacité, invalidité, décès) est applicable selon les dispositions conventionnelles.</p>
</div>

<div class="section">
  <p class="section-title">${art("Rupture du contrat de travail")}</p>
  <p class="legal">Le présent CDI peut être rompu à l'initiative de l'une ou l'autre des parties dans les conditions suivantes :</p>
  <div class="info-box" style="margin-top:8px;">
    <table style="width:100%; border-collapse:collapse; font-size:8.5pt;">
      <tr style="background:#e8edf5;"><th style="padding:4px 8px; text-align:left; width:35%;">Mode de rupture</th><th style="padding:4px 8px; text-align:left; width:35%;">Préavis</th><th style="padding:4px 8px; text-align:left;">Référence</th></tr>
      <tr><td style="padding:4px 8px;">Démission</td><td>Selon convention collective</td><td>Art. L. 1237-1</td></tr>
      <tr style="background:#f7f9fc;"><td style="padding:4px 8px;">Licenciement</td><td>Selon ancienneté et convention</td><td>Art. L. 1234-1</td></tr>
      <tr><td style="padding:4px 8px;">Rupture conventionnelle</td><td>15 jours (rétractation)</td><td>Art. L. 1237-11</td></tr>
    </table>
  </div>
  <p class="legal" style="margin-top:8px;">En cas de licenciement (sauf faute grave ou lourde), le salarié ayant au moins 8 mois d'ancienneté bénéficiera d'une indemnité légale de licenciement (art. L. 1234-9 C. trav.).</p>
</div>

${buildOptionalSections(contract, art)}
${buildObligSection(art)}
${buildCcnSection(art)}
${buildRgpdSection(art)}

${buildSigPage({ dc, dd, contract, company, candidate, legalNotice: `<strong>Information :</strong> Le présent CDI est conclu conformément aux dispositions du Code du travail et de la Convention collective nationale de la sécurité privée (IDCC 1351). Chaque partie conserve un exemplaire original.` })}`;
};

// ── Template CDD classique ────────────────────────────────────────────────────
const buildCddHtml = (d) => {
  const { dc, dd, contract, company, candidate, apply, locHtml, wLocType, remuRows, monthlyHours, hourlyRate, monthlySalary, ws, DAY_FR } = d;
  const ACCENT = "#1B3A6B";
  const ACCENT_LIGHT = "#EBF0F8";
  const refId = apply?.id?.substring(0, 8)?.toUpperCase() || "—";
  let artN = 0;
  const art = (t) => `Article ${++artN} – ${t}`;
  const schedKnown = d.schedKnown;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<style>${buildContractCss(ACCENT, ACCENT_LIGHT, `${dc?.name || ""} · CDD · Réf. ${refId}`)}</style>
</head><body>

${buildHeader(dc, "CDD – Contrat à durée déterminée", refId, ACCENT)}

${buildPartiesSection(dc, dd, art)}

<div class="section">
  <p class="section-title">${art("Motif de recours au CDD")}</p>
  <p class="legal">Conformément à l'article L. 1242-2 du Code du travail, le présent contrat est conclu pour le motif suivant :</p>
  <div class="warn-box" style="margin-top:8px;">
    <strong>Motif de recours :</strong> ${contract?.contract_reason || "________________________"}<br/>
    ${contract?.cdd_reason_code ? `<span style="font-size:8.5pt; color:#555;">Code : ${contract.cdd_reason_code}</span>` : ""}
  </div>
  <p class="legal" style="margin-top:6px; font-size:8.5pt; color:#666;">⚠ Le CDD est un contrat d'exception (art. L. 1242-1 C. trav.). Tout CDD conclu en dehors des motifs légaux ou comportant des mentions manquantes peut être requalifié en CDI.</p>
</div>

<div class="section">
  <p class="section-title">${art("Durée et terme du contrat")}</p>
  <table class="data">
    ${row("Date de début", fr(contract?.start_date))}
    ${contract?.end_date ? row("Date de fin", fr(contract.end_date)) : row("Terme", "Sans terme précis")}
    ${row("Volume horaire mensuel", `${fmt2(monthlyHours)} h / mois`)}
    ${row("Intitulé du poste", contract?.job_title || null)}
    ${row("Classification / Catégorie", contract?.category || null)}
  </table>
  ${!contract?.end_date ? `<p class="legal" style="margin-top:6px;">Le contrat prendra fin à la réalisation de l'objet pour lequel il a été conclu (art. L. 1242-7 C. trav.).</p>` : ""}
  ${contract?.job_description ? `<div class="info-box" style="margin-top:8px;"><strong>Description de la mission :</strong><br/>${contract.job_description}</div>` : ""}
  <p class="legal" style="margin-top:8px;">À l'issue du présent contrat, le salarié percevra une <strong>indemnité de fin de contrat égale à 10 %</strong> de la rémunération totale brute perçue (art. L. 1243-8 C. trav.), sauf renouvellement ou embauche en CDI.</p>
</div>

${buildTrialSection(contract, art)}

${buildLocationSection({ contract, locHtml, wLocType, artFn: art })}

<div class="section">
  <p class="section-title">${art("Durée du travail et horaires")}</p>
  <p class="legal">La durée mensuelle de travail est fixée à <strong>${fmt2(monthlyHours)} heures / mois</strong>.</p>
  ${schedKnown && Object.entries(ws).some(([, v]) => v?.enabled)
    ? `<table class="planning" style="margin-top:8px;">
        <thead><tr><th style="width:30%">Jour</th><th style="width:35%">Horaires</th><th>Amplitude</th></tr></thead>
        <tbody>${Object.entries(ws).filter(([, v]) => v?.enabled).map(([day, h]) => {
          const s = h.start || "—"; const e = h.end || "—";
          let amp = "—";
          try { const [sh,sm] = s.split(":").map(Number); const [eh,em] = e.split(":").map(Number); const diff = eh*60+em-(sh*60+sm); if(!isNaN(diff)&&diff>0) amp=`${Math.floor(diff/60)}h${diff%60>0?String(diff%60).padStart(2,"0"):""}`;} catch{}
          return `<tr><td>${DAY_FR[day]||day}</td><td>${s} – ${e}</td><td>${amp}</td></tr>`;
        }).join("")}</tbody>
      </table>`
    : `<p class="legal" style="margin-top:4px;">Les horaires seront communiqués par l'employeur conformément aux besoins du service.</p>`}
  ${buildMajoBox(contract)}
</div>

${buildRemuSection({ contract, remuRows, monthlyHours, hourlyRate, monthlySalary, artFn: art })}

<div class="section">
  <p class="section-title">${art("Congés payés et indemnité compensatrice")}</p>
  <p class="legal">Le salarié acquiert des congés payés à raison de <strong>2,5 jours ouvrables</strong> par mois de travail effectif (art. L. 3141-3 C. trav.). À l'issue du contrat, si le salarié n'a pu solder ses congés, une <strong>indemnité compensatrice de congés payés égale à 10 %</strong> de la rémunération totale brute lui sera versée (art. L. 3141-26 C. trav.).</p>
</div>

<div class="section">
  <p class="section-title">${art("Rupture anticipée du contrat")}</p>
  <p class="legal">Le présent CDD ne peut être rompu avant son terme qu'en cas de (art. L. 1243-1 C. trav.) :</p>
  <div class="info-box" style="margin-top:6px;">
    · Accord amiable écrit entre les parties<br/>
    · Faute grave de l'une ou l'autre des parties<br/>
    · Force majeure<br/>
    · Inaptitude constatée par le médecin du travail<br/>
    · Embauche en CDI (préavis : 1 jour/semaine restante, max 2 semaines)
  </div>
  <p class="legal" style="margin-top:6px; font-size:8.5pt; color:#666;">⚠ Toute rupture anticipée en dehors de ces cas ouvre droit à des dommages-intérêts correspondant au minimum aux salaires restant dûs jusqu'au terme.</p>
</div>

<div class="section">
  <p class="section-title">${art("Mutuelle et prévoyance")}</p>
  <p class="legal">Le salarié en CDD bénéficie des mêmes avantages collectifs que les salariés en CDI (art. L. 1242-14 C. trav.), notamment l'accès au régime collectif de frais de santé et au régime de prévoyance conventionnel.</p>
</div>

${buildOptionalSections(contract, art)}
${buildObligSection(art)}
${buildCcnSection(art)}
${buildRgpdSection(art)}

${buildSigPage({ dc, dd, contract, company, candidate, legalNotice: `<strong>⚠ Remise du contrat (art. L. 1242-13 C. trav.) :</strong> Le contrat doit être transmis au salarié <strong>dans les 2 jours ouvrables suivant l'embauche</strong>. L'absence de signature dans ce délai peut entraîner la requalification en CDI. Chaque partie conserve un exemplaire original.` })}`;
};

// ── Template CDD Vacations ────────────────────────────────────────────────────
const buildVacationsHtml = (d) => {
  const { dc, dd, contract, company, candidate, apply, locHtml, wLocType, remuRows, monthlyHours, hourlyRate, monthlySalary, vacs } = d;
  const ACCENT = "#1B3A6B";
  const ACCENT_LIGHT = "#EBF0F8";
  const refId = apply?.id?.substring(0, 8)?.toUpperCase() || "—";
  let artN = 0;
  const art = (t) => `Article ${++artN} – ${t}`;

  const firstVacDate = vacs.length > 0 ? fr(vacs[0].date) : "—";
  const lastVacDate = vacs.length > 0 ? fr(vacs[vacs.length - 1].date) : "—";
  const totalVacs = vacs.length;

  const totalMinutes = vacs.reduce((acc, v) => {
    try {
      const [sh, sm] = v.start_time.split(":").map(Number);
      const [eh, em] = v.end_time.split(":").map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return acc + (diff > 0 ? diff : 0);
    } catch { return acc; }
  }, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalMin = totalMinutes % 60;
  const totalHLabel = `${totalH}h${totalMin > 0 ? String(totalMin).padStart(2, "0") : ""}`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<style>${buildContractCss(ACCENT, ACCENT_LIGHT, `${dc?.name || ""} · CDD Vacations · Réf. ${refId}`)}</style>
</head><body>

${buildHeader(dc, "CDD Vacations – Contrat à durée déterminée", refId, ACCENT)}

${buildPartiesSection(dc, dd, art)}

<div class="section">
  <p class="section-title">${art("Motif de recours au CDD")}</p>
  <p class="legal">Conformément à l'article L. 1242-2 du Code du travail, le présent contrat est conclu pour le motif suivant :</p>
  <div class="warn-box" style="margin-top:8px;">
    <strong>Motif de recours :</strong> ${contract?.contract_reason || "Accroissement temporaire d'activité"}<br/>
    ${contract?.cdd_reason_code ? `<span style="font-size:8.5pt; color:#555;">Code : ${contract.cdd_reason_code}</span>` : ""}
  </div>
  ${contract?.job_description ? `<div class="info-box" style="margin-top:8px;"><strong>Description de la mission :</strong><br/>${contract.job_description}</div>` : ""}
</div>

<div class="section">
  <p class="section-title">${art("Calendrier des vacations")}</p>
  <table class="data" style="margin-bottom:8px;">
    ${row("Poste", contract?.job_title || null)}
    ${row("Classification / Catégorie", contract?.category || null)}
    ${row("Première vacation", firstVacDate)}
    ${row("Dernière vacation", lastVacDate)}
    ${row("Nombre de vacations", String(totalVacs))}
    ${row("Volume horaire total", totalHLabel)}
  </table>
  <table class="planning">
    <thead>
      <tr>
        <th style="width:35%">Date</th>
        <th style="width:30%">Début</th>
        <th style="width:20%">Fin</th>
        <th>Durée</th>
      </tr>
    </thead>
    <tbody>
      ${vacs.map((v) => {
        let dur = "—";
        try {
          const [sh, sm] = v.start_time.split(":").map(Number);
          const [eh, em] = v.end_time.split(":").map(Number);
          const diff = eh * 60 + em - (sh * 60 + sm);
          if (!isNaN(diff) && diff > 0) dur = `${Math.floor(diff / 60)}h${diff % 60 > 0 ? String(diff % 60).padStart(2, "0") : ""}`;
        } catch {}
        return `<tr><td>${fr(v.date)}</td><td>${v.start_time}</td><td>${v.end_time}</td><td>${dur}</td></tr>`;
      }).join("")}
      <tr class="planning-section-row"><td colspan="3"><strong>Total</strong></td><td><strong>${totalHLabel}</strong></td></tr>
    </tbody>
  </table>
  <p class="legal" style="margin-top:8px;">L'employeur se réserve le droit de modifier les horaires de chaque vacation avec un délai de prévenance raisonnable, dans le respect des dispositions légales.</p>
</div>

${buildLocationSection({ contract, locHtml, wLocType, artFn: art })}

${buildRemuSection({ contract, remuRows, monthlyHours: totalH + totalMin / 60, hourlyRate, monthlySalary: hourlyRate != null ? Math.round((totalH + totalMin / 60) * hourlyRate * 100) / 100 : null, artFn: art })}

<div class="section">
  <p class="section-title">${art("Congés payés et indemnité de fin de contrat")}</p>
  <p class="legal">En raison de la nature discontinue des vacations, une <strong>indemnité compensatrice de congés payés égale à 10 %</strong> de la rémunération totale brute sera versée à l'issue de chaque vacation ou en fin de contrat (art. L. 3141-26 et L. 1243-8 C. trav.).</p>
</div>

<div class="section">
  <p class="section-title">${art("Rupture et fin de contrat")}</p>
  <p class="legal">Le contrat prend fin à l'issue de la dernière vacation figurant au calendrier ci-dessus. Il ne peut être rompu anticipativement qu'en cas d'accord amiable, de faute grave, de force majeure, d'inaptitude constatée par le médecin du travail ou d'embauche en CDI (art. L. 1243-1 C. trav.).</p>
</div>

${buildOptionalSections(contract, art)}
${buildObligSection(art)}
${buildCcnSection(art)}
${buildRgpdSection(art)}

${buildSigPage({ dc, dd, contract, company, candidate, legalNotice: `<strong>⚠ Remise du contrat (art. L. 1242-13 C. trav.) :</strong> Le présent contrat de vacations doit être remis au salarié <strong>avant la première vacation</strong>. L'absence de signature peut entraîner la requalification en CDI. Chaque partie conserve un exemplaire original.` })}`;
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
	const bg = isDark ? Colors.dark.background : Colors.light.background;
	const cardBg = isDark
		? Colors.dark.cardBackground
		: Colors.light.cardBackground;
	const cardBorder = isDark ? Colors.dark.border : Colors.light.border;
	const textPrimary = isDark ? Colors.dark.text : Colors.light.text;
	const textSecondary = isDark ? Colors.dark.muted : Colors.light.muted;
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
		firstName,
		companyName,
		contractIdParam = null,
		recipientRole = "candidat",
		jobTitle = "",
		candidateDisplayName = "",
	) => {
		// console.log("OTP contract ID :", contractIdParam);
		setOtpSent(true);
		setResendTimer(30);
		setCanResend(false);
		const supabase = createSupabaseClient(accessToken);

		const body = {
			candidate_email: email,
			candidate_name: firstName,
			company_name: companyName,
			role: recipientRole,
			job_title: jobTitle,
			...(recipientRole === "pro" && {
				candidate_display_name: candidateDisplayName,
			}),
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
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title={errorMessage}
					/>
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
					"candidat",
					job.title,
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
						"candidat",
						job.title,
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
					"candidat",
					job.title,
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
					<CustomToast
						id={id}
						icon={AlertCircle}
						color={
							isDark ? Colors.dark.danger : Colors.light.danger
						}
						title='Erreur lors de la création du contrat'
					/>
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
					signed_at_company: new Date().toISOString(),
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
						<CustomToast
							id={id}
							icon={Signature}
							color={
								isDark
									? Colors.dark.success
									: Colors.light.success
							}
							title='Contrat signé et tamponné !'
						/>
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
					signed_at_candidate: new Date().toISOString(),
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
						<CustomToast
							id={id}
							icon={Signature}
							color={
								isDark
									? Colors.dark.success
									: Colors.light.success
							}
							title='Contrat signé !'
						/>
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

		const dc = contract?.company_snapshot || company;
		const dd = contract?.candidate_snapshot || candidate;
		const sched = contract?.schedule || {};
		const ws = sched.week_schedule || {};
		const vacs = sched.vacations || [];
		const schedKnown = sched.schedule_known || false;

		const wLocType = contract?.work_location_type || "single";
		let locHtml = "";
		if (wLocType === "multiple" && contract?.work_location) {
			try {
				const locs = Array.isArray(contract.work_location)
					? contract.work_location
					: JSON.parse(contract.work_location);
				locHtml = `<ul style="margin:4px 0 0 18px; padding:0;">${(Array.isArray(locs) ? locs : []).map((l) => `<li>${l}</li>`).join("")}</ul>`;
			} catch { locHtml = contract.work_location || "—"; }
		} else {
			locHtml = contract?.work_location || "—";
		}

		const DAY_FR = { lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi", dimanche: "Dimanche" };

		const remuRows = [
			row("Taux horaire brut", money(contract?.hourly_rate) ? `${contract.hourly_rate} €/h` : null),
			row("Taux heures supplémentaires", money(contract?.overtime_rate) ? `${contract.overtime_rate} €/h` : null),
			row("Prime de repas", money(contract?.meal_bonus)),
			row("Prime de transport", money(contract?.transport_bonus)),
			contract?.is_night ? row("Majoration nuit", money(contract?.night_bonus)) : "",
			contract?.is_sunday ? row("Majoration dimanche", money(contract?.sunday_bonus)) : "",
			contract?.is_holiday ? row("Majoration jour férié", money(contract?.holiday_bonus)) : "",
		].join("");

		const monthlyHours = contract?.total_hours ? Math.round(parseFloat(contract.total_hours) * 100) / 100 : 151.67;
		const hourlyRate = contract?.hourly_rate ? parseFloat(contract.hourly_rate) : null;
		const monthlySalary = hourlyRate != null ? Math.round(monthlyHours * hourlyRate * 100) / 100 : null;

		const d = { dc, dd, contract, company, candidate, apply, job, locHtml, wLocType, remuRows, monthlyHours, hourlyRate, monthlySalary, ws, vacs, schedKnown, DAY_FR };

		const htmlContent =
			contract?.contract_type === 'CDD Vacations'
				? buildVacationsHtml(d)
				: contract?.contract_type === 'CDD'
					? buildCddHtml(d)
					: buildCdiHtml(d);

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

	const tint = isDark ? Colors.dark.tint : Colors.light.tint;
	const colorProps = { cardBorder, textSecondary, textPrimary };
	const sigColors = {
		signedColor: isDark ? Colors.dark.success : Colors.light.success,
		pendingColor: isDark ? Colors.dark.muted : Colors.light.muted,
	};

	// Config badge statut
	const statusLabel =
		contract?.status === "published"
			? "Publié"
			: contract?.status === "draft"
				? "Brouillon"
				: contract?.status || "—";
	const statusColor =
		contract?.status === "published"
			? isDark
				? Colors.dark.tint
				: Colors.light.tint
			: isDark
				? Colors.dark.muted
				: Colors.light.muted;
	const statusBg = isDark
		? contract?.status === "published"
			? "#1e3a5f"
			: Colors.dark.border
		: contract?.status === "published"
			? "#dbeafe"
			: Colors.light.background;

	const IR = (p) => <InfoRow {...colorProps} {...p} />;
	const SH = (p) => <SectionHeader tint={tint} textPrimary={textPrimary} {...p} />;

	return (
		<Box style={{ flex: 1, backgroundColor: bg }}>
			<Stack.Screen
				options={{
					headerRight: () =>
						contract?.status ? (
							<View
								style={{
									paddingHorizontal: 10,
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
							</View>
						) : null,
				}}
			/>
			<ScrollView
				contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}>
				{/* Badges : type contrat + statut + signé */}
				<HStack space='sm' style={{ flexWrap: "wrap", gap: 8 }}>
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
									color: isDark ? Colors.dark.success : Colors.light.success,
								}}>
								Signé
							</Text>
						</Box>
					) : null}
				</HStack>

				{/* Titre et description du poste */}
				{contract?.job_title ? (
					<Box style={{ marginBottom: 16 }}>
						<Heading
							className='font-extrabold'
							style={{
								fontSize: 22,
								color: textPrimary,
								lineHeight: 30,
							}}>
							{contract.job_title}
						</Heading>
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
					<SH icon={Building2} title='Entreprise' />
					<IR
						label='Raison sociale'
						value={displayCompany?.name}
					/>
					<IR
						label='SIRET'
						value={formatSiret(displayCompany?.siret)}
					/>
					{displayCompany?.address ? (
						<IR
							label='Adresse'
							value={displayCompany.address}
						/>
					) : displayCompany?.street ||
					  displayCompany?.postcode ||
					  displayCompany?.city ? (
						<IR
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
						<IR
							label='Représentant légal'
							value={displayCompany.legal_representative}
						/>
					) : null}
				</Box>

				{/* Card : Candidat */}
				<Box style={cardStyle}>
					<SH icon={User} title='Candidat' />
					<IR
						label='Nom'
						value={
							`${displayCandidate?.firstname || ""} ${displayCandidate?.lastname || ""}`.trim() ||
							null
						}
					/>
					{displayCandidate?.birth_date ? (
						<IR
							label='Date de naissance'
							value={formatDateFR(displayCandidate.birth_date)}
						/>
					) : null}
					{displayCandidate?.social_security_number ? (
						<IR
							label='N° Sécurité sociale'
							value={displayCandidate.social_security_number}
						/>
					) : null}
					{displayCandidate?.address ? (
						<IR
							label='Adresse'
							value={displayCandidate.address}
						/>
					) : null}
				</Box>

				{/* Card : Informations contractuelles */}
				<Box style={cardStyle}>
					<SH icon={Calendar} title='Contrat' />
					<IR
						label='Type de contrat'
						value={contract?.contract_type}
					/>
					{contract?.category ? (
						<IR
							label='Classification'
							value={contract.category}
						/>
					) : null}
					{contract?.contract_reason ? (
						<IR
							label='Motif de recrutement'
							value={contract.contract_reason}
						/>
					) : null}
					<IR
						label='Date de début'
						value={formatDateFR(
							contract?.start_date ?? vacations[0]?.date,
						)}
					/>
					{contract?.end_date ? (
						<IR
							label='Date de fin'
							value={formatDateFR(contract.end_date)}
						/>
					) : null}
					{contract?.total_hours != null ? (
						<IR
							label='Volume horaire'
							value={`${contract.total_hours}h`}
						/>
					) : null}
					{contract?.trial_period ? (
						<IR
							label="Période d'essai"
							value={contract.trial_period}
						/>
					) : null}
				</Box>

				{/* Card : Lieu de travail */}
				{contract?.work_location || contract?.work_location_name ? (
					<Box style={cardStyle}>
						<SH icon={MapPin} title='Lieu de travail' />
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
												backgroundColor:
													isDark ? Colors.dark.tint : Colors.light.tint,
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
					<SH icon={Banknote} title='Rémunération' />
					{contract?.hourly_rate != null ? (
						<IR
							label='Taux horaire brut'
							value={`${contract.hourly_rate} €/h`}
						/>
					) : null}
					{contract?.overtime_rate != null ? (
						<IR
							label='Taux heures supplémentaires'
							value={`${contract.overtime_rate} €/h`}
						/>
					) : null}
					{contract?.meal_bonus != null ? (
						<IR
							label='Prime de repas'
							value={`${contract.meal_bonus} €`}
						/>
					) : null}
					{contract?.transport_bonus != null ? (
						<IR
							label='Prime de transport'
							value={`${contract.transport_bonus} €`}
						/>
					) : null}
					{contract?.is_night && contract?.night_bonus != null ? (
						<IR
							label='Majoration nuit'
							value={`${contract.night_bonus} €`}
						/>
					) : null}
					{contract?.is_sunday && contract?.sunday_bonus != null ? (
						<IR
							label='Majoration dimanche'
							value={`${contract.sunday_bonus} €`}
						/>
					) : null}
					{contract?.is_holiday && contract?.holiday_bonus != null ? (
						<IR
							label='Majoration jour férié'
							value={`${contract.holiday_bonus} €`}
						/>
					) : null}
				</Box>

				{/* Card : Planning */}
				{scheduleKnown ? (
					<Box style={cardStyle}>
						<SH icon={Clock} title='Planning' />
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
						<SH icon={FileText} title='Clauses & Équipement' />
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
											color: isDark ? Colors.dark.success : Colors.light.success,
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
					<SH icon={FileText} title='Mentions légales' />
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
					<SH icon={Signature} title='Signatures' />
					<SignatureRow
						label='Candidat'
						name={`${displayCandidate?.firstname || ""} ${displayCandidate?.lastname || ""}`.trim()}
						signed={isSigned}
						{...colorProps}
						{...sigColors}
					/>
					<SignatureRow
						label='Entreprise'
						name={displayCompany?.name}
						signed={isProSigned}
						noBorder
						{...colorProps}
						{...sigColors}
					/>
				</Box>

				{/* Action : Modifier le contrat (pro uniquement, pas encore signé des deux côtés) */}
				{role === "pro" && !isSigned && !isProSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						<TouchableOpacity
							onPress={() =>
								router.push({
									pathname: "/contractgeneration",
									params: { application_id: apply_id },
								})
							}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
								borderWidth: 1,
								borderColor: cardBorder,
								backgroundColor: cardBg,
								borderRadius: 10,
								height: 48,
							}}>
							<Icon
								as={Pen}
								size='sm'
								style={{ color: textPrimary }}
							/>
							<Text style={{ color: textPrimary, fontSize: 15 }}>
								{contract?.status === "draft"
									? "Modifier ou finaliser le contrat"
									: "Modifier le contrat"}
							</Text>
						</TouchableOpacity>
					</Box>
				) : null}

				{/* Action : Candidat — signer */}
				{role === "candidat" && !isSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						{!candidate?.signature_url ? (
							<TouchableOpacity
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "profiles" },
									})
								}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									backgroundColor: cardBg,
									borderRadius: 10,
									height: 48,
								}}>
								<Text
									style={{
										color: isDark
											? Colors.dark.tint
											: Colors.light.tint,
										fontSize: 15,
									}}>
									Enregistrer une signature
								</Text>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								onPress={() => setShowSignModal(true)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									gap: 8,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.success
										: Colors.light.success,
									backgroundColor: cardBg,
									borderRadius: 10,
									height: 48,
								}}>
								<Icon
									as={Signature}
									size='sm'
									style={{
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
									}}
								/>
								<Text
									style={{
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
										fontSize: 15,
									}}>
									Signer le contrat
								</Text>
							</TouchableOpacity>
						)}
					</Box>
				) : null}

				{/* Action : Pro — signer */}
				{role === "pro" && isSigned && !isProSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						{!company?.signature_url || !company?.stamp_url ? (
							<TouchableOpacity
								onPress={() =>
									router.push({
										pathname: "/signature",
										params: { type: "companies" },
									})
								}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									backgroundColor: cardBg,
									borderRadius: 10,
									height: 48,
								}}>
								<Text
									style={{
										color: isDark
											? Colors.dark.tint
											: Colors.light.tint,
										fontSize: 15,
									}}>
									Enregistrer signature et tampon
								</Text>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								onPress={() => setShowSignModal(true)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									gap: 8,
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.success
										: Colors.light.success,
									backgroundColor: cardBg,
									borderRadius: 10,
									height: 48,
								}}>
								<Icon
									as={Signature}
									size='sm'
									style={{
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
									}}
								/>
								<Text
									style={{
										color: isDark
											? Colors.dark.success
											: Colors.light.success,
										fontSize: 15,
									}}>
									Signer et tamponner le contrat
								</Text>
							</TouchableOpacity>
						)}
					</Box>
				) : null}

				{/* Action : Télécharger PDF */}
				{isSigned && isProSigned ? (
					<Box style={{ marginTop: 4, marginBottom: 8 }}>
						<TouchableOpacity
							onPress={handleDownloadAndUploadPdf}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
								borderWidth: 1,
								borderColor: cardBorder,
								backgroundColor: cardBg,
								borderRadius: 10,
								height: 48,
							}}>
							<Icon
								as={Download}
								size='sm'
								style={{ color: textPrimary }}
							/>
							<Text
								style={{
									color: textPrimary,
									fontSize: 15,
								}}>
								Télécharger le contrat en PDF
							</Text>
						</TouchableOpacity>
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
						backgroundColor: cardBg,
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
											color: isDark ? Colors.dark.danger : Colors.light.danger,
											fontSize: 13,
										}}>
										{error}
									</Text>
								) : null}
								{canResend ? (
									<TouchableOpacity
										onPress={() => {
											if (role === "pro") {
												sendContractOtp(
													user.email,
													company.name,
													company.name,
													contractId,
													"pro",
													job.title,
													`${candidate.firstname} ${candidate.lastname}`,
												);
											} else {
												sendContractOtp(
													candidate.email,
													candidate.firstname,
													company.name,
													contractId,
													"candidat",
													job.title,
												);
											}
										}}
										style={{
											marginTop: 8,
											alignSelf: "center",
										}}>
										<Text
											style={{
												color: isDark
													? Colors.dark.tint
													: Colors.light.tint,
												fontSize: 14,
											}}>
											Renvoyer le code
										</Text>
									</TouchableOpacity>
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
							<TouchableOpacity
								onPress={async () => {
									try {
										if (role === "pro") {
											await sendContractOtp(
												user.email,
												company.name,
												company.name,
												contractId,
												"pro",
												job.title,
												`${candidate.firstname} ${candidate.lastname}`,
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
												<CustomToast
													id={id}
													icon={AlertCircle}
													color={
														isDark
															? Colors.dark.danger
															: Colors.light
																	.danger
													}
													title="Erreur lors de l'envoi du code"
												/>
											),
										});
									}
								}}
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									borderWidth: 1,
									borderColor: isDark
										? Colors.dark.tint
										: Colors.light.tint,
									backgroundColor: cardBg,
									borderRadius: 10,
									height: 44,
									marginTop: 16,
								}}>
								<Text
									style={{
										color: isDark
											? Colors.dark.tint
											: Colors.light.tint,
									}}>
									Envoyer le code par email
								</Text>
							</TouchableOpacity>
						) : null}
					</ModalBody>
					<ModalFooter style={{ gap: 10 }}>
						<TouchableOpacity
							onPress={() => setShowSignModal(false)}
							style={{
								flex: 1,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								borderWidth: 1,
								borderColor: cardBorder,
								backgroundColor: cardBg,
								borderRadius: 10,
								height: 44,
							}}>
							<Text style={{ color: textSecondary }}>
								Annuler
							</Text>
						</TouchableOpacity>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
};

export default ContractScreen;
