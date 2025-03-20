document.addEventListener("mouseup", (event) => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 0) {
        let button = document.querySelector("#ext-selection-btn");
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
            button.style.transition = "opacity 0.5s";
            document.body.appendChild(button);
        }

        button.style.left = `${event.pageX + 10}px`;
        button.style.top = `${event.pageY + 10}px`;
        button.style.display = "block";

        button.onclick = () => {
            alert(`Texto selecionado: ${selectedText}`);
            button.style.display = "none"; 
        };
    } else {
        const btn = document.getElementById("ext-selection-btn");
        if (btn) btn.style.display = "none";
    }
});