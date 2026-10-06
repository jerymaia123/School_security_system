<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireRole(["student", "faculty", "guard"]);

if ($_SESSION["role"] === "student") {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE user_id = :uid");
    $stmt->execute(["uid" => $_SESSION["user_id"]]);
} else {
    $stmt = $pdo->query("SELECT * FROM students ORDER BY last_name, first_name");
}

jsonResponse(["students" => array_map("formatStudent", $stmt->fetchAll())]);
