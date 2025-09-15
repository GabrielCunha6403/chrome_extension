console.log("[Reasy] content.js carregado");

let selectedText = "";
let returnGroq = "";

const btnResume = createFloatingButton();
const dialog = createDialog();
injectBaseStyles();

btnResume.addEventListener("click", () => openTextDialog());

document.addEventListener("mouseup", () => {
  selectedText = getCurrentSelectionText();

  if (!selectedText) {
    hideButton();
    return;
  }

  const dlg = document.getElementById("ext-selection-dialog");
  const dialogVisible = dlg && dlg.style.display !== "none";
  if (dialogVisible) {
    hideButton();
    return;
  }

  const rect = getSelectionRect();
  if (!rect) {
    hideButton();
    return;
  }
  const x = Math.min(rect.right + 8, window.innerWidth - 44);
  const y = Math.max(rect.top - 44, 8);

  btnResume.style.left = `${x}px`;
  btnResume.style.top = `${y + window.scrollY}px`;
  btnResume.style.display = "flex";
});

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
    bottom: "32px",
    right: "32px",
    padding: "15px",
    border: "none",
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

function handleSelectionChange() {
  const sel = getCurrentSelectionText();
  selectedText = sel;
  if (sel) {
    updateButtonPositionFromSelection();
  } else {
    hideButton();
  }
}

function getCurrentSelectionText() {
  const active = document.activeElement;
  if (active && (active.tagName === "TEXTAREA" || (active.tagName === "INPUT" && /text|search|tel|url|password|email/i.test(active.type)))) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    const val = active.value ?? "";
    const sub = val.substring(start, end).trim();
    return sub;
  }
  const sel = window.getSelection();
  return sel ? (sel.toString() || "").trim() : "";
}

function updateButtonPositionFromSelection() {
  try {
    const rect = getSelectionRect();
    if (!selectedText || !rect) {
      hideButton();
      return;
    }
    const x = Math.min(rect.right + 8, window.innerWidth - 44);
    const y = Math.max(rect.top - 44, 8);

    btnResume.style.left = `${x}px`;
    btnResume.style.top = `${y + window.scrollY}px`;
    btnResume.style.display = "flex";
  } catch (e) {
    console.warn("[Reasy] não consegui posicionar botão:", e);
    hideButton();
  }
}

function getSelectionRect() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rects = range.getClientRects();
  if (rects.length > 0) return rects[rects.length - 1];

  const span = document.createElement("span");
  span.appendChild(document.createTextNode("\u200b"));
  range.insertNode(span);
  const rect = span.getBoundingClientRect();
  span.parentNode?.removeChild(span);
  range.collapse(false);
  return rect;
}

function hideButton() {
  btnResume.style.display = "none";
}

function renderDialog() {
  dialog.innerHTML = `
    <div class="view-dialog" style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:16px;font-weight:700;margin:0;">Reasy</h3>
        <div style="display:flex;gap:6px;">
          <button id="ext-min-dialog" title="Minimizar" style="background:transparent;border:0;cursor:pointer;">
            <svg style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 208H32c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32v-32c0-17.7-14.3-32-32-32z"/></svg>
          </button>
          <button id="ext-close-dialog" title="Fechar" style="background:transparent;border:0;cursor:pointer;">
            <svg style="height:16px;width:16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.5c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"/></svg>
          </button>
        </div>
      </div>
      <div id="reasy-result" style="overflow:auto;max-height:50vh;line-height:1.45;font-size:14px;white-space:pre-wrap;">${returnGroq || "Gerando resumo..."}</div>
    </div>
  `;

  document.getElementById("ext-close-dialog").addEventListener("click", () => {
    dialog.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => {
      dialog.style.display = "none";
      selectedText = "";
      returnGroq = "";
    }, 250);
  });

  document.getElementById("ext-min-dialog").addEventListener("click", () => {
    const body = dialog.querySelector(".view-dialog");
    if (body) body.classList.toggle("hidden");
  });
}

function startButtonLoading() {
  btnResume.innerHTML = `
    <svg id="load-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:18px;height:18px;">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
    </svg>`;
  btnResume.style.pointerEvents = "none";
}

async function openTextDialog() {
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

  renderDialog();
  dialog.style.display = "flex";

  try { window.getSelection()?.removeAllRanges(); } catch {}
}

function consultaGroq(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "summarize", text }, (resp) => {
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
      const el = document.getElementById("reasy-result");
      if (el) el.textContent = returnGroq;
      resolve(resp.summary);
    });
  });
}
