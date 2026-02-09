# 📦 Distribution de l'extension AGATE Prospector

## 🎯 Options de distribution

### Option 1 : Chrome Web Store (RECOMMANDÉ)

**✅ Avantages :**
- Installation en 1 clic pour toute l'équipe
- Mises à jour automatiques
- Pas besoin du mode développeur
- Professionnel et sécurisé

**⚠️ Inconvénients :**
- Frais de publication : **5 USD** (paiement unique)
- Validation Google : **24-72h**
- Vérification de l'identité du développeur

#### 📋 Procédure

##### Étape 1 : Préparer l'extension pour publication

1. **Créer un package ZIP**

```bash
cd /Users/agate/Desktop/agate-prospector
zip -r agate-prospector.zip . -x "*.git*" -x "*.DS_Store" -x "README.md" -x "DISTRIBUTION.md" -x "BOONDMANAGER_CONFIG.md"
```

2. **Vérifier le manifest.json**

- ✅ Version : `1.7.0`
- ✅ Nom : `AGATE Prospector`
- ✅ Description claire
- ✅ Icônes (16, 48, 128px)
- ✅ Permissions justifiées

##### Étape 2 : S'inscrire sur Chrome Web Store

1. Aller sur https://chrome.google.com/webstore/devconsole
2. Se connecter avec un compte Google **AGATE IT** (ex: tech@agate-it.fr)
3. Payer les **5 USD** de frais d'inscription (paiement unique, pas de frais annuels)

##### Étape 3 : Publier l'extension

1. Cliquer sur **"New Item"**
2. **Uploader** le fichier `agate-prospector.zip`
3. Remplir les informations :

**Informations de base :**
- **Nom** : AGATE Prospector
- **Description courte** : Extension de prospection B2B LinkedIn avec intégration CRM (Notion + BoondManager)
- **Description détaillée** :
```
AGATE Prospector automatise votre prospection commerciale B2B sur LinkedIn.

FONCTIONNALITÉS :
✅ Capture automatique des profils LinkedIn
✅ Enrichissement via Lusha (email + téléphone)
✅ CRM Notion intégré avec scoring intelligent
✅ Génération de pitchs IA (OpenAI)
✅ Synchronisation BoondManager
✅ Intégration Outlook pour envoi d'emails
✅ Relances automatiques (R1/R2/R3)
✅ Templates multi-secteurs (Data/IA, Dev, Cloud, Cyber, Product)

POUR QUI ?
Équipes commerciales B2B, cabinets de conseil, ESN, recruteurs tech

INTÉGRATIONS :
- Notion (CRM)
- BoondManager (ATS)
- Lusha (enrichissement)
- OpenAI (IA)
- Microsoft Outlook
```

- **Catégorie** : Productivity
- **Langue** : French

**Screenshots :**
- Prendre 3-5 captures d'écran (1280x800px ou 640x400px)
  1. Capture du sidepanel avec un profil LinkedIn
  2. Liste des prospects dans l'interface
  3. Configuration BoondManager
  4. Template d'email

**Icône principale :**
- Utiliser `icons/icon128.png`

**Visibilité :**
- ⚠️ **Public** : Tout le monde peut l'installer
- 🔒 **Unlisted** : Seulement ceux avec le lien (RECOMMANDÉ pour usage interne)
- 🔒 **Private** : Nécessite Google Workspace (voir Option 4)

**Justification des permissions :**
```
- activeTab : Lire les profils LinkedIn visités
- storage : Sauvegarder les configurations API
- scripting : Injecter l'interface sur LinkedIn
- sidePanel : Afficher le panneau latéral
- tabs : Détecter l'URL LinkedIn
- identity : Authentification Microsoft (Outlook)
```

##### Étape 4 : Soumettre pour validation

1. Cliquer sur **"Submit for review"**
2. Attendre **24-72h** pour validation Google
3. Une fois approuvée, l'extension sera disponible

##### Étape 5 : Partager le lien à l'équipe

Une fois publiée, vous recevrez un lien du type :
```
https://chrome.google.com/webstore/detail/agate-prospector/[ID-UNIQUE]
```

**Distribuer à l'équipe :**
- Envoyer le lien par email
- Ajouter sur l'intranet AGATE IT
- Documentation interne

**Installation en 1 clic :**
1. Cliquer sur le lien
2. Cliquer sur "Ajouter à Chrome"
3. ✅ Installé !

---

### Option 2 : Distribution fichier CRX (RAPIDE)

