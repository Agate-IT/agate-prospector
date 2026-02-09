// ============================================================
// AGATE PROSPECTOR - Side Panel Logic
// Persistant : reste ouvert meme quand vous cliquez sur la page
// Sauvegarde auto : les donnees ne sont jamais perdues
// ============================================================

// === ELEMENTS DOM ===
const el = {
  mainView: document.getElementById("mainView"),
  settingsView: document.getElementById("settingsView"),
  remindersView: document.getElementById("remindersView"),
  searchView: document.getElementById("searchView"),
  pipelineView: document.getElementById("pipelineView"),
  notLinkedIn: document.getElementById("notLinkedIn"),
  dataForm: document.getElementById("dataForm"),
  loadingView: document.getElementById("loadingView"),
  statusBar: document.getElementById("statusBar"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  refreshBtn: document.getElementById("refreshBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  backBtn: document.getElementById("backBtn"),
  saveSettings: document.getElementById("saveSettings"),
  sendToNotion: document.getElementById("sendToNotion"),
  successMsg: document.getElementById("successMsg"),
  errorMsg: document.getElementById("errorMsg"),
  errorText: document.getElementById("errorText"),
  duplicateMsg: document.getElementById("duplicateMsg"),
  settingsSuccess: document.getElementById("settingsSuccess"),
  // Champs
  fieldName: document.getElementById("fieldName"),
  fieldCompany: document.getElementById("fieldCompany"),
  fieldJobTitle: document.getElementById("fieldJobTitle"),
  fieldSector: document.getElementById("fieldSector"),
  fieldStatus: document.getElementById("fieldStatus"),
  fieldPhone: document.getElementById("fieldPhone"),
  fieldPhone2: document.getElementById("fieldPhone2"),
  fieldEmail: document.getElementById("fieldEmail"),
  fieldLinkedin: document.getElementById("fieldLinkedin"),
  fieldNotes: document.getElementById("fieldNotes"),
  // Parametres
  notionApiKey: document.getElementById("notionApiKey"),
  notionDatabaseId: document.getElementById("notionDatabaseId"),
  // Boond
  sendToBoond: document.getElementById("sendToBoond"),
  sendToBoth: document.getElementById("sendToBoth"),
  boondInstance: document.getElementById("boondInstance"),
  boondUserToken: document.getElementById("boondUserToken"),
  boondClientToken: document.getElementById("boondClientToken"),
  boondClientKey: document.getElementById("boondClientKey"),
  boondStatusIndicator: document.getElementById("boondStatusIndicator"),
  boondStatusLabel: document.getElementById("boondStatusLabel"),
  boondTestBtn: document.getElementById("boondTestBtn"),
  // Actions rapides
  actionsSection: document.getElementById("actionsSection"),
  actionFeedback: document.getElementById("actionFeedback"),
  actionCommentSp: document.getElementById("actionCommentSp"),
  historySectionSp: document.getElementById("historySectionSp"),
  historyContentSp: document.getElementById("historyContentSp"),
  historyToggleSp: document.getElementById("historyToggleSp"),
  // Tags & Email dropdown
  tagsContainerSp: document.getElementById("tagsContainerSp"),
  emailDropdownSp: document.getElementById("emailDropdownSp"),
  emailBtnSp: document.getElementById("emailBtnSp"),
  emailMenuSp: document.getElementById("emailMenuSp"),
  emailSuggestionSp: document.getElementById("emailSuggestionSp"),
  suggestedTemplateName: document.getElementById("suggestedTemplateName"),
  // Outlook elements
  outlookClientId: document.getElementById("outlookClientId"),
  outlookConnectBtn: document.getElementById("outlookConnectBtn"),
  outlookDisconnectBtn: document.getElementById("outlookDisconnectBtn"),
  outlookStatusIndicator: document.getElementById("outlookStatusIndicator"),
  outlookStatusLabel: document.getElementById("outlookStatusLabel"),
  outlookUserEmail: document.getElementById("outlookUserEmail")
};

// Cles de stockage
const STORAGE_KEY = "agate_current_form";
// Debounce timer pour la sauvegarde
let saveTimer = null;

// Outlook state
let isOutlookConnected = false;
let currentDraftId = null;

// ACTION_CONFIG et NEXT_ACTION_MAP sont dans shared-config.js (charge avant par sidepanel.html)

// Page Notion actuellement active (apres envoi reussi)
let currentNotionPageId = null;

// === INDICATEUR DE SAUVEGARDE ===
const saveIndicator = document.createElement("div");
saveIndicator.className = "save-indicator";
saveIndicator.textContent = "Sauvegarde auto";
document.body.appendChild(saveIndicator);

function flashSaveIndicator() {
  saveIndicator.classList.add("visible");
  setTimeout(() => saveIndicator.classList.remove("visible"), 800);
}

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
const toastContainer = document.createElement("div");
toastContainer.className = "toast-container";
document.body.appendChild(toastContainer);

const TOAST_ICONS = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

function showToast(message, type = "info", duration = 3500) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || "ℹ"}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duration);
}

// Tags du prospect courant (shared across functions)
let currentTags = [];

// Données IA (headline, aboutText, cache des pitchs)
let currentHeadline = "";
let currentAboutText = "";
const aiCache = {}; // clé = linkedinUrl, valeur = pitch

// ============================================================
// TAGS DISPLAY (Sidepanel)
// EMAIL_TEMPLATES, TAG_CATEGORY_MAP, detectBestEmailTemplate sont dans shared-config.js
// ============================================================

/**
 * Affiche les tags technos dans le container du sidepanel
 */
function renderTagsSp(tags) {
  currentTags = tags || [];
  const container = el.tagsContainerSp;
  if (!container) return;

  container.innerHTML = "";

  if (!currentTags.length) {
    const placeholder = document.createElement("span");
    placeholder.className = "tag-placeholder-sp";
    placeholder.textContent = "Aucun tag détecté";
    container.appendChild(placeholder);
    return;
  }

  currentTags.forEach((tag, index) => {
    const span = document.createElement("span");
    span.className = "tech-tag-sp";
    const category = TAG_CATEGORY_MAP[tag];
    if (category) span.setAttribute("data-category", category);

    // Texte du tag
    span.appendChild(document.createTextNode(tag));

    // Bouton supprimer
    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-tag-sp";
    removeBtn.textContent = "×";
    removeBtn.dataset.index = index;
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentTags.splice(parseInt(e.target.dataset.index), 1);
      renderTagsSp(currentTags);
      saveFormData();
    });
    span.appendChild(removeBtn);

    container.appendChild(span);
  });

  // Mettre a jour la suggestion email
  updateEmailRecommendationSp(currentTags);
}

/**
 * Compose et ouvre un mailto avec le template selectionne
 */
function sendEmailWithTemplateSp(templateKey) {
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) return;

  const email = el.fieldEmail.value.trim();
  if (!email) {
    showToast("Aucun email disponible", "warning");
    return;
  }

  const prenom = (el.fieldName.value.trim().split(" ")[0]) || "Bonjour";
  const entreprise = el.fieldCompany.value.trim() || "";
  const poste = el.fieldJobTitle ? el.fieldJobTitle.value.trim() : "";
  const secteur = el.fieldSector ? el.fieldSector.value.trim() : "";
  const tagsEls = document.querySelectorAll("#tagsContainer .tag");
  const tags = Array.from(tagsEls).map(t => t.textContent.replace("×", "").trim()).join(", ");

  const body = template.body
    .replace(/\{prenom\}/g, prenom)
    .replace(/\{entreprise\}/g, entreprise)
    .replace(/\{poste\}/g, poste)
    .replace(/\{secteur\}/g, secteur)
    .replace(/\{tags\}/g, tags);

  const subject = encodeURIComponent(template.subject);
  const encodedBody = encodeURIComponent(body);

  window.open(`mailto:${email}?subject=${subject}&body=${encodedBody}`, "_blank");

  updateStatus("connected", "Mail ouvert...");
  if (el.actionFeedback) {
    el.actionFeedback.textContent = `✉️ ${template.label} → ${email}`;
    el.actionFeedback.style.display = "block";
    el.actionFeedback.style.color = "var(--info)";
    el.actionFeedback.style.background = "rgba(52, 152, 219, 0.12)";
    el.actionFeedback.style.borderColor = "rgba(52, 152, 219, 0.4)";
  }

  // Fermer le dropdown
  if (el.emailDropdownSp) el.emailDropdownSp.classList.remove("open");
}

/**
 * Met a jour la suggestion de template email en fonction des tags
 */
function updateEmailRecommendationSp(tags) {
  const suggested = detectBestEmailTemplate(tags);
  const suggestionEl = el.emailSuggestionSp;
  const nameEl = el.suggestedTemplateName;

  if (!suggestionEl || !nameEl) return;

  // Reset recommended class on all options
  document.querySelectorAll(".email-template-option-sp").forEach(opt => {
    opt.classList.remove("recommended");
  });

  if (suggested && EMAIL_TEMPLATES[suggested]) {
    suggestionEl.style.display = "flex";
    nameEl.textContent = EMAIL_TEMPLATES[suggested].label;

    // Highlight the recommended option
    const recommendedBtn = document.querySelector(`.email-template-option-sp[data-template="${suggested}"]`);
    if (recommendedBtn) recommendedBtn.classList.add("recommended");

    // Clic sur la suggestion → envoyer avec ce template
    suggestionEl.onclick = (e) => {
      e.stopPropagation();
      sendEmailWithTemplateSp(suggested);
    };
  } else {
    suggestionEl.style.display = "none";
    nameEl.textContent = "";
  }
}

// ============================================================
// TEMPLATES EMAIL PERSONNALISÉS
// ============================================================

/**
 * Charge les templates custom depuis chrome.storage.local
 */
async function loadCustomTemplates() {
  const data = await chrome.storage.local.get("agate_custom_templates");
  return data.agate_custom_templates || [];
}

/**
 * Sauvegarde un nouveau template custom ou met à jour un existant
 */
async function saveCustomTemplate(template) {
  const templates = await loadCustomTemplates();
  const existingIdx = templates.findIndex(t => t.id === template.id);
  if (existingIdx >= 0) {
    templates[existingIdx] = template;
  } else {
    template.id = "custom_" + Date.now();
    templates.push(template);
  }
  await chrome.storage.local.set({ agate_custom_templates: templates });
  return template;
}

/**
 * Supprime un template custom par ID
 */
async function deleteCustomTemplate(templateId) {
  const templates = await loadCustomTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  await chrome.storage.local.set({ agate_custom_templates: filtered });
}

/**
 * Injecte les templates custom dans le dropdown email du side panel
 */
async function injectCustomTemplatesInDropdown() {
  const menu = el.emailMenuSp;
  if (!menu) return;

  // Supprimer les anciens éléments custom
  menu.querySelectorAll(".custom-template-option, .custom-template-divider").forEach(e => e.remove());

  const templates = await loadCustomTemplates();
  if (templates.length === 0) return;

  // Ajouter un séparateur
  const divider = document.createElement("div");
  divider.className = "email-menu-divider-sp custom-template-divider";
  menu.appendChild(divider);

  // Ajouter chaque template custom
  templates.forEach(tpl => {
    const btn = document.createElement("button");
    btn.className = "email-template-option-sp custom-template-option";
    btn.textContent = `📝 ${tpl.name}`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Créer un template temporaire compatible avec sendEmailWithTemplateSp
      const tempKey = "__custom__" + tpl.id;
      EMAIL_TEMPLATES[tempKey] = {
        label: tpl.name,
        subject: tpl.subject,
        body: tpl.body,
        matchTags: []
      };
      sendEmailWithTemplateSp(tempKey);
      // Nettoyer après usage
      delete EMAIL_TEMPLATES[tempKey];
    });
    menu.appendChild(btn);
  });
}

/**
 * Affiche la liste des templates dans les settings
 */
async function renderCustomTemplatesList() {
  const list = document.getElementById("customTemplatesList");
  if (!list) return;

  const templates = await loadCustomTemplates();

  if (templates.length === 0) {
    list.innerHTML = '<div class="template-empty">Aucun template personnalisé</div>';
    return;
  }

  list.innerHTML = templates.map(tpl => `
    <div class="template-item" data-id="${tpl.id}">
      <span class="template-item-name">📝 ${escapeHtml(tpl.name)}</span>
      <div class="template-item-actions">
        <button class="template-edit-btn" title="Modifier">✏️</button>
        <button class="template-delete-btn" title="Supprimer">🗑️</button>
      </div>
    </div>
  `).join("");

  // Listeners edit/delete
  list.querySelectorAll(".template-edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".template-item").dataset.id;
      const templates = await loadCustomTemplates();
      const tpl = templates.find(t => t.id === id);
      if (tpl) openTemplateEditor(tpl);
    });
  });

  list.querySelectorAll(".template-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".template-item").dataset.id;
      if (confirm("Supprimer ce template ?")) {
        await deleteCustomTemplate(id);
        await renderCustomTemplatesList();
        await injectCustomTemplatesInDropdown();
        showToast("Template supprimé", "success");
      }
    });
  });
}

/**
 * Ouvre l'éditeur de template (nouveau ou édition)
 */
function openTemplateEditor(existingTemplate = null) {
  const editor = document.getElementById("templateEditorForm");
  const nameInput = document.getElementById("templateEditorName");
  const subjectInput = document.getElementById("templateEditorSubject");
  const bodyInput = document.getElementById("templateEditorBody");
  if (!editor || !nameInput || !subjectInput || !bodyInput) return;

  editor.style.display = "block";
  editor.dataset.editId = existingTemplate ? existingTemplate.id : "";

  nameInput.value = existingTemplate ? existingTemplate.name : "";
  subjectInput.value = existingTemplate ? existingTemplate.subject : "";
  bodyInput.value = existingTemplate ? existingTemplate.body : "";

  nameInput.focus();
}

/**
 * Ferme l'éditeur de template
 */
function closeTemplateEditor() {
  const editor = document.getElementById("templateEditorForm");
  if (editor) editor.style.display = "none";
}

/**
 * Setup des événements de l'éditeur de template (appelé au DOMContentLoaded)
 */
function setupTemplateEditor() {
  // Bouton "Nouveau template"
  const newBtn = document.getElementById("newTemplateBtn");
  if (newBtn) newBtn.addEventListener("click", () => openTemplateEditor());

  // Bouton Sauvegarder
  const saveBtn = document.getElementById("templateEditorSave");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const nameInput = document.getElementById("templateEditorName");
      const subjectInput = document.getElementById("templateEditorSubject");
      const bodyInput = document.getElementById("templateEditorBody");
      const editor = document.getElementById("templateEditorForm");

      const name = nameInput.value.trim();
      const subject = subjectInput.value.trim();
      const body = bodyInput.value.trim();

      if (!name || !subject || !body) {
        showToast("Tous les champs sont requis", "warning");
        return;
      }

      const template = { name, subject, body };
      const editId = editor.dataset.editId;
      if (editId) template.id = editId;

      await saveCustomTemplate(template);
      closeTemplateEditor();
      await renderCustomTemplatesList();
      await injectCustomTemplatesInDropdown();
      showToast("Template sauvegardé !", "success");
    });
  }

  // Bouton Annuler
  const cancelBtn = document.getElementById("templateEditorCancel");
  if (cancelBtn) cancelBtn.addEventListener("click", closeTemplateEditor);

  // Charger la liste initiale
  renderCustomTemplatesList();
  injectCustomTemplatesInDropdown();
}

// ============================================================
// ENRICHISSEMENT IA - Pitch automatique via OpenAI
// ============================================================

/**
 * Affiche la section IA (bouton "Générer") si la clé API est configurée
 * Ne déclenche PAS de génération — économise les appels API
 */
async function showAISectionIfConfigured() {
  const section = document.getElementById("aiEnrichSection");
  if (!section) return;

  const settings = await chrome.storage.local.get(["openaiApiKey"]);
  const name = el.fieldName?.value?.trim();

  if (!settings.openaiApiKey || !name) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";

  // Vérifier le cache — si un pitch existe déjà, l'afficher directement
  const linkedinUrl = el.fieldLinkedin?.value?.trim() || name;
  const cacheKey = `ai_cache_${linkedinUrl}`;

  // Cache mémoire
  if (aiCache[linkedinUrl]) {
    showCachedPitch(aiCache[linkedinUrl]);
    return;
  }

  // Cache storage
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) {
    aiCache[linkedinUrl] = cached[cacheKey];
    showCachedPitch(cached[cacheKey]);
    return;
  }

  // Pas de cache → montrer le bouton "Générer"
  const generateBtn = document.getElementById("aiGenerateBtn");
  const resultEl = document.getElementById("aiResult");
  const loadingEl = document.getElementById("aiLoading");
  const errorEl = document.getElementById("aiError");
  if (generateBtn) generateBtn.style.display = "block";
  if (resultEl) resultEl.style.display = "none";
  if (loadingEl) loadingEl.style.display = "none";
  if (errorEl) errorEl.style.display = "none";
}

/** Affiche un pitch depuis le cache (sans appel API) */
function showCachedPitch(pitch) {
  const generateBtn = document.getElementById("aiGenerateBtn");
  const resultEl = document.getElementById("aiResult");
  const pitchText = document.getElementById("aiPitchText");
  const loadingEl = document.getElementById("aiLoading");
  const errorEl = document.getElementById("aiError");

  if (generateBtn) generateBtn.style.display = "none";
  if (loadingEl) loadingEl.style.display = "none";
  if (errorEl) errorEl.style.display = "none";
  if (pitchText) pitchText.textContent = pitch;
  if (resultEl) resultEl.style.display = "block";
}

/**
 * Génère un pitch IA personnalisé pour le prospect courant
 * Appelé uniquement au clic sur "Générer" ou "Régénérer"
 * @param {boolean} forceRefresh - Si true, ignore le cache
 */
async function generateAIPitch(forceRefresh = false) {
  const section = document.getElementById("aiEnrichSection");
  const generateBtn = document.getElementById("aiGenerateBtn");
  const loadingEl = document.getElementById("aiLoading");
  const resultEl = document.getElementById("aiResult");
  const errorEl = document.getElementById("aiError");
  const pitchText = document.getElementById("aiPitchText");

  if (!section || !loadingEl || !resultEl || !pitchText) return;

  const settings = await chrome.storage.local.get(["openaiApiKey"]);
  if (!settings.openaiApiKey) return;

  const name = el.fieldName?.value?.trim();
  if (!name) return;

  // Masquer le bouton, afficher le loading
  if (generateBtn) generateBtn.style.display = "none";
  loadingEl.style.display = "flex";
  resultEl.style.display = "none";
  errorEl.style.display = "none";

  // Construire les données pour l'IA
  const tagsEls = document.querySelectorAll("#tagsContainer .tag");
  const tags = Array.from(tagsEls).map(t => t.textContent.replace("×", "").trim()).join(", ");

  const data = {
    name: name,
    company: el.fieldCompany?.value?.trim() || "",
    jobTitle: el.fieldJobTitle?.value?.trim() || "",
    sector: el.fieldSector?.value?.trim() || "",
    tags: tags,
    headline: currentHeadline || "",
    aboutText: (currentAboutText || "").substring(0, 500),
    status: el.fieldStatus?.value?.trim() || "A contacter",
    isExisting: isUpdateMode
  };

  // Clé de cache
  const linkedinUrl = el.fieldLinkedin?.value?.trim() || name;
  const cacheKey = `ai_cache_${linkedinUrl}`;

  try {
    const result = await chrome.runtime.sendMessage({
      action: "generateAISummary",
      data: data,
      openaiApiKey: settings.openaiApiKey
    });

    loadingEl.style.display = "none";

    if (result.success) {
      pitchText.textContent = result.pitch;
      resultEl.style.display = "block";
      errorEl.style.display = "none";

      // Mettre en cache
      aiCache[linkedinUrl] = result.pitch;
      const storageObj = {};
      storageObj[cacheKey] = result.pitch;
      chrome.storage.local.set(storageObj);
    } else {
      errorEl.textContent = "⚠️ " + (result.error || "Erreur inconnue");
      errorEl.style.display = "block";
      if (generateBtn) generateBtn.style.display = "block";
    }
  } catch (err) {
    loadingEl.style.display = "none";
    errorEl.textContent = "⚠️ Erreur de connexion";
    errorEl.style.display = "block";
    if (generateBtn) generateBtn.style.display = "block";
    console.error("[AGATE] Erreur pitch IA:", err);
  }
}

/**
 * Setup des événements de la section IA (appelé au DOMContentLoaded)
 */
function setupAISection() {
  // Bouton Générer (clic manuel)
  const generateBtn = document.getElementById("aiGenerateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      generateAIPitch(false);
    });
  }

  // Bouton Copier
  const copyBtn = document.getElementById("aiCopyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = document.getElementById("aiPitchText")?.textContent;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Pitch copié !", "success");
          copyBtn.textContent = "✅ Copié";
          setTimeout(() => copyBtn.textContent = "📋 Copier", 2000);
        });
      }
    });
  }

  // Bouton Régénérer
  const refreshBtn = document.getElementById("aiRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      generateAIPitch(true);
    });
  }

  // Bouton Envoyer sur LinkedIn
  const sendLinkedinBtn = document.getElementById("aiSendLinkedinBtn");
  if (sendLinkedinBtn) {
    sendLinkedinBtn.addEventListener("click", async () => {
      const pitch = document.getElementById("aiPitchText")?.textContent;
      if (!pitch) return;

      // Copier dans le presse-papier
      await navigator.clipboard.writeText(pitch);

      // Trouver l'onglet LinkedIn actif
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes("linkedin.com")) {
        showToast("Ouvrez un profil LinkedIn d'abord", "warning");
        return;
      }

      // Envoyer au content script pour ouvrir la messagerie
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "openLinkedInMessage",
          pitch: pitch
        });
        showToast("Messagerie LinkedIn ouverte — collez le pitch !", "success");
        sendLinkedinBtn.textContent = "✅ Ouvert";
        setTimeout(() => sendLinkedinBtn.textContent = "💬 Envoyer sur LinkedIn", 2500);
      } catch (err) {
        console.error("[AGATE] Erreur ouverture messagerie:", err);
        showToast("Pitch copié ! Ouvrez la messagerie manuellement.", "info");
      }
    });
  }

}

