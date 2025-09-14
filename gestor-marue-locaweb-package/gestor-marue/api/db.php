<?php
require_once __DIR__ . '/config.php';

if (!extension_loaded('pdo_mysql')) {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code(500);
  echo json_encode(['error' => 'pdo_mysql extension not available on this PHP.']);
  exit;
}

try {
  $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code(500);
  echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
  exit;
}