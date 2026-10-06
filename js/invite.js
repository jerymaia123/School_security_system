// Faculty page: generate a registration number for a student ID.
ICON.invite = "＋";
NAVS.teacher.splice(2, 0, ["invite", "Student Registration"]);

async function pageInvite() {
    const { p, b } = panel("Generate a registration number",
        "Enter the student's ID, then give the number to the student so they can register.");
    const f = h("form");
    f.innerHTML = '<label for="invId">Student ID</label>' +
        '<input id="invId" maxlength="40" required autocomplete="off" placeholder="e.g. 240111004440">' +
        '<div id="msg" class="message" hidden></div>' +
        '<button class="btn" type="submit">Generate registration number</button><div id="invResult"></div>';
    b.append(f);
    view.append(p);

    const { p: lp, b: lb } = panel("Registration numbers", "Each number works once and expires after 7 days.");
    view.append(lp);

    async function refresh() {
        lb.textContent = "";
        const { data, error } = await db.from("student_invites")
            .select("student_id, code, created_at, expires_at, used_at")
            .order("created_at", { ascending: false }).limit(50);
        if (error) { console.error(error); return lb.append(h("p", "empty", "Could not load the list.")); }
        if (!data.length) return lb.append(h("p", "empty", "No registration numbers yet."));
        data.forEach((i) => {
            const status = i.used_at ? "Used" : (new Date(i.expires_at) < new Date() ? "Expired" : "Pending");
            const row = h("div", "ann");
            row.append(h("h4", "", i.student_id + "  •  " + status),
                       h("p", "", status === "Pending" ? "Registration number: " + i.code : "Created " + fmt(i.created_at)));
            lb.append(row);
        });
    }

    f.onsubmit = async (e) => {
        e.preventDefault();
        const sid = $("invId").value.trim();
        const { data, error } = await db.rpc("create_student_invite", { p_student_id: sid });
        if (error) {
            console.error(error);
            return showMessage("msg", /already registered/i.test(error.message)
                ? "That student is already registered." : "Could not generate a number. Check the Student ID (letters, numbers, dashes).");
        }
        showMessage("msg", "");
        const res = $("invResult");
        res.textContent = "";
        const box = h("div", "banner granted", data);
        box.append(h("small", "", "Give this number to student " + sid + ". Valid for 7 days, works once."));
        const copy = h("button", "btn alt", "Copy number");
        copy.type = "button";
        copy.onclick = () => navigator.clipboard.writeText(data).then(() => { copy.textContent = "Copied!"; });
        res.append(box, copy);
        f.reset();
        refresh();
    };
    refresh();
}
