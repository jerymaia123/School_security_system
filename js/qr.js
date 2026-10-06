// QR helpers: show a QR code, run the camera scanner, draw result cards.

function renderQR(containerId, text) {
    const box = document.getElementById(containerId);
    box.textContent = "";
    new QRCode(box, { text, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
}

function setupScanner(onToken) {
    let scanner = null, busy = false;

    async function stop() {
        if (!scanner) return;
        try { await scanner.stop(); scanner.clear(); } catch (e) { /* already stopped */ }
        scanner = null;
    }

    async function start() {
        busy = false;
        showMessage("msg", "");
        scanner = new Html5Qrcode("reader");
        try {
            await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, async (text) => {
                if (busy) return;
                busy = true;
                await stop();
                onToken(text.trim());
            }, () => {});
        } catch (e) {
            console.error(e);
            scanner = null;
            showMessage("msg", "Camera unavailable. Allow camera access (needs https or localhost), or type the code below.");
        }
    }

    document.getElementById("startBtn").onclick = start;
    document.getElementById("manualForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const t = document.getElementById("manualToken").value.trim();
        if (t) { stop(); onToken(t); }
    });
    return { start, stop };
}

function banner(text, kind, sub) {
    const d = document.createElement("div");
    d.className = "banner " + kind;
    d.textContent = text;
    if (sub) { const s = document.createElement("small"); s.textContent = sub; d.appendChild(s); }
    return d;
}

// rows = [["Label", value], ...]
function studentCard(photoUrl, rows) {
    const card = document.createElement("div");
    card.className = "student-card";
    if (photoUrl && /^https:\/\//.test(photoUrl)) {
        const img = document.createElement("img");
        img.src = photoUrl; img.alt = "Student photo";
        card.appendChild(img);
    }
    const dl = document.createElement("dl");
    rows.forEach(([k, v]) => {
        const dt = document.createElement("dt"); dt.textContent = k;
        const dd = document.createElement("dd"); dd.textContent = v || "-";
        dl.append(dt, dd);
    });
    card.appendChild(dl);
    return card;
}
