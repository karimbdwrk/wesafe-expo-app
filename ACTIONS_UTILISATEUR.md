# WeSafe — Inventaire exhaustif des actions utilisateur

> Généré automatiquement par analyse statique de tous les écrans `app/`.  
> Rôles : **candidat** · **pro** · **both** (partagé / non-authentifié)

---

## BOTH — Actions partagées ou non-authentifiées

### Écran d'accueil / Landing

| Écran                         | Action interactive           | Description            |
| ----------------------------- | ---------------------------- | ---------------------- |
| `index.jsx` / `connexion.jsx` | Bouton **"Se connecter"**    | Navigue vers `/signin` |
| `index.jsx` / `connexion.jsx` | Bouton **"Créer un compte"** | Navigue vers `/signup` |

### Authentification (`signin.jsx`)

| Action                                                               | Description                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------- |
| Bouton **"Retour"** (ChevronLeft)                                    | `router.back()`                                       |
| Input **Adresse email**                                              | Saisie du champ email                                 |
| Input **Mot de passe**                                               | Saisie du mot de passe                                |
| Toggle **Afficher / Masquer le mot de passe** (EyeIcon / EyeOffIcon) | Alterne la visibilité du mot de passe                 |
| TouchableOpacity **"Mot de passe oublié"**                           | Envoie un email de réinitialisation via Edge Function |
| Bouton **"Se connecter"**                                            | Valide les identifiants et connecte (`signIn()`)      |
| Link **"Pas encore inscrit ? Créer un compte"**                      | Navigue vers `/signup`                                |

### Inscription (`signup.jsx`)

| Étape | Action                                           | Description                                                  |
| ----- | ------------------------------------------------ | ------------------------------------------------------------ |
| 1     | Bouton **"Retour"**                              | `router.back()`                                              |
| 1     | Input **Adresse email**                          | Saisie                                                       |
| 1     | Bouton **"Suivant"**                             | Vérifie la disponibilité de l'email → envoie un OTP si libre |
| 1     | Input OTP 6 chiffres (dans modal)                | `OTPForm` — saisie du code reçu                              |
| 1     | Bouton **"Renvoyer le code"** (cooldown 30 s)    | Régénère un nouveau code OTP (`generateOTP()`)               |
| 1     | Bouton **Fermer** (icône ×, modal OTP)           | Ferme la modal OTP                                           |
| 2     | Link **"Modifier l'email"**                      | Retourne à l'étape 1 (`setStep(1)`)                          |
| 2     | Input **Mot de passe** + toggle afficher/masquer | Saisie et visibilité                                         |
| 2     | Input **Confirmer le mot de passe** + toggle     | Confirmation du mot de passe                                 |
| 2     | Checkbox **"Je suis candidat"**                  | Sélectionne le rôle candidat                                 |
| 2     | Checkbox **"Je suis une entreprise"**            | Sélectionne le rôle entreprise                               |
| 2     | Checkbox **Accepter les CGU** (avec lien)        | Acceptation des conditions générales                         |
| 2     | Bouton **"Créer mon compte"**                    | Soumet la création du compte (`handleLogup()`)               |

### Navigation globale — Barre de navigation (`tabs/_layout.jsx`)

| Action                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| Icône **Cloche** (header)     | Navigue vers `/notifications` (badge rouge sur non-lus)                 |
| Avatar (header) — candidat    | Navigue vers `/account` (badge de statut si pending/rejected/suspended) |
| Avatar (header) — pro         | Navigue vers `/dashboard` (badge de statut)                             |
| Onglet **Accueil (Tab1)**     | Navigue vers l'écran home selon le rôle                                 |
| Onglets supplémentaires       | Navigation propre au rôle (last-minute, profilelist…)                   |
| Notification push (deep link) | Navigue automatiquement vers l'écran concerné à l'ouverture             |

### Messagerie (`messaging.jsx`)

| Action             | Description                                 |
| ------------------ | ------------------------------------------- |
| Input **message**  | Saisie du texte à envoyer                   |
| Bouton **Envoyer** | Envoie le message (Supabase Realtime)       |
| Scroll / lecture   | Marque les messages comme lus en temps réel |

### Notifications (`notifications.jsx`)

| Action                                | Description                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Bouton **"Tout lire"** (header droit) | Marque toutes les notifications comme lues (`handleMarkAllAsRead()`)                                |
| Appui sur une notification            | `handleNotificationPress()` — navigue vers l'écran concerné (annonce, candidature, support, prodoc) |

### Paramètres (`settings.jsx`)