// ============================================================
// SKELETON LOADERS
// ============================================================
function showSkeleton(container, type = "card", count = 3) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = `skeleton-${type}`;
    el.style.animationDelay = `${i * 0.1}s`;
    container.appendChild(el);
  }
}

// ============================================================
// CONFIRMATION DIALOG
// ============================================================
function showConfirm(title, text, icon = "⚠️") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-icon">${icon}</div>
        <div class="confirm-dialog-title">${title}</div>
        <div class="confirm-dialog-text">${text}</div>
        <div class="confirm-dialog-buttons">
          <button class="btn-secondary" id="confirmCancel">Annuler</button>
          <button class="btn-primary" id="confirmOk">Confirmer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector("#confirmOk").addEventListener("click", () => cleanup(true));
    overlay.querySelector("#confirmCancel").addEventListener("click", () => cleanup(false));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(false); });

    // ESC pour fermer
    const handleEsc = (e) => { if (e.key === "Escape") { cleanup(false); document.removeEventListener("keydown", handleEsc); } };
    document.addEventListener("keydown", handleEsc);
  });
}

// ============================================================
// DETECTION CONTACT EXISTANT DANS NOTION
// ============================================================
async function checkExistingContact(linkedinUrl) {
  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) return;

  try {
    const result = await chrome.runtime.sendMessage({
      action: "findByLinkedIn",
      linkedinUrl: linkedinUrl,
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    if (result.success && result.found) {
      // Contact existe deja !
      currentNotionPageId = result.pageId;
      showExistingContactBanner(result);
      // Afficher les actions rapides
      if (el.actionsSection) el.actionsSection.style.display = "block";
      // Changer le bouton en mode "Mettre a jour"
      setUpdateMode(true);
      // Remplir le formulaire avec les donnees Notion
      fillFormWithNotionData(result);
      // Charger l'historique des actions
      loadHistorySp();
      // Charger l'historique emails Outlook si connecté
      if (isOutlookConnected && result.email) loadEmailHistory();
      // Recalculer le score et afficher la suggestion de relance
      updateProspectScore();
      showSmartRelanceSuggestion();
    } else {
      hideExistingContactBanner();
      setUpdateMode(false);
    }
  } catch (error) {
    console.error("[AGATE] Erreur recherche contact:", error);
  }
}

function showExistingContactBanner(contactData) {
  // Supporter l'ancien format (name, status) pour compatibilité
  let name, status, lastActionDate, nextActionDate;
  if (typeof contactData === "string") {
    name = contactData;
    status = arguments[1] || "";
  } else {
    name = contactData.name || "";
    status = contactData.status || "";
    lastActionDate = contactData.lastActionDate;
    nextActionDate = contactData.nextActionDate;
  }

  let banner = document.getElementById("existingContactBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "existingContactBanner";
    // Inserer apres la status bar
    const statusBar = document.getElementById("statusBar");
    statusBar.parentNode.insertBefore(banner, statusBar.nextSibling);
  }

  banner.className = "existing-contact-banner enhanced";

  // Stocker les dates pour le scoring et les suggestions
  banner._lastActionDate = lastActionDate || null;
  banner._nextActionDate = nextActionDate || null;

  // Ligne 1 : Badge + Statut
  let html = `<div class="ecb-row">
    <span class="ecb-badge">✅ Déjà dans Notion</span>
    <span class="existing-status">${escapeHtml(status || "—")}</span>
  </div>`;

  // Ligne 2 : Dernière action (avec "il y a X jours")
  if (lastActionDate) {
    const lastDate = new Date(lastActionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    const lastLabel = lastDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    const agoText = daysSince === 0 ? "aujourd'hui" : daysSince === 1 ? "hier" : `il y a ${daysSince}j`;

    html += `<div class="ecb-detail">
      <span class="ecb-detail-icon">📅</span>
      <span>Dernière action : <strong>${lastLabel}</strong> (${agoText})</span>
    </div>`;
  }

  // Ligne 3 : Prochaine action
  if (nextActionDate) {
    const nextDate = new Date(nextActionDate);
    const nextLabel = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

    html += `<div class="ecb-detail">
      <span class="ecb-detail-icon">⏭️</span>
      <span>Prochaine action : <strong>${nextLabel}</strong></span>
    </div>`;
  }

  banner.innerHTML = html;
  banner.style.display = "flex";

  // Ajouter un indicateur visuel sur le formulaire
  const dataForm = document.getElementById("dataForm");
  if (dataForm) dataForm.classList.add("existing-in-notion");
}

function hideExistingContactBanner() {
  const banner = document.getElementById("existingContactBanner");
  if (banner) banner.style.display = "none";
  const dataForm = document.getElementById("dataForm");
  if (dataForm) dataForm.classList.remove("existing-in-notion");
}

/**
 * Remplit le formulaire avec les donnees provenant de Notion
 * Utilise quand un contact existant est detecte
 */
function fillFormWithNotionData(data) {
  // Mapper les donnees Notion vers les champs du formulaire
  // IMPORTANT : Pour nom, company, jobTitle → NE PAS écraser si l'extraction LinkedIn a déjà rempli
  // LinkedIn est la source de vérité pour ces champs (profil actuel)
  // Notion est la source de vérité pour : statut, notes, tags, email, phone, dates
  if (data.name) {
    const currentName = el.fieldName.value.trim();
    if (!currentName) {
      el.fieldName.value = formatName(data.name);
      el.fieldName.classList.add("auto-filled");
    } else {
      console.log("[AGATE] Nom LinkedIn conservé:", currentName, "(Notion:", data.name, ")");
    }
  }
  if (data.company) {
    const currentCompany = el.fieldCompany.value.trim();
    if (!currentCompany) {
      el.fieldCompany.value = data.company;
      el.fieldCompany.classList.add("auto-filled");
    } else {
      console.log("[AGATE] Organisation LinkedIn conservée:", currentCompany, "(Notion:", data.company, ")");
    }
  }
  if (data.jobTitle) {
    const currentJobTitle = el.fieldJobTitle.value.trim();
    if (!currentJobTitle) {
      el.fieldJobTitle.value = data.jobTitle;
      el.fieldJobTitle.classList.add("auto-filled");
    } else {
      console.log("[AGATE] Poste LinkedIn conservé:", currentJobTitle, "(Notion:", data.jobTitle, ")");
    }
  }
  if (data.sector) {
    // Secteur : préférer Notion (plus fiable car saisi/validé par l'utilisateur)
    el.fieldSector.value = data.sector;
    el.fieldSector.classList.add("auto-filled");
  }
  if (data.status) {
    // Mapper les statuts Notion (avec accents) vers les valeurs du formulaire (sans accents)
    const statusMapping = {
      "À contacter": "A contacter",
      "Mail envoyé": "Mail envoye",
      "NRP": "NRP",
      "Pas intéressé": "Pas interesse",
      "RDV pris": "RDV pris",
      "Pas de prestation": "Pas de projet",
      "À rappeler": "A rappeler",
      "R1": "R1",
      "R2": "R2",
      "R3": "R3"
    };
    const formStatus = statusMapping[data.status] || data.status;
    el.fieldStatus.value = formStatus;
    el.fieldStatus.classList.add("auto-filled");
  }
  if (data.phone) {
    el.fieldPhone.value = data.phone;
    el.fieldPhone.classList.add("auto-filled");
  }
  if (data.phone2) {
    el.fieldPhone2.value = data.phone2;
    el.fieldPhone2.classList.add("auto-filled");
  }
  if (data.email) {
    el.fieldEmail.value = data.email;
    el.fieldEmail.classList.add("auto-filled");
  }
  if (data.linkedinUrl) {
    el.fieldLinkedin.value = data.linkedinUrl;
    el.fieldLinkedin.classList.add("auto-filled");
  }
  if (data.notes) {
    el.fieldNotes.value = data.notes;
    el.fieldNotes.classList.add("auto-filled");
  }

  // Tags technos (depuis Notion multi_select)
  if (data.tags && data.tags.length > 0) {
    renderTagsSp(data.tags);
  }

  // Sauvegarder les donnees restaurees
  saveFormData();

  console.log("[AGATE] Formulaire rempli avec les donnees Notion");
}

// Variable pour savoir si on est en mode mise a jour
let isUpdateMode = false;

function setUpdateMode(enabled) {
  isUpdateMode = enabled;
  if (enabled) {
    el.sendToNotion.innerHTML = '<span class="btn-icon">&#128260;</span> Mettre a jour dans Notion';
    el.sendToNotion.classList.add("btn-update-mode");
  } else {
    el.sendToNotion.innerHTML = '<span class="btn-icon">&#10148;</span> Envoyer dans Notion';
    el.sendToNotion.classList.remove("btn-update-mode");
  }
}

// ============================================================
// INITIALISATION
// ============================================================
// Variable pour suivre la derniere URL extraite (eviter doublons SPA)
let lastExtractedUrl = "";
// Versioning pour eviter les race conditions entre onActivated et urlChanged
let _extractionVersion = 0;
let _extractionLock = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await restoreFormData();
  setupAutoSave();
  setupLushaButtons();
  setupActions();
  setupSearch();
  setupPipelineRefresh();
  setupRemindersRefresh();
  await detectAndExtract();
  // Charger le badge rappels en arriere-plan
  loadReminderBadge();
  // Charger les secteurs depuis Notion (en arriere-plan)
  loadSectorsFromNotionSp();
  // Raccourcis clavier globaux
  setupKeyboardShortcuts();
  // Initialiser l'integration Outlook
  setupOutlook();
  // Bouton refresh Kanban Taches
  document.getElementById("refreshTasks")?.addEventListener("click", () => loadTasksView());
  // Bouton sélection en masse
  document.getElementById("massSelectBtn")?.addEventListener("click", () => toggleMassSelectionMode());
  // Kanban Drag & Drop + toggle vue
  setupKanbanDragDrop();
  setupKanbanViewToggle();
  // Recherche avancée (filtres secteur + tri)
  setupAdvancedSearch();
  // Templates email personnalisés
  setupTemplateEditor();
  // Section IA (pitch automatique)
  setupAISection();
  // Toggle thème clair/sombre
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("change", async () => {
      const theme = themeToggle.checked ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      await chrome.storage.local.set({ themePreference: theme });
    });
  }
});

// ============================================================
// CHARGEMENT DYNAMIQUE DES SECTEURS DEPUIS NOTION
// ============================================================
async function loadSectorsFromNotionSp() {
  try {
    const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
    if (!settings.notionApiKey || !settings.notionDatabaseId) return;

    const result = await chrome.runtime.sendMessage({
      action: "getSectors",
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    if (result.success && result.sectors && result.sectors.length > 0) {
      const datalist = document.getElementById("sectorListSp");
      if (datalist) {
        datalist.innerHTML = result.sectors.map(s => `<option value="${s}">`).join("");
      }
    }
  } catch (e) {
    console.error("[AGATE] Erreur chargement secteurs:", e);
  }
}

// ============================================================
// HISTORIQUE DES ACTIONS (Sidepanel)
// ============================================================
let showAllHistorySp = false;

async function loadHistorySp() {
  if (!currentNotionPageId) {
    if (el.historyContentSp) {
      el.historyContentSp.innerHTML = '<div class="history-empty-sp">Envoyez d\'abord dans Notion</div>';
    }
    return;
  }

  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) return;

  try {
    const result = await chrome.runtime.sendMessage({
      action: "getPageHistory",
      pageId: currentNotionPageId,
      apiKey: settings.notionApiKey
    });

    if (result.success && result.history) {
      displayHistorySp(result.history);
    }
  } catch (e) {
    console.error("[AGATE] Erreur chargement historique:", e);
  }
}

// Mapping action → icône + couleur pour la timeline
const HISTORY_ICONS = {
  "appeler":  { icon: "📞", color: "blue" },
  "appel":    { icon: "📞", color: "blue" },
  "mail":     { icon: "✉️", color: "blue" },
  "r1":       { icon: "🔄", color: "warning" },
  "r2":       { icon: "🔄", color: "warning" },
  "r3":       { icon: "🔄", color: "error" },
  "relance":  { icon: "🔄", color: "warning" },
  "rdv":      { icon: "📅", color: "green" },
  "rappeler": { icon: "🔔", color: "info" },
  "rappel":   { icon: "🔔", color: "info" },
  "nrp":      { icon: "📵", color: "error" },
};

function getHistoryIcon(action) {
  if (!action) return { icon: "📌", color: "blue" };
  const lower = action.toLowerCase().trim();
  // Chercher correspondance exacte puis partielle
  if (HISTORY_ICONS[lower]) return HISTORY_ICONS[lower];
  for (const [key, val] of Object.entries(HISTORY_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: "📌", color: "blue" };
}

function displayHistorySp(history) {
  const container = el.historyContentSp;
  if (!container) return;

  if (!history.entries || history.entries.length === 0) {
    if (!history.lastAction && !history.nextAction && !history.status) {
      container.innerHTML = '<div class="history-empty-sp">Aucune action enregistrée</div>';
      return;
    }

    let html = "";

    // Prochaine action
    if (history.nextAction) {
      html += buildNextActionHtml(history.nextAction);
    }

    // Statut
    if (history.status) {
      html += `<div class="history-item-sp status">
        <span class="history-icon-sp">📊</span>
        <span class="history-text-sp">Statut: <strong>${history.status}</strong></span>
      </div>`;
    }

    container.innerHTML = html;
    if (el.historyToggleSp) el.historyToggleSp.style.display = "none";
    return;
  }

  // Historique détaillé avec timeline visuelle
  let html = "";

  // Prochaine action en haut (hors timeline)
  if (history.nextAction) {
    html += buildNextActionHtml(history.nextAction);
  }

  // Timeline des entrées
  const maxEntries = showAllHistorySp ? history.entries.length : 5;
  const entries = history.entries.slice(0, maxEntries);

  html += '<div class="timeline">';

  entries.forEach(entry => {
    const parts = entry.split(" - ");
    const date = parts[0] || "";
    const action = parts[1] || "";
    const comment = parts.slice(2).join(" - ") || "";
    const { icon, color } = getHistoryIcon(action);

    html += `<div class="timeline-item">
      <div class="timeline-line"></div>
      <div class="timeline-dot color-${color}">${icon}</div>
      <div class="timeline-content">
        <div class="timeline-date">${escapeHtml(date)}</div>
        <div class="timeline-action">${escapeHtml(action)}</div>
        ${comment ? `<div class="timeline-comment">${escapeHtml(comment)}</div>` : ""}
      </div>
    </div>`;
  });

  html += '</div>';

  // Toggle voir tout
  if (history.entries.length > 5) {
    if (el.historyToggleSp) {
      el.historyToggleSp.textContent = showAllHistorySp ? "Réduire" : `Voir tout (${history.entries.length})`;
      el.historyToggleSp.style.display = "inline";
    }
  } else {
    if (el.historyToggleSp) el.historyToggleSp.style.display = "none";
  }

  container.innerHTML = html;
}

/** Helper : génère le HTML de la prochaine action */
function buildNextActionHtml(nextActionDate) {
  const nextDate = new Date(nextActionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
  const formattedDate = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  let statusClass = "future";
  let statusText = "";

  if (diffDays < 0) {
    statusClass = "overdue";
    statusText = ` ⚠️ ${Math.abs(diffDays)}j de retard`;
  } else if (diffDays === 0) {
    statusClass = "today";
    statusText = " - Aujourd'hui !";
  } else if (diffDays === 1) {
    statusText = " - Demain";
  } else if (diffDays <= 7) {
    statusText = ` - Dans ${diffDays}j`;
  }

  return `<div class="history-item-sp ${statusClass}">
    <span class="history-icon-sp">📅</span>
    <span class="history-text-sp">Prochaine: <strong>${formattedDate}</strong>${statusText}</span>
  </div>`;
}

// ============================================================
// DETECTION AUTOMATIQUE DE TAB
// Le side panel detecte quand vous changez d'onglet actif
// ============================================================
// Extraction protegee contre les race conditions
async function safeExtract(tabId, delayMs = 500) {
  if (_extractionLock) return;
  _extractionLock = true;
  const version = ++_extractionVersion;
  try {
    clearFormFields();
    chrome.storage.local.remove(STORAGE_KEY);
    currentNotionPageId = null;
    hideExistingContactBanner();
    if (el.actionsSection) el.actionsSection.style.display = "none";
    if (el.actionFeedback) el.actionFeedback.style.display = "none";
    el.successMsg.style.display = "none";
    el.errorMsg.style.display = "none";
    el.duplicateMsg.style.display = "none";
    updateStatus("loading", "Chargement du profil...");

    await delay(delayMs);

    // Verifier que cette extraction est toujours la plus recente
    if (version !== _extractionVersion) return;

    await extractFromTab(tabId, true);
  } finally {
    _extractionLock = false;
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.includes("linkedin.com/in/")) {
    const cleanUrl = tab.url.split("?")[0];
    if (cleanUrl !== lastExtractedUrl) {
      lastExtractedUrl = cleanUrl;
      await safeExtract(tab.id, 500);
    } else {
      updateStatus("connected", "Profil LinkedIn detecte");
    }
  } else {
    updateStatus("idle", "Naviguez sur un profil LinkedIn");
  }
});

// Ecouter les messages du content script (detection SPA LinkedIn via background relay)
chrome.runtime.onMessage.addListener(async (request, sender) => {
  if (request.action === "urlChanged" && request.url && request.url.includes("linkedin.com/in/")) {
    const cleanUrl = request.url.split("?")[0];
    if (cleanUrl === lastExtractedUrl) return;
    lastExtractedUrl = cleanUrl;

    updateStatus("loading", "Nouveau profil detecte...");

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url && activeTab.url.includes("linkedin.com/in/")) {
      await safeExtract(activeTab.id, 800);
    } else {
      updateStatus("idle", "Naviguez sur un profil LinkedIn");
    }
  }
});

// ============================================================
// EXTRACTION DES DONNEES
// ============================================================
async function detectAndExtract() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes("linkedin.com/in/")) {
      // Verifier s'il y a des donnees sauvegardees
      const saved = await chrome.storage.local.get([STORAGE_KEY]);
      if (saved[STORAGE_KEY] && saved[STORAGE_KEY].name) {
        // Restaurer les donnees precedentes
        el.dataForm.style.display = "block";
        el.notLinkedIn.style.display = "none";
        updateStatus("idle", "Donnees restaurees (session precedente)");
      } else {
        el.notLinkedIn.style.display = "flex";
        el.dataForm.style.display = "none";
        updateStatus("idle", "En attente d'un profil LinkedIn");
      }
      return;
    }

    await extractFromTab(tab.id, true);
  } catch (error) {
    console.error("Erreur detection:", error);
    updateStatus("error", "Erreur de detection");
  }
}

/**
 * Vide les champs du formulaire (sans toucher au storage)
 * Utilise avant de remplir avec un NOUVEAU profil
 */
function clearFormFields() {
  document.querySelectorAll("#dataForm input, #dataForm textarea").forEach(field => {
    field.value = "";
    field.classList.remove("auto-filled", "field-missing");
  });
  el.fieldSector.value = "";
  el.fieldStatus.value = "A contacter";
  el.fieldLinkedin.value = "";
  // Vider les tags
  renderTagsSp([]);
  // Reset les variables globales pour éviter de réutiliser les données d'un ancien profil
  currentHeadline = "";
  currentAboutText = "";
}

async function extractFromTab(tabId, isNewProfile = false) {
  updateStatus("loading", "Lecture des donnees...");
  el.loadingView.style.display = "flex";
  el.dataForm.style.display = "none";
  el.notLinkedIn.style.display = "none";

  try {
    // Essayer d'envoyer un message au content script avec retry backoff
    let response;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await chrome.tabs.sendMessage(tabId, { action: "extractData" });
        break; // Succes, sortir de la boucle
      } catch {
        if (attempt === 0) {
          // Premiere tentative echouee : injecter le content script
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
          });
        }
        // Backoff exponentiel: 500ms, 1000ms, 2000ms
        await delay(500 * Math.pow(2, attempt));
        if (attempt === maxRetries - 1) {
          throw new Error("Content script injection failed after retries");
        }
      }
    }

    if (response && response.name) {
      if (isNewProfile) {
        // Nouveau profil : vider le formulaire et ecraser avec les nouvelles donnees
        clearFormFields();
        populateForm(response, true);
      } else {
        // Refresh : garder les modifs manuelles de l'utilisateur
        populateForm(response, false);
      }
      el.loadingView.style.display = "none";
      el.dataForm.style.display = "block";
      updateStatus("connected", `${response.name} - ${response.company || "..."}`);

      // Verifier si le contact existe deja dans Notion
      if (response.linkedinUrl) {
        await checkExistingContact(response.linkedinUrl);
      }
    } else {
      el.loadingView.style.display = "none";
      el.dataForm.style.display = "block";
      updateStatus("idle", "Profil detecte (donnees partielles)");
    }

  } catch (error) {
    console.error("Erreur extraction:", error);
    el.loadingView.style.display = "none";

    // Montrer le formulaire quand meme (l'utilisateur peut saisir manuellement)
    const saved = await chrome.storage.local.get([STORAGE_KEY]);
    if (saved[STORAGE_KEY] && saved[STORAGE_KEY].name) {
      el.dataForm.style.display = "block";
      updateStatus("idle", "Extraction echouee - donnees restaurees");
    } else {
      el.dataForm.style.display = "block";
      updateStatus("error", "Extraction echouee - saisie manuelle possible");
    }
  }
}

