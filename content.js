// content.js
console.log("[Reasy] content.js carregado");

// ---------- Estado global ----------
let selectedText = "";
let returnGroq = "";
let closeTimerId = null;

let dragActive = false;
let dragStart = { x: 0, y: 0 };
let dialogStart = { left: 0, top: 0 };
let draggableBound = false;
let lastDialogPos = null;

const DRAG_THRESHOLD = 4;
const SAFE_MARGIN = 40;

const K_SETTINGS = "reasy_settings";
const defaultSettings = {
  font: "Arial, sans-serif",
  color: "black",
  style: "mesclado",
  enabled: true
};
let settingsCache = { ...defaultSettings };

// ---------- Elementos base ----------
const btnResume = createFloatingButton();
const dialog = createDialog();
injectBaseStyles();

// carrega as preferências inicialmente
loadSettings();

// eventos
btnResume.addEventListener("click", () => openTextDialog());

// mostra o botão SOMENTE no mouseup (fim da seleção)
document.addEventListener("mouseup", async () => {
  // 🔑 carrega o estado mais recente (evita cache desatualizado)
  const s = await loadSettings();
  if (!s.enabled) {
    hideButton();
    return;
  }

  selectedText = getCurrentSelectionText();
  if (!selectedText) {
    hideButton();
    return;
  }

  // se o diálogo estiver visível, não mostra o botão
  const dlg = document.getElementById("ext-selection-dialog");
  const dialogVisible = dlg && dlg.style.display !== "none";
  if (dialogVisible) {
    hideButton();
    return;
  }

  const rect = getSelectionEndRect();
  if (!rect) {
    hideButton();
    return;
  }

  // botão é FIXED; coordenadas são de viewport
  const btnW = 36, btnH = 36, gap = 8;
  const x = Math.min(rect.right + gap, window.innerWidth - btnW - 4);
  const y = Math.max(rect.bottom - btnH, 4);

  btnResume.style.left = `${x}px`;
  btnResume.style.top = `${y}px`;
  btnResume.style.display = "flex";
});

