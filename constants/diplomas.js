export const DIPLOMAS = {
	tfp_aps: {
		acronym: "TFP APS",
		name: "Titre à Finalité Professionnelle Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
		validity_years: null,
	},

	tfp_asc: {
		acronym: "TFP ASC",
		name: "Titre Agent de Sécurité Cynophile",
		category: "cynophile",
		validity_years: null,
	},

	tfp_apr: {
		acronym: "TFP APR",
		name: "Titre Agent de Protection Rapprochée",
		category: "protection_rapprochee",
		validity_years: null,
	},

	tfp_video: {
		acronym: "TFP OVS",
		name: "Titre Opérateur en Vidéoprotection",
		category: "videoprotection",
		validity_years: null,
	},

	tfp_ats: {
		acronym: "TFP ATS",
		name: "Titre Agent de Télésurveillance",
		category: "videoprotection",
		validity_years: null,
	},

	ssiap_1: {
		acronym: "SSIAP 1",
		name: "Agent de Sécurité Incendie",
		category: "securite_incendie",
		validity_years: 3,
	},

	ssiap_2: {
		acronym: "SSIAP 2",
		name: "Chef d'Équipe de Sécurité Incendie",
		category: "securite_incendie",
		validity_years: 3,
	},

	ssiap_3: {
		acronym: "SSIAP 3",
		name: "Chef de Service de Sécurité Incendie",
		category: "securite_incendie",
		validity_years: 3,
	},

	cap_apsh: {
		acronym: "CAP APS",
		name: "CAP Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
		validity_years: null,
	},

	bac_pro_securite: {
		acronym: "BAC PRO SÉCURITÉ",
		name: "Bac Pro Métiers de la Sécurité",
		category: "surveillance_humaine",
		validity_years: null,
	},
};

export function getDiplomaLabel(dip) {
	if (!dip) return "";
	const found = Object.values(DIPLOMAS).find(
		(item) =>
			item.acronym === dip || item.name === dip || item.category === dip,
	);
	return found ? `${found.acronym} - ${found.name}` : dip;
}
