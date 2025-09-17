const K_SETTINGS = "reasy_settings";
const defaults = {
  font: "Arial, sans-serif",
  color: "black",
  style: "mesclado"
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
        resolve({ ...defaults, ...(data[K_SETTINGS] || {}) });
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
    $("font").value = s.font;
    $("color").value = s.color;
    $("style").value = s.style;
    console.log("[popup] loaded settings:", s);
  } catch (e) {
    console.error("[popup] loadUI failed:", e);
    $("errMsg").style.display = "block";
  }
}

async function saveUI() {
  const newSettings = {
    font: $("font").value,
    color: $("color").value,
    style: $("style").value
  };
  try {
    await setSettings(newSettings);
    console.log("[popup] saved settings:", newSettings);
    $("okMsg").style.display = "block";
    $("errMsg").style.display = "none";
    setTimeout(() => $("okMsg").style.display = "none", 1200);
  } catch (e) {
    console.error("[popup] saveUI failed:", e);
    $("okMsg").style.display = "none";
    $("errMsg").style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Confirma que os elementos existem
  if (!$("font") || !$("color") || !$("style") || !$("saveBtn")) {
    console.error("[popup] algum elemento não foi encontrado no DOM");
    return;
  }
  loadUI();
  $("saveBtn").addEventListener("click", saveUI);
});