// ============================================================
// REMPLISSAGE DU FORMULAIRE
// ============================================================
function populateForm(data, overwrite = true) {
  const fieldMap = {
    fieldName: formatName(data.name),
    fieldCompany: data.company,
    fieldJobTitle: data.jobTitle,
    fieldPhone: data.phone,
    fieldPhone2: data.phone2,
    fieldEmail: data.email,
    fieldLinkedin: data.linkedinUrl,
    fieldNotes: data.notes || ""
  };

  for (const [fieldId, value] of Object.entries(fieldMap)) {
    const field = el[fieldId];
    if (!field) continue;

    // Si overwrite=false, ne pas ecraser un champ deja rempli par l'utilisateur
    if (!overwrite && field.value.trim() !== "") continue;

    if (value) {
      field.value = value;
      field.classList.add("auto-filled");
      field.classList.remove("field-missing");
    } else if (fieldId !== "fieldPhone2" && fieldId !== "fieldNotes" && fieldId !== "fieldLinkedin") {
      if (!field.value.trim()) {
        field.classList.add("field-missing");
      }
    }
  }

  // Secteur
  if (data.sector && (overwrite || !el.fieldSector.value)) {
    el.fieldSector.value = data.sector;
    el.fieldSector.classList.add("auto-filled");
  }

  // Statut
  if (overwrite || !el.fieldStatus.value) {
    el.fieldStatus.value = data.status || "A contacter";
  }

  // Tags technos
  if (data.tags && data.tags.length > 0) {
    renderTagsSp(data.tags);
  }

  // Stocker headline/aboutText pour l'IA
  if (data.headline !== undefined) currentHeadline = data.headline;
  if (data.aboutText !== undefined) currentAboutText = data.aboutText;

  // Afficher la section IA (bouton visible, pas de génération automatique)
  showAISectionIfConfigured();

  // Mettre à jour le score prospect
  updateProspectScore();

  // Sauvegarder immediatement
  saveFormData();
}

// ============================================================
// SAUVEGARDE AUTOMATIQUE
// Les donnees sont sauvegardees a chaque modification
// ============================================================
function setupAutoSave() {
  const allFields = document.querySelectorAll("#dataForm input, #dataForm select, #dataForm textarea");

  allFields.forEach(field => {
    // Retirer les classes visuelles quand l'utilisateur modifie
    field.addEventListener("input", () => {
      field.classList.remove("auto-filled", "field-missing");
      debounceSave();
    });

    field.addEventListener("change", () => {
      field.classList.remove("auto-filled", "field-missing");
      saveFormData();
    });
  });
}

function debounceSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveFormData();
  }, 500);
}

function saveFormData() {
  const formData = getCurrentFormData();
  chrome.storage.local.set({ [STORAGE_KEY]: formData });
  flashSaveIndicator();
}

async function restoreFormData() {
  const saved = await chrome.storage.local.get([STORAGE_KEY]);
  if (saved[STORAGE_KEY]) {
    const data = saved[STORAGE_KEY];
    // Restaurer silencieusement
    for (const [key, value] of Object.entries(data)) {
      const fieldId = "field" + key.charAt(0).toUpperCase() + key.slice(1);
      const field = el[fieldId];
      if (field && value) {
        field.value = value;
      }
    }

    // Traitement special pour les selects
    if (data.sector) el.fieldSector.value = data.sector;
    if (data.status) el.fieldStatus.value = data.status;

    // Restaurer les tags
    if (data.tags && data.tags.length > 0) {
      renderTagsSp(data.tags);
    }

    // Si on a des donnees, montrer le formulaire
    if (data.name) {
      el.dataForm.style.display = "block";
      el.notLinkedIn.style.display = "none";
    }
  }
}

function getCurrentFormData() {
  return {
    name: el.fieldName.value.trim(),
    company: el.fieldCompany.value.trim(),
    jobTitle: el.fieldJobTitle.value.trim(),
    sector: el.fieldSector.value,
    status: el.fieldStatus.value,
    phone: el.fieldPhone.value.trim(),
    phone2: el.fieldPhone2.value.trim(),
    email: el.fieldEmail.value.trim(),
    linkedinUrl: el.fieldLinkedin.value.trim(),
    notes: el.fieldNotes.value.trim(),
    tags: currentTags || []
  };
}

// ============================================================
// BOUTONS LUSHA (enrichissement contact)
// Remplit email et telephones via l'API Lusha
// ============================================================
// Cle Lusha lue depuis chrome.storage.local (configuree dans les parametres)

// Cache pour eviter les appels API repetitifs sur le meme profil
let lushaCache = { linkedinUrl: null, result: null };

/**
 * Parse la reponse brute de l'API Lusha et en extrait email/phone/phone2
 * Structure Lusha V2 : { contact: { data: { emailAddresses: [...], phoneNumbers: [...] } } }
 */
function parseLushaResponse(raw) {
  // Naviguer dans la structure : result.contact.data || result.contact || result.data || result
  const data = raw?.contact?.data || raw?.contact || raw?.data || raw || {};

  // Emails : emailAddresses ou emails
  const rawEmails = data.emailAddresses || data.emails || [];
  const emails = (Array.isArray(rawEmails) ? rawEmails : []).sort((a, b) => {
    if (a.emailType === "work" && b.emailType !== "work") return -1;
    if (a.emailType !== "work" && b.emailType === "work") return 1;
    const conf = { "A+": 4, "A": 3, "B+": 2, "B": 1, "high": 4, "medium": 2, "low": 1 };
    return (conf[b.emailConfidence] || 0) - (conf[a.emailConfidence] || 0);
  });

  // Telephones : phoneNumbers ou phones, exclure doNotCall
  const rawPhones = data.phoneNumbers || data.phones || [];
  const phones = (Array.isArray(rawPhones) ? rawPhones : [])
    .filter(p => !p.doNotCall)
    .sort((a, b) => {
      const prio = { mobile: 3, work: 2, personal: 1 };
      return (prio[b.phoneType] || 0) - (prio[a.phoneType] || 0);
    });

  return {
    success: true,
    email: emails[0]?.email || null,
    phone: phones[0]?.number || phones[0]?.phone || null,
    phone2: phones[1]?.number || phones[1]?.phone || null,
    emailCount: emails.length,
    phoneCount: phones.length
  };
}

async function fetchLushaData() {
  const linkedinUrl = el.fieldLinkedin.value.trim();
  const fullName = el.fieldName.value.trim();
  const firstName = fullName.split(" ")[0];
  const lastName = fullName.split(" ").slice(1).join(" ");
  const companyName = el.fieldCompany.value.trim();

  if (!linkedinUrl && (!firstName || !lastName || !companyName)) {
    showToast("URL LinkedIn ou nom complet + entreprise requis", "warning");
    return null;
  }

  // Lire la cle Lusha depuis les parametres
  const lushaSettings = await chrome.storage.local.get(["lushaApiKey"]);
  if (!lushaSettings.lushaApiKey) {
    showToast("Clé API Lusha manquante - configurez dans les paramètres", "warning");
    return null;
  }

  // Verifier le cache — ne reutiliser que si le resultat contenait des donnees
  if (lushaCache.linkedinUrl === linkedinUrl && lushaCache.result && (lushaCache.result.email || lushaCache.result.phone)) {
    return lushaCache.result;
  }

  const response = await chrome.runtime.sendMessage({
    action: "enrichViaLusha",
    apiKey: lushaSettings.lushaApiKey,
    linkedinUrl,
    firstName,
    lastName,
    companyName
  });

  if (!response || !response.success) {
    return response; // Erreur deja formatee par background.js
  }

  // Parser le JSON brut cote client
  const result = parseLushaResponse(response.raw);
  console.log("[AGATE] Lusha parsed:", result.email, result.phone, result.phone2);

  // Ne mettre en cache que si on a obtenu des donnees
  if (result.email || result.phone) {
    lushaCache = { linkedinUrl, result };
  }

  return result;
}

function resetLushaBtns() {
  document.querySelectorAll(".lusha-field-btn").forEach(b => {
    b.disabled = false;
    const icon = b.querySelector(".lusha-btn-icon");
    const spinner = b.querySelector(".lusha-btn-spinner");
    if (icon) icon.style.display = "inline";
    if (spinner) spinner.style.display = "none";
  });
}

function setupLushaButtons() {
  document.querySelectorAll(".lusha-field-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-target");
      const targetField = document.getElementById(targetId);

      console.log("[AGATE] Lusha sidepanel btn clicked, target:", targetId);

      // UI loading
      document.querySelectorAll(".lusha-field-btn").forEach(b => b.disabled = true);
      const icon = btn.querySelector(".lusha-btn-icon");
      const spinner = btn.querySelector(".lusha-btn-spinner");
      if (icon) icon.style.display = "none";
      if (spinner) spinner.style.display = "inline-block";

      try {
        const result = await fetchLushaData();
        console.log("[AGATE] Lusha sidepanel result:", result);

        if (!result) {
          resetLushaBtns();
          return;
        }

        if (!result.success) {
          showToast(result.error, "error");
          resetLushaBtns();
          return;
        }

        // Determiner quelle donnee injecter selon le champ cible
        let value = null;
        if (targetId === "fieldPhone" && result.phone) {
          value = result.phone;
        } else if (targetId === "fieldPhone2" && result.phone2) {
          value = result.phone2;
        } else if (targetId === "fieldEmail" && result.email) {
          value = result.email;
        }

        if (value) {
          targetField.value = value;
          targetField.classList.remove("field-missing");
          targetField.classList.add("auto-filled");

          btn.classList.add("lusha-success");
          setTimeout(() => btn.classList.remove("lusha-success"), 2000);

          showToast("Enrichi via Lusha", "success");
          saveFormData();
        } else {
          showToast("Aucune donnée trouvée pour ce champ", "info");
        }

      } catch (err) {
        console.error("[AGATE] Erreur Lusha:", err);
        showToast("Erreur: " + err.message, "error");
      } finally {
        resetLushaBtns();
      }
    });
  });
}

// ============================================================
// BOUTON RAFRAICHIR
// Re-extrait les donnees sans ecraser les champs modifies
// ============================================================
el.refreshBtn.addEventListener("click", async () => {
  el.refreshBtn.style.animation = "spin 0.5s ease";
  setTimeout(() => el.refreshBtn.style.animation = "", 500);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && tab.url.includes("linkedin.com")) {
    await extractFromTab(tab.id);
  } else {
    updateStatus("idle", "Pas sur LinkedIn actuellement");
  }
});

// ============================================================
// NAVIGATION PAR ONGLETS
// ============================================================
const ALL_VIEWS = ["mainView", "settingsView", "remindersView", "searchView", "pipelineView", "tasksView"];

// ============================================================
// NAVIGATION STACK — Historique de navigation global
// Permet de revenir en arrière depuis n'importe quelle vue
// ============================================================
const navHistory = []; // Pile de navigation : ["mainView", "searchView", "mainView", ...]
let currentViewId = "mainView";

/**
 * Navigue vers une vue
 * @param {string} viewId - L'id de la vue cible
 * @param {boolean} pushToHistory - true = ajouter à l'historique (défaut), false = remplacement (retour)
 */
function switchView(viewId, pushToHistory = true) {
  // Ne rien faire si on est déjà sur cette vue
  if (viewId === currentViewId) return;

  // Empiler la vue courante dans l'historique
  if (pushToHistory && currentViewId) {
    navHistory.push(currentViewId);
    // Limiter la pile à 20 entrées max
    if (navHistory.length > 20) navHistory.shift();
  }

  currentViewId = viewId;

  ALL_VIEWS.forEach(id => {
    const view = document.getElementById(id);
    if (view) view.style.display = "none";
  });
  const target = document.getElementById(viewId);
  if (target) target.style.display = "block";
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  // Mettre à jour le bouton retour global
  updateGlobalBackBtn();

  // Charger les donnees de la vue activee
  if (viewId === "remindersView") loadRemindersView();
  if (viewId === "searchView") focusSearchInput();
  if (viewId === "pipelineView") loadPipelineView();
  if (viewId === "tasksView") loadTasksView();
}

/** Retourne à la vue précédente dans l'historique */
function navigateBack() {
  if (navHistory.length === 0) return;
  const prevView = navHistory.pop();
  switchView(prevView, false); // false = ne pas re-empiler
}

/** Met à jour le bouton retour global dans le header */
function updateGlobalBackBtn() {
  const btn = document.getElementById("globalBackBtn");
  if (!btn) return;
  btn.style.display = navHistory.length > 0 ? "inline-flex" : "none";
}

// Setup onglets
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Clic direct sur un onglet = vider l'historique (navigation "racine")
    navHistory.length = 0;
    switchView(btn.dataset.view, false);
    updateGlobalBackBtn();
  });
});

// Bouton Retour global dans le header
document.getElementById("globalBackBtn")?.addEventListener("click", () => navigateBack());

// ============================================================
// NAVIGATION PARAMETRES (utilise switchView)
// ============================================================
el.settingsBtn.addEventListener("click", () => {
  switchView("settingsView");
});

el.backBtn.addEventListener("click", () => {
  navigateBack();
});

// ============================================================
// SAUVEGARDER PARAMETRES
// ============================================================
el.saveSettings.addEventListener("click", async () => {
  const apiKey = el.notionApiKey.value.trim();
  let databaseId = el.notionDatabaseId.value.trim();

  if (!apiKey || !databaseId) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  // Nettoyer l'ID de base : accepte URL complete, ID brut, ou UUID
  // Ex: https://www.notion.so/workspace/2fc6b05b02f98080bdbacbc84cb2515a?v=xxx
  //  -> 2fc6b05b-02f9-8080-bdba-cbc84cb2515a
  databaseId = cleanNotionDatabaseId(databaseId);

  // Mettre a jour le champ avec l'ID nettoye pour que l'utilisateur voie le resultat
  el.notionDatabaseId.value = databaseId;

  // Sauvegarder Notion + Lusha (optionnel) + Outlook Client ID
  const lushaField = document.getElementById("lushaApiKey");
  const lushaApiKey = lushaField ? lushaField.value.trim() : "";
  const storageData = { notionApiKey: apiKey, notionDatabaseId: databaseId };
  if (lushaApiKey) storageData.lushaApiKey = lushaApiKey;
  // Outlook Client ID (sauvegardé aussi via setupOutlook, mais on le garde ici pour cohérence)
  const outlookId = el.outlookClientId ? el.outlookClientId.value.trim() : "";
  if (outlookId) storageData.outlookClientId = outlookId;
  // OpenAI API Key
  const openaiField = document.getElementById("openaiApiKey");
  const openaiKey = openaiField ? openaiField.value.trim() : "";
  if (openaiKey) storageData.openaiApiKey = openaiKey;
  // BoondManager credentials
  const boondInst = el.boondInstance ? el.boondInstance.value.trim() : "";
  const boondUT = el.boondUserToken ? el.boondUserToken.value.trim() : "";
  const boondCT = el.boondClientToken ? el.boondClientToken.value.trim() : "";
  const boondCK = el.boondClientKey ? el.boondClientKey.value.trim() : "";
  if (boondInst) storageData.boondInstance = boondInst;
  if (boondUT) storageData.boondUserToken = boondUT;
  if (boondCT) storageData.boondClientToken = boondCT;
  if (boondCK) storageData.boondClientKey = boondCK;
  await chrome.storage.local.set(storageData);

  // Mettre a jour le statut Boond apres sauvegarde
  updateBoondStatus();

  el.settingsSuccess.style.display = "flex";
  setTimeout(() => el.settingsSuccess.style.display = "none", 2500);
});

async function loadSettings() {
  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId", "lushaApiKey", "outlookClientId", "themePreference", "openaiApiKey", "boondInstance", "boondUserToken", "boondClientToken", "boondClientKey"]);
  if (settings.notionApiKey) el.notionApiKey.value = settings.notionApiKey;
  if (settings.notionDatabaseId) el.notionDatabaseId.value = settings.notionDatabaseId;
  const lushaField = document.getElementById("lushaApiKey");
  if (lushaField && settings.lushaApiKey) lushaField.value = settings.lushaApiKey;
  // Outlook Client ID
  if (settings.outlookClientId && el.outlookClientId) {
    el.outlookClientId.value = settings.outlookClientId;
  }
  // OpenAI API Key
  const openaiField = document.getElementById("openaiApiKey");
  if (openaiField && settings.openaiApiKey) openaiField.value = settings.openaiApiKey;
  // BoondManager credentials
  if (settings.boondInstance && el.boondInstance) el.boondInstance.value = settings.boondInstance;
  if (settings.boondUserToken && el.boondUserToken) el.boondUserToken.value = settings.boondUserToken;
  if (settings.boondClientToken && el.boondClientToken) el.boondClientToken.value = settings.boondClientToken;
  if (settings.boondClientKey && el.boondClientKey) el.boondClientKey.value = settings.boondClientKey;
  // Thème clair/sombre
  const theme = settings.themePreference || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.checked = (theme === "light");
  // Mettre a jour le statut Boond
  updateBoondStatus();
}

// ============================================================
// ENVOI / MISE A JOUR VERS NOTION
// ============================================================
el.sendToNotion.addEventListener("click", async () => {
  // Cacher les messages
  el.successMsg.style.display = "none";
  el.errorMsg.style.display = "none";

  // Verifier parametres
  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    el.errorText.textContent = "Configurez d'abord votre cle API et ID de base dans les parametres.";
    el.errorMsg.style.display = "flex";
    return;
  }

  // Verifier nom
  if (!el.fieldName.value.trim()) {
    el.errorText.textContent = "Le nom du prospect est obligatoire.";
    el.errorMsg.style.display = "flex";
    return;
  }

  // Confirmation avant ecrasement en mode update
  if (isUpdateMode && currentNotionPageId) {
    const confirmed = await showConfirm(
      "Mettre a jour la fiche ?",
      "Les donnees actuelles dans Notion seront remplacees par celles du formulaire.",
      "📝"
    );
    if (!confirmed) return;
  }

  // UI loading
  el.sendToNotion.disabled = true;
  const originalBtnClass = el.sendToNotion.classList.contains("btn-update-mode");
  el.sendToNotion.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Envoi...';

  try {
    const prospectData = getCurrentFormData();
    let result;

    if (isUpdateMode && currentNotionPageId) {
      // MODE MISE A JOUR : contact existe deja
      result = await chrome.runtime.sendMessage({
        action: "updateNotionPageFull",
        pageId: currentNotionPageId,
        data: prospectData,
        apiKey: settings.notionApiKey
      });

      if (result.success) {
        el.successMsg.style.display = "flex";
        el.successMsg.querySelector("span:last-child").textContent = "Fiche mise a jour !";
        el.sendToNotion.innerHTML = '<span class="btn-icon">&#10003;</span> Mis a jour !';
        el.sendToNotion.classList.add("btn-success-anim");
        updateStatus("connected", "Fiche mise a jour dans Notion !");
        showToast("Fiche mise a jour !", "success");
        loadHistorySp();

        setTimeout(() => {
          setUpdateMode(true); // Rester en mode update
          el.sendToNotion.classList.remove("btn-success-anim");
          el.sendToNotion.style.background = "";
          el.sendToNotion.disabled = false;
          el.successMsg.querySelector("span:last-child").textContent = "Prospect ajoute dans Notion !";
        }, 2000);
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }

    } else {
      // MODE CREATION : nouveau contact
      result = await chrome.runtime.sendMessage({
        action: "sendToNotion",
        data: prospectData,
        apiKey: settings.notionApiKey,
        databaseId: settings.notionDatabaseId
      });

      if (result.success) {
        el.successMsg.style.display = "flex";
        el.sendToNotion.innerHTML = '<span class="btn-icon">&#10003;</span> Envoye !';
        el.sendToNotion.classList.add("btn-success-anim");
        updateStatus("connected", "Prospect envoye dans Notion !");
        showToast("Prospect ajoute dans Notion !", "success");

        // Effacer la sauvegarde apres envoi reussi
        chrome.storage.local.remove(STORAGE_KEY);

        // Stocker le pageId pour les actions de relance
        currentNotionPageId = result.pageId;

        // Afficher la section actions rapides
        if (el.actionsSection) {
          el.actionsSection.style.display = "block";
          if (el.actionFeedback) el.actionFeedback.style.display = "none";
        }
        // Charger l'historique (pageId maintenant disponible)
        loadHistorySp();

        // Passer en mode mise a jour maintenant que le contact existe
        setTimeout(() => {
          setUpdateMode(true);
          el.sendToNotion.classList.remove("btn-success-anim");
          el.sendToNotion.style.background = "";
          el.sendToNotion.disabled = false;
          showExistingContactBanner(prospectData.name, prospectData.status);
        }, 2000);

      } else if (result.duplicate) {
        // Doublon detecte -> passer en mode mise a jour
        currentNotionPageId = result.duplicatePageId;
        setUpdateMode(true);
        el.sendToNotion.disabled = false;
        updateStatus("idle", "Contact existe - cliquez pour mettre a jour");
        showExistingContactBanner(prospectData.name, "");
        if (el.actionsSection) el.actionsSection.style.display = "block";

      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    }

  } catch (error) {
    console.error("Erreur envoi:", error);
    el.errorText.textContent = error.message;
    el.errorMsg.style.display = "flex";
    showToast(error.message, "error");
    el.sendToNotion.disabled = false;
    // Restaurer le bouton selon le mode
    if (isUpdateMode) {
      setUpdateMode(true);
    } else {
      setUpdateMode(false);
    }
    updateStatus("error", "Erreur d'envoi");
  }
});

