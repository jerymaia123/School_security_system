<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireMethod("POST");
apiRequireRole(["guard"]);

$in        = requestData();
$studentId = (int)($in["student_id"] ?? 0);
$action    = (string)($in["action"] ?? "");
$gate      = trim((string)($in["gate"] ?? "Main Gate")) ?: "Main Gate";

if (!in_array($action, ["entry", "exit"], true)) {
    apiError("Invalid action.");
}

$stmt = $pdo->prepare("SELECT id, enrollment_status FROM students WHERE id = ?");
$stmt->execute([$studentId]);
$student = $stmt->fetch();
if (!$student) {
    apiError("Student not found.", 404);
}

// The server decides the result; the browser's "status" is ignored.
$status = $student["enrollment_status"] === "active" ? "allowed" : "denied";

$pdo->prepare("INSERT INTO gate_logs (student_id, guard_id, action, gate, status, scanned_at) VALUES (?,?,?,?,?,?)")
    ->execute([$studentId, $_SESSION["user_id"], $action, mb_substr($gate, 0, 60), $status, nowSql()]);

jsonResponse(["message" => "Gate log recorded.", "status" => $status], 201);
