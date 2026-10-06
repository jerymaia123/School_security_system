<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireRole(["student", "faculty", "guard"]);

$rows = $pdo->query(
    "SELECT a.id, a.title, a.content, a.posted_by, u.username AS posted_by_name, a.created_at, a.updated_at
     FROM announcements a LEFT JOIN users u ON u.id = a.posted_by
     ORDER BY a.created_at DESC, a.id DESC LIMIT 100"
)->fetchAll();

foreach ($rows as &$r) {
    $r["id"]         = (int)$r["id"];
    $r["posted_by"]  = $r["posted_by"] !== null ? (int)$r["posted_by"] : null;
    $r["created_at"] = iso($r["created_at"]);
    $r["updated_at"] = iso($r["updated_at"]);
}

jsonResponse(["announcements" => $rows]);
