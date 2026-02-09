// ============================================================
// AGATE PROSPECTOR - BoondManager CRM API
// JWT HS256 auth, contact creation, company management
// Charge dans le service worker via importScripts('boond-api.js')
// ============================================================

const BOOND_CONFIG = {
  defaultBaseUrl: "https://ui.boondmanager.com/api",
  storageKeys: {
    instance: "boondInstance",
    userToken: "boondUserToken",
    clientToken: "boondClientToken",
    clientKey: "boondClientKey"
  }
};

/**
 * Retourne la base URL de l'API BoondManager
 * Si une instance est configuree (ex: "agate-it"), utilise https://agate-it.boondmanager.com/api
 * Sinon utilise https://ui.boondmanager.com/api
 */
async function getBoondBaseUrl() {
  const stored = await chrome.storage.local.get([BOOND_CONFIG.storageKeys.instance]);
  const instance = (stored[BOOND_CONFIG.storageKeys.instance] || "").trim();
  if (instance) {
    // Nettoyer : retirer https://, .boondmanager.com, /api etc.
    const clean = instance.replace(/^https?:\/\//, "").replace(/\.boondmanager\.com.*$/, "").replace(/\//g, "").trim();
    if (clean) {
      return `https://${clean}.boondmanager.com/api`;
    }
  }
  return BOOND_CONFIG.defaultBaseUrl;
}

// ============================================================
// JWT HS256 GENERATION (via crypto.subtle)
// ============================================================

function boondBase64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function boondStrToBase64Url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Genere un JWT HS256 pour l'API BoondManager
 * Payload: { userToken, clientToken, time, mode }
 * Signe avec clientKey via HMAC-SHA256
 */
async function generateBoondJWT() {
  const stored = await chrome.storage.local.get([
    BOOND_CONFIG.storageKeys.userToken,
    BOOND_CONFIG.storageKeys.clientToken,
    BOOND_CONFIG.storageKeys.clientKey
  ]);

  const userToken = stored[BOOND_CONFIG.storageKeys.userToken];
  const clientToken = stored[BOOND_CONFIG.storageKeys.clientToken];
  const clientKey = stored[BOOND_CONFIG.storageKeys.clientKey];

  if (!userToken || !clientToken || !clientKey) {
    throw new Error("Credentials BoondManager manquants. Configurez-les dans les parametres.");
  }

  // Header
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = boondStrToBase64Url(JSON.stringify(header));

  // Payload
  const payload = {
    userToken: userToken,
    clientToken: clientToken,
    time: Math.floor(Date.now() / 1000),
    mode: "normal"
  };
  const payloadB64 = boondStrToBase64Url(JSON.stringify(payload));

  // Signature HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(clientKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureData = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, signatureData);
  const signatureB64 = boondBase64UrlEncode(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// ============================================================
// API HELPER
// ============================================================

/**
 * Appel generique a l'API BoondManager avec JWT auto-genere
 */
async function boondApiCall(endpoint, options = {}) {
  const jwt = await generateBoondJWT();
  const method = options.method || "GET";
  const baseUrl = await getBoondBaseUrl();

  const url = `${baseUrl}${endpoint}`;
  const headers = {
    "X-Jwt-Client-Boondmanager": jwt,
    "Accept": "application/vnd.api+json",
    ...options.headers
  };

  // Content-Type uniquement pour POST/PATCH/PUT
  if (method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/vnd.api+json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401) {
    throw new Error("Authentification BoondManager echouee. Verifiez vos credentials.");
  }

  if (response.status === 429) {
    throw new Error("Limite de requetes BoondManager atteinte. Reessayez dans quelques minutes.");
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.errors?.[0]?.detail || errorBody.errors?.[0]?.title || errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorDetail = await response.text().catch(() => "");
    }
    console.error("[AGATE] Boond API error:", response.status, errorDetail);
    throw new Error(`BoondManager API (${response.status}): ${errorDetail || "erreur inconnue"}`);
  }

  return response.json();
}

// ============================================================
// GESTION DES SOCIETES
// ============================================================

/**
 * Cherche une societe par nom dans BoondManager.
 * Si elle n'existe pas, la cree.
 * Retourne l'ID de la societe.
 */
async function findOrCreateBoondCompany(companyName) {
  if (!companyName) return null;

  try {
    // Rechercher la societe
    const searchResult = await boondApiCall(`/companies?textSearch=${encodeURIComponent(companyName)}&page%5Bnumber%5D=1&page%5Bsize%5D=5`);

    if (searchResult.data && searchResult.data.length > 0) {
      // Verifier match exact (case insensitive)
      const exactMatch = searchResult.data.find(
        c => (c.attributes?.name || "").toLowerCase() === companyName.toLowerCase()
      );
      if (exactMatch) {
        console.log("[AGATE] Boond: societe trouvee:", exactMatch.id, exactMatch.attributes?.name);
        return exactMatch.id;
      }
      // Sinon prendre le premier resultat
      console.log("[AGATE] Boond: societe approchante trouvee:", searchResult.data[0].id);
      return searchResult.data[0].id;
    }

    // Creer la societe
    console.log("[AGATE] Boond: creation societe:", companyName);
    const createResult = await boondApiCall("/companies", {
      method: "POST",
      body: {
        data: {
          type: "company",
          attributes: {
            name: companyName
          }
        }
      }
    });

    if (createResult.data && createResult.data.id) {
      console.log("[AGATE] Boond: societe creee:", createResult.data.id);
      return createResult.data.id;
    }

    return null;
  } catch (error) {
    console.error("[AGATE] Boond: erreur societe:", error);
    // Ne pas bloquer la creation du contact si la societe echoue
    return null;
  }
}

// ============================================================
// DETECTION DES DOUBLONS
// ============================================================

/**
 * Verifie si un contact existe deja dans BoondManager
 * Cherche par email d'abord, puis par nom
 */
async function checkBoondDuplicate(data) {
  try {
    // 1. Recherche par email
    if (data.email) {
      const emailSearch = await boondApiCall(`/contacts?textSearch=${encodeURIComponent(data.email)}&page%5Bnumber%5D=1&page%5Bsize%5D=3`);
      if (emailSearch.data && emailSearch.data.length > 0) {
        const match = emailSearch.data.find(c => {
          const email = c.attributes?.email || c.attributes?.email1 || "";
          return email.toLowerCase() === data.email.toLowerCase();
        });
        if (match) {
          return { isDuplicate: true, contactId: match.id, contactName: match.attributes?.firstName + " " + match.attributes?.lastName };
        }
      }
    }

    // 2. Recherche par nom
    if (data.name) {
      const nameSearch = await boondApiCall(`/contacts?textSearch=${encodeURIComponent(data.name)}&page%5Bnumber%5D=1&page%5Bsize%5D=5`);
      if (nameSearch.data && nameSearch.data.length > 0) {
        const nameParts = data.name.trim().split(/\s+/);
        const firstName = nameParts[0]?.toLowerCase() || "";
        const lastName = nameParts.slice(1).join(" ").toLowerCase() || "";

        const match = nameSearch.data.find(c => {
          const cFirst = (c.attributes?.firstName || "").toLowerCase();
          const cLast = (c.attributes?.lastName || "").toLowerCase();
          return cFirst === firstName && cLast === lastName;
        });

        if (match) {
          return { isDuplicate: true, contactId: match.id, contactName: match.attributes?.firstName + " " + match.attributes?.lastName };
        }
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("[AGATE] Boond: erreur check doublon:", error);
    // En cas d'erreur, ne pas bloquer
    return { isDuplicate: false };
  }
}

// ============================================================
// ENVOI DE CONTACT
// ============================================================

/**
 * Flux principal : split nom → check doublon → find/create company → POST contact
 */
async function handleSendToBoond(formData) {
  // 1. Split du nom
  const nameParts = (formData.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || firstName; // fallback si un seul mot

  // 2. Verifier doublon
  const dupCheck = await checkBoondDuplicate(formData);
  if (dupCheck.isDuplicate) {
    return {
      success: false,
      duplicate: true,
      contactId: dupCheck.contactId,
      contactName: dupCheck.contactName
    };
  }

  // 3. Find or create company
  let companyId = null;
  if (formData.company) {
    companyId = await findOrCreateBoondCompany(formData.company);
  }

  // 4. Construire le commentaire combine (notes + sector + tags)
  const commentParts = [];
  if (formData.notes) commentParts.push(formData.notes);
  if (formData.sector) commentParts.push(`Secteur: ${formData.sector}`);
  if (formData.tags && formData.tags.length > 0) {
    commentParts.push(`Tags: ${formData.tags.join(", ")}`);
  }
  const comment = commentParts.join("\n") || "";

  // 5. Construire le body JSON:API
  const contactData = {
    data: {
      type: "contact",
      attributes: {
        firstName: firstName,
        lastName: lastName,
        email1: formData.email || "",
        phone1: formData.phone || "",
        phone2: formData.phone2 || "",
        function: formData.jobTitle || "",
        source: formData.linkedinUrl || "",
        comment: comment
      }
    }
  };

  // 6. Ajouter la relation company si trouvee
  if (companyId) {
    contactData.data.relationships = {
      company: {
        data: {
          type: "company",
          id: companyId
        }
      }
    };
  }

  // 7. POST le contact
  console.log("[AGATE] Boond: creation contact:", firstName, lastName);
  const result = await boondApiCall("/contacts", {
    method: "POST",
    body: contactData
  });

  if (result.data && result.data.id) {
    console.log("[AGATE] Boond: contact cree:", result.data.id);
    return { success: true, contactId: result.data.id };
  }

  throw new Error("Reponse inattendue de BoondManager");
}

// ============================================================
// STATUT DE CONNEXION
// ============================================================

/**
 * Teste la connexion en faisant un appel reel a l'API BoondManager
 * Essaie d'abord /application/current-user, puis /contacts en fallback
 */
async function testBoondConnection() {
  // Essayer plusieurs endpoints pour trouver celui qui repond
  const endpoints = [
    "/application/current-user",
    "/contacts",
    "/companies"
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const result = await boondApiCall(endpoint);
      console.log("[AGATE] Boond test OK via:", endpoint, result);
      return { success: true, message: "Connexion reussie !", endpoint };
    } catch (error) {
      console.warn("[AGATE] Boond test failed:", endpoint, error.message);
      lastError = error;
      // Si 401, inutile d'essayer les autres endpoints
      if (error.message.includes("401") || error.message.includes("Authentification")) {
        return { success: false, error: error.message };
      }
    }
  }
  return { success: false, error: lastError?.message || "Aucun endpoint accessible" };
}

/**
 * Verifie si les 3 credentials BoondManager sont configures
 */
async function getBoondConnectionStatus() {
  const stored = await chrome.storage.local.get([
    BOOND_CONFIG.storageKeys.instance,
    BOOND_CONFIG.storageKeys.userToken,
    BOOND_CONFIG.storageKeys.clientToken,
    BOOND_CONFIG.storageKeys.clientKey
  ]);

  const instance = stored[BOOND_CONFIG.storageKeys.instance] || "";
  const userToken = stored[BOOND_CONFIG.storageKeys.userToken] || "";
  const clientToken = stored[BOOND_CONFIG.storageKeys.clientToken] || "";
  const clientKey = stored[BOOND_CONFIG.storageKeys.clientKey] || "";

  const isConfigured = !!(userToken && clientToken && clientKey);

  return {
    success: true,
    isConfigured,
    hasUserToken: !!userToken,
    hasClientToken: !!clientToken,
    hasClientKey: !!clientKey
  };
}
