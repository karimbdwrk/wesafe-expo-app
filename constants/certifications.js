export const CERTIFICATIONS = {
	sst: {
		acronym: "SST",
		name: "Sauveteur Secouriste du Travail",
		category: "secourisme",
		validity_years: 2,
	},

	ho_bo: {
		acronym: "H0B0",
		name: "Habilitation électrique non électricien",
		category: "habilitation",
		validity_years: 3,
	},

	palpation: {
		acronym: "PALP",
		name: "Formation palpation de sécurité",
		category: "evenementiel",
		validity_years: null,
	},

	formation_tir: {
		acronym: "TIR",
		name: "Formation au tir",
		category: "protection_rapprochee",
		validity_years: null,
	},

	secourisme_tactique: {
		acronym: "TACTICAL MED",
		name: "Secourisme tactique",
		category: "protection_rapprochee",
		validity_years: null,
	},

	formation_aeroportuaire: {
		acronym: "AERO",
		name: "Formation sûreté aéroportuaire",
		category: "surete_aeroportuaire",
		validity_years: null,
	},

	recyclage_ssiap: {
		acronym: "RECY SSIAP",
		name: "Recyclage SSIAP",
		category: "securite_incendie",
		validity_years: 3,
	},

	habilitation_chien: {
		acronym: "CHIEN",
		name: "Habilitation conducteur cynophile",
		category: "cynophile",
		validity_years: null,
	},
};

export function getCertificationLabel(cert) {
	if (!cert) return "";
	const found = Object.values(CERTIFICATIONS).find(
		(item) =>
			item.acronym === cert ||
			item.name === cert ||
			item.category === cert,
	);
	return found ? `${found.acronym} - ${found.name}` : cert;
}
