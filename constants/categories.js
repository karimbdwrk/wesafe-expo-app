export const CATEGORY = [
	// SURVEILLANCE HUMAINE
	{
		id: "aps",
		acronym: "APS",
		name: "Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ads",
		acronym: "ADS",
		name: "Agent de Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ads_magasin",
		acronym: "ADS MAG",
		name: "Agent de Sécurité Magasin",
		category: "surveillance_humaine",
	},
	{
		id: "ads_filtrage",
		acronym: "ADS FIL",
		name: "Agent de Filtrage",
		category: "surveillance_humaine",
	},
	{
		id: "ads_ronde",
		acronym: "ADS RONDE",
		name: "Agent de Ronde",
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
		id: "asc",
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
	{
		id: "apr_arme",
		acronym: "APR A",
		name: "Agent de Protection Rapprochée Armé",
		category: "protection_rapprochee",
	},

	// TRANSPORT DE FONDS
	{
		id: "transport_fonds",
		acronym: "TF",
		name: "Agent de Transport de Fonds",
		category: "transport_fonds",
	},
	{
		id: "convoyeur_fonds",
		acronym: "CF",
		name: "Convoyeur de Fonds",
		category: "transport_fonds",
	},

	// SURVEILLANCE TECHNIQUE
	{
		id: "operateur_videosurveillance",
		acronym: "OVS",
		name: "Opérateur Vidéosurveillance",
		category: "videosurveillance",
	},
	{
		id: "operateur_pc",
		acronym: "OPC",
		name: "Opérateur PC Sécurité",
		category: "videosurveillance",
	},
	{
		id: "tele_surveillance",
		acronym: "ATS",
		name: "Agent de Télésurveillance",
		category: "videosurveillance",
	},

	// SÛRETÉ AÉROPORTUAIRE
	{
		id: "agent_surete_aeroportuaire",
		acronym: "ASA",
		name: "Agent de Sûreté Aéroportuaire",
		category: "surete_aeroportuaire",
	},

	// ENCADREMENT
	{
		id: "chef_equipe_securite",
		acronym: "CES",
		name: "Chef d'Équipe Sécurité",
		category: "encadrement",
	},
	{
		id: "chef_site",
		acronym: "CS",
		name: "Chef de Site",
		category: "encadrement",
	},
	{
		id: "responsable_securite",
		acronym: "RS",
		name: "Responsable Sécurité",
		category: "encadrement",
	},
	{
		id: "directeur_securite",
		acronym: "DS",
		name: "Directeur Sécurité",
		category: "encadrement",
	},

	// SPÉCIALISATIONS
	{
		id: "agent_palpage",
		acronym: "AP",
		name: "Agent de Palpation",
		category: "specialisation",
	},
	{
		id: "agent_inspection_filtrage",
		acronym: "AIF",
		name: "Agent Inspection Filtrage",
		category: "specialisation",
	},
	{
		id: "agent_intervention",
		acronym: "AI",
		name: "Agent d'Intervention",
		category: "specialisation",
	},
	{
		id: "agent_mobile",
		acronym: "AM",
		name: "Agent Mobile",
		category: "specialisation",
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
