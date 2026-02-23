/**
 * Formate le salaire à partir d'un objet contenant les champs salary_type et les montants.
 * Compatible avec un objet job complet ou un objet { salary_type, salary_hourly, ... }.
 */
export function formatSalary(data) {
	if (!data) return "Non spécifié";
	const {
		salary_type,
		salary_hourly,
		salary_monthly_fixed,
		salary_annual_fixed,
		salary_monthly_min,
		salary_monthly_max,
		salary_annual_min,
		salary_annual_max,
	} = data;
	if (!salary_type) return "Non spécifié";

	switch (salary_type) {
		case "selon_profil":
			return "Selon profil";
		case "hourly":
			return salary_hourly ? `${salary_hourly}€/h` : "Non spécifié";
		case "monthly_fixed":
			return salary_monthly_fixed
				? `${salary_monthly_fixed}€/mois`
				: "Non spécifié";
		case "annual_fixed":
			return salary_annual_fixed
				? `${salary_annual_fixed}€/an`
				: "Non spécifié";
		case "monthly_range":
			return salary_monthly_min && salary_monthly_max
				? `${salary_monthly_min}€ - ${salary_monthly_max}€/mois`
				: "Non spécifié";
		case "annual_range":
			return salary_annual_min && salary_annual_max
				? `${salary_annual_min}€ - ${salary_annual_max}€/an`
				: "Non spécifié";
		default:
			return "Non spécifié";
	}
}
