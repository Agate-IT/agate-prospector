// ============================================================
// AGATE PROSPECTOR - Background Service Worker
// Gere les appels a l'API Notion (envoi de prospects)
// + Integration Microsoft Outlook via Graph API
// ============================================================

// Charger les modules API
importScripts('outlook-api.js');
importScripts('boond-api.js');

/**
 * MAPPING DES NOMS DE COLONNES NOTION
 * Adaptez ces noms si vos colonnes Notion ont des noms differents.
 * Le nom doit correspondre EXACTEMENT a celui dans Notion.
 */
const NOTION_COLUMNS = {
  name: "👤 Nom",                    // title
  company: "🏢 Organisation",        // rich_text
  jobTitle: "💼 Intitulé de poste",  // rich_text
  sector: "🎯 Secteur",              // select
  tags: "🏷️ Tags",                   // multi_select - tags technos détectés
  phone: "📞 Téléphone",             // phone_number
  phone2: "📞 Téléphone 2",          // phone_number
  email: "📧 Email",                 // email
  status: "✅ Statut",               // multi_select
  lastAction: "🔔 Dernière action",  // date
  linkedin: "🔗 LinkedIn",           // rich_text
  notes: "📝 Notes",                 // rich_text
  nextAction: "⏭️ Prochaine action", // date
  priority: "⭐ Score priorité",      // number
  history: "📜 Historique"           // rich_text - stocke les actions détaillées
};

