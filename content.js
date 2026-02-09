// ============================================================
// AGATE PROSPECTOR - Content Script with Embedded Widget
// Widget integre directement dans la page LinkedIn
// Position : entre le header du profil et la section Activite
// ============================================================

// TEST IMMEDIAT - Ce message doit apparaitre dans la console
console.log("🚀 [AGATE] ========== CONTENT SCRIPT DEMARRE ==========");
console.log("🚀 [AGATE] URL:", window.location.href);
console.log("🚀 [AGATE] Timestamp:", new Date().toISOString());

/**
 * MAPPING SECTEUR AUTOMATIQUE
 */
const SECTOR_MAPPING = {
  // Retail
  "adeo": "Retail", "leroy merlin": "Retail", "decathlon": "Retail", "bic": "Retail",
  "auchan": "Retail", "carrefour": "Retail", "leclerc": "Retail", "intermarche": "Retail",
  "monoprix": "Retail", "fnac": "Retail", "darty": "Retail", "boulanger": "Retail",
  "castorama": "Retail", "ikea": "Retail", "sephora": "Retail", "kiabi": "Retail",
  // Ecommerce
  "amazon": "Ecommerce", "aws": "Ecommerce", "blablacar": "Ecommerce", "cdiscount": "Ecommerce",
  "veepee": "Ecommerce", "showroomprive": "Ecommerce", "back market": "Ecommerce",
  "backmarket": "Ecommerce", "ankorstore": "Ecommerce", "vestiaire collective": "Ecommerce",
  "leboncoin": "Ecommerce", "mano mano": "Ecommerce", "manomano": "Ecommerce",
  "mirakl": "Ecommerce", "prestashop": "Ecommerce", "shopify": "Ecommerce",
  // Telecoms
  "bouygues telecom": "Télécoms", "orange": "Télécoms", "sfr": "Télécoms",
  "free": "Télécoms", "altice": "Télécoms", "iliad": "Télécoms", "nokia": "Télécoms",
  // Medias
  "believe": "Médias", "tf1": "Médias", "canal+": "Médias", "canal+ group": "Médias",
  "canal plus": "Médias", "groupe canal+": "Médias", "m6": "Médias",
  "france televisions": "Médias", "vivendi": "Médias", "lagardere": "Médias",
  "deezer": "Médias", "spotify": "Médias", "dailymotion": "Médias", "webedia": "Médias",
  "prisma media": "Médias", "radio france": "Médias",
  "rmc": "Médias", "bfm": "Médias", "rmc bfm": "Médias", "bfmtv": "Médias",
  "nextradiotv": "Médias", "altice media": "Médias", "europe 1": "Médias", "nrj": "Médias",
  // Luxe
  "lvmh": "Luxe", "kering": "Luxe", "hermes": "Luxe", "chanel": "Luxe", "dior": "Luxe",
  "louis vuitton": "Luxe", "gucci": "Luxe", "yves saint laurent": "Luxe", "cartier": "Luxe",
  "bulgari": "Luxe", "givenchy": "Luxe", "celine": "Luxe", "balenciaga": "Luxe",
  "bottega veneta": "Luxe", "l'oreal": "Luxe", "loreal": "Luxe", "aramis group": "Luxe",
  // Grande Distribution
  "lidl": "Grande Distribution", "aldi": "Grande Distribution", "metro": "Grande Distribution",
  "systeme u": "Grande Distribution", "cora": "Grande Distribution", "picard": "Grande Distribution",
  "franprix": "Grande Distribution",
  // Conseil / Agences
  "publicis": "Conseil", "publicis re:sources": "Conseil", "publicis groupe": "Conseil",
  "havas": "Conseil", "omnicom": "Conseil", "wpp": "Conseil", "dentsu": "Conseil",
  "accenture": "Conseil", "capgemini": "Conseil", "atos": "Conseil", "sopra steria": "Conseil",
  "deloitte": "Conseil", "pwc": "Conseil", "ey": "Conseil", "kpmg": "Conseil",
  "mckinsey": "Conseil", "bcg": "Conseil", "bain": "Conseil",
  // Hospitality
  "accor": "Hospitality", "marriott": "Hospitality", "hilton": "Hospitality",
  "ihg": "Hospitality", "hyatt": "Hospitality", "club med": "Hospitality",
  // Banque / Finance / Assurance
  "credit agricole": "Finance", "crédit agricole": "Finance", "groupe credit agricole": "Finance",
  "groupe crédit agricole": "Finance", "ca group": "Finance",
  "bnp paribas": "Finance", "bnp": "Finance", "societe generale": "Finance",
  "société générale": "Finance", "natixis": "Finance", "bpce": "Finance",
  "la banque postale": "Finance", "hsbc": "Finance", "barclays": "Finance",
  "jp morgan": "Finance", "goldman sachs": "Finance", "morgan stanley": "Finance",
  "deutsche bank": "Finance", "ubs": "Finance", "credit suisse": "Finance",
  "lazard": "Finance", "rothschild": "Finance", "amundi": "Finance",
  "axa": "Finance", "allianz": "Finance", "generali": "Finance", "groupama": "Finance",
  "maif": "Finance", "macif": "Finance", "matmut": "Finance", "mma": "Finance",
  "covea": "Finance", "cic": "Finance", "lcl": "Finance", "bred": "Finance",
  "caisse d'epargne": "Finance", "banque populaire": "Finance",
  // Industrie / Auto / Aéro
  "airbus": "Industrie", "safran": "Industrie", "thales": "Industrie",
  "dassault": "Industrie", "dassault systemes": "Industrie", "dassault aviation": "Industrie",
  "renault": "Industrie", "stellantis": "Industrie", "psa": "Industrie",
  "peugeot": "Industrie", "citroen": "Industrie", "valeo": "Industrie",
  "faurecia": "Industrie", "forvia": "Industrie", "michelin": "Industrie",
  "schneider electric": "Industrie", "schneider": "Industrie", "saint-gobain": "Industrie",
  "legrand": "Industrie", "alstom": "Industrie", "naval group": "Industrie",
  // Énergie
  "totalenergies": "Énergie", "total": "Énergie", "engie": "Énergie",
  "edf": "Énergie", "veolia": "Énergie", "suez": "Énergie"
};

// ACTION_CONFIG et NEXT_ACTION_MAP sont dans shared-config.js (injecte avant par le manifest)

// EMAIL_TEMPLATES, TECH_TAGS, TAG_CATEGORY_MAP, detectBestEmailTemplate sont dans shared-config.js

// ============================================================
// DETECTION SECTEUR
// ============================================================

// Mots-cles du profil (headline, about, skills, experiences) → secteur
// Utilise quand le nom d'entreprise n'est pas dans SECTOR_MAPPING
const SECTOR_KEYWORDS = {
  // Tech / IT / SaaS
  "Tech/IT": ["software", "saas", "cloud computing", "artificial intelligence", "machine learning",
    "deep learning", "data science", "data engineer", "devops", "cybersecurity", "cyber security",
    "blockchain", "fintech", "edtech", "healthtech", "proptech", "regtech", "insurtech",
    "full stack", "frontend", "backend", "mobile app", "web development", "platform",
    "startup", "scaleup", "information technology", "informatique", "développeur", "developer",
    "ingénieur logiciel", "software engineer", "tech lead", "cto", "data analyst",
    "product manager", "product owner", "ux designer", "ui designer", "agile", "scrum"],
  // Conseil / Consulting
  "Conseil": ["consulting", "consultant", "advisory", "conseil", "strategy", "stratégie",
    "management consulting", "transformation digitale", "digital transformation",
    "change management", "audit", "cabinet", "due diligence"],
  // Finance / Banque / Assurance
  "Finance": ["banking", "banque", "investment", "investissement", "asset management",
    "private equity", "venture capital", "hedge fund", "trading", "financial services",
    "assurance", "insurance", "reinsurance", "réassurance", "crédit", "credit",
    "wealth management", "gestion de patrimoine", "comptabilité", "accounting"],
  // Santé / Pharma
  "Santé": ["pharmaceutical", "pharma", "biotech", "biotechnology", "medical device",
    "healthcare", "santé", "hôpital", "hospital", "clinical", "clinique",
    "life sciences", "drug discovery", "oncology", "therapeutic"],
  // Industrie / Manufacturing
  "Industrie": ["manufacturing", "industrial", "industrie", "automobile", "automotive",
    "aerospace", "aéronautique", "défense", "defense", "energy", "énergie",
    "oil and gas", "pétrole", "construction", "btp", "génie civil",
    "supply chain", "logistics", "logistique", "transport"],
  // Retail (enrichi)
  "Retail": ["retail", "e-commerce", "ecommerce", "commerce", "magasin", "store",
    "point de vente", "merchandising", "grande surface", "supermarché"],
  // Médias / Entertainment
  "Médias": ["media", "médias", "journalis", "rédaction", "editorial", "broadcast",
    "television", "radio", "presse", "publishing", "édition", "entertainment",
    "gaming", "jeux vidéo", "video game", "streaming", "podcast", "production audiovisuelle"],
  // Luxe / Mode
  "Luxe": ["luxury", "luxe", "fashion", "mode", "haute couture", "maroquinerie",
    "joaillerie", "jewelry", "horlogerie", "watchmaking", "parfum", "cosmétique", "cosmetics"],
  // Télécoms
  "Télécoms": ["telecom", "télécommunication", "5g", "fibre optique", "réseau mobile",
    "network infrastructure", "iot", "internet of things"],
  // Éducation
  "Éducation": ["education", "éducation", "université", "university", "école", "school",
    "formation", "training", "e-learning", "elearning", "edtech", "academic", "recherche"],
  // Immobilier
  "Immobilier": ["real estate", "immobilier", "property", "foncier", "promotion immobilière",
    "co-working", "coworking", "gestion locative"],
  // Énergie / Environnement
  "Énergie": ["renewable energy", "énergie renouvelable", "solar", "solaire", "wind energy",
    "éolien", "cleantech", "sustainability", "développement durable", "environnement",
    "climate", "carbon", "recyclage", "waste management"],
  // Hospitality / Tourisme
  "Hospitality": ["hotel", "hôtel", "hospitality", "tourisme", "tourism", "travel",
    "restauration", "restaurant", "catering", "food service"],
  // Grande Distribution
  "Grande Distribution": ["grande distribution", "hypermarché", "supermarché", "discount",
    "wholesale", "grossiste", "cash and carry"],
  // Ecommerce (enrichi)
  "Ecommerce": ["marketplace", "place de marché", "dropshipping", "fulfillment",
    "livraison", "delivery", "last mile"]
};

function detectSector(companyName, profileText) {
  // 1. Match par nom d'entreprise (SECTOR_MAPPING)
  if (companyName) {
    const normalized = companyName.toLowerCase().trim();
    // Match exact
    if (SECTOR_MAPPING[normalized]) return SECTOR_MAPPING[normalized];
    // Match partiel (includes)
    for (const [key, sector] of Object.entries(SECTOR_MAPPING)) {
      if (normalized.includes(key) || key.includes(normalized)) return sector;
    }
    // Match par mot individuel (pour "RMC BFM" → match "rmc" ou "bfm")
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      if (SECTOR_MAPPING[word]) return SECTOR_MAPPING[word];
    }
  }

  // 2. Match par mots-cles du profil (headline, about, skills, experiences)
  if (profileText) {
    const text = profileText.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sector;
      }
    }

    if (bestMatch && bestScore >= 2) return bestMatch;
    // Si 1 seul match, on l'accepte aussi (mieux que rien)
    if (bestMatch && bestScore >= 1) return bestMatch;
  }

  return "";
}

// ============================================================
// DETECTION TAGS TECHNOS (regex pre-compilees au chargement)
// ============================================================
const COMPILED_TECH_REGEXES = Object.keys(TECH_TAGS)
  .sort((a, b) => b.length - a.length)
  .map(key => ({
    regex: new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
    tag: TECH_TAGS[key]
  }));

const _techTagCache = new Map();

function detectTechTags(text, maxTags = 5) {
  if (!text) return [];

  // Cache pour eviter de re-analyser le meme texte
  const cacheKey = text.length > 200 ? text.substring(0, 200) : text;
  if (_techTagCache.has(cacheKey)) return _techTagCache.get(cacheKey);

  const normalized = text.toLowerCase();
  const foundTags = new Map();

  for (const { regex, tag } of COMPILED_TECH_REGEXES) {
    if (foundTags.has(tag)) continue;
    if (regex.test(normalized)) {
      foundTags.set(tag, true);
      if (foundTags.size >= maxTags) break;
    }
  }

  const result = Array.from(foundTags.keys());

  // Cache avec limite de 50 entrees
  _techTagCache.set(cacheKey, result);
  if (_techTagCache.size > 50) {
    _techTagCache.delete(_techTagCache.keys().next().value);
  }

  return result;
}