// ---------- Utils de formatação ----------
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Markdown-lite: **bold** e linhas começando com "* "
function formatMarkdownLite(text) {
  if (!text) return "";
  let t = escapeHtml(text);

  const lines = t.split(/\r?\n/);
  let html = "";
  let inList = false;

  const flushListIfOpen = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (let raw of lines) {
    const line = raw.trimEnd();

    // Bullet
    if (/^\*\s+/.test(line)) {
      if (!inList) {
        html += '<ul style="margin:6px 0 10px 18px; padding-left: 18px;">';
        inList = true;
      }
      const liContent = line.replace(/^\*\s+/, "");
      const liWithBold = liContent.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<li>${liWithBold}</li>`;
      continue;
    }

    // linha em branco
    flushListIfOpen();
    if (/^\s*$/.test(line)) {
      html += "<br/>";
      continue;
    }

    // texto normal com **bold**
    const withBold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html += `<p style="margin: 6px 0;">${withBold}</p>`;
  }

  flushListIfOpen();
  return html;
}

// ---------- Criação de UI ----------
function createFloatingButton() {
  let button = document.getElementById("ext-selection-btn");
  if (!button) {
    button = document.createElement("button");
    button.id = "ext-selection-btn";
    button.type = "button";
    Object.assign(button.style, {
      position: "fixed",
      zIndex: "2147483647",
      border: "none",
      display: "none",
      borderRadius: "50%",
      backgroundColor: "#fff",
      color: "#000",
      cursor: "pointer",
      width: "36px",
      height: "36px",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      padding: "0"
    });

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:18px;height:18px;display:block;margin:auto;">
        <path d="M448 432V80c0-26.5-21.5-48-48-48H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48zM112 192c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h128c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h224c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-64z"/>
      </svg>
    `;
    document.documentElement.appendChild(button);
  }
  return button;
}

function createDialog() {
  let dlg = document.getElementById("ext-selection-dialog");
  if (dlg) return dlg;

  dlg = document.createElement("div");
  dlg.id = "ext-selection-dialog";
  Object.assign(dlg.style, {
    position: "fixed",
    flexDirection: "column",
    bottom: "32px",
    right: "32px",
    padding: "15px",
    border: "none",
    gap: "8px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    maxWidth: "420px",
    width: "min(420px, 90vw)",
    zIndex: "2147483647",
    backgroundColor: "#fff",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif",
    color: "rgba(0,0,0,0.85)",
    display: "none",
    maxHeight: "65vh",
    overflow: "hidden"
  });
  document.documentElement.appendChild(dlg);
  return dlg;
}

function injectBaseStyles() {
  if (document.getElementById("reasy-base-styles")) return;
  const style = document.createElement("style");
  style.id = "reasy-base-styles";
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
    @keyframes fadeOut { from { opacity: 1; transform: translateY(0);} to { opacity: 0; transform: translateY(8px);} }
    .hidden { display: none !important; }
    .view-dialog { width: 100%; animation: fadeIn 0.3s ease-in-out; }
    #ext-selection-btn { display:flex; }
  `;
  document.documentElement.appendChild(style);
}

// ---------- Seleção ----------
function getCurrentSelectionText() {
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "TEXTAREA" ||
      (active.tagName === "INPUT" && /text|search|tel|url|password|email/i.test(active.type)))
  ) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    const val = active.value ?? "";
    return val.substring(start, end).trim();
  }
  const sel = window.getSelection();
  return sel ? (sel.toString() || "").trim() : "";
}

function getSelectionRect() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const box = range.getBoundingClientRect();
  if (box && box.width > 0 && box.height > 0) return box;

  const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0);
  if (rects.length === 0) return null;

  const left = Math.min(...rects.map(r => r.left));
  const top = Math.min(...rects.map(r => r.top));
  const right = Math.max(...rects.map(r => r.right));
  const bottom = Math.max(...rects.map(r => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function getSelectionEndRect() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const r = sel.getRangeAt(0).cloneRange();
  r.collapse(false);

  let rect = r.getBoundingClientRect();
  if (rect && (rect.width > 0 || rect.height > 0)) return rect;

  const span = document.createElement("span");
  span.appendChild(document.createTextNode("\u200b"));
  r.insertNode(span);
  rect = span.getBoundingClientRect();
  span.parentNode?.removeChild(span);
  return rect || null;
}

function hideButton() {
  btnResume.style.display = "none";
}

// ---------- Drag (header como alça) ----------
function makeDialogDraggable() {
  if (draggableBound) return;
  const header = dialog.querySelector(".reasy-header");
  if (!header) return;

  header.style.cursor = "move";
  header.style.userSelect = "none";
  header.style.touchAction = "none";
  header.style.zIndex = "1";

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  let startedAsDrag = false;

  function isInHeaderArea(ev) {
    const r = header.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    }

  const beginDrag = (ev) => {
    if (!isInHeaderArea(ev)) return false;
    const target = ev.target;
    if (target.closest("#ext-min-dialog") || target.closest("#ext-close-dialog")) return false;

    const rect = dialog.getBoundingClientRect();
    dialog.style.position = "fixed";
    dialog.style.left = rect.left + "px";
    dialog.style.top = rect.top + "px";
    dialog.style.right = "auto";
    dialog.style.bottom = "auto";

    dragActive = true;
    startedAsDrag = false;
    dragStart.x = ev.clientX;
    dragStart.y = ev.clientY;
    dialogStart.left = rect.left;
    dialogStart.top = rect.top;
    return true;
  };

  const maybeStartDrag = (ev) => {
    if (!dragActive || startedAsDrag) return;
    const dx = Math.abs(ev.clientX - dragStart.x);
    const dy = Math.abs(ev.clientY - dragStart.y);
    if (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD) {
      startedAsDrag = true;
      document.body.style.userSelect = "none";
    }
  };

  const moveDrag = (ev) => {
    if (!dragActive) return;
    maybeStartDrag(ev);
    if (!startedAsDrag) return;

    const dx = ev.clientX - dragStart.x;
    const dy = ev.clientY - dragStart.y;

    const rect = dialog.getBoundingClientRect();

    // limites elásticos (permitem sair um pouco para sempre dar espaço)
    const minLeft = Math.min(0, window.innerWidth - SAFE_MARGIN - rect.width);
    const maxLeft = Math.max(0, window.innerWidth - rect.width + SAFE_MARGIN);
    const minTop  = Math.min(0, window.innerHeight - SAFE_MARGIN - rect.height);
    const maxTop  = Math.max(0, window.innerHeight - rect.height + SAFE_MARGIN);

    dialog.style.left = clamp(dialogStart.left + dx, minLeft, maxLeft) + "px";
    dialog.style.top  = clamp(dialogStart.top  + dy, minTop,  maxTop)  + "px";

    // memoriza posição para reabrir no mesmo lugar
    lastDialogPos = {
      left: parseFloat(dialog.style.left || "0"),
      top: parseFloat(dialog.style.top  || "0")
    };
  };

  const endDrag = () => {
    if (!dragActive) return;
    dragActive = false;
    document.body.style.userSelect = "";
    startedAsDrag = false;
  };

  // Pointer events preferidos
  const onPointerDown = (e) => {
    if ((e.button !== undefined && e.button !== 0) && (e.buttons !== undefined && e.buttons !== 1)) return;
    const ok = beginDrag(e);
    if (!ok) return;
    try { header.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => moveDrag(e);
  const onPointerUp   = () => endDrag();

  header.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("blur", onPointerUp, { passive: true });

  // Fallback mouse
  const onMouseDown = (e) => { if (e.button === 0) beginDrag(e); };
  const onMouseMove = (e) => moveDrag(e);
  const onMouseUp   = () => endDrag();

  header.addEventListener("mousedown", onMouseDown, { passive: true });
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("mouseup", onMouseUp,   { passive: true });

  draggableBound = true;
}

// ---------- Render do diálogo ----------
function renderDialog() {
  dialog.innerHTML = `
    <div class="reasy-header" style="
      display:flex; align-items:center; gap:8px;
      position:sticky; top:0; background:#fff; padding-bottom:6px; border-bottom:1px solid rgba(0,0,0,.08);
    ">
      <h3 style="font-size:16px;font-weight:700;margin:0;">Reasy</h3>
      <div class="reasy-spacer" style="flex:1 1 auto;"></div>
      <div class="reasy-actions" style="display:flex;gap:6px; white-space:nowrap;">
        <button id="ext-min-dialog" title="Minimizar/Maximizar" style="background:transparent;border:0;cursor:pointer;">
          <svg id="ext-min-icon" style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M416 208H32c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32v-32c0-17.7-14.3-32-32-32z"/>
          </svg>
        </button>
        <button id="ext-close-dialog" title="Fechar" style="background:transparent;border:0;cursor:pointer;">
          <svg style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
            <path d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.5c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"/>
          </svg>
        </button>
      </div>
    </div>

    <div id="reasy-content" style="
      overflow:auto; max-height:50vh; line-height:1.45; font-size:14px; white-space:normal;
    ">${formatMarkdownLite(returnGroq || "Gerando resumo...")}</div>
  `;

  // fechar (com controle de timeout)
  document.getElementById("ext-close-dialog").addEventListener("click", () => {
    if (closeTimerId) {
      clearTimeout(closeTimerId);
      closeTimerId = null;
    }
    dialog.style.animation = "fadeOut 0.2s forwards";
    closeTimerId = setTimeout(() => {
      dialog.style.display = "none";
      selectedText = "";
      returnGroq = "";
      closeTimerId = null;
    }, 200);
  });

  // minimizar/maximizar (só o conteúdo)
  document.getElementById("ext-min-dialog").addEventListener("click", () => {
    const content = document.getElementById("reasy-content");
    const icon = document.getElementById("ext-min-icon");
    const collapsed = content.style.display === "none";

    if (collapsed) {
      content.style.display = "block";
      icon.outerHTML = `
        <svg id="ext-min-icon" style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M416 208H32c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32v-32c0-17.7-14.3-32-32-32z"/>
        </svg>
      `;
    } else {
      content.style.display = "none";
      icon.outerHTML = `
        <svg id="ext-min-icon" style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
        </svg>
      `;
    }

    // pequeno reset para manter animação coerente
    dialog.style.animation = "none";
    void dialog.offsetWidth;
    dialog.style.animation = "fadeIn 0.2s forwards";
  });

  // aplica estilo (fonte/cor) e liga o drag
  loadSettings().then(s => applyContentStyle(s));
  makeDialogDraggable();
}

// ---------- Loading no botão ----------
function startButtonLoading() {
  btnResume.innerHTML = `
    <svg id="load-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:18px;height:18px;">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
    </svg>`;
  btnResume.style.pointerEvents = "none";
}

// ---------- Abrir diálogo e chamar o resumo ----------
async function openTextDialog() {
  // respeita o toggle
  const s = await loadSettings();
  if (!s.enabled) return;
  if (!selectedText) return;

  startButtonLoading();

  try {
    await consultaGroq(selectedText);
  } catch (e) {
    console.error("[Reasy] erro ao resumir:", e);
    returnGroq = `Erro ao resumir: ${e.message}`;
  } finally {
    btnResume.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:18px;height:18px;display:block;margin:auto;">
        <path d="M448 432V80c0-26.5-21.5-48-48-48H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48zM112 192c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h128c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h224c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-64z"/>
      </svg>
    `;
    btnResume.style.pointerEvents = "auto";
    btnResume.style.display = "none";
  }

  // render inicial ou só atualizar conteúdo
  if (!document.getElementById("reasy-content")) {
    renderDialog();
  } else {
    const pane = document.getElementById("reasy-content");
    if (pane) pane.innerHTML = formatMarkdownLite(returnGroq);
    loadSettings().then(s => applyContentStyle(s));
  }

  // cancelar fechamento pendente
  if (closeTimerId) {
    clearTimeout(closeTimerId);
    closeTimerId = null;
  }

  // reset de animação
  dialog.style.animation = "none";
  void dialog.offsetWidth;
  dialog.style.animation = "fadeIn 0.2s forwards";

  // reposicionar para a última posição conhecida (se houver)
  if (lastDialogPos) {
    dialog.style.left = lastDialogPos.left + "px";
    dialog.style.top  = lastDialogPos.top + "px";
    dialog.style.right = "auto";
    dialog.style.bottom = "auto";
  }

  dialog.style.display = "flex";

  try { window.getSelection()?.removeAllRanges(); } catch {}
}

