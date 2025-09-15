// ===== CONFIG =====
const BACKEND_URL = "https://chrome-extension-backend-tan.vercel.app";
const GOOGLE_CLIENT_ID = "145943388451-ot0v4lb7p290n59rjng6o543t0p06sfu.apps.googleusercontent.com"; // ...apps.googleusercontent.com

// ===== KEYS NO STORAGE =====
const K_APPJWT = "reasy_appJwt";
const K_APPJWT_EXP = "reasy_appJwtExp";
const K_EMAIL = "reasy_email";

// ===== STATE EM MEMÓRIA =====
let appJwt = null;
let appJwtExp = 0;     // epoch seconds
let userEmail = null;

// ===== HELPERS =====
function parseJwtExp(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp || 0;
  } catch {
    return 0;
  }
}

async function loadFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get([K_APPJWT, K_APPJWT_EXP, K_EMAIL], (data) => {
      appJwt = data[K_APPJWT] || null;
      appJwtExp = data[K_APPJWT_EXP] || 0;
      userEmail = data[K_EMAIL] || null;
      resolve();
    });
  });
}

async function saveToStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [K_APPJWT]: appJwt,
      [K_APPJWT_EXP]: appJwtExp,
      [K_EMAIL]: userEmail
    }, resolve);
  });
}

// ===== OIDC (GOOGLE) =====
function buildAuthUrl({ prompt = "select_account", loginHint = null } = {}) {
  const EXT_ID = chrome.runtime.id;
  const REDIRECT_URI = `https://${EXT_ID}.chromiumapp.org/`;
  const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

  let url =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?response_type=id_token" +
    `&client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    "&scope=openid%20email" +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=${encodeURIComponent(prompt)}`;

  if (loginHint) {
    url += `&login_hint=${encodeURIComponent(loginHint)}`;
  }
  return url;
}

async function authFlow({ interactive, prompt, loginHint }) {
  const authUrl = buildAuthUrl({ prompt, loginHint });
  const redirectUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive });
  const url = new URL(redirectUrl);
  const params = new URLSearchParams(url.hash.slice(1));
  const idToken = params.get("id_token");
  if (!idToken) throw new Error("id_token não retornado pelo Google");
  return idToken;
}

// Tenta renovar ID token sem UI (cookies do Google precisam estar válidos)
async function silentGoogleIdToken() {
  // prompt=none + login_hint (se soubermos o email) evita seleção de conta
  return authFlow({
    interactive: false,
    prompt: "none",
    loginHint: userEmail || null
  });
}

// Fluxo interativo só se necessário
async function interactiveGoogleIdToken() {
  return authFlow({
    interactive: true,
    prompt: userEmail ? "none" : "select_account", // se já sabemos o email, nem pede escolher conta
    loginHint: userEmail || null
  });
}

// Troca id_token por appJwt curto no seu backend
async function exchangeIdTokenForAppJwt(idToken) {
  const r = await fetch(`${BACKEND_URL}/api/auth-google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!r.ok) throw new Error(`Auth backend falhou: ${await r.text()}`);
  const data = await r.json();
  appJwt = data.appJwt;
  appJwtExp = parseJwtExp(appJwt);
  userEmail = data.email || userEmail || null;
  await saveToStorage();
}

// ===== AUTH PRINCIPAL =====
async function ensureAuth() {
  // 1) tenta usar cache de storage (importante pq o SW dorme)
  if (!appJwt) {
    await loadFromStorage();
  }

  const now = Math.floor(Date.now() / 1000);
  if (appJwt && appJwtExp - 30 > now) {
    // console.log("[Reasy] appJwt ainda válido");
    return;
  }

  // 2) expirou ou não existe: tenta renovar de forma silenciosa
  try {
    const idToken = await silentGoogleIdToken();
    await exchangeIdTokenForAppJwt(idToken);
    return;
  } catch (e) {
    // console.warn("[Reasy] silent auth falhou, caindo para interativo:", e?.message);
  }

  // 3) se silencioso falhar (sem cookies válidos), abre UI uma vez
  const idToken = await interactiveGoogleIdToken();
  await exchangeIdTokenForAppJwt(idToken);
}

// ===== CHAMADAS PROTEGIDAS =====
async function callSummarize(text) {
  await ensureAuth();
  const r = await fetch(`${BACKEND_URL}/api/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${appJwt}`
    },
    body: JSON.stringify({ text })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
  return data.summary;
}

// ===== MENSAGERIA COM O CONTENT =====
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "summarize") return;

  (async () => {
    try {
      const summary = await callSummarize(msg.text);
      sendResponse({ summary });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();

  return true; // async
});

// Opcional: carrega cache logo que o SW acorda
loadFromStorage();