**✅ Avantages :**
- Déploiement immédiat (pas d'attente validation)
- Gratuit
- Installation simple

**⚠️ Inconvénients :**
- Avertissement Chrome "Extension non approuvée"
- Pas de mises à jour automatiques
- Moins professionnel

#### 📋 Procédure

##### Étape 1 : Générer le fichier .crx

1. Ouvrir Chrome : `chrome://extensions/`
2. Activer le **Mode développeur**
3. Charger l'extension
4. Cliquer sur **"Empaqueter l'extension"**
5. Chrome génère 2 fichiers :
   - `agate-prospector.crx` (fichier d'installation)
   - `agate-prospector.pem` (clé privée - **à garder secret !**)

##### Étape 2 : Distribuer le fichier .crx

**Via intranet / serveur interne :**
1. Uploader `agate-prospector.crx` sur un serveur AGATE IT
2. Partager le lien à l'équipe

**Via GitHub Release :**
```bash
cd /Users/agate/Desktop/agate-prospector
gh release create v1.7.0 agate-prospector.crx --title "AGATE Prospector v1.7.0" --notes "Version initiale"
```

##### Étape 3 : Installation par l'équipe

**⚠️ Chrome bloque l'installation directe de .crx depuis Chrome 73+**

**Méthode recommandée :**
1. Télécharger `agate-prospector.crx`
2. Ouvrir `chrome://extensions/`
3. Activer le **Mode développeur**
4. **Glisser-déposer** le fichier `.crx` sur la page
5. Confirmer l'installation

---

### Option 3 : Mode développeur manuel (TEMPORAIRE)

**✅ Avantages :**
- Immédiat
- Gratuit
- Parfait pour tests

**⚠️ Inconvénients :**
- Chaque personne doit installer manuellement
- Mode développeur requis (avertissement Chrome)
- Pas de mises à jour automatiques

#### 📋 Procédure

**Instructions à envoyer à l'équipe :**

```
1. Installer Git (si pas déjà fait)
2. Cloner le repository :
   git clone https://github.com/Agate-IT/agate-prospector.git

3. Ouvrir Chrome : chrome://extensions/
4. Activer le "Mode développeur" (en haut à droite)
5. Cliquer sur "Charger l'extension non empaquetée"
6. Sélectionner le dossier agate-prospector
7. ✅ Installé !

Pour mettre à jour :
cd agate-prospector
git pull origin main
Puis cliquer sur "Recharger" dans chrome://extensions/
```

---

### Option 4 : Google Workspace (si AGATE IT utilise Google Workspace)

**✅ Avantages :**
- Déploiement automatique sur tous les postes
- Centralisé (admin IT)
- Mises à jour automatiques
- Pas besoin d'action utilisateur

**⚠️ Inconvénients :**
- Nécessite Google Workspace Enterprise
- Nécessite droits admin Google Workspace

#### 📋 Procédure

1. Publier sur Chrome Web Store (Option 1)
2. L'admin Google Workspace va dans :
   - Admin Console → Appareils → Chrome → Applications et extensions
3. Ajouter l'extension par son ID
4. Déployer sur tous les utilisateurs ou groupes spécifiques
5. ✅ L'extension s'installe automatiquement sur tous les Chrome de l'organisation

---

## 🎯 Recommandation selon le contexte

### Pour AGATE IT, je recommande :

#### **Court terme (cette semaine) :**
**Option 3 : Mode développeur manuel**
- Envoyer les instructions Git à l'équipe
- Tout le monde peut tester immédiatement
- Pas de frais, pas d'attente

#### **Moyen terme (dans 1-2 semaines) :**
**Option 1 : Chrome Web Store (Unlisted)**
- Publier en mode "Unlisted" (visible uniquement avec le lien)
- Installation en 1 clic
- Mises à jour automatiques
- Coût : 5 USD (paiement unique)
- Attente : 24-72h validation

#### **Long terme (si > 50 utilisateurs) :**
**Option 4 : Google Workspace** (si vous utilisez déjà Google Workspace)
- Déploiement automatique centralisé
- Aucune action utilisateur requise
- Gestion IT simplifiée

---

## 📊 Comparatif

| Critère | Chrome Web Store | Fichier CRX | Mode dev | Google Workspace |
|---------|------------------|-------------|----------|------------------|
| **Installation** | 1 clic | Glisser-déposer | Manuel | Automatique |
| **Coût** | 5 USD | Gratuit | Gratuit | Google Workspace requis |
| **Délai** | 24-72h | Immédiat | Immédiat | 24-72h + config |
| **Mises à jour** | Auto | Manuel | Manuel | Auto |
| **Sécurité** | ✅ Validé Google | ⚠️ Avertissement | ⚠️ Avertissement | ✅ Validé |
| **Professionnel** | ✅✅✅ | ⚠️ | ❌ | ✅✅✅ |

---

## 🚀 Plan d'action recommandé

### Semaine 1 : Tests internes
```bash
# Distribuer en mode développeur
git clone https://github.com/Agate-IT/agate-prospector.git
chrome://extensions/ → Mode dev → Charger
```

### Semaine 2 : Publication Chrome Web Store
```bash
# Préparer le package
zip -r agate-prospector.zip .

# Publier sur Chrome Web Store (Unlisted)
# Payer 5 USD
# Attendre validation (24-72h)
```

### Semaine 3 : Déploiement équipe
```
# Envoyer le lien Chrome Web Store à toute l'équipe
# Installation en 1 clic
```

---

## 📝 Checklist publication Chrome Web Store

- [ ] Créer un compte Google avec email AGATE IT
- [ ] Payer les 5 USD de frais d'inscription
- [ ] Préparer le ZIP de l'extension
- [ ] Créer 3-5 screenshots (1280x800px)
- [ ] Rédiger la description (courte + détaillée)
- [ ] Choisir la visibilité (Unlisted recommandé)
- [ ] Justifier les permissions
- [ ] Soumettre pour validation
- [ ] Attendre 24-72h
- [ ] Distribuer le lien à l'équipe

---

## 🔐 Sécurité des credentials

**⚠️ IMPORTANT :** Les credentials API (BoondManager, Notion, OpenAI, etc.) ne sont **JAMAIS** dans le code de l'extension.

Chaque utilisateur doit :
1. Installer l'extension
2. Ouvrir les paramètres (popup)
3. Configurer ses propres credentials

**Possibilité de centraliser** (optionnel) :
- Créer des credentials "équipe" partagés
- Documenter dans un coffre-fort (1Password, LastPass, etc.)
- Partager uniquement en interne

---

**Questions ?** Contactez l'équipe technique AGATE IT.
