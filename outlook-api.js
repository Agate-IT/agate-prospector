// ============================================================
// AGATE PROSPECTOR - Microsoft Outlook API (via Microsoft Graph)
// OAuth 2.0 + PKCE flow, token management, Graph API calls
// Charge dans le service worker via importScripts('outlook-api.js')
// ============================================================

const OUTLOOK_CONFIG = {
  clientId: "",  // Charge dynamiquement depuis chrome.storage.local
  authority: "https://login.microsoftonline.com/common",
  scopes: ["Mail.Read", "Mail.Send", "offline_access", "User.Read"],
  graphBaseUrl: "https://graph.microsoft.com/v1.0",
  redirectPath: "outlook",
  tokenStorageKey: "outlook_tokens",
  clientIdStorageKey: "outlookClientId"
};

// ============================================================
// UTILITAIRES PKCE
// ============================================================

function base64UrlEncode(buffer) {
  const str = String.fromCharCode(...buffer);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

// ============================================================
// CONFIGURATION & STOCKAGE
// ============================================================

async function getOutlookConfig() {
  const stored = await chrome.storage.local.get([OUTLOOK_CONFIG.clientIdStorageKey]);
  return { clientId: stored[OUTLOOK_CONFIG.clientIdStorageKey] || "" };
}

async function storeTokens(tokens) {
  await chrome.storage.local.set({
    [OUTLOOK_CONFIG.tokenStorageKey]: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at
    }
  });
}

async function getOutlookConnectionStatus() {
  const stored = await chrome.storage.local.get([OUTLOOK_CONFIG.tokenStorageKey, OUTLOOK_CONFIG.clientIdStorageKey]);
  const tokens = stored[OUTLOOK_CONFIG.tokenStorageKey];
  const clientId = stored[OUTLOOK_CONFIG.clientIdStorageKey];
  return {
    configured: !!clientId,
    connected: !!(tokens && tokens.access_token),
    hasRefreshToken: !!(tokens && tokens.refresh_token)
  };
}

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

async function getValidToken() {
  const stored = await chrome.storage.local.get([OUTLOOK_CONFIG.tokenStorageKey]);
  const tokens = stored[OUTLOOK_CONFIG.tokenStorageKey];
  if (!tokens || !tokens.access_token) return null;

  // Token encore valide (marge de 5 min)
  if (tokens.expires_at > Date.now() + 300000) {
    return tokens.access_token;
  }

  // Refresh necessaire
  if (!tokens.refresh_token) return null;

  try {
    const config = await getOutlookConfig();
    const body = new URLSearchParams({
      client_id: config.clientId,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      scope: OUTLOOK_CONFIG.scopes.join(" ")
    });

    const response = await fetch(`${OUTLOOK_CONFIG.authority}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });

    if (!response.ok) {
      console.warn("[AGATE] Refresh token echoue, deconnexion");
      await outlookLogout();
      return null;
    }

    const data = await response.json();
    const newTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000)
    };
    await storeTokens(newTokens);
    return newTokens.access_token;
  } catch (err) {
    console.error("[AGATE] Token refresh failed:", err);
    return null;
  }
}

// ============================================================
// OAUTH 2.0 + PKCE
// ============================================================

async function outlookLogin() {
  const config = await getOutlookConfig();
  if (!config.clientId) {
    return { success: false, error: "Client ID Outlook non configure" };
  }

  const redirectUrl = chrome.identity.getRedirectURL(OUTLOOK_CONFIG.redirectPath);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier();

  const authUrl = new URL(`${OUTLOOK_CONFIG.authority}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("scope", OUTLOOK_CONFIG.scopes.join(" "));
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "consent");

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });

    const url = new URL(responseUrl);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");

    if (returnedState !== state) {
      return { success: false, error: "State mismatch - securite CSRF" };
    }

    if (!code) {
      const error = url.searchParams.get("error_description") || "Pas de code d'autorisation";
      return { success: false, error };
    }

    // Echanger le code contre des tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUrl, config.clientId);
    if (!tokens.access_token) {
      return { success: false, error: "Echec echange de tokens" };
    }

    await storeTokens(tokens);

    // Recuperer les infos utilisateur
    const userInfo = await graphApiCall("/me?$select=displayName,mail,userPrincipalName", tokens.access_token);

    return {
      success: true,
      email: userInfo.mail || userInfo.userPrincipalName || "",
      displayName: userInfo.displayName || ""
    };

  } catch (err) {
    if (err.message && err.message.includes("cancelled")) {
      return { success: false, error: "Connexion annulee par l'utilisateur" };
    }
    console.error("[AGATE] Outlook login error:", err);
    return { success: false, error: err.message || "Erreur de connexion" };
  }
}