// ============================================================
// UTILITAIRES
// ============================================================
function updateStatus(state, text) {
  el.statusDot.className = "status-dot";
  if (state === "connected") el.statusDot.classList.add("connected");
  else if (state === "error") el.statusDot.classList.add("error");
  else if (state === "loading") el.statusDot.classList.add("loading");
  el.statusText.textContent = text;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// RACCOURCIS CLAVIER
// ============================================================
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // ESC : fermer modal action suivante
    if (e.key === "Escape") {
      const modal = document.getElementById("nextActionModal");
      if (modal && modal.style.display !== "none") {
        modal.style.display = "none";
        return;
      }
      // ESC : revenir en arrière (ou rien si pas d'historique)
      if (navHistory.length > 0) {
        navigateBack();
      }
    }

    // Cmd+K / Ctrl+K : ouvrir la recherche
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      switchView("searchView");
      setTimeout(() => document.getElementById("searchInput")?.focus(), 100);
    }
  });
}

/**
 * Nettoie et formate l'ID de base Notion
 * Accepte :
 *   - URL complete : https://www.notion.so/workspace/2fc6b05b02f98080bdbacbc84cb2515a?v=2fc6b05b02f9816c919...
 *   - ID brut : 2fc6b05b02f98080bdbacbc84cb2515a
 *   - UUID deja formate : 2fc6b05b-02f9-8080-bdba-cbc84cb2515a
 * Retourne un UUID valide : 2fc6b05b-02f9-8080-bdba-cbc84cb2515a
 */
function cleanNotionDatabaseId(rawId) {
  if (!rawId) return rawId;

  let id = rawId.trim();

  // Si c'est une URL, extraire l'ID
  if (id.includes("notion.so") || id.includes("?")) {
    // Retirer les parametres apres ?
    id = id.split("?")[0];
    // Prendre le dernier segment de l'URL
    const segments = id.split("/");
    id = segments[segments.length - 1];
    // Extraire les 32 derniers caracteres hex (ignore les noms de page avant)
    const hexMatch = id.match(/([a-f0-9]{32})$/i);
    if (hexMatch) {
      id = hexMatch[1];
    }
  }

  // Retirer tous les tirets
  id = id.replace(/-/g, "");

  // Verifier : 32 caracteres hex
  if (!/^[a-f0-9]{32}$/i.test(id)) {
    console.warn("[AGATE] ID de base potentiellement invalide:", id);
    return rawId; // Retourner tel quel
  }

  // Formater en UUID : 8-4-4-4-12
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

/**
 * Echappe les caracteres HTML pour eviter les injections XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// ACTIONS RAPIDES (relances, appels, mails)
// Met a jour la fiche Notion apres envoi du prospect
// ============================================================

/**
 * Initialise les event listeners des boutons d'action
 */
function setupActions() {
  document.querySelectorAll(".action-btn").forEach(btn => {
    // Ignorer les boutons geres par des dropdowns
    if (btn.id === "rappelBtnSp" || btn.id === "emailBtnSp") return;
    if (btn.dataset.action) {
      btn.addEventListener("click", () => handleAction(btn.dataset.action));
    }
  });

  // Email dropdown
  if (el.emailBtnSp && el.emailDropdownSp) {
    el.emailBtnSp.addEventListener("click", (e) => {
      e.stopPropagation();
      // Fermer le rappel dropdown si ouvert
      const rappelDropdown = document.getElementById("rappelDropdownSp");
      if (rappelDropdown) rappelDropdown.classList.remove("open");
      el.emailDropdownSp.classList.toggle("open");
    });

    document.querySelectorAll(".email-template-option-sp").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const templateKey = opt.dataset.template;
        sendEmailWithTemplateSp(templateKey);
        // Mettre a jour Notion si on a un pageId
        if (currentNotionPageId) {
          handleAction("mail");
        }
      });
    });
  }

  // Rappel dropdown
  const rappelDropdown = document.getElementById("rappelDropdownSp");
  const rappelBtn = document.getElementById("rappelBtnSp");

  if (rappelBtn && rappelDropdown) {
    rappelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Fermer le email dropdown si ouvert
      if (el.emailDropdownSp) el.emailDropdownSp.classList.remove("open");
      rappelDropdown.classList.toggle("open");
    });

    document.querySelectorAll(".rappel-opt-sp").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const delayDays = parseInt(opt.dataset.delay, 10);
        rappelDropdown.classList.remove("open");
        handleRappelAction(delayDays);
      });
    });
  }

  // Fermer tous les dropdowns quand on clique ailleurs
  document.addEventListener("click", (e) => {
    if (rappelDropdown && !rappelDropdown.contains(e.target)) {
      rappelDropdown.classList.remove("open");
    }
    if (el.emailDropdownSp && !el.emailDropdownSp.contains(e.target)) {
      el.emailDropdownSp.classList.remove("open");
    }
  });

  // Toggle historique "Voir tout / Voir moins"
  if (el.historyToggleSp) {
    el.historyToggleSp.addEventListener("click", () => {
      showAllHistorySp = !showAllHistorySp;
      loadHistorySp();
    });
  }
}

/**
 * Execute une action de relance sur le prospect actuel
 * Met a jour la fiche Notion via PATCH API
 */
async function handleAction(actionType) {
  const config = ACTION_CONFIG[actionType];
  if (!config) return;

  // ── OUTLOOK : Relances R1/R2/R3 via Microsoft Graph API ──
  if (["r1", "r2", "r3"].includes(actionType) && isOutlookConnected) {
    const email = el.fieldEmail.value.trim();
    if (email) {
      await showOutlookDraftPreview(actionType, email);
      return;
    }
    // Pas d'email → fallback Notion-only ci-dessous
  }

  // Lire le commentaire
  const comment = el.actionCommentSp ? el.actionCommentSp.value.trim() : "";

  // CAS SPECIAL : Bouton "Appeler" → ouvrir l'app Telephone
  if (actionType === "appeler") {
    const phone = el.fieldPhone.value.trim() || el.fieldPhone2.value.trim();
    if (phone) {
      window.open(`tel:${phone.replace(/\s/g, "")}`, "_blank");
      updateStatus("connected", "Appel lance...");
      if (el.actionFeedback) {
        el.actionFeedback.textContent = `📞 Appel vers ${phone}`;
        el.actionFeedback.style.display = "block";
        el.actionFeedback.style.color = "var(--info)";
        el.actionFeedback.style.background = "rgba(52, 152, 219, 0.12)";
        el.actionFeedback.style.borderColor = "rgba(52, 152, 219, 0.4)";
      }
    } else {
      updateStatus("error", "Aucun numero de telephone");
      if (el.actionFeedback) {
        el.actionFeedback.textContent = "Aucun numero disponible";
        el.actionFeedback.style.display = "block";
        el.actionFeedback.style.color = "var(--warning)";
        el.actionFeedback.style.background = "rgba(243, 156, 18, 0.12)";
        el.actionFeedback.style.borderColor = "rgba(243, 156, 18, 0.4)";
      }
    }
    return;
  }

  // CAS SPECIAL : Bouton "Mail" → gere par le dropdown email
  // Le mailto est deja ouvert par sendEmailWithTemplateSp()
  // Ici on ne fait que la mise a jour Notion
  if (actionType === "mail") {
    if (!currentNotionPageId) return;
    // Le feedback est deja affiche par sendEmailWithTemplateSp
  }

  // Verifier qu'on a un pageId (sauf pour mail qui ouvre quand meme)
  if (!currentNotionPageId) {
    if (el.actionFeedback) {
      el.actionFeedback.textContent = "Aucun prospect actif. Envoyez d'abord dans Notion.";
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--warning)";
      el.actionFeedback.style.background = "rgba(243, 156, 18, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(243, 156, 18, 0.4)";
    }
    return;
  }

  // Verifier les parametres Notion
  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) {
    if (el.actionFeedback) {
      el.actionFeedback.textContent = "Cle API Notion manquante dans les parametres.";
      el.actionFeedback.style.display = "block";
    }
    return;
  }

  // Desactiver les boutons pendant l'envoi
  const buttons = document.querySelectorAll(".action-btn");
  buttons.forEach(btn => btn.disabled = true);

  // Calculer les dates
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

  let nextActionStr = null;
  let nextActionLabel = "";
  if (config.delayDays > 0) {
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + config.delayDays);
    nextActionStr = nextDate.toISOString().split("T")[0];
    nextActionLabel = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  // Construire les updates
  const updates = {
    lastAction: todayStr,
    nextAction: nextActionStr,
    status: config.status // null pour "Appeler" (pas de changement de statut)
  };

  try {
    updateStatus("loading", `${config.labelLong} en cours...`);

    const result = await chrome.runtime.sendMessage({
      action: "updateNotionPage",
      pageId: currentNotionPageId,
      updates: updates,
      apiKey: settings.notionApiKey
    });

    if (result.success) {
      let feedbackText = `✅ ${config.labelLong} enregistre`;

      // Afficher la date de relance si delai > 0
      if (config.delayDays > 0 && nextActionLabel) {
        feedbackText += ` — relance le ${nextActionLabel}`;
      }

      // Feedback positif
      if (el.actionFeedback) {
        el.actionFeedback.textContent = feedbackText;
        el.actionFeedback.style.display = "block";
        el.actionFeedback.style.color = "var(--success)";
        el.actionFeedback.style.background = "rgba(46, 204, 113, 0.12)";
        el.actionFeedback.style.borderColor = "rgba(46, 204, 113, 0.4)";
      }
      showToast(feedbackText, "success");
      updateStatus("connected", `${config.labelLong} enregistre dans Notion`);

      // Ajouter a l'historique Notion avec commentaire
      await chrome.runtime.sendMessage({
        action: "appendHistory",
        pageId: currentNotionPageId,
        actionType: config.labelLong,
        comment: comment,
        apiKey: settings.notionApiKey
      });

      // Vider le champ commentaire
      if (el.actionCommentSp) el.actionCommentSp.value = "";

      // Ajouter le commentaire au feedback si present
      if (comment && el.actionFeedback) {
        el.actionFeedback.textContent += ` (${comment})`;
      }

      // Recharger l'historique si visible
      loadHistorySp();

      // Proposer l'action suivante du cycle de prospection
      showNextActionProposal(
        actionType,
        currentNotionPageId,
        el.fieldName.value.trim(),
        el.fieldCompany.value.trim()
      );

    } else {
      throw new Error(result.error || "Erreur inconnue");
    }

  } catch (error) {
    console.error("[AGATE] Erreur action:", error);
    if (el.actionFeedback) {
      el.actionFeedback.textContent = `Erreur : ${error.message}`;
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--error)";
      el.actionFeedback.style.background = "rgba(231, 76, 60, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(231, 76, 60, 0.4)";
    }
    updateStatus("error", "Erreur action");
  } finally {
    // Reactiver les boutons
    buttons.forEach(btn => btn.disabled = false);
  }
}

// ============================================================
// RAPPEL AVEC DELAI PERSONNALISE (J+2, J+3, J+7)
// Appele par le dropdown Rappeler dans les actions rapides
// ============================================================
async function handleRappelAction(delayDays) {
  // Verifier qu'on a un prospect actif
  if (!currentNotionPageId) {
    if (el.actionFeedback) {
      el.actionFeedback.textContent = "Aucun prospect actif. Envoyez d'abord dans Notion.";
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--warning)";
      el.actionFeedback.style.background = "rgba(243, 156, 18, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(243, 156, 18, 0.4)";
    }
    return;
  }

  // Verifier la cle API
  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) {
    if (el.actionFeedback) {
      el.actionFeedback.textContent = "Cle API Notion manquante dans les parametres.";
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--warning)";
      el.actionFeedback.style.background = "rgba(243, 156, 18, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(243, 156, 18, 0.4)";
    }
    return;
  }

  // Desactiver les boutons pendant l'envoi
  const buttons = document.querySelectorAll(".action-btn");
  buttons.forEach(btn => btn.disabled = true);

  // Calculer les dates
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + delayDays);
  const nextActionStr = nextDate.toISOString().split("T")[0];
  const nextActionLabel = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  // Construire les updates Notion
  const updates = {
    lastAction: todayStr,
    nextAction: nextActionStr,
    status: "A rappeler"
  };

  try {
    updateStatus("loading", `Rappel J+${delayDays} en cours...`);

    const result = await chrome.runtime.sendMessage({
      action: "updateNotionPage",
      pageId: currentNotionPageId,
      updates: updates,
      apiKey: settings.notionApiKey
    });

    if (result.success) {
      let feedbackText = `✅ Rappel J+${delayDays} programme (${nextActionLabel})`;

      // Feedback positif
      if (el.actionFeedback) {
        el.actionFeedback.textContent = feedbackText;
        el.actionFeedback.style.display = "block";
        el.actionFeedback.style.color = "var(--success)";
        el.actionFeedback.style.background = "rgba(46, 204, 113, 0.12)";
        el.actionFeedback.style.borderColor = "rgba(46, 204, 113, 0.4)";
      }
      updateStatus("connected", `Rappel J+${delayDays} enregistre dans Notion`);

      // Ajouter a l'historique Notion
      await chrome.runtime.sendMessage({
        action: "appendHistory",
        pageId: currentNotionPageId,
        actionType: `Rappel J+${delayDays}`,
        comment: "",
        apiKey: settings.notionApiKey
      });

      // Mettre a jour le badge rappels
      loadReminderBadge();

    } else {
      throw new Error(result.error || "Erreur inconnue");
    }

  } catch (error) {
    console.error("[AGATE] Erreur rappel:", error);
    if (el.actionFeedback) {
      el.actionFeedback.textContent = `Erreur : ${error.message}`;
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--error)";
      el.actionFeedback.style.background = "rgba(231, 76, 60, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(231, 76, 60, 0.4)";
    }
    updateStatus("error", "Erreur rappel");
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}

// ============================================================
// PROPOSITION INTELLIGENTE D'ACTION SUIVANTE
// Apres chaque action, propose l'etape suivante du cycle
// ============================================================

/**
 * Affiche la modal de proposition d'action suivante.
 * Determine le sous-panel a afficher selon NEXT_ACTION_MAP.
 */
function showNextActionProposal(completedAction, pageId, prospectName, company) {
  const mapping = NEXT_ACTION_MAP[completedAction];
  if (!mapping) return;

  const modal = document.getElementById("nextActionModal");
  const proposalDiv = document.getElementById("nextActionProposal");
  const callOutcomeDiv = document.getElementById("nextActionCallOutcome");
  const rdvPickerDiv = document.getElementById("nextActionRdvPicker");
  const endCycleDiv = document.getElementById("nextActionEndCycle");

  // Masquer tous les sous-panels
  proposalDiv.style.display = "none";
  callOutcomeDiv.style.display = "none";
  rdvPickerDiv.style.display = "none";
  endCycleDiv.style.display = "none";

  // Determiner quel panel afficher
  if (completedAction === "appeler" || completedAction === "rappeler") {
    // Appel : demander le resultat (NRP / Repondu)
    callOutcomeDiv.style.display = "block";
    callOutcomeDiv.querySelectorAll(".btn-outcome").forEach(btn => {
      btn.onclick = () => handleCallOutcome(btn.dataset.outcome, completedAction, pageId, prospectName, company);
    });
  } else if (completedAction === "rdv") {
    // RDV : date/heure picker
    rdvPickerDiv.style.display = "block";
    const rdvDateInput = document.getElementById("rdvDate");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    rdvDateInput.value = tomorrow.toISOString().split("T")[0];
    rdvDateInput.min = new Date().toISOString().split("T")[0];
    document.getElementById("rdvConfirm").onclick = () => handleRdvConfirm(pageId, prospectName, company);
    document.getElementById("rdvCancel").onclick = () => closeNextActionModal();
  } else if (completedAction === "r3") {
    // R3 : fin de cycle
    endCycleDiv.style.display = "block";
    endCycleDiv.querySelectorAll(".btn-outcome").forEach(btn => {
      btn.onclick = () => handleEndCycleChoice(btn.dataset.outcome, pageId, prospectName, company);
    });
  } else if (mapping.default) {
    // Standard : mail→R1, R1→R2, R2→R3
    const suggestion = mapping.default;
    proposalDiv.style.display = "block";
    document.getElementById("nextActionDescription").textContent = suggestion.label;
    document.getElementById("nextActionAccept").onclick = () => acceptNextAction(suggestion, pageId, prospectName, company);
    document.getElementById("nextActionSkip").onclick = () => closeNextActionModal();
  }

  modal.style.display = "flex";
  document.getElementById("nextActionClose").onclick = () => closeNextActionModal();
}

function closeNextActionModal() {
  document.getElementById("nextActionModal").style.display = "none";
}

/**
 * Gere le resultat d'un appel (NRP ou Repondu)
 */
async function handleCallOutcome(outcome, completedAction, pageId, prospectName, company) {
  const mapping = NEXT_ACTION_MAP[completedAction];
  const suggestion = mapping[outcome];

  if (!suggestion || !suggestion.nextAction) {
    // Repondu → pas d'action suivante automatique
    closeNextActionModal();
    return;
  }

  // NRP → auto-programmer rappel
  await acceptNextAction(suggestion, pageId, prospectName, company);
}

/**
 * Gere la confirmation du RDV avec date/heure
 */
async function handleRdvConfirm(pageId, prospectName, company) {
  const rdvDate = document.getElementById("rdvDate").value;
  const rdvTime = document.getElementById("rdvTime").value;

  if (!rdvDate) {
    document.getElementById("rdvDate").style.borderColor = "var(--error)";
    return;
  }

  const rdvDateTime = new Date(`${rdvDate}T${rdvTime || "10:00"}`);

  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) { closeNextActionModal(); return; }

  try {
    // 1. Ajouter une entree TODO dans l'historique
    const rdvLabel = rdvDateTime.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const rdvTimeLabel = (rdvTime || "10:00").replace(":", "h");
    await chrome.runtime.sendMessage({
      action: "appendHistoryChecklist",
      pageId: pageId,
      actionType: `RDV prevu le ${rdvLabel} a ${rdvTimeLabel}`,
      dueDate: rdvDate,
      isDone: false,
      apiKey: settings.notionApiKey
    });

    // 3. Mettre a jour nextAction dans Notion
    await chrome.runtime.sendMessage({
      action: "updateNotionPage",
      pageId: pageId,
      updates: { nextAction: rdvDate },
      apiKey: settings.notionApiKey
    });

    closeNextActionModal();

    if (el.actionFeedback) {
      el.actionFeedback.textContent = `📅 RDV programme le ${rdvLabel} a ${rdvTimeLabel} — rappel automatique prevu`;
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--success)";
      el.actionFeedback.style.background = "rgba(46, 204, 113, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(46, 204, 113, 0.4)";
    }
    loadReminderBadge();
  } catch (error) {
    console.error("[AGATE] Erreur RDV:", error);
    closeNextActionModal();
  }
}

/**
 * Gere le choix de fin de cycle (apres R3)
 */
async function handleEndCycleChoice(outcome, pageId, prospectName, company) {
  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) { closeNextActionModal(); return; }

  try {
    if (outcome === "close") {
      await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: pageId,
        updates: { status: "Pas interesse", nextAction: null },
        apiKey: settings.notionApiKey
      });
      await chrome.runtime.sendMessage({
        action: "appendHistoryChecklist",
        pageId: pageId,
        actionType: "Cloture - Pas interesse",
        isDone: true,
        apiKey: settings.notionApiKey
      });
    } else if (outcome === "rappeler") {
      await handleRappelAction(7);
    }
    // "skip" → ne rien faire

    closeNextActionModal();

    if (el.actionFeedback) {
      const labels = { close: "🚫 Prospect cloture", rappeler: "🔔 Rappel J+7 programme", skip: "⏭️ Aucune action" };
      el.actionFeedback.textContent = labels[outcome] || "";
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = outcome === "close" ? "var(--text-muted)" : "var(--accent-light)";
      el.actionFeedback.style.background = outcome === "close" ? "rgba(148, 163, 184, 0.12)" : "var(--accent-glow)";
      el.actionFeedback.style.borderColor = outcome === "close" ? "rgba(148, 163, 184, 0.3)" : "rgba(99, 102, 241, 0.4)";
    }
  } catch (error) {
    console.error("[AGATE] Erreur fin de cycle:", error);
    closeNextActionModal();
  }
}

