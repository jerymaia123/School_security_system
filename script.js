/* =====================================================
   SCHOOL SECURITY SYSTEM
   Frontend JavaScript
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

/*
    When your PHP/Java/Spring Boot backend is ready,
    change this URL.

    Example PHP:
    const API_BASE_URL = "http://localhost/school-security/api";

    Example Spring Boot:
    const API_BASE_URL = "http://localhost:8080/api";
*/

const API_BASE_URL = "http://localhost/school-security/api";


/*
    DEMO MODE

    true  = frontend works without backend
    false = frontend uses API

    Change this to false when your backend is ready.
*/
const DEMO_MODE = true;


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentUser = null;

let students = [];

let announcements = [];

let gateLogs = [];


/* =====================================================
   DEMO DATA
===================================================== */

const demoUsers = [

    {
        id: 1,
        username: "student",
        password: "1234",
        role: "student",
        status: "active"
    },

    {
        id: 2,
        username: "faculty",
        password: "1234",
        role: "faculty",
        status: "active"
    },

    {
        id: 3,
        username: "guard",
        password: "1234",
        role: "guard",
        status: "active"
    }

];


students = [

    {
        id: 1,
        user_id: 1,
        student_id: "STU-2026-001",

        first_name: "Juan",
        middle_name: "Dela",
        last_name: "Cruz",

        birth_date: "2008-05-10",

        gender: "Male",

        year_level: "Year Level",

        section: "STEM A",

        contact_number: "09123456789",

        email: "juan@example.com",

        address: "Batangas, Philippines",

        photo: "",

        enrollment_status: "active",

        qr_token: "QR-STU-2026-001",

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()
    },


    {
        id: 2,
        user_id: 4,
        student_id: "STU-2026-002",

        first_name: "Maria",
        middle_name: "Santos",
        last_name: "Reyes",

        birth_date: "2008-08-20",

        gender: "Female",

        year_level: "Year Level",

        section: "STEM B",

        contact_number: "09987654321",

        email: "maria@example.com",

        address: "Batangas, Philippines",

        photo: "",

        enrollment_status: "active",

        qr_token: "QR-STU-2026-002",

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()
    },


    {
        id: 3,
        user_id: 5,
        student_id: "STU-2026-003",

        first_name: "Mark",
        middle_name: "",
        last_name: "Garcia",

        birth_date: "2009-01-15",

        gender: "Male",

        year_level: "Year Level",

        section: "ICT A",

        contact_number: "09112223344",

        email: "mark@example.com",

        address: "Batangas, Philippines",

        photo: "",

        enrollment_status: "inactive",

        qr_token: "QR-STU-2026-003",

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()
    }

];


announcements = [

    {
        id: 1,

        title: "School Security Reminder",

        content:
            "All students are reminded to present their student QR ID when entering or leaving the school premises.",

        posted_by: 2,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()
    },


    {
        id: 2,

        title: "Important School Announcement",

        content:
            "Please check your class schedule and make sure your student information is updated.",

        posted_by: 2,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()
    }

];


gateLogs = [

    {
        id: 1,

        student_id: 1,

        guard_id: 3,

        action: "entry",

        gate: "Main Gate",

        status: "allowed",

        scanned_at: new Date().toISOString()
    },

    {
        id: 2,

        student_id: 2,

        guard_id: 3,

        action: "entry",

        gate: "Main Gate",

        status: "allowed",

        scanned_at: new Date(
            Date.now() - 3600000
        ).toISOString()
    }

];


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initialize();

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

function initialize() {

    setupLoginForm();

    setupPasswordToggle();

    setupStudentForm();

    setupAnnouncementForm();

    updateDate();

    checkExistingLogin();

}


/* =====================================================
   LOGIN
===================================================== */

function setupLoginForm() {

    const form =
        document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const username =
                document.getElementById("username").value.trim();

            const password =
                document.getElementById("password").value;

            await login(
                username,
                password
            );

        }
    );

}


