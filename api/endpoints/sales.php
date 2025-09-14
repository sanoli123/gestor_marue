<?php
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  json_response([]);
}
if ($method === 'POST') {
  $data = read_json();
  $data['id'] = $data['id'] ?? null;
  json_response($data, 201);
}
json_response(['error' => 'Method not allowed'], 405);
