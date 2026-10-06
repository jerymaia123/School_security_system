// Announcements: everyone logged in can read, faculty can post and delete their own.
// (The database enforces this too, not just the buttons.)

async function loadAnnouncements(containerId, myProfileId = null) {
    const box = document.getElementById(containerId);
    box.textContent = "";

    const { data, error } = await db
        .from("announcements")
        .select("id, title, content, posted_by, posted_by_name, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        box.innerHTML = '<p class="empty">Announcements could not be loaded.</p>';
        return;
    }
    if (data.length === 0) {
        box.innerHTML = '<p class="empty">No announcements yet.</p>';
        return;
    }

    data.forEach((a) => {
        const card = document.createElement("div");
        card.className = "announcement";

        const h = document.createElement("h3");
        h.textContent = a.title;

        const p = document.createElement("p");
        p.textContent = a.content;

        const meta = document.createElement("div");
        meta.className = "meta";
        const who = document.createElement("span");
        who.textContent = "Posted by " + (a.posted_by_name || "Faculty") + " • " +
            new Date(a.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
        meta.appendChild(who);

        if (myProfileId !== null && a.posted_by === myProfileId) {
            const del = document.createElement("button");
            del.className = "del";
            del.textContent = "Delete";
            del.onclick = async () => {
                if (!confirm("Delete this announcement?")) return;
                const { error: delError } = await db.from("announcements").delete().eq("id", a.id);
                if (delError) { console.error(delError); alert("Could not delete the announcement."); return; }
                loadAnnouncements(containerId, myProfileId);
            };
            meta.appendChild(del);
        }

        card.append(h, p, meta);
        box.appendChild(card);
    });
}

async function postAnnouncement(title, content) {
    // posted_by and the author's name are filled in by the database, so they can't be faked.
    const { error } = await db.from("announcements").insert({ title, content });
    if (error) {
        console.error(error);
        return { error: "Could not post the announcement. Please try again." };
    }
    return { ok: true };
}