/**
 * Accepte et programme l'action suivante proposee
 */
async function acceptNextAction(suggestion, pageId, prospectName, company) {
  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) { closeNextActionModal(); return; }

  try {
    const today = new Date();
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + suggestion.delayDays);
    const nextActionStr = nextDate.toISOString().split("T")[0];
    const nextActionLabel = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

    // 1. Mettre a jour nextAction dans Notion
    await chrome.runtime.sendMessage({
      action: "updateNotionPage",
      pageId: pageId,
      updates: { nextAction: nextActionStr },
      apiKey: settings.notionApiKey
    });

    // 2. Ajouter une entree TODO dans l'historique Notion
    await chrome.runtime.sendMessage({
      action: "appendHistoryChecklist",
      pageId: pageId,
      actionType: ACTION_CONFIG[suggestion.nextAction]?.labelLong || suggestion.label,
      dueDate: nextActionStr,
      isDone: false,
      apiKey: settings.notionApiKey
    });

    closeNextActionModal();

    if (el.actionFeedback) {
      el.actionFeedback.textContent = `🔮 ${suggestion.label} — programme pour le ${nextActionLabel}`;
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--accent-light)";
      el.actionFeedback.style.background = "var(--accent-glow)";
      el.actionFeedback.style.borderColor = "rgba(99, 102, 241, 0.4)";
    }

    loadReminderBadge();
  } catch (error) {
    console.error("[AGATE] Erreur acceptNextAction:", error);
    closeNextActionModal();
  }
}

/**
 * Parse l'historique texte en entrees checklist
 */
function parseChecklist(historyText) {
  if (!historyText) return [];
  return historyText.split("\n").filter(line => line.trim()).map(line => {
    const isDone = line.startsWith("[DONE]");
    const isTodo = line.startsWith("[TODO]");
    const cleanLine = line.replace(/^\[(DONE|TODO)\]\s*/, "");
    const parts = cleanLine.split(" - ");
    return {
      done: isDone,
      pending: isTodo,
      legacy: !isDone && !isTodo,
      date: parts[0] || "",
      action: parts[1] || "",
      comment: parts.slice(2).join(" - ") || ""
    };
  });
}

/**
 * Mappe un label d'action vers la cle ACTION_CONFIG
 * Ex: "Relance 1" → "r1", "Mail envoye" → "mail"
 */
function mapLabelToActionType(label) {
  if (!label) return null;
  for (const [key, config] of Object.entries(ACTION_CONFIG)) {
    if (config.labelLong === label || config.label === label || label.includes(config.labelLong) || label.includes(config.label)) return key;
  }
  if (label.includes("Rappel") || label.includes("rappeler")) return "rappeler";
  if (label.includes("RDV Realise")) return "rdv";
  return null;
}

// ============================================================
// BOONDMANAGER - Statut et envoi
// ============================================================

/**
 * Verifie le statut de connexion Boond et active/desactive les boutons
 */
async function updateBoondStatus() {
  try {
    const result = await chrome.runtime.sendMessage({ action: "boondStatus" });
    if (result && result.isConfigured) {
      if (el.boondStatusIndicator) {
        el.boondStatusIndicator.className = "outlook-status-indicator connected";
      }
      if (el.boondStatusLabel) {
        el.boondStatusLabel.textContent = "Configuré";
      }
      if (el.sendToBoond) el.sendToBoond.disabled = false;
      if (el.sendToBoth) el.sendToBoth.disabled = false;
    } else {
      if (el.boondStatusIndicator) {
        el.boondStatusIndicator.className = "outlook-status-indicator disconnected";
      }
      if (el.boondStatusLabel) {
        el.boondStatusLabel.textContent = "Non configuré";
      }
      if (el.sendToBoond) el.sendToBoond.disabled = true;
      if (el.sendToBoth) el.sendToBoth.disabled = true;
    }
  } catch (err) {
    console.warn("[AGATE] Boond status check error:", err);
  }
}

// Test connexion Boond
if (el.boondTestBtn) {
  el.boondTestBtn.addEventListener("click", async () => {
    // Sauvegarder d'abord les credentials en cours de saisie
    const boondInst = el.boondInstance ? el.boondInstance.value.trim() : "";
    const boondUT = el.boondUserToken ? el.boondUserToken.value.trim() : "";
    const boondCT = el.boondClientToken ? el.boondClientToken.value.trim() : "";
    const boondCK = el.boondClientKey ? el.boondClientKey.value.trim() : "";

    if (!boondUT || !boondCT || !boondCK) {
      showToast("Remplissez les 3 champs tokens (User Token, Client Token, Client Key).", "warning");
      return;
    }

    // Sauvegarder temporairement pour que le service worker les lise
    await chrome.storage.local.set({
      boondInstance: boondInst,
      boondUserToken: boondUT,
      boondClientToken: boondCT,
      boondClientKey: boondCK
    });

    // UI loading
    el.boondTestBtn.disabled = true;
    const originalHTML = el.boondTestBtn.innerHTML;
    el.boondTestBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Test en cours...';

    try {
      const result = await chrome.runtime.sendMessage({ action: "boondTestConnection" });

      if (result.success) {
        showToast("Connexion BoondManager reussie !", "success");
        if (el.boondStatusIndicator) el.boondStatusIndicator.className = "outlook-status-indicator connected";
        if (el.boondStatusLabel) el.boondStatusLabel.textContent = "Connecté";
        if (el.sendToBoond) el.sendToBoond.disabled = false;
        if (el.sendToBoth) el.sendToBoth.disabled = false;
      } else {
        showToast("Echec connexion : " + (result.error || "Erreur inconnue"), "error");
        if (el.boondStatusIndicator) el.boondStatusIndicator.className = "outlook-status-indicator disconnected";
        if (el.boondStatusLabel) el.boondStatusLabel.textContent = "Echec connexion";
      }
    } catch (error) {
      showToast("Erreur : " + error.message, "error");
    }

    el.boondTestBtn.innerHTML = originalHTML;
    el.boondTestBtn.disabled = false;
  });
}

// Envoi vers Boond
if (el.sendToBoond) {
  el.sendToBoond.addEventListener("click", async () => {
    // Verifier config
    const status = await chrome.runtime.sendMessage({ action: "boondStatus" });
    if (!status || !status.isConfigured) {
      showToast("Configurez vos credentials BoondManager dans les parametres.", "warning");
      return;
    }

    // Verifier nom
    if (!el.fieldName.value.trim()) {
      showToast("Le nom du prospect est obligatoire.", "error");
      return;
    }

    // UI loading
    el.sendToBoond.disabled = true;
    const originalHTML = el.sendToBoond.innerHTML;
    el.sendToBoond.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Envoi...';

    try {
      const prospectData = getCurrentFormData();
      const result = await chrome.runtime.sendMessage({
        action: "sendToBoond",
        data: prospectData
      });

      if (result.success) {
        showToast("Contact ajouté dans BoondManager !", "success");
        el.sendToBoond.innerHTML = '<span class="btn-icon">&#10003;</span> Envoyé !';
        updateStatus("connected", "Contact envoyé dans Boond !");
        setTimeout(() => {
          el.sendToBoond.innerHTML = originalHTML;
          el.sendToBoond.disabled = false;
        }, 2000);
      } else if (result.duplicate) {
        showToast("Contact déjà présent dans BoondManager : " + (result.contactName || ""), "warning");
        el.sendToBoond.innerHTML = originalHTML;
        el.sendToBoond.disabled = false;
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      showToast("Erreur Boond : " + error.message, "error");
      el.sendToBoond.innerHTML = originalHTML;
      el.sendToBoond.disabled = false;
      updateStatus("error", "Erreur envoi Boond");
    }
  });
}

// Envoi vers les deux (Notion + Boond)
if (el.sendToBoth) {
  el.sendToBoth.addEventListener("click", async () => {
    // Verifier config Notion
    const notionSettings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
    if (!notionSettings.notionApiKey || !notionSettings.notionDatabaseId) {
      showToast("Configurez d'abord votre clé API et ID de base Notion.", "warning");
      return;
    }

    // Verifier config Boond
    const boondStatus = await chrome.runtime.sendMessage({ action: "boondStatus" });
    if (!boondStatus || !boondStatus.isConfigured) {
      showToast("Configurez vos credentials BoondManager dans les parametres.", "warning");
      return;
    }

    // Verifier nom
    if (!el.fieldName.value.trim()) {
      showToast("Le nom du prospect est obligatoire.", "error");
      return;
    }

    // UI loading
    el.sendToBoth.disabled = true;
    if (el.sendToNotion) el.sendToNotion.disabled = true;
    if (el.sendToBoond) el.sendToBoond.disabled = true;
    const originalHTML = el.sendToBoth.innerHTML;
    el.sendToBoth.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Envoi parallele...';

    try {
      const prospectData = getCurrentFormData();

      // Envoi parallele Notion + Boond
      const [notionResult, boondResult] = await Promise.allSettled([
        chrome.runtime.sendMessage({
          action: "sendToNotion",
          data: prospectData,
          apiKey: notionSettings.notionApiKey,
          databaseId: notionSettings.notionDatabaseId
        }),
        chrome.runtime.sendMessage({
          action: "sendToBoond",
          data: prospectData
        })
      ]);

      const notionOk = notionResult.status === "fulfilled" && notionResult.value?.success;
      const boondOk = boondResult.status === "fulfilled" && boondResult.value?.success;
      const notionDup = notionResult.status === "fulfilled" && notionResult.value?.duplicate;
      const boondDup = boondResult.status === "fulfilled" && boondResult.value?.duplicate;

      // Gestion des resultats
      if (notionOk && boondOk) {
        showToast("Contact ajouté dans Notion ET Boond !", "success");
        el.sendToBoth.innerHTML = '<span class="btn-icon">&#10003;</span> Envoyé !';
        updateStatus("connected", "Contact envoyé dans les deux CRM !");
        // Sauvegarder le pageId pour les actions
        if (notionResult.value.pageId) {
          currentNotionPageId = notionResult.value.pageId;
          if (el.actionsSection) el.actionsSection.style.display = "block";
        }
      } else if (notionOk && !boondOk) {
        const boondMsg = boondDup
          ? "doublon détecté"
          : (boondResult.value?.error || boondResult.reason?.message || "erreur");
        showToast(`Notion OK, Boond: ${boondMsg}`, "warning");
        el.sendToBoth.innerHTML = '<span class="btn-icon">⚠</span> Partiel';
        if (notionResult.value.pageId) {
          currentNotionPageId = notionResult.value.pageId;
          if (el.actionsSection) el.actionsSection.style.display = "block";
        }
      } else if (!notionOk && boondOk) {
        const notionMsg = notionDup
          ? "doublon détecté"
          : (notionResult.value?.error || notionResult.reason?.message || "erreur");
        showToast(`Boond OK, Notion: ${notionMsg}`, "warning");
        el.sendToBoth.innerHTML = '<span class="btn-icon">⚠</span> Partiel';
      } else {
        // Les deux ont echoue
        const msgs = [];
        if (notionDup) msgs.push("Notion: doublon");
        else msgs.push("Notion: " + (notionResult.value?.error || notionResult.reason?.message || "erreur"));
        if (boondDup) msgs.push("Boond: doublon");
        else msgs.push("Boond: " + (boondResult.value?.error || boondResult.reason?.message || "erreur"));
        showToast(msgs.join(" | "), "error");
        el.sendToBoth.innerHTML = '<span class="btn-icon">✕</span> Echec';
      }

      setTimeout(() => {
        el.sendToBoth.innerHTML = originalHTML;
        el.sendToBoth.disabled = false;
        if (el.sendToNotion) el.sendToNotion.disabled = false;
        if (el.sendToBoond) el.sendToBoond.disabled = false;
      }, 2500);

    } catch (error) {
      showToast("Erreur : " + error.message, "error");
      el.sendToBoth.innerHTML = originalHTML;
      el.sendToBoth.disabled = false;
      if (el.sendToNotion) el.sendToNotion.disabled = false;
      if (el.sendToBoond) el.sendToBoond.disabled = false;
      updateStatus("error", "Erreur envoi");
    }
  });
}

// ============================================================
// EXPORT VCARD (Contacts Apple)
// ============================================================
const exportVcardBtn = document.getElementById("exportVcard");
if (exportVcardBtn) {
  exportVcardBtn.addEventListener("click", () => {
    const data = getCurrentFormData();
    if (!data.name) {
      updateStatus("error", "Nom requis pour exporter");
      return;
    }

    // Separer prenom/nom (approximatif)
    const nameParts = data.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Construire le vCard (format 3.0)
    let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
    vcard += `N:${lastName};${firstName};;;\n`;
    vcard += `FN:${data.name}\n`;
    if (data.company) vcard += `ORG:${data.company}\n`;
    if (data.jobTitle) vcard += `TITLE:${data.jobTitle}\n`;
    if (data.phone) vcard += `TEL;TYPE=WORK,VOICE:${data.phone}\n`;
    if (data.phone2) vcard += `TEL;TYPE=CELL,VOICE:${data.phone2}\n`;
    if (data.email) vcard += `EMAIL;TYPE=WORK:${data.email}\n`;
    if (data.linkedinUrl) vcard += `URL:${data.linkedinUrl}\n`;
    if (data.sector) vcard += `X-SECTOR:${data.sector}\n`;
    if (data.tags && data.tags.length > 0) vcard += `CATEGORIES:${data.tags.join(",")}\n`;
    if (data.notes) vcard += `NOTE:${data.notes.replace(/\n/g, "\\n")}\n`;
    vcard += `REV:${new Date().toISOString()}\n`;
    vcard += "END:VCARD";

    // Telecharger le fichier
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name.replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);

    updateStatus("connected", "Contact exporte - double-cliquez sur le fichier");
  });
}

// ============================================================
// FEATURE: RECHERCHE RAPIDE DANS NOTION
// ============================================================
let searchDebounce = null;

function focusSearchInput() {
  const input = document.getElementById("searchInput");
  if (input) setTimeout(() => input.focus(), 100);
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("searchClear");
  const statusFilter = document.getElementById("searchStatusFilter");
  if (!input) return;

  input.addEventListener("input", () => {
    clearBtn.style.display = input.value ? "flex" : "none";
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => executeSearch(), 400);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.style.display = "none";
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchInitial").style.display = "block";
    document.getElementById("searchResultCount").textContent = "";
    input.focus();
  });

  statusFilter.addEventListener("change", () => executeSearch());
}

async function executeSearch() {
  const query = document.getElementById("searchInput").value.trim();
  const statusFilter = document.getElementById("searchStatusFilter").value;
  const resultsEl = document.getElementById("searchResults");
  const initialEl = document.getElementById("searchInitial");
  const loadingEl = document.getElementById("searchLoading");
  const countEl = document.getElementById("searchResultCount");

  if (query.length < 2 && !statusFilter) {
    resultsEl.innerHTML = "";
    initialEl.style.display = "block";
    countEl.textContent = "";
    return;
  }

  initialEl.style.display = "none";
  loadingEl.style.display = "none";
  showSkeleton(resultsEl, "card", 3);

  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    loadingEl.style.display = "none";
    resultsEl.innerHTML = '<div class="message-box warning"><span class="message-icon">⚠️</span><span>Configurez Notion dans les parametres.</span></div>';
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({
      action: "searchNotionContacts",
      query: query,
      statusFilter: statusFilter,
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    resultsEl.innerHTML = "";
    if (!result.success) throw new Error(result.error);

    // Filtrer par secteur si actif
    let contacts = result.contacts;
    if (searchSectorFilter) {
      contacts = contacts.filter(c => c.sector === searchSectorFilter);
    }

    // Calculer le score pour chaque contact
    contacts.forEach(c => {
      const scoreResult = calculateProspectScore({
        sector: c.sector || "",
        jobTitle: c.jobTitle || "",
        tags: c.tags || [],
        status: c.status || "",
        lastActionDate: c.lastActionDate || c.lastAction || null,
        email: c.email || "",
        phone: c.phone || ""
      });
      c._score = scoreResult.score;
      c._scoreLevel = scoreResult.level;
    });

    // Trier selon le critère sélectionné
    if (searchSortBy === "score") {
      contacts.sort((a, b) => (b._score || 0) - (a._score || 0));
    } else if (searchSortBy === "date") {
      contacts.sort((a, b) => {
        const dA = a.lastActionDate ? new Date(a.lastActionDate) : new Date(0);
        const dB = b.lastActionDate ? new Date(b.lastActionDate) : new Date(0);
        return dB - dA;
      });
    } else if (searchSortBy === "name") {
      contacts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    countEl.textContent = `${contacts.length} resultat${contacts.length > 1 ? "s" : ""}`;

    if (contacts.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state"><span class="empty-icon">🤷</span><p>Aucun resultat</p><small>Essayez un autre terme ou modifiez les filtres.</small></div>';
      return;
    }

    contacts.forEach((contact, index) => {
      const scoreHtml = contact._score !== undefined
        ? `<span class="search-result-score ${contact._scoreLevel}">${contact._score}</span>`
        : "";

      const card = document.createElement("div");
      card.className = `search-result-card anim-slide-down anim-stagger-${Math.min(index + 1, 8)}`;
      card.innerHTML = `
        <div class="search-result-header">
          <span class="search-result-name">${escapeHtml(contact.name)}${scoreHtml}</span>
          <span class="search-result-status">${escapeHtml(contact.status)}</span>
        </div>
        <div class="search-result-meta">
          <span>${escapeHtml(contact.company)}</span>
          ${contact.jobTitle ? "<span>- " + escapeHtml(contact.jobTitle) + "</span>" : ""}
          ${contact.sector ? `<span class="search-result-sector">· ${escapeHtml(contact.sector)}</span>` : ""}
        </div>
      `;
      card.addEventListener("click", () => loadContactIntoForm(contact));
      resultsEl.appendChild(card);
    });
  } catch (error) {
    loadingEl.style.display = "none";
    resultsEl.innerHTML = `<div class="message-box error"><span class="message-icon">✕</span><span>${escapeHtml(error.message)}</span></div>`;
  }
}

function loadContactIntoForm(contact) {
  clearFormFields();
  chrome.storage.local.remove(STORAGE_KEY);
  currentNotionPageId = contact.pageId;
  fillFormWithNotionData(contact);
  showExistingContactBanner(contact.name, contact.status);
  setUpdateMode(true);
  if (el.actionsSection) el.actionsSection.style.display = "block";
  switchView("mainView");
  updateStatus("connected", `${contact.name} charge depuis la recherche`);
  // Charger l'historique des actions
  loadHistorySp();
  // Charger l'historique emails Outlook si connecté
  if (isOutlookConnected && contact.email) loadEmailHistory();
}

// ============================================================
// FEATURE: DASHBOARD RAPPELS & RELANCES
// ============================================================

function setupRemindersRefresh() {
  const btn = document.getElementById("refreshReminders");
  if (btn) btn.addEventListener("click", () => loadRemindersView());
}

async function loadReminderBadge() {
  try {
    const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
    if (!settings.notionApiKey || !settings.notionDatabaseId) return;

    // Compter les followups Notion en retard
    const notionResult = await chrome.runtime.sendMessage({
      action: "queryPendingFollowups",
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    if (!notionResult.success) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let overdueCount = 0;
    for (const f of notionResult.followups) {
      const due = parseFlexDate(f.nextAction);
      if (due && due < now) overdueCount++;
    }
    updateReminderBadge(overdueCount);
  } catch (e) {
    console.warn("[AGATE] Erreur chargement badge rappels:", e);
  }
}

async function loadRemindersView() {
  const listEl = document.getElementById("remindersList");
  const emptyEl = document.getElementById("remindersEmpty");
  const loadingEl = document.getElementById("remindersLoading");

  emptyEl.style.display = "none";
  loadingEl.style.display = "none";
  showSkeleton(listEl, "card", 3);

  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    listEl.innerHTML = '<div class="message-box warning"><span class="message-icon">⚠️</span><span>Configurez Notion dans les parametres.</span></div>';
    return;
  }

  try {
    const notionResult = await chrome.runtime.sendMessage({
      action: "queryPendingFollowups",
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    listEl.innerHTML = "";

    const allItems = buildReminderItems(
      notionResult.success ? notionResult.followups : []
    );

    if (allItems.length === 0) {
      emptyEl.style.display = "block";
      updateReminderBadge(0);
      updateStats(0, 0, 0);
      return;
    }

    allItems.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency - b.urgency;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    const overdue = allItems.filter(i => i.urgency === 0).length;
    const todayCount = allItems.filter(i => i.urgency === 1).length;
    const upcoming = allItems.filter(i => i.urgency === 2).length;
    updateStats(overdue, todayCount, upcoming);
    updateReminderBadge(overdue);

    allItems.forEach((item, index) => {
      const card = createReminderCard(item);
      card.classList.add("anim-slide-down", `anim-stagger-${Math.min(index + 1, 8)}`);
      listEl.appendChild(card);
    });
  } catch (error) {
    loadingEl.style.display = "none";
    listEl.innerHTML = `<div class="message-box error"><span class="message-icon">✕</span><span>${escapeHtml(error.message)}</span></div>`;
  }
}

function updateStats(overdue, today, upcoming) {
  document.getElementById("overdueCount").textContent = overdue;
  document.getElementById("todayCount").textContent = today;
  document.getElementById("upcomingCount").textContent = upcoming;
}

function buildReminderItems(notionFollowups) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const items = [];

  for (const f of notionFollowups) {
    const due = parseFlexDate(f.nextAction);
    if (!due) continue;
    items.push({
      id: null,
      pageId: f.pageId,
      name: f.name,
      company: f.company,
      jobTitle: f.jobTitle || "",
      sector: f.sector || "",
      email: f.email || "",
      tags: f.tags || [],
      lastAction: f.lastAction || "",
      actionType: f.status || "Relance",
      dueDate: due.toISOString(),
      notionUrl: f.notionUrl,
      source: "notion",
      urgency: due < today ? 0 : (due <= todayEnd ? 1 : 2),
      checklist: parseChecklist(f.history || "")
    });
  }

  return items;
}

function parseFlexDate(str) {
  if (!str) return null;
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(isoMatch[0]);
  const frMatch = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (frMatch) return new Date(`${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`);
  return null;
}

function createReminderCard(item) {
  const urgencyClass = ["overdue", "today", "upcoming"][item.urgency];
  const urgencyLabel = ["En retard", "Aujourd'hui", "A venir"][item.urgency];
  const dueDate = new Date(item.dueDate);
  const dateLabel = dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  // Construire la checklist HTML si des entrees historique existent
  let checklistHtml = "";
  if (item.checklist && item.checklist.length > 0) {
    const maxShow = 5;
    const entries = item.checklist.slice(0, maxShow);
    checklistHtml = '<div class="reminder-checklist">';
    entries.forEach(entry => {
      const icon = entry.done ? "✅" : (entry.pending ? "☐" : "•");
      const doneClass = entry.done ? "done" : (entry.pending ? "pending" : "legacy");
      checklistHtml += `
        <div class="checklist-item ${doneClass}">
          <span class="checklist-icon">${icon}</span>
          <span class="checklist-date">${escapeHtml(entry.date)}</span>
          <span class="checklist-action">${escapeHtml(entry.action)}</span>
        </div>`;
    });
    if (item.checklist.length > maxShow) {
      checklistHtml += `<div class="checklist-more">+${item.checklist.length - maxShow} autres</div>`;
    }
    checklistHtml += "</div>";
  }

  const card = document.createElement("div");
  card.className = `reminder-card ${urgencyClass}`;
  card.innerHTML = `
    <div class="reminder-card-header">
      <span class="reminder-prospect-name">${escapeHtml(item.name)}</span>
      <span class="reminder-date ${urgencyClass}">${dateLabel} - ${urgencyLabel}</span>
    </div>
    <div class="reminder-company">${escapeHtml(item.company)}${item.actionType ? " - " + escapeHtml(item.actionType) : ""}</div>
    ${checklistHtml}
    <div class="reminder-actions">
      <button class="reminder-action-btn" data-action="done" data-id="${item.id || ""}" data-page="${item.pageId}" data-actiontype="${escapeHtml(item.actionType || "")}" data-name="${escapeHtml(item.name)}" data-company="${escapeHtml(item.company)}">✅ Fait</button>
      <button class="reminder-action-btn" data-action="open" data-url="${item.notionUrl || ""}">📋 Notion</button>
      <button class="reminder-action-btn" data-action="snooze" data-id="${item.id || ""}" data-page="${item.pageId}">⏰ +2j</button>
    </div>
  `;

  card.querySelectorAll(".reminder-action-btn").forEach(btn => {
    btn.addEventListener("click", (e) => handleReminderAction(e.currentTarget.dataset));
  });

  return card;
}

async function handleReminderAction(data) {
  if (data.action === "open" && data.url) {
    chrome.tabs.create({ url: data.url });
  }
  if (data.action === "done") {
    const settings = await chrome.storage.local.get(["notionApiKey"]);

    // 1. Marquer le TODO comme DONE dans l'historique Notion
    if (data.page && settings.notionApiKey && data.actiontype) {
      await chrome.runtime.sendMessage({
        action: "markHistoryDone",
        pageId: data.page,
        actionType: data.actiontype,
        apiKey: settings.notionApiKey
      });
    }

    // 3. Proposer l'action suivante du cycle
    const completedActionType = mapLabelToActionType(data.actiontype);
    if (completedActionType && NEXT_ACTION_MAP[completedActionType]) {
      const prospectName = data.name || "Prospect";
      const company = data.company || "";
      showNextActionProposal(completedActionType, data.page, prospectName, company);
    }

    loadRemindersView();
  }
  if (data.action === "snooze" && data.page) {
    // Decaler la nextAction de +2 jours dans Notion
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (settings.notionApiKey) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 2);
      const newDateStr = newDate.toISOString().split("T")[0];
      await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: data.page,
        updates: { nextAction: newDateStr },
        apiKey: settings.notionApiKey
      });
    }
    loadRemindersView();
  }
}

