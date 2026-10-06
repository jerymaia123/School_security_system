// One shared app: same look for students, guards and faculty. The menu depends on the role.
const ICON = { dashboard: "▦", announcements: "▣", qr: "▤", scan: "▤", profile: "◎" };
const NAVS = {
    student: [["dashboard", "Dashboard"], ["announcements", "Announcements"], ["qr", "Generate QR"], ["profile", "My Profile"]],
    guard:   [["dashboard", "Dashboard"], ["announcements", "Announcements"], ["scan", "Scan QR"], ["profile", "My Profile"]],
    teacher: [["dashboard", "Dashboard"], ["announcements", "Announcements"], ["scan", "Scan QR"], ["profile", "My Profile"]]
};
let me, role, view, activeScanner = null;
const $ = (id) => document.getElementById(id);

function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
}
const fmt = (d) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

async function countOf(table, build) {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (build) q = build(q);
    const { count, error } = await q;
    if (error) { console.error(error); return 0; }
    return count || 0;
}

function stat(icon, cls, label, value) {
    const c = h("div", "stat"), d = h("div");
    d.append(h("span", "", label), h("strong", "", String(value)));
    c.append(h("div", "ico " + cls, icon), d);
    return c;
}

function panel(title, sub, action) {
    const p = h("div", "panel"), hd = h("div", "panel-head"), t = h("div");
    t.append(h("h3", "", title), h("p", "", sub));
    hd.appendChild(t);
    if (action) hd.appendChild(action);
    const b = h("div", "panel-body");
    p.append(hd, b);
    return { p, b };
}

requireRole(["admin", "teacher", "student", "guard"]).then((p) => {
    me = p;
    role = p.role === "admin" ? "teacher" : p.role;
    view = $("view");
    $("avatar").textContent = p.full_name.charAt(0).toUpperCase();
    $("uName").textContent = p.full_name;
    $("uRole").textContent = role === "teacher" ? "Faculty" : role;

    NAVS[role].forEach(([id, label]) => {
        const b = h("button", "nav-item");
        b.dataset.page = id;
        b.append(h("span", "", ICON[id]), document.createTextNode(label));
        b.onclick = () => { if (location.hash === "#" + id) show(id); else location.hash = id; };
        $("nav").appendChild(b);
    });
    window.addEventListener("hashchange", () => show(location.hash.slice(1)));
    show(location.hash.slice(1) || "dashboard");
});

async function show(page) {
    if (!NAVS[role].some((n) => n[0] === page)) page = "dashboard";
    if (activeScanner) { activeScanner.stop(); activeScanner = null; }
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
    $("pageTitle").textContent = NAVS[role].find((n) => n[0] === page)[1];
    $("sidebar").classList.remove("open");
    view.textContent = "";
await ({ dashboard: pageDashboard, announcements: pageAnnouncements, qr: pageQR, scan: pageScan, profile: pageProfile, invite: pageInvite })[page]();}

/* ---------- Announcements helpers ---------- */
async function loadAnns(limit) {
    const { data, error } = await db.from("announcements")
        .select("id, title, content, posted_by, posted_by_name, created_at")
        .eq("status", "published").order("created_at", { ascending: false }).limit(limit);
    if (error) { console.error(error); return null; }
    return data;
}
function annItem(a, onDelete) {
    const d = h("div", "ann"), m = h("div", "meta");
    m.append(h("span", "", (a.posted_by_name || "Faculty") + " • " + fmt(a.created_at)));
    if (onDelete && a.posted_by === me.id) {
        const b = h("button", "btn danger", "Delete");
        b.onclick = () => onDelete(a.id);
        m.append(b);
    }
    d.append(h("h4", "", a.title), h("p", "", a.content), m);
    return d;
}
function fillAnns(box, list, onDelete) {
    box.textContent = "";
    if (!list) return box.append(h("p", "empty", "Announcements could not be loaded."));
    if (!list.length) return box.append(h("p", "empty", "No announcements yet."));
    list.forEach((a) => box.append(annItem(a, onDelete)));
}

