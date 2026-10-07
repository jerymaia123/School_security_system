// Student photos: students upload one on My Profile, guards and faculty see it when they scan.
// Photos live in a PRIVATE Supabase bucket; each view uses a short-lived signed link.
const PHOTO_BUCKET = "student-photos";

function noPhotoBox() {
    const d = document.createElement("div");
    d.textContent = "No photo on file";
    d.style.cssText = "width:90px;height:110px;border-radius:8px;background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:600;display:grid;place-items:center;text-align:center;padding:6px;flex:none";
    return d;
}

// Scanner result card: now understands stored photo paths (and still accepts https links).
const baseStudentCard = window.studentCard;
window.studentCard = function (photo, rows) {
    if (photo && /^https:\/\//.test(photo)) return baseStudentCard(photo, rows);
    const card = baseStudentCard(null, rows);
    if (!photo) { card.prepend(noPhotoBox()); return card; }

    const img = document.createElement("img");
    img.alt = "Student photo";
    card.prepend(img);
    db.storage.from(PHOTO_BUCKET).createSignedUrl(photo, 300).then(({ data, error }) => {
        if (error || !data) img.replaceWith(noPhotoBox()); else img.src = data.signedUrl;
    });
    return card;
};

async function resizeToJpeg(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(() => createImageBitmap(file));
    const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.85));
}

async function addPhotoPanel() {
    const { p, b } = panel("My Photo", "Upload a clear photo of your face. Guards and faculty use it to check your identity.");
    b.innerHTML = '<div id="photoPreview" style="margin-bottom:14px"></div><div id="msg" class="message" hidden></div>' +
        '<input type="file" id="photoFile" accept="image/jpeg,image/png,image/webp">' +
        '<button class="btn" id="photoBtn" type="button" style="margin-top:12px">Upload photo</button>';
    view.append(p);

    const { data: s } = await db.from("students").select("photo_url").eq("profile_id", me.id).maybeSingle();
    let current = s && s.photo_url;

    async function showCurrent() {
        const box = $("photoPreview");
        box.textContent = "";
        if (!current) return box.append(h("p", "empty", "No photo uploaded yet."));
        const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrl(current, 300);
        if (!data) return;
        const img = document.createElement("img");
        img.src = data.signedUrl; img.alt = "My photo";
        img.style.cssText = "width:120px;height:150px;object-fit:cover;border-radius:10px";
        box.append(img);
    }
    showCurrent();

    $("photoBtn").onclick = async () => {
        const file = $("photoFile").files[0];
        if (!file) return showMessage("msg", "Choose a photo first.");
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return showMessage("msg", "Please choose a JPG, PNG or WebP image.");

        const btn = $("photoBtn");
        btn.disabled = true; showMessage("msg", "");
        try {
            const blob = await resizeToJpeg(file);
            const { data: { session } } = await db.auth.getSession();
            const path = session.user.id + "/photo-" + Date.now() + ".jpg";

            const up = await db.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
            if (up.error) throw up.error;
            const saved = await db.rpc("set_my_photo", { p_path: path });
            if (saved.error) throw saved.error;

            if (current) await db.storage.from(PHOTO_BUCKET).remove([current]);
            current = path;
            showCurrent();
            $("photoFile").value = "";
            showMessage("msg", "Photo saved.", "success");
        } catch (e) {
            console.error(e);
            showMessage("msg", "Could not upload the photo. Try a different image.");
        }
        btn.disabled = false;
    };
}

// Add the photo box under the profile details, for students only.
const basePageProfile = window.pageProfile;
window.pageProfile = async function () {
    await basePageProfile();
    if (role === "student") await addPhotoPanel();
};
