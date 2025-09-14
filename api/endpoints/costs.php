<?php
// Este endpoint usa a conexão PDO já criada pelo index.php (variável $pdo).
// Saída sempre em JSON.
header('Content-Type: application/json; charset=utf-8');

/** Lê corpo JSON (se existir) e retorna como array associativo */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Converte linhas do banco (snake_case) para o formato esperado pelo app (camelCase) */
function row_to_api(array $r): array {
    return [
        'id'           => (int)$r['id'],
        'name'         => $r['name'],
        'value'        => (float)$r['value'],
        'isPercentage' => (bool)$r['is_percentage'],
        'category'     => $r['category'],
        'createdAt'    => $r['created_at'],
        'updatedAt'    => $r['updated_at'],
    ];
}

/** Busca um custo por ID e retorna em formato API */
function fetch_cost_by_id(PDO $pdo, int $id): ?array {
    $st = $pdo->prepare('SELECT * FROM costs WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ? row_to_api($row) : null;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Lista todos os custos
        $st = $pdo->query('SELECT * FROM costs ORDER BY id DESC');
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $out = array_map('row_to_api', $rows);
        echo json_encode($out, JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === 'POST') {
        // Cria novo custo
        $b = read_json_body();

        $name         = isset($b['name']) ? trim($b['name']) : '';
        $value        = isset($b['value']) ? (float)$b['value'] : 0;
        $isPercentage = !empty($b['isPercentage']) ? 1 : 0;
        $category     = isset($b['category']) ? trim($b['category']) : 'other';

        if ($name === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field "name" is required']);
            exit;
        }

        $st = $pdo->prepare(
            'INSERT INTO costs (name, value, is_percentage, category, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())'
        );
        $st->execute([$name, $value, $isPercentage, $category]);

        $id = (int)$pdo->lastInsertId();
        $item = fetch_cost_by_id($pdo, $id);
        http_response_code(201);
        echo json_encode($item, JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === 'PUT') {
        // Atualiza custo existente. ID vem em ?id=...
        if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing or invalid "id" in query string']);
            exit;
        }
        $id = (int)$_GET['id'];

        $b = read_json_body();
        // Campos opcionais: se vierem, atualiza; se não, mantém
        $current = fetch_cost_by_id($pdo, $id);
        if (!$current) {
            http_response_code(404);
            echo json_encode(['error' => 'Cost not found']);
            exit;
        }

        $name         = array_key_exists('name', $b) ? trim((string)$b['name']) : $current['name'];
        $value        = array_key_exists('value', $b) ? (float)$b['value'] : $current['value'];
        $isPercentage = array_key_exists('isPercentage', $b) ? (!empty($b['isPercentage']) ? 1 : 0) : ($current['isPercentage'] ? 1 : 0);
        $category     = array_key_exists('category', $b) ? trim((string)$b['category']) : $current['category'];

        $st = $pdo->prepare(
            'UPDATE costs
               SET name = ?, value = ?, is_percentage = ?, category = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $st->execute([$name, $value, $isPercentage, $category, $id]);

        $item = fetch_cost_by_id($pdo, $id);
        echo json_encode($item, JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === 'DELETE') {
        // Remove custo. ID em ?id=...
        if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing or invalid "id" in query string']);
            exit;
        }
        $id = (int)$_GET['id'];

        $st = $pdo->prepare('DELETE FROM costs WHERE id = ?');
        $st->execute([$id]);

        http_response_code(204); // No Content
        exit;
    }

    // Método não suportado
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
