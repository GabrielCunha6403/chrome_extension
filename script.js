document.addEventListener("mouseup", (event) => {
    let selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        let button = document.getElementById("ext-selection-btn");
        if (!button) {
            button = document.createElement("button");
            button.id = "ext-selection-btn";
            button.innerText = "Resume";
            button.style.position = "absolute";
            button.style.zIndex = "9999";
            button.style.padding = "8px";
            button.style.border = "none";
            button.style.borderRadius = "5px";
            button.style.backgroundColor = "#007bff";
            button.style.color = "#fff";
            button.style.cursor = "pointer";
            button.style.fontSize = "14px";
            button.style.boxShadow = "0px 2px 5px rgba(0,0,0,0.3)";
            button.style.transition = "opacity 0.2s";
            document.body.appendChild(button);
        }

        button.style.left = `${event.pageX + 10}px`;
        button.style.top = `${event.pageY + 10}px`;
        button.style.display = "block";

        button.onclick = () => this.openTextDialog(button, selectedText);
    } else {
        const btn = document.getElementById("ext-selection-btn");
        if (btn) btn.style.display = "none";
    }
});

function generateTextDialogContent(selectedText) {
    console.log(selectedText);
    return `
        <label>${selectedText}</label>
        <button id="ext-close-dialog" style="background-color: red; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer;">
            Fechar
        </button>
    `
}

function openTextDialog(button, selectedText) {

    let dialog = document.getElementById("ext-selection-dialog");

    if (!dialog) {
        dialog = document.createElement("div");
        dialog.style.position = "fixed";
        dialog.style.bottom = "32px";
        dialog.style.right = "32px";
    
        button.style.display = "none"; // Esconde o botão após abrir o diálogo
                
        dialog.id = "ext-selection-dialog";
        dialog.style.padding = "15px";
        dialog.style.border = "none";
        dialog.style.borderRadius = "10px";
        dialog.style.boxShadow = "0px 2px 10px rgba(0,0,0,0.3)";
        dialog.style.maxWidth = "400px";
        dialog.style.zIndex = "10000";
        dialog.style.backgroundColor = "rgb(107, 243, 196)";
    
    }
    dialog.innerHTML = this.generateTextDialogContent(selectedText);

    document.body.appendChild(dialog);

    document.getElementById("ext-close-dialog").addEventListener("click", () => {
        dialog.style.display = "none";
        selectedText = '';
    });
    
    dialog.style.display = "flex";
}