/* ---------- Dashboard ---------- */
async function pageDashboard() {
    const w = h("div", "welcome"), l = h("div"), d = h("div", "date");
    l.append(h("h2", "", "Welcome, " + me.full_name.split(" ")[0] + "!"), h("p", "", "Here's what's happening today."));
    d.append(h("span", "", "Today"), h("strong", "", new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })));
    w.append(l, d);
    const stats = h("div", "stats");
    view.append(w, stats);

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const logs = (f) => countOf("gate_access_logs", (q) => f(q.gte("scanned_at", start.toISOString())));

    if (role === "student") {
        const { data: s } = await db.from("students").select("student_id, grade_level, section, enrollment_status").eq("profile_id", me.id).maybeSingle();
        const st = s || {};
        stats.append(stat("♙", "", "Student ID", st.student_id || "-"),
            stat("✓", st.enrollment_status === "active" ? "green" : "red", "Enrollment", st.enrollment_status || "-"),
            stat("▣", "orange", "Year level", st.grade_level || "-"), stat("◎", "", "Section", st.section || "-"));
    } else {
        const [en, ex] = await Promise.all([
            logs((q) => q.eq("action", "entry").eq("access_status", "granted")),
            logs((q) => q.eq("action", "exit").eq("access_status", "granted"))
        ]);
        if (role === "teacher") {
            const [tot, act] = await Promise.all([countOf("students"), countOf("students", (q) => q.eq("enrollment_status", "active"))]);
            stats.append(stat("♙", "", "Total Students", tot), stat("✓", "green", "Active Students", act),
                stat("→", "", "Today's Entries", en), stat("←", "orange", "Today's Exits", ex));
        } else {
            const den = await logs((q) => q.eq("access_status", "denied"));
            stats.append(stat("→", "", "My Entries Today", en), stat("←", "orange", "My Exits Today", ex),
                stat("✕", "red", "Denied Today", den), stat("▣", "green", "Announcements", await countOf("announcements")));
        }
    }

    const more = h("button", "link-btn", "View All");
    more.onclick = () => { location.hash = "announcements"; };
    const { p, b } = panel("Latest Announcements", "Recent school updates", more);
    view.append(p);
    fillAnns(b, await loadAnns(4));
}

/* ---------- Announcements ---------- */
async function pageAnnouncements() {
    const del = async (id) => {
        if (!confirm("Delete this announcement?")) return;
        const { error } = await db.from("announcements").delete().eq("id", id);
        if (error) { console.error(error); alert("Could not delete the announcement."); }
        refresh();
    };
    const refresh = async () => fillAnns(listBox, await loadAnns(50), role === "teacher" ? del : null);

    if (role === "teacher") {
        const { p, b } = panel("Post an announcement", "Visible to students, faculty and guards");
        const f = h("form");
        f.innerHTML = '<label for="aTitle">Title</label><input id="aTitle" maxlength="150" required>' +
            '<label for="aBody">Message</label><textarea id="aBody" rows="4" required></textarea>' +
            '<div id="msg" class="message" hidden></div><button class="btn" type="submit">Post announcement</button>';
        b.append(f); view.append(p);
        f.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await db.from("announcements").insert({ title: $("aTitle").value.trim(), content: $("aBody").value.trim() });
            if (error) { console.error(error); return showMessage("msg", "Could not post the announcement."); }
            f.reset(); showMessage("msg", "Announcement posted.", "success"); refresh();
        };
    }
    const { p, b } = panel("Announcements", "School updates");
    const listBox = b;
    view.append(p);
    refresh();
}

/* ---------- Student: generate QR ---------- */
function pageQR() {
    const { p, b } = panel("My QR Code", "Show this QR code to the guard at the gate.");
    view.append(p);
    b.innerHTML = '<div id="msg" class="message" hidden></div><button class="btn" id="gen">Generate my QR code</button>' +
        '<div id="qrWrap" hidden><div class="qr-box"><div id="qr"></div></div><p class="token" id="tok"></p>' +
        '<div class="btn-row"><button class="btn alt" id="dl">Download QR code</button></div></div>';
    $("gen").onclick = async () => {
        const { data, error } = await db.from("students").select("qr_token, student_id, enrollment_status").eq("profile_id", me.id).maybeSingle();
        if (error || !data) { console.error(error); return showMessage("msg", "Could not load your QR code."); }
        if (data.enrollment_status !== "active") showMessage("msg", "Your enrollment is not active, so the gate will deny this QR code.");
        renderQR("qr", data.qr_token);
        $("tok").textContent = data.student_id + "  •  " + data.qr_token;
        $("qrWrap").hidden = false; $("gen").hidden = true;
    };
    $("dl").onclick = () => {
        const a = document.createElement("a");
        a.href = document.querySelector("#qr canvas").toDataURL("image/png");
        a.download = "my-school-qr.png"; a.click();
    };
}

