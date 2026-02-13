#!/usr/bin/env python3
import re

with open('app/account.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer tous les chevrons ChevronRight de size='lg' vers size='xl'
# et changer les couleurs pour les rendre plus visibles
content = re.sub(
    r"(as=\{ChevronRight\})\n(\s+)size='lg'",
    r"\1\n\2size='xl'",
    content
)

# Changer les couleurs des chevrons
content = re.sub(
    r'(as=\{ChevronRight\}[\s\S]{0,100}?)#9ca3af([\s\S]{0,50}?)#6b7280',
    r'\1#d1d5db\2#9ca3af',
    content
)

with open('app/account.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Tous les chevrons ont été mis à jour !")
print("   - Taille: lg → xl")
print("   - Couleurs: #9ca3af → #d1d5db (mode sombre)")
print("   - Couleurs: #6b7280 → #9ca3af (mode clair)")
