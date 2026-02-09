// ============================================================
// AGATE PROSPECTOR - Configuration partagee
// Constantes utilisees par content.js et sidepanel.js
// ============================================================

const ACTION_CONFIG = {
  appeler:  { label: "Appeler",      labelLong: "Appeler",      status: null,          delayDays: 0,  icon: "📞" },
  mail:     { label: "Mail",         labelLong: "Mail envoyé",  status: "Mail envoye", delayDays: 3,  icon: "✉️" },
  r1:       { label: "R1",           labelLong: "Relance 1",    status: "R1",          delayDays: 3,  icon: "🔄" },
  r2:       { label: "R2",           labelLong: "Relance 2",    status: "R2",          delayDays: 7,  icon: "🔄" },
  r3:       { label: "R3",           labelLong: "Relance 3",    status: "R3",          delayDays: 14, icon: "🔄" },
  rdv:      { label: "RDV",          labelLong: "RDV pris",     status: "RDV pris",    delayDays: 0,  icon: "📅" },
  rappeler: { label: "Rappel",       labelLong: "À rappeler",   status: "A rappeler",  delayDays: 2,  icon: "🔔" },
};

// Cycle de prospection intelligent : action completee → prochaine etape
const NEXT_ACTION_MAP = {
  appeler:  { nrp:     { nextAction: "rappeler", delayDays: 2,  label: "Rappel J+2 (NRP)" },
              repondu: { nextAction: null,       delayDays: 0,  label: "Appel abouti" } },
  mail:     { default: { nextAction: "r1",       delayDays: 3,  label: "Relance 1 dans 3 jours" } },
  r1:       { default: { nextAction: "r2",       delayDays: 7,  label: "Relance 2 dans 7 jours" } },
  r2:       { default: { nextAction: "r3",       delayDays: 7,  label: "Relance 3 dans 7 jours" } },
  r3:       { default: { nextAction: "close",    delayDays: 0,  label: "Fin de cycle" } },
  rdv:      { default: { nextAction: "rdv_realise", delayDays: 0, label: "RDV Realise" } },
  rappeler: { nrp:     { nextAction: "rappeler", delayDays: 2,  label: "Re-rappeler J+2" },
              repondu: { nextAction: null,       delayDays: 0,  label: "Appel abouti" } }
};

