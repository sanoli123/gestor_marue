<?php
// ==========================
// bootstrap.php (COMPLETO)
// ==========================

// CORS — permite chamadas apenas do seu domínio (com e sem www)
$origin  = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed = ['https://www.brquest.com.br', 'https://brquest.com.br'];

if (in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
}

// Métodos/headers permitidos e cache do preflight
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

// Responde imediatamente requisições de preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ---------- Helpers ----------
function json_response($data, int $code = 200): void {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function read_json(): array {
  $raw  = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}