// ============================================================
// EXTRACTION LINKEDIN
// ============================================================
function extractLinkedInData() {
  const data = {
    name: "", company: "", jobTitle: "", linkedinUrl: "",
    phone: "", phone2: "", email: "", sector: ""
  };

  // Pattern pour filtrer les durées (ex: "3 ans 2 mois", "1 year 5 months", "2 yr 3 mo")
  const durationPattern = /\b(\d+\s*(ans?|années?|mois|yr|years?|months?|mos?)\b)/i;

  try {
    console.log("[AGATE] === Début extraction ===");

    // Cache des elements DOM frequemment requetes
    const dom = {
      h1: document.querySelector("h1.text-heading-xlarge")
        || document.querySelector("h1.inline.t-24.v-align-middle.break-words")
        || document.querySelector("h1"),
      headline: document.querySelector("div.text-body-medium.break-words"),
      topCard: document.querySelector(".pv-top-card"),
      expSection: document.querySelector("#experience"),
      aboutSection: document.querySelector("#about"),
      skillsSection: document.querySelector("#skills"),
    };

    // NOM
    if (dom.h1) data.name = dom.h1.textContent.trim();
    console.log("[AGATE] Nom:", data.name);

    // HEADLINE (sous le nom)
    const headline = dom.headline ? dom.headline.textContent.trim() : "";
    console.log("[AGATE] Headline:", headline);

    // Regex anti-poste : rejette les textes qui ressemblent a un intitule de poste
    const jobTitlePattern = /\b(head|director|manager|engineer|consultant|lead|chief|vp|cto|ceo|cfo|coo|cio|cdo|cmo|officer|analyst|specialist|president|founder|fondateur|co-?founder|directeur|directrice|responsable|membre|associate|partner|senior|junior|intern|stagiaire|alternant|coordinat|advisor|adviser|architecte|architect|strategist|strateg|expert|scientist|researcher|chercheur|professor|professeur|lecturer|developer|développeur|designer|evangelist|ambassador|ambassad|coach|trainer|formateur|auditeur|auditor|comptable|accountant|recruiter|recruteur|freelance|indépendant|entrepreneur|gérant|owner)\b/i;

    // Helper : extrait le nom d'entreprise depuis un slug URL /company/nom-entreprise/
    // Ex: "/company/rmc-bfm/" → "RMC BFM", "/company/google/" → "Google"
    function companyNameFromSlug(href) {
      if (!href) return null;
      const match = href.match(/\/company\/([^/?#]+)/);
      if (!match) return null;
      const slug = decodeURIComponent(match[1]);
      // Convertir le slug : tirets → espaces, capitaliser chaque mot
      // Heuristique : les slugs de 3 chars ou moins sont probablement des acronymes → tout en majuscules
      // Les mots de 4+ chars → Title Case (premiere lettre majuscule)
      return slug.split("-").map(w => {
        if (!w) return "";
        return w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ").trim();
    }

    // ============================================================
    // EXTRACTION ENTREPRISE — Stratégie multi-niveaux
    // LinkedIn 2025 : l'entreprise actuelle est dans un <button> avec aria-label
    // Les liens <a href="/company/"> ne sont PAS dans le header (ils sont dans "À propos", Expérience, etc.)
    // ============================================================

    // PRIORITÉ 0 (LA PLUS FIABLE) : Bouton "Entreprise actuelle" dans le header
    // LinkedIn affiche : <button aria-label="Entreprise actuelle : NOM. Cliquez pour...">
    // Le sélecteur CSS *=  est case-sensitive, on utilise querySelectorAll + test JS
    {
      const allButtons = document.querySelectorAll("button[aria-label]");
      for (const btn of allButtons) {
        const label = btn.getAttribute("aria-label") || "";
        // Matcher FR : "Entreprise actuelle : XXX" ou EN : "Current company: XXX"
        const matchFR = label.match(/entreprise\s+actuelle\s*:\s*(.+?)(?:\.\s*cliquez|$)/i);
        const matchEN = label.match(/current\s+company\s*:\s*(.+?)(?:\.\s*click|$)/i);
        const match = matchFR || matchEN;
        if (match) {
          const companyName = match[1].trim();
          if (companyName && companyName.length > 1) {
            data.company = companyName;
            console.log("[AGATE] Entreprise (bouton aria-label):", data.company);
            break;
          }
        }
      }
    }

    // PRIORITÉ 1 : Liens <a href="/company/"> dans la section du header (h1.closest("section"))
    // Utile si LinkedIn change la structure et revient aux liens classiques
    if (!data.company) {
      const h1Section = dom.h1?.closest("section");
      const headerZone = h1Section || dom.topCard || document.querySelector("main");
      if (headerZone) {
        // Exclure les liens dans "À propos" (inline-show-more-text), Experience, Aside
        const candidates = headerZone.querySelectorAll("a[href*='/company/']");
        for (const link of candidates) {
          if (link.closest(".inline-show-more-text")) continue; // Section "À propos"
          if (link.closest("#experience")) continue;
          if (link.closest("aside")) continue;
          // Extraire depuis le slug URL (le plus fiable)
          const href = link.getAttribute("href");
          const slugName = companyNameFromSlug(href);
          if (slugName && slugName.length > 1) {
            data.company = slugName;
            console.log("[AGATE] Entreprise (lien /company/ slug):", data.company);
            break;
          }
        }
        // Si slug pas trouvé, essayer le textContent
        if (!data.company) {
          for (const link of candidates) {
            if (link.closest(".inline-show-more-text")) continue;
            if (link.closest("#experience")) continue;
            if (link.closest("aside")) continue;
            const text = link.textContent.trim().split(/\s*[·•]\s*/)[0].trim();
            if (text && text.length > 1 && !durationPattern.test(text) && !jobTitlePattern.test(text)) {
              data.company = text;
              console.log("[AGATE] Entreprise (lien /company/ texte):", data.company);
              break;
            }
          }
        }
      }
    }

    // PRIORITÉ 2 : Headline "Poste chez/at/@ ENTREPRISE"
    if (!data.company && headline) {
      const matchChez = headline.match(/(?:chez|at|@)\s+(.+?)(?:\s*\||$)/i);
      if (matchChez) {
        const candidate = matchChez[1].trim();
        if (!jobTitlePattern.test(candidate)) {
          data.company = candidate;
          console.log("[AGATE] Entreprise (headline chez/at):", data.company);
        }
      }
    }

    // ============================================================
    // EXTRACTION POSTE — Stratégie : Expérience d'abord, Headline en fallback
    // Le headline est souvent un slogan perso ("Piloter la performance avec intelligence")
    // Le vrai poste est le titre de la première expérience en cours
    // ============================================================

    // ENRICHISSEMENT depuis la section Expérience
    // Priorité 1 pour le poste + raffinement de l'entreprise
    if (dom.expSection) {
      console.log("[AGATE] Section Expérience trouvée, enrichissement...");
      const expContainer = dom.expSection.closest("section");
      if (expContainer) {
        const firstExpItem = expContainer.querySelector("li.artdeco-list__item");
        if (firstExpItem) {
          // --- RAFFINER ENTREPRISE ---
          const companyLink = firstExpItem.querySelector("a[href*='/company/'] span[aria-hidden='true']");
          if (companyLink) {
            let expCompany = companyLink.textContent.trim().split(/\s*[·•]\s*/)[0].trim();
            if (expCompany && !jobTitlePattern.test(expCompany) && !durationPattern.test(expCompany)) {
              if (!data.company) {
                data.company = expCompany;
                console.log("[AGATE] Entreprise depuis expérience (header vide):", expCompany);
              } else if (data.company.toLowerCase() === expCompany.toLowerCase() && data.company !== expCompany) {
                console.log("[AGATE] Entreprise: casse raffinée:", expCompany, "← ancienne:", data.company);
                data.company = expCompany;
              } else {
                console.log("[AGATE] Entreprise header conservée:", data.company, "(expérience:", expCompany, ")");
              }
            }
          }

          // --- EXTRAIRE POSTE depuis l'expérience (PRIORITÉ 1) ---
          // Récupérer tous les éléments bold dans la première expérience
          // Structure LinkedIn 2025 multi-postes : Bold[0] = entreprise, Bold[1] = poste actuel
          // Structure LinkedIn 2025 mono-poste   : Bold[0] = poste actuel
          const boldEls = firstExpItem.querySelectorAll(
            "div.display-flex.align-items-center.mr1.t-bold span[aria-hidden='true'], " +
            "span.mr1.t-bold span[aria-hidden='true'], " +
            "span.mr1.hoverable-link-text.t-bold span[aria-hidden='true']"
          );

          const companyLower = (data.company || "").toLowerCase();
          for (const boldEl of boldEls) {
            const text = boldEl.textContent.trim();
            if (!text || text.length < 2) continue;
            // Ignorer les durées ("CDI · 5 ans 3 mois", "avr. 2024 - aujourd'hui")
            if (durationPattern.test(text)) continue;
            // Ignorer si c'est le nom d'entreprise déjà extrait (cas multi-postes : Bold[0] = entreprise)
            if (companyLower && text.toLowerCase() === companyLower) continue;
            // C'est le poste !
            data.jobTitle = text;
            console.log("[AGATE] Poste depuis expérience (priorité 1):", data.jobTitle);
            break;
          }
        }
      }
    } else {
      console.log("[AGATE] Section Expérience non visible (lazy loading)");
    }

    // POSTE - Fallback : extraire depuis le headline si l'expérience n'a rien donné
    // Le headline peut contenir un vrai titre ("CTO @ Google") ou un slogan perso
    if (!data.jobTitle && headline) {
      let jobTitle = headline;
      jobTitle = jobTitle.replace(/\s*[@]\s*.+$/, "");
      jobTitle = jobTitle.replace(/\s+(?:chez|at)\s+.+$/i, "");
      jobTitle = jobTitle.split("|")[0].trim();
      // Valider que ça ressemble à un titre de poste (contient un mot-clé de poste)
      if (jobTitle && jobTitle.length > 2 && jobTitlePattern.test(jobTitle)) {
        data.jobTitle = jobTitle;
        console.log("[AGATE] Poste (headline fallback, validé):", data.jobTitle);
      } else if (jobTitle && jobTitle.length > 2) {
        // Headline ne ressemble pas à un poste → on le prend quand même en dernier recours
        data.jobTitle = jobTitle;
        console.log("[AGATE] Poste (headline fallback, non-validé):", data.jobTitle);
      }
    }

    // ENTREPRISE - Méthodes de fallback

    // FALLBACK ENTREPRISE : Section Expérience (1er lien /company/)
    if (!data.company && dom.expSection) {
      const expContainer = dom.expSection.closest("section");
      if (expContainer) {
        const firstCompanyLink = expContainer.querySelector("a[href*='/company/']");
        if (firstCompanyLink) {
          const slugName = companyNameFromSlug(firstCompanyLink.getAttribute("href"));
          if (slugName && slugName.length > 1) {
            data.company = slugName;
            console.log("[AGATE] Entreprise (fallback expérience slug):", data.company);
          }
        }
      }
    }

    // DERNIER RECOURS : Premier lien /company/ sur la page (hors aside et about)
    if (!data.company) {
      const anyLinks = document.querySelectorAll("a[href*='/company/']");
      for (const link of anyLinks) {
        if (link.closest("aside")) continue;
        if (link.closest(".inline-show-more-text")) continue;
        const slugName = companyNameFromSlug(link.getAttribute("href"));
        if (slugName && slugName.length > 1) {
          data.company = slugName;
          console.log("[AGATE] Entreprise (dernier recours slug):", data.company);
          break;
        }
      }
    }

    console.log("[AGATE] Extraction:", { name: data.name, company: data.company, jobTitle: data.jobTitle });

    // URL
    data.linkedinUrl = window.location.href.split("?")[0];

    // HEADLINE et ABOUT pour l'enrichissement IA
    data.headline = headline;

    // TAGS TECHNOS - Construire le texte du profil depuis les caches DOM
    let profileText = headline + " " + (data.jobTitle || "") + " " + (data.name || "") + " ";

    // A propos (utilise cache dom.aboutSection)
    let aboutRawText = "";
    if (dom.aboutSection) {
      const aboutContainer = dom.aboutSection.closest("section");
      if (aboutContainer) {
        const aboutText = aboutContainer.querySelector(".inline-show-more-text, .pv-shared-text-with-see-more");
        if (aboutText) {
          aboutRawText = aboutText.textContent.trim();
          profileText += aboutRawText + " ";
        }
      }
    }
    data.aboutText = aboutRawText;

    // Competences (utilise cache dom.skillsSection)
    if (dom.skillsSection) {
      const skillsContainer = dom.skillsSection.closest("section");
      if (skillsContainer) {
        const skillElements = skillsContainer.querySelectorAll(".hoverable-link-text span[aria-hidden='true']");
        skillElements.forEach(el => profileText += el.textContent + " ");
      }
    }

    // Experiences titres (utilise cache dom.expSection)
    if (dom.expSection) {
      const expContainerForTags = dom.expSection.closest("section");
      if (expContainerForTags) {
        const expTitles = expContainerForTags.querySelectorAll(".t-bold span[aria-hidden='true']");
        expTitles.forEach(el => profileText += el.textContent + " ");
      }
    }

    // Detecter les tags (utilise le cache interne de detectTechTags)
    data.tags = detectTechTags(profileText, 5);
    console.log("[AGATE] Tags détectés:", data.tags);

    // SECTEUR — detecte via le nom d'entreprise (SECTOR_MAPPING) puis via le contenu du profil (SECTOR_KEYWORDS)
    data.sector = detectSector(data.company, profileText);
    console.log("[AGATE] Secteur détecté:", data.sector);

  } catch (error) {
    console.error("[AGATE] Erreur extraction:", error);
  }

  return data;
}

// Extraction Kaspr
function extractKasprData() {
  const data = { phone: "", phone2: "", email: "" };
  try {
    const kasprContainer = document.querySelector('[class*="kaspr"]')
      || document.querySelector('[id*="kaspr"]');
    if (kasprContainer) {
      const phoneElements = kasprContainer.querySelectorAll('a[href^="tel:"]');
      if (phoneElements[0]) data.phone = phoneElements[0].textContent.trim() || phoneElements[0].href.replace("tel:", "");
      if (phoneElements[1]) data.phone2 = phoneElements[1].textContent.trim() || phoneElements[1].href.replace("tel:", "");
      const emailElements = kasprContainer.querySelectorAll('a[href^="mailto:"]');
      if (emailElements[0]) data.email = emailElements[0].textContent.trim() || emailElements[0].href.replace("mailto:", "");
    }
  } catch (e) {}
  return data;
}

// Extraction Lusha
function extractLushaData() {
  const data = { phone: "", phone2: "", email: "" };
  try {
    const lushaContainer = document.querySelector('[class*="lusha"]')
      || document.querySelector('[id*="lusha"]');
    if (lushaContainer) {
      const phoneElements = lushaContainer.querySelectorAll('a[href^="tel:"]');
      if (phoneElements[0]) data.phone = phoneElements[0].textContent.trim() || phoneElements[0].href.replace("tel:", "");
      if (phoneElements[1]) data.phone2 = phoneElements[1].textContent.trim() || phoneElements[1].href.replace("tel:", "");
      const emailElements = lushaContainer.querySelectorAll('a[href^="mailto:"]');
      if (emailElements[0]) data.email = emailElements[0].textContent.trim() || emailElements[0].href.replace("mailto:", "");
    }
  } catch (e) {}
  return data;
}

function extractAllData() {
  const linkedinData = extractLinkedInData();
  const kasprData = extractKasprData();
  const lushaData = extractLushaData();
  return {
    name: linkedinData.name,
    company: linkedinData.company,
    jobTitle: linkedinData.jobTitle,
    sector: linkedinData.sector,
    tags: linkedinData.tags || [],
    phone: kasprData.phone || lushaData.phone || "",
    phone2: kasprData.phone2 || lushaData.phone2 || "",
    email: kasprData.email || lushaData.email || "",
    linkedinUrl: linkedinData.linkedinUrl,
    headline: linkedinData.headline || "",
    aboutText: linkedinData.aboutText || "",
    status: "A contacter",
    notes: ""
  };
}

// ============================================================
// WIDGET HTML + CSS (Shadow DOM)
// ============================================================
const WIDGET_CSS = `
:host {
  all: initial;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  contain: content;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Bloquer l'autocompletion Chrome */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #1a1f2e inset !important;
  -webkit-text-fill-color: #e2e8f0 !important;
  caret-color: #e2e8f0 !important;
}

.agate-widget {
  background: linear-gradient(165deg, rgba(26, 31, 46, 0.98) 0%, rgba(15, 20, 35, 0.99) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  padding: 20px;
  color: #e2e8f0;
  box-shadow:
    0 32px 64px -16px rgba(0, 0, 0, 0.6),
    0 16px 32px -8px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Header - Draggable */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: move;
  user-select: none;
}

.widget-header:active {
  cursor: grabbing;
}

.drag-handle {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-right: 12px;
  opacity: 0.35;
  padding: 4px;
  transition: opacity 0.2s ease;
}

.widget-header:hover .drag-handle {
  opacity: 0.6;
}

.drag-handle span {
  display: flex;
  gap: 3px;
}

.drag-handle span::before,
.drag-handle span::after {
  content: '';
  width: 4px;
  height: 4px;
  background: #64748b;
  border-radius: 50%;
}

.widget-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
  color: #f8fafc;
  pointer-events: none;
}

.widget-logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: white;
  box-shadow:
    0 4px 12px rgba(99, 102, 241, 0.4),
    0 2px 4px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.widget-actions {
  display: flex;
  gap: 8px;
}

.widget-btn-icon {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-btn-icon:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  transform: translateY(-1px);
}

/* Status Banner */
.status-banner {
  display: none;
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 600;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(8px);
}

.status-banner.existing {
  display: flex;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.status-banner.success {
  display: flex;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.status-banner.error {
  display: flex;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group.full {
  grid-column: span 2;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 11px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.form-group input:hover,
.form-group select:hover,
.form-group textarea:hover {
  border-color: rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.6);
  background: rgba(99, 102, 241, 0.06);
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #475569;
  font-weight: 400;
}

.masked-input {
  -webkit-text-security: disc;
  text-security: disc;
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;
}

.form-group select option {
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px;
}

.form-group textarea {
  resize: none;
  min-height: 54px;
  line-height: 1.5;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input {
  flex: 1;
  min-width: 0;
}

/* Bouton Lusha inline */
.lusha-field-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(99, 102, 241, 0.25);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  color: #a78bfa;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lusha-field-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(99, 102, 241, 0.5);
  color: #c4b5fd;
  transform: translateY(-1px);
}

.lusha-field-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.lusha-field-btn.lusha-success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.lusha-field-btn .lusha-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(167, 139, 250, 0.3);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Auto-filled indicator */
.auto-filled {
  border-color: rgba(99, 102, 241, 0.35) !important;
  background: rgba(99, 102, 241, 0.08) !important;
}

/* Main Button */
.btn-primary {
  width: 100%;
  padding: 14px 18px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  box-shadow:
    0 4px 14px rgba(99, 102, 241, 0.35),
    0 2px 6px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(99, 102, 241, 0.4),
    0 4px 12px rgba(99, 102, 241, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary.update-mode {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #06b6d4 100%);
  box-shadow:
    0 4px 14px rgba(14, 165, 233, 0.35),
    0 2px 6px rgba(14, 165, 233, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary.update-mode:hover {
  box-shadow:
    0 8px 24px rgba(14, 165, 233, 0.4),
    0 4px 12px rgba(14, 165, 233, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-primary.success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #10b981 100%);
  box-shadow:
    0 4px 14px rgba(34, 197, 94, 0.35),
    0 2px 6px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Quick Actions */
.quick-actions {
  display: none;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.quick-actions.visible {
  display: block;
}

.actions-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  padding: 9px 14px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 7px;
}

.action-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
  color: #e2e8f0;
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.action-feedback {
  display: none;
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.action-feedback.visible {
  display: block;
}

.action-feedback.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.06) 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.action-feedback.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.06) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.action-feedback.info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.06) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

/* Proposition action suivante (inline) */
.next-action-inline {
  margin: 8px 0;
  padding: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.next-action-inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #a5b4fc;
}
.next-action-inline-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.next-action-inline-close:hover {
  color: #e2e8f0;
  background: rgba(255,255,255,0.1);
}
.next-action-inline-body {
  font-size: 12px;
}
.next-action-inline-body p {
  color: #94a3b8;
  margin: 0 0 8px 0;
  font-size: 11px;
}
.next-action-inline-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.next-action-inline-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  font-family: inherit;
}
.next-action-inline-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
}
.next-action-inline-btn.primary {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
}
.next-action-inline-btn.primary:hover {
  background: rgba(99, 102, 241, 0.3);
}
.next-action-rdv-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.next-action-rdv-input {
  flex: 1;
  padding: 6px 8px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 11px;
  font-family: inherit;
  color-scheme: dark;
}
.next-action-rdv-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
}

/* Settings Panel */
.settings-panel {
  display: none;
}

.settings-panel.visible {
  display: block;
}

.settings-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.btn-secondary {
  flex: 1;
  padding: 13px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
  color: #f1f5f9;
  transform: translateY(-1px);
}

.settings-success {
  display: none;
  margin-top: 14px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.06) 100%);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 10px;
  color: #4ade80;
  font-size: 12px;
  font-weight: 600;
}

.settings-success.visible {
  display: block;
}

/* Collapsed State */
.agate-widget.collapsed .widget-content {
  display: none;
}

.agate-widget.collapsed {
  padding: 14px 18px;
}

.agate-widget.collapsed .widget-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Small link */
small {
  font-size: 11px;
  color: #64748b;
  margin-top: 6px;
  font-weight: 500;
}

small a {
  color: #818cf8;
  text-decoration: none;
  transition: color 0.15s ease;
}

small a:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

/* Email Templates Dropdown */
.email-dropdown {
  position: relative;
  display: inline-block;
}

.email-dropdown-btn {
  padding: 9px 14px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 7px;
}

.email-dropdown-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
  color: #e2e8f0;
}

.email-dropdown-btn .arrow {
  font-size: 8px;
  transition: transform 0.2s ease;
}

.email-dropdown.open .email-dropdown-btn .arrow {
  transform: rotate(180deg);
}

.email-dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 6px;
  background: rgba(20, 25, 40, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 180px;
  box-shadow:
    0 -10px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.email-dropdown.open .email-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.email-template-option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.email-template-option:hover {
  background: rgba(99, 102, 241, 0.15);
  color: #e2e8f0;
}

.email-template-option:active {
  background: rgba(99, 102, 241, 0.25);
}

/* Email suggestion header */
.email-suggestion {
  padding: 6px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 4px;
}

.suggestion-label {
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Recommended template option */
.email-template-option.recommended {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
  border: 1px solid rgba(251, 191, 36, 0.2);
  color: #fcd34d;
  position: relative;
}

.email-template-option.recommended::after {
  content: "✨";
  position: absolute;
  right: 10px;
  font-size: 10px;
}

.email-template-option.recommended:hover {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fef3c7;
}

/* Rappel Dropdown */
.rappel-dropdown {
  position: relative;
  display: inline-block;
}

.rappel-dropdown-btn {
  padding: 9px 14px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 7px;
}

.rappel-dropdown-btn:hover {
  background: rgba(20, 184, 166, 0.1);
  border-color: rgba(20, 184, 166, 0.2);
  color: #e2e8f0;
}

.rappel-dropdown-btn .arrow {
  font-size: 8px;
  transition: transform 0.2s ease;
}

.rappel-dropdown.open .rappel-dropdown-btn .arrow {
  transform: rotate(180deg);
}

.rappel-dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 6px;
  background: rgba(20, 25, 40, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 160px;
  box-shadow:
    0 -10px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.rappel-dropdown.open .rappel-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.rappel-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rappel-option:hover {
  background: rgba(20, 184, 166, 0.15);
  color: #e2e8f0;
}

.rappel-option:active {
  background: rgba(20, 184, 166, 0.25);
}

.rappel-hint {
  font-size: 10px;
  color: #64748b;
  font-weight: 400;
}

.rappel-option:hover .rappel-hint {
  color: #94a3b8;
}

/* Tags Container */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  min-height: 42px;
  align-items: center;
}

.tag-placeholder {
  color: #475569;
  font-size: 12px;
  font-style: italic;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #a5b4fc;
  cursor: default;
  transition: all 0.15s ease;
}

.tech-tag:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%);
  border-color: rgba(99, 102, 241, 0.5);
}

.tech-tag .remove-tag {
  cursor: pointer;
  opacity: 0.6;
  font-size: 10px;
  margin-left: 2px;
}

.tech-tag .remove-tag:hover {
  opacity: 1;
  color: #f87171;
}

/* History Section */
.history-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.history-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-toggle {
  font-size: 10px;
  color: #6366f1;
  cursor: pointer;
  text-transform: none;
  letter-spacing: normal;
}

.history-toggle:hover {
  color: #818cf8;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.history-empty {
  color: #475569;
  font-size: 12px;
  font-style: italic;
}

.history-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 6px;
  font-size: 11px;
  color: #94a3b8;
  border-left: 2px solid #6366f1;
}

.history-entry .date {
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.history-entry .action {
  color: #a5b4fc;
  font-weight: 600;
}

.history-entry .comment {
  color: #cbd5e1;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.history-item.past {
  border-left: 3px solid #22c55e;
}

.history-item.future {
  border-left: 3px solid #3b82f6;
}

.history-item.today {
  border-left: 3px solid #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.history-item.overdue {
  border-left: 3px solid #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.history-item.status {
  border-left: 3px solid #8b5cf6;
}

.history-icon {
  font-size: 14px;
}

.history-text {
  flex: 1;
}

.history-text strong {
  color: #e2e8f0;
}

/* Comment input for actions */
.action-comment-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}

.action-comment-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 12px;
  transition: all 0.2s;
}

.action-comment-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.06);
}

.action-comment-input::placeholder {
  color: #475569;
}

/* ============================================
   MODE MINI - Barre flottante compacte
   ============================================ */
.agate-widget.mode-mini .widget-content,
.agate-widget.mode-mini .widget-header {
  display: none;
}

.mini-bar {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: move;
  user-select: none;
}

.agate-widget.mode-mini {
  padding: 0;
  border-radius: 14px;
}

.agate-widget.mode-mini .mini-bar {
  display: flex;
}

.mini-bar .widget-logo-icon {
  width: 26px;
  height: 26px;
  font-size: 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.mini-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.mini-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
}

.mini-status-dot.existing {
  background: #22c55e;
}

.mini-status-dot.new {
  background: #f59e0b;
}

.mini-expand-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mini-expand-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

/* ============================================
   MODE COMPACT - Accordeon collapsible
   ============================================ */
.agate-widget.mode-compact {
  padding: 16px;
}

.agate-widget.mode-compact .mini-bar {
  display: none;
}

.agate-widget.mode-compact .widget-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
}

/* Carte identite supprimee (Phase 10) - champs toujours visibles */

/* (styles identity-card retires) */

/* Section strips (flat, toujours visible) */
.section-strip {
  margin-bottom: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.section-strip-label {
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.section-strip-label::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
}

/* Compact mode : section strips plus serrees */
.agate-widget.mode-compact .section-strip {
  margin-bottom: 10px;
  padding-top: 8px;
}

.agate-widget.mode-compact .section-strip .form-grid {
  gap: 8px;
}

.agate-widget.mode-compact .section-strip input,
.agate-widget.mode-compact .section-strip select,
.agate-widget.mode-compact .section-strip textarea {
  padding: 7px 10px;
  font-size: 12px;
}

/* Champs identite toujours visibles (meme en mode compact) */
.agate-widget.mode-compact .identity-fields {
  display: grid;
}

/* Tags en mode compact: ligne horizontale scrollable */
.tags-container.compact-mode {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.tags-container.compact-mode::-webkit-scrollbar {
  display: none;
}

/* Couleurs de tags par categorie */
.tech-tag[data-category="data"] {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.tech-tag[data-category="devops"] {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.tech-tag[data-category="dev"] {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.15) 100%);
  border-color: rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.tech-tag[data-category="security"] {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.tech-tag[data-category="product"] {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: rgba(168, 85, 247, 0.3);
  color: #d8b4fe;
}

/* Quick actions compact : icones seules */
.agate-widget.mode-compact .actions-grid .action-btn span:not(.action-icon) {
  display: none;
}

.agate-widget.mode-compact .actions-grid .action-btn {
  padding: 8px;
  min-width: 36px;
  justify-content: center;
}

/* Mode switch button */
.mode-switch-btn {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-switch-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

/* Animation d'entree du widget */
@keyframes slideInWidget {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.agate-widget {
  animation: slideInWidget 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

const WIDGET_HTML = `
<div class="agate-widget">
  <!-- Mini Bar (visible en mode mini) -->
  <div class="mini-bar" id="agateMiniBar">
    <div class="widget-logo-icon">◆</div>
    <span class="mini-name" id="agateMiniName">AGATE Prospector</span>
    <span class="mini-status-dot" id="agateMiniDot"></span>
    <button type="button" class="mini-expand-btn" id="agateMiniExpand" title="Développer">▾</button>
  </div>

  <!-- Header (visible en mode compact/full) -->
  <div class="widget-header">
    <div class="drag-handle"><span></span><span></span></div>
    <div class="widget-logo">
      <div class="widget-logo-icon">◆</div>
      <span>AGATE Prospector</span>
    </div>
    <div class="widget-actions">
      <button type="button" class="mode-switch-btn" id="agateModeSwitch" title="Mode mini">▴</button>
      <button type="button" class="widget-btn-icon" id="agateRefresh" title="Rafraîchir">↻</button>
      <button type="button" class="widget-btn-icon" id="agateSettings" title="Paramètres">⚙</button>
      <button type="button" class="widget-btn-icon" id="agateCollapse" title="Réduire">−</button>
    </div>
  </div>

  <div class="widget-content">
    <!-- Status Banner -->
    <div class="status-banner" id="agateBanner"></div>

    <!-- Carte identite (supprimee Phase 10 - champs toujours visibles) -->

    <!-- Main Form -->
    <form id="agateMainForm" autocomplete="off">
      <!-- Champs identite (grille, masques en mode compact sauf si editing) -->
      <div class="form-grid identity-fields" id="agateIdentityFields">
        <div class="form-group">
          <label>Nom</label>
          <input type="text" id="agateFieldName" name="agate_name_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Prénom Nom">
        </div>
        <div class="form-group">
          <label>Organisation</label>
          <input type="text" id="agateFieldCompany" name="agate_company_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Entreprise">
        </div>
        <div class="form-group">
          <label>Poste</label>
          <input type="text" id="agateFieldJobTitle" name="agate_job_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Intitulé">
        </div>
        <div class="form-group">
          <label>Secteur</label>
          <input type="text" id="agateFieldSector" name="agate_sector_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" list="agateSectorList" placeholder="Saisir ou sélectionner">
          <datalist id="agateSectorList">
            <option value="Retail">
            <option value="Ecommerce">
            <option value="Télécoms">
            <option value="Médias">
            <option value="Luxe">
            <option value="Grande Distribution">
          </datalist>
        </div>
      </div>

      <!-- Tags (toujours visible) -->
      <div class="form-group full" style="margin-bottom:10px;">
        <div class="tags-container" id="agateTagsContainer">
          <span class="tag-placeholder">Détection automatique...</span>
        </div>
        <input type="hidden" id="agateFieldTags" name="agate_tags_x7k9">
      </div>

      <!-- Section Contact (flat strip) -->
      <div class="section-strip">
        <div class="section-strip-label">Contact</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Téléphone</label>
            <div class="input-row">
              <input type="text" id="agateFieldPhone" name="agate_phone_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="+33 6 00 00 00 00">
              <button type="button" class="lusha-field-btn" data-target="agateFieldPhone" title="Remplir via Lusha">
                <span class="lusha-btn-icon">🔍</span>
                <span class="lusha-btn-spinner" style="display:none;"></span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Tél. 2</label>
            <div class="input-row">
              <input type="text" id="agateFieldPhone2" name="agate_phone2_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Optionnel">
              <button type="button" class="lusha-field-btn" data-target="agateFieldPhone2" title="Remplir via Lusha">
                <span class="lusha-btn-icon">🔍</span>
                <span class="lusha-btn-spinner" style="display:none;"></span>
              </button>
            </div>
          </div>
          <div class="form-group full">
            <label>Email</label>
            <div class="input-row">
              <input type="text" id="agateFieldEmail" name="agate_email_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="email@exemple.com">
              <button type="button" class="lusha-field-btn" data-target="agateFieldEmail" title="Remplir via Lusha">
                <span class="lusha-btn-icon">🔍</span>
                <span class="lusha-btn-spinner" style="display:none;"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Details (flat strip) -->
      <div class="section-strip">
        <div class="section-strip-label">Détails</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Statut</label>
            <select id="agateFieldStatus" name="agate_status_x7k9" autocomplete="off">
              <option value="A contacter" selected>À contacter</option>
              <option value="Mail envoye">Mail envoyé</option>
              <option value="NRP">NRP</option>
              <option value="Pas interesse">Pas intéressé</option>
              <option value="RDV pris">RDV pris</option>
              <option value="Pas de projet">Pas de prestation</option>
              <option value="A rappeler">À rappeler</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Notes</label>
            <textarea id="agateFieldNotes" name="agate_notes_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Notes, contexte..." rows="2"></textarea>
          </div>
        </div>
      </div>

      <!-- Main Button -->
      <button type="button" class="btn-primary" id="agateSendBtn">
        <span>→</span>
        <span id="agateSendBtnText">Envoyer dans Notion</span>
      </button>

      <!-- Quick Actions -->
      <div class="quick-actions" id="agateQuickActions">
        <div class="actions-label">⚡ Actions rapides</div>
        <div class="actions-grid">
          <button type="button" class="action-btn" data-action="appeler">📞 Appeler</button>
          <div class="email-dropdown" id="agateEmailDropdown">
            <button type="button" class="email-dropdown-btn" id="agateEmailBtn">✉️ Mail <span class="arrow">▼</span></button>
            <div class="email-dropdown-menu" id="agateEmailMenu">
              <div class="email-suggestion" id="agateEmailSuggestion" style="display:none;">
                <span class="suggestion-label">✨ Suggéré</span>
              </div>
              <button type="button" class="email-template-option" data-template="ai_data">🤖 IA / Data Science</button>
              <button type="button" class="email-template-option" data-template="dev">💻 Développement</button>
              <button type="button" class="email-template-option" data-template="cloud_devops">☁️ Cloud / DevOps</button>
              <button type="button" class="email-template-option" data-template="security">🔒 Cybersécurité</button>
              <button type="button" class="email-template-option" data-template="product">📊 Product / PM</button>
              <button type="button" class="email-template-option" data-template="generic">📝 Générique</button>
            </div>
          </div>
          <button type="button" class="action-btn" data-action="vcard">📇 VCard</button>
          <button type="button" class="action-btn" data-action="r1">🔄 R1</button>
          <button type="button" class="action-btn" data-action="r2">🔄 R2</button>
          <button type="button" class="action-btn" data-action="r3">🔄 R3</button>
          <button type="button" class="action-btn" data-action="rdv">📅 RDV</button>
          <div class="rappel-dropdown" id="agateRappelDropdown">
            <button type="button" class="rappel-dropdown-btn" id="agateRappelBtn">🔔 Rappeler <span class="arrow">▼</span></button>
            <div class="rappel-dropdown-menu" id="agateRappelMenu">
              <button type="button" class="rappel-option" data-delay="2">🔔 J+2 <span class="rappel-hint">2 jours</span></button>
              <button type="button" class="rappel-option" data-delay="3">🔔 J+3 <span class="rappel-hint">3 jours</span></button>
              <button type="button" class="rappel-option" data-delay="7">🔔 J+7 <span class="rappel-hint">1 semaine</span></button>
            </div>
          </div>
        </div>

        <!-- Champ de commentaire pour les actions -->
        <div class="action-comment-row">
          <input type="text" class="action-comment-input" id="agateActionComment" placeholder="Commentaire (ex: NRP, Intéressé, RDV fixé...)" autocomplete="off">
        </div>

        <div class="action-feedback" id="agateActionFeedback"></div>

        <!-- Proposition action suivante (inline) -->
        <div class="next-action-inline" id="agateNextActionProposal" style="display:none;">
          <div class="next-action-inline-header">
            <span>🔮 Action suivante ?</span>
            <button type="button" class="next-action-inline-close" id="agateNextActionClose">✕</button>
          </div>
          <div class="next-action-inline-body" id="agateNextActionBody"></div>
        </div>

        <!-- Historique des actions -->
        <div class="history-section" id="agateHistorySection">
          <div class="history-label">
            <span>📜 Historique</span>
            <span class="history-toggle" id="agateHistoryToggle">Voir tout</span>
          </div>
          <div class="history-content" id="agateHistoryContent">
            <div class="history-empty">Aucune action enregistrée</div>
          </div>
        </div>
      </div>
    </form>

    <!-- Settings Panel -->
    <div class="settings-panel" id="agateSettingsPanel">
      <div class="settings-title">⚙️ Configuration</div>
      <div class="form-grid">
        <div class="form-group full">
          <label>Clé API Notion</label>
          <input type="text" id="agateNotionApiKey" name="agate_api_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" class="masked-input" placeholder="secret_xxxxxxxx...">
          <small>Créer sur <a href="https://www.notion.so/my-integrations" target="_blank">notion.so/my-integrations</a></small>
        </div>
        <div class="form-group full">
          <label>ID Base Notion</label>
          <input type="text" id="agateNotionDatabaseId" name="agate_dbid_x7k9" autocomplete="off" data-lpignore="true" placeholder="ID ou URL de votre base">
        </div>
        <div class="form-group full">
          <label>Clé API Lusha</label>
          <input type="text" id="agateLushaApiKey" name="agate_lusha_x7k9" autocomplete="off" data-lpignore="true" data-form-type="other" class="masked-input" placeholder="Clé API Lusha (optionnel)">
          <small>Pour l'enrichissement automatique des contacts</small>
        </div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-primary" id="agateSaveSettings">Sauvegarder</button>
        <button type="button" class="btn-secondary" id="agateBackBtn">Retour</button>
      </div>
      <div class="settings-success" id="agateSettingsSuccess">✓ Paramètres sauvegardés !</div>
    </div>
  </div>
</div>
`;

// ============================================================
// WIDGET MANAGER
// ============================================================
class AgateWidget {
  constructor() {
    this.container = null;
    this.shadowRoot = null;
    this.isUpdateMode = false;
    this.currentNotionPageId = null;
    this.lastExtractedUrl = "";
    this.isCollapsed = false;
    this.showAllHistory = false;
    this.currentTags = [];
    // Mode: "mini" | "compact" | "full"
    this.mode = "compact";
  }

  // Creer et injecter le widget
  inject() {
    try {
      console.log("[AGATE] Injection du widget...");

      // Verifier si deja injecte
      if (document.getElementById("agate-prospector-widget")) {
        console.log("[AGATE] Widget deja present");
        return;
      }

      // Creer le container
      this.container = document.createElement("div");
      this.container.id = "agate-prospector-widget";
      console.log("[AGATE] Container cree");

      // Creer Shadow DOM pour isolation CSS
      this.shadowRoot = this.container.attachShadow({ mode: "open" });
      console.log("[AGATE] Shadow DOM attache");

      // Injecter CSS et HTML
      const style = document.createElement("style");
      style.textContent = WIDGET_CSS;
      this.shadowRoot.appendChild(style);
      console.log("[AGATE] CSS injecte");

      const wrapper = document.createElement("div");
      wrapper.innerHTML = WIDGET_HTML;
      this.shadowRoot.appendChild(wrapper);
      console.log("[AGATE] HTML injecte");

      // Injecter styles page-level pour le highlight LinkedIn (hors shadow DOM)
      if (!document.getElementById("agate-page-styles")) {
        const pageStyle = document.createElement("style");
        pageStyle.id = "agate-page-styles";
        pageStyle.textContent = `
          h1.agate-in-notion {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(219, 234, 254, 0.6) 100%);
            border-radius: 6px;
            padding: 2px 8px;
            margin-left: -8px;
            transition: background 0.4s ease, box-shadow 0.4s ease;
            box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15);
            display: inline;
          }
          h1.agate-in-notion::after {
            content: " \\2713";
            font-size: 0.6em;
            color: #3b82f6;
            margin-left: 6px;
            vertical-align: middle;
          }
        `;
        document.head.appendChild(pageStyle);
      }

      // Trouver le point d'injection (entre header et activite)
      this.insertWidget();
      console.log("[AGATE] Widget insere dans le DOM");

      // Setup event listeners
      this.setupEventListeners();
      console.log("[AGATE] Event listeners configures");

      // Charger les parametres
      this.loadSettings();
      console.log("[AGATE] Parametres charges");

      // Restaurer le mode et les sections ouvertes
      this.restoreMode();

      // Extraire les donnees
      this.extractAndFill();

      console.log("[AGATE] Widget injecte avec succes!");
    } catch (error) {
      console.error("[AGATE] ERREUR dans inject():", error);
    }
  }

  // Trouver et inserer le widget - toujours en position fixe (draggable)
  insertWidget() {
    // Position fixe par défaut - peut être déplacé par l'utilisateur
    // Largeur initiale sera ajustee par restoreMode/setMode
    this.container.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      width: 360px;
      z-index: 9999;
      overflow: visible;
    `;

    document.body.appendChild(this.container);
    console.log("[AGATE] Widget injecte en position fixe (draggable)");
  }

  // References aux elements du shadow DOM
  el(id) {
    return this.shadowRoot.getElementById(id);
  }

  query(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  queryAll(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  // Setup events
  setupEventListeners() {
    // Drag & Drop du widget
    this.setupDraggable();

    // Refresh
    this.el("agateRefresh").addEventListener("click", () => this.extractAndFill(true));

    // Settings toggle
    this.el("agateSettings").addEventListener("click", () => {
      this.el("agateMainForm").style.display = "none";
      this.el("agateSettingsPanel").classList.add("visible");
    });

    this.el("agateBackBtn").addEventListener("click", () => {
      this.el("agateSettingsPanel").classList.remove("visible");
      this.el("agateMainForm").style.display = "block";
    });

    // Collapse
    this.el("agateCollapse").addEventListener("click", () => {
      this.isCollapsed = !this.isCollapsed;
      this.query(".agate-widget").classList.toggle("collapsed", this.isCollapsed);
      this.el("agateCollapse").textContent = this.isCollapsed ? "+" : "−";
    });

    // Mode switch: compact header button → mini
    this.el("agateModeSwitch").addEventListener("click", () => {
      this.setMode("mini");
    });

    // Mini bar expand → compact
    this.el("agateMiniExpand").addEventListener("click", () => {
      this.setMode("compact");
    });

    // Identity card supprimee — champs toujours visibles

    // Save settings
    this.el("agateSaveSettings").addEventListener("click", () => this.saveSettings());

    // Send to Notion
    this.el("agateSendBtn").addEventListener("click", () => this.handleSend());

    // Lusha enrichment buttons
    this._lushaCache = { linkedinUrl: null, result: null };

    // Parse la reponse brute Lusha (identique a sidepanel.js)
    const parseLushaRaw = (raw) => {
      const data = raw?.contact?.data || raw?.contact || raw?.data || raw || {};
      const rawEmails = data.emailAddresses || data.emails || [];
      const emails = (Array.isArray(rawEmails) ? rawEmails : []).sort((a, b) => {
        if (a.emailType === "work" && b.emailType !== "work") return -1;
        if (a.emailType !== "work" && b.emailType === "work") return 1;
        const conf = { "A+": 4, "A": 3, "B+": 2, "B": 1, "high": 4, "medium": 2, "low": 1 };
        return (conf[b.emailConfidence] || 0) - (conf[a.emailConfidence] || 0);
      });
      const rawPhones = data.phoneNumbers || data.phones || [];
      const phones = (Array.isArray(rawPhones) ? rawPhones : [])
        .filter(p => !p.doNotCall)
        .sort((a, b) => {
          const prio = { mobile: 3, work: 2, personal: 1 };
          return (prio[b.phoneType] || 0) - (prio[a.phoneType] || 0);
        });
      return {
        email: emails[0]?.email || null,
        phone: phones[0]?.number || phones[0]?.phone || null,
        phone2: phones[1]?.number || phones[1]?.phone || null
      };
    };

    const resetLushaBtns = () => {
      this.queryAll(".lusha-field-btn").forEach(b => {
        b.disabled = false;
        const icon = b.querySelector(".lusha-btn-icon");
        const spinner = b.querySelector(".lusha-btn-spinner");
        if (icon) icon.style.display = "inline";
        if (spinner) spinner.style.display = "none";
      });
    };

    this.queryAll(".lusha-field-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const targetId = btn.getAttribute("data-target");
        const target = this.el(targetId);

        console.log("[AGATE] Lusha btn clicked, target:", targetId);

        // UI loading
        this.queryAll(".lusha-field-btn").forEach(b => b.disabled = true);
        const icon = btn.querySelector(".lusha-btn-icon");
        const spinner = btn.querySelector(".lusha-btn-spinner");
        if (icon) icon.style.display = "none";
        if (spinner) spinner.style.display = "inline-block";

        try {
          const linkedinUrl = window.location.href.split("?")[0];
          const fullName = this.el("agateFieldName")?.value?.trim() || "";
          const firstName = fullName.split(" ")[0];
          const lastName = fullName.split(" ").slice(1).join(" ");
          const companyName = this.el("agateFieldCompany")?.value?.trim() || "";

          console.log("[AGATE] Lusha params:", { linkedinUrl, firstName, lastName, companyName });

          if (!linkedinUrl && (!firstName || !lastName || !companyName)) {
            this.showActionFeedback("error", "URL LinkedIn ou nom + entreprise requis");
            resetLushaBtns();
            return;
          }

          // Lire la cle Lusha depuis les parametres
          const lushaSettings = await chrome.storage.local.get(["lushaApiKey"]);
          const lushaApiKey = lushaSettings.lushaApiKey;
          if (!lushaApiKey) {
            this.showActionFeedback("error", "Clé API Lusha manquante - configurez dans les paramètres");
            resetLushaBtns();
            return;
          }

          // Cache — ne reutiliser que si le resultat contenait des donnees
          let parsed = null;
          const cached = this._lushaCache;
          if (cached.linkedinUrl === linkedinUrl && cached.result && (cached.result.email || cached.result.phone)) {
            console.log("[AGATE] Lusha using cache (has data)");
            parsed = cached.result;
          } else {
            console.log("[AGATE] Lusha sending request to background...");
            const response = await chrome.runtime.sendMessage({
              action: "enrichViaLusha",
              apiKey: lushaApiKey,
              linkedinUrl, firstName, lastName, companyName
            });

            if (!response || !response.success) {
              this.showActionFeedback("error", response?.error || "Pas de réponse du service worker");
              resetLushaBtns();
              return;
            }

            // Parser le JSON brut cote client
            parsed = parseLushaRaw(response.raw);
            console.log("[AGATE] Lusha parsed:", parsed.email, parsed.phone, parsed.phone2);

            // Ne mettre en cache que si on a obtenu des donnees
            if (parsed.email || parsed.phone) {
              this._lushaCache = { linkedinUrl, result: parsed };
            }
          }

          // Injecter la donnee selon le champ cible
          let value = null;
          if (targetId === "agateFieldPhone" && parsed.phone) value = parsed.phone;
          else if (targetId === "agateFieldPhone2" && parsed.phone2) value = parsed.phone2;
          else if (targetId === "agateFieldEmail" && parsed.email) value = parsed.email;

          if (value && target) {
            target.value = value;
            target.classList.add("auto-filled");
            btn.classList.add("lusha-success");
            setTimeout(() => btn.classList.remove("lusha-success"), 2000);
            this.showActionFeedback("success", "Enrichi via Lusha");
          } else {
            this.showActionFeedback("info", "Aucune donnée trouvée pour ce champ");
          }

        } catch (err) {
          console.error("[AGATE] Erreur Lusha widget:", err);
          this.showActionFeedback("error", "Erreur: " + err.message);
        } finally {
          resetLushaBtns();
        }
      });
    });

    // Action buttons
    this.queryAll(".action-btn").forEach(btn => {
      btn.addEventListener("click", () => this.handleAction(btn.dataset.action));
    });

    // Email dropdown toggle
    const emailDropdown = this.el("agateEmailDropdown");
    const emailBtn = this.el("agateEmailBtn");

    emailBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      emailDropdown.classList.toggle("open");
    });

    // Email template options
    this.queryAll(".email-template-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const templateKey = option.dataset.template;
        this.sendEmailWithTemplate(templateKey);
        emailDropdown.classList.remove("open");
      });
    });

    // Rappel dropdown toggle
    const rappelDropdown = this.el("agateRappelDropdown");
    const rappelBtn = this.el("agateRappelBtn");

    if (rappelBtn && rappelDropdown) {
      rappelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        rappelDropdown.classList.toggle("open");
        // Fermer l'email dropdown si ouvert
        emailDropdown.classList.remove("open");
      });

      // Rappel options (J+2, J+3, J+7)
      this.queryAll(".rappel-option").forEach(option => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          const delayDays = parseInt(option.dataset.delay, 10);
          this.handleRappelAction(delayDays);
          rappelDropdown.classList.remove("open");
        });
      });
    }

    // Fermer les dropdowns si on clique ailleurs
    this.shadowRoot.addEventListener("click", (e) => {
      if (!emailDropdown.contains(e.target)) {
        emailDropdown.classList.remove("open");
      }
      if (rappelDropdown && !rappelDropdown.contains(e.target)) {
        rappelDropdown.classList.remove("open");
      }
    });

    // Toggle historique complet
    this.el("agateHistoryToggle").addEventListener("click", () => {
      this.showAllHistory = !this.showAllHistory;
      this.loadHistory();
    });

    // Auto-save on input
    this.queryAll("input, select, textarea").forEach(field => {
      field.addEventListener("input", () => field.classList.remove("auto-filled"));
    });
  }

  // Charger parametres
  async loadSettings() {
    const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId", "lushaApiKey"]);
    if (settings.notionApiKey) this.el("agateNotionApiKey").value = settings.notionApiKey;
    if (settings.notionDatabaseId) this.el("agateNotionDatabaseId").value = settings.notionDatabaseId;
    if (settings.lushaApiKey) this.el("agateLushaApiKey").value = settings.lushaApiKey;

    // Vérifier/créer les colonnes manquantes dans Notion (Historique + Tags)
    if (settings.notionApiKey && settings.notionDatabaseId) {
      const columnsChecked = await chrome.storage.local.get("notionColumnsV2");
      if (!columnsChecked.notionColumnsV2) {
        try {
          const result = await chrome.runtime.sendMessage({
            action: "ensureHistoryColumn",
            apiKey: settings.notionApiKey,
            databaseId: settings.notionDatabaseId
          });
          if (result.success) {
            await chrome.storage.local.set({ notionColumnsV2: true });
            console.log("[AGATE] Colonnes Notion vérifiées/créées !");
          }
        } catch (e) {
          console.error("[AGATE] Erreur vérification colonnes Notion:", e);
        }
      }
    }
  }

  // Sauvegarder parametres
  async saveSettings() {
    const apiKey = this.el("agateNotionApiKey").value.trim();
    let databaseId = this.el("agateNotionDatabaseId").value.trim();

    if (!apiKey || !databaseId) {
      alert("Veuillez remplir les deux champs.");
      return;
    }

    // Nettoyer l'ID
    databaseId = this.cleanDatabaseId(databaseId);
    this.el("agateNotionDatabaseId").value = databaseId;

    // Sauvegarder Notion + Lusha (optionnel)
    const lushaApiKey = this.el("agateLushaApiKey")?.value?.trim() || "";
    const storageData = { notionApiKey: apiKey, notionDatabaseId: databaseId };
    if (lushaApiKey) storageData.lushaApiKey = lushaApiKey;
    await chrome.storage.local.set(storageData);

    this.el("agateSettingsSuccess").classList.add("visible");
    setTimeout(() => this.el("agateSettingsSuccess").classList.remove("visible"), 2500);
  }

  cleanDatabaseId(rawId) {
    if (!rawId) return rawId;
    let id = rawId.trim();
    if (id.includes("?")) id = id.split("?")[0];
    if (id.includes("notion.so") || id.includes("/")) {
      const segments = id.split("/");
      id = segments[segments.length - 1];
    }
    const hexMatch = id.match(/([a-f0-9]{32})$/i);
    if (hexMatch) id = hexMatch[1];
    id = id.replace(/-/g, "");
    if (!/^[a-f0-9]{32}$/i.test(id)) return rawId;
    return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
  }

  // Changer le mode du widget (mini, compact, full)
  setMode(newMode) {
    const widget = this.query(".agate-widget");
    if (!widget) return;

    // Retirer tous les modes
    widget.classList.remove("mode-mini", "mode-compact", "mode-full");
    widget.classList.add(`mode-${newMode}`);
    this.mode = newMode;

    // Ajuster la largeur du container
    if (this.container) {
      if (newMode === "mini") {
        this.container.style.width = "320px";
      } else if (newMode === "compact") {
        this.container.style.width = "360px";
      } else {
        this.container.style.width = "420px";
      }
    }

    // Persister le mode
    chrome.storage.local.set({ agateWidgetMode: newMode });
  }

  // Restaurer le mode au chargement
  async restoreMode() {
    try {
      const stored = await chrome.storage.local.get(["agateWidgetMode"]);
      const mode = stored.agateWidgetMode || "compact";
      this.setMode(mode);
    } catch (e) {
      console.error("[AGATE] Erreur restoreMode:", e);
      this.setMode("compact");
    }
  }

  // Mettre a jour la mini-bar et la carte identite
  updateIdentityDisplay(name, company, jobTitle, isExisting) {
    // Mini bar
    const miniName = this.el("agateMiniName");
    if (miniName) {
      miniName.textContent = name ? this.truncateName(name, 25) : "AGATE Prospector";
    }
    const miniDot = this.el("agateMiniDot");
    if (miniDot) {
      miniDot.classList.toggle("existing", !!isExisting);
      miniDot.classList.toggle("new", !isExisting && !!name);
      miniDot.style.display = name ? "inline-block" : "none";
    }

    // Identity card supprimee — plus besoin de mettre a jour
  }

  // Tronquer un nom pour la mini-bar
  truncateName(name, maxLen) {
    if (!name || name.length <= maxLen) return name;
    return name.substring(0, maxLen - 1) + "…";
  }

  // Surligner le h1 LinkedIn si le contact est dans Notion
  highlightLinkedInName(isExisting) {
    const h1 = document.querySelector("h1.text-heading-xlarge")
      || document.querySelector("h1.inline.t-24.v-align-middle.break-words")
      || document.querySelector("h1");
    if (!h1) return;
    if (isExisting) {
      h1.classList.add("agate-in-notion");
    } else {
      h1.classList.remove("agate-in-notion");
    }
  }

  // Extraire et remplir
  async extractAndFill(force = false) {
    const currentUrl = window.location.href.split("?")[0];
    if (!force && currentUrl === this.lastExtractedUrl) return;
    this.lastExtractedUrl = currentUrl;

    // Nettoyer l'observer de re-scan précédent
    if (this._rescanObserver) {
      this._rescanObserver.disconnect();
      this._rescanObserver = null;
    }

    // Reset form
    this.clearForm();
    this.hideBanner();
    this.el("agateQuickActions").classList.remove("visible");
    this.isUpdateMode = false;
    this.currentNotionPageId = null;
    this.updateSendButton();
    this.highlightLinkedInName(false); // Retirer le surlignage avant re-check

    // Extraire
    const data = extractAllData();
    this.fillForm(data);

    // Verifier si existe dans Notion
    await this.checkExisting(data.linkedinUrl);

    // RE-SCAN AUTOMATIQUE : si la section Expérience n'était pas encore dans le DOM,
    // observer son apparition et re-extraire le poste + entreprise
    const hasExpSection = !!document.querySelector("#experience");
    if (!hasExpSection) {
      console.log("[AGATE] Section Expérience absente → observation pour re-scan...");
      this._rescanObserver = new MutationObserver(() => {
        const exp = document.querySelector("#experience");
        if (exp) {
          this._rescanObserver.disconnect();
          this._rescanObserver = null;
          console.log("[AGATE] Section Expérience détectée → re-extraction poste/entreprise...");
          this._rescanFromExperience();
        }
      });
      const mainEl = document.querySelector(".scaffold-layout__main") || document.querySelector("main") || document.body;
      this._rescanObserver.observe(mainEl, { childList: true, subtree: true });
      // Auto-stop après 10s
      setTimeout(() => {
        if (this._rescanObserver) {
          this._rescanObserver.disconnect();
          this._rescanObserver = null;
        }
      }, 10000);
    }
  }

  /**
   * Re-scan partiel : re-extraire uniquement poste + entreprise depuis la section Expérience
   * Appelé quand la section apparaît après le premier chargement (lazy loading)
   */
  _rescanFromExperience() {
    const freshData = extractLinkedInData();
    const currentCompany = (this.el("agateFieldCompany")?.value || "").trim();
    const currentJobTitle = (this.el("agateFieldJobTitle")?.value || "").trim();

    let updated = false;

    // Mettre à jour l'entreprise si le re-scan a trouvé mieux
    if (freshData.company && freshData.company !== currentCompany) {
      this.el("agateFieldCompany").value = freshData.company;
      console.log("[AGATE] Re-scan → Entreprise mise à jour:", freshData.company);
      updated = true;
    }

    // Mettre à jour le poste si le re-scan a trouvé mieux
    if (freshData.jobTitle && freshData.jobTitle !== currentJobTitle) {
      this.el("agateFieldJobTitle").value = freshData.jobTitle;
      console.log("[AGATE] Re-scan → Poste mis à jour:", freshData.jobTitle);
      updated = true;
    }

    // Mettre à jour le secteur si changé (l'entreprise a pu changer)
    if (updated && freshData.sector) {
      const currentSector = (this.el("agateFieldSector")?.value || "").trim();
      if (freshData.sector !== currentSector) {
        this.el("agateFieldSector").value = freshData.sector;
        console.log("[AGATE] Re-scan → Secteur mis à jour:", freshData.sector);
      }
    }

    // Mettre à jour l'identité display (mini card)
    if (updated) {
      const name = this.el("agateFieldName")?.value || "";
      const company = this.el("agateFieldCompany")?.value || "";
      const jobTitle = this.el("agateFieldJobTitle")?.value || "";
      this.updateIdentityDisplay(name, company, jobTitle, this.isUpdateMode);

      // Notifier le sidepanel pour qu'il mette aussi à jour ses champs
      try {
        chrome.runtime.sendMessage({
          action: "dataUpdated",
          data: {
            company: freshData.company || "",
            jobTitle: freshData.jobTitle || "",
            sector: freshData.sector || ""
          }
        });
        console.log("[AGATE] Re-scan → Sidepanel notifié");
      } catch (e) {
        // Sidepanel peut ne pas être ouvert, ignorer l'erreur
      }
    }
  }

  clearForm() {
    ["agateFieldName", "agateFieldCompany", "agateFieldJobTitle", "agateFieldPhone",
     "agateFieldPhone2", "agateFieldEmail", "agateFieldNotes", "agateFieldSector"].forEach(id => {
      const el = this.el(id);
      if (el) { el.value = ""; el.classList.remove("auto-filled"); }
    });
    this.el("agateFieldStatus").value = "A contacter";
    // Reset tags
    this.el("agateFieldTags").value = "";
    this.currentTags = [];
    this.renderTags();
    // Reset identity card + mini bar
    this.updateIdentityDisplay("", "", "", false);
    // Identity card supprimee — plus de toggle editing
  }

  fillForm(data, isNotionData = false) {
    // Formater le nom : Prénom NOM (première lettre majuscule pour prénom, tout en majuscules pour nom)
    const formattedName = formatName(data.name);

    // Champs "identité" (nom, company, jobTitle) : LinkedIn est la source de vérité
    // Ne pas écraser avec Notion si déjà remplis par l'extraction LinkedIn
    const identityFields = ["agateFieldName", "agateFieldCompany", "agateFieldJobTitle"];

    const mapping = {
      agateFieldName: formattedName,
      agateFieldCompany: data.company,
      agateFieldJobTitle: data.jobTitle,
      agateFieldSector: data.sector || "",
      agateFieldPhone: data.phone,
      agateFieldPhone2: data.phone2,
      agateFieldEmail: data.email,
      agateFieldNotes: data.notes || ""
    };

    for (const [id, value] of Object.entries(mapping)) {
      const el = this.el(id);
      if (el && value) {
        // Si données Notion et champ identité déjà rempli → ne pas écraser
        if (isNotionData && identityFields.includes(id) && el.value.trim()) {
          console.log(`[AGATE] Widget: ${id} LinkedIn conservé:`, el.value, "(Notion:", value, ")");
          continue;
        }
        el.value = value;
        el.classList.add("auto-filled");
      }
    }

    if (data.status) {
      const statusMapping = {
        "À contacter": "A contacter",
        "Mail envoyé": "Mail envoye",
        "NRP": "NRP",
        "Pas intéressé": "Pas interesse",
        "RDV pris": "RDV pris",
        "Pas de prestation": "Pas de projet",
        "À rappeler": "A rappeler"
      };
      this.el("agateFieldStatus").value = statusMapping[data.status] || data.status;
    }

    // Tags
    if (data.tags && data.tags.length > 0) {
      this.currentTags = data.tags;
      this.el("agateFieldTags").value = data.tags.join(",");
      this.renderTags();
    } else {
      this.currentTags = [];
      this.renderTags();
    }

    // Mettre a jour la mini-bar et la carte identite avec les valeurs ACTUELLES des champs (pas data)
    const displayName = this.el("agateFieldName")?.value || formattedName;
    const displayCompany = this.el("agateFieldCompany")?.value || data.company;
    const displayJobTitle = this.el("agateFieldJobTitle")?.value || data.jobTitle;
    this.updateIdentityDisplay(displayName, displayCompany, displayJobTitle, this.isUpdateMode);
  }

  // Afficher les tags dans le conteneur
  renderTags() {
    const container = this.el("agateTagsContainer");
    if (!container) return;

    if (!this.currentTags || this.currentTags.length === 0) {
      container.innerHTML = '<span class="tag-placeholder">Aucun tag détecté</span>';
      return;
    }

    container.innerHTML = this.currentTags.map((tag, index) => {
      const category = TAG_CATEGORY_MAP[tag] || "";
      return `<span class="tech-tag"${category ? ` data-category="${category}"` : ""}>
        ${tag}
        <span class="remove-tag" data-index="${index}">×</span>
      </span>`;
    }).join("");

    // Event listeners pour supprimer les tags
    container.querySelectorAll(".remove-tag").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        this.currentTags.splice(index, 1);
        this.el("agateFieldTags").value = this.currentTags.join(",");
        this.renderTags();
      });
    });

    // Mettre à jour la recommandation email basée sur les tags
    this.updateEmailRecommendation();
  }

  // Met à jour la suggestion de template email selon les tags
  updateEmailRecommendation() {
    const recommendedTemplate = detectBestEmailTemplate(this.currentTags);
    const suggestionDiv = this.el("agateEmailSuggestion");
    const menu = this.el("agateEmailMenu");

    // Reset toutes les options
    menu.querySelectorAll(".email-template-option").forEach(opt => {
      opt.classList.remove("recommended");
    });

    if (recommendedTemplate) {
      // Afficher la suggestion
      suggestionDiv.style.display = "block";

      // Mettre en évidence le template recommandé
      const recommendedBtn = menu.querySelector(`[data-template="${recommendedTemplate}"]`);
      if (recommendedBtn) {
        recommendedBtn.classList.add("recommended");
        // Déplacer en haut (après la suggestion)
        suggestionDiv.after(recommendedBtn);
      }
    } else {
      suggestionDiv.style.display = "none";
    }
  }

  // Verifier si contact existe
  async checkExisting(linkedinUrl) {
    const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
    if (!settings.notionApiKey || !settings.notionDatabaseId) return;

    // Charger les secteurs depuis Notion pour mise à jour dynamique
    this.loadSectorsFromNotion(settings.notionApiKey, settings.notionDatabaseId);

    try {
      const result = await chrome.runtime.sendMessage({
        action: "findByLinkedIn",
        linkedinUrl: linkedinUrl,
        apiKey: settings.notionApiKey,
        databaseId: settings.notionDatabaseId
      });

      if (result.success && result.found) {
        this.currentNotionPageId = result.pageId;
        this.isUpdateMode = true;

        // Calculer le score du prospect
        const scoreData = calculateProspectScore({
          sector: result.sector || "",
          jobTitle: result.jobTitle || "",
          tags: result.tags || [],
          status: result.status || "",
          lastActionDate: result.lastActionDate || null,
          email: result.email || "",
          phone: result.phone || ""
        });
        const scoreEmoji = scoreData.level === "hot" ? "🔴" : scoreData.level === "warm" ? "🟡" : "⚪";

        // Bannière enrichie avec dernière action + score
        let bannerText = `✅ Déjà dans Notion — ${result.status || "—"} ${scoreEmoji}${scoreData.score}`;
        if (result.lastActionDate) {
          const lastDate = new Date(result.lastActionDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastDate.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
          const agoText = daysSince === 0 ? "aujourd'hui" : daysSince === 1 ? "hier" : `il y a ${daysSince}j`;
          bannerText += ` · Dernier contact : ${agoText}`;
        }
        this.showBanner("existing", bannerText);
        this.el("agateQuickActions").classList.add("visible");
        this.updateSendButton();
        // Remplir avec donnees Notion (isNotionData=true → ne pas écraser nom/company/jobTitle)
        this.fillForm(result, true);
        // Charger l'historique
        this.loadHistory();
        // Surligner le nom sur LinkedIn
        this.highlightLinkedInName(true);
      }
    } catch (e) {
      console.error("[AGATE] Erreur check existing:", e);
    }
  }

  // Charger les secteurs depuis Notion et mettre à jour le datalist
  async loadSectorsFromNotion(apiKey, databaseId) {
    try {
      const result = await chrome.runtime.sendMessage({
        action: "getSectors",
        apiKey: apiKey,
        databaseId: databaseId
      });

      if (result.success && result.sectors && result.sectors.length > 0) {
        const datalist = this.query("#agateSectorList");
        if (datalist) {
          // Construire les options à partir des secteurs Notion
          let html = "";
          result.sectors.forEach(sector => {
            html += `<option value="${sector}">`;
          });
          datalist.innerHTML = html;
        }
      }
    } catch (e) {
      console.error("[AGATE] Erreur chargement secteurs:", e);
    }
  }

  showBanner(type, text) {
    const banner = this.el("agateBanner");
    banner.className = "status-banner " + type;
    banner.textContent = text;
    banner.style.display = "flex";
  }

  hideBanner() {
    this.el("agateBanner").style.display = "none";
  }

  updateSendButton() {
    const btn = this.el("agateSendBtn");
    const text = this.el("agateSendBtnText");
    if (this.isUpdateMode) {
      text.textContent = "Mettre à jour dans Notion";
      btn.classList.add("update-mode");
    } else {
      text.textContent = "Envoyer dans Notion";
      btn.classList.remove("update-mode");
    }
    btn.classList.remove("success");
  }

  getCurrentFormData() {
    // Récupérer les tags depuis le champ caché ou la variable
    const tagsValue = this.el("agateFieldTags").value;
    const tags = tagsValue ? tagsValue.split(",").filter(t => t.trim()) : this.currentTags || [];

    return {
      name: this.el("agateFieldName").value.trim(),
      company: this.el("agateFieldCompany").value.trim(),
      jobTitle: this.el("agateFieldJobTitle").value.trim(),
      sector: this.el("agateFieldSector").value,
      tags: tags,
      status: this.el("agateFieldStatus").value,
      phone: this.el("agateFieldPhone").value.trim(),
      phone2: this.el("agateFieldPhone2").value.trim(),
      email: this.el("agateFieldEmail").value.trim(),
      linkedinUrl: window.location.href.split("?")[0],
      notes: this.el("agateFieldNotes").value.trim()
    };
  }

  // Envoyer / Mettre a jour
  async handleSend() {
    const btn = this.el("agateSendBtn");
    const text = this.el("agateSendBtnText");

    // Verifier settings
    const settings = await chrome.storage.local.get(["notionApiKey", "notionDatabaseId"]);
    if (!settings.notionApiKey || !settings.notionDatabaseId) {
      this.showBanner("error", "⚠️ Configurez Notion dans les paramètres");
      return;
    }

    // Verifier nom
    if (!this.el("agateFieldName").value.trim()) {
      this.showBanner("error", "⚠️ Le nom est obligatoire");
      return;
    }

    // UI loading
    btn.disabled = true;
    const originalText = text.textContent;
    text.innerHTML = '<div class="spinner"></div> Envoi...';

    try {
      const data = this.getCurrentFormData();
      let result;

      if (this.isUpdateMode && this.currentNotionPageId) {
        result = await chrome.runtime.sendMessage({
          action: "updateNotionPageFull",
          pageId: this.currentNotionPageId,
          data: data,
          apiKey: settings.notionApiKey
        });
      } else {
        result = await chrome.runtime.sendMessage({
          action: "sendToNotion",
          data: data,
          apiKey: settings.notionApiKey,
          databaseId: settings.notionDatabaseId
        });
      }

      if (result.success) {
        this.currentNotionPageId = result.pageId;
        this.showBanner("success", this.isUpdateMode ? "✓ Fiche mise à jour !" : "✓ Prospect ajouté !");
        btn.classList.add("success");
        text.textContent = "✓ " + (this.isUpdateMode ? "Mis à jour" : "Envoyé");

        // Afficher actions
        this.el("agateQuickActions").classList.add("visible");

        // Charger l'historique
        this.loadHistory();

        // Passer en mode update
        setTimeout(() => {
          this.isUpdateMode = true;
          this.updateSendButton();
          btn.disabled = false;
          // Mettre a jour le dot (vert = existant dans Notion)
          const name = this.el("agateFieldName")?.value || "";
          const company = this.el("agateFieldCompany")?.value || "";
          const job = this.el("agateFieldJobTitle")?.value || "";
          this.updateIdentityDisplay(name, company, job, true);
          this.highlightLinkedInName(true); // Surligner après création
        }, 2000);

      } else if (result.duplicate) {
        this.currentNotionPageId = result.duplicatePageId;
        this.isUpdateMode = true;
        this.updateSendButton();
        btn.disabled = false;
        this.showBanner("existing", "✅ Contact existe — cliquez pour mettre à jour");
        this.el("agateQuickActions").classList.add("visible");
        this.highlightLinkedInName(true); // Surligner le duplicat

      } else {
        throw new Error(result.error || "Erreur inconnue");
      }

    } catch (error) {
      this.showBanner("error", "❌ " + error.message);
      text.textContent = originalText;
      btn.disabled = false;
    }
  }

  // Envoyer email avec template
  async sendEmailWithTemplate(templateKey) {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) return;

    const email = this.el("agateFieldEmail").value.trim();
    if (!email) {
      this.showActionFeedback("error", "Aucun email disponible");
      return;
    }

    // Extraire le prénom du nom complet
    const fullName = this.el("agateFieldName").value.trim();
    const prenom = fullName.split(" ")[0] || "";
    const entreprise = this.el("agateFieldCompany").value.trim();

    // Remplacer les variables dans le body
    let body = template.body
      .replace(/{prenom}/g, prenom)
      .replace(/{entreprise}/g, entreprise);

    // Construire l'URL mailto
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");

    this.showActionFeedback("info", `✉️ Mail "${template.label}" vers ${email}`);

    // Mettre à jour Notion si le contact existe
    if (this.currentNotionPageId) {
      const settings = await chrome.storage.local.get(["notionApiKey"]);
      if (settings.notionApiKey) {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 3);
        const nextActionStr = nextDate.toISOString().split("T")[0];

        try {
          // 1. Mettre à jour les champs Notion
          await chrome.runtime.sendMessage({
            action: "updateNotionPage",
            pageId: this.currentNotionPageId,
            updates: {
              lastAction: todayStr,
              nextAction: nextActionStr,
              status: "Mail envoye"
            },
            apiKey: settings.notionApiKey
          });

          // 2. Ajouter à l'historique détaillé
          const comment = this.el("agateActionComment")?.value.trim() || "";
          await chrome.runtime.sendMessage({
            action: "appendHistory",
            pageId: this.currentNotionPageId,
            actionType: `Mail ${template.label}`,
            comment: comment,
            apiKey: settings.notionApiKey
          });

          // Vider le champ commentaire
          if (this.el("agateActionComment")) this.el("agateActionComment").value = "";

          // Recharger l'historique
          this.loadHistory();

        } catch (e) {
          console.error("[AGATE] Erreur update Notion après mail:", e);
        }
      }
    }
  }

  // Actions rapides
  async handleAction(actionType) {
    const config = ACTION_CONFIG[actionType];
    const comment = this.el("agateActionComment")?.value.trim() || "";

    // ── OUTLOOK : Relances R1/R2/R3 → ouvrir le sidepanel pour draft preview ──
    if (["r1", "r2", "r3"].includes(actionType)) {
      try {
        const tokens = await chrome.storage.local.get(["outlook_tokens"]);
        if (tokens.outlook_tokens?.access_token) {
          const email = this.el("agateFieldEmail")?.value.trim();
          const prenom = (this.el("agateFieldName")?.value.trim() || "").split(" ")[0];
          const entreprise = this.el("agateFieldCompany")?.value.trim() || "";
          chrome.runtime.sendMessage({
            action: "openSidePanelForRelance",
            actionType,
            email: email || "",
            prenom,
            entreprise,
            notionPageId: this.currentNotionPageId
          });
          this.showActionFeedback("info", `📧 Ouverture du sidepanel pour ${config.labelLong}...`);
          return;
        }
      } catch (e) {
        console.warn("[AGATE] Outlook check failed, fallback Notion-only:", e);
      }
    }

    // Appeler
    if (actionType === "appeler") {
      const phone = this.el("agateFieldPhone").value.trim() || this.el("agateFieldPhone2").value.trim();
      if (phone) {
        window.open(`tel:${phone.replace(/\s/g, "")}`, "_blank");
        this.showActionFeedback("info", `📞 Appel vers ${phone}`);

        // Enregistrer dans l'historique si contact existe
        if (this.currentNotionPageId) {
          const settings = await chrome.storage.local.get(["notionApiKey"]);
          if (settings.notionApiKey) {
            try {
              await chrome.runtime.sendMessage({
                action: "appendHistory",
                pageId: this.currentNotionPageId,
                actionType: "Appel",
                comment: comment || "",
                apiKey: settings.notionApiKey
              });
              // Vider le champ commentaire
              if (this.el("agateActionComment")) this.el("agateActionComment").value = "";
              // Recharger l'historique
              this.loadHistory();
              // Proposer l'action suivante du cycle de prospection
              this.showNextActionInline("appeler");
            } catch (err) {
              console.error("[AGATE] Erreur appendHistory (appel):", err);
              this.showActionFeedback("error", "Erreur enregistrement historique. Rechargez la page.");
            }
          }
        }
      } else {
        this.showActionFeedback("error", "Aucun numéro disponible");
      }
      return;
    }

    // VCard - Télécharger le contact
    if (actionType === "vcard") {
      this.downloadVCard();
      return;
    }

    // Pour les autres actions, vérifier la config
    if (!config) return;

    // Verifier pageId
    if (!this.currentNotionPageId) {
      this.showActionFeedback("error", "Envoyez d'abord dans Notion");
      return;
    }

    // Verifier API key
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey) {
      this.showActionFeedback("error", "Clé API manquante");
      return;
    }

    // Desactiver boutons
    this.queryAll(".action-btn").forEach(btn => btn.disabled = true);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    let nextActionStr = null;

    if (config.delayDays > 0) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + config.delayDays);
      nextActionStr = nextDate.toISOString().split("T")[0];
    }

    try {
      // 1. Mettre à jour les champs Notion (statut, dates)
      const result = await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: this.currentNotionPageId,
        updates: {
          lastAction: todayStr,
          nextAction: nextActionStr,
          status: config.status
        },
        apiKey: settings.notionApiKey
      });

      if (result.success) {
        // 2. Ajouter à l'historique détaillé
        await chrome.runtime.sendMessage({
          action: "appendHistory",
          pageId: this.currentNotionPageId,
          actionType: config.label,
          comment: comment,
          apiKey: settings.notionApiKey
        });

        // Vider le champ commentaire
        if (this.el("agateActionComment")) this.el("agateActionComment").value = "";

        let feedbackText = `✅ ${config.label} enregistré`;
        if (comment) feedbackText += ` (${comment})`;

        this.showActionFeedback("success", feedbackText);

        // Recharger l'historique pour afficher la nouvelle entrée
        this.loadHistory();

        // Proposer l'action suivante du cycle de prospection
        this.showNextActionInline(actionType);

      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.showActionFeedback("error", "Erreur: " + error.message);
    } finally {
      this.queryAll(".action-btn").forEach(btn => btn.disabled = false);
    }
  }

  /**
   * Gere l'action "Rappeler" avec un delai choisi (J+2, J+3, J+7)
   */
  async handleRappelAction(delayDays) {
    const comment = this.el("agateActionComment")?.value.trim() || "";

    if (!this.currentNotionPageId) {
      this.showActionFeedback("error", "Envoyez d'abord dans Notion");
      return;
    }

    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey) {
      this.showActionFeedback("error", "Cle API manquante");
      return;
    }

    this.queryAll(".action-btn, .rappel-dropdown-btn").forEach(btn => btn.disabled = true);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + delayDays);
    const nextActionStr = nextDate.toISOString().split("T")[0];

    try {
      const result = await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: this.currentNotionPageId,
        updates: {
          lastAction: todayStr,
          nextAction: nextActionStr,
          status: "A rappeler"
        },
        apiKey: settings.notionApiKey
      });

      if (result.success) {
        const labelAction = `Rappel J+${delayDays}`;
        await chrome.runtime.sendMessage({
          action: "appendHistory",
          pageId: this.currentNotionPageId,
          actionType: labelAction,
          comment: comment,
          apiKey: settings.notionApiKey
        });

        if (this.el("agateActionComment")) this.el("agateActionComment").value = "";

        let feedbackText = `✅ ${labelAction} enregistre`;
        if (comment) feedbackText += ` (${comment})`;

        this.showActionFeedback("success", feedbackText);
        this.loadHistory();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showActionFeedback("error", "Erreur: " + error.message);
    } finally {
      this.queryAll(".action-btn, .rappel-dropdown-btn").forEach(btn => btn.disabled = false);
    }
  }

  showActionFeedback(type, text) {
    const feedback = this.el("agateActionFeedback");
    feedback.className = "action-feedback visible " + type;
    feedback.textContent = text;
  }

  // === PROPOSITION INTELLIGENTE D'ACTION SUIVANTE (inline) ===

  showNextActionInline(completedAction) {
    const mapping = NEXT_ACTION_MAP[completedAction];
    if (!mapping) return;

    const container = this.el("agateNextActionProposal");
    const body = this.el("agateNextActionBody");
    if (!container || !body) return;

    body.innerHTML = "";

    if (completedAction === "appeler" || completedAction === "rappeler") {
      // Appel : NRP / Repondu
      body.innerHTML = `
        <p>Resultat de l'appel :</p>
        <div class="next-action-inline-btns">
          <button type="button" class="next-action-inline-btn" data-outcome="nrp">📵 NRP</button>
          <button type="button" class="next-action-inline-btn" data-outcome="repondu">📞 Repondu</button>
        </div>`;
      body.querySelectorAll("[data-outcome]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleInlineCallOutcome(btn.dataset.outcome, completedAction);
        });
      });
    } else if (completedAction === "rdv") {
      // RDV : date/time picker
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      body.innerHTML = `
        <p>Date et heure du RDV :</p>
        <div class="next-action-rdv-row">
          <input type="date" class="next-action-rdv-input" id="agateRdvDate" value="${tomorrowStr}" min="${todayStr}">
          <input type="time" class="next-action-rdv-input" id="agateRdvTime" value="10:00">
        </div>
        <div class="next-action-inline-btns">
          <button type="button" class="next-action-inline-btn primary" id="agateRdvConfirm">📅 Confirmer</button>
          <button type="button" class="next-action-inline-btn" id="agateRdvCancel">Annuler</button>
        </div>`;
      this.el("agateRdvConfirm").addEventListener("click", (e) => { e.stopPropagation(); this.handleInlineRdvConfirm(); });
      this.el("agateRdvCancel").addEventListener("click", (e) => { e.stopPropagation(); this.closeNextActionInline(); });
    } else if (completedAction === "r3") {
      // Fin de cycle
      body.innerHTML = `
        <p>Fin du cycle de relance :</p>
        <div class="next-action-inline-btns">
          <button type="button" class="next-action-inline-btn" data-outcome="close">🚫 Pas interesse</button>
          <button type="button" class="next-action-inline-btn" data-outcome="rappeler">🔔 Rappeler</button>
          <button type="button" class="next-action-inline-btn" data-outcome="skip">⏭️ Ignorer</button>
        </div>`;
      body.querySelectorAll("[data-outcome]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleInlineEndCycle(btn.dataset.outcome);
        });
      });
    } else if (mapping.default) {
      // Standard : mail→R1, R1→R2, etc.
      const suggestion = mapping.default;
      body.innerHTML = `
        <p>${suggestion.label}</p>
        <div class="next-action-inline-btns">
          <button type="button" class="next-action-inline-btn primary" id="agateNextAccept">✅ Programmer</button>
          <button type="button" class="next-action-inline-btn" id="agateNextSkip">⏭️ Ignorer</button>
        </div>`;
      this.el("agateNextAccept").addEventListener("click", (e) => { e.stopPropagation(); this.acceptInlineNextAction(suggestion); });
      this.el("agateNextSkip").addEventListener("click", (e) => { e.stopPropagation(); this.closeNextActionInline(); });
    }

    container.style.display = "block";
    this.el("agateNextActionClose").addEventListener("click", (e) => { e.stopPropagation(); this.closeNextActionInline(); });
  }

  closeNextActionInline() {
    const container = this.el("agateNextActionProposal");
    if (container) container.style.display = "none";
  }

  async handleInlineCallOutcome(outcome, completedAction) {
    const mapping = NEXT_ACTION_MAP[completedAction];
    const suggestion = mapping[outcome];
    if (!suggestion || !suggestion.nextAction) {
      this.closeNextActionInline();
      return;
    }
    await this.acceptInlineNextAction(suggestion);
  }

  async handleInlineRdvConfirm() {
    const rdvDate = this.el("agateRdvDate")?.value;
    const rdvTime = this.el("agateRdvTime")?.value || "10:00";
    if (!rdvDate) return;

    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey || !this.currentNotionPageId) { this.closeNextActionInline(); return; }

    try {
      const rdvDateTime = new Date(`${rdvDate}T${rdvTime}`);

      const rdvLabel = rdvDateTime.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const rdvTimeLabel = rdvTime.replace(":", "h");
      await chrome.runtime.sendMessage({
        action: "appendHistoryChecklist",
        pageId: this.currentNotionPageId,
        actionType: `RDV prevu le ${rdvLabel} a ${rdvTimeLabel}`,
        dueDate: rdvDate,
        isDone: false,
        apiKey: settings.notionApiKey
      });

      await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: this.currentNotionPageId,
        updates: { nextAction: rdvDate },
        apiKey: settings.notionApiKey
      });

      this.closeNextActionInline();
      this.showActionFeedback("success", `📅 RDV programme le ${rdvLabel} a ${rdvTimeLabel}`);
    } catch (error) {
      console.error("[AGATE] Erreur RDV inline:", error);
      this.closeNextActionInline();
    }
  }

  async handleInlineEndCycle(outcome) {
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey || !this.currentNotionPageId) { this.closeNextActionInline(); return; }

    try {
      if (outcome === "close") {
        await chrome.runtime.sendMessage({
          action: "updateNotionPage",
          pageId: this.currentNotionPageId,
          updates: { status: "Pas interesse", nextAction: null },
          apiKey: settings.notionApiKey
        });
        await chrome.runtime.sendMessage({
          action: "appendHistoryChecklist",
          pageId: this.currentNotionPageId,
          actionType: "Cloture - Pas interesse",
          isDone: true,
          apiKey: settings.notionApiKey
        });
        this.showActionFeedback("info", "🚫 Prospect cloture");
      } else if (outcome === "rappeler") {
        await this.handleRappelAction(7);
      }
      this.closeNextActionInline();
    } catch (error) {
      console.error("[AGATE] Erreur fin cycle:", error);
      this.closeNextActionInline();
    }
  }

  async acceptInlineNextAction(suggestion) {
    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey || !this.currentNotionPageId) { this.closeNextActionInline(); return; }

    try {
      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + suggestion.delayDays);
      const nextActionStr = nextDate.toISOString().split("T")[0];
      const nextActionLabel = nextDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

      await chrome.runtime.sendMessage({
        action: "updateNotionPage",
        pageId: this.currentNotionPageId,
        updates: { nextAction: nextActionStr },
        apiKey: settings.notionApiKey
      });

      await chrome.runtime.sendMessage({
        action: "appendHistoryChecklist",
        pageId: this.currentNotionPageId,
        actionType: ACTION_CONFIG[suggestion.nextAction]?.label || suggestion.label,
        dueDate: nextActionStr,
        isDone: false,
        apiKey: settings.notionApiKey
      });

      this.closeNextActionInline();
      this.showActionFeedback("success", `🔮 ${suggestion.label} — le ${nextActionLabel}`);
      this.loadHistory();
    } catch (error) {
      console.error("[AGATE] Erreur acceptNextAction:", error);
      this.closeNextActionInline();
    }
  }

  // Télécharger VCard
  downloadVCard() {
    const name = this.el("agateFieldName").value.trim();
    const company = this.el("agateFieldCompany").value.trim();
    const jobTitle = this.el("agateFieldJobTitle").value.trim();
    const phone = this.el("agateFieldPhone").value.trim();
    const phone2 = this.el("agateFieldPhone2").value.trim();
    const email = this.el("agateFieldEmail").value.trim();
    const linkedinUrl = window.location.href.split("?")[0];

    if (!name) {
      this.showActionFeedback("error", "Nom requis pour créer la VCard");
      return;
    }

    // Séparer prénom et nom (le premier mot = prénom, le reste = nom)
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Construire la VCard
    let vcard = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${name}
ORG:${company}
TITLE:${jobTitle}`;

    if (phone) {
      vcard += `\nTEL;TYPE=CELL:${phone}`;
    }
    if (phone2) {
      vcard += `\nTEL;TYPE=WORK:${phone2}`;
    }
    if (email) {
      vcard += `\nEMAIL:${email}`;
    }
    if (linkedinUrl) {
      vcard += `\nURL:${linkedinUrl}`;
    }

    vcard += `\nNOTE:Prospect AGATE - Importé depuis LinkedIn
END:VCARD`;

    // Créer et télécharger le fichier
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showActionFeedback("success", "📇 VCard téléchargée !");
  }

  // Charger et afficher l'historique des actions
  async loadHistory() {
    if (!this.currentNotionPageId) {
      this.el("agateHistoryContent").innerHTML = '<div class="history-empty">Envoyez d\'abord dans Notion</div>';
      return;
    }

    const settings = await chrome.storage.local.get(["notionApiKey"]);
    if (!settings.notionApiKey) return;

    try {
      const result = await chrome.runtime.sendMessage({
        action: "getPageHistory",
        pageId: this.currentNotionPageId,
        apiKey: settings.notionApiKey
      });

      if (result.success && result.history) {
        this.displayHistory(result.history);
      }
    } catch (e) {
      console.error("[AGATE] Erreur chargement historique:", e);
    }
  }

  // formatName() est maintenant dans shared-config.js (partagé avec sidepanel)

  displayHistory(history) {
    const container = this.el("agateHistoryContent");

    if (!history.entries || history.entries.length === 0) {
      // Afficher les infos de base si pas d'historique détaillé
      if (!history.lastAction && !history.nextAction && !history.status) {
        container.innerHTML = '<div class="history-empty">Aucune action enregistrée</div>';
        return;
      }

      let html = '';

      // Prochaine action en premier (plus important)
      if (history.nextAction) {
        const nextDate = new Date(history.nextAction);
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

        html += `<div class="history-item ${statusClass}">
          <span class="history-icon">📅</span>
          <span class="history-text">Prochaine action: <strong>${formattedDate}</strong>${statusText}</span>
        </div>`;
      }

      // Statut actuel
      if (history.status) {
        html += `<div class="history-item status">
          <span class="history-icon">📊</span>
          <span class="history-text">Statut: <strong>${history.status}</strong></span>
        </div>`;
      }

      container.innerHTML = html;
      return;
    }

    // Afficher l'historique détaillé (entrées)
    let html = '';

    // Prochaine action en premier si existe
    if (history.nextAction) {
      const nextDate = new Date(history.nextAction);
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
      }

      html += `<div class="history-item ${statusClass}">
        <span class="history-icon">📅</span>
        <span class="history-text">Prochaine: <strong>${formattedDate}</strong>${statusText}</span>
      </div>`;
    }

    // Afficher les entrées d'historique (max 5 par défaut, toutes si "Voir tout")
    const maxEntries = this.showAllHistory ? history.entries.length : 5;
    const entries = history.entries.slice(0, maxEntries);

    entries.forEach(entry => {
      // Parser l'entrée : "06/02 16h30 - Appel - NRP"
      const parts = entry.split(" - ");
      const date = parts[0] || "";
      const action = parts[1] || "";
      const comment = parts.slice(2).join(" - ") || "";

      html += `<div class="history-entry">
        <span class="date">${date}</span>
        <span class="action">${action}</span>
        ${comment ? `<span class="comment">- ${comment}</span>` : ""}
      </div>`;
    });

    // Afficher le toggle si plus d'entrées
    if (history.entries.length > 5) {
      const toggle = this.el("agateHistoryToggle");
      if (toggle) {
        toggle.textContent = this.showAllHistory ? "Réduire" : `Voir tout (${history.entries.length})`;
        toggle.style.display = "inline";
      }
    } else {
      const toggle = this.el("agateHistoryToggle");
      if (toggle) toggle.style.display = "none";
    }

    container.innerHTML = html;
  }

  // Setup Drag & Drop
  setupDraggable() {
    const header = this.query(".widget-header");
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // Charger la position sauvegardée
    this.loadPosition();

    header.addEventListener("mousedown", (e) => {
      // Ignorer si on clique sur un bouton
      if (e.target.closest("button")) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      // Passer en position fixe si pas déjà
      if (this.container.style.position !== "fixed") {
        this.container.style.position = "fixed";
        this.container.style.left = rect.left + "px";
        this.container.style.top = rect.top + "px";
        this.container.style.right = "auto";
        this.container.style.width = "420px";
        this.container.style.zIndex = "9999";
        this.container.style.margin = "0";
        this.container.style.padding = "0";
      }

      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      // Limites de l'écran
      const maxLeft = window.innerWidth - 400;
      const maxTop = window.innerHeight - 100;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      this.container.style.left = newLeft + "px";
      this.container.style.top = newTop + "px";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        // Sauvegarder la position
        this.savePosition();
      }
    });
  }

  // Sauvegarder la position du widget
  savePosition() {
    const rect = this.container.getBoundingClientRect();
    chrome.storage.local.set({
      agateWidgetPosition: {
        left: rect.left,
        top: rect.top
      }
    });
  }

  // Charger la position sauvegardée
  async loadPosition() {
    try {
      const data = await chrome.storage.local.get("agateWidgetPosition");
      if (data.agateWidgetPosition) {
        const { left, top } = data.agateWidgetPosition;

        // Vérifier que la position est valide
        if (left >= 0 && left < window.innerWidth - 100 &&
            top >= 0 && top < window.innerHeight - 100) {
          this.container.style.position = "fixed";
          this.container.style.left = left + "px";
          this.container.style.top = top + "px";
          this.container.style.right = "auto";
          this.container.style.width = "420px";
          this.container.style.zIndex = "9999";
          this.container.style.margin = "0";
          this.container.style.padding = "0";
        }
      }
    } catch (e) {
      console.log("[AGATE] Pas de position sauvegardée");
    }
  }

  // Supprimer le widget
  remove() {
    this.highlightLinkedInName(false); // Retirer le surlignage LinkedIn
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// ============================================================
// INITIALISATION & DETECTION SPA
// ============================================================
let agateWidget = null;
let _agateLastUrl = window.location.href;

// Injecter si sur un profil LinkedIn
function checkAndInject() {
  try {
    const url = window.location.href;
    console.log("[AGATE] checkAndInject - URL:", url);

    if (url.includes("linkedin.com/in/")) {
      console.log("[AGATE] Sur un profil LinkedIn");
      if (!agateWidget) {
        console.log("[AGATE] Creation du widget...");
        agateWidget = new AgateWidget();
        agateWidget.inject();
      } else {
        // Nouveau profil -> re-extraire
        console.log("[AGATE] Widget existe, re-extraction...");
        agateWidget.extractAndFill(true);
      }
    } else {
      // Pas sur un profil -> supprimer widget
      console.log("[AGATE] Pas sur un profil LinkedIn");
      if (agateWidget) {
        agateWidget.remove();
        agateWidget = null;
      }
    }
  } catch (error) {
    console.error("[AGATE] ERREUR dans checkAndInject:", error);
  }
}

// Detection navigation SPA
const _originalPushState = history.pushState;
const _originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  _originalPushState.apply(this, args);
  onUrlChange();
};

history.replaceState = function(...args) {
  _originalReplaceState.apply(this, args);
  onUrlChange();
};

window.addEventListener("popstate", () => onUrlChange());

function onUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl === _agateLastUrl) return;
  _agateLastUrl = currentUrl;

  // Attendre que le DOM soit pret
  waitForProfileReady().then(() => {
    checkAndInject();
    // Notifier le side panel si ouvert
    chrome.runtime.sendMessage({ action: "urlChanged", url: currentUrl }).catch(() => {});
  });
}

function waitForProfileReady() {
  return new Promise((resolve) => {
    const checkReady = () => {
      const h1 = document.querySelector("h1.text-heading-xlarge, h1");
      if (!h1 || !h1.textContent.trim().length) return false;
      // Attendre aussi le bouton entreprise OU la section expérience (max 3s supplémentaires)
      const hasCompanyBtn = Array.from(document.querySelectorAll("button[aria-label]"))
        .some(btn => /entreprise\s+actuelle|current\s+company/i.test(btn.getAttribute("aria-label") || ""));
      const hasExpSection = !!document.querySelector("#experience");
      return hasCompanyBtn || hasExpSection;
    };

    // Phase 1 : vérifier si déjà tout prêt
    if (checkReady()) {
      resolve();
      return;
    }

    // Phase 2 : attendre h1 minimum, idéalement expérience aussi
    const target = document.querySelector(".scaffold-layout__main")
      || document.querySelector("main")
      || document.body;

    let h1Found = false;
    let h1Timer = null;

    const observer = new MutationObserver(() => {
      // Si tout est prêt (h1 + entreprise/expérience), résoudre immédiatement
      if (checkReady()) {
        observer.disconnect();
        if (h1Timer) clearTimeout(h1Timer);
        resolve();
        return;
      }
      // Si on a au moins le h1, lancer un timer de grâce de 2s pour laisser le reste charger
      const h1 = document.querySelector("h1.text-heading-xlarge, h1");
      if (h1 && h1.textContent.trim().length > 0 && !h1Found) {
        h1Found = true;
        h1Timer = setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 2000); // Attendre 2s de plus pour les sections lazy-loadées
      }
    });
    observer.observe(target, { childList: true, subtree: true });

    // Timeout global de 6s
    setTimeout(() => {
      observer.disconnect();
      if (h1Timer) clearTimeout(h1Timer);
      resolve();
    }, 6000);
  });
}

// Backup leger : observer les changements de titre (plus efficace que setInterval)
const _titleObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== _agateLastUrl) {
    _agateLastUrl = currentUrl;
    waitForProfileReady().then(() => {
      checkAndInject();
      chrome.runtime.sendMessage({ action: "urlChanged", url: currentUrl }).catch(() => {});
    });
  }
});
const _titleEl = document.querySelector("title");
if (_titleEl) {
  _titleObserver.observe(_titleEl, { childList: true });
}

// Ecouter messages du side panel (pour compatibilite)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractData") {
    const data = extractAllData();
    sendResponse(data);
  }

  if (request.action === "openLinkedInMessage") {
    openLinkedInMessageWithPitch(request.pitch)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  }

  return true;
});

/**
 * Ouvre la messagerie LinkedIn du profil courant et colle le pitch
 * Cherche le bouton "Message" du profil (pas le bouton "nouveau message" global)
 */
async function openLinkedInMessageWithPitch(pitch) {
  // 1. Chercher le bouton "Message" spécifique au profil affiché
  //    Sur LinkedIn, c'est dans la zone d'actions du profil (top card)
  let foundBtn = null;

  // Sélecteurs par ordre de priorité (bouton profil → pas le global)
  const selectors = [
    // Bouton "Message" dans les actions du profil (LinkedIn classique)
    '.pv-top-card-v2-ctas button.pvs-profile-actions__action[aria-label*="message" i]',
    '.pv-top-card-v2-ctas button.pvs-profile-actions__action[aria-label*="Message"]',
    '.pv-top-card-v2-ctas a[aria-label*="message" i]',
    // Bouton "Message" dans les actions principales
    '.pvs-profile-actions button[aria-label*="message" i]',
    '.pvs-profile-actions a[aria-label*="message" i]',
    // Anciens layouts
    '.pv-s-profile-actions button[aria-label*="message" i]',
    '.pv-top-card-v2-ctas button[aria-label*="Message"]',
  ];

  for (const sel of selectors) {
    foundBtn = document.querySelector(sel);
    if (foundBtn) break;
  }

  // Fallback : parcourir les boutons d'action du profil par texte
  if (!foundBtn) {
    const actionBtns = document.querySelectorAll(
      '.pv-top-card-v2-ctas button, .pvs-profile-actions button, .pvs-profile-actions a, .pv-top-card--list button, .ph5 button'
    );
    for (const btn of actionBtns) {
      const text = btn.textContent.trim().toLowerCase();
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
      if (text === "message" || text === "envoyer un message" || ariaLabel.includes("message")) {
        // Exclure le bouton global "nouveau message" de la barre de messagerie
        if (btn.closest(".msg-overlay-bubble-header") || btn.closest(".msg-overlay-list-bubble")) continue;
        foundBtn = btn;
        break;
      }
    }
  }

  if (foundBtn) {
    console.log("[AGATE] Bouton Message trouvé:", foundBtn.textContent.trim());
    foundBtn.click();

    // 2. Attendre que la fenêtre de conversation s'ouvre
    //    Polling : attendre l'apparition de la zone de texte (max 5s)
    let msgBox = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      msgBox = document.querySelector('div.msg-form__contenteditable[contenteditable="true"]')
        || document.querySelector('div[role="textbox"][contenteditable="true"]');
      if (msgBox) break;
    }

    if (msgBox) {
      // Focus sur la zone de texte
      msgBox.focus();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Vider le contenu existant
      msgBox.innerHTML = "";
      msgBox.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simuler un collage via ClipboardEvent (méthode la plus fiable pour React/LinkedIn)
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", pitch);
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboardData
      });
      msgBox.dispatchEvent(pasteEvent);

      // Fallback si le paste n'a pas fonctionné
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!msgBox.textContent.trim()) {
        // Méthode alternative : insertText
        document.execCommand("insertText", false, pitch);
      }

      // Déclencher tous les événements nécessaires pour React
      msgBox.dispatchEvent(new Event("input", { bubbles: true }));
      msgBox.dispatchEvent(new Event("change", { bubbles: true }));
      msgBox.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
      msgBox.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

      // Dernier recours : simuler un espace puis backspace pour forcer la détection
      await new Promise(resolve => setTimeout(resolve, 300));
      const sendBtn = document.querySelector('button.msg-form__send-button')
        || document.querySelector('button[type="submit"].msg-form__send-btn')
        || document.querySelector('button.msg-form__send-btn');
      if (sendBtn && sendBtn.disabled) {
        // Le bouton est encore grisé — forcer avec un espace + backspace
        document.execCommand("insertText", false, " ");
        await new Promise(resolve => setTimeout(resolve, 100));
        document.execCommand("delete", false);
        msgBox.dispatchEvent(new Event("input", { bubbles: true }));
      }

      console.log("[AGATE] Pitch collé dans la conversation LinkedIn");
    } else {
      console.log("[AGATE] Zone de texte non trouvée après 5s — pitch dans le presse-papier");
    }
  } else {
    console.log("[AGATE] Bouton Message du profil non trouvé — pitch copié dans le presse-papier");
  }
}

// Initialisation
console.log("[AGATE] Content script charge - readyState:", document.readyState);
console.log("[AGATE] URL actuelle:", window.location.href);

if (document.readyState === "loading") {
  console.log("[AGATE] En attente DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[AGATE] DOMContentLoaded - lancement checkAndInject");
    checkAndInject();
  });
} else {
  // Attendre un peu que le DOM LinkedIn soit pret
  console.log("[AGATE] DOM deja pret - lancement checkAndInject dans 500ms");
  setTimeout(checkAndInject, 500);
}
