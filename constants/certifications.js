export const CERTIFICATIONS = {
	sst: {
		acronym: "SST",
		name: "Sauveteur Secouriste du Travail",
		category: "secourisme",
	},

	ho_bo: {
		acronym: "H0B0",
		name: "Habilitation électrique non électricien",
		category: "habilitation",
	},

	palpation: {
		acronym: "PALP",
		name: "Formation palpation de sécurité",
		category: "evenementiel",
	},

	formation_tir: {
		acronym: "TIR",
		name: "Formation au tir",
		category: "protection_rapprochee",
	},

	secourisme_tactique: {
		acronym: "TACTICAL MED",
		name: "Secourisme tactique",
		category: "protection_rapprochee",
	},

	formation_aeroportuaire: {
		acronym: "AERO",
		name: "Formation sûreté aéroportuaire",
		category: "surete_aeroportuaire",
	},

	recyclage_ssiap: {
		acronym: "RECY SSIAP",
		name: "Recyclage SSIAP",
		category: "securite_incendie",
	},

	habilitation_chien: {
		acronym: "CHIEN",
		name: "Habilitation conducteur cynophile",
		category: "cynophile",
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
