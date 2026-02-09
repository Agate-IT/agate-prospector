// ============================================================
// AGATE PROSPECTOR - Popup Logic
// Gere l'affichage, la modification et l'envoi vers Notion
// ============================================================

// === ELEMENTS DOM ===
const elements = {
  mainView: document.getElementById("mainView"),
  settingsView: document.getElementById("settingsView"),
  notLinkedIn: document.getElementById("notLinkedIn"),
  dataForm: document.getElementById("dataForm"),
  loadingView: document.getElementById("loadingView"),
  settingsBtn: document.getElementById("settingsBtn"),
  backBtn: document.getElementById("backBtn"),
  saveSettings: document.getElementById("saveSettings"),
  sendToNotion: document.getElementById("sendToNotion"),
  successMsg: document.getElementById("successMsg"),
  errorMsg: document.getElementById("errorMsg"),
  errorText: document.getElementById("errorText"),
  duplicateMsg: document.getElementById("duplicateMsg"),
  settingsSuccess: document.getElementById("settingsSuccess"),
  // Champs du formulaire
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
  notionDatabaseId: document.getElementById("notionDatabaseId")
};

// === INITIALISATION ===
document.addEventListener("DOMContentLoaded", async () => {
  // Charger les parametres sauvegardes
  await loadSettings();

  // Verifier si on est sur LinkedIn
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes("linkedin.com/in/")) {
    elements.notLinkedIn.style.display = "flex";
    elements.dataForm.style.display = "none";
    elements.loadingView.style.display = "none";
    return;
  }

  // On est sur un profil LinkedIn -> extraire les donnees
  elements.loadingView.style.display = "flex";
  elements.dataForm.style.display = "none";

  try {
    // Injecter le content script si necessaire et recuperer les donnees
    const response = await chrome.tabs.sendMessage(tab.id, { action: "extractData" });

    if (response) {
      populateForm(response);
      elements.loadingView.style.display = "none";
      elements.dataForm.style.display = "block";
    }
  } catch (error) {
    console.error("Erreur extraction:", error);
    // Retry : le content script n'est peut-etre pas encore charge
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      // Attendre un peu puis reessayer
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extractData" });
      if (response) {
        populateForm(response);
        elements.loadingView.style.display = "none";
        elements.dataForm.style.display = "block";
      }
    } catch (retryError) {
      console.error("Erreur retry:", retryError);
      elements.loadingView.style.display = "none";
      elements.notLinkedIn.style.display = "flex";
    }
  }
});

// === REMPLIR LE FORMULAIRE ===
function populateForm(data) {
  const fieldMap = {
    fieldName: data.name,
    fieldCompany: data.company,
    fieldJobTitle: data.jobTitle,
    fieldPhone: data.phone,
    fieldPhone2: data.phone2,
    fieldEmail: data.email,
    fieldLinkedin: data.linkedinUrl,
    fieldNotes: data.notes || ""
  };

  // Remplir chaque champ et ajouter la classe visuelle
  for (const [fieldId, value] of Object.entries(fieldMap)) {
    const el = elements[fieldId];
    if (el && value) {
      el.value = value;
      el.classList.add("auto-filled");
    } else if (el && !value && fieldId !== "fieldPhone2" && fieldId !== "fieldNotes") {
      el.classList.add("field-missing");
    }
  }

  // Secteur (select)
  if (data.sector) {
    elements.fieldSector.value = data.sector;
    elements.fieldSector.classList.add("auto-filled");
  } else {
    elements.fieldSector.classList.add("field-missing");
  }

  // Statut par defaut
  elements.fieldStatus.value = data.status || "A contacter";

  // Retirer les classes visuelles quand l'utilisateur modifie un champ
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", () => {
      el.classList.remove("auto-filled", "field-missing");
    });
  });
}

// === NAVIGATION PARAMETRES ===
elements.settingsBtn.addEventListener("click", () => {
  elements.mainView.style.display = "none";
  elements.settingsView.style.display = "block";
});

