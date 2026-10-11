// Faculty QR: faculty generate their own QR code, guards scan it to verify them at the gate.
ICON.myqr = "▤";
NAVS.teacher.splice(NAVS.teacher.length - 1, 0, ["myqr", "My QR Code"]);   // just before "My Profile"

/* ---------- Faculty: My QR Code page ---------- */
function pageMyQR() {
    const { p, b } = panel("My Faculty QR Code", "Show this QR code to the guard at the gate so they can verify you.");
    view.append(p);
    b.innerHTML = '<div id="msg" class="message" hidden></div><button class="btn" id="gen">Generate my QR code</button>' +
        '<div id="qrWrap" hidden><div class="qr-box"><div id="qr"></div></div><p class="token" id="tok"></p>' +
        '<div class="btn-row"><button class="btn alt" id="dl">Download QR code</button></div></div>';

    $("gen").onclick = async () => {
        const { data, error } = await db.from("teachers").select("qr_token, teacher_id, status").eq("profile_id", me.id).maybeSingle();
        if (error || !data) { console.error(error); return showMessage("msg", "No faculty record was found for your account."); }
        if (data.status !== "active") showMessage("msg", "Your faculty account is not active, so the gate will deny this QR code.");
        renderQR("qr", data.qr_token);
        $("tok").textContent = "Employee ID " + data.teacher_id + "  •  " + data.qr_token;
        $("qrWrap").hidden = false; $("gen").hidden = true;
    };
    $("dl").onclick = () => {
        const a = document.createElement("a");
        a.href = document.querySelector("#qr canvas").toDataURL("image/png");
        a.download = "my-faculty-qr.png"; a.click();
    };
}

const baseShowForQR = window.show;
window.show = async function (page) {
    if (page !== "myqr" || role !== "teacher") return baseShowForQR(page);
    if (activeScanner) { activeScanner.stop(); activeScanner = null; }
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
    $("pageTitle").textContent = "My QR Code";
    $("sidebar").classList.remove("open");
    view.textContent = "";
    pageMyQR();
};

/* ---------- Guard: scanning a faculty QR ---------- */
const baseGuardFlowForFaculty = window.guardFlow;
window.guardFlow = async function (token, out) {
    if (!/^FAC-/i.test(token)) return baseGuardFlowForFaculty(token, out);   // students: unchanged

    const { data, error } = await db.rpc("guard_verify_qr", { p_token: token });
    if (error) { console.error(error); return showMessage("msg", "Could not check the QR code. Try again."); }
    if (data.status === "denied") return out.append(banner("ACCESS DENIED", "denied", data.reason));

    const f = data.faculty;
    out.append(banner("FACULTY VERIFIED", "granted"),
        baseStudentCard(null, [["Role", "Faculty"], ["Employee ID", f.employee_id], ["Name", f.name], ["Department", f.department]]));

    const row = h("div", "btn-row");
    [["entry", "Record ENTRY", ""], ["exit", "Record EXIT", "exit"]].forEach(([action, label, cls]) => {
        const btn = h("button", "btn " + cls, label);
        btn.onclick = async () => {
            row.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            const r = await db.rpc("guard_record_gate", { p_token: token, p_action: action, p_gate: "Main Gate" });
            if (r.error) { console.error(r.error); return showMessage("msg", "Could not record. It may have just been recorded."); }
            showMessage("msg", action.toUpperCase() + " recorded for " + f.name + ".", "success");
            row.remove();
        };
        row.appendChild(btn);
    });
    out.appendChild(row);
};