// ============================================================
// TEMPLATES EMAIL - Placeholders disponibles :
// {prenom}, {entreprise}, {poste}, {secteur}, {tags}
// ============================================================
const EMAIL_TEMPLATES = {
  "ai_data": {
    label: "🤖 IA / Data Science",
    subject: "AGATE DIGITAL - AI Expertise",
    matchTags: ["Data Science", "Data Engineering", "Machine Learning", "Deep Learning", "NLP", "LLM", "RAG", "MLOps", "Python", "Databricks", "Snowflake", "Spark", "Airflow"],
    body: `Bonjour {prenom},

J'espère que vous allez bien,
J'aide différents Data LAB / AI Factory sur leurs besoins en prestation Data / Science & IA.

Vous avez un besoin en cours ou à venir sur un poste difficile à staffer ?

Challengez-moi avec votre cas le plus complexe – je trouve une solution qualifiée et disponible rapidement.
Aucun engagement, juste une mise en situation réelle de notre réactivité et de notre pertinence.

Intéressé ?

En attendant, je vous joins le CV d'Hicham - Data / ML Engineer spécialisé sur le LLM Ops / VLM & RAG / Dispo Mars / TJM 740€.

Cordialement,
Yanice`
  },
  "dev": {
    label: "💻 Développement",
    subject: "AGATE DIGITAL - Dev Expertise",
    matchTags: ["Java", "Spring", "Node.js", "TypeScript", "React", "Vue.js", "Angular", "JavaScript", "Frontend", "Full Stack", "PHP", "Symfony", "Laravel", ".NET", "C#", "Go", "Rust", "Scala", "Kotlin"],
    body: `Bonjour {prenom},

J'espère que vous allez bien,
J'accompagne différentes équipes Tech sur leurs besoins en développement (Full Stack, Backend, Frontend, Mobile).

Vous avez un besoin en cours ou à venir sur un poste difficile à staffer ?

Challengez-moi avec votre cas le plus complexe – je trouve une solution qualifiée et disponible rapidement.
Aucun engagement, juste une mise en situation réelle de notre réactivité et de notre pertinence.

Intéressé ?

Cordialement,
Yanice`
  },
  "cloud_devops": {
    label: "☁️ Cloud / DevOps",
    subject: "AGATE DIGITAL - Cloud & DevOps",
    matchTags: ["AWS", "Azure", "GCP", "Cloud", "Kubernetes", "Docker", "Terraform", "Ansible", "Jenkins", "CI/CD", "DevOps", "SRE", "Infrastructure"],
    body: `Bonjour {prenom},

J'espère que vous allez bien,
J'accompagne différentes équipes sur leurs enjeux Cloud & Infrastructure.

Vous avez un besoin en cours ou à venir sur un poste difficile à staffer ?

Challengez-moi avec votre cas le plus complexe – je trouve une solution qualifiée et disponible rapidement.
Aucun engagement, juste une mise en situation réelle de notre réactivité et de notre pertinence.

Intéressé ?

Cordialement,
Yanice`
  },
  "security": {
    label: "🔒 Cybersécurité",
    subject: "AGATE DIGITAL - Cyber Expertise",
    matchTags: ["Cybersécurité", "Sécurité", "SOC", "SIEM", "Pentest"],
    body: `Bonjour {prenom},

J'espère que vous allez bien,
J'accompagne différentes équipes sur leurs enjeux de cybersécurité et de sécurisation des SI.

Vous avez un besoin en cours ou à venir sur un poste difficile à staffer ?

Challengez-moi avec votre cas le plus complexe – je trouve une solution qualifiée et disponible rapidement.
Aucun engagement, juste une mise en situation réelle de notre réactivité et de notre pertinence.

Intéressé ?

Cordialement,
Yanice`
  },
  "product": {
    label: "📊 Product / PM",
    subject: "AGATE DIGITAL - Product Expertise",
    matchTags: ["Product Owner", "Product Manager", "Scrum", "Scrum Master", "Agile", "UX/UI"],
    body: `Bonjour {prenom},

J'espère que vous allez bien,
J'accompagne différentes équipes Produit sur leurs besoins en Product Management, Product Owner et UX/UI.

Vous avez un besoin en cours ou à venir sur un poste difficile à staffer ?

Challengez-moi avec votre cas le plus complexe – je trouve une solution qualifiée et disponible rapidement.
Aucun engagement, juste une mise en situation réelle de notre réactivité et de notre pertinence.

Intéressé ?

Cordialement,
Yanice`
  },
  "generic": {
    label: "📝 Générique",
    subject: "AGATE DIGITAL -",
    matchTags: [],
    body: `Bonjour {prenom},

J'espère que vous allez bien,


Cordialement,
Yanice`
  }
};

/**
 * Detecte le meilleur template email base sur les tags du prospect
 * Retourne la cle du template recommande
 */