| Action                                              | Description                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Toggle **Notifications push**                       | Active / désactive les notifications push (sauvegardé en base)                |
| Toggle **Notifications email**                      | Active / désactive les emails de notification                                 |
| Toggle **Mode sombre**                              | Bascule entre thème clair et sombre (`handleThemeToggle()`)                   |
| Item **"Mon profil"**                               | Navigue vers `/updateprofile` (candidat) ou `/updatecompany` (pro)            |
| Item **"FAQ"**                                      | Navigue vers `/faq`                                                           |
| Item **"Nous contacter"**                           | Navigue vers `/contactus`                                                     |
| Bouton **"Déconnexion"**                            | `handleLogout()` → redirige vers `/connexion`                                 |
| Bouton **"Supprimer mon compte"**                   | Ouvre l'AlertDialog de confirmation                                           |
| AlertDialog — Bouton **"Supprimer définitivement"** | Marque le compte supprimé, envoie email, déconnecte (`handleDeleteAccount()`) |
| AlertDialog — Bouton **"Annuler"**                  | Ferme sans action                                                             |

### FAQ (`faq.jsx`)

| Action                | Description                                  |
| --------------------- | -------------------------------------------- |
| Appui sur un item FAQ | Déploie / replie la réponse (`toggleItem()`) |

### Nous contacter (`contactus.jsx`)

| Action                               | Description                             |
| ------------------------------------ | --------------------------------------- |
| Formulaire `ContactForm` (composant) | Saisie et envoi d'un message au support |

### Signature (`signature.jsx`)

| Action                                               | Description                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TouchableOpacity **"Modifier / Créer la signature"** | Ouvre l'Actionsheet de dessin                                                                          |
| Zone de dessin (SignatureCapture)                    | Dessine la signature avec le doigt                                                                     |
| Bouton **"Enregistrer"**                             | Uploade la signature vers Supabase Storage (`signatures` bucket) → met à jour le profil / l'entreprise |
| Bouton **"Fermer"**                                  | Ferme l'Actionsheet sans enregistrer                                                                   |

### Contrat (`contract.jsx`)

| Rôle | Action                                         | Description                                                                            |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| both | Bouton **"Signer le contrat"**                 | Déclenche l'envoi d'un OTP de signature (`sendContractOtp()`)                          |
| both | Input OTP 6 chiffres                           | Auto-soumet à 6 chiffres → `handleConfirm()` → `verifyContractOtp()` → `confirmSign()` |
| both | Bouton **"Renvoyer le code"** (après cooldown) | Renvoie un OTP                                                                         |
| both | Bouton **"Télécharger le contrat"**            | Génère et partage le PDF (`expo-print` / `expo-sharing`)                               |

---

## CANDIDAT

### Finalisation de l'inscription (`finalizeregistration.jsx`)

| Action                                      | Description                   |
| ------------------------------------------- | ----------------------------- |
| TouchableOpacity **"Déconnexion"** (LogOut) | `signOut()`                   |
| Carte **"Je suis un candidat"**             | Navigue vers `/createprofile` |

### Création du profil (`createprofile.jsx`)

| Étape | Action                                 | Description                                                 |
| ----- | -------------------------------------- | ----------------------------------------------------------- |
| —     | Bouton **"Retour"** (entre étapes)     | Revient à l'étape précédente                                |
| 1     | Input **Prénom**                       | Saisie                                                      |
| 1     | Input **Nom**                          | Saisie                                                      |
| 1     | TouchableOpacity **Date de naissance** | Ouvre le date picker                                        |
| 1     | Actionsheet **Sexe** (Homme / Femme)   | Sélection du genre                                          |
| 1     | Bouton **"Suivant"**                   | Valide et passe à l'étape 2                                 |
| 2     | Input **Code postal**                  | Saisie                                                      |
| 2     | Bouton **"Rechercher"**                | Appel API `geo.api.gouv.fr` → affiche la liste des communes |
| 2     | TouchableOpacity **commune** (liste)   | Sélectionne la commune                                      |
| 2     | Bouton **"Suivant"**                   | Passe à l'étape 3                                           |
| 3     | Input **Taille (cm)**                  | Saisie                                                      |
| 3     | Input **Poids (kg)**                   | Saisie                                                      |
| 3     | Input + Bouton **"Ajouter"** — Permis  | Ajoute un permis (tag supprimable avec ×)                   |
| 3     | Input + Bouton **"Ajouter"** — Langues | Ajoute une langue (tag supprimable avec ×)                  |
| 3     | Bouton **"Créer mon profil"**          | Soumet la création du profil (`handleCreateProfile()`)      |

### Tableau de bord candidat (`account.jsx`)

