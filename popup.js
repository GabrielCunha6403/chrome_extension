// popup.js
const K_SETTINGS = "reasy_settings";

const defaults = {
  enabled: true,                    // Liga/Desliga
  font: "Arial, sans-serif",        // Fonte do resumo (exibição)
  color: "black",                   // Cor do resumo
  style: "mesclado"                 // "texto" | "topicos" | "mesclado"
};

const $ = (id) => document.getElementById(id);

function getSettings() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([K_SETTINGS], (data) => {
        if (chrome.runtime.lastError) {
          console.error("[popup] storage.get error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        const merged = { ...defaults, ...(data[K_SETTINGS] || {}) };
        resolve(merged);
      });
    } catch (e) {
      reject(e);
    }
  });
}

function setSettings(obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [K_SETTINGS]: obj }, () => {
        if (chrome.runtime.lastError) {
          console.error("[popup] storage.set error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function loadUI() {
  try {
    const s = await getSettings();
    // Preenche os campos
    $("enabled").checked = !!s.enabled;
    $("font").value = s.font;
    $("color").value = s.color;
    $("style").value = s.style;

    console.log("[popup] loaded settings:", s);
  } catch (e) {
    console.error("[popup] loadUI failed:", e);
    const err = $("errMsg");
    if (err) err.style.display = "block";
  }
}

async function saveUI() {
  const newSettings = {
    enabled: $("enabled").checked,
    font: $("font").value,
    color: $("color").value,
    style: $("style").value
  };

  try {
    await setSettings(newSettings);
    console.log("[popup] saved settings:", newSettings);

    if ($("okMsg")) {
      $("okMsg").style.display = "block";
      setTimeout(() => { $("okMsg").style.display = "none"; }, 1200);
    }
    if ($("errMsg")) $("errMsg").style.display = "none";
  } catch (e) {
    console.error("[popup] saveUI failed:", e);
    if ($("okMsg")) $("okMsg").style.display = "none";
    if ($("errMsg")) $("errMsg").style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Verifica a existência dos elementos (evita erros silenciosos)
  const required = ["enabled", "font", "color", "style", "saveBtn"];
  for (const id of required) {
    if (!$(id)) {
      console.error(`[popup] elemento #${id} não encontrado no DOM`);
    }
  }

  loadUI();

  // Botão salvar
  $("saveBtn")?.addEventListener("click", saveUI);

  // Pequeno UX: ao mexer em qualquer campo, esconda mensagens
  for (const id of ["enabled", "font", "color", "style"]) {
    $(id)?.addEventListener("change", () => {
      if ($("okMsg")) $("okMsg").style.display = "none";
      if ($("errMsg")) $("errMsg").style.display = "none";
    });
  }
});

document.getElementById("closePopup").addEventListener("click", () => {
    window.close();
});