function detectBestEmailTemplate(tags) {
  if (!tags || tags.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const [templateKey, template] of Object.entries(EMAIL_TEMPLATES)) {
    if (!template.matchTags || template.matchTags.length === 0) continue;
    const matchCount = tags.filter(tag => template.matchTags.includes(tag)).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = templateKey;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ============================================================
// TAGS TECHNOS - Mapping keywords → tag normalise
// ============================================================
const TECH_TAGS = {
  // Cloud
  "aws": "AWS", "amazon web services": "AWS",
  "azure": "Azure", "microsoft azure": "Azure",
  "gcp": "GCP", "google cloud": "GCP", "google cloud platform": "GCP",
  "cloud": "Cloud",
  // DevOps / Infra
  "kubernetes": "Kubernetes", "k8s": "Kubernetes",
  "docker": "Docker",
  "terraform": "Terraform",
  "ansible": "Ansible",
  "jenkins": "Jenkins",
  "ci/cd": "CI/CD", "cicd": "CI/CD",
  "devops": "DevOps",
  "sre": "SRE",
  "infrastructure": "Infrastructure",
  // Securite
  "cybersecurity": "Cybersécurité", "cybersécurité": "Cybersécurité", "cyber": "Cybersécurité",
  "security": "Sécurité", "sécurité": "Sécurité",
  "soc": "SOC", "siem": "SIEM",
  "pentesting": "Pentest", "pentest": "Pentest",
  // Data / IA
  "data engineer": "Data Engineering", "data engineering": "Data Engineering",
  "data scientist": "Data Science", "data science": "Data Science",
  "machine learning": "Machine Learning", "ml": "Machine Learning",
  "deep learning": "Deep Learning",
  "nlp": "NLP", "natural language": "NLP",
  "llm": "LLM", "large language model": "LLM",
  "rag": "RAG",
  "mlops": "MLOps", "ml ops": "MLOps",
  "databricks": "Databricks",
  "snowflake": "Snowflake",
  "spark": "Spark", "apache spark": "Spark",
  "airflow": "Airflow",
  "kafka": "Kafka",
  "bigquery": "BigQuery", "big query": "BigQuery",
  "python": "Python",
  "sql": "SQL",
  "powerbi": "Power BI", "power bi": "Power BI",
  "tableau": "Tableau",
  // Developpement Backend
  "java": "Java",
  "spring": "Spring", "spring boot": "Spring",
  "node.js": "Node.js", "nodejs": "Node.js", "node": "Node.js",
  "typescript": "TypeScript",
  "golang": "Go", "go lang": "Go",
  "rust": "Rust",
  "scala": "Scala",
  "kotlin": "Kotlin",
  ".net": ".NET", "dotnet": ".NET", "c#": "C#",
  "php": "PHP", "symfony": "Symfony", "laravel": "Laravel",
  // Developpement Frontend
  "react": "React", "reactjs": "React", "react.js": "React",
  "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js",
  "angular": "Angular",
  "javascript": "JavaScript",
  "frontend": "Frontend", "front-end": "Frontend",
  "fullstack": "Full Stack", "full stack": "Full Stack", "full-stack": "Full Stack",
  // Mobile
  "ios": "iOS", "swift": "Swift",
  "android": "Android",
  "react native": "React Native", "reactnative": "React Native",
  "flutter": "Flutter",
  // Product / Agile
  "product owner": "Product Owner", "po": "Product Owner",
  "product manager": "Product Manager", "pm": "Product Manager",
  "scrum": "Scrum", "scrum master": "Scrum Master",
  "agile": "Agile",
  "ux": "UX/UI", "ui": "UX/UI", "ux/ui": "UX/UI", "ux design": "UX/UI",
  // Architecture
  "architect": "Architecture", "architecte": "Architecture",
  "microservices": "Microservices",
  "api": "API", "rest api": "API", "graphql": "GraphQL",
  // Bases de donnees
  "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
  "mongodb": "MongoDB", "mongo": "MongoDB",
  "redis": "Redis",
  "elasticsearch": "Elasticsearch",
  "mysql": "MySQL",
  "oracle": "Oracle DB",
  // SAP / ERP
  "sap": "SAP",
  "salesforce": "Salesforce",
  "erp": "ERP"
};

// ============================================================
// RELANCE TEMPLATES - Templates pour les relances R1/R2/R3 via Outlook
// ============================================================
const RELANCE_TEMPLATES = {
  r1: {
    label: "Relance 1",
    subject: "Suite à notre échange — {entreprise}",
    body: `Bonjour {prenom},\n\nJe me permets de revenir vers vous suite à mon précédent message concernant l'accompagnement en {tags} chez {entreprise}.\n\nAvez-vous eu l'occasion d'y jeter un œil ?\n\nNous accompagnons régulièrement des acteurs du secteur {secteur} sur ces sujets, et je serais ravi d'en discuter avec vous.\n\nBien cordialement`
  },
  r2: {
    label: "Relance 2",
    subject: "Suivi — {entreprise} x AGATE",
    body: `Bonjour {prenom},\n\nJe reviens vers vous une nouvelle fois.\n\nJe comprends que les priorités évoluent — si le timing n'est pas le bon, n'hésitez pas à me le dire.\n\nJe peux tout à fait revenir vers vous dans quelques semaines si vous le préférez.\n\nBien cordialement`
  },
  r3: {
    label: "Relance 3",
    subject: "Dernier message — {prenom}",
    body: `Bonjour {prenom},\n\nDernier message de ma part — je ne souhaite pas être insistant.\n\nSi un besoin en {tags} se présente à l'avenir chez {entreprise}, n'hésitez pas à me contacter.\n\nJe vous souhaite une bonne continuation dans vos projets.\n\nCordialement`
  }
};

// ============================================================
// FORMAT NAME - Prénom NOM (partagé widget + sidepanel)
// ============================================================
function formatName(fullName) {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  // Premier mot = prénom (première lettre majuscule, reste en minuscule)
  const prenom = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  // Reste = nom (tout en majuscules)
  const nom = parts.slice(1).map(p => p.toUpperCase()).join(" ");
  return nom ? `${prenom} ${nom}` : prenom;
}

// ============================================================
// TAG CATEGORY MAP - Coloration par categorie CSS
// ============================================================
const TAG_CATEGORY_MAP = {};
// Data / IA
["AWS", "Azure", "GCP", "Cloud", "Data Engineering", "Data Science", "Machine Learning",
 "Deep Learning", "NLP", "LLM", "RAG", "MLOps", "Databricks", "Snowflake", "Spark",
 "Airflow", "Kafka", "BigQuery", "Python", "SQL", "Power BI", "Tableau"].forEach(t => TAG_CATEGORY_MAP[t] = "data");
// DevOps
["Kubernetes", "Docker", "Terraform", "Ansible", "Jenkins", "CI/CD", "DevOps",
 "SRE", "Infrastructure"].forEach(t => TAG_CATEGORY_MAP[t] = "devops");
// Dev
["Java", "Spring", "Node.js", "TypeScript", "Go", "Rust", "Scala", "Kotlin", ".NET",
 "C#", "PHP", "Symfony", "Laravel", "React", "Vue.js", "Angular", "JavaScript",
 "Frontend", "Full Stack", "iOS", "Swift", "Android", "React Native", "Flutter",
 "Architecture", "Microservices", "API", "GraphQL", "PostgreSQL", "MongoDB", "Redis",
 "Elasticsearch", "MySQL", "Oracle DB", "SAP", "Salesforce", "ERP"].forEach(t => TAG_CATEGORY_MAP[t] = "dev");
// Security
["Cybersécurité", "Sécurité", "SOC", "SIEM", "Pentest"].forEach(t => TAG_CATEGORY_MAP[t] = "security");
// Product
["Product Owner", "Product Manager", "Scrum", "Scrum Master", "Agile", "UX/UI"].forEach(t => TAG_CATEGORY_MAP[t] = "product");

// ============================================================
// SCORING PROSPECT - Calcul automatique du score de priorité
// Critères pondérés adaptés à l'activité AGATE IT (régie IT)
// ============================================================
const SCORING_CONFIG = {
  // Secteurs cibles AGATE → +20pts
  targetSectors: {
    "Retail": 20, "Ecommerce": 20, "Télécoms": 20, "Médias": 20,
    "Luxe": 20, "Grande Distribution": 20, "Hospitality": 15,
    "Conseil": 10, "Finance": 15, "Tech/IT": 10,
    "Industrie": 15, "Énergie": 12, "Santé": 10, "Immobilier": 10
  },
  // Postes décisionnaires → +25pts max
  targetJobTitles: [
    { pattern: /\b(dsi|cto|cio|vp|vice.?president)\b/i, points: 25 },
    { pattern: /\b(directeur|directrice).*(technique|informatique|digital|it|syst[èe]me|ingénierie)/i, points: 25 },
    { pattern: /\b(head|responsable|manager).*(engineering|technique|it|infrastructure|data|cloud|devops)/i, points: 20 },
    { pattern: /\bengineering.?manager\b/i, points: 20 },
    { pattern: /\b(lead|principal).*(tech|architect|engineer)/i, points: 15 },
    { pattern: /\b(chef.?de.?projet|project.?manager|delivery.?manager)\b/i, points: 12 },
    { pattern: /\b(recruteur|talent.?acquisition|rh.*tech)\b/i, points: 10 }
  ],
  // Tags technos pertinents → +3pts chacun, max +20pts
  tagPointsEach: 3,
  tagPointsMax: 20,
  // Activité récente (dernière action < 30j) → +10pts
  recentActivityDays: 30,
  recentActivityPoints: 10,
  // Contact avec email → +5pts
  hasEmailPoints: 5,
  // Contact avec téléphone → +5pts
  hasPhonePoints: 5,
  // Pénalités
  penalties: {
    "NRP": -5,
    "Pas interesse": -15,
    "Pas de projet": -10,
    "Pas de prestation": -10
  }
};

/**
 * Calcule le score d'un prospect (0-100)
 * @param {object} data - { sector, jobTitle, tags[], status, lastActionDate, email, phone }
 * @returns {{ score: number, level: string, color: string, details: string[] }}
 */
function calculateProspectScore(data) {
  let score = 0;
  const details = [];

  // 1. Secteur cible
  if (data.sector && SCORING_CONFIG.targetSectors[data.sector]) {
    const pts = SCORING_CONFIG.targetSectors[data.sector];
    score += pts;
    details.push(`Secteur ${data.sector}: +${pts}`);
  }

  // 2. Poste décisionnaire
  if (data.jobTitle) {
    for (const rule of SCORING_CONFIG.targetJobTitles) {
      if (rule.pattern.test(data.jobTitle)) {
        score += rule.points;
        details.push(`Poste clé: +${rule.points}`);
        break; // Un seul match
      }
    }
  }

  // 3. Tags technos (richesse du profil)
  if (data.tags && data.tags.length > 0) {
    const tagPts = Math.min(data.tags.length * SCORING_CONFIG.tagPointsEach, SCORING_CONFIG.tagPointsMax);
    score += tagPts;
    details.push(`${data.tags.length} tags: +${tagPts}`);
  }

  // 4. Activité récente
  if (data.lastActionDate) {
    const lastDate = new Date(data.lastActionDate);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= SCORING_CONFIG.recentActivityDays) {
      score += SCORING_CONFIG.recentActivityPoints;
      details.push(`Activité récente: +${SCORING_CONFIG.recentActivityPoints}`);
    }
  }

  // 5. Coordonnées disponibles
  if (data.email) {
    score += SCORING_CONFIG.hasEmailPoints;
    details.push(`Email: +${SCORING_CONFIG.hasEmailPoints}`);
  }
  if (data.phone) {
    score += SCORING_CONFIG.hasPhonePoints;
    details.push(`Téléphone: +${SCORING_CONFIG.hasPhonePoints}`);
  }

  // 6. Pénalités statut
  if (data.status && SCORING_CONFIG.penalties[data.status]) {
    const penalty = SCORING_CONFIG.penalties[data.status];
    score += penalty;
    details.push(`Statut ${data.status}: ${penalty}`);
  }

  // Borner entre 0 et 100
  score = Math.max(0, Math.min(100, score));

  // Niveau et couleur
  let level, color;
  if (score >= 70) { level = "hot"; color = "#ef4444"; }       // 🔴 Chaud
  else if (score >= 40) { level = "warm"; color = "#f59e0b"; }  // 🟡 Tiède
  else { level = "cold"; color = "#6b7280"; }                    // ⚪ Froid

  return { score, level, color, details };
}
