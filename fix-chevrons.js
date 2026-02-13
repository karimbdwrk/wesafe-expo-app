const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "app", "account.jsx");
let content = fs.readFileSync(filePath, "utf8");

// Remplacer tous les chevrons lg par xl
content = content.replace(
	/as={ChevronRight}\n(\s+)size='lg'/g,
	"as={ChevronRight}\n$1size='xl'",
);

// Remplacer les couleurs des chevrons
content = content.replace(
	/(as={ChevronRight}\n\s+size='xl'\n\s+style={{\n\s+color: isDark\n\s+\? )("#9ca3af")(\n\s+: )("#6b7280")/g,
	'$1"#d1d5db"$3"#9ca3af"',
);

fs.writeFileSync(filePath, content, "utf8");
console.log("✅ Tous les chevrons ont été mis à jour !");
