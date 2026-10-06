<?php
require_once __DIR__ . "/bootstrap.php";
apiRequireMethod("POST");

$in       = requestData();
$username = trim((string)($in["username"] ?? ""));
$password = (string)($in["password"] ?? "");

if ($username === "" || $password === "") {
    apiError("Please enter username and password.");
}

$stmt = $pdo->prepare("SELECT id, username, password, role, status FROM users WHERE username = :u LIMIT 1");
$stmt->execute(["u" => $username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user["password"])) {
    apiError("Invalid username or password.", 401);
}
if ($user["status"] !== "active") {
    apiError("This account is inactive.", 403);
}

session_regenerate_id(true);
$_SESSION["user_id"]  = (int)$user["id"];
$_SESSION["username"] = $user["username"];
$_SESSION["role"]     = $user["role"];

jsonResponse(["user" => [
    "id"       => (int)$user["id"],
    "username" => $user["username"],
    "role"     => $user["role"],
    "status"   => $user["status"],
]]);