elements.backBtn.addEventListener("click", () => {
  elements.settingsView.style.display = "none";
  elements.mainView.style.display = "block";
});

// === SAUVEGARDER PARAMETRES ===
elements.saveSettings.addEventListener("click", async () => {
  const apiKey = elements.notionApiKey.value.trim();
  const databaseId = elements.notionDatabaseId.value.trim();

  if (!apiKey || !databaseId) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  await chrome.storage.local.set({
    notionApiKey: apiKey,
    notionDatabaseId: databaseId
  });

  elements.settingsSuccess.style.display = "flex";
  setTimeout(() => {
    elements.settingsSuccess.style.display = "none";
  }, 2000);
});

// === CHARGER PARAMETRES ===
async function loadSettings() {
  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (settings.notionApiKey) {
    elements.notionApiKey.value = settings.notionApiKey;
  }
  if (settings.notionDatabaseId) {
    elements.notionDatabaseId.value = settings.notionDatabaseId;
  }
}

// === ENVOI VERS NOTION ===
elements.sendToNotion.addEventListener("click", async () => {
  // Cacher les messages precedents
  elements.successMsg.style.display = "none";
  elements.errorMsg.style.display = "none";
  elements.duplicateMsg.style.display = "none";

  // Verifier les parametres
  const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    elements.errorText.textContent = "Configurez d'abord votre cle API Notion dans les parametres.";
    elements.errorMsg.style.display = "flex";
    return;
  }

  // Verifier le nom minimum
  if (!elements.fieldName.value.trim()) {
    elements.errorText.textContent = "Le nom du prospect est obligatoire.";
    elements.errorMsg.style.display = "flex";
    return;
  }

  // Desactiver le bouton
  elements.sendToNotion.disabled = true;
  elements.sendToNotion.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Envoi en cours...';

  try {
    // Construire l'objet pour l'API Notion
    const prospectData = {
      name: elements.fieldName.value.trim(),
      company: elements.fieldCompany.value.trim(),
      jobTitle: elements.fieldJobTitle.value.trim(),
      sector: elements.fieldSector.value,
      status: elements.fieldStatus.value,
      phone: elements.fieldPhone.value.trim(),
      phone2: elements.fieldPhone2.value.trim(),
      email: elements.fieldEmail.value.trim(),
      linkedinUrl: elements.fieldLinkedin.value.trim(),
      notes: elements.fieldNotes.value.trim()
    };

    // Envoyer via le background script
    const result = await chrome.runtime.sendMessage({
      action: "sendToNotion",
      data: prospectData,
      apiKey: settings.notionApiKey,
      databaseId: settings.notionDatabaseId
    });

    if (result.success) {
      elements.successMsg.style.display = "flex";
      elements.sendToNotion.innerHTML = '<span class="btn-icon">&#10003;</span> Envoye !';
      elements.sendToNotion.style.background = "#2ecc71";

      // Reset apres 3 secondes
      setTimeout(() => {
        elements.sendToNotion.innerHTML = '<span class="btn-icon">&#10148;</span> Envoyer dans Notion';
        elements.sendToNotion.style.background = "";
        elements.sendToNotion.disabled = false;
      }, 3000);

    } else if (result.duplicate) {
      elements.duplicateMsg.style.display = "flex";
      elements.sendToNotion.disabled = false;
      elements.sendToNotion.innerHTML = '<span class="btn-icon">&#10148;</span> Envoyer dans Notion';

    } else {
      throw new Error(result.error || "Erreur inconnue");
    }

  } catch (error) {
    console.error("Erreur envoi Notion:", error);
    elements.errorText.textContent = "Erreur : " + error.message;
    elements.errorMsg.style.display = "flex";
    elements.sendToNotion.disabled = false;
    elements.sendToNotion.innerHTML = '<span class="btn-icon">&#10148;</span> Envoyer dans Notion';
  }
});
