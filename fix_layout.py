#!/usr/bin/env python3

# Read the file
with open('app/_layout.jsx', 'r') as f:
    content = f.read()

# Replace headerBackTitle: "" with headerBackTitle: "Retour"
content = content.replace('headerBackTitle: "",', 'headerBackTitle: "Retour",')
content = content.replace('headerBackTitle: "" }}', 'headerBackTitle: "Retour" }}')

# For the application screen specifically, remove headerBackTitle
content = content.replace(
    "name='application'\n\t\t\t\t\t\t\toptions={{ headerShown: true, headerBackTitle: \"\" }}",
    "name='application'\n\t\t\t\t\t\t\toptions={{ headerShown: true }}"
)

# Write back
with open('app/_layout.jsx', 'w') as f:
    f.write(content)

print("✅ File fixed!")
