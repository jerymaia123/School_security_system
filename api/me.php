<?php
require_once __DIR__ . "/bootstrap.php";
apiRequireRole(["student", "faculty", "guard"]);

jsonResponse(["user" => [
    "id"       => (int)$_SESSION["user_id"],
    "username" => $_SESSION["username"],
    "role"     => $_SESSION["role"],
    "status"   => "active",
]]);