| Action                                       | Description                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Icône **QR code** (header)                   | Ouvre l'Actionsheet QR code personnel (token auto-renouvelé toutes les 30 s avec barre de progression animée) |
| **AvatarUploader**                           | Modifie la photo de profil via caméra ou galerie                                                              |
| ActionCard **"Informations personnelles"**   | Navigue vers `/updateprofile`                                                                                 |
| ActionCard **"Mes documents"**               | Navigue vers `/documents`                                                                                     |
| ActionCard **"Mes cartes professionnelles"** | Navigue vers `/addprocard`                                                                                    |
| ActionCard **"Mes documents pro"**           | Navigue vers `/prodocs`                                                                                       |
| ActionCard **"Mon CV / Expériences"**        | Navigue vers `/curriculumvitae`                                                                               |
| ActionCard **"Ma signature"**                | Navigue vers `/signature`                                                                                     |
| ActionCard **"Mes candidatures"**            | Navigue vers `/applications` (badge sur non-lus)                                                              |
| ActionCard **"Ma liste de souhaits"**        | Navigue vers `/wishlist`                                                                                      |
| ActionCard **"Paramètres"**                  | Navigue vers `/settings`                                                                                      |
| ActionCard **"Support"**                     | Ouvre l'Actionsheet de chat support en temps réel (MessageThread)                                             |
| Bouton **"Déconnexion"**                     | Ouvre l'AlertDialog de confirmation                                                                           |
| AlertDialog — **"Confirmer"**                | Exécute `signOut()`                                                                                           |
| AlertDialog — **"Annuler"**                  | Ferme sans action                                                                                             |

### Accueil / Recherche d'emploi (`tab1.jsx` — mode candidat)

| Action                                    | Description                                           |
| ----------------------------------------- | ----------------------------------------------------- |
| Pull-to-refresh                           | Recharge les données                                  |
| Input **Barre de recherche**              | Recherche d'offres (debounce 500 ms, max 3 résultats) |
| Appui sur un résultat de recherche        | Navigue vers le détail de l'offre                     |
| ActionCard **"Voir les offres"**          | Navigue vers la liste des offres                      |
| ActionCard **"Mes candidatures"** (badge) | Navigue vers `/applications`                          |
| ActionCard **"Ma liste de souhaits"**     | Navigue vers `/wishlist`                              |
| StatCard **Wishlist**                     | Navigue vers `/wishlist`                              |
| StatCard **Candidatures**                 | Navigue vers `/applications`                          |
| JobCard (liste récente)                   | Navigue vers le détail de l'annonce                   |

### Offres d'emploi (`job.jsx`)