async function login(username, password) {

    const message =
        document.getElementById("loginMessage");

    message.textContent = "";

    if (!username || !password) {

        message.textContent =
            "Please enter username and password.";

        return;
    }


    try {

        let user;


        /* =========================
           DEMO LOGIN
        ========================= */

        if (DEMO_MODE) {

            user = demoUsers.find(
                function (item) {

                    return (
                        item.username === username &&
                        item.password === password
                    );

                }
            );


            if (!user) {

                message.textContent =
                    "Invalid username or password.";

                return;
            }


        }


        /* =========================
           API LOGIN
        ========================= */

        else {

            const response =
                await fetch(
                    `${API_BASE_URL}/login.php`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username,
                            password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }

            user = data.user;

        }


        if (user.status !== "active") {

            message.textContent =
                "This account is inactive.";

            return;
        }


        currentUser = user;


        localStorage.setItem(
            "schoolSecurityUser",
            JSON.stringify(user)
        );


        showApplication();

    }

    catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            "Unable to login.";

    }

}


/* =====================================================
   DEMO LOGIN BUTTONS
===================================================== */

function demoLogin(role) {

    const user =
        demoUsers.find(
            item => item.role === role
        );

    if (!user) {
        return;
    }

    document.getElementById("username").value =
        user.username;

    document.getElementById("password").value =
        user.password;

    login(
        user.username,
        user.password
    );

}


/* =====================================================
   CHECK EXISTING LOGIN
===================================================== */

function checkExistingLogin() {

    const savedUser =
        localStorage.getItem(
            "schoolSecurityUser"
        );

    if (!savedUser) {
        return;
    }


    try {

        currentUser =
            JSON.parse(savedUser);

        showApplication();

    }

    catch (error) {

        localStorage.removeItem(
            "schoolSecurityUser"
        );

    }

}


/* =====================================================
   SHOW APPLICATION
===================================================== */

function showApplication() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");


    document
        .getElementById("app")
        .classList.remove("hidden");


    updateUserInterface();

    loadDashboard();

}


/* =====================================================
   UPDATE USER INTERFACE
===================================================== */

function updateUserInterface() {

    if (!currentUser) {
        return;
    }


    const username =
        currentUser.username || "User";


    document.getElementById(
        "headerUsername"
    ).textContent = username;


    document.getElementById(
        "headerRole"
    ).textContent =
        currentUser.role;


    document.getElementById(
        "welcomeUsername"
    ).textContent =
        username;


    document.getElementById(
        "userAvatar"
    ).textContent =
        username
            .charAt(0)
            .toUpperCase();


    /*
        STUDENT

        Student should only see:

        - Dashboard
        - Announcements
        - My Profile

        They should NOT manage all students
        or gate logs.
    */

    if (
        currentUser.role === "student"
    ) {

        document
            .getElementById("studentsNav")
            .classList.add("hidden");


        document
            .getElementById("gateLogsNav")
            .classList.add("hidden");


        document
            .getElementById("recentLogsPanel")
            .classList.add("hidden");

    }


    /*
        FACULTY

        Faculty can manage students
        and announcements.
    */

    if (
        currentUser.role === "faculty"
    ) {

        document
            .getElementById("studentsNav")
            .classList.remove("hidden");


        document
            .getElementById("gateLogsNav")
            .classList.add("hidden");

    }


    /*
        GUARD

        Guard can see students
        and gate logs.
    */

    if (
        currentUser.role === "guard"
    ) {

        document
            .getElementById("studentsNav")
            .classList.remove("hidden");


        document
            .getElementById("gateLogsNav")
            .classList.remove("hidden");


        document
            .getElementById("addStudentButton")
            .classList.add("hidden");

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    currentUser = null;

    localStorage.removeItem(
        "schoolSecurityUser"
    );


    document
        .getElementById("app")
        .classList.add("hidden");


    document
        .getElementById("loginPage")
        .classList.remove("hidden");


    document.getElementById(
        "username"
    ).value = "";


    document.getElementById(
        "password"
    ).value = "";


    showToast("Logged out successfully.");

}


/* =====================================================
   PASSWORD TOGGLE
===================================================== */

function setupPasswordToggle() {

    const button =
        document.getElementById(
            "togglePassword"
        );

    const password =
        document.getElementById(
            "password"
        );


    button.addEventListener(
        "click",
        function () {

            if (
                password.type === "password"
            ) {

                password.type = "text";

                button.textContent =
                    "Hide";

            }

            else {

                password.type =
                    "password";

                button.textContent =
                    "Show";

            }

        }
    );

}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(pageName) {

    const pages =
        document.querySelectorAll(
            ".page"
        );


    pages.forEach(
        page => page.classList.remove(
            "active-page"
        )
    );


    const selectedPage =
        document.getElementById(
            pageName + "Page"
        );


    if (!selectedPage) {
        return;
    }


    selectedPage.classList.add(
        "active-page"
    );


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            item.classList.remove(
                "active"
            );


            if (
                item.dataset.page ===
                pageName
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );


    const titles = {

        dashboard:
            "Dashboard",

        students:
            "Students",

        announcements:
            "Announcements",

        gateLogs:
            "Gate Logs",

        myProfile:
            "My Profile"

    };


    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[pageName] ||
        "Dashboard";


    if (pageName === "dashboard") {
        loadDashboard();
    }

    if (pageName === "students") {
        loadStudents();
    }

    if (pageName === "announcements") {
        loadAnnouncements();
    }

    if (pageName === "gateLogs") {
        loadGateLogs();
    }

    if (pageName === "myProfile") {
        loadProfile();
    }


    document
        .getElementById("sidebar")
        .classList.remove("open");

}


/* =====================================================
   DASHBOARD
===================================================== */

function loadDashboard() {

    updateDate();

    updateStatistics();

    renderDashboardAnnouncements();

    renderRecentLogs();

}


function updateDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    if (!element) {
        return;
    }


    const date =
        new Date();


    element.textContent =
        date.toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}


