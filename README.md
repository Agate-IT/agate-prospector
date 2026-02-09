# 🎯 AGATE Prospector

Extension Chrome pour automatiser la prospection commerciale B2B sur LinkedIn avec intégration CRM complète.

## 🚀 Fonctionnalités

### 📊 Capture automatique LinkedIn
- ✅ Extraction complète des profils (nom, poste, entreprise, secteur)
- ✅ Détection automatique de 32+ secteurs d'activité
- ✅ Parsing intelligent des compétences et tags techniques
- ✅ Enrichissement via Lusha API (email + téléphone)

### 🎯 CRM Notion intégré
- ✅ Création/mise à jour automatique de fiches prospects
- ✅ Détection de doublons (email, nom+entreprise)
- ✅ Historique complet des actions (TODO/DONE)
- ✅ Statuts personnalisés (À contacter, Mail envoyé, R1/R2/R3...)
- ✅ Pipeline de vente avec statistiques
- ✅ **Scoring automatique des prospects** (0-100) basé sur :
  - Secteur cible (+20pts)
  - Poste décisionnaire (+25pts)
  - Tags technos (+20pts max)
  - Activité récente (+10pts)
  - Coordonnées disponibles (+10pts)

### 🤖 IA & Automatisation
- ✅ Génération de pitchs commerciaux personnalisés (OpenAI GPT-4o-mini)
- ✅ Templates d'emails multi-secteurs (Data/IA, Dev, Cloud, Cyber, Product)
- ✅ Détection automatique du meilleur template selon les tags
- ✅ Relances automatiques (R1, R2, R3) avec délais intelligents
- ✅ Actions suivantes suggérées automatiquement

### 📧 Intégration Outlook
- ✅ Envoi d'emails directement depuis l'extension
- ✅ Création de brouillons
- ✅ Consultation de l'historique des échanges
- ✅ Authentification Microsoft Graph API

### 🔗 Synchronisation BoondManager
- ✅ Push automatique des prospects vers l'ATS
- ✅ Gestion des sociétés (création/recherche)
- ✅ Détection de doublons avant création
- ✅ Utilise les mêmes credentials que cvtheque-esn

---

## 📦 Installation

### 1. Cloner le repository

\`\`\`bash
git clone https://github.com/Agate-IT/agate-prospector.git
cd agate-prospector
\`\`\`

### 2. Charger l'extension dans Chrome

1. Ouvrir Chrome et aller dans `chrome://extensions/`
2. Activer le **Mode développeur** (en haut à droite)
3. Cliquer sur **"Charger l'extension non empaquetée"**
4. Sélectionner le dossier `agate-prospector`

✅ L'extension est maintenant installée !

---

## ⚙️ Configuration

### 🔑 Credentials requis

L'extension nécessite plusieurs APIs externes. Configurez-les via l'icône de l'extension (popup).

#### 1. **Notion API**

Créer une intégration Notion :
1. Aller sur https://www.notion.so/my-integrations
2. Créer une nouvelle intégration
3. Copier le **Internal Integration Token**
4. Créer une base de données Notion pour les prospects
5. Copier l'**ID de la base** depuis l'URL

**Configuration dans l'extension :**
- Notion Token : `secret_...`
- Database ID : `12345abcdef...`

#### 2. **BoondManager API**

**Utiliser les mêmes credentials que cvtheque-esn :**

