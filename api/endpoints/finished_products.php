<?php
// ===== /api/endpoints/finished_products.php =====
$method = $_SERVER['REQUEST_METHOD'];

function map_product_out(array $row): array {
  // defaults
  $row += [
    'id'          => null,
    'sku'         => null,
    'name'        => null,
    'unit'        => 'UN',
    'type'        => 'PRODUCED',
    'cost'        => 0,
    'price'       => 0,
    'stock'       => 0,
    'image_id'    => null,     // legado (string)
    'image_ids'   => null,     // futuro (JSON)
    'description' => null,
    'created_at'  => null,
    'updated_at'  => null,
    'resaleCost'  => null,
    'recipe'      => null,
  ];

  // ---- garante imageIds: array ----
  $imageIds = [];
  if (!empty($row['image_ids'])) {
    $decoded = json_decode($row['image_ids'], true);
    if (is_array($decoded)) $imageIds = array_values(array_filter($decoded, 'strlen'));
  } elseif (!empty($row['image_id'])) {
    $imageIds = [$row['image_id']];
  }

  return $row + [
    'imageIds'  => $imageIds,            // << a UI usa isto
    'imageId'   => $row['image_id'],     // compat, se algum lugar usar singular
    'createdAt' => $row['created_at'],
    'updatedAt' => $row['updated_at'],
    'salePrice' => $row['price'],        // << a UI usa isto
  ];
}

try {
  if (function_exists('get_pdo'))      { $pdo = get_pdo(); }
  elseif ($GLOBALS['pdo'] ?? null)     { $pdo = $GLOBALS['pdo']; }
  else throw new RuntimeException('PDO connection not available');

  $json = function (): array {
    $d = read_json();
    return is_array($d) ? $d : [];
  };

  $id = isset($_GET['id']) && $_GET['id'] !== '' ? (int)$_GET['id'] : null;

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($id) {
      $st = $pdo->prepare('SELECT * FROM finished_products WHERE id = ?');
      $st->execute([$id]);
      $row = $st->fetch(PDO::FETCH_ASSOC);
      if (!$row) json_response(['error' => 'Not found'], 404);
      json_response(map_product_out($row));
    } else {
      $st   = $pdo->query('SELECT * FROM finished_products ORDER BY id DESC');
      $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
      $rows = array_map('map_product_out', $rows);
      json_response($rows);
    }
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $json();

    // aceita camel/snake
    $sku   = trim((string)($d['sku']  ?? null));
    $name  = trim((string)($d['name'] ?? ''));
    $unit  = trim((string)($d['unit'] ?? 'UN'));
    $type  = trim((string)($d['type'] ?? 'PRODUCED'));
    $cost  = (float)($d['cost']  ?? 0);
    $price = (float)($d['price'] ?? $d['salePrice'] ?? 0);
    $stock = (float)($d['stock'] ?? 0);

    // imageIds pode vir array; se quiser persistir, grave em image_ids (JSON)
    $imageIds = $d['imageIds'] ?? null;
    $image_id = $d['image_id'] ?? ($d['imageId'] ?? null);
    $desc     = (string)($d['description'] ?? null);

    if ($name === '') json_response(['message' => 'Field "name" is required'], 400);

    // Caso exista coluna image_ids, descomente a linha e troque a query.
    $st = $pdo->prepare(
      'INSERT INTO finished_products (sku, name, unit, cost, price, stock, image_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $st->execute([$sku, $name, $unit, $cost, $price, $stock, $image_id, $desc]);

    $newId = (int)$pdo->lastInsertId();
    $st = $pdo->prepare('SELECT * FROM finished_products WHERE id = ?');
    $st->execute([$newId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $row['type'] = $type;

    // injeta image_ids de memória só para resposta (sem persistir)
    if ($imageIds && is_array($imageIds)) $row['image_ids'] = json_encode($imageIds);

    json_response(map_product_out($row), 201);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!$id) json_response(['message' => 'ID required'], 400);
    $d = $json();

    $st = $pdo->prepare('SELECT * FROM finished_products WHERE id = ?');
    $st->execute([$id]);
    $cur = $st->fetch(PDO::FETCH_ASSOC);
    if (!$cur) json_response(['error' => 'Not found'], 404);

    $sku   = array_key_exists('sku',   $d) ? trim((string)$d['sku'])   : $cur['sku'];
    $name  = array_key_exists('name',  $d) ? trim((string)$d['name'])  : $cur['name'];
    $unit  = array_key_exists('unit',  $d) ? trim((string)$d['unit'])  : $cur['unit'];
    $cost  = array_key_exists('cost',  $d) ? (float)$d['cost']         : (float)$cur['cost'];
    $price = array_key_exists('price', $d) ? (float)$d['price']
           : (array_key_exists('salePrice', $d) ? (float)$d['salePrice'] : (float)$cur['price']);
    $stock = array_key_exists('stock', $d) ? (float)$d['stock']        : (float)$cur['stock'];
    $image = array_key_exists('image_id',$d) ? (string)$d['image_id']
           : (array_key_exists('imageId',$d) ? (string)$d['imageId']   : $cur['image_id']);
    $desc  = array_key_exists('description', $d) ? (string)$d['description'] : $cur['description'];

    $st = $pdo->prepare(
      'UPDATE finished_products
         SET sku = ?, name = ?, unit = ?, cost = ?, price = ?, stock = ?, image_id = ?, description = ?
       WHERE id = ?'
    );
    $st->execute([$sku, $name, $unit, $cost, $price, $stock, $image, $desc, $id]);

    $st = $pdo->prepare('SELECT * FROM finished_products WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    // idem resposta: se mandou imageIds, devolve junto (sem persistir)
    if (isset($d['imageIds']) && is_array($d['imageIds'])) {
      $row['image_ids'] = json_encode($d['imageIds']);
    }

    json_response(map_product_out($row), 200);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$id) json_response(['message' => 'ID required'], 400);
    $st = $pdo->prepare('DELETE FROM finished_products WHERE id = ?');
    $st->execute([$id]);
    http_response_code(204); exit;
  }

  json_response(['error' => 'Method not allowed'], 405);

} catch (Throwable $e) {
  json_response(['error' => 'Server error', 'message' => $e->getMessage()], 500);
}
