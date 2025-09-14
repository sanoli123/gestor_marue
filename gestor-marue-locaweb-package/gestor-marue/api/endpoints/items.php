<?php
global $pdo;
$method = $_SERVER['REQUEST_METHOD'];

$matches = [];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
preg_match('#/items(?:/(\d+))?#', $path, $matches);
$id = isset($matches[1]) ? (int)$matches[1] : null;

if ($method === 'GET') {
  if ($id) {
    $stmt = $pdo->prepare('SELECT * FROM items WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_response(['error' => 'Item not found'], 404);
    json_response($row);
  } else {
    $stmt = $pdo->query('SELECT * FROM items ORDER BY id DESC LIMIT 200');
    json_response($stmt->fetchAll());
  }
}

if ($method === 'POST') {
  $data = read_json();
  if (!isset($data['name']) || $data['name'] === '') {
    json_response(['error' => 'name is required'], 422);
  }
  $qty = isset($data['qty']) ? (int)$data['qty'] : 0;
  $stmt = $pdo->prepare('INSERT INTO items(name, qty) VALUES (?, ?)');
  $stmt->execute([$data['name'], $qty]);
  $id = (int)$pdo->lastInsertId();
  json_response(['id' => $id, 'name' => $data['name'], 'qty' => $qty], 201);
}

if ($method === 'PUT') {
  if (!$id) json_response(['error' => 'ID required'], 400);
  $data = read_json();
  $fields = [];
  $params = [];

  if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = $data['name']; }
  if (isset($data['qty']))  { $fields[] = 'qty = ?';  $params[] = (int)$data['qty']; }

  if (!$fields) json_response(['error' => 'No fields to update'], 400);

  $params[] = $id;
  $sql = 'UPDATE items SET ' . implode(', ', $fields) . ' WHERE id = ?';
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  json_response(['ok' => true]);
}

if ($method === 'DELETE') {
  if (!$id) json_response(['error' => 'ID required'], 400);
  $stmt = $pdo->prepare('DELETE FROM items WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['ok' => true]);
}

json_response(['error' => 'Method not allowed'], 405);