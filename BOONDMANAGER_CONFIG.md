# 🔐 Configuration BoondManager

## Credentials AGATE IT

**⚠️ UTILISER LES MÊMES CREDENTIALS QUE LE PROJET `cvtheque-esn`**

### API Credentials

\`\`\`
API URL      : https://ui.boondmanager.com/api
Instance     : ui (ou agate-it si instance custom)
User Token   : 382e61676174652d6974
Client Token : 61676174652d6974
Client Key   : 8e1beea0bdd041830da8
\`\`\`

---

## 📝 Configuration dans l'extension

### Étape 1 : Ouvrir les paramètres

1. Cliquer sur l'icône de l'extension dans Chrome
2. Cliquer sur l'onglet **"Paramètres"** ou **"Settings"**

### Étape 2 : Section BoondManager

Dans la section **"BoondManager CRM"**, remplir :

| Champ | Valeur |
|-------|--------|
| **Instance** | `ui` (ou `agate-it` si personnalisé) |
| **User Token** | `382e61676174652d6974` |
| **Client Token** | `61676174652d6974` |
| **Client Key** | `8e1beea0bdd041830da8` |

### Étape 3 : Tester la connexion

1. Cliquer sur **"Tester la connexion"**
2. Vérifier que le message **"Connexion réussie !"** apparaît
3. Si erreur :
   - Vérifier que tous les champs sont bien remplis
   - Vérifier qu'il n'y a pas d'espaces avant/après les tokens
   - Consulter les logs (F12 → Console)

---

## 🔒 Sécurité

Les credentials sont stockés dans **`chrome.storage.local`** (chiffré par Chrome).

**Ils ne sont JAMAIS :**
- ❌ Stockés en clair dans le code
- ❌ Envoyés à des serveurs tiers
- ❌ Visibles dans les logs

---

## 🔄 Synchronisation avec cvtheque-esn

Les deux projets partagent les **mêmes credentials BoondManager** :

| Projet | Fichier | Variables |
|--------|---------|-----------|
| **cvtheque-esn** | `.env` | `BOONDMANAGER_USER_TOKEN`, `BOONDMANAGER_CLIENT_TOKEN`, `BOONDMANAGER_CLIENT_KEY` |
| **agate-prospector** | `chrome.storage.local` | `boondUserToken`, `boondClientToken`, `boondClientKey` |

✅ Cela permet de **synchroniser les données** entre :
- Prospects commerciaux (extension)
- Candidats IT (cvtheque)
- ATS BoondManager (source unique)

---

## 📊 Fonctionnalités BoondManager

### 1. Gestion des sociétés

L'extension cherche automatiquement si une société existe dans Boond :
- ✅ Si elle existe → réutilise l'ID
- ✅ Si elle n'existe pas → la crée automatiquement

### 2. Détection de doublons

Avant de créer un contact, l'extension vérifie :
1. **Par email** (recherche exacte)
2. **Par nom + prénom** (si pas d'email)

Si doublon détecté → affiche un avertissement et **ne crée pas** le contact.

### 3. Création de contacts

Chaque prospect LinkedIn est envoyé vers BoondManager avec :
- ✅ Nom + Prénom
- ✅ Email + Téléphone
- ✅ Société (liée automatiquement)
- ✅ Poste / Fonction
- ✅ Source (URL LinkedIn)
- ✅ Commentaire (notes + secteur + tags)

### 4. Format JSON:API

L'extension utilise le **format JSON:API** de BoondManager :

\`\`\`json
{
  "data": {
    "type": "contact",
    "attributes": {
      "firstName": "Gabriel",
      "lastName": "ERDOGAN",
      "email1": "gabriel@agate-it.fr",
      "phone1": "+33 6 XX XX XX XX",
      "function": "CEO",
      "source": "https://www.linkedin.com/in/...",
      "comment": "Secteur: Tech/IT\\nTags: Cloud, DevOps, AWS"
    },
    "relationships": {
      "company": {
        "data": {
          "type": "company",
          "id": "12345"
        }
      }
    }
  }
}
\`\`\`

---

## 🛠️ Dépannage

### Erreur : "Authentification BoondManager échouée"

**Causes possibles :**
- ❌ Credentials incorrects
- ❌ Espaces avant/après les tokens
- ❌ Instance incorrecte

**Solution :**
1. Revérifier les credentials ci-dessus
2. Copier-coller **exactement** les valeurs
3. Tester la connexion

### Erreur : "Limite de requêtes atteinte"

**Cause :** Rate limiting de l'API BoondManager (trop de requêtes)

**Solution :**
- Attendre 5-10 minutes
- Réessayer

### Erreur : "Doublon détecté"

**C'est normal !** L'extension **protège** contre les doublons.

**Solution :**
- Vérifier si le contact existe déjà dans Boond
- Si besoin, mettre à jour le contact existant manuellement

---

## 📚 Documentation API BoondManager

- **Documentation officielle** : https://ui.boondmanager.com/api/documentation
- **Format** : JSON:API (https://jsonapi.org/)
- **Authentification** : JWT HS256

---

## ✅ Checklist de configuration

- [ ] User Token copié correctement
- [ ] Client Token copié correctement
- [ ] Client Key copié correctement
- [ ] Instance configurée (ui ou agate-it)
- [ ] Test de connexion réussi
- [ ] Premier contact créé avec succès

---

**Questions ?** Contacter l'équipe technique AGATE IT.