| Action                                          | Description                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| TouchableOpacity **Favori / Wishlist** (signet) | Ajoute / retire l'offre de la wishlist + toast de confirmation                  |
| Bouton **"Postuler"**                           | Ouvre la modal de confirmation                                                  |
| Modal — Bouton **"Confirmer"**                  | Crée la candidature + envoie une notification à l'entreprise (`confirmApply()`) |
| Modal — Bouton **"Annuler"**                    | Ferme la modal sans action                                                      |
| Sections **Accordion** (détails d'offre)        | Déploie / replie les sections de détail                                         |

### Offres last-minute (`lastminute.jsx`)

| Action                                                | Description                                    |
| ----------------------------------------------------- | ---------------------------------------------- |
| `JobsList` — JobCard                                  | Navigue vers le détail d'une offre last-minute |
| (Pagination, filtres hérités du composant `JobsList`) | —                                              |

### Mes candidatures (`applications.jsx` / `application.jsx`)

| Action                                | Description                                     |
| ------------------------------------- | ----------------------------------------------- |
| Pull-to-refresh (`applications.jsx`)  | Recharge la liste                               |
| Bouton **"Précédent"** (pagination)   | Page précédente                                 |
| Bouton **"Suivant"** (pagination)     | Page suivante                                   |
| ApplyCard (appui)                     | Navigue vers le détail de la candidature        |
| Icône **Messagerie** (badge non-lus)  | Ouvre l'Actionsheet de messagerie en temps réel |
| Bouton **"Voir / Signer le contrat"** | Navigue vers `/contract`                        |

### Liste de souhaits (`wishlist.jsx`)

| Action                              | Description                       |
| ----------------------------------- | --------------------------------- |
| Pull-to-refresh                     | Recharge la wishlist              |
| Bouton **"Précédent"** (pagination) | Page précédente                   |
| Bouton **"Suivant"** (pagination)   | Page suivante                     |
| WishCard (appui)                    | Navigue vers le détail de l'offre |

### Informations personnelles (`updateprofile.jsx`)

| Action                                   | Description                                     |
| ---------------------------------------- | ----------------------------------------------- |
| Input **Prénom / Nom**                   | Saisie                                          |
| Select **Genre**                         | Sélection dans un dropdown                      |
| TouchableOpacity **Date de naissance**   | Ouvre le date picker                            |
| Input **Code postal**                    | Saisie → recherche automatique de villes        |
| TouchableOpacity **Suggestion de ville** | Sélectionne la commune                          |
| Switch **"Ancien militaire"**            | Active / désactive                              |
| Input **Permis de conduire**             | Saisie                                          |
| Input **Langues**                        | Saisie                                          |
| Input **Taille / Poids**                 | Saisie                                          |
| Input **Téléphone**                      | Saisie + vérification disponibilité (debounce)  |
| Bouton **"Envoyer OTP"**                 | Envoie un code SMS via Twilio                   |
| Input **Code OTP**                       | Saisie du code reçu                             |
| Bouton **"Vérifier"**                    | Valide l'OTP et confirme le numéro              |
| Bouton **"Enregistrer"**                 | Soumet la mise à jour (`handleUpdateProfile()`) |

### Documents d'identité (`documents.jsx` / `iddocumentverification.jsx` / `socialsecuritydocumentverification.jsx`)

| Écran                                    | Action                                      | Description                                                 |
| ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `documents.jsx`                          | Carte **"Document d'identité"**             | Navigue vers `/iddocumentverification`                      |
| `documents.jsx`                          | Carte **"Sécurité sociale"**                | Navigue vers `/socialsecuritydocumentverification`          |
| `iddocumentverification.jsx`             | Bouton **"Passeport"**                      | Sélectionne le type de document                             |
| `iddocumentverification.jsx`             | Bouton **"Carte d'identité"**               | Sélectionne le type de document                             |
| `iddocumentverification.jsx`             | Input **Nationalité** (autocomplete 300 ms) | Recherche via `restcountries.com`                           |
| `iddocumentverification.jsx`             | TouchableOpacity **suggestion nationalité** | Sélectionne et enregistre la nationalité dans le profil     |
| `iddocumentverification.jsx`             | TouchableOpacity **Recto**                  | Choisit l'image recto depuis la galerie                     |
| `iddocumentverification.jsx`             | TouchableOpacity **Verso**                  | Choisit l'image verso depuis la galerie                     |
| `iddocumentverification.jsx`             | TouchableOpacity **Date de validité**       | Ouvre `DateTimePickerModal`                                 |
| `iddocumentverification.jsx`             | Bouton **"Soumettre"**                      | Uploade les images + met à jour le profil Supabase          |
| `socialsecuritydocumentverification.jsx` | Bouton **"Carte Vitale"**                   | Sélectionne le type                                         |
| `socialsecuritydocumentverification.jsx` | Bouton **"Attestation de droits"**          | Sélectionne le type                                         |
| `socialsecuritydocumentverification.jsx` | Input **Numéro de sécurité sociale**        | Saisie (auto-formaté 15 chiffres avec espaces)              |
| `socialsecuritydocumentverification.jsx` | Bouton **"Enregistrer le numéro"**          | Sauvegarde uniquement le numéro (`update("profiles", ...)`) |
| `socialsecuritydocumentverification.jsx` | TouchableOpacity **Upload image**           | Choisit une image depuis la galerie                         |
| `socialsecuritydocumentverification.jsx` | Bouton **"Soumettre"**                      | Uploade l'image + met à jour le profil                      |

### Documents professionnels (`prodocs.jsx`)

| Étape          | Action                                                         | Description                                                       |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| liste          | Bouton **"+ Ajouter un document"**                             | Passe à l'étape de sélection de catégorie                         |
| liste          | TouchableOpacity **"Supprimer"** (sur document existant)       | Confirmation → supprime le document                               |
| catégorie      | TouchableOpacity **"CNAPS"**                                   | Sélectionne la catégorie                                          |
| catégorie      | TouchableOpacity **"Diplôme"**                                 | Sélectionne la catégorie                                          |
| catégorie      | TouchableOpacity **"Certification"**                           | Sélectionne la catégorie                                          |
| type           | TouchableOpacity **type d'activité / diplôme / certification** | Sélectionne le type précis                                        |
| upload (CNAPS) | Input **Numéro de carte CNAPS**                                | Saisie                                                            |
| upload         | Bouton **Date de validité**                                    | Ouvre le date picker modal → `setValidityDate()`                  |
| upload         | Bouton **"Prendre une photo"**                                 | Lance l'appareil photo (`ImagePicker` camera)                     |
| upload         | Bouton **"Choisir depuis la galerie"**                         | Ouvre la galerie (`ImagePicker` library)                          |
| upload         | Bouton **"Choisir un fichier"**                                | Ouvre le `DocumentPicker`                                         |
| upload         | Bouton **"Envoyer"**                                           | Upload Supabase Storage + crée l'enregistrement + notifie l'admin |
| toutes         | Bouton **"Retour"**                                            | Revient à l'étape précédente                                      |

### Cartes professionnelles (`procards.jsx` / `addprocard.jsx` / `procard.jsx`)

| Écran            | Action                                          | Description                                       |
| ---------------- | ----------------------------------------------- | ------------------------------------------------- |
| `procards.jsx`   | Bouton **"Précédent"** (pagination)             | Page précédente                                   |
| `procards.jsx`   | Bouton **"Suivant"** (pagination)               | Page suivante                                     |
| `addprocard.jsx` | Carte **"Carte Professionnelle"**               | Sélectionne le type → affiche `ProCardForm`       |
| `addprocard.jsx` | Carte **"Diplôme SSIAP"**                       | Sélectionne le type → affiche `SSIAPDiploma`      |
| `addprocard.jsx` | Bouton **"Retour"** (dans le sous-formulaire)   | Réinitialise la sélection de type                 |
| `addprocard.jsx` | `ProCardForm` — soumission                      | Formulaire + upload image → crée la carte pro     |
| `addprocard.jsx` | `SSIAPDiploma` — soumission                     | Formulaire + upload image → crée le diplôme SSIAP |
| `procard.jsx`    | Bouton **"Supprimer la carte professionnelle"** | Supprime la carte (`proCardDelete()`)             |

### CV / Expériences (`curriculumvitae.jsx` / `addexperience.jsx`)

| Action                                | Description                                                             |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Bouton **"+ Ajouter une expérience"** | Affiche le formulaire inline                                            |
| Input **Titre du poste** \*           | Saisie (obligatoire)                                                    |
| Input **Entreprise**                  | Saisie                                                                  |
| Input **Lieu**                        | Saisie                                                                  |
| Textarea **Description**              | Saisie                                                                  |
| Select **Catégorie** \*               | Sélection obligatoire                                                   |
| DatePicker **Date de début** \*       | Sélection (obligatoire)                                                 |
| DatePicker **Date de fin**            | Sélection (optionnelle)                                                 |
| Bouton **"Enregistrer"**              | Crée ou met à jour l'expérience (`handleSubmit()`)                      |
| Bouton **"Annuler"**                  | Réinitialise le formulaire (`resetForm()`)                              |
| Icône **Crayon** (par expérience)     | Pré-remplit le formulaire avec l'expérience à modifier (`handleEdit()`) |
| Icône **Poubelle** (par expérience)   | Ouvre l'AlertDialog de confirmation de suppression                      |
| AlertDialog — **"Supprimer"**         | Supprime l'expérience (`confirmDelete()`)                               |
| AlertDialog — **"Annuler"**           | Ferme sans supprimer                                                    |
| `addexperience.jsx` — `CreateExpForm` | Même flux que le formulaire inline ci-dessus                            |

### Photo de profil via caméra (`camera.jsx`)

| Action                                             | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- |
| Bouton **"Autoriser l'accès"** (permission caméra) | Demande la permission caméra                       |
| TouchableOpacity **"Annuler"**                     | `router.back()`                                    |
| TouchableOpacity **Retourner caméra** (RotateCcw)  | Bascule caméra avant / arrière (`setFacing()`)     |
| Bouton **"Prendre la photo"** (cercle)             | Capture la photo                                   |
| Bouton **"Confirmer"** (Check)                     | Valide la photo → `ImageContext` → `router.back()` |
| Bouton **"Reprendre"** (RotateCcw)                 | Annule la capture, retour en mode viseur           |

### Mon espace (`monteucon.jsx`)

| Action                           | Description                                                |
| -------------------------------- | ---------------------------------------------------------- |
| **AvatarUploader**               | Modifie la photo de profil (caméra ou galerie)             |
| **FlipCardProfile** (geste flip) | Retourne la carte de profil pour afficher le recto / verso |
| Bouton **"Cartes pro"**          | Navigue vers `/procards`                                   |
| Bouton **"Favoris / Wishlist"**  | Navigue vers `/wishlist`                                   |
| Bouton **"Mon CV"**              | Navigue vers `/curriculumvitae`                            |
| Bouton **"Ma signature"**        | Navigue vers `/signature`                                  |

---

## PRO

### Finalisation de l'inscription (`finalizeregistration.jsx`)

| Action                             | Description                   |
| ---------------------------------- | ----------------------------- |
| TouchableOpacity **"Déconnexion"** | `signOut()`                   |
| Carte **"Je suis une entreprise"** | Navigue vers `/createcompany` |

### Création de l'entreprise (`createcompany.jsx`)

| Étape | Action                                        | Description                                  |
| ----- | --------------------------------------------- | -------------------------------------------- |
| —     | Bouton **"Retour"** (entre étapes)            | Revient à l'étape précédente                 |
| 1     | Input **Nom de l'entreprise**                 | Saisie                                       |
| 1     | Textarea **Description**                      | Saisie                                       |
| 1     | Bouton **"Suivant"**                          | Passe à l'étape 2                            |
| 2     | Input **SIRET** (auto-formaté)                | Saisie du numéro SIRET                       |
| 2     | TouchableOpacity **"Ajouter le KBIS"**        | Ouvre l'Actionsheet d'upload                 |
| 2     | Actionsheet — **"Prendre une photo"**         | Lance la caméra                              |
| 2     | Actionsheet — **"Choisir depuis la galerie"** | Ouvre la galerie                             |
| 2     | Actionsheet — **"Choisir un document"**       | Ouvre le `DocumentPicker`                    |
| 2     | Bouton **"Créer l'entreprise"**               | Soumet la création (`handleCreateCompany()`) |

### Tableau de bord pro (`dashboard.jsx`)

| Action                                                | Description                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| Icône **Scanner** (header)                            | Navigue vers `/scanner`                                       |
| **LogoUploader**                                      | Uploade / modifie le logo de l'entreprise (caméra ou galerie) |
| TouchableOpacity **"Statut d'abonnement"**            | Navigue vers `/subscription`                                  |
| ActionCard **"Mes annonces"**                         | Navigue vers `/offers`                                        |
| ActionCard **"Publier une annonce"**                  | Navigue vers `/addjob`                                        |
| ActionCard **"Candidatures reçues"** (badge compteur) | Navigue vers `/applicationspro`                               |
| ActionCard **"Signature"**                            | Navigue vers `/signature`                                     |
| ActionCard **"Tampon"**                               | Navigue vers `/stamp`                                         |
| ActionCard **"Mon abonnement"**                       | Navigue vers `/subscription`                                  |
| ActionCard **"Crédits Last Minute"**                  | Navigue vers `/buycredits`                                    |
| ActionCard **"Mettre à jour l'entreprise"**           | Navigue vers `/updatecompany`                                 |
| ActionCard **"Vérification KBIS"**                    | Navigue vers `/kbisdocumentverification`                      |
| ActionCard **"Scanner un QR"**                        | Navigue vers `/scanner`                                       |
| ActionCard **"Support"**                              | Ouvre l'Actionsheet du chat support (MessageThread)           |
| ActionCard **"Paramètres"**                           | Navigue vers `/settings`                                      |
| Bouton **"Déconnexion"**                              | Ouvre l'AlertDialog de confirmation                           |
| AlertDialog — **"Confirmer"**                         | Exécute `signOut()`                                           |
| AlertDialog — **"Annuler"**                           | Ferme sans action                                             |

### Accueil pro (`tab1.jsx` — mode pro via `HomePro`)

| Action                                                      | Description                                         |
| ----------------------------------------------------------- | --------------------------------------------------- |
| Pull-to-refresh                                             | Recharge les données                                |
| Boutons **période** (7j / 1m / 6m / 1a / tout)              | Filtre le graphique par période (`setTimePeriod()`) |
| StatCard **totalJobs**                                      | Navigue vers `/offers`                              |
| StatCard **Candidatures / applied / inProgress / rejected** | Navigation vers la liste filtrée                    |
| ActionCard **"Publier une annonce"**                        | Navigue vers `/addjob` ou `/newjob`                 |
| ActionCard **"Mes annonces"**                               | Navigue vers `/offers`                              |
| ActionCard **"Candidatures reçues"** (badge)                | Navigue vers `/applicationspro`                     |
| JobCard (liste récente)                                     | Navigue vers le détail de l'annonce                 |

### Gestion des annonces (`offers.jsx` / `job.jsx` / `addjob.jsx` / `newjob.jsx` / `postjob.jsx`)

| Écran         | Action                                        | Description                                                |
| ------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `offers.jsx`  | Pull-to-refresh                               | Recharge la liste                                          |
| `offers.jsx`  | Bouton **"Précédent"** (pagination)           | Page précédente                                            |
| `offers.jsx`  | Bouton **"Suivant"** (pagination)             | Page suivante                                              |
| `offers.jsx`  | JobCard (appui)                               | Navigue vers le détail de l'annonce                        |
| `job.jsx`     | Bouton **"Archiver l'annonce"**               | Archive l'annonce (`archiveJob()`)                         |
| `addjob.jsx`  | `CreateJobForm3` (composant)                  | Crée une annonce — formulaire multi-étapes (quota affiché) |
| `newjob.jsx`  | `CreateJobForm` (composant)                   | Crée une annonce — quota mensuel restant affiché           |
| `postjob.jsx` | Boutons **Précédent / Suivant**               | Navigation entre les étapes du formulaire                  |
| `postjob.jsx` | Input **Titre**                               | Saisie                                                     |
| `postjob.jsx` | Select **Catégorie**                          | Sélection                                                  |
| `postjob.jsx` | Input **Ville / Code postal**                 | Saisie                                                     |
| `postjob.jsx` | Select **Type de contrat** (CDI / CDD…)       | Sélection                                                  |
| `postjob.jsx` | Select **Temps de travail** (plein / partiel) | Sélection                                                  |
| `postjob.jsx` | Textarea **Description**                      | Saisie                                                     |
| `postjob.jsx` | Switch **"Last Minute"**                      | Active le mode last-minute (consomme des crédits)          |
| `postjob.jsx` | Checkboxes **Diplômes requis**                | Sélection multiple des diplômes nécessaires                |
| `postjob.jsx` | Checkboxes **Permis requis**                  | Sélection multiple des types de permis                     |
| `postjob.jsx` | DatePicker **Date de début**                  | Sélection                                                  |
| `postjob.jsx` | DatePicker **Date de fin**                    | Sélection                                                  |
| `postjob.jsx` | Inputs **Salaire** + Select **type**          | Saisie du salaire et de son mode de calcul                 |
| `postjob.jsx` | Switch **Hébergement**                        | Avantage inclus                                            |
| `postjob.jsx` | Switch **Panier repas**                       | Avantage inclus                                            |
| `postjob.jsx` | Switch **Remboursements**                     | Avantage inclus                                            |
| `postjob.jsx` | Bouton **"Publier l'annonce"**                | Ouvre l'AlertDialog de confirmation → `handleSubmit()`     |
| `postjob.jsx` | Bouton **"Sauvegarder"**                      | Enregistre en tant que brouillon                           |

### Gestion des candidatures pro (`applicationspro.jsx` / `application.jsx`)

| Action                                              | Description                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Pull-to-refresh (`applicationspro.jsx`)             | Recharge la liste                                                    |
| Bouton **"Précédent"** / **"Suivant"** (pagination) | Navigation pages                                                     |
| ApplyCard (appui)                                   | Navigue vers le détail de la candidature                             |
| Icône **Messagerie** (badge non-lus)                | Ouvre l'Actionsheet de messagerie en temps réel                      |
| Bouton **"Sélectionner ce candidat"**               | Ouvre l'AlertDialog de sélection                                     |
| AlertDialog — **"Confirmer la sélection"**          | Statut → `"selected"` + notification au candidat (`confirmSelect()`) |
| AlertDialog — **"Annuler"**                         | Ferme sans action                                                    |
| Bouton **"Refuser la candidature"**                 | Ouvre l'AlertDialog de refus                                         |
| AlertDialog — **"Confirmer le refus"**              | Statut → `"rejected"` (`refuseApplication()`)                        |
| Bouton **"Générer le contrat"**                     | Ouvre le formulaire de génération de contrat                         |
| Formulaire contrat — Input **Taux horaire**         | Saisie                                                               |
| Formulaire contrat — Input **Lieu de mission**      | Saisie                                                               |
| Formulaire contrat — DatePicker **Date de début**   | Sélection                                                            |
| Formulaire contrat — DatePicker **Date de fin**     | Sélection                                                            |
| Formulaire contrat — Bouton **"Générer"**           | Génère le contrat + le joint à la candidature                        |
| Bouton **"Signer le contrat"**                      | Navigue vers `/contract`                                             |

### Liste des profils scannés (`profilelist.jsx`)

| Action                                          | Description                                                   |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Pull-to-refresh                                 | Recharge la liste                                             |
| TouchableHighlight **profil** (item de liste)   | Navigue vers `/profile` (avec `profile_id`)                   |
| Bouton **lettre** (index alphabétique latéral)  | Fait défiler la SectionList jusqu'à la section correspondante |
| Bouton **"Scanner un profil"** (état vide)      | Navigue vers `/scanner`                                       |
| FAB Bouton **"Scanner"** (flottant, bas-droite) | Navigue vers `/scanner`                                       |

### Consultation d'un profil candidat (`profile.jsx`)

| Action                                                      | Description                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Bouton **"Ajouter à ma liste"** / **"Retirer de ma liste"** | Ajoute / retire le candidat de la `profilelist` (`handleToggle()`) |
| Bouton **"Contacter"**                                      | Ouvre l'Actionsheet de contact                                     |
| Actionsheet — **"Appeler"**                                 | Ouvre le numéroteur (`Linking.openURL("tel:...")`)                 |
| Actionsheet — **"SMS"**                                     | Ouvre l'app SMS (`Linking.openURL("sms:...")`)                     |
| Actionsheet — **"WhatsApp"**                                | Ouvre WhatsApp (`Linking.openURL("https://wa.me/...")`)            |
| Actionsheet — **"Email"**                                   | Ouvre le client email (`Linking.openURL("mailto:...")`)            |

### Scanner QR code (`scanner.jsx`)

| Action                                             | Description                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Bouton **"Autoriser l'accès"** (permission caméra) | Demande la permission caméra                                                  |
| TouchableOpacity **"Annuler"**                     | `router.back()`                                                               |
| Détection automatique QR code                      | Appelle l'Edge Function `verify-qr-token` → navigue vers `/profile` si valide |
| AlertDialog — **"OK"** (token invalide)            | Ferme la dialog d'erreur                                                      |
| AlertDialog — **"Rescanner"** (token expiré)       | Relance le scanner                                                            |

### Mise à jour de l'entreprise (`updatecompany.jsx`)

| Action                        | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| Input **Nom de l'entreprise** | Saisie                                          |
| Input **Email**               | Saisie                                          |
| Textarea **Description**      | Saisie                                          |
| Bouton **"Enregistrer"**      | Soumet la mise à jour (`handleUpdateCompany()`) |

### Vérification KBIS (`kbisdocumentverification.jsx`)

| Action                                   | Description                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| Input **SIRET** (formaté)                | Saisie                                                      |
| Bouton **"Enregistrer le SIRET"**        | Sauvegarde uniquement le SIRET (`update("companies", ...)`) |
| Bouton **"Ajouter le KBIS"**             | Ouvre l'Actionsheet d'upload                                |
| Actionsheet — **"Prendre une photo"**    | Lance la caméra                                             |
| Actionsheet — **"Galerie"**              | Ouvre la galerie                                            |
| Actionsheet — **"Document"**             | Ouvre le `DocumentPicker`                                   |
| Bouton **"Soumettre"**                   | Upload KBIS + statut `kbis_verification_status = "pending"` |
| TouchableOpacity **Image KBIS** (aperçu) | Affiche l'image en plein écran                              |
| Link **"Vérifier sur Infogreffe"**       | Ouvre le site Infogreffe (`Linking.openURL()`)              |

### Tampon (`stamp.jsx` / `updatestamp.jsx`)

| Écran             | Action                                        | Description                                                                     |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `stamp.jsx`       | Bouton **"Ajouter / Modifier le tampon"**     | Ouvre l'Actionsheet d'upload                                                    |
| `stamp.jsx`       | Actionsheet — **"Prendre une photo"**         | Caméra → traitement Railway API (`processImageWithRailway()`) → upload Supabase |
| `stamp.jsx`       | Actionsheet — **"Choisir depuis la galerie"** | Galerie → traitement → upload                                                   |
| `stamp.jsx`       | Actionsheet — **"Choisir un fichier"**        | `DocumentPicker` → traitement → upload                                          |
| `updatestamp.jsx` | `StampCaptureUploader` (composant)            | Délègue l'upload complet au composant                                           |

### Abonnement & Crédits (`subscription.jsx` / `buycredits.jsx` / `cancelsubscription.jsx`)

| Écran                    | Action                                              | Description                                                                   |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `subscription.jsx`       | TouchableOpacity **plan tarifaire**                 | Sélectionne un plan d'abonnement                                              |
| `subscription.jsx`       | `SubscriptionPaymentSheet` — Bouton **"S'abonner"** | Initie le paiement Stripe pour le plan sélectionné                            |
| `subscription.jsx`       | Bouton **"Mettre à niveau"**                        | Upgrade vers un plan supérieur via Stripe                                     |
| `subscription.jsx`       | Link **"Résilier"**                                 | Navigue vers `/cancelsubscription`                                            |
| `buycredits.jsx`         | Bouton **"Acheter maintenant"**                     | Paiement Stripe (30 € = 10 crédits Last Minute, Edge Function `credits_pack`) |
| `cancelsubscription.jsx` | Bouton **"Résilier l'abonnement"**                  | Appelle l'Edge Function `cancel-subscription`                                 |

---

_Dernière mise à jour : analysé sur les fichiers `app/` (47 écrans) — aucune modification de code effectuée._
