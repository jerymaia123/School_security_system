<?php
// Run ONCE from your own computer, then DELETE this file.
if (!in_array($_SERVER["REMOTE_ADDR"] ?? "", ["127.0.0.1", "::1"], true)) {
    http_response_code(403);
    die("setup.php can only be run from localhost.");
}

require_once "config/database.php";
date_default_timezone_set("Asia/Manila");

if ((int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn() > 0) {
    die("Users already exist. Nothing to do. Delete setup.php.");
}

$now  = date("Y-m-d H:i:s");
$hash = password_hash("1234", PASSWORD_DEFAULT);

$addUser = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
foreach (["student", "faculty", "guard"] as $role) {
    $addUser->execute([$role, $hash, $role]);
}
$ids = $pdo->query("SELECT username, id FROM users")->fetchAll(PDO::FETCH_KEY_PAIR);

$addStudent = $pdo->prepare(
    "INSERT INTO students (user_id, student_id, first_name, middle_name, last_name, birth_date, gender,
        grade_level, section, contact_number, email, address, enrollment_status, qr_token, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
);
$rows = [
    [$ids["student"], "STU-2026-001", "Juan",  "Dela",   "Cruz",   "2008-05-10", "Male",   "Grade 12", "STEM A", "09123456789", "juan@example.com",  "Batangas, Philippines", "active",   "QR-STU-2026-001"],
    [null,            "STU-2026-002", "Maria", "Santos", "Reyes",  "2008-08-20", "Female", "Grade 12", "STEM B", "09987654321", "maria@example.com", "Batangas, Philippines", "active",   "QR-STU-2026-002"],
    [null,            "STU-2026-003", "Mark",  "",       "Garcia", "2009-01-15", "Male",   "Grade 11", "ICT A",  "09112223344", "mark@example.com",  "Batangas, Philippines", "inactive", "QR-STU-2026-003"],
];
foreach ($rows as $r) {
    $addStudent->execute([...$r, $now, $now]);
}

$pdo->prepare("INSERT INTO announcements (title, content, posted_by, created_at, updated_at) VALUES (?,?,?,?,?)")
    ->execute(["School Security Reminder",
               "All students are reminded to present their student QR ID when entering or leaving the school premises.",
               $ids["faculty"], $now, $now]);

echo "Done. Demo accounts (password 1234): student, faculty, guard. DELETE setup.php NOW.";
