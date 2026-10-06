<?php
// Shared helpers for every API endpoint.

date_default_timezone_set("Asia/Manila");

session_set_cookie_params([
    "httponly" => true,
    "samesite" => "Lax",
]);

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../includes/auth.php"; // starts the session

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

function jsonResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function apiError($message, $code = 400)
{
    jsonResponse(["message" => $message], $code);
}

function requestData()
{
    $data = json_decode(file_get_contents("php://input"), true);
    return is_array($data) ? $data : [];
}

function apiRequireMethod($method)
{
    if ($_SERVER["REQUEST_METHOD"] !== $method) {
        apiError("Method not allowed.", 405);
    }
}

function apiRequireRole(array $roles)
{
    if (!isset($_SESSION["user_id"])) {
        apiError("Please log in again.", 401);
    }
    if (!in_array($_SESSION["role"], $roles, true)) {
        apiError("Access denied.", 403);
    }
}

function nowSql()
{
    return date("Y-m-d H:i:s");
}

function iso($sqlDate)
{
    return $sqlDate ? date("c", strtotime($sqlDate)) : null;
}

function formatStudent(array $s)
{
    $s["id"]      = (int)$s["id"];
    $s["user_id"] = $s["user_id"] !== null ? (int)$s["user_id"] : null;
    $s["created_at"] = iso($s["created_at"]);
    $s["updated_at"] = iso($s["updated_at"]);
    return $s;
}

// Reads + validates the student form fields.
function studentFieldsFromInput(array $in)
{
    $t = fn($k) => trim((string)($in[$k] ?? ""));
    $orNull = fn($v) => $v === "" ? null : $v;

    $gender = $t("gender");
    if (!in_array($gender, ["Male", "Female"], true)) {
        $gender = "";
    }

    $email = $t("email");
    if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        apiError("Please enter a valid email address.");
    }

    $birth = $t("birth_date");
    if ($birth !== "" && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birth)) {
        apiError("Invalid birth date.");
    }

    $f = [
        "student_id"     => $t("student_id"),
        "first_name"     => $t("first_name"),
        "middle_name"    => $orNull($t("middle_name")),
        "last_name"      => $t("last_name"),
        "birth_date"     => $orNull($birth),
        "gender"         => $orNull($gender),
        "grade_level"    => $orNull($t("grade_level")),
        "section"        => $orNull($t("section")),
        "contact_number" => $orNull($t("contact_number")),
        "email"          => $orNull($email),
        "address"        => $orNull($t("address")),
    ];

    if ($f["student_id"] === "" || $f["first_name"] === "" || $f["last_name"] === "") {
        apiError("Student ID, first name and last name are required.");
    }

    return $f;
}