function updateReminderBadge(count) {
  const badge = document.getElementById("reminderBadge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

// ============================================================
// FEATURE: PIPELINE VISUEL
// ============================================================
let pipelineData = null;

function setupPipelineRefresh() {
  const btn = document.getElementById("refreshPipeline");
  if (btn) btn.addEventListener("click", () => loadPipelineView());
}

async function loadPipelineView() {
  const barsEl = document.getElementById("pipelineBars");
  const totalEl = document.getElementById("pipelineTotal");
  const loadingEl = document.getElementById("pipelineLoading");
  const detailEl = document.getElementById("pipelineDetail");

  totalEl.innerHTML = "";
  detailEl.style.display = "none";
  loadingEl.style.display = "none";
  showSkeleton(barsEl, "bar", 5);

  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    loadingEl.style.display = "none";
    barsEl.innerHTML = '<div class="message-box warning"><span class="message-icon">⚠️</span><span>Configurez Notion dans les parametres.</span></div>';
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({
      action: "getPipelineStats",
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    barsEl.innerHTML = "";
    if (!result.success) throw new Error(result.error);

    pipelineData = result;
    totalEl.innerHTML = `<strong>${result.totalProspects}</strong>prospects au total`;

    const maxCount = Math.max(...Object.values(result.pipeline).map(s => s.count), 1);

    let barIndex = 0;
    const renderBar = (status, data) => {
      if (!data || data.count === 0) return;
      const bar = document.createElement("div");
      bar.className = `pipeline-bar anim-slide-right anim-stagger-${Math.min(++barIndex, 8)}`;
      bar.dataset.status = status;
      const pct = Math.round((data.count / maxCount) * 100);
      bar.innerHTML = `
        <span class="pipeline-bar-label">${escapeHtml(status)}</span>
        <div class="pipeline-bar-progress">
          <div class="fill" style="width: ${pct}%"></div>
        </div>
        <span class="pipeline-bar-count">${data.count}</span>
      `;
      bar.addEventListener("click", () => expandPipelineStatus(status));
      barsEl.appendChild(bar);
    };

    result.statusOrder.forEach(status => renderBar(status, result.pipeline[status]));
    if (result.pipeline["Sans statut"] && result.pipeline["Sans statut"].count > 0) {
      renderBar("Sans statut", result.pipeline["Sans statut"]);
    }
  } catch (error) {
    loadingEl.style.display = "none";
    barsEl.innerHTML = `<div class="message-box error"><span class="message-icon">✕</span><span>${escapeHtml(error.message)}</span></div>`;
  }
}

function expandPipelineStatus(status) {
  if (!pipelineData) return;

  const detailEl = document.getElementById("pipelineDetail");
  const titleEl = document.getElementById("pipelineDetailTitle");
  const listEl = document.getElementById("pipelineDetailList");
  const closeBtn = document.getElementById("pipelineDetailClose");

  if (detailEl.style.display === "block" && titleEl.textContent.includes(status)) {
    detailEl.style.display = "none";
    document.querySelectorAll(".pipeline-bar").forEach(b => b.classList.remove("expanded"));
    return;
  }

  document.querySelectorAll(".pipeline-bar").forEach(b => {
    b.classList.toggle("expanded", b.dataset.status === status);
  });

  const data = pipelineData.pipeline[status];
  titleEl.textContent = `${status} (${data.count})`;
  listEl.innerHTML = "";

  data.prospects.forEach(p => {
    const item = document.createElement("div");
    item.className = "pipeline-prospect-item";
    item.innerHTML = `
      <div>
        <span class="pipeline-prospect-name">${escapeHtml(p.name)}</span>
        <span class="pipeline-prospect-company">${escapeHtml(p.company)}</span>
      </div>
    `;
    item.addEventListener("click", () => {
      if (p.notionUrl) chrome.tabs.create({ url: p.notionUrl });
    });
    listEl.appendChild(item);
  });

  if (data.count > 5) {
    const more = document.createElement("div");
    more.className = "pipeline-prospect-item";
    more.style.justifyContent = "center";
    more.style.color = "var(--accent-light)";
    more.textContent = `+ ${data.count - 5} autres...`;
    more.addEventListener("click", () => {
      document.getElementById("searchStatusFilter").value = status;
      document.getElementById("searchInput").value = "";
      switchView("searchView");
      executeSearch();
    });
    listEl.appendChild(more);
  }

  detailEl.style.display = "block";
  closeBtn.onclick = () => {
    detailEl.style.display = "none";
    document.querySelectorAll(".pipeline-bar").forEach(b => b.classList.remove("expanded"));
  };
}

// ============================================================
// FEATURE: OUTLOOK INTEGRATION
// ============================================================

async function setupOutlook() {
  // Afficher l'URI de redirection dans le guide
  const redirectUriEl = document.getElementById("outlookRedirectUri");
  if (redirectUriEl) {
    try {
      const redirectUri = chrome.identity.getRedirectURL("outlook");
      redirectUriEl.textContent = redirectUri;
    } catch (e) {
      redirectUriEl.textContent = "(non disponible hors extension)";
    }
  }

  // Bouton copier l'URI
  const copyBtn = document.getElementById("copyRedirectUri");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const uri = document.getElementById("outlookRedirectUri")?.textContent;
      if (uri) {
        navigator.clipboard.writeText(uri);
        showToast("URI copiee !", "success");
      }
    });
  }

  // Charger le Client ID sauvegarde
  const stored = await chrome.storage.local.get(["outlookClientId"]);
  if (stored.outlookClientId && el.outlookClientId) {
    el.outlookClientId.value = stored.outlookClientId;
  }

  // Verifier le statut de connexion
  await refreshOutlookStatus();

  // Bouton Connecter
  if (el.outlookConnectBtn) {
    el.outlookConnectBtn.addEventListener("click", async () => {
      const clientId = el.outlookClientId.value.trim();
      if (!clientId) {
        showToast("Entrez d'abord le Client ID Azure", "warning");
        return;
      }

      // Sauvegarder le Client ID
      await chrome.runtime.sendMessage({ action: "saveOutlookClientId", clientId });

      el.outlookConnectBtn.disabled = true;
      el.outlookConnectBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Connexion...';

      try {
        const result = await chrome.runtime.sendMessage({ action: "outlookLogin" });

        if (result.success) {
          showToast(`Outlook connecte : ${result.email}`, "success");
          if (el.outlookUserEmail) {
            el.outlookUserEmail.textContent = result.email;
            el.outlookUserEmail.style.display = "block";
          }
        } else {
          showToast(`Erreur : ${result.error}`, "error");
        }
      } catch (e) {
        showToast("Erreur de connexion Outlook", "error");
      }

      await refreshOutlookStatus();
      el.outlookConnectBtn.disabled = false;
      el.outlookConnectBtn.innerHTML = '<span class="btn-icon">🔗</span> Connecter Outlook';
    });
  }

  // Bouton Deconnecter
  if (el.outlookDisconnectBtn) {
    el.outlookDisconnectBtn.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ action: "outlookLogout" });
      showToast("Outlook deconnecte", "info");
      if (el.outlookUserEmail) el.outlookUserEmail.style.display = "none";
      await refreshOutlookStatus();
    });
  }

  // Refresh historique emails
  const emailHistoryRefresh = document.getElementById("emailHistoryRefresh");
  if (emailHistoryRefresh) {
    emailHistoryRefresh.addEventListener("click", () => loadEmailHistory());
  }

  // Listener pour relance depuis le widget
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "triggerRelanceFromWidget") {
      if (isOutlookConnected && request.email) {
        showOutlookDraftPreview(request.actionType, request.email);
      }
    }

    // Re-scan : le widget a détecté la section Expérience après le chargement initial
    // → mettre à jour les champs du sidepanel sans écraser les modifs utilisateur
    if (request.action === "dataUpdated" && request.data) {
      console.log("[AGATE Sidepanel] Données mises à jour par re-scan:", request.data);
      const d = request.data;

      // Mettre à jour entreprise si le re-scan a trouvé mieux
      if (d.company && el.fieldCompany && (!el.fieldCompany.value.trim() || el.fieldCompany.classList.contains("auto-filled"))) {
        el.fieldCompany.value = d.company;
        el.fieldCompany.classList.add("auto-filled");
        el.fieldCompany.classList.remove("field-missing");
      }

      // Mettre à jour le poste
      if (d.jobTitle && el.fieldJobTitle && (!el.fieldJobTitle.value.trim() || el.fieldJobTitle.classList.contains("auto-filled"))) {
        el.fieldJobTitle.value = d.jobTitle;
        el.fieldJobTitle.classList.add("auto-filled");
        el.fieldJobTitle.classList.remove("field-missing");
      }

      // Mettre à jour le secteur
      if (d.sector && el.fieldSector && (!el.fieldSector.value.trim() || el.fieldSector.classList.contains("auto-filled"))) {
        el.fieldSector.value = d.sector;
        el.fieldSector.classList.add("auto-filled");
      }

      // Mettre à jour la barre de statut
      const name = el.fieldName?.value || "";
      const company = d.company || el.fieldCompany?.value || "";
      if (name) {
        updateStatus("connected", `${name} - ${company || "..."}`);
      }
    }
  });
}

async function refreshOutlookStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ action: "outlookStatus" });
    isOutlookConnected = status.connected;

    if (el.outlookStatusIndicator) {
      if (status.connected) {
        el.outlookStatusIndicator.className = "outlook-status-indicator connected";
        if (el.outlookStatusLabel) el.outlookStatusLabel.textContent = "Connecte";
        if (el.outlookConnectBtn) el.outlookConnectBtn.style.display = "none";
        if (el.outlookDisconnectBtn) el.outlookDisconnectBtn.style.display = "flex";
      } else {
        el.outlookStatusIndicator.className = "outlook-status-indicator disconnected";
        if (el.outlookStatusLabel) el.outlookStatusLabel.textContent = "Non connecte";
        if (el.outlookConnectBtn) el.outlookConnectBtn.style.display = "flex";
        if (el.outlookDisconnectBtn) el.outlookDisconnectBtn.style.display = "none";
      }
    }

    updateRelanceBadges(status.connected);
  } catch (e) {
    console.warn("[AGATE] Impossible de verifier le statut Outlook:", e);
    isOutlookConnected = false;
  }
}

function updateRelanceBadges(connected) {
  document.querySelectorAll('.action-btn[data-action="r1"], .action-btn[data-action="r2"], .action-btn[data-action="r3"]').forEach(btn => {
    const existing = btn.querySelector(".outlook-badge");
    if (existing) existing.remove();

    if (connected) {
      const badge = document.createElement("span");
      badge.className = "outlook-badge";
      badge.title = "Envoi via Outlook";
      btn.appendChild(badge);
    }
  });
}

// ============================================================
// EMAIL HISTORY (Outlook)
// ============================================================

