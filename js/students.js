// Faculty "Students" page (search, activate/deactivate, remove) + enrollment date display.
const fmtLong = (d) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

ICON.students = "♙";
NAVS.teacher.splice(3, 0, ["students", "Students"]);

/* ---------- Students page ---------- */
async function pageStudents() {
    const { p, b } = panel("Students", "Search, activate or deactivate, and remove students.");
    b.innerHTML = '<input id="stSearch" placeholder="Search by name or Student ID" aria-label="Search students">' +
        '<div id="msg" class="message" hidden></div><div id="stList"></div>';
    view.append(p);
    let all = [];

    async function load() {
        const { data, error } = await db.from("students")
            .select("id, student_id, first_name, middle_name, last_name, grade_level, section, enrollment_status, photo_url, created_at")
            .order("last_name").limit(500);
        if (error) {
            console.error(error);
            $("stList").textContent = "";
            return $("stList").append(h("p", "empty", "Students could not be loaded."));
        }
        all = data;
        render();
    }

    function render() {
        const q = $("stSearch").value.trim().toLowerCase();
        const box = $("stList");
        box.textContent = "";
        const list = all.filter((s) => !q || (s.first_name + " " + s.last_name + " " + s.student_id).toLowerCase().includes(q));
        if (!list.length) return box.append(h("p", "empty", all.length ? "No students match your search." : "No students yet."));

        list.forEach((s) => {
            const name = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");
            const active = s.enrollment_status === "active";
            const row = h("div", "ann");
            row.append(
                h("h4", "", name + "  •  " + (active ? "Active" : "Inactive")),
                h("p", "", [s.student_id, s.grade_level, s.section, "Enrolled " + fmtLong(s.created_at)].filter(Boolean).join("  •  "))
            );

            const actions = h("div", "btn-row");
            const toggle = h("button", "btn " + (active ? "exit" : "alt"), active ? "Deactivate" : "Activate");
            toggle.onclick = async () => {
                toggle.disabled = true;
                const { error } = await db.rpc("set_student_status", { p_student_id: s.id, p_status: active ? "inactive" : "active" });
                if (error) { console.error(error); showMessage("msg", "Could not change the status."); toggle.disabled = false; return; }
                showMessage("msg", name + " is now " + (active ? "inactive" : "active") + ".", "success");
                load();
            };
            const remove = h("button", "btn danger", "Remove");
            remove.onclick = async () => {
                const typed = prompt("This permanently deletes " + name + "'s account, profile and photo. They will no longer be able to log in. " +
                    "Gate history is kept. This cannot be undone.\n\nType the Student ID (" + s.student_id + ") to confirm:");
                if (typed === null) return;
                if (typed.trim() !== s.student_id) return showMessage("msg", "The Student ID did not match. Nothing was removed.");
                remove.disabled = true;
                if (s.photo_url) await db.storage.from("student-photos").remove([s.photo_url]);
                const { error } = await db.rpc("remove_student", { p_student_id: s.id });
                if (error) { console.error(error); showMessage("msg", "Could not remove the student."); remove.disabled = false; return; }
                showMessage("msg", name + " was removed.", "success");
                load();
            };
            actions.append(toggle, remove);
            row.append(actions);
            box.append(row);
        });
    }

    $("stSearch").addEventListener("input", render);
    load();
}

// Open the Students page from the menu without changing app.js
const baseShow = window.show;
window.show = async function (page) {
    if (page !== "students" || role !== "teacher") return baseShow(page);
    if (activeScanner) { activeScanner.stop(); activeScanner = null; }
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
    $("pageTitle").textContent = "Students";
    $("sidebar").classList.remove("open");
    view.textContent = "";
    await pageStudents();
};

/* ---------- Enrollment date on scan results ---------- */
async function addEnrolledRow(token, out) {
    const dl = out.querySelector(".student-card dl");
    if (!dl) return;
    const { data, error } = await db.rpc("student_enrolled_on", { p_token: token });
    if (error || !data) return;
    dl.append(h("dt", "", "Enrolled on"), h("dd", "", fmtLong(data)));
}
const baseGuardFlow = window.guardFlow;
window.guardFlow = async function (token, out) { await baseGuardFlow(token, out); await addEnrolledRow(token, out); };
const baseFacultyFlow = window.facultyFlow;
window.facultyFlow = async function (token, out) { await baseFacultyFlow(token, out); await addEnrolledRow(token, out); };

/* ---------- Enrollment date on the student's profile ---------- */
const baseProfilePage = window.pageProfile;
window.pageProfile = async function () {
    await baseProfilePage();
    if (role !== "student") return;
    const { data: s } = await db.from("students").select("created_at").eq("profile_id", me.id).maybeSingle();
    const grid = view.querySelector(".grid2");
    if (!s || !grid) return;
    const f = h("div", "pf");
    f.append(h("label", "", "Enrolled on"), h("strong", "", fmtLong(s.created_at)));
    grid.insertBefore(f, grid.children[2] || null);
};
