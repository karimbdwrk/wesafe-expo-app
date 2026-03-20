export const CATEGORY = [
	// SURVEILLANCE HUMAINE
	{
		id: "aps",
		acronym: "APS",
		name: "Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ads_magasin",
		acronym: "ADS MAG",
		name: "Agent de Sécurité Magasin",
		category: "surveillance_humaine",
	},
	{
		id: "ads_ronde",
		acronym: "ADS RONDE",
		name: "Agent de Ronde",
		category: "surveillance_humaine",
	},
	{
		id: "agent_mobile",
		acronym: "AM",
		name: "Agent Mobile",
		category: "surveillance_humaine",
	},
	{
		id: "agent_evenementiel",
		acronym: "AE",
		name: "Agent de Sécurité Événementiel",
		category: "surveillance_humaine",
	},

	// SÉCURITÉ INCENDIE
	{
		id: "ssiap_1",
		acronym: "SSIAP 1",
		name: "Agent de Sécurité Incendie",
		category: "securite_incendie",
		level: 1,
	},
	{
		id: "ssiap_2",
		acronym: "SSIAP 2",
		name: "Chef d'Équipe de Sécurité Incendie",
		category: "securite_incendie",
		level: 2,
	},
	{
		id: "ssiap_3",
		acronym: "SSIAP 3",
		name: "Chef de Service de Sécurité Incendie",
		category: "securite_incendie",
		level: 3,
	},

	// CYNOPHILE
	{
		id: "cynophile",
		acronym: "ASC",
		name: "Agent de Sécurité Cynophile",
		category: "cynophile",
	},

	// PROTECTION RAPPROCHÉE
	{
		id: "apr",
		acronym: "APR",
		name: "Agent de Protection Rapprochée",
		category: "protection_rapprochee",
	},

	// SURVEILLANCE TECHNIQUE
	{
		id: "operateur_videoprotection",
		acronym: "OVS",
		name: "Opérateur Vidéoprotection",
		category: "videoprotection",
	},
	{
		id: "telesurveillance",
		acronym: "ATS",
		name: "Agent de Télésurveillance",
		category: "videoprotection",
	},

	// SÛRETÉ AÉROPORTUAIRE
	{
		id: "surete_aeroportuaire",
		acronym: "ASA",
		name: "Agent de Sûreté Aéroportuaire",
		category: "surete_aeroportuaire",
	},

	// TRANSPORT DE FONDS
	{
		id: "transport_fonds",
		acronym: "TF",
		name: "Agent de Transport de Fonds",
		category: "transport_fonds",
	},
];

/**
 * Retourne le label formaté "ACRONYM - Nom complet" pour une catégorie.
 * Accepte l'id, l'acronyme ou le nom complet comme paramètre.
 */
export function getCategoryLabel(cat) {
	if (!cat) return "";
	const found = CATEGORY.find(
		(item) => item.id === cat || item.acronym === cat || item.name === cat,
	);
	return found ? `${found.acronym} - ${found.name}` : cat;
}