\`\`\`
Instance : ui (ou agate-it si instance custom)
User Token : 382e61676174652d6974
Client Token : 61676174652d6974
Client Key : 8e1beea0bdd041830da8
\`\`\`

**Comment configurer :**
1. Cliquer sur l'icône de l'extension
2. Aller dans l'onglet **"Paramètres"** (Settings)
3. Section **"BoondManager"**
4. Coller les credentials ci-dessus

#### 3. **Lusha API** (enrichissement contacts)

1. Créer un compte sur https://www.lusha.com
2. Générer une API Key
3. La configurer dans l'extension

#### 4. **OpenAI API** (génération de pitchs)

1. Créer une clé API sur https://platform.openai.com/api-keys
2. La configurer dans l'extension

#### 5. **Microsoft Graph API** (Outlook)

1. Créer une application Azure AD
2. Configurer les permissions Outlook
3. Copier le Client ID

---

## 📖 Utilisation

### 🎯 Capture d'un prospect LinkedIn

1. **Ouvrir un profil LinkedIn**
2. **Appuyer sur `Ctrl+Shift+A`** (Windows) ou `Cmd+Shift+A` (Mac)
3. Le panneau latéral s'ouvre avec les données pré-remplies
4. **Vérifier/modifier** les informations
5. **Enrichir** via Lusha (bouton "Enrichir")
6. **Sauvegarder** dans Notion

### 📧 Envoyer un email de prospection

1. Après capture du prospect
2. Cliquer sur **"Mail"** dans les actions rapides
3. Un template est automatiquement suggéré selon les tags
4. **Personnaliser** le pitch (ou utiliser l'IA pour générer un nouveau pitch)
5. **Envoyer** via Outlook

### 🔄 Gérer les relances

1. Après envoi d'un mail initial
2. L'extension suggère automatiquement **R1 dans 3 jours**
3. Cliquer sur **"R1"** pour créer la relance
4. Puis **R2** après 7 jours, **R3** après 7 jours supplémentaires

### 📊 Scoring automatique

Chaque prospect reçoit un score de 0 à 100 :
- 🔴 **Hot (70-100)** : Priorité maximale
- 🟡 **Warm (40-69)** : À suivre
- ⚪ **Cold (0-39)** : Bas de pipeline

Le score prend en compte :
- Secteur (Retail, E-commerce, Télécoms = +20pts)
- Poste (DSI, CTO, VP = +25pts)
- Tags technos (+3pts chacun, max 20pts)
- Activité récente (+10pts)
- Email/téléphone disponibles (+10pts)

---

## 🏗️ Architecture technique

\`\`\`
agate-prospector/
├── manifest.json          # Config Chrome Extension (v1.7.0)
├── background.js          # Service Worker (orchestration)
├── content.js             # Injection LinkedIn (capture)
├── sidepanel.html/js/css  # Interface principale
├── popup.html/js/css      # Popup configuration
├── boond-api.js           # Intégration BoondManager
├── outlook-api.js         # Intégration Microsoft Graph
├── shared-config.js       # Configuration partagée
└── icons/                 # Assets
\`\`\`

### 🔐 Sécurité des credentials

**Tous les tokens sont stockés dans `chrome.storage.local` (chiffré).**

Aucun credential n'est hardcodé dans le code. Les valeurs sont récupérées dynamiquement :

\`\`\`javascript
const stored = await chrome.storage.local.get([
  'boondUserToken',
  'boondClientToken',
  'boondClientKey'
]);
\`\`\`

---

## 🔄 Workflow complet

\`\`\`
1. Visite profil LinkedIn
   ↓
2. Capture automatique (nom, poste, entreprise, secteur)
   ↓
3. Enrichissement Lusha (email + téléphone)
   ↓
4. Détection doublon dans Notion
   ↓
5. Création/mise à jour fiche prospect
   ↓
6. Scoring automatique (0-100)
   ↓
7. Génération pitch IA (OpenAI)
   ↓
8. Envoi email via Outlook
   ↓
9. Suivi relances (R1, R2, R3)
   ↓
10. Synchronisation BoondManager
\`\`\`

---

## 🎨 Templates d'emails

L'extension inclut 5 templates pré-configurés :

| Template | Secteur | Tags clés |
|----------|---------|-----------|
| 🤖 **IA / Data Science** | Data LAB, AI Factory | ML, LLM, RAG, Python, Databricks |
| 💻 **Développement** | Tech, Startups | Java, React, Node.js, TypeScript |
| ☁️ **Cloud / DevOps** | Infrastructure | AWS, Azure, Kubernetes, Terraform |
| 🔒 **Cybersécurité** | SOC, SIEM | Pentest, Security, Cyber |
| 📊 **Product / PM** | Product Teams | PO, Scrum, Agile, UX/UI |

La détection du meilleur template se fait automatiquement selon les tags du prospect.

---

## 🛠️ Développement

### Modifier le code

1. Faire vos modifications dans les fichiers sources
2. Aller sur `chrome://extensions/`
3. Cliquer sur l'icône **🔄 Recharger** de l'extension
4. Tester les changements

### Logs de debug

Ouvrir la console Chrome :
- **Background script** : cliquer sur "Service Worker" dans `chrome://extensions/`
- **Content script** : Console de la page LinkedIn (F12)
- **Sidepanel** : Clic droit sur le panneau → Inspecter

---

## 📊 Intégration avec l'écosystème AGATE IT

| Système | Usage |
|---------|-------|
| **cvtheque-esn** | Mêmes credentials BoondManager |
| **OpenAI** | GPT-4o-mini pour pitchs IA |
| **Notion** | CRM prospects commerciaux |
| **BoondManager** | Sync ATS (candidats + prospects) |

---

## 🤝 Support

Pour toute question ou problème :

1. Vérifier que tous les credentials sont bien configurés
2. Consulter les logs de debug (console)
3. Contacter l'équipe technique AGATE IT

---

## 📝 Changelog

### v1.7.0 (2026-02-09)
- ✅ Scoring automatique des prospects
- ✅ Détection automatique du meilleur template email
- ✅ Intégration BoondManager complète
- ✅ Génération de pitchs IA (OpenAI)
- ✅ Système de relances intelligent (R1/R2/R3)

---

**Développé avec ❤️ par AGATE IT**