async function loadEmailHistory() {
  const container = document.getElementById("emailHistoryList");
  const section = document.getElementById("emailHistorySection");
  if (!container) return;

  const email = el.fieldEmail.value.trim();
  if (!email || !isOutlookConnected) {
    if (section) section.style.display = "none";
    return;
  }

  if (section) section.style.display = "block";
  container.innerHTML = '<div class="email-history-loading"><div class="spinner" style="width:20px;height:20px;border-width:2px;"></div></div>';

  try {
    const result = await chrome.runtime.sendMessage({
      action: "outlookGetHistory",
      email: email
    });

    if (!result.success || !result.emails || result.emails.length === 0) {
      container.innerHTML = '<div class="email-history-empty">Aucun email echange avec ce contact</div>';
      return;
    }

    container.innerHTML = "";
    result.emails.forEach(emailData => {
      const date = new Date(emailData.date);
      const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const dirIcon = emailData.direction === "sent" ? "➡️" : "⬅️";
      const dirClass = emailData.direction;

      const item = document.createElement("div");
      item.className = "email-history-item";
      item.innerHTML = `
        <span class="email-direction-icon ${dirClass}">${dirIcon}</span>
        <div class="email-history-content">
          <div class="email-history-meta">
            <span class="email-history-subject">${escapeHtml(emailData.subject)}</span>
            <span class="email-history-date">${dateStr} ${timeStr}</span>
          </div>
          <div class="email-history-preview">${escapeHtml(emailData.preview)}</div>
          <div class="email-history-body"></div>
        </div>
      `;

      item.addEventListener("click", async () => {
        const isExpanded = item.classList.contains("expanded");
        container.querySelectorAll(".email-history-item").forEach(i => i.classList.remove("expanded"));

        if (!isExpanded) {
          item.classList.add("expanded");
          const bodyDiv = item.querySelector(".email-history-body");
          if (!bodyDiv.innerHTML) {
            bodyDiv.textContent = "Chargement...";
            const bodyResult = await chrome.runtime.sendMessage({
              action: "outlookGetEmailBody",
              messageId: emailData.id
            });
            if (bodyResult.success) {
              bodyDiv.textContent = stripHtml(bodyResult.body);
            } else {
              bodyDiv.textContent = "(Impossible de charger le contenu)";
            }
          }
        }
      });

      container.appendChild(item);
    });
  } catch (err) {
    container.innerHTML = '<div class="email-history-empty">Erreur de chargement</div>';
    console.error("[AGATE] loadEmailHistory error:", err);
  }
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// escapeHtml() defini plus haut (ligne ~1440)

// ============================================================
// OUTLOOK DRAFT PREVIEW (R1/R2/R3)
// ============================================================

async function showOutlookDraftPreview(actionType, prospectEmail) {
  const prenom = (el.fieldName.value.trim().split(" ")[0]) || "Bonjour";
  const configLabel = ACTION_CONFIG[actionType]?.labelLong || actionType.toUpperCase();

  // 1. Trouver le dernier email envoye
  updateStatus("loading", "Recherche du dernier email...");

  let lastSent;
  try {
    lastSent = await chrome.runtime.sendMessage({
      action: "outlookFindLastSent",
      email: prospectEmail
    });
  } catch (e) {
    showToast("Erreur recherche email: " + e.message, "error");
    updateStatus("error", "Erreur recherche email");
    return;
  }

  if (!lastSent.success || !lastSent.found) {
    // Fallback mailto
    showToast("Aucun email precedent trouve — ouverture mailto", "info");
    const template = RELANCE_TEMPLATES[actionType];
    if (template) {
      const body = template.body.replace(/\{prenom\}/g, prenom);
      const subject = "Re: AGATE DIGITAL";
      window.open(`mailto:${prospectEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    }
    await executeRelanceNotionUpdate(actionType);
    return;
  }

  // 2. Creer le draft reply
  updateStatus("loading", "Creation du brouillon...");

  const template = RELANCE_TEMPLATES[actionType];
  const replyText = template ? template.body.replace(/\{prenom\}/g, prenom) : "";
  const replyHtml = replyText.replace(/\n/g, "<br>");

  let draft;
  try {
    draft = await chrome.runtime.sendMessage({
      action: "outlookCreateDraftReply",
      messageId: lastSent.messageId,
      body: replyHtml
    });
  } catch (e) {
    showToast("Erreur creation brouillon: " + e.message, "error");
    updateStatus("error", "Erreur brouillon");
    return;
  }

  if (!draft.success) {
    showToast(`Erreur brouillon: ${draft.error}`, "error");
    updateStatus("error", "Erreur brouillon");
    return;
  }

  currentDraftId = draft.draftId;
  updateStatus("connected", "Brouillon pret — verifiez et envoyez");

  // 3. Afficher l'overlay
  const overlay = document.createElement("div");
  overlay.className = "draft-preview-overlay";
  overlay.id = "draftPreviewOverlay";
  overlay.innerHTML = `
    <div class="draft-preview-panel">
      <div class="draft-preview-header">
        <span class="draft-preview-title">📧 ${escapeHtml(configLabel)} — Apercu</span>
        <button class="draft-preview-close" id="draftCloseBtn">✕</button>
      </div>
      <div class="draft-preview-recipient">A : ${escapeHtml(prospectEmail)}</div>
      <div class="draft-preview-subject">Re: ${escapeHtml(lastSent.subject || "")}</div>
      <div class="draft-preview-original collapsed" id="draftOriginal">
        ${escapeHtml(lastSent.bodyPreview || "Message original...")}
      </div>
      <div class="draft-preview-editor">
        <textarea class="draft-preview-textarea" id="draftTextarea">${escapeHtml(replyText)}</textarea>
      </div>
      <div class="draft-preview-actions">
        <button class="btn-cancel-draft" id="draftCancelBtn">Annuler</button>
        <button class="btn-send-outlook" id="draftSendBtn">
          <span>📤</span> Envoyer via Outlook
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Toggle message original
  document.getElementById("draftOriginal").addEventListener("click", function() {
    this.classList.toggle("collapsed");
  });

  // Annuler
  const closeDraft = () => {
    overlay.remove();
    currentDraftId = null;
    updateStatus("connected", "Brouillon annule");
  };

  document.getElementById("draftCancelBtn").addEventListener("click", closeDraft);
  document.getElementById("draftCloseBtn").addEventListener("click", closeDraft);

  // Envoyer
  document.getElementById("draftSendBtn").addEventListener("click", async () => {
    const sendBtn = document.getElementById("draftSendBtn");
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Envoi...';

    // Mettre a jour le brouillon avec le contenu modifie
    const editedText = document.getElementById("draftTextarea").value;
    const editedHtml = editedText.replace(/\n/g, "<br>");

    try {
      const updateResult = await chrome.runtime.sendMessage({
        action: "outlookUpdateDraft",
        draftId: currentDraftId,
        body: editedHtml
      });

      if (!updateResult.success) {
        showToast(`Erreur: ${updateResult.error}`, "error");
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>📤</span> Envoyer via Outlook';
        return;
      }

      // Envoyer le brouillon
      const sendResult = await chrome.runtime.sendMessage({
        action: "outlookSendDraft",
        draftId: currentDraftId
      });

      if (sendResult.success) {
        overlay.remove();
        currentDraftId = null;
        showToast(`${configLabel} envoyee via Outlook !`, "success");

        // Mettre a jour Notion
        await executeRelanceNotionUpdate(actionType);

        // Rafraichir l'historique emails
        loadEmailHistory();
      } else {
        showToast(`Erreur envoi: ${sendResult.error}`, "error");
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>📤</span> Envoyer via Outlook';
      }
    } catch (e) {
      showToast("Erreur: " + e.message, "error");
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span>📤</span> Envoyer via Outlook';
    }
  });
}

/**
 * Execute la mise a jour Notion pour une relance (R1/R2/R3)
 * Logique extraite de handleAction pour reutilisation
 */
async function executeRelanceNotionUpdate(actionType) {
  const config = ACTION_CONFIG[actionType];
  if (!config || !currentNotionPageId) return;

  const comment = el.actionCommentSp ? el.actionCommentSp.value.trim() : "";
  const settings = await chrome.storage.local.get(["notionApiKey"]);
  if (!settings.notionApiKey) return;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  let nextActionStr = null;

  if (config.delayDays > 0) {
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + config.delayDays);
    nextActionStr = nextDate.toISOString().split("T")[0];
  }

  try {
    await chrome.runtime.sendMessage({
      action: "updateNotionPage",
      pageId: currentNotionPageId,
      updates: { lastAction: todayStr, nextAction: nextActionStr, status: config.status },
      apiKey: settings.notionApiKey
    });

    await chrome.runtime.sendMessage({
      action: "appendHistory",
      pageId: currentNotionPageId,
      actionType: config.labelLong + (isOutlookConnected ? " (Outlook)" : ""),
      comment: comment,
      apiKey: settings.notionApiKey
    });

    if (el.actionCommentSp) el.actionCommentSp.value = "";

    let feedbackText = `✅ ${config.labelLong} enregistre`;
    if (el.actionFeedback) {
      el.actionFeedback.textContent = feedbackText;
      el.actionFeedback.style.display = "block";
      el.actionFeedback.style.color = "var(--success)";
      el.actionFeedback.style.background = "rgba(46, 204, 113, 0.12)";
      el.actionFeedback.style.borderColor = "rgba(46, 204, 113, 0.4)";
    }

    loadHistorySp();
  } catch (error) {
    console.error("[AGATE] Erreur Notion update relance:", error);
  }
}

// ============================================================
// KANBAN TACHES (Phase 10)
// ============================================================

/**
 * Détermine le type de relance suivante selon le statut actuel du prospect
 * Retourne "R1", "R2", "R3" ou "rappel"
 */
function getNextRelanceType(status) {
  const s = (status || "").toLowerCase().trim();
  // Mapping statut actuel → prochaine action à faire
  if (s.includes("mail envoy") || s.includes("premier contact") || s.includes("contacté") || s === "mail envoyé") return "R1";
  if (s === "r1" || s.includes("relance 1") || s.includes("r1 envoy")) return "R2";
  if (s === "r2" || s.includes("relance 2") || s.includes("r2 envoy")) return "R3";
  if (s === "r3" || s.includes("relance 3") || s.includes("r3 envoy")) return "rappel";
  if (s.includes("rappel") || s.includes("à rappeler") || s.includes("a rappeler")) return "rappel";
  // Par défaut, si on ne sait pas → R1
  return "R1";
}

/** Variable pour mémoriser la vue active du Kanban */
let kanbanActiveView = "action"; // "action" ou "urgency"

/**
 * Charge la vue Kanban avec les taches triées
 * Remplit les deux vues : par action (R1/R2/R3/Rappels) et par urgence (retard/aujourd'hui/à venir)
 */
async function loadTasksView() {
  const boardAction = document.getElementById("kanbanBoardAction");
  const boardUrgency = document.getElementById("kanbanBoardUrgency");
  const emptyEl = document.getElementById("tasksEmpty");
  const loadingEl = document.getElementById("tasksLoading");

  if (!boardAction && !boardUrgency) return;
  if (boardAction) boardAction.style.display = "none";
  if (boardUrgency) boardUrgency.style.display = "none";
  if (emptyEl) emptyEl.style.display = "none";
  if (loadingEl) loadingEl.style.display = "flex";

  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    if (loadingEl) loadingEl.style.display = "none";
    showActiveKanbanBoard();
    const emptyMsg = '<div class="kanban-column-empty">Configurez Notion</div>';
    ["kanbanR1List", "kanbanR2List", "kanbanR3List", "kanbanRappelList",
     "kanbanOverdueList", "kanbanTodayList", "kanbanUpcomingList"].forEach(id => {
      const colEl = document.getElementById(id);
      if (colEl) colEl.innerHTML = emptyMsg;
    });
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({
      action: "queryPendingFollowups",
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    if (loadingEl) loadingEl.style.display = "none";

    const allItems = buildReminderItems(result.success ? result.followups : []);

    if (allItems.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      updateTaskBadge(0);
      return;
    }

    showActiveKanbanBoard();

    // === VUE PAR ACTION (R1/R2/R3/Rappels) ===
    const r1Items = allItems.filter(i => getNextRelanceType(i.actionType) === "R1")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const r2Items = allItems.filter(i => getNextRelanceType(i.actionType) === "R2")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const r3Items = allItems.filter(i => getNextRelanceType(i.actionType) === "R3")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const rappelItems = allItems.filter(i => getNextRelanceType(i.actionType) === "rappel")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    renderKanbanColumn(r1Items, "kanbanR1List", "kanbanR1Count", "action-r1");
    renderKanbanColumn(r2Items, "kanbanR2List", "kanbanR2Count", "action-r2");
    renderKanbanColumn(r3Items, "kanbanR3List", "kanbanR3Count", "action-r3");
    renderKanbanColumn(rappelItems, "kanbanRappelList", "kanbanRappelCount", "action-rappel");

    // === VUE PAR URGENCE (classique) ===
    const overdue = allItems.filter(i => i.urgency === 0).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const today = allItems.filter(i => i.urgency === 1).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const upcoming = allItems.filter(i => i.urgency === 2).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    renderKanbanColumn(overdue, "kanbanOverdueList", "kanbanOverdueCount", "overdue");
    renderKanbanColumn(today, "kanbanTodayList", "kanbanTodayCount", "today");
    renderKanbanColumn(upcoming, "kanbanUpcomingList", "kanbanUpcomingCount", "upcoming");

    updateTaskBadge(overdue.length);
  } catch (error) {
    if (loadingEl) loadingEl.style.display = "none";
    showActiveKanbanBoard();
    console.error("[AGATE] Erreur chargement Kanban:", error);
  }
}

/** Affiche le bon board Kanban selon la vue active */
function showActiveKanbanBoard() {
  const boardAction = document.getElementById("kanbanBoardAction");
  const boardUrgency = document.getElementById("kanbanBoardUrgency");
  if (boardAction) boardAction.style.display = kanbanActiveView === "action" ? "flex" : "none";
  if (boardUrgency) boardUrgency.style.display = kanbanActiveView === "urgency" ? "flex" : "none";
}

/** Setup toggle entre les deux vues Kanban */
function setupKanbanViewToggle() {
  const btnAction = document.getElementById("kanbanViewAction");
  const btnUrgency = document.getElementById("kanbanViewUrgency");
  if (!btnAction || !btnUrgency) return;

  btnAction.addEventListener("click", () => {
    kanbanActiveView = "action";
    btnAction.classList.add("active");
    btnUrgency.classList.remove("active");
    showActiveKanbanBoard();
  });

  btnUrgency.addEventListener("click", () => {
    kanbanActiveView = "urgency";
    btnUrgency.classList.add("active");
    btnAction.classList.remove("active");
    showActiveKanbanBoard();
  });
}

function renderKanbanColumn(items, listId, countId, urgencyClass) {
  const listEl = document.getElementById(listId);
  const countEl = document.getElementById(countId);
  if (!listEl) return;

  countEl.textContent = items.length;
  listEl.innerHTML = "";

  if (items.length === 0) {
    listEl.innerHTML = '<div class="kanban-column-empty">Aucune tâche</div>';
    return;
  }

  items.forEach((item, index) => {
    const card = createKanbanCard(item, urgencyClass);
    card.classList.add("anim-slide-down", `anim-stagger-${Math.min(index + 1, 8)}`);
    listEl.appendChild(card);
  });
}

function createKanbanCard(item, urgencyClass) {
  const card = document.createElement("div");
  card.className = `kanban-card ${urgencyClass}`;
  card.draggable = true;

  const dueDate = new Date(item.dueDate);
  const dateLabel = dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  // Calculer le score pour la carte Kanban
  const scoreResult = calculateProspectScore({
    sector: item.sector || "",
    jobTitle: item.jobTitle || "",
    tags: item.tags || [],
    status: item.actionType || "",
    lastActionDate: item.lastAction || null,
    email: item.email || "",
    phone: ""
  });
  const scoreBadgeHtml = `<span class="kanban-card-score ${scoreResult.level}">${scoreResult.score}</span>`;

  // Déterminer le type de relance suivante
  const nextRelance = getNextRelanceType(item.actionType);

  // Boutons d'action rapide selon le type de relance
  let actionButtonsHtml = "";
  if (nextRelance === "R1") {
    actionButtonsHtml = `
      <div class="kanban-card-actions">
        <button class="kanban-action-btn action-r1" data-relance="r1" title="Envoyer Relance 1">R1</button>
      </div>`;
  } else if (nextRelance === "R2") {
    actionButtonsHtml = `
      <div class="kanban-card-actions">
        <button class="kanban-action-btn action-r2" data-relance="r2" title="Envoyer Relance 2">R2</button>
      </div>`;
  } else if (nextRelance === "R3") {
    actionButtonsHtml = `
      <div class="kanban-card-actions">
        <button class="kanban-action-btn action-r3" data-relance="r3" title="Envoyer Relance 3">R3</button>
      </div>`;
  } else {
    actionButtonsHtml = `
      <div class="kanban-card-actions">
        <button class="kanban-action-btn action-rappel" data-relance="rappel" title="Rappeler">📞</button>
      </div>`;
  }

  card.innerHTML = `
    <div class="kanban-card-header-row">
      <div class="kanban-card-name">${escapeHtml(formatName(item.name))} ${scoreBadgeHtml}</div>
      ${actionButtonsHtml}
    </div>
    <div class="kanban-card-company">${escapeHtml(item.company || "—")}</div>
    <div class="kanban-card-footer">
      <span class="kanban-card-status">${escapeHtml(item.actionType)}</span>
      <span class="kanban-card-date ${urgencyClass}">${dateLabel}</span>
    </div>
  `;

  // Gestionnaire clic sur les boutons de relance
  card.querySelectorAll(".kanban-action-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const relanceType = btn.dataset.relance;
      showRelancePopup(item, relanceType);
    });
  });

  // Drag & Drop
  card.addEventListener("dragstart", (e) => {
    if (massSelectionMode) { e.preventDefault(); return; }
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      pageId: item.pageId,
      name: item.name,
      company: item.company,
      actionType: item.actionType,
      currentUrgency: urgencyClass
    }));
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    // Nettoyer tous les indicateurs drag-over
    document.querySelectorAll(".kanban-column-body.drag-over").forEach(col => col.classList.remove("drag-over"));
  });

  card.addEventListener("click", () => {
    // Mode sélection en masse
    if (massSelectionMode) {
      handleMassCardClick(card, {
        pageId: item.pageId,
        name: item.name,
        company: item.company,
        email: item.email || "",
        sector: item.sector || "",
        jobTitle: item.jobTitle || "",
        tags: item.tags || []
      });
      return;
    }
    // Charger le contact dans le formulaire principal
    loadContactIntoForm({
      pageId: item.pageId,
      name: item.name,
      company: item.company,
      status: item.actionType,
      email: "",
      linkedinUrl: ""
    });
  });

  // En mode sélection, ajouter la checkbox
  if (massSelectionMode) {
    card.classList.add("selectable");
    const cb = document.createElement("div");
    cb.className = "kanban-card-checkbox";
    cb.textContent = "✓";
    card.appendChild(cb);
  }

  return card;
}

function updateTaskBadge(overdueCount) {
  const badge = document.getElementById("taskOverdueBadge");
  if (!badge) return;
  badge.textContent = overdueCount;
  badge.style.display = overdueCount > 0 ? "inline-flex" : "none";
}

// ============================================================
// RELANCE POPUP — Template personnalisé depuis le Kanban
// ============================================================

/**
 * Affiche une popup de relance personnalisée avec les données du prospect
 * @param {Object} item - Item du Kanban (pageId, name, company, email, sector, tags, jobTitle, actionType)
 * @param {string} relanceType - "r1", "r2", "r3" ou "rappel"
 */
function showRelancePopup(item, relanceType) {
  // Supprimer une popup existante
  const existingOverlay = document.getElementById("relancePopupOverlay");
  if (existingOverlay) existingOverlay.remove();

  const prenom = (item.name || "").split(" ")[0] || "Bonjour";
  const entreprise = item.company || "";
  const poste = item.jobTitle || "";
  const secteur = item.sector || "";
  const tags = (item.tags || []).join(", ");

  // Si c'est un rappel téléphonique, afficher une popup simplifiée
  if (relanceType === "rappel") {
    showRappelPopup(item);
    return;
  }

  // Récupérer le template de relance
  const template = RELANCE_TEMPLATES[relanceType];
  if (!template) return;

  // Personnaliser le template avec les données du prospect
  const personalizedBody = template.body
    .replace(/\{prenom\}/g, prenom)
    .replace(/\{entreprise\}/g, entreprise)
    .replace(/\{poste\}/g, poste)
    .replace(/\{secteur\}/g, secteur)
    .replace(/\{tags\}/g, tags);

  const relanceLabels = { r1: "Relance 1", r2: "Relance 2", r3: "Relance 3" };
  const relanceColors = { r1: "var(--info)", r2: "var(--warning)", r3: "var(--error)" };

  const overlay = document.createElement("div");
  overlay.id = "relancePopupOverlay";
  overlay.className = "relance-popup-overlay";

  overlay.innerHTML = `
    <div class="relance-popup-panel">
      <div class="relance-popup-header">
        <span class="relance-popup-badge" style="background:${relanceColors[relanceType]}">${relanceLabels[relanceType]}</span>
        <span class="relance-popup-prospect">${escapeHtml(formatName(item.name))}</span>
        <button class="relance-popup-close" id="relancePopupClose">✕</button>
      </div>
      <div class="relance-popup-meta">
        <span>${escapeHtml(entreprise)}</span>
        ${poste ? `<span> · ${escapeHtml(poste)}</span>` : ""}
        ${item.email ? `<span class="relance-popup-email">${escapeHtml(item.email)}</span>` : '<span class="relance-popup-no-email">⚠ Pas d\'email</span>'}
      </div>
      <div class="relance-popup-body">
        <label class="relance-popup-label">Message personnalisé</label>
        <textarea class="relance-popup-textarea" id="relanceBodyEdit" rows="8">${escapeHtml(personalizedBody)}</textarea>
      </div>
      <div class="relance-popup-actions">
        <button class="relance-popup-btn relance-btn-send" id="relanceSendBtn" ${!item.email ? "disabled" : ""}>
          ✉️ Envoyer ${relanceLabels[relanceType]}
        </button>
        <button class="relance-popup-btn relance-btn-copy" id="relanceCopyBtn">
          📋 Copier
        </button>
        <button class="relance-popup-btn relance-btn-cancel" id="relanceCancelBtn">
          Annuler
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Fermer la popup
  const closePopup = () => overlay.remove();
  overlay.querySelector("#relancePopupClose").addEventListener("click", closePopup);
  overlay.querySelector("#relanceCancelBtn").addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePopup(); });

  // Copier le texte
  overlay.querySelector("#relanceCopyBtn").addEventListener("click", () => {
    const text = overlay.querySelector("#relanceBodyEdit").value;
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Message copié !", "success");
    });
  });

  // Envoyer le mail
  overlay.querySelector("#relanceSendBtn").addEventListener("click", async () => {
    const body = overlay.querySelector("#relanceBodyEdit").value;
    if (!item.email) {
      showToast("Pas d'email disponible", "warning");
      return;
    }

    const subject = (template.subject || `Relance — ${entreprise || prenom}`)
      .replace(/\{prenom\}/g, prenom)
      .replace(/\{entreprise\}/g, entreprise)
      .replace(/\{poste\}/g, poste)
      .replace(/\{secteur\}/g, secteur)
      .replace(/\{tags\}/g, tags);

    // Envoyer via Outlook si connecté, sinon mailto
    if (isOutlookConnected) {
      try {
        const lastSent = await chrome.runtime.sendMessage({
          action: "outlookFindLastSent",
          email: item.email
        });

        if (lastSent.success && lastSent.found) {
          const replyHtml = body.replace(/\n/g, "<br>");
          const draft = await chrome.runtime.sendMessage({
            action: "outlookCreateDraftReply",
            messageId: lastSent.messageId,
            body: replyHtml
          });
          if (draft.success) {
            await chrome.runtime.sendMessage({
              action: "outlookSendDraft",
              draftId: draft.draftId
            });
            showToast(`✉️ ${relanceLabels[relanceType]} envoyée à ${item.name}`, "success");
          }
        } else {
          // Pas de mail précédent → mailto
          window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
          showToast(`✉️ Mail ouvert pour ${item.name}`, "info");
        }
      } catch (e) {
        console.error("[AGATE] Relance Outlook error:", e);
        window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      }
    } else {
      window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      showToast(`✉️ Mail ouvert pour ${item.name}`, "info");
    }

    // Mettre à jour le statut dans Notion
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (item.pageId && settings.notionApiKey) {
      const newStatus = relanceType.toUpperCase(); // "R1", "R2", "R3"
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (relanceType === "r1" ? 3 : relanceType === "r2" ? 5 : 7));

      chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: item.pageId,
        updates: {
          status: newStatus,
          nextAction: nextDate.toISOString().split("T")[0]
        },
        apiKey: settings.notionApiKey
      }).catch(() => {});

      chrome.runtime.sendMessage({
        action: "appendHistory",
        pageId: item.pageId,
        actionType: `${relanceLabels[relanceType]} envoyée`,
        comment: `Via Kanban — ${entreprise}`,
        apiKey: settings.notionApiKey
      }).catch(() => {});
    }

    closePopup();
    // Rafraîchir le Kanban
    await loadTasksView();
  });
}

/**
 * Popup simplifiée pour un rappel téléphonique
 */
function showRappelPopup(item) {
  const existingOverlay = document.getElementById("relancePopupOverlay");
  if (existingOverlay) existingOverlay.remove();

  const prenom = (item.name || "").split(" ")[0] || "";
  const overlay = document.createElement("div");
  overlay.id = "relancePopupOverlay";
  overlay.className = "relance-popup-overlay";

  overlay.innerHTML = `
    <div class="relance-popup-panel relance-popup-rappel">
      <div class="relance-popup-header">
        <span class="relance-popup-badge" style="background:var(--success)">📞 Rappel</span>
        <span class="relance-popup-prospect">${escapeHtml(formatName(item.name))}</span>
        <button class="relance-popup-close" id="relancePopupClose">✕</button>
      </div>
      <div class="relance-popup-meta">
        <span>${escapeHtml(item.company || "")}</span>
        ${item.jobTitle ? `<span> · ${escapeHtml(item.jobTitle)}</span>` : ""}
      </div>
      <div class="relance-popup-body">
        <label class="relance-popup-label">Notes d'appel</label>
        <textarea class="relance-popup-textarea" id="rappelNotes" rows="4" placeholder="Résumé de l'appel, prochaines étapes..."></textarea>
      </div>
      <div class="relance-popup-actions">
        <button class="relance-popup-btn relance-btn-send" id="rappelDoneBtn">✅ Appel effectué</button>
        <button class="relance-popup-btn relance-btn-snooze" id="rappelSnoozeBtn">⏰ Reporter +3j</button>
        <button class="relance-popup-btn relance-btn-cancel" id="rappelCancelBtn">Annuler</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closePopup = () => overlay.remove();
  overlay.querySelector("#relancePopupClose").addEventListener("click", closePopup);
  overlay.querySelector("#rappelCancelBtn").addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePopup(); });

  // Appel effectué → log + mettre à jour
  overlay.querySelector("#rappelDoneBtn").addEventListener("click", async () => {
    const notes = overlay.querySelector("#rappelNotes").value.trim();
    const settings = await chrome.storage.local.get(["notionApiKey"]);

    if (item.pageId && settings.notionApiKey) {
      chrome.runtime.sendMessage({
        action: "appendHistory",
        pageId: item.pageId,
        actionType: "Appel effectué",
        comment: notes || "Rappel depuis le Kanban",
        apiKey: settings.notionApiKey
      }).catch(() => {});

      // Reporter le prochain suivi dans 7 jours
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: item.pageId,
        updates: { nextAction: nextDate.toISOString().split("T")[0] },
        apiKey: settings.notionApiKey
      }).catch(() => {});
    }

    showToast(`📞 Appel à ${prenom} enregistré`, "success");
    closePopup();
    await loadTasksView();
  });

  // Reporter l'appel
  overlay.querySelector("#rappelSnoozeBtn").addEventListener("click", async () => {
    const settings = await chrome.storage.local.get(["notionApiKey"]);

    if (item.pageId && settings.notionApiKey) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: item.pageId,
        updates: { nextAction: nextDate.toISOString().split("T")[0] },
        apiKey: settings.notionApiKey
      }).catch(() => {});
    }

    showToast(`⏰ Rappel de ${prenom} reporté de 3 jours`, "info");
    closePopup();
    await loadTasksView();
  });
}

