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

    async function onDecoded(text) {
        if (busy) return;
        busy = true;
        await stop();
        document.getElementById("reader").hidden = true;
        onToken(text.trim());
    }

    async function start() {
        busy = false;
        showMessage("msg", "");

        if (typeof Html5Qrcode === "undefined") {
            return showMessage("msg", "The scanner could not load. Check your internet connection, then refresh the page (Ctrl+F5).");
        }

        await stop();
        const reader = document.getElementById("reader");
        reader.hidden = false;                       // the camera needs a visible box
        scanner = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 220, height: 220 } };

        try {
            await scanner.start({ facingMode: "environment" }, config, onDecoded, () => {});
        } catch (first) {
            try {                                    // no back camera (e.g. laptop): use the first camera
                const cams = await Html5Qrcode.getCameras();
                if (!cams.length) throw first;
                await scanner.start(cams[0].id, config, onDecoded, () => {});
            } catch (e) {
                console.error(e);
                scanner = null;
                reader.hidden = true;
                const blocked = /permission|denied|notallowed/i.test(String(e));
                showMessage("msg", blocked
                    ? "Camera access is blocked. Click the lock icon next to the web address, set Camera to Allow, then reload. Or type the code below."
                    : "Camera unavailable. Close other apps that use the camera, or type the code below.");
            }
        }
    }

    document.getElementById("startBtn").onclick = start;
    document.getElementById("manualForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const t = document.getElementById("manualToken").value.trim();
        if (t) { stop(); document.getElementById("reader").hidden = true; onToken(t); }
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