function updateStatistics() {

    const total =
        students.length;


    const active =
        students.filter(
            student =>
                student.enrollment_status ===
                "active"
        ).length;


    const today =
        new Date().toDateString();


    const todayLogs =
        gateLogs.filter(
            log =>
                new Date(
                    log.scanned_at
                ).toDateString() === today
        );


    const entries =
        todayLogs.filter(
            log => log.action === "entry"
        ).length;


    const exits =
        todayLogs.filter(
            log => log.action === "exit"
        ).length;


    document.getElementById(
        "totalStudents"
    ).textContent = total;


    document.getElementById(
        "activeStudents"
    ).textContent = active;


    document.getElementById(
        "todayEntries"
    ).textContent = entries;


    document.getElementById(
        "todayExits"
    ).textContent = exits;

}


/* =====================================================
   ANNOUNCEMENTS
===================================================== */

function renderDashboardAnnouncements() {

    const container =
        document.getElementById(
            "dashboardAnnouncements"
        );


    const latest =
        announcements
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )
            .slice(0, 4);


    if (latest.length === 0) {

        container.innerHTML =
            emptyState(
                "No announcements",
                "There are no announcements yet."
            );

        return;
    }


    container.innerHTML =
        latest.map(
            announcement => `

                <div class="announcement-item">

                    <h4>
                        ${escapeHTML(
                            announcement.title
                        )}
                    </h4>

                    <p>
                        ${escapeHTML(
                            truncate(
                                announcement.content,
                                120
                            )
                        )}
                    </p>

                    <div class="announcement-date">
                        ${formatDate(
                            announcement.created_at
                        )}
                    </div>

                </div>

            `
        ).join("");

}


