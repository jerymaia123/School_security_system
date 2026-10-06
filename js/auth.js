// Shared login / register / role-protection code.
const ROOT = document.body.dataset.root || "";

const HOME = { admin: "app.html", teacher: "app.html", student: "app.html", guard: "app.html" };

function showMessage(id, text, type = "error") {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "message " + type;
    el.hidden = !text;
}

async function getMyProfile() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return null;
    const { data, error } = await db.from("profiles")
        .select("id, role, full_name, email, username, status")
        .eq("auth_user_id", session.user.id).maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
}

async function loginUser(identifier, password) {
    let email = identifier.trim();
    if (!email.includes("@")) {
        const { data } = await db.rpc("get_login_email", { p_username: email });
        if (!data) return { error: "Invalid username or password." };
        email = data;
    }
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { error: "Invalid username or password." };

    const profile = await getMyProfile();
    if (!profile) {
        await db.auth.signOut();
        return { error: "Account profile not found. Please contact the school." };
    }
    if (profile.status !== "active") {
        await db.auth.signOut();
        return { error: "This account is inactive. Please contact the school." };
    }
    return { redirect: ROOT + HOME[profile.role] };
}

// Registers, and logs the person straight in.
async function registerUser(f) {
    const { data, error } = await db.auth.signUp({
        email: f.email,
        password: f.password,
        options: {
            data: {
                requested_role: f.role,          // the database re-checks everything below
                staff_code: f.staff_code,
                reg_code: f.reg_code,            // student registration number from faculty
                username: f.username,
                full_name: (f.first_name + " " + f.last_name).trim(),
                first_name: f.first_name,
                last_name: f.last_name,
                student_id: f.student_id,
                gender: f.gender,
                birth_date: f.birth_date,
                grade_level: f.grade_level,
                section: f.section,
                contact_number: f.contact_number,
                address: f.address,
                teacher_id: f.teacher_id,
                department: f.department
            }
        }
    });

    if (error) {
        console.error(error);
        if (/already registered/i.test(error.message)) {
            return { error: "That email is already registered. Try logging in." };
        }
        return { error: "Registration failed. Check your registration number (students) or staff code (faculty/guard), and make sure the username and ID are not already used." };
    }
    if (!data.session) {
        return { notice: "Registered! Check your email to confirm your account, then log in." };
    }
    const profile = await getMyProfile();
    if (!profile || profile.status !== "active") {
        await db.auth.signOut();
        return { error: "Your account was created but could not be opened. Please try logging in." };
    }
    return { redirect: ROOT + HOME[profile.role] };
}

async function requireRole(allowedRoles) {
    const profile = await getMyProfile();
    if (!profile || profile.status !== "active") {
        await db.auth.signOut();
        location.replace(ROOT + "login.html");
        return new Promise(() => {});
    }
    if (!allowedRoles.includes(profile.role)) {
        location.replace(ROOT + HOME[profile.role]);
        return new Promise(() => {});
    }
    document.body.classList.remove("protected");
    return profile;
}

async function logout() {
    await db.auth.signOut();
    location.replace(ROOT + "login.html");
}
