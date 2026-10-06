<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireRole(["guard"]);

$rows = $pdo->query(
    "SELECT l.id, l.student_id, l.guard_id, u.username AS guard_name, l.action, l.gate, l.status, l.scanned_at
     FROM gate_logs l LEFT JOIN users u ON u.id = l.guard_id
     ORDER BY l.scanned_at DESC, l.id DESC LIMIT 500"
)->fetchAll();

foreach ($rows as &$r) {
    $r["id"]         = (int)$r["id"];
    $r["student_id"] = (int)$r["student_id"];
    $r["guard_id"]   = $r["guard_id"] !== null ? (int)$r["guard_id"] : null;
    $r["scanned_at"] = iso($r["scanned_at"]);
}

jsonResponse(["logs" => $rows]);
