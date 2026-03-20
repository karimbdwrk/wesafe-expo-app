export const DRIVING_LICENSES = {
	a: {
		acronym: "A",
		name: "Permis moto toutes cylindrées",
		category: "moto",
	},

	a1: {
		acronym: "A1",
		name: "Permis moto légère",
		category: "moto",
	},

	a2: {
		acronym: "A2",
		name: "Permis moto intermédiaire",
		category: "moto",
	},

	b: {
		acronym: "B",
		name: "Permis voiture",
		category: "vehicule_leger",
	},

	be: {
		acronym: "BE",
		name: "Permis voiture + remorque",
		category: "vehicule_leger",
	},

	b96: {
		acronym: "B96",
		name: "Extension remorque permis B",
		category: "vehicule_leger",
	},

	c: {
		acronym: "C",
		name: "Permis poids lourd",
		category: "poids_lourd",
	},

	c1: {
		acronym: "C1",
		name: "Permis poids lourd intermédiaire",
		category: "poids_lourd",
	},

	ce: {
		acronym: "CE",
		name: "Permis poids lourd + remorque",
		category: "poids_lourd",
	},

	c1e: {
		acronym: "C1E",
		name: "Permis poids lourd intermédiaire + remorque",
		category: "poids_lourd",
	},

	d: {
		acronym: "D",
		name: "Permis transport de personnes",
		category: "transport_personnes",
	},

	d1: {
		acronym: "D1",
		name: "Permis transport personnes intermédiaire",
		category: "transport_personnes",
	},

	de: {
		acronym: "DE",
		name: "Permis transport personnes + remorque",
		category: "transport_personnes",
	},

	d1e: {
		acronym: "D1E",
		name: "Permis transport personnes intermédiaire + remorque",
		category: "transport_personnes",
	},
};

export function getDrivingLicenseLabel(dl) {
	if (!dl) return "";
	const found = Object.values(DRIVING_LICENSES).find(
		(item) =>
			item.acronym === dl || item.name === dl || item.category === dl,
	);
	return found ? `${found.acronym} - ${found.name}` : dl;
}
