<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireMethod("POST");
apiRequireRole(["faculty"]);

$id = (int)($_GET["id"] ?? 0);
$f  = studentFieldsFromInput(requestData());

$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$id]);
if (!$check->fetch()) {
    apiError("Student not found.", 404);
}

$dup = $pdo->prepare("SELECT 1 FROM students WHERE student_id = ? AND id <> ?");
$dup->execute([$f["student_id"], $id]);
if ($dup->fetch()) {
    apiError("That Student ID already exists.", 409);
}

$set = implode(", ", array_map(fn($c) => "$c = :$c", array_keys($f)));
$pdo->prepare("UPDATE students SET $set, updated_at = :updated_at WHERE id = :id")
    ->execute($f + ["updated_at" => nowSql(), "id" => $id]);

jsonResponse(["message" => "Student updated."]);
