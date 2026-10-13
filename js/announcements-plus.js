// Announcements: faculty can edit, and attach a link and a picture.
const ANN_BUCKET = "announcement-images";
const annImgUrl = (path) => db.storage.from(ANN_BUCKET).getPublicUrl(path).data.publicUrl;

const annStyle = document.createElement("style");
annStyle.textContent =
    ".ann-img{display:block;max-width:100%;max-height:260px;object-fit:cover;border-radius:10px;margin:10px 0}" +
    ".ann-link{display:inline-block;margin-top:8px;padding:6px 12px;border-radius:10px;background:#F3EEFF;color:#6D57BF;" +
    "font-size:12px;font-weight:700;text-decoration:none}.ann-link:hover{background:#E8DFFF}";
document.head.appendChild(annStyle);

async function resizeImage(file, max) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.85));
}

// Now also loads the link, picture and edit time
window.loadAnns = async function (limit) {
    const { data, error } = await db.from("announcements")
        .select("id, title, content, posted_by, posted_by_name, created_at, updated_at, link_url, image_path")
        .eq("status", "published").order("created_at", { ascending: false }).limit(limit);
    if (error) { console.error(error); return null; }
    return data;
};

// One announcement. `actions` ({edit, del}) is only given on the Announcements page.
window.annItem = function (a, actions) {
    const acts = actions && typeof actions === "object" ? actions : null;
    const d = h("div", "ann"), m = h("div", "meta");
    const edited = a.updated_at && new Date(a.updated_at) - new Date(a.created_at) > 2000;
    m.append(h("span", "", (a.posted_by_name || "Faculty") + " • " + fmt(a.created_at) + (edited ? " • edited" : "")));
    d.append(h("h4", "", a.title), h("p", "", a.content));

    if (a.image_path) {
        const img = h("img", "ann-img");
        img.src = annImgUrl(a.image_path); img.alt = "Announcement picture"; img.loading = "lazy";
        d.append(img);
    }
    if (a.link_url && /^https?:\/\/\S+$/i.test(a.link_url)) {
        const l = h("a", "ann-link", "Open link ↗");
        l.href = a.link_url; l.target = "_blank"; l.rel = "noopener noreferrer";
        d.append(l);
    }
    if (acts && a.posted_by === me.id) {
        const box = h("div", "btn-row");
        box.style.marginTop = "0";
        const e = h("button", "btn alt", "Edit"); e.onclick = () => acts.edit(a);
        const x = h("button", "btn danger", "Delete"); x.onclick = () => acts.del(a);
        box.append(e, x);
        m.append(box);
    }
    d.append(m);
    return d;
};

window.pageAnnouncements = async function () {
    const canPost = role === "teacher";
    let editing = null, listBox, f;

    const refresh = async () => fillAnns(listBox, await loadAnns(50), canPost ? { edit, del } : null);

    function showCurrent(a) {
        const box = $("aCurrent");
        box.textContent = "";
        if (!a || !a.image_path) return;
        const img = h("img", "ann-img");
        img.src = annImgUrl(a.image_path); img.alt = "Current picture"; img.style.maxWidth = "180px";
        const lab = h("label"), cb = document.createElement("input");
        cb.type = "checkbox"; cb.id = "aRemoveImg"; cb.style.cssText = "width:auto;margin-right:8px";
        lab.append(cb, document.createTextNode("Remove this picture"));
        box.append(img, lab);
    }
    function resetForm() {
        editing = null; f.reset(); $("aCurrent").textContent = "";
        $("aSave").textContent = "Post announcement"; $("aCancel").hidden = true;
    }
    function edit(a) {
        editing = a;
        $("aTitle").value = a.title; $("aBody").value = a.content; $("aLink").value = a.link_url || "";
        $("aImage").value = ""; showCurrent(a); showMessage("msg", "");
        $("aSave").textContent = "Save changes"; $("aCancel").hidden = false;
        f.scrollIntoView({ behavior: "smooth" }); $("aTitle").focus();
    }
    async function del(a) {
        if (!confirm("Delete this announcement?")) return;
        const { error } = await db.from("announcements").delete().eq("id", a.id);
        if (error) { console.error(error); alert("Could not delete the announcement."); return; }
        if (a.image_path) await db.storage.from(ANN_BUCKET).remove([a.image_path]);
        if (editing && editing.id === a.id) resetForm();
        refresh();
    }

    if (canPost) {
        const { p, b } = panel("Post an announcement", "Visible to students, faculty and guards. Add a link or picture if you like.");
        f = h("form");
        f.innerHTML = '<label for="aTitle">Title</label><input id="aTitle" maxlength="150" required>' +
            '<label for="aBody">Message</label><textarea id="aBody" rows="4" required></textarea>' +
            '<label for="aLink">Link (optional)</label><input id="aLink" type="url" maxlength="500" placeholder="https://example.com">' +
            '<label for="aImage">Picture (optional)</label><input id="aImage" type="file" accept="image/jpeg,image/png,image/webp">' +
            '<div id="aCurrent"></div><div id="msg" class="message" hidden></div>' +
            '<div class="btn-row"><button class="btn" id="aSave" type="submit">Post announcement</button>' +
            '<button class="btn alt" id="aCancel" type="button" hidden>Cancel editing</button></div>';
        b.append(f);
        view.append(p);
        $("aCancel").onclick = () => { resetForm(); showMessage("msg", ""); };

        f.onsubmit = async (e) => {
            e.preventDefault();
            const title = $("aTitle").value.trim(), content = $("aBody").value.trim(), link = $("aLink").value.trim();
            if (link && !/^https?:\/\/\S+$/i.test(link)) return showMessage("msg", "The link must start with http:// or https://");
            const file = $("aImage").files[0];
            if (file && !/^image\/(jpeg|png|webp)$/.test(file.type)) return showMessage("msg", "Please choose a JPG, PNG or WebP picture.");

            const btn = $("aSave");
            btn.disabled = true; showMessage("msg", "");
            try {
                const oldPath = editing ? editing.image_path : null;
                let imagePath = oldPath;
                if ($("aRemoveImg") && $("aRemoveImg").checked) imagePath = null;
                if (file) {
                    const blob = await resizeImage(file, 1200);
                    const path = me.id + "/" + crypto.randomUUID() + ".jpg";
                    const up = await db.storage.from(ANN_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
                    if (up.error) throw up.error;
                    imagePath = path;
                }
                const row = { title, content, link_url: link || null, image_path: imagePath };
                const res = editing
                    ? await db.from("announcements").update(row).eq("id", editing.id)
                    : await db.from("announcements").insert(row);
                if (res.error) throw res.error;
                if (editing && oldPath && oldPath !== imagePath) await db.storage.from(ANN_BUCKET).remove([oldPath]);

                const wasEditing = !!editing;
                resetForm();
                showMessage("msg", wasEditing ? "Announcement updated." : "Announcement posted.", "success");
                refresh();
            } catch (err) {
                console.error(err);
                showMessage("msg", "Could not save the announcement. Please try again.");
            }
            btn.disabled = false;
        };
    }

    const { p, b } = panel("Announcements", "School updates");
    listBox = b;
    view.append(p);
    refresh();
};