// ---------- Chamada ao background ----------
function consultaGroq(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "summarize", text, options: { style: settingsCache.style } }, (resp) => {
      if (chrome.runtime.lastError) {
        console.error("[Reasy] runtime error:", chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }
      if (!resp) return reject(new Error("Sem resposta do background"));
      if (resp.error) {
        console.error("[Reasy] erro do background:", resp.error);
        return reject(new Error(resp.error));
      }
      returnGroq = resp.summary;
      const pane = document.getElementById("reasy-content");
      if (pane) pane.innerHTML = formatMarkdownLite(returnGroq);
      loadSettings().then(s => applyContentStyle(s));
      resolve(resp.summary);
    });
  });
}

// ---------- Configurações ----------
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([K_SETTINGS], (data) => {
      settingsCache = { ...defaultSettings, ...(data[K_SETTINGS] || {}) };
      resolve(settingsCache);
    });
  });
}

function applyContentStyle(settings) {
  const pane = document.getElementById("reasy-content");
  if (!pane) return;
  const map = { black: "#111", red: "#c62828", blue: "#1565c0", green: "#2e7d32" };
  pane.style.color = map[settings.color] || "#111";
  pane.style.fontFamily = settings.font || "Arial, sans-serif";
}

// reage a mudanças do popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[K_SETTINGS]) return;
  settingsCache = { ...defaultSettings, ...(changes[K_SETTINGS].newValue || {}) };
  applyContentStyle(settingsCache);

  // se desligou, some com o botão e fecha o diálogo
  if (!settingsCache.enabled) {
    hideButton();
    if (dialog && dialog.style.display !== "none") {
      dialog.style.display = "none";
    }
  }
});