// ============================================================
// KANBAN DRAG & DROP
// ============================================================

/**
 * Calcule la nouvelle date selon la colonne cible
 * overdue = hier, today = aujourd'hui, upcoming = demain
 */
function calculateNewDateForColumn(targetColumnId) {
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  if (targetColumnId === "kanbanOverdueList") {
    now.setDate(now.getDate() - 1); // Hier
  } else if (targetColumnId === "kanbanTodayList") {
    // Aujourd'hui — pas de changement
  } else if (targetColumnId === "kanbanUpcomingList") {
    now.setDate(now.getDate() + 1); // Demain
  }

  return now.toISOString().split("T")[0]; // Format YYYY-MM-DD
}

/**
 * Setup drag & drop via event delegation sur le kanban board
 * Appelé une seule fois au DOMContentLoaded
 */
function setupKanbanDragDrop() {
  // Appliquer le drag & drop sur les DEUX boards (action + urgence)
  const boards = [
    document.getElementById("kanbanBoardAction"),
    document.getElementById("kanbanBoardUrgency")
  ].filter(Boolean);

  if (boards.length === 0) return;

  // Mapping colonne → urgency class pour le feedback visuel
  const columnMapping = {
    "kanbanOverdueList": "overdue",
    "kanbanTodayList": "today",
    "kanbanUpcomingList": "upcoming"
  };

  boards.forEach(board => {
  // Event delegation : dragover sur les colonnes
  board.addEventListener("dragover", (e) => {
    const columnBody = e.target.closest(".kanban-column-body");
    if (!columnBody) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    columnBody.classList.add("drag-over");
  });

  // Event delegation : dragleave
  board.addEventListener("dragleave", (e) => {
    const columnBody = e.target.closest(".kanban-column-body");
    if (!columnBody) return;
    // Vérifier qu'on quitte vraiment la colonne (pas juste un enfant)
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && columnBody.contains(relatedTarget)) return;
    columnBody.classList.remove("drag-over");
  });

  // Event delegation : drop
  board.addEventListener("drop", async (e) => {
    e.preventDefault();
    const columnBody = e.target.closest(".kanban-column-body");
    if (!columnBody) return;
    columnBody.classList.remove("drag-over");

    // Récupérer les données de la carte
    let cardData;
    try {
      cardData = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch { return; }

    if (!cardData || !cardData.pageId) return;

    // Vérifier si la colonne cible est différente de la colonne source
    const targetUrgency = columnMapping[columnBody.id];
    if (targetUrgency === cardData.currentUrgency) return; // Même colonne, rien à faire

    // Calculer la nouvelle date
    const newDate = calculateNewDateForColumn(columnBody.id);

    // Mettre à jour dans Notion
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey) {
      showToast("Configurez d'abord Notion", "error");
      return;
    }

    try {
      showToast(`Déplacement de ${cardData.name}...`, "info");

      const result = await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: cardData.pageId,
        updates: { nextAction: newDate },
        apiKey: settings.notionApiKey
      });

      if (result.success) {
        const targetLabel = { overdue: "En retard", today: "Aujourd'hui", upcoming: "À venir" }[targetUrgency];
        showToast(`${cardData.name} → ${targetLabel}`, "success");
        // Recharger le kanban pour refléter le changement
        await loadTasksView();
      } else {
        showToast("Erreur Notion : " + (result.error || "Inconnue"), "error");
      }
    } catch (err) {
      console.error("[AGATE] Erreur drag & drop Kanban:", err);
      showToast("Erreur lors du déplacement", "error");
    }
  });

  }); // fin boards.forEach

  console.log("[AGATE] Kanban drag & drop initialisé");
}

// ============================================================
// 12.1 — SCORING PROSPECT INTELLIGENT
// Calcul automatique du score + badge coloré
// ============================================================

/** Recalcule et affiche le score du prospect courant */
function updateProspectScore() {
  const scoreSection = document.getElementById("scoreSection");
  const scoreBadge = document.getElementById("scoreBadge");
  const scoreLabel = document.getElementById("scoreLabel");
  const scoreDetailsEl = document.getElementById("scoreDetails");
  if (!scoreSection || !scoreBadge || !scoreLabel) return;

  const data = {
    sector: el.fieldSector?.value?.trim() || "",
    jobTitle: el.fieldJobTitle?.value?.trim() || "",
    tags: currentTags || [],
    status: el.fieldStatus?.value?.trim() || "",
    lastActionDate: null, // sera rempli si contact existant
    email: el.fieldEmail?.value?.trim() || "",
    phone: el.fieldPhone?.value?.trim() || ""
  };

  // Récupérer lastActionDate depuis la bannière existante si disponible
  const banner = document.getElementById("existingContactBanner");
  if (banner && banner._lastActionDate) {
    data.lastActionDate = banner._lastActionDate;
  }

  const result = calculateProspectScore(data);

  // Afficher le badge
  scoreBadge.textContent = result.score;
  scoreBadge.className = `score-badge ${result.level}`;

  const levelLabels = { hot: "Chaud", warm: "Tiède", cold: "Froid" };
  scoreLabel.textContent = levelLabels[result.level] || "";
  scoreLabel.className = `score-label ${result.level}`;

  scoreSection.style.display = "inline-flex";

  // Construire les détails
  if (scoreDetailsEl) {
    let html = result.details.map(d => {
      const match = d.match(/([+-]?\d+)$/);
      const pts = match ? parseInt(match[1]) : 0;
      const isPositive = pts >= 0;
      return `<div class="score-detail-line">
        <span>${escapeHtml(d.replace(/[+-]?\d+$/, "").trim())}</span>
        <span class="score-pts ${isPositive ? "positive" : "negative"}">${isPositive ? "+" : ""}${pts}</span>
      </div>`;
    }).join("");

    html += `<div class="score-progress-bar">
      <div class="score-progress-fill" style="width:${result.score}%;background:${result.color};"></div>
    </div>`;

    scoreDetailsEl.innerHTML = html;
  }

  // Toggle détails au clic
  if (!scoreSection._listenerSet) {
    scoreSection.addEventListener("click", (e) => {
      e.stopPropagation();
      if (scoreDetailsEl) {
        scoreDetailsEl.style.display = scoreDetailsEl.style.display === "none" ? "block" : "none";
      }
    });
    scoreSection._listenerSet = true;
  }

  return result;
}

// ============================================================
// 12.2 — SUGGESTIONS DE RELANCE INTELLIGENTES
// Affiche une suggestion contextuelle dans les actions rapides
// ============================================================

/**
 * Analyse le statut + historique du prospect et suggère la prochaine action
 * Appelé après chaque chargement de contact existant
 */
function showSmartRelanceSuggestion() {
  // Supprimer l'ancienne suggestion
  const existing = document.querySelector(".relance-suggestion");
  if (existing) existing.remove();

  if (!currentNotionPageId || !el.actionsSection) return;

  const status = el.fieldStatus?.value?.trim() || "";
  const banner = document.getElementById("existingContactBanner");
  const lastActionDate = banner?._lastActionDate || null;
  const nextActionDate = banner?._nextActionDate || null;

  let suggestion = null;

  if (nextActionDate) {
    const nextDate = new Date(nextActionDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // En retard
      const absDays = Math.abs(diffDays);
      suggestion = {
        icon: "⚠️",
        title: `Action en retard de ${absDays}j`,
        detail: `Prévue le ${nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`,
        action: getRelanceActionForStatus(status),
        label: "Relancer"
      };
    } else if (diffDays === 0) {
      suggestion = {
        icon: "🎯",
        title: "Action prévue aujourd'hui !",
        detail: `Statut actuel : ${status}`,
        action: getRelanceActionForStatus(status),
        label: "Action"
      };
    }
  } else if (lastActionDate) {
    const lastDate = new Date(lastActionDate);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "Mail envoye" && daysSince >= 3) {
      suggestion = {
        icon: "🔄",
        title: `Mail envoyé il y a ${daysSince}j — temps de relancer`,
        detail: "R1 recommandée après 3 jours",
        action: "r1",
        label: "R1"
      };
    } else if (status === "R1" && daysSince >= 7) {
      suggestion = {
        icon: "🔄",
        title: `R1 envoyée il y a ${daysSince}j — passer en R2`,
        detail: "R2 recommandée après 7 jours",
        action: "r2",
        label: "R2"
      };
    } else if (status === "R2" && daysSince >= 7) {
      suggestion = {
        icon: "🔄",
        title: `R2 envoyée il y a ${daysSince}j — dernière relance`,
        detail: "R3 recommandée après 7 jours",
        action: "r3",
        label: "R3"
      };
    } else if (status === "A rappeler" && daysSince >= 2) {
      suggestion = {
        icon: "🔔",
        title: `Rappel prévu il y a ${daysSince}j`,
        detail: "Pensez à rappeler ce prospect",
        action: "appeler",
        label: "Appeler"
      };
    } else if (status === "A contacter" || status === "À contacter") {
      suggestion = {
        icon: "✉️",
        title: "Nouveau prospect — premier contact",
        detail: "Envoyez un premier mail ou appelez",
        action: "mail",
        label: "Mail"
      };
    }
  } else if (!lastActionDate && (status === "A contacter" || status === "À contacter" || !status)) {
    suggestion = {
      icon: "🚀",
      title: "Aucune action enregistrée",
      detail: "Commencez par un mail ou un appel",
      action: "mail",
      label: "Mail"
    };
  }

  if (!suggestion) return;

  const div = document.createElement("div");
  div.className = "relance-suggestion";
  div.innerHTML = `
    <span class="relance-suggestion-icon">${suggestion.icon}</span>
    <div class="relance-suggestion-text">
      <strong>${escapeHtml(suggestion.title)}</strong>
      <small>${escapeHtml(suggestion.detail)}</small>
    </div>
    <span class="relance-suggestion-action">${escapeHtml(suggestion.label)}</span>
  `;

  div.addEventListener("click", () => {
    if (suggestion.action === "mail") {
      // Ouvrir le dropdown email
      if (el.emailDropdownSp) el.emailDropdownSp.classList.add("open");
    } else if (suggestion.action === "appeler") {
      handleAction("appeler");
    } else {
      handleAction(suggestion.action);
    }
    div.remove();
  });

  // Insérer au début de la section actions, après le titre
  const actionsBar = el.actionsSection.querySelector(".actions-bar");
  if (actionsBar) {
    el.actionsSection.insertBefore(div, actionsBar);
  }
}

function getRelanceActionForStatus(status) {
  const map = {
    "Mail envoye": "r1", "R1": "r2", "R2": "r3", "R3": "close",
    "A rappeler": "appeler", "À rappeler": "appeler",
    "A contacter": "mail", "À contacter": "mail",
    "NRP": "appeler"
  };
  return map[status] || "mail";
}

// ============================================================
// 12.3 — RECHERCHE & FILTRES AVANCÉS
// Filtres par secteur, tri par score/date
// ============================================================

let searchSectorFilter = "";
let searchSortBy = "relevance"; // relevance, score, date

function setupAdvancedSearch() {
  const filtersContainer = document.getElementById("searchFiltersAdvanced");
  const sortSelect = document.getElementById("searchSortBy");

  if (filtersContainer) {
    // Générer les chips de secteur
    const sectors = ["Retail", "Ecommerce", "Télécoms", "Médias", "Luxe", "Grande Distribution", "Conseil", "Hospitality"];
    filtersContainer.innerHTML = sectors.map(s =>
      `<span class="search-filter-chip" data-sector="${s}">${s}</span>`
    ).join("");

    filtersContainer.addEventListener("click", (e) => {
      const chip = e.target.closest(".search-filter-chip");
      if (!chip) return;

      const wasActive = chip.classList.contains("active");
      filtersContainer.querySelectorAll(".search-filter-chip").forEach(c => c.classList.remove("active"));

      if (!wasActive) {
        chip.classList.add("active");
        searchSectorFilter = chip.dataset.sector;
      } else {
        searchSectorFilter = "";
      }
      executeSearch();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      searchSortBy = sortSelect.value;
      executeSearch();
    });
  }
}

// ============================================================
// 12.4 — CAMPAGNE EMAIL EN MASSE
// Sélection multiple dans le Kanban + envoi groupé
// ============================================================

let massSelectionMode = false;
let massSelectedCards = []; // Array of { pageId, name, email, company, tags }

/** Retourne le board Kanban actuellement visible */
function getActiveKanbanBoard() {
  if (kanbanActiveView === "action") return document.getElementById("kanbanBoardAction");
  return document.getElementById("kanbanBoardUrgency");
}

/** Active/désactive le mode sélection en masse */
function toggleMassSelectionMode() {
  massSelectionMode = !massSelectionMode;
  massSelectedCards = [];

  const board = getActiveKanbanBoard();
  if (!board) return;

  if (massSelectionMode) {
    board.classList.add("mass-selection-mode");
    showMassBar();
    // Ajouter les checkboxes à toutes les cartes
    board.querySelectorAll(".kanban-card").forEach(card => {
      card.classList.add("selectable");
      if (!card.querySelector(".kanban-card-checkbox")) {
        const cb = document.createElement("div");
        cb.className = "kanban-card-checkbox";
        cb.textContent = "✓";
        card.appendChild(cb);
      }
    });
  } else {
    board.classList.remove("mass-selection-mode");
    hideMassBar();
    board.querySelectorAll(".kanban-card").forEach(card => {
      card.classList.remove("selectable", "selected");
      const cb = card.querySelector(".kanban-card-checkbox");
      if (cb) cb.remove();
    });
  }
}

function showMassBar() {
  let bar = document.getElementById("kanbanMassBar");
  if (bar) bar.remove();

  bar = document.createElement("div");
  bar.id = "kanbanMassBar";
  bar.className = "kanban-mass-bar";
  bar.innerHTML = `
    <span><span class="mass-count">0</span> prospect(s) sélectionné(s)</span>
    <div class="kanban-mass-actions">
      <button class="kanban-mass-btn" id="massSendEmailBtn">✉️ Envoyer</button>
      <button class="kanban-mass-btn btn-mass-cancel" id="massCancelBtn">✕ Annuler</button>
    </div>
  `;

  const board = getActiveKanbanBoard();
  if (board) board.parentNode.insertBefore(bar, board);

  document.getElementById("massSendEmailBtn").addEventListener("click", showMassTemplateSelector);
  document.getElementById("massCancelBtn").addEventListener("click", toggleMassSelectionMode);
}

function hideMassBar() {
  const bar = document.getElementById("kanbanMassBar");
  if (bar) bar.remove();
}

function updateMassBar() {
  const countEl = document.querySelector("#kanbanMassBar .mass-count");
  if (countEl) countEl.textContent = massSelectedCards.length;
  const sendBtn = document.getElementById("massSendEmailBtn");
  if (sendBtn) sendBtn.disabled = massSelectedCards.length === 0;
}

/** Handler de clic sur une carte en mode sélection */
function handleMassCardClick(card, cardData) {
  if (!massSelectionMode) return false;

  card.classList.toggle("selected");
  const isSelected = card.classList.contains("selected");

  if (isSelected) {
    if (!massSelectedCards.find(c => c.pageId === cardData.pageId)) {
      massSelectedCards.push(cardData);
    }
  } else {
    massSelectedCards = massSelectedCards.filter(c => c.pageId !== cardData.pageId);
  }

  updateMassBar();
  return true; // Consommé
}

/** Affiche le sélecteur de template pour l'envoi en masse */
function showMassTemplateSelector() {
  if (massSelectedCards.length === 0) {
    showToast("Sélectionnez au moins un prospect", "warning");
    return;
  }

  // Vérifier qu'on a des emails
  const withEmail = massSelectedCards.filter(c => c.email);
  if (withEmail.length === 0) {
    showToast("Aucun prospect sélectionné n'a d'email", "warning");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "mass-template-overlay";
  overlay.id = "massTemplateOverlay";

  let optionsHtml = "";
  for (const [key, tpl] of Object.entries(EMAIL_TEMPLATES)) {
    optionsHtml += `<button class="mass-template-option" data-template="${key}">${tpl.label}</button>`;
  }

  overlay.innerHTML = `
    <div class="mass-template-panel">
      <div class="mass-template-title">✉️ Envoyer à ${withEmail.length} prospect(s)</div>
      ${withEmail.length < massSelectedCards.length ? `<div style="font-size:11px;color:var(--warning);margin-bottom:8px;">⚠️ ${massSelectedCards.length - withEmail.length} prospect(s) sans email seront ignorés</div>` : ""}
      ${optionsHtml}
      <div class="mass-progress" id="massProgress" style="display:none;">
        <span id="massProgressText">Envoi en cours...</span>
        <div class="mass-progress-bar"><div class="mass-progress-fill" id="massProgressFill"></div></div>
      </div>
      <button class="mass-template-cancel" id="massTemplateCancel">Annuler</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#massTemplateCancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll(".mass-template-option").forEach(btn => {
    btn.addEventListener("click", () => executeMassEmail(btn.dataset.template, withEmail, overlay));
  });
}

/** Exécute l'envoi en masse séquentiel via Outlook ou mailto */
async function executeMassEmail(templateKey, prospects, overlay) {
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) return;

  const progressEl = overlay.querySelector("#massProgress");
  const progressText = overlay.querySelector("#massProgressText");
  const progressFill = overlay.querySelector("#massProgressFill");

  // Désactiver les boutons
  overlay.querySelectorAll(".mass-template-option").forEach(b => b.disabled = true);
  if (progressEl) progressEl.style.display = "block";

  const settings = await chrome.storage.local.get(["notionApiKey"]);

  for (let i = 0; i < prospects.length; i++) {
    const p = prospects[i];
    const prenom = (p.name || "").split(" ")[0] || "Bonjour";
    const entreprise = p.company || "";
    const secteur = p.sector || "";
    const tags = (p.tags || []).join(", ");

    const body = template.body
      .replace(/\{prenom\}/g, prenom)
      .replace(/\{entreprise\}/g, entreprise)
      .replace(/\{poste\}/g, p.jobTitle || "")
      .replace(/\{secteur\}/g, secteur)
      .replace(/\{tags\}/g, tags);

    // Mise à jour progress
    if (progressText) progressText.textContent = `Envoi ${i + 1}/${prospects.length} — ${p.name}`;
    if (progressFill) progressFill.style.width = `${((i + 1) / prospects.length) * 100}%`;

    // Envoyer via Outlook si connecté, sinon mailto
    if (isOutlookConnected) {
      try {
        const lastSent = await chrome.runtime.sendMessage({
          action: "outlookFindLastSent",
          email: p.email
        });

        if (lastSent.success && lastSent.found) {
          const replyHtml = body.replace(/\n/g, "<br>");
          const draft = await chrome.runtime.sendMessage({
            action: "outlookCreateDraftReply",
            messageId: lastSent.messageId,
            body: replyHtml
          });
          if (draft.success) {
            await chrome.runtime.sendMessage({
              action: "outlookSendDraft",
              draftId: draft.draftId
            });
          }
        } else {
          // Pas de mail précédent → ouvrir mailto
          const subject = encodeURIComponent(template.subject);
          const encodedBody = encodeURIComponent(body);
          window.open(`mailto:${p.email}?subject=${subject}&body=${encodedBody}`, "_blank");
        }
      } catch (e) {
        console.error("[AGATE] Mass email error for", p.name, e);
      }
    } else {
      const subject = encodeURIComponent(template.subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:${p.email}?subject=${subject}&body=${encodedBody}`, "_blank");
    }

    // Log dans l'historique Notion
    if (p.pageId && settings.notionApiKey) {
      chrome.runtime.sendMessage({
        action: "appendHistory",
        pageId: p.pageId,
        actionType: `Mail envoyé (${template.label})`,
        comment: "Campagne en masse",
        apiKey: settings.notionApiKey
      }).catch(() => {});
    }

    // Délai entre chaque envoi (anti-spam)
    if (i < prospects.length - 1) {
      await delay(1500);
    }
  }

  overlay.remove();
  showToast(`✉️ ${prospects.length} email(s) envoyé(s) !`, "success");
  toggleMassSelectionMode();
  loadTasksView(); // Refresh
}

