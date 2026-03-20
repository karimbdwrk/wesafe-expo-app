export const CNAPS_CARDS = {
	surveillance_humaine: {
		acronym: "SURV",
		name: "Surveillance humaine ou gardiennage",
		category: "cnaps",
	},

	videoprotection: {
		acronym: "VIDEO",
		name: "Surveillance par systèmes électroniques de sécurité",
		category: "cnaps",
	},

	cynophile: {
		acronym: "CYN",
		name: "Surveillance humaine avec chien",
		category: "cnaps",
	},

	protection_rapprochee: {
		acronym: "APR",
		name: "Protection physique des personnes",
		category: "cnaps",
	},

	transport_fonds: {
		acronym: "TF",
		name: "Transport de fonds",
		category: "cnaps",
	},

	recherches_privees: {
		acronym: "ARP",
		name: "Recherches privées",
		category: "cnaps",
	},
};

export function getCnapsCardLabel(card) {
	if (!card) return "";
	const found = Object.values(CNAPS_CARDS).find(
		(item) =>
			item.acronym === card ||
			item.name === card ||
			item.category === card,
	);
	return found ? `${found.acronym} - ${found.name}` : card;
}