async function exchangeCodeForTokens(code, codeVerifier, redirectUri, clientId) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch(`${OUTLOOK_CONFIG.authority}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || "Echec echange token");
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  };
}

async function outlookLogout() {
  await chrome.storage.local.remove([OUTLOOK_CONFIG.tokenStorageKey]);
  return { success: true };
}

// ============================================================
// GRAPH API HELPER (avec retry 429 + refresh 401)
// ============================================================

async function graphApiCall(endpoint, accessToken, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${OUTLOOK_CONFIG.graphBaseUrl}${endpoint}`;

  const fetchOptions = {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    const response = await fetch(url, fetchOptions);

    // Rate limit
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
      console.warn(`[AGATE] Graph API 429 - retry in ${retryAfter}s`);
      if (retries < maxRetries) {
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        retries++;
        continue;
      }
      throw new Error("Limite de requetes Outlook atteinte. Reessayez dans quelques minutes.");
    }

    // Token expire
    if (response.status === 401) {
      if (retries === 0) {
        const newToken = await getValidToken();
        if (newToken && newToken !== accessToken) {
          fetchOptions.headers["Authorization"] = `Bearer ${newToken}`;
          retries++;
          continue;
        }
      }
      throw new Error("Session Outlook expiree. Reconnectez-vous.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erreur Graph API (${response.status})`);
    }

    // 204 No Content (ex: send mail)
    if (response.status === 204) return { success: true };

    return await response.json();
  }

  throw new Error("Nombre max de retries atteint");
}

// ============================================================
// OPERATIONS EMAIL
// ============================================================

/**
 * Recherche le dernier email envoye a une adresse
 */
async function findLastSentEmail(prospectEmail) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    const result = await graphApiCall(
      `/me/mailFolders/SentItems/messages?$search="to:${prospectEmail}"&$orderby=sentDateTime desc&$top=1&$select=id,subject,sentDateTime,bodyPreview,conversationId`,
      token
    );

    if (result.value && result.value.length > 0) {
      const msg = result.value[0];
      return {
        success: true,
        found: true,
        messageId: msg.id,
        conversationId: msg.conversationId,
        subject: msg.subject,
        sentDate: msg.sentDateTime,
        bodyPreview: msg.bodyPreview || ""
      };
    }

    return { success: true, found: false };
  } catch (err) {
    console.error("[AGATE] findLastSentEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Historique des emails echanges avec un contact (sent + received)
 */
async function getEmailHistory(prospectEmail) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    // Envoyes + recus en parallele
    const [sent, received] = await Promise.all([
      graphApiCall(
        `/me/mailFolders/SentItems/messages?$search="to:${prospectEmail}"&$orderby=sentDateTime desc&$top=15&$select=id,subject,sentDateTime,bodyPreview`,
        token
      ),
      graphApiCall(
        `/me/messages?$filter=sender/emailAddress/address eq '${prospectEmail}'&$orderby=receivedDateTime desc&$top=15&$select=id,subject,receivedDateTime,bodyPreview,from`,
        token
      )
    ]);

    const emails = [];

    if (sent.value) {
      sent.value.forEach(msg => {
        emails.push({
          id: msg.id,
          direction: "sent",
          subject: msg.subject || "(Sans objet)",
          date: msg.sentDateTime,
          preview: msg.bodyPreview || ""
        });
      });
    }

    if (received.value) {
      received.value.forEach(msg => {
        emails.push({
          id: msg.id,
          direction: "received",
          subject: msg.subject || "(Sans objet)",
          date: msg.receivedDateTime,
          preview: msg.bodyPreview || ""
        });
      });
    }

    // Tri par date decroissante
    emails.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { success: true, emails: emails.slice(0, 20) };
  } catch (err) {
    console.error("[AGATE] getEmailHistory error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Creer un brouillon de reponse sur un email existant
 */
async function createDraftReply(messageId, replyBody) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    // Creer le draft reply
    const reply = await graphApiCall(
      `/me/messages/${messageId}/createReply`,
      token,
      { method: "POST" }
    );

    // Mettre a jour le body du brouillon
    if (replyBody) {
      await graphApiCall(
        `/me/messages/${reply.id}`,
        token,
        {
          method: "PATCH",
          body: {
            body: {
              contentType: "HTML",
              content: replyBody
            }
          }
        }
      );
    }

    // Re-fetch le brouillon complet
    const draft = await graphApiCall(
      `/me/messages/${reply.id}?$select=id,subject,body,toRecipients,conversationId`,
      token
    );

    return {
      success: true,
      draftId: draft.id,
      subject: draft.subject,
      body: draft.body?.content || "",
      to: draft.toRecipients?.map(r => r.emailAddress?.address).join(", ") || ""
    };
  } catch (err) {
    console.error("[AGATE] createDraftReply error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Mettre a jour le body d'un brouillon
 */
async function updateDraft(draftId, newBody) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    await graphApiCall(
      `/me/messages/${draftId}`,
      token,
      {
        method: "PATCH",
        body: {
          body: {
            contentType: "HTML",
            content: newBody
          }
        }
      }
    );
    return { success: true };
  } catch (err) {
    console.error("[AGATE] updateDraft error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Envoyer un brouillon
 */
async function sendDraft(draftId) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    await graphApiCall(
      `/me/messages/${draftId}/send`,
      token,
      { method: "POST" }
    );
    return { success: true };
  } catch (err) {
    console.error("[AGATE] sendDraft error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Recuperer le body complet d'un email
 */
async function getEmailBody(messageId) {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Non connecte a Outlook" };

  try {
    const msg = await graphApiCall(
      `/me/messages/${messageId}?$select=body,subject,from,toRecipients,sentDateTime`,
      token
    );
    return {
      success: true,
      subject: msg.subject,
      body: msg.body?.content || "",
      contentType: msg.body?.contentType || "text",
      from: msg.from?.emailAddress?.address || "",
      to: msg.toRecipients?.map(r => r.emailAddress?.address).join(", ") || "",
      date: msg.sentDateTime
    };
  } catch (err) {
    console.error("[AGATE] getEmailBody error:", err);
    return { success: false, error: err.message };
  }
}
