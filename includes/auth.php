<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function requireLogin()
{
    if (!isset($_SESSION["user_id"])) {
        header("Location: ../login.php");
        exit();
    }
}

function requireRole($role)
{
    requireLogin();

    if ($_SESSION["role"] !== $role) {
        http_response_code(403);
        die("Access denied.");
    }
}

?>
