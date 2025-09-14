<?php
// ===== /api/endpoints/images_upload.php (COMPLETO) =====
try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
  }

  if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    json_response(['message' => 'No image uploaded or upload error'], 400);
  }

  $uploadDir = __DIR__ . '/../uploads';
  if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
  }

  $tmp  = $_FILES['image']['tmp_name'];
  $name = $_FILES['image']['name'];
  $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (!in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
    json_response(['message' => 'Unsupported image type'], 400);
  }

  // Gera id simples (timestamp + rand)
  $id   = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
  $dest = $uploadDir . '/' . $id;

  if (!move_uploaded_file($tmp, $dest)) {
    json_response(['message' => 'Failed to move uploaded file'], 500);
  }

  // Retorna id para o front
  json_response(['id' => $id], 201);

} catch (Throwable $e) {
  json_response(['error' => 'Server error', 'message' => $e->getMessage()], 500);
}
