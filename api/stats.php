<?php
require_once __DIR__ . "/bootstrap.php";
apiRequireRole(["student", "faculty", "guard"]);

$today = date("Y-m-d");

$count = function ($sql, $params = []) use ($pdo) {
    $s = $pdo->prepare($sql);
    $s->execute($params);
    return (int)$s->fetchColumn();
};

jsonResponse([
    "total"   => $count("SELECT COUNT(*) FROM students"),
    "active"  => $count("SELECT COUNT(*) FROM students WHERE enrollment_status = 'active'"),
    "entries" => $count("SELECT COUNT(*) FROM gate_logs WHERE DATE(scanned_at) = ? AND action = 'entry' AND status = 'allowed'", [$today]),
    "exits"   => $count("SELECT COUNT(*) FROM gate_logs WHERE DATE(scanned_at) = ? AND action = 'exit' AND status = 'allowed'", [$today]),
]);