// ============================================================
// SIDE PANEL : Ouvrir le panneau lateral au clic sur l'icone
// ============================================================
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Activer le side panel sur toutes les pages
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// === ECOUTE DES MESSAGES ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // RELAY urlChanged du content script vers le side panel
  if (request.action === "urlChanged") {
    // Relayer au side panel (broadcast)
    chrome.runtime.sendMessage(request).catch(err => {
      // Silencier "Receiving end does not exist" (side panel ferme = normal)
      if (!err.message?.includes("Receiving end does not exist")) {
        console.warn("[AGATE] urlChanged relay error:", err.message);
      }
    });
    // Pas de sendResponse necessaire
    return false;
  }

  if (request.action === "sendToNotion") {
    handleSendToNotion(request.data, request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "updateNotionPage") {
    handleUpdateNotionPage(request.pageId, request.updates, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Mise a jour complete d'une fiche existante (tous les champs)
  if (request.action === "updateNotionPageFull") {
    handleUpdateNotionPageFull(request.pageId, request.data, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Chercher un contact existant par URL LinkedIn
  if (request.action === "findByLinkedIn") {
    findContactByLinkedIn(request.linkedinUrl, request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Récupérer l'historique d'un contact (dernière action, prochaine action, statut)
  if (request.action === "getPageHistory") {
    getPageHistory(request.pageId, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Récupérer les secteurs existants dans la base Notion
  if (request.action === "getSectors") {
    getSectorsFromNotion(request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Ajouter une entrée à l'historique d'un contact
  if (request.action === "appendHistory") {
    appendToHistory(request.pageId, request.actionType, request.comment, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Ajouter une entree checklist (TODO/DONE) a l'historique
  if (request.action === "appendHistoryChecklist") {
    appendHistoryChecklist(request.pageId, request.actionType, request.dueDate, request.isDone, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Marquer une entree TODO comme DONE dans l'historique
  if (request.action === "markHistoryDone") {
    markHistoryEntryDone(request.pageId, request.actionType, request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Vérifier/créer la colonne Historique dans Notion
  if (request.action === "ensureHistoryColumn") {
    ensureHistoryColumn(request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Génération de pitch IA via OpenAI GPT-4o-mini
  if (request.action === "generateAISummary") {
    generateAISummary(request.data, request.openaiApiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Recherche de contacts dans la base Notion
  if (request.action === "searchNotionContacts") {
    searchNotionContacts(request.query, request.statusFilter, request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Relances en attente (prochaine action definie)
  if (request.action === "queryPendingFollowups") {
    queryPendingFollowups(request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Statistiques pipeline par statut
  if (request.action === "getPipelineStats") {
    getPipelineStats(request.apiKey, request.databaseId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Enrichissement contact via Lusha API (v4 - relay raw JSON)
  // Le parsing est fait cote content.js / sidepanel.js pour eviter les problemes de reload du service worker
  if (request.action === "enrichViaLusha") {
    (async () => {
      try {
        const { apiKey, linkedinUrl, firstName, lastName, companyName } = request;

        const params = new URLSearchParams();
        if (linkedinUrl) {
          params.set("linkedinUrl", linkedinUrl);
        } else if (firstName && lastName && companyName) {
          params.set("firstName", firstName);
          params.set("lastName", lastName);
          params.set("companyName", companyName);
        } else {
          sendResponse({ success: false, error: "URL LinkedIn ou nom+entreprise requis" });
          return;
        }

        const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
          headers: { "api_key": apiKey }
        });

        if (response.status === 404) {
          sendResponse({ success: false, error: "Prospect non trouvé sur Lusha" });
          return;
        }
        if (response.status === 401) {
          sendResponse({ success: false, error: "Clé API Lusha invalide" });
          return;
        }
        if (response.status === 429) {
          sendResponse({ success: false, error: "Limite de requêtes Lusha atteinte" });
          return;
        }
        if (!response.ok) {
          sendResponse({ success: false, error: `Erreur Lusha (${response.status})` });
          return;
        }

        // Renvoyer le JSON brut — le parsing sera fait cote client
        const rawJson = await response.json();
        sendResponse({ success: true, raw: rawJson });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ============================================================
  // OUTLOOK API HANDLERS
  // ============================================================

  if (request.action === "outlookLogin") {
    outlookLogin()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookLogout") {
    outlookLogout()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookStatus") {
    getOutlookConnectionStatus()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookFindLastSent") {
    findLastSentEmail(request.email)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookGetHistory") {
    getEmailHistory(request.email)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookCreateDraftReply") {
    createDraftReply(request.messageId, request.body)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookUpdateDraft") {
    updateDraft(request.draftId, request.body)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookSendDraft") {
    sendDraft(request.draftId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "outlookGetEmailBody") {
    getEmailBody(request.messageId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "saveOutlookClientId") {
    chrome.storage.local.set({ [OUTLOOK_CONFIG.clientIdStorageKey]: request.clientId })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ============================================================
  // BOONDMANAGER API HANDLERS
  // ============================================================

  if (request.action === "sendToBoond") {
    handleSendToBoond(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "boondStatus") {
    getBoondConnectionStatus()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "boondTestConnection") {
    testBoondConnection()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "openSidePanelForRelance") {
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: "triggerRelanceFromWidget",
          actionType: request.actionType,
          email: request.email,
          name: request.name,
          company: request.company
        }).catch(() => {});
      }, 500);
    }).catch(err => {
      console.error("[AGATE] Erreur ouverture sidepanel pour relance:", err);
    });
    return false;
  }
});

/**
 * Nettoie et formate l'ID de base Notion
 * Accepte tous les formats :
 *   - URL complete : https://www.notion.so/workspace/2fc6b05b02f98080bdbacbc84cb2515a?v=...
 *   - ID brut sans tirets : 2fc6b05b02f98080bdbacbc84cb2515a
 *   - ID avec tirets : 2fc6b05b-02f9-8080-bdba-cbc84cb2515a
 * Retourne un UUID valide avec tirets : 2fc6b05b-02f9-8080-bdba-cbc84cb2515a
 */
function cleanDatabaseId(rawId) {
  if (!rawId) return rawId;

  let id = rawId.trim();

  // Toujours retirer les parametres apres ? (peut etre present meme sans URL complete)
  if (id.includes("?")) {
    id = id.split("?")[0];
  }

  // Si c'est une URL, extraire l'ID (partie hexadecimale de 32 chars)
  if (id.includes("notion.so") || id.includes("/")) {
    // Prendre le dernier segment de l'URL
    const segments = id.split("/");
    id = segments[segments.length - 1];
  }

  // Si le segment contient un tiret suivi d'un nom (ex: Mon-CRM-abc123), prendre les 32 derniers hex chars
  const hexMatch = id.match(/([a-f0-9]{32})$/i);
  if (hexMatch) {
    id = hexMatch[1];
  }

  // Retirer tous les tirets existants
  id = id.replace(/-/g, "");

  // Verifier qu'on a bien 32 caracteres hex
  if (!/^[a-f0-9]{32}$/i.test(id)) {
    console.error("[AGATE] ID de base invalide apres nettoyage:", id);
    return rawId; // Retourner tel quel, l'API Notion donnera une erreur claire
  }

  // Formater en UUID : 8-4-4-4-12
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

/**
 * Envoie un prospect dans la base Notion
 */
async function handleSendToNotion(data, apiKey, databaseId) {
  // 0. Nettoyer l'ID de la base
  const cleanId = cleanDatabaseId(databaseId);
  console.log("[AGATE] ID nettoyé:", cleanId);

  // 1. Verifier les doublons (par email ou nom + entreprise)
  const duplicateResult = await checkDuplicate(data, apiKey, cleanId);
  if (duplicateResult.isDuplicate) {
    return { success: false, duplicate: true, duplicatePageId: duplicateResult.pageId };
  }

  // 2. Construire les proprietes Notion
  const properties = buildNotionProperties(data);

  // 3. Appeler l'API Notion pour creer la page
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({
      parent: { database_id: cleanId },
      properties: properties
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erreur API Notion:", errorData);
    throw new Error(`Notion API: ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  return { success: true, pageId: result.id };
}

/**
 * Construit l'objet properties pour l'API Notion
 * Adapte au schema de votre base
 */
function buildNotionProperties(data) {
  const properties = {};
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

  // NOM (Title - obligatoire)
  properties[NOTION_COLUMNS.name] = {
    title: [
      {
        text: {
          content: data.name
        }
      }
    ]
  };

  // ORGANISATION (Rich Text)
  if (data.company) {
    properties[NOTION_COLUMNS.company] = {
      rich_text: [
        {
          text: {
            content: data.company
          }
        }
      ]
    };
  }

  // INTITULE DE POSTE (Rich Text)
  if (data.jobTitle) {
    properties[NOTION_COLUMNS.jobTitle] = {
      rich_text: [
        {
          text: {
            content: data.jobTitle
          }
        }
      ]
    };
  }

  // SECTEUR (Select)
  if (data.sector) {
    properties[NOTION_COLUMNS.sector] = {
      select: {
        name: data.sector
      }
    };
  }

  // TAGS (Multi-select - tags technos détectés)
  if (data.tags && data.tags.length > 0) {
    properties[NOTION_COLUMNS.tags] = {
      multi_select: data.tags.map(tag => ({ name: tag }))
    };
  }

  // TELEPHONE (Phone number ou Rich Text selon votre config)
  if (data.phone) {
    properties[NOTION_COLUMNS.phone] = {
      phone_number: data.phone
    };
  }

  // TELEPHONE 2
  if (data.phone2) {
    properties[NOTION_COLUMNS.phone2] = {
      phone_number: data.phone2
    };
  }

  // EMAIL
  if (data.email) {
    properties[NOTION_COLUMNS.email] = {
      email: data.email
    };
  }

  // STATUT (Multi-select — votre Notion utilise multi_select)
  if (data.status) {
    // Mapper les valeurs du formulaire vers les noms exacts dans Notion
    const statusMapping = {
      "A contacter": "À contacter",
      "Mail envoye": "Mail envoyé",
      "NRP": "NRP",
      "Pas interesse": "Pas intéressé",
      "RDV pris": "RDV pris",
      "Pas de projet": "Pas de prestation",
      "A rappeler": "À rappeler",
      "R1": "R1",
      "R2": "R2",
      "R3": "R3"
    };
    const notionStatus = statusMapping[data.status] || data.status;
    properties[NOTION_COLUMNS.status] = {
      multi_select: [
        { name: notionStatus }
      ]
    };
  }

  // DERNIERE ACTION (Date = aujourd'hui)
  properties[NOTION_COLUMNS.lastAction] = {
    date: {
      start: today
    }
  };

  // LINKEDIN (Rich Text — votre Notion utilise rich_text, pas url)
  if (data.linkedinUrl) {
    properties[NOTION_COLUMNS.linkedin] = {
      rich_text: [
        {
          text: {
            content: data.linkedinUrl,
            link: { url: data.linkedinUrl }
          }
        }
      ]
    };
  }

  // NOTES (Rich Text)
  if (data.notes) {
    properties[NOTION_COLUMNS.notes] = {
      rich_text: [
        {
          text: {
            content: data.notes
          }
        }
      ]
    };
  }

  return properties;
}

/**
 * Verifie si un prospect existe deja dans la base Notion
 * Cherche par email (si disponible) OU par nom + organisation
 * Retourne { isDuplicate: boolean, pageId: string|null }
 */
async function checkDuplicate(data, apiKey, databaseId) {
  try {
    // L'ID est deja nettoye par handleSendToNotion, mais on securise
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);
    let filter;

    if (data.email) {
      // Recherche par email (plus fiable)
      filter = {
        property: NOTION_COLUMNS.email,
        email: {
          equals: data.email
        }
      };
    } else if (data.name && data.company) {
      // Recherche par nom + organisation
      filter = {
        and: [
          {
            property: NOTION_COLUMNS.name,
            title: {
              equals: data.name
            }
          },
          {
            property: NOTION_COLUMNS.company,
            rich_text: {
              equals: data.company
            }
          }
        ]
      };
    } else {
      // Pas assez d'info pour verifier les doublons
      return { isDuplicate: false, pageId: null };
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: filter,
        page_size: 1
      })
    });

    if (!response.ok) {
      // En cas d'erreur, on laisse passer (pas de blocage)
      return { isDuplicate: false, pageId: null };
    }

    const result = await response.json();
    if (result.results && result.results.length > 0) {
      return { isDuplicate: true, pageId: result.results[0].id };
    }
    return { isDuplicate: false, pageId: null };

  } catch (error) {
    console.error("Erreur check doublon:", error);
    return { isDuplicate: false, pageId: null }; // En cas d'erreur, on ne bloque pas
  }
}

/**
 * Recherche un contact existant par URL LinkedIn
 * Retourne le pageId si trouve, null sinon
 */
async function findContactByLinkedIn(linkedinUrl, apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);
    // Nettoyer et normaliser l'URL : retirer parametres, trailing slash, forcer minuscules pour le slug
    let cleanLinkedin = linkedinUrl.split("?")[0].replace(/\/+$/, "");
    // Extraire le slug /in/xxx pour comparaison stricte
    const slugMatch = cleanLinkedin.match(/linkedin\.com\/in\/([^/?#]+)/i);
    const searchSlug = slugMatch ? slugMatch[1].toLowerCase() : null;

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          property: NOTION_COLUMNS.linkedin,
          rich_text: {
            contains: searchSlug || cleanLinkedin
          }
        },
        page_size: 5  // Recuperer plusieurs resultats pour filtrer les faux positifs
      })
    });

    if (!response.ok) {
      return { success: false, found: false };
    }

    const result = await response.json();
    if (result.results && result.results.length > 0) {
      // Validation stricte : verifier que le slug LinkedIn correspond EXACTEMENT
      let page = null;
      for (const candidate of result.results) {
        const notionLinkedin = candidate.properties[NOTION_COLUMNS.linkedin]?.rich_text?.[0]?.plain_text || "";
        const notionSlugMatch = notionLinkedin.match(/linkedin\.com\/in\/([^/?#]+)/i);
        const notionSlug = notionSlugMatch ? notionSlugMatch[1].toLowerCase() : notionLinkedin.toLowerCase().replace(/\/+$/, "");

        if (searchSlug && notionSlug === searchSlug) {
          page = candidate;
          console.log("[AGATE] Match exact trouvé:", searchSlug);
          break;
        }
        // Fallback : comparaison d'URL complete (sans trailing slash, sans params)
        const notionClean = notionLinkedin.split("?")[0].replace(/\/+$/, "").toLowerCase();
        const searchClean = cleanLinkedin.toLowerCase();
        if (notionClean === searchClean || notionClean.endsWith("/" + searchSlug) || searchClean.endsWith("/" + notionSlug)) {
          page = candidate;
          console.log("[AGATE] Match URL trouvé:", notionClean);
          break;
        }
      }

      if (!page) {
        console.log("[AGATE] Aucun match exact pour:", searchSlug, "parmi", result.results.length, "candidats");
        return { success: true, found: false };
      }

      const props = page.properties;

      // Extraire toutes les donnees du contact
      const tagsRaw = props[NOTION_COLUMNS.tags]?.multi_select || [];
      const contactData = {
        success: true,
        found: true,
        pageId: page.id,
        name: props[NOTION_COLUMNS.name]?.title?.[0]?.plain_text || "",
        company: props[NOTION_COLUMNS.company]?.rich_text?.[0]?.plain_text || "",
        jobTitle: props[NOTION_COLUMNS.jobTitle]?.rich_text?.[0]?.plain_text || "",
        sector: props[NOTION_COLUMNS.sector]?.select?.name || "",
        status: props[NOTION_COLUMNS.status]?.multi_select?.[0]?.name || "",
        phone: props[NOTION_COLUMNS.phone]?.phone_number || "",
        phone2: props[NOTION_COLUMNS.phone2]?.phone_number || "",
        email: props[NOTION_COLUMNS.email]?.email || "",
        linkedinUrl: props[NOTION_COLUMNS.linkedin]?.rich_text?.[0]?.plain_text || "",
        notes: props[NOTION_COLUMNS.notes]?.rich_text?.[0]?.plain_text || "",
        tags: tagsRaw.map(t => t.name),
        // Données enrichies pour la bannière de doublon
        lastActionDate: props[NOTION_COLUMNS.lastAction]?.date?.start || null,
        nextActionDate: props[NOTION_COLUMNS.nextAction]?.date?.start || null,
        historyText: props[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || ""
      };

      return contactData;
    }

    return { success: true, found: false };
  } catch (error) {
    console.error("[AGATE] Erreur recherche LinkedIn:", error);
    return { success: false, found: false, error: error.message };
  }
}

// ============================================================
// MISE A JOUR D'UNE PAGE NOTION (actions de relance)
// PATCH sur une page existante pour mettre a jour les proprietes
// ============================================================

/**
 * Met a jour une page Notion existante (apres envoi initial)
 * Utilise par les boutons d'action : Appeler, Mail envoye, R1, R2, R3
 *
 * @param {string} pageId - ID de la page Notion a mettre a jour
 * @param {object} updates - { lastAction: "YYYY-MM-DD", nextAction: "YYYY-MM-DD"|null, status: "R1"|null }
 * @param {string} apiKey - Cle API Notion
 */
async function handleUpdateNotionPage(pageId, updates, apiKey) {
  const properties = {};

  // Mapping des statuts (sans accents → avec accents pour Notion)
  const statusMapping = {
    "A contacter": "À contacter",
    "Mail envoye": "Mail envoyé",
    "NRP": "NRP",
    "Pas interesse": "Pas intéressé",
    "RDV pris": "RDV pris",
    "Pas de projet": "Pas de prestation",
    "A rappeler": "À rappeler",
    "R1": "R1",
    "R2": "R2",
    "R3": "R3"
  };

  // Derniere action (date d'aujourd'hui)
  if (updates.lastAction) {
    properties[NOTION_COLUMNS.lastAction] = {
      date: {
        start: updates.lastAction
      }
    };
  }

  // Prochaine action (type date dans Notion)
  if (updates.nextAction) {
    properties[NOTION_COLUMNS.nextAction] = {
      date: {
        start: updates.nextAction
      }
    };
  } else if (updates.nextAction === null) {
    // Supprimer la prochaine action
    properties[NOTION_COLUMNS.nextAction] = {
      date: null
    };
  }

  // Statut (si specifie)
  if (updates.status) {
    const notionStatus = statusMapping[updates.status] || updates.status;
    properties[NOTION_COLUMNS.status] = {
      multi_select: [
        { name: notionStatus }
      ]
    };
  }

  console.log("[AGATE] PATCH page Notion:", pageId, properties);

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({ properties })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[AGATE] Erreur PATCH Notion:", errorData);
    throw new Error(`Notion API: ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  return { success: true, pageId: result.id };
}

/**
 * Met a jour TOUS les champs d'une fiche Notion existante
 * Utilise quand l'utilisateur veut mettre a jour un doublon
 */
async function handleUpdateNotionPageFull(pageId, data, apiKey) {
  const properties = buildNotionProperties(data);

  console.log("[AGATE] PATCH complet page Notion:", pageId);

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({ properties })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[AGATE] Erreur PATCH complet Notion:", errorData);
    throw new Error(`Notion API: ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  return { success: true, pageId: result.id };
}

// ============================================================
// HISTORIQUE D'UN CONTACT
// ============================================================

/**
 * Récupère l'historique d'une page Notion (dernière action, prochaine action, statut, historique détaillé)
 */
async function getPageHistory(pageId, apiKey) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      return { success: false, error: "Page non trouvée" };
    }

    const page = await response.json();
    const props = page.properties;

    // Récupérer l'historique détaillé (chaque ligne = une action)
    const historyText = props[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || "";
    const historyEntries = historyText ? historyText.split("\n").filter(line => line.trim()) : [];

    const history = {
      lastAction: props[NOTION_COLUMNS.lastAction]?.date?.start || null,
      nextAction: props[NOTION_COLUMNS.nextAction]?.date?.start || null,
      status: props[NOTION_COLUMNS.status]?.multi_select?.[0]?.name || null,
      entries: historyEntries // Liste des actions détaillées
    };

    return { success: true, history };
  } catch (error) {
    console.error("[AGATE] Erreur getPageHistory:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Tronque l'historique proprement a la derniere ligne complete avant la limite.
 * Retourne { text, truncated } pour informer l'appelant.
 */
const MAX_HISTORY_LENGTH = 2000;
function truncateHistory(text) {
  if (text.length <= MAX_HISTORY_LENGTH) {
    return { text, truncated: false };
  }
  console.warn(`[AGATE] Historique tronqué: ${text.length} -> ${MAX_HISTORY_LENGTH} chars`);
  const cut = text.substring(0, MAX_HISTORY_LENGTH);
  const lastNewline = cut.lastIndexOf("\n");
  return {
    text: lastNewline > 0 ? cut.substring(0, lastNewline) : cut,
    truncated: true
  };
}

/**
 * Ajoute une entrée à l'historique d'une page Notion
 * Format: "06/02 16h30 - Appel - NRP"
 */
async function appendToHistory(pageId, actionType, comment, apiKey) {
  try {
    // 1. Récupérer l'historique actuel
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      throw new Error("Page non trouvée");
    }

    const page = await response.json();
    const currentHistory = page.properties[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || "";

    // 2. Créer la nouvelle entrée avec date et heure
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");

    let newEntry = `[DONE] ${dateStr} ${timeStr} - ${actionType}`;
    if (comment) {
      newEntry += ` - ${comment}`;
    }

    // 3. Ajouter au début de l'historique (plus récent en premier)
    const rawHistory = currentHistory ? `${newEntry}\n${currentHistory}` : newEntry;
    const { text: updatedHistory, truncated } = truncateHistory(rawHistory);

    // 4. Mettre à jour Notion
    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: {
          [NOTION_COLUMNS.history]: {
            rich_text: [{
              text: {
                content: updatedHistory
              }
            }]
          }
        }
      })
    });

    if (!updateResponse.ok) {
      throw new Error("Erreur mise à jour historique");
    }

    return { success: true, entry: newEntry };
  } catch (error) {
    console.error("[AGATE] Erreur appendToHistory:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// CHECKLIST HISTORIQUE (TODO/DONE)
// ============================================================

/**
 * Ajoute une entree checklist a l'historique Notion.
 * Format: "[DONE] 07/02 14h32 - Mail envoye" ou "[TODO] 10/02 - R1"
 */
async function appendHistoryChecklist(pageId, actionType, dueDate, isDone, apiKey) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) throw new Error("Page non trouvee");

    const page = await response.json();
    const currentHistory = page.properties[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || "";

    const marker = isDone ? "[DONE]" : "[TODO]";
    const now = new Date();
    let dateStr;

    if (isDone) {
      dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
      dateStr += " " + timeStr;
    } else if (dueDate) {
      const due = new Date(dueDate);
      dateStr = due.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    } else {
      dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    }

    const newEntry = `${marker} ${dateStr} - ${actionType}`;
    const rawHistory = currentHistory ? `${newEntry}\n${currentHistory}` : newEntry;
    const { text: updatedHistory } = truncateHistory(rawHistory);

    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: {
          [NOTION_COLUMNS.history]: {
            rich_text: [{
              text: { content: updatedHistory }
            }]
          }
        }
      })
    });

    if (!updateResponse.ok) throw new Error("Erreur mise a jour historique");
    return { success: true, entry: newEntry };
  } catch (error) {
    console.error("[AGATE] Erreur appendHistoryChecklist:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Marque une entree [TODO] comme [DONE] dans l'historique Notion.
 * Cherche la premiere ligne [TODO] contenant le actionType et la flip.
 */
async function markHistoryEntryDone(pageId, actionType, apiKey) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });
    if (!response.ok) throw new Error("Page non trouvee");

    const page = await response.json();
    const currentHistory = page.properties[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || "";

    const lines = currentHistory.split("\n");
    let found = false;
    const now = new Date();
    const doneDate = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const doneTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");

    for (let i = 0; i < lines.length; i++) {
      // Match exact apres le separateur " - " pour eviter que "R1" matche "R10"
      const lineAction = lines[i].replace(/^\[TODO\]\s*.*?\s-\s/, '').trim();
      if (lines[i].startsWith("[TODO]") && lineAction === actionType) {
        lines[i] = `[DONE] ${doneDate} ${doneTime} - ${actionType}`;
        found = true;
        break;
      }
    }

    if (!found) {
      // Pas de TODO correspondant, ajouter une entree DONE en tete
      lines.unshift(`[DONE] ${doneDate} ${doneTime} - ${actionType}`);
    }

    const { text: updatedHistory } = truncateHistory(lines.join("\n"));

    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: {
          [NOTION_COLUMNS.history]: {
            rich_text: [{ text: { content: updatedHistory } }]
          }
        }
      })
    });

    if (!updateResponse.ok) throw new Error("Erreur mise a jour historique");
    return { success: true };
  } catch (error) {
    console.error("[AGATE] Erreur markHistoryEntryDone:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// CREATION AUTOMATIQUE DES COLONNES (Historique + Tags)
// ============================================================

/**
 * Vérifie et crée les colonnes manquantes dans la base Notion
 * - 📜 Historique (rich_text)
 * - 🏷️ Tags (multi_select)
 */
async function ensureHistoryColumn(apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);

    // 1. Récupérer le schéma de la base
    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      console.error("[AGATE] Erreur récupération schéma base:", await response.text());
      return { success: false, error: "Base non trouvée" };
    }

    const database = await response.json();

    // 2. Vérifier quelles colonnes manquent
    const missingColumns = {};
    let createdColumns = [];

    if (!database.properties[NOTION_COLUMNS.history]) {
      missingColumns[NOTION_COLUMNS.history] = { rich_text: {} };
      createdColumns.push("Historique");
    }

    if (!database.properties[NOTION_COLUMNS.tags]) {
      missingColumns[NOTION_COLUMNS.tags] = { multi_select: {} };
      createdColumns.push("Tags");
    }

    // Si toutes les colonnes existent déjà
    if (Object.keys(missingColumns).length === 0) {
      console.log("[AGATE] Toutes les colonnes existent déjà");
      return { success: true, created: false };
    }

    // 3. Créer les colonnes manquantes
    console.log("[AGATE] Création des colonnes:", createdColumns.join(", "));
    const updateResponse = await fetch(`https://api.notion.com/v1/databases/${cleanId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: missingColumns
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("[AGATE] Erreur création colonne:", errorData);
      return { success: false, error: errorData.message };
    }

    console.log("[AGATE] Colonne Historique créée avec succès !");
    return { success: true, created: true };

  } catch (error) {
    console.error("[AGATE] Erreur ensureHistoryColumn:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// GESTION DES SECTEURS
// ============================================================

/**
 * Récupère la liste des secteurs existants dans la base Notion
 */
async function getSectorsFromNotion(apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      return { success: false, sectors: [] };
    }

    const database = await response.json();
    const sectorProp = database.properties[NOTION_COLUMNS.sector];

    if (sectorProp && sectorProp.select && sectorProp.select.options) {
      const sectors = sectorProp.select.options.map(opt => opt.name);
      return { success: true, sectors };
    }

    return { success: true, sectors: [] };
  } catch (error) {
    console.error("[AGATE] Erreur getSectors:", error);
    return { success: false, sectors: [] };
  }
}

// ============================================================
// RECHERCHE DE CONTACTS DANS NOTION
// ============================================================

/**
 * Recherche dans la base Notion par nom, entreprise ou email.
 * Filtre optionnel par statut.
 * Retourne max 20 resultats tries par derniere action.
 */
async function searchNotionContacts(query, statusFilter, apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);

    let filter;
    const textConditions = [];

    if (query && query.trim()) {
      textConditions.push({
        property: NOTION_COLUMNS.name,
        title: { contains: query.trim() }
      });
      textConditions.push({
        property: NOTION_COLUMNS.company,
        rich_text: { contains: query.trim() }
      });
      textConditions.push({
        property: NOTION_COLUMNS.email,
        email: { contains: query.trim() }
      });
    }

    if (statusFilter) {
      if (textConditions.length > 0) {
        filter = {
          and: [
            { or: textConditions },
            { property: NOTION_COLUMNS.status, multi_select: { contains: statusFilter } }
          ]
        };
      } else {
        filter = {
          property: NOTION_COLUMNS.status,
          multi_select: { contains: statusFilter }
        };
      }
    } else if (textConditions.length > 0) {
      filter = { or: textConditions };
    }

    const body = { page_size: 20 };
    if (filter) body.filter = filter;

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const result = await response.json();
    const contacts = result.results.map(page => {
      const props = page.properties;
      const tagsRaw = props[NOTION_COLUMNS.tags]?.multi_select || [];
      return {
        pageId: page.id,
        name: props[NOTION_COLUMNS.name]?.title?.[0]?.plain_text || "",
        company: props[NOTION_COLUMNS.company]?.rich_text?.[0]?.plain_text || "",
        jobTitle: props[NOTION_COLUMNS.jobTitle]?.rich_text?.[0]?.plain_text || "",
        status: props[NOTION_COLUMNS.status]?.multi_select?.[0]?.name || "",
        email: props[NOTION_COLUMNS.email]?.email || "",
        phone: props[NOTION_COLUMNS.phone]?.phone_number || "",
        phone2: props[NOTION_COLUMNS.phone2]?.phone_number || "",
        sector: props[NOTION_COLUMNS.sector]?.select?.name || "",
        linkedinUrl: props[NOTION_COLUMNS.linkedin]?.rich_text?.[0]?.plain_text || "",
        notes: props[NOTION_COLUMNS.notes]?.rich_text?.[0]?.plain_text || "",
        tags: tagsRaw.map(t => t.name),
        lastAction: props[NOTION_COLUMNS.lastAction]?.date?.start || "",
        notionUrl: `https://notion.so/${page.id.replace(/-/g, "")}`
      };
    });

    return { success: true, contacts, total: result.results.length };
  } catch (error) {
    console.error("[AGATE] Erreur searchNotionContacts:", error);
    return { success: false, error: error.message, contacts: [] };
  }
}

// ============================================================
// RELANCES EN ATTENTE (PROCHAINE ACTION)
// ============================================================

/**
 * Recupere les prospects avec une date de prochaine action definie.
 * Utilise pour le dashboard des rappels.
 */
async function queryPendingFollowups(apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);

    const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          property: NOTION_COLUMNS.nextAction,
          date: { is_not_empty: true }
        },
        page_size: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const result = await response.json();
    const followups = result.results.map(page => {
      const props = page.properties;
      const tagsRaw = props[NOTION_COLUMNS.tags]?.multi_select || [];
      return {
        pageId: page.id,
        name: props[NOTION_COLUMNS.name]?.title?.[0]?.plain_text || "",
        company: props[NOTION_COLUMNS.company]?.rich_text?.[0]?.plain_text || "",
        jobTitle: props[NOTION_COLUMNS.jobTitle]?.rich_text?.[0]?.plain_text || "",
        sector: props[NOTION_COLUMNS.sector]?.select?.name || "",
        status: props[NOTION_COLUMNS.status]?.multi_select?.[0]?.name || "",
        nextAction: props[NOTION_COLUMNS.nextAction]?.date?.start || "",
        lastAction: props[NOTION_COLUMNS.lastAction]?.date?.start || "",
        email: props[NOTION_COLUMNS.email]?.email || "",
        tags: tagsRaw.map(t => t.name),
        history: props[NOTION_COLUMNS.history]?.rich_text?.[0]?.plain_text || "",
        notionUrl: `https://notion.so/${page.id.replace(/-/g, "")}`
      };
    });

    return { success: true, followups };
  } catch (error) {
    console.error("[AGATE] Erreur queryPendingFollowups:", error);
    return { success: false, error: error.message, followups: [] };
  }
}

// ============================================================
// STATISTIQUES PIPELINE PAR STATUT
// ============================================================

/**
 * Recupere tous les prospects et les regroupe par statut.
 * Retourne les compteurs + 5 premiers prospects par groupe.
 * Pagination: max 3 pages (300 prospects).
 */
async function getPipelineStats(apiKey, databaseId) {
  try {
    const cleanId = databaseId.includes("-") ? databaseId : cleanDatabaseId(databaseId);
    let allResults = [];
    let hasMore = true;
    let nextCursor = undefined;
    let pagesFetched = 0;

    while (hasMore && pagesFetched < 3) {
      const body = { page_size: 100 };
      if (nextCursor) body.start_cursor = nextCursor;

      const response = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();
      allResults = allResults.concat(result.results);
      hasMore = result.has_more;
      nextCursor = result.next_cursor;
      pagesFetched++;
    }

    const statusOrder = [
      "À contacter", "Mail envoyé", "NRP", "R1", "R2", "R3",
      "À rappeler", "RDV pris", "Pas intéressé", "Pas de prestation"
    ];

    const pipeline = {};
    statusOrder.forEach(s => { pipeline[s] = { count: 0, prospects: [] }; });
    pipeline["Sans statut"] = { count: 0, prospects: [] };

    allResults.forEach(page => {
      const props = page.properties;
      const status = props[NOTION_COLUMNS.status]?.multi_select?.[0]?.name || "Sans statut";
      if (!pipeline[status]) {
        pipeline[status] = { count: 0, prospects: [] };
      }
      pipeline[status].count++;
      if (pipeline[status].prospects.length < 5) {
        pipeline[status].prospects.push({
          pageId: page.id,
          name: props[NOTION_COLUMNS.name]?.title?.[0]?.plain_text || "",
          company: props[NOTION_COLUMNS.company]?.rich_text?.[0]?.plain_text || "",
          lastAction: props[NOTION_COLUMNS.lastAction]?.date?.start || "",
          notionUrl: `https://notion.so/${page.id.replace(/-/g, "")}`
        });
      }
    });

    return { success: true, pipeline, totalProspects: allResults.length, statusOrder };
  } catch (error) {
    console.error("[AGATE] Erreur getPipelineStats:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// ENRICHISSEMENT IA - OpenAI GPT-4o-mini
// ============================================================

async function generateAISummary(data, openaiApiKey) {
  if (!openaiApiKey) {
    return { success: false, error: "Clé API OpenAI non configurée" };
  }

  // Extraire le prénom
  const prenom = (data.name || "").split(" ")[0] || "";

  // Déterminer le contexte (premier contact, relance, prospect existant)
  let contexte = "premier_contact";
  if (data.isExisting) {
    const status = (data.status || "").toLowerCase();
    if (status.includes("r1") || status.includes("r2") || status.includes("r3") || status.includes("relance")) {
      contexte = "relance";
    } else if (status.includes("nrp") || status.includes("rappeler")) {
      contexte = "relance_nrp";
    } else {
      contexte = "suivi";
    }
  }

  const systemPrompt = `Tu es Yanice, Directeur de la BU Digital chez AGATE IT.
AGATE IT est un cabinet de conseil en régie, spécialisé en IA, Data, Cloud et Infrastructure. Tu connectes les bonnes personnes sur les bons projets.

IDENTITE AGATE :
- 80 consultants en mission, 9M de CA, depuis 2021
- Forces : réactivité (sourcing qualifié sous 48h), compréhension technique des enjeux, profils ultra-pertinents (pas de profils génériques)
- Secteurs clients : Retail, E-commerce, Luxe, Médias, Télécom, Grande distribution, Divertissement
- Modèle : régie (placement d'experts techniques)

CIBLES :
- Interlocuteurs idéaux : DSI, Responsable Technique, Manager IT, Engineering Manager, Head of Engineering
- Signal d'achat : manager d'équipe de 10 à 70 personnes
- NE PAS pitcher : freelances, cabinets concurrents, entreprises < 200 employés

STYLE DU PITCH :
- Ton semi-formel, décontracté, direct, positionnement de challenger
- Vouvoiement MAIS en appelant par le prénom (ex: "Bonjour Marc,")
- 2-3 phrases courtes et percutantes
- Pas trop commercial, pas d'anglicisme, jamais de tutoiement
- Utilisable en copier-coller dans un message LinkedIn OU comme base à adapter

STRUCTURE ET MISE EN FORME OBLIGATOIRES :
Le message DOIT respecter ce format exact avec des sauts de ligne :

Bonjour {prénom},

J'espère que vous allez bien.
[Proposition de valeur AGATE en lien avec le secteur ou les technologies du prospect — 1-2 phrases max. NE PAS rappeler le poste ni l'entreprise du prospect.]

[Appel à l'action challenger — proposer de tester la réactivité d'AGATE avec un besoin complexe, sans engagement. Varier la formulation à chaque fois.]

Yanice

IMPORTANT : les lignes vides (sauts de ligne) entre chaque bloc sont OBLIGATOIRES. Le message doit être aéré.

REGLES STRICTES :
- NE JAMAIS rappeler le poste exact du prospect ("En tant que X chez Y" est INTERDIT)
- NE JAMAIS rappeler le nom de l'entreprise du prospect dans le corps du message
- TOUJOURS commencer après "J'espère que vous allez bien." par une accroche liée au secteur, aux technologies ou au métier de manière naturelle
- Si des technologies/tags sont détectés, les mentionner naturellement pour montrer la compréhension du besoin
- Ne jamais inventer de faits sur le prospect ou son entreprise
- Ne pas mentionner de noms de consultants ni de TJM
- TOUJOURS terminer par "Yanice" sur une ligne seule (jamais "Cordialement" ni autre formule)
- Adapter le message si c'est une relance (plus court, rappeler le premier contact)

CONTEXTE DE CE PITCH : ${contexte === "premier_contact" ? "Premier contact - le prospect ne nous connaît pas encore" : contexte === "relance" ? "Relance - le prospect a déjà été contacté, faire un suivi court et percutant" : contexte === "relance_nrp" ? "Relance après non-réponse - être bref, rappeler la valeur, proposer un autre créneau" : "Suivi - le prospect est déjà dans le CRM, adapter le ton en conséquence"}

Réponds UNIQUEMENT avec le pitch formaté (sans guillemets, sans introduction, sans explication).`;

  const userPrompt = `Prospect :
- Prénom : ${prenom || "N/A"}
- Nom complet : ${data.name || "N/A"}
- Entreprise : ${data.company || "N/A"}
- Poste : ${data.jobTitle || "N/A"}
- Secteur : ${data.sector || "N/A"}
- Technologies/Tags : ${data.tags || "N/A"}
- Headline LinkedIn : ${data.headline || "N/A"}
- À propos : ${data.aboutText || "N/A"}
- Statut CRM : ${data.status || "A contacter"}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AGATE] Erreur OpenAI:", errorData);
      return { success: false, error: errorData.error?.message || `HTTP ${response.status}` };
    }

    const result = await response.json();
    const pitch = result.choices?.[0]?.message?.content?.trim() || "";

    if (!pitch) {
      return { success: false, error: "Réponse vide de l'IA" };
    }

    return { success: true, pitch };
  } catch (error) {
    console.error("[AGATE] Erreur generateAISummary:", error);
    return { success: false, error: error.message };
  }
}
