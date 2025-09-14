<?php
// ===== /api/endpoints/images_get.php (COMPLETO) =====
try {
  $id = isset($_GET['id']) ? basename($_GET['id']) : '';
  if ($id === '') {
    http_response_code(404);
    exit;
  }

  $file = __DIR__ . '/../uploads/' . $id;
  if (!is_file($file)) {
    // Retorna um PNG 1x1 transparente se não existir
    header('Content-Type: image/png');
    echo base64_decode(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2b6aEAAAAASUVORK5CYII='
    );
    exit;
  }

  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  $mime = match ($ext) {
    'jpg', 'jpeg' => 'image/jpeg',
    'png'         => 'image/png',
    'gif'         => 'image/gif',
    'webp'        => 'image/webp',
    default       => 'application/octet-stream',
  };

  header('Content-Type: ' . $mime);
  header('Content-Length: ' . filesize($file));
  readfile($file);
  exit;

} catch (Throwable $e) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
  exit;
}
