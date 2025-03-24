
let selectedText = "";

let btnResume = this.generateBtnResume();
btnResume.onclick = () => this.openTextDialog();

let dialog = this.generateDialog();

function generateBtnResume() {
    let button = document.createElement("button");
    button.id = "ext-selection-btn";
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M448 432V80c0-26.5-21.5-48-48-48H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48zM112 192c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h128c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h224c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112zm0 96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-64z"/></svg>';
    button.style.position = "absolute";
    button.style.zIndex = "9999";
    button.style.border = "none";
    button.style.display = "none";
    button.style.borderRadius = "50%";
    button.style.backgroundColor = "#fff";
    button.style.color = "#000";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.boxShadow = "0px 2px 5px rgba(0,0,0,0.3)";
    button.style.transition = "opacity 0.2s";

    document.body.appendChild(button);

    return button;
}

function generateDialog() {
    let dialog = document.createElement("div");
    dialog.id = "ext-selection-dialog";
    dialog.style.position = "fixed";
    dialog.style.bottom = "32px";
    dialog.style.right = "32px";
    dialog.style.padding = "15px";
    dialog.style.border = "none";
    dialog.style.borderRadius = "10px";
    dialog.style.boxShadow = "0px 2px 10px rgba(0,0,0,0.3)";
    dialog.style.maxWidth = "400px";
    dialog.style.zIndex = "10000";
    dialog.style.backgroundColor = "#fff";
    dialog.style.fontFamily = "open sans";
    dialog.style.display = "none";
    dialog.style.animation = "fadeIn 0.3s ease-in-out";
    dialog.style.maxHeight = "50vh";

    document.body.appendChild(dialog);

    return dialog;
}

document.addEventListener("mouseup", (event) => {
    selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        if(!document.getElementById("ext-selection-dialog")?.style.display !== 'none') {
            btnResume.style.left = `${event.pageX + 10}px`;
            btnResume.style.top = `${event.pageY + 10}px`;
            btnResume.style.display = "flex";
        }

    } else {
        const btn = document.getElementById("ext-selection-btn");
        if (btn) btn.style.display = "none";
    }
});

function generateTextDialogContent() {
    return `
        <div class="view-dialog hidden" style="animation: fadeIn 0.3s forwards">
            <a id="btn-reasy" style="font-size: 32px; font-weight: 600; margin: 0; cursor: pointer;">Reasy</a>
        </div>
        <div class="view-dialog" style="display: flex; flex-direction: column;">
            <div style="display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 15px;">
                <h3 style="font-size: 16px; font-weight: 600; margin: 0; padding: 0;">Reasy</h3>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: end;">
                    <button id="ext-min-dialog" style="align-items: center; background: transparent; border: 0; border-radius: 5px; cursor: pointer; height: fit-content;">
                        <svg style="height: 16px; width: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M416 208H32c-17.7 0-32 14.3-32 32v32c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32v-32c0-17.7-14.3-32-32-32z"/></svg>
                    </button>
                    <button id="ext-close-dialog" style="background: transparent; border: 0; border-radius: 5px; cursor: pointer; height: fit-content;">
                        <svg style="height: 16px; width: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.5c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"/></svg>
                    </button>
                </div>
            </div>
            <label style="overflow-y: auto;">${selectedText}</label>
        </div>
    `
}

function openTextDialog() {
    dialog.style.animation = "fadeIn 0.3s forwards";
    
    btnResume.style.display = "none"; // Esconde o botão após abrir o diálogo
    dialog.innerHTML = this.generateTextDialogContent();

    window.getSelection().removeAllRanges();  

    document.getElementById("ext-close-dialog").addEventListener("click", () => {
        dialog.style.animation = "fadeOut 0.3s forwards";

        setTimeout(() => {
            dialog.style.display = "none";
            selectedText = '';
        }, 300);
    });

    document.getElementById("ext-min-dialog").addEventListener("click", () => {
        document.querySelectorAll(".view-dialog").forEach(element => element.classList.toggle("hidden"));
    });

    document.getElementById("btn-reasy").addEventListener("click", () => {
        document.querySelectorAll(".view-dialog").forEach(element => element.classList.toggle("hidden"));
    })

    dialog.style.display = "flex";
}
