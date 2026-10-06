<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireMethod("POST");
apiRequireRole(["faculty"]);

$f = studentFieldsFromInput(requestData());

$exists = $pdo->prepare("SELECT 1 FROM students WHERE student_id = ? UNION SELECT 1 FROM users WHERE username = ?");
$exists->execute([$f["student_id"], $f["student_id"]]);
if ($exists->fetch()) {
    apiError("That Student ID already exists.", 409);
}

$tempPassword = bin2hex(random_bytes(4)); // shown once to faculty
$qrToken      = "QR-" . strtoupper(bin2hex(random_bytes(12)));
$now          = nowSql();

try {
    $pdo->beginTransaction();

    $u = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'student') RETURNING id");
    $u->execute([$f["student_id"], password_hash($tempPassword, PASSWORD_DEFAULT)]);
    $userId = (int)$u->fetchColumn();

    $cols = array_keys($f);
    $sql  = "INSERT INTO students (user_id, " . implode(", ", $cols) . ", enrollment_status, qr_token, created_at, updated_at)
             VALUES (:user_id, :" . implode(", :", $cols) . ", 'active', :qr_token, :now, :now2)";
    $pdo->prepare($sql)->execute($f + [
        "user_id" => $userId, "qr_token" => $qrToken, "now" => $now, "now2" => $now,
    ]);

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    apiError("Could not save the student.", 500);
}

jsonResponse([
    "message"       => "Student created.",
    "username"      => $f["student_id"],
    "temp_password" => $tempPassword,
], 201);
