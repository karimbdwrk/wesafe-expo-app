export const CATEGORY = [
	{
		id: "aps",
		acronym: "APS",
		name: "Agent de Prévention et de Sécurité",
		category: "surveillance_humaine",
	},
	{
		id: "ads",
		acronym: "ADS",
		name: "Agent De Sécurité",
		category: "surveillance_humaine",
	},
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
	{
		id: "asc",
		acronym: "ASC",
		name: "Agent de Sécurité Cynophile",
		category: "cynophile",
	},
	{
		id: "apr",
		acronym: "APR",
		name: "Agent de Protection Rapprochée",
		category: "protection_rapprochee",
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
