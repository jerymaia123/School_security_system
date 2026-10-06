/* =====================================================
   api-client.js
   Load this AFTER script.js. It switches the frontend
   from demo data to the real PHP/MySQL API.
   (In script.js set: API_BASE_URL = "api"; DEMO_MODE = false;)
===================================================== */

let dashboardStats = { total: 0, active: 0, entries: 0, exits: 0 };

const SESSION_KEY = "schoolSecurityUser";


/* ---------- API request (cookies, errors, auto-refresh) ---------- */

window.apiRequest = async function (endpoint, options = {}) {

    const response = await fetch(API_BASE_URL + endpoint, {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};
    try { data = await response.json(); } catch (e) { /* empty body */ }

    if (response.status === 401) {
        showLoginScreen();
        showToast(data.message || "Session expired. Please log in again.");
        throw new Error(data.message || "Not logged in.");
    }

    if (!response.ok) {
        showToast(data.message || "Request failed.");
        throw new Error(data.message || "Request failed.");
    }

    const method = (options.method || "GET").toUpperCase();

    if (method !== "GET") {

        if (data.temp_password) {
            alert(
                "Student account created.\n\n" +
                "Username: " + data.username + "\n" +
                "Temporary password: " + data.temp_password + "\n\n" +
                "Give this to the student now. It will not be shown again."
            );
        }

        await refreshData();   // keep screens in sync after any change
    }

    return data;
};


/* ---------- Load everything the current role may see ---------- */

async function refreshData() {

    if (!currentUser) { return; }

    const jobs = [
        apiRequest("/students/list.php"),
        apiRequest("/announcements/list.php"),
        apiRequest("/stats.php")
    ];

    if (currentUser.role === "guard") {
        jobs.push(apiRequest("/gate-logs/list.php"));
    }

    const [s, a, st, g] = await Promise.all(jobs);

    students      = s.students;
    announcements = a.announcements;
    dashboardStats = st;
    gateLogs      = g ? g.logs : [];
}


window.updateStatistics = function () {
    document.getElementById("totalStudents").textContent  = dashboardStats.total;
    document.getElementById("activeStudents").textContent = dashboardStats.active;
    document.getElementById("todayEntries").textContent   = dashboardStats.entries;
    document.getElementById("todayExits").textContent     = dashboardStats.exits;
};


/* ---------- Names come from the server now ---------- */

window.getUsernameById = function (id) {

    const log = gateLogs.find(l => Number(l.guard_id) === Number(id) && l.guard_name);
    if (log) { return log.guard_name; }

    const ann = announcements.find(a => Number(a.posted_by) === Number(id) && a.posted_by_name);
    if (ann) { return ann.posted_by_name; }

    if (currentUser && Number(currentUser.id) === Number(id)) {
        return currentUser.username;
    }

    return "User #" + id;
};


/* ---------- Login screen / session ---------- */

function showLoginScreen() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
}

window.showApplication = async function () {

    try {
        await refreshData();
    } catch (error) {
        console.error(error);
        showLoginScreen();
        return;
    }

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    // reset anything a previous login may have hidden
    ["studentsNav", "gateLogsNav", "recentLogsPanel",
     "addStudentButton", "addAnnouncementButton"].forEach(id =>
        document.getElementById(id).classList.remove("hidden")
    );
    document.querySelector(".stats-grid").classList.remove("hidden");

    updateUserInterface();

    const role = currentUser.role;

    if (role !== "faculty") {
        document.getElementById("addAnnouncementButton").classList.add("hidden");
        document.getElementById("addStudentButton").classList.add("hidden");
    }
    if (role !== "guard") {
        document.getElementById("recentLogsPanel").classList.add("hidden");
    }
    if (role === "student") {
        document.querySelector(".stats-grid").classList.add("hidden");
    }

    showPage("dashboard");
};

window.checkExistingLogin = async function () {

    try {
        const response = await fetch(API_BASE_URL + "/me.php", { credentials: "same-origin" });
        if (!response.ok) { throw new Error("no session"); }

        const data = await response.json();
        currentUser = data.user;
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));

        await showApplication();

    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
    }
};

const originalLogout = window.logout;

window.logout = async function () {
    try {
        await fetch(API_BASE_URL + "/logout.php", { method: "POST", credentials: "same-origin" });
    } catch (e) { /* ignore */ }

    students = [];
    announcements = [];
    gateLogs = [];

    originalLogout();
};