/* ---------- Guard / Faculty: scan QR ---------- */
function pageScan() {
    const guard = role === "guard";
    const { p, b } = panel(guard ? "Scan Student QR" : "Look Up Student",
        guard ? "Scan a student's QR code, then record entry or exit." : "Scan a QR code to view student information. This does not record gate access.");
    view.append(p);
    b.innerHTML = '<div id="msg" class="message" hidden></div><button class="btn" id="startBtn">Start camera scanner</button>' +
        '<div id="reader" hidden></div><form id="manualForm"><label for="manualToken">Or type the QR code</label>' +
        '<input id="manualToken" autocomplete="off" placeholder="e.g. STU-8F92K3A71X"><button class="btn alt" type="submit">Look up</button></form><div id="result"></div>';
    const out = $("result");
    activeScanner = setupScanner(async (token) => {
        $("reader").hidden = true; out.textContent = "";
        if (guard) await guardFlow(token, out); else await facultyFlow(token, out);
    });
}

async function guardFlow(token, out) {
    const { data, error } = await db.rpc("guard_verify_qr", { p_token: token });
    if (error) { console.error(error); return showMessage("msg", "Could not check the QR code. Try again."); }
    if (data.status === "denied") return out.append(banner("ACCESS DENIED", "denied", data.reason));

    const s = data.student;
    out.append(banner("ACCESS GRANTED", "granted"),
        studentCard(s.photo_url, [["Student ID", s.student_id], ["Name", s.name], ["Year level", s.grade_level], ["Section", s.section]]));
    const row = h("div", "btn-row");
    [["entry", "Record ENTRY", ""], ["exit", "Record EXIT", "exit"]].forEach(([action, label, cls]) => {
        const btn = h("button", "btn " + cls, label);
        btn.onclick = async () => {
            row.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            const r = await db.rpc("guard_record_gate", { p_token: token, p_action: action, p_gate: "Main Gate" });
            if (r.error) { console.error(r.error); return showMessage("msg", "Could not record. It may have just been recorded."); }
            showMessage("msg", action.toUpperCase() + " recorded for " + s.name + ".", "success");
            row.remove();
        };
        row.appendChild(btn);
    });
    out.appendChild(row);
}

async function facultyFlow(token, out) {
    const { data, error } = await db.rpc("faculty_lookup_qr", { p_token: token });
    if (error) { console.error(error); return showMessage("msg", "Could not look up the QR code. Try again."); }
    if (!data.found) return out.append(banner("NOT FOUND", "denied", "This QR code does not match any student."));
    const s = data.student, ok = s.enrollment_status === "active";
    out.append(banner(ok ? "ACTIVE STUDENT" : "INACTIVE STUDENT", ok ? "granted" : "denied"),
        studentCard(s.photo_url, [["Student ID", s.student_id], ["Name", s.name], ["Year level", s.grade_level], ["Section", s.section],
            ["Email", s.email], ["Contact", s.contact_number], ["Birth date", s.birth_date], ["Gender", s.gender], ["Address", s.address]]));
}

/* ---------- Profile ---------- */
async function pageProfile() {
    const roleLabel = role === "teacher" ? "Faculty" : role;
    let extra = [];
    if (role === "student") {
        const { data: s } = await db.from("students")
            .select("student_id, first_name, middle_name, last_name, birth_date, gender, grade_level, section, contact_number, address, enrollment_status")
            .eq("profile_id", me.id).maybeSingle();
        if (s) extra = [["Student ID", s.student_id], ["Enrollment status", s.enrollment_status],
            ["Full name", [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ")], ["Birth date", s.birth_date],
            ["Gender", s.gender], ["Year level", s.grade_level], ["Section", s.section], ["Contact number", s.contact_number], ["Address", s.address]];
    } else {
        const { data: pr } = await db.from("profiles").select("employee_id").eq("id", me.id).maybeSingle();
        extra.push(["Employee ID", pr && pr.employee_id]);
        if (role === "teacher") {
            const { data: t } = await db.from("teachers").select("department, contact_number").eq("profile_id", me.id).maybeSingle();
            if (t) extra.push(["Department", t.department], ["Contact number", t.contact_number]);
        }
    }
    const box = h("div", "panel"), body = h("div", "panel-body"), head = h("div", "profile-head"), nm = h("div");
    nm.append(h("h2", "", me.full_name), h("p", "empty", roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)));
    head.append(h("div", "avatar", me.full_name.charAt(0).toUpperCase()), nm);
    const g = h("div", "grid2");
    [...extra, ["Username", me.username], ["Email", me.email], ["Role", roleLabel]].forEach(([k, v]) => {
        const f = h("div", "pf");
        f.append(h("label", "", k), h("strong", "", v || "-"));
        g.append(f);
    });
    body.append(head, g, h("p", "empty", "To change official information, please contact the school."));
    box.append(body);
    view.append(box);
}
