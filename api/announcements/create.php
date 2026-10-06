<?php
require_once __DIR__ . "/../bootstrap.php";
apiRequireMethod("POST");
apiRequireRole(["faculty"]);

$in      = requestData();
$title   = trim((string)($in["title"] ?? ""));
$content = trim((string)($in["content"] ?? ""));

if ($title === "" || $content === "") {
    apiError("Title and content are required.");
}
if (mb_strlen($title) > 150) {
    apiError("Title must be 150 characters or fewer.");
}

$now = nowSql();
$pdo->prepare("INSERT INTO announcements (title, content, posted_by, created_at, updated_at) VALUES (?,?,?,?,?)")
    ->execute([$title, $content, $_SESSION["user_id"], $now, $now]);

jsonResponse(["message" => "Announcement posted."], 201);