function loadAnnouncements() {

    const container =
        document.getElementById(
            "announcementsList"
        );


    if (announcements.length === 0) {

        container.innerHTML =
            emptyState(
                "No announcements",
                "There are no announcements yet."
            );

        return;
    }


    container.innerHTML =
        announcements
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )
            .map(
                announcement => `

                    <div class="announcement-card">

                        <h3>
                            ${escapeHTML(
                                announcement.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                announcement.content
                            )}
                        </p>

                        <div class="announcement-card-footer">

                            <span>
                                Posted by:
                                ${getUsernameById(
                                    announcement.posted_by
                                )}
                            </span>

                            <span>
                                ${formatDate(
                                    announcement.created_at
                                )}
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   ANNOUNCEMENT MODAL
===================================================== */

function setupAnnouncementForm() {

    const form =
        document.getElementById(
            "announcementForm"
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const title =
                document.getElementById(
                    "announcementTitle"
                ).value.trim();


            const content =
                document.getElementById(
                    "announcementContent"
                ).value.trim();


            if (!title || !content) {
                return;
            }


            if (DEMO_MODE) {

                announcements.unshift({

                    id:
                        Date.now(),

                    title,

                    content,

                    posted_by:
                        currentUser.id,

                    created_at:
                        new Date().toISOString(),

                    updated_at:
                        new Date().toISOString()

                });

            }

            else {

                await apiRequest(
                    "/announcements/create.php",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            title,
                            content
                        })
                    }
                );

            }


            closeAnnouncementModal();

            form.reset();

            loadAnnouncements();

            renderDashboardAnnouncements();

            showToast(
                "Announcement posted successfully."
            );

        }
    );

}


function openAnnouncementModal() {

    document
        .getElementById(
            "announcementModal"
        )
        .classList.remove("hidden");

}


function closeAnnouncementModal() {

    document
        .getElementById(
            "announcementModal"
        )
        .classList.add("hidden");

}


/* =====================================================
   STUDENTS
===================================================== */

function loadStudents() {

    let visibleStudents =
        students;


    /*
        STUDENT:
        Only their own information.
    */

    if (
        currentUser.role === "student"
    ) {

        visibleStudents =
            students.filter(
                student =>
                    student.user_id ===
                    currentUser.id
            );

    }


    renderStudentsTable(
        visibleStudents
    );

}


function renderStudentsTable(data) {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );


    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${emptyState(
                        "No students found",
                        "No student records match your search."
                    )}
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        data.map(
            student => `

                <tr>

                    <td>

                        <div class="student-cell">

                            <div class="student-avatar">
                                ${getInitials(
                                    student
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        fullName(student)
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        student.email ||
                                        "No email"
                                    )}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${escapeHTML(
                            student.student_id
                        )}
                    </td>


                    <td>

                        ${escapeHTML(
                            student.year_level ||
                            "-"
                        )}

                        <br>

                        <small>
                            ${escapeHTML(
                                student.section ||
                                "-"
                            )}
                        </small>

                    </td>


                    <td>
                        ${escapeHTML(
                            student.contact_number ||
                            "-"
                        )}
                    </td>


                    <td>

                        <span class="badge ${
                            student.enrollment_status ===
                            "active"
                                ?
                                "badge-active"
                                :
                                "badge-inactive"
                        }">

                            ${capitalize(
                                student.enrollment_status
                            )}

                        </span>

                    </td>


                    <td>

                        <div class="action-buttons">

                            <button
                                class="action-button"
                                onclick="viewStudentQR(${student.id})"
                            >
                                QR
                            </button>


                            ${
                                currentUser.role ===
                                "faculty"
                                ?

                                `

                                <button
                                    class="action-button"
                                    onclick="editStudent(${student.id})"
                                >
                                    Edit
                                </button>

                                `

                                :

                                ""
                            }

                        </div>

                    </td>

                </tr>

            `
        ).join("");

}


/* =====================================================
   STUDENT SEARCH
===================================================== */

function filterStudents() {

    const search =
        document.getElementById(
            "studentSearch"
        ).value
        .toLowerCase()
        .trim();


    const status =
        document.getElementById(
            "studentStatusFilter"
        ).value;


    let filtered =
        students.filter(
            student => {

                const name =
                    fullName(student)
                        .toLowerCase();


                const matchesSearch =
                    name.includes(search) ||
                    student.student_id
                        .toLowerCase()
                        .includes(search);


                const matchesStatus =
                    status === "all" ||
                    student.enrollment_status ===
                    status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (
        currentUser.role ===
        "student"
    ) {

        filtered =
            filtered.filter(
                student =>
                    student.user_id ===
                    currentUser.id
            );

    }


    renderStudentsTable(
        filtered
    );

}


/* =====================================================
   STUDENT MODAL
===================================================== */

function setupStudentForm() {

    const form =
        document.getElementById(
            "studentForm"
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const editId =
                document.getElementById(
                    "editStudentId"
                ).value;


            const studentData = {

                student_id:
                    document.getElementById(
                        "studentId"
                    ).value.trim(),

                first_name:
                    document.getElementById(
                        "firstName"
                    ).value.trim(),

                middle_name:
                    document.getElementById(
                        "middleName"
                    ).value.trim(),

                last_name:
                    document.getElementById(
                        "lastName"
                    ).value.trim(),

                birth_date:
                    document.getElementById(
                        "birthDate"
                    ).value,

                gender:
                    document.getElementById(
                        "gender"
                    ).value,

                year_level:
                    document.getElementById(
                        "yearLevel"
                    ).value.trim(),

                section:
                    document.getElementById(
                        "section"
                    ).value.trim(),

                contact_number:
                    document.getElementById(
                        "contactNumber"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "studentEmail"
                    ).value.trim(),

                address:
                    document.getElementById(
                        "address"
                    ).value.trim()

            };


            if (DEMO_MODE) {

                if (editId) {

                    const index =
                        students.findIndex(
                            student =>
                                student.id ==
                                editId
                        );


                    if (index !== -1) {

                        students[index] = {

                            ...students[index],

                            ...studentData,

                            updated_at:
                                new Date().toISOString()

                        };

                    }

                }

                else {

                    const newStudent = {

                        id:
                            Date.now(),

                        user_id:
                            Date.now(),

                        ...studentData,

                        enrollment_status:
                            "active",

                        qr_token:
                            generateQRToken(),

                        created_at:
                            new Date().toISOString(),

                        updated_at:
                            new Date().toISOString()

                    };


                    students.push(
                        newStudent
                    );

                }

            }

            else {

                const endpoint =
                    editId
                        ?
                        `/students/update.php?id=${editId}`
                        :
                        "/students/create.php";


                await apiRequest(
                    endpoint,
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                studentData
                            )
                    }
                );

            }


            closeStudentModal();

            loadStudents();

            updateStatistics();

            showToast(
                editId
                    ?
                    "Student updated successfully."
                    :
                    "Student added successfully."
            );

        }
    );

}


function openStudentModal() {

    if (
        currentUser.role !==
        "faculty"
    ) {

        showToast(
            "Only faculty can add students."
        );

        return;
    }


    document.getElementById(
        "studentModalTitle"
    ).textContent =
        "Add Student";


    document
        .getElementById(
            "studentForm"
        )
        .reset();


    document.getElementById(
        "editStudentId"
    ).value = "";


    document
        .getElementById(
            "studentModal"
        )
        .classList.remove("hidden");

}


function closeStudentModal() {

    document
        .getElementById(
            "studentModal"
        )
        .classList.add("hidden");

}


/* =====================================================
   EDIT STUDENT
===================================================== */

function editStudent(id) {

    if (
        currentUser.role !==
        "faculty"
    ) {
        return;
    }


    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {
        return;
    }


    document.getElementById(
        "studentModalTitle"
    ).textContent =
        "Edit Student";


    document.getElementById(
        "editStudentId"
    ).value =
        student.id;


    document.getElementById(
        "studentId"
    ).value =
        student.student_id;


    document.getElementById(
        "firstName"
    ).value =
        student.first_name;


    document.getElementById(
        "middleName"
    ).value =
        student.middle_name || "";


    document.getElementById(
        "lastName"
    ).value =
        student.last_name;


    document.getElementById(
        "birthDate"
    ).value =
        student.birth_date || "";


    document.getElementById(
        "gender"
    ).value =
        student.gender || "";


    document.getElementById(
        "yearLevel"
    ).value =
        student.year_level || "";


    document.getElementById(
        "section"
    ).value =
        student.section || "";


    document.getElementById(
        "contactNumber"
    ).value =
        student.contact_number || "";


    document.getElementById(
        "studentEmail"
    ).value =
        student.email || "";


    document.getElementById(
        "address"
    ).value =
        student.address || "";


    document
        .getElementById(
            "studentModal"
        )
        .classList.remove("hidden");

}


/* =====================================================
   QR CODE
===================================================== */

function viewStudentQR(id) {

    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {
        return;
    }


    document.getElementById(
        "qrStudentName"
    ).textContent =
        fullName(student);


    document.getElementById(
        "qrTokenText"
    ).textContent =
        student.qr_token;


    const container =
        document.getElementById(
            "qrcode"
        );


    container.innerHTML = "";


    if (
        typeof QRCode !==
        "undefined"
    ) {

        new QRCode(
            container,
            {
                text:
                    student.qr_token,

                width: 220,

                height: 220
            }
        );

    }


    document
        .getElementById(
            "qrModal"
        )
        .classList.remove("hidden");

}


function closeQRModal() {

    document
        .getElementById(
            "qrModal"
        )
        .classList.add("hidden");

}


function generateQRToken() {

    return (
        "QR-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()
    );

}


/* =====================================================
   GATE LOGS
===================================================== */

function loadGateLogs() {

    renderGateLogs(
        gateLogs
    );

}


function renderGateLogs(data) {

    const tbody =
        document.getElementById(
            "gateLogsTableBody"
        );


    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">

                    ${emptyState(
                        "No gate logs",
                        "No gate activity has been recorded."
                    )}

                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        data.map(
            log => {

                const student =
                    students.find(
                        item =>
                            item.id ===
                            log.student_id
                    );


                return `

                    <tr>

                        <td>

                            <div class="student-cell">

                                <div class="student-avatar">
                                    ${
                                        student
                                            ?
                                            getInitials(student)
                                            :
                                            "?"
                                    }
                                </div>

                                <div>

                                    <strong>
                                        ${
                                            student
                                                ?
                                                escapeHTML(
                                                    fullName(
                                                        student
                                                    )
                                                )
                                                :
                                                "Unknown"
                                        }
                                    </strong>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${
                                student
                                    ?
                                    escapeHTML(
                                        student.student_id
                                    )
                                    :
                                    "-"
                            }
                        </td>


                        <td>
                            ${escapeHTML(
                                getUsernameById(
                                    log.guard_id
                                )
                            )}
                        </td>


                        <td>

                            <span class="badge ${
                                log.action === "entry"
                                    ?
                                    "badge-entry"
                                    :
                                    "badge-exit"
                            }">

                                ${capitalize(
                                    log.action
                                )}

                            </span>

                        </td>


                        <td>
                            ${escapeHTML(
                                log.gate
                            )}
                        </td>


                        <td>

                            <span class="badge ${
                                log.status === "allowed"
                                    ?
                                    "badge-allowed"
                                    :
                                    "badge-denied"
                            }">

                                ${capitalize(
                                    log.status
                                )}

                            </span>

                        </td>


                        <td>
                            ${formatDateTime(
                                log.scanned_at
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =====================================================
   FILTER LOGS
===================================================== */

function filterLogs() {

    const search =
        document.getElementById(
            "logSearch"
        ).value
        .toLowerCase()
        .trim();


    const action =
        document.getElementById(
            "logActionFilter"
        ).value;


    const status =
        document.getElementById(
            "logStatusFilter"
        ).value;


    const filtered =
        gateLogs.filter(
            log => {

                const student =
                    students.find(
                        item =>
                            item.id ===
                            log.student_id
                    );


                const studentID =
                    student
                        ?
                        student.student_id
                            .toLowerCase()
                        :
                        "";


                const matchesSearch =
                    studentID.includes(
                        search
                    );


                const matchesAction =
                    action === "all" ||
                    log.action === action;


                const matchesStatus =
                    status === "all" ||
                    log.status === status;


                return (
                    matchesSearch &&
                    matchesAction &&
                    matchesStatus
                );

            }
        );


    renderGateLogs(
        filtered
    );

}


/* =====================================================
   RECENT LOGS
===================================================== */

function renderRecentLogs() {

    const container =
        document.getElementById(
            "recentLogs"
        );


    const latest =
        gateLogs
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.scanned_at) -
                    new Date(a.scanned_at)
            )
            .slice(0, 5);


    if (latest.length === 0) {

        container.innerHTML =
            emptyState(
                "No activity",
                "No gate activity recorded."
            );

        return;
    }


    container.innerHTML =
        latest.map(
            log => {

                const student =
                    students.find(
                        item =>
                            item.id ===
                            log.student_id
                    );


                return `

                    <div class="log-item">

                        <div class="log-icon ${
                            log.action === "entry"
                                ?
                                "log-entry"
                                :
                                "log-exit"
                        }">

                            ${
                                log.action === "entry"
                                    ?
                                    "→"
                                    :
                                    "←"
                            }

                        </div>


                        <div class="log-details">

                            <strong>
                                ${
                                    student
                                        ?
                                        escapeHTML(
                                            fullName(
                                                student
                                            )
                                        )
                                        :
                                        "Unknown Student"
                                }
                            </strong>

                            <small>
                                ${
                                    student
                                        ?
                                        escapeHTML(
                                            student.student_id
                                        )
                                        :
                                        "-"
                                }

                                •

                                ${
                                    capitalize(
                                        log.action
                                    )
                                }

                            </small>

                        </div>


                        <div class="log-time">

                            ${formatTime(
                                log.scanned_at
                            )}

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =====================================================
   QR SCANNER
===================================================== */

function openScanModal() {

    if (
        currentUser.role !==
        "guard"
    ) {

        showToast(
            "Only guards can scan student QR IDs."
        );

        return;
    }


    document.getElementById(
        "qrTokenInput"
    ).value = "";


    document.getElementById(
        "scanResult"
    ).innerHTML = "";


    document
        .getElementById(
            "scanModal"
        )
        .classList.remove("hidden");

}


function closeScanModal() {

    document
        .getElementById(
            "scanModal"
        )
        .classList.add("hidden");

}


function processScan() {

    const token =
        document.getElementById(
            "qrTokenInput"
        ).value.trim();


    const result =
        document.getElementById(
            "scanResult"
        );


    if (!token) {

        result.innerHTML = `

            <div class="scan-denied">

                Please enter a QR token.

            </div>

        `;

        return;
    }


    const student =
        students.find(
            item =>
                item.qr_token ===
                token
        );


    if (!student) {

        result.innerHTML = `

            <div class="scan-denied">

                <strong>
                    Access Denied
                </strong>

                <br>

                Student QR ID was not found.

            </div>

        `;

        return;
    }


    if (
        student.enrollment_status !==
        "active"
    ) {

        result.innerHTML = `

            <div class="scan-denied">

                <strong>
                    Access Denied
                </strong>

                <br>

                This student's enrollment is inactive.

            </div>

        `;

        createGateLog(
            student.id,
            "entry",
            "denied"
        );

        return;
    }


    result.innerHTML = `

        <div class="scan-success">

            <strong>
                Access Allowed
            </strong>

            <br><br>

            <strong>
                Student:
            </strong>

            ${escapeHTML(
                fullName(student)
            )}

            <br>

            <strong>
                Student ID:
            </strong>

            ${escapeHTML(
                student.student_id
            )}

            <br>

            <strong>
                Grade:
            </strong>

            ${escapeHTML(
                student.year_level ||
                "-"
            )}

            <br>

            <strong>
                Section:
            </strong>

            ${escapeHTML(
                student.section ||
                "-"
            )}

            <br><br>

            <button
                class="btn btn-primary"
                onclick="createGateLog(${student.id}, 'entry', 'allowed')"
            >
                Record Entry
            </button>

            <button
                class="btn btn-secondary"
                onclick="createGateLog(${student.id}, 'exit', 'allowed')"
            >
                Record Exit
            </button>

        </div>

    `;

}


/* =====================================================
   CREATE GATE LOG
===================================================== */

async function createGateLog(
    studentId,
    action,
    status
) {

    if (DEMO_MODE) {

        gateLogs.unshift({

            id:
                Date.now(),

            student_id:
                studentId,

            guard_id:
                currentUser.id,

            action,

            gate:
                "Main Gate",

            status,

            scanned_at:
                new Date().toISOString()

        });

    }

    else {

        await apiRequest(
            "/gate-logs/create.php",
            {
                method: "POST",

                body:
                    JSON.stringify({

                        student_id:
                            studentId,

                        action,

                        gate:
                            "Main Gate",

                        status

                    })
            }
        );

    }


    closeScanModal();

    loadDashboard();

    loadGateLogs();

    showToast(
        `Student ${action} recorded successfully.`
    );

}


/* =====================================================
   PROFILE
===================================================== */

function loadProfile() {

    const container =
        document.getElementById(
            "profileContent"
        );


    if (
        currentUser.role ===
        "student"
    ) {

        const student =
            students.find(
                item =>
                    item.user_id ===
                    currentUser.id
            );


        if (!student) {

            container.innerHTML =
                emptyState(
                    "Profile unavailable",
                    "Student information was not found."
                );

            return;
        }


        container.innerHTML = `

            <div class="profile-header">

                <div class="profile-avatar">

                    ${getInitials(
                        student
                    )}

                </div>

                <div>

                    <h2>
                        ${escapeHTML(
                            fullName(student)
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            student.student_id
                        )}
                    </p>

                </div>

            </div>


            <div class="profile-grid">

                ${profileField(
                    "First Name",
                    student.first_name
                )}

                ${profileField(
                    "Middle Name",
                    student.middle_name || "-"
                )}

                ${profileField(
                    "Last Name",
                    student.last_name
                )}

                ${profileField(
                    "Birth Date",
                    student.birth_date || "-"
                )}

                ${profileField(
                    "Gender",
                    student.gender || "-"
                )}

                ${profileField(
                    "Year Level",
                    student.year_level || "-"
                )}

                ${profileField(
                    "Section",
                    student.section || "-"
                )}

                ${profileField(
                    "Contact Number",
                    student.contact_number || "-"
                )}

                ${profileField(
                    "Email",
                    student.email || "-"
                )}

                ${profileField(
                    "Address",
                    student.address || "-"
                )}

                ${profileField(
                    "Enrollment Status",
                    capitalize(
                        student.enrollment_status
                    )
                )}

            </div>

        `;

        return;
    }


    /*
        FACULTY / GUARD PROFILE
    */

    container.innerHTML = `

        <div class="profile-header">

            <div class="profile-avatar">

                ${currentUser.username
                    .charAt(0)
                    .toUpperCase()}

            </div>

            <div>

                <h2>
                    ${escapeHTML(
                        currentUser.username
                    )}
                </h2>

                <p>
                    ${capitalize(
                        currentUser.role
                    )}
                </p>

            </div>

        </div>


        <div class="profile-grid">

            ${profileField(
                "Username",
                currentUser.username
            )}

            ${profileField(
                "Role",
                capitalize(
                    currentUser.role
                )
            )}

            ${profileField(
                "Account Status",
                capitalize(
                    currentUser.status
                )
            )}

            ${profileField(
                "User ID",
                currentUser.id
            )}

        </div>

    `;

}


/* =====================================================
   SIDEBAR
===================================================== */

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


/* =====================================================
   API REQUEST
===================================================== */

async function apiRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                ...options,

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                }
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "API request failed."
        );

    }


    return data;

}


/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function fullName(student) {

    return [

        student.first_name,

        student.middle_name,

        student.last_name

    ]
        .filter(Boolean)
        .join(" ");

}


function getInitials(student) {

    const first =
        student.first_name
            ?.charAt(0)
            .toUpperCase() || "";


    const last =
        student.last_name
            ?.charAt(0)
            .toUpperCase() || "";


    return first + last;

}


function getUsernameById(id) {

    const user =
        demoUsers.find(
            item => item.id === id
        );


    if (user) {
        return user.username;
    }


    if (
        currentUser &&
        currentUser.id === id
    ) {

        return currentUser.username;

    }


    return "User #" + id;

}


function formatDate(date) {

    return new Date(
        date
    ).toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


function formatDateTime(date) {

    return new Date(
        date
    ).toLocaleString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function formatTime(date) {

    return new Date(
        date
    ).toLocaleTimeString(
        "en-PH",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function capitalize(value) {

    if (!value) {
        return "";
    }


    return value
        .charAt(0)
        .toUpperCase() +
        value.slice(1);

}


function truncate(text, length) {

    if (
        text.length <= length
    ) {

        return text;

    }


    return (
        text.substring(0, length) +
        "..."
    );

}


function profileField(
    label,
    value
) {

    return `

        <div class="profile-field">

            <label>
                ${escapeHTML(
                    label
                )}
            </label>

            <strong>
                ${escapeHTML(
                    String(value)
                )}
            </strong>

        </div>

    `;

}


function emptyState(
    title,
    message
) {

    return `

        <div class="empty-state">

            <strong>
                ${escapeHTML(title)}
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>

        </div>

    `;

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}