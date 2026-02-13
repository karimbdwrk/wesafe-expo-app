#!/bin/bash

# Remplacer size='lg' par size='xl' pour tous les chevrons
sed -i '' "/as={ChevronRight}/{n;s/size='lg'/size='xl'/;}" app/account.jsx

# Remplacer #9ca3af par #d1d5db (après ChevronRight)
sed -i '' "/as={ChevronRight}/,+5 s/#9ca3af/#d1d5db/g" app/account.jsx

# Remplacer #6b7280 par #9ca3af (après ChevronRight) 
sed -i '' "/as={ChevronRight}/,+5 s/#6b7280/#9ca3af/g" app/account.jsx

echo "✅ Tous les chevrons ont été mis à jour!"
