const BACKEND_URL = "https://chrome-extension-backend-tan.vercel.app";
const GOOGLE_CLIENT_ID = "145943388451-ot0v4lb7p290n59rjng6o543t0p06sfu.apps.googleusercontent.com"; // termina com .apps.googleusercontent.com

let appJwt = null;
let appJwtExp = 0;

function parseJwtExp(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp || 0;
  } catch {
    return 0;
  }
}

async function googleSignIn() {
  const EXT_ID = chrome.runtime.id;
  const REDIRECT_URI = `https://${EXT_ID}.chromiumapp.org/`;
  const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?response_type=id_token" +
    `&client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    "&scope=openid%20email" +
    "&prompt=select_account" +
    `&nonce=${encodeURIComponent(nonce)}`;

  const redirectUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  const url = new URL(redirectUrl);
  const params = new URLSearchParams(url.hash.slice(1));
  const idToken = params.get("id_token");
  if (!idToken) throw new Error("id_token não retornado pelo Google");
  return idToken;
}

async function ensureAuth() {
  const now = Math.floor(Date.now() / 1000);
  if (appJwt && appJwtExp - 30 > now) return;

  const idToken = await googleSignIn();
  const r = await fetch(`${BACKEND_URL}/api/auth-google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!r.ok) throw new Error(`Auth backend falhou: ${await r.text()}`);
  const data = await r.json();
  appJwt = data.appJwt;
  appJwtExp = parseJwtExp(appJwt);
}

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

  return true;
});
