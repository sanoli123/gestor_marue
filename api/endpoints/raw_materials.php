<?php
// /gestor-marue/api/endpoints/raw-materials.php
// CRUD de matérias-primas com suporte a imageIds (array) em JSON

declare(strict_types=1);

/** @var PDO $pdo vem do index.php (injeção simples) */
if (!isset($pdo) || !($pdo instanceof PDO)) {
  http_response_code(500);
  echo json_encode(["error" => "DB not ready"]);
  exit;
}

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$path   = $_GET['__path'] ?? ''; // definido no roteador do index.php
$id     = $_GET['id']    ?? null; // se vier /raw-materials/{id}

function readJsonBody(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function mapRow(array $r): array {
  // Normaliza nomes pro frontend
  return [
    "id"          => (string)$r["id"],
    "name"        => $r["name"],
    "unit"        => $r["unit"],
    "stock"       => (float)$r["stock"],
    // No banco guardamos cost_per_unit
    "costPerUnit" => (float)$r["cost_per_unit"],
    // image_ids é TEXT JSON -> virará array
    "imageIds"    => $r["image_ids"] ? json_decode($r["image_ids"], true) : [],
    "createdAt"   => $r["created_at"] ?? null,
    "updatedAt"   => $r["updated_at"] ?? null,
  ];
}

try {
  if ($method === 'GET' && !$id) {
    // LISTAR
    $stmt = $pdo->query("SELECT id, name, unit, stock, cost_per_unit, image_ids, created_at, updated_at
                         FROM raw_materials ORDER BY name ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode(array_map('mapRow', $rows));
    exit;
  }

  if ($method === 'GET' && $id) {
    // BUSCAR POR ID
    $stmt = $pdo->prepare("SELECT id, name, unit, stock, cost_per_unit, image_ids, created_at, updated_at
                           FROM raw_materials WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) { http_response_code(404); echo json_encode(["error"=>"Not found"]); exit; }
    echo json_encode(mapRow($row));
    exit;
  }

  if ($method === 'POST') {
    $b = readJsonBody();

    $name        = trim((string)($b['name'] ?? ''));
    $unit        = trim((string)($b['unit'] ?? 'un'));
    $stock       = (float)($b['stock'] ?? 0);
    // Aceita tanto costPerUnit (frontend) quanto cost (fallback)
    $costPerUnit = (float)($b['costPerUnit'] ?? $b['cost'] ?? 0);

    // imageIds: array -> JSON; tolera null/string
    $imageIdsArr = [];
    if (isset($b['imageIds'])) {
      $imageIdsArr = is_array($b['imageIds']) ? $b['imageIds'] : [];
    }
    $imageIdsJson = json_encode($imageIdsArr, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    if ($name === '') {
      http_response_code(400);
      echo json_encode(["error"=>"'name' is required"]);
      exit;
    }

    $stmt = $pdo->prepare(
      "INSERT INTO raw_materials (name, unit, stock, cost_per_unit, image_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
    );
    $stmt->execute([$name, $unit, $stock, $costPerUnit, $imageIdsJson]);

    $newId = $pdo->lastInsertId();
    $stmt2 = $pdo->prepare("SELECT id, name, unit, stock, cost_per_unit, image_ids, created_at, updated_at
                            FROM raw_materials WHERE id = ?");
    $stmt2->execute([$newId]);
    $row = $stmt2->fetch(PDO::FETCH_ASSOC);
    echo json_encode(mapRow($row));
    exit;
  }

  if ($method === 'PUT' && $id) {
    $b = readJsonBody();

    // Campos opcionais; mantém anterior se não enviado
    $stmt0 = $pdo->prepare("SELECT name, unit, stock, cost_per_unit, image_ids FROM raw_materials WHERE id = ?");
    $stmt0->execute([$id]);
    $curr = $stmt0->fetch(PDO::FETCH_ASSOC);
    if (!$curr) { http_response_code(404); echo json_encode(["error"=>"Not found"]); exit; }

    $name        = array_key_exists('name', $b) ? trim((string)$b['name']) : $curr['name'];
    $unit        = array_key_exists('unit', $b) ? trim((string)$b['unit']) : $curr['unit'];
    $stock       = array_key_exists('stock', $b) ? (float)$b['stock'] : (float)$curr['stock'];
    $costPerUnit = array_key_exists('costPerUnit', $b) ? (float)$b['costPerUnit']
                  : (array_key_exists('cost', $b) ? (float)$b['cost'] : (float)$curr['cost_per_unit']);

    if (array_key_exists('imageIds', $b)) {
      $imageIdsArr  = is_array($b['imageIds']) ? $b['imageIds'] : [];
      $imageIdsJson = json_encode($imageIdsArr, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } else {
      $imageIdsJson = $curr['image_ids'];
    }

    $stmt = $pdo->prepare(
      "UPDATE raw_materials
         SET name = ?, unit = ?, stock = ?, cost_per_unit = ?, image_ids = ?, updated_at = NOW()
       WHERE id = ?"
    );
    $stmt->execute([$name, $unit, $stock, $costPerUnit, $imageIdsJson, $id]);

    $stmt2 = $pdo->prepare("SELECT id, name, unit, stock, cost_per_unit, image_ids, created_at, updated_at
                            FROM raw_materials WHERE id = ?");
    $stmt2->execute([$id]);
    $row = $stmt2->fetch(PDO::FETCH_ASSOC);
    echo json_encode(mapRow($row));
    exit;
  }

  if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare("DELETE FROM raw_materials WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
    exit;
  }

  http_response_code(405);
  echo json_encode(["error"=>"Method not allowed"]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "error"   => "Server error",
    "message" => $e->getMessage(),
  ]);
}
