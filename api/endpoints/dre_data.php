<?php
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  json_response([
    'revenue' => [],
    'costs' => [],
    'expenses' => [],
    'result' => 0
  ]);
}
if ($method === 'POST') {
  $data = read_json();
  json_response($data, 201);
}
json_response(['error' => 'Method not allowed'], 405);
