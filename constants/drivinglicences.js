export const DRIVING_LICENSES = {
	a: {
		acronym: "A",
		name: "Permis moto",
		category: "moto",
	},

	b: {
		acronym: "B",
		name: "Permis voiture",
		category: "vehicule_leger",
	},

	c: {
		acronym: "C",
		name: "Permis poids lourd",
		category: "poids_lourd",
	},

	d: {
		acronym: "D",
		name: "Permis transport de personnes",
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
