<?php
// ===== /api/endpoints/singleton.php (COMPLETO) =====
$method = $_SERVER['REQUEST_METHOD'];

try {
  if ($method === 'GET') {
    json_response([
      'company'     => 'Maruê',
      'currency'    => 'BRL',

      // Campos usados pelo front para montar SKU:
      'skuEnabled'  => true,
      'skuPrefix'   => 'MARUE-',
      'skuPadding'  => 3,
      'skuNext'     => 1,

      // Listas usadas em generateSKU() e/ou na tela de SKU
      'productTypes' => [
        ['id' => 1, 'code' => 'CAF', 'name' => 'Café'],
        ['id' => 2, 'code' => 'CHA', 'name' => 'Chá'],
        ['id' => 3, 'code' => 'ACCS','name' => 'Acessório'],
      ],
      'origins' => [
        ['id' => 1, 'code' => 'BR', 'name' => 'Brasil'],
        ['id' => 2, 'code' => 'CO', 'name' => 'Colômbia'],
        ['id' => 3, 'code' => 'ET', 'name' => 'Etiópia'],
      ],

      'decimals'    => 2,
      'taxIncluded' => false,
      'version'     => '0.1'
    ]);
  }

  if ($method === 'POST' || $method === 'PUT') {
    $data = read_json();
    if (!is_array($data)) $data = [];
    json_response($data, 200);
  }

  json_response(['error' => 'Method not allowed'], 405);
} catch (Throwable $e) {
  json_response(['error' => 'Server error', 'message' => $e->getMessage()], 500);
}
