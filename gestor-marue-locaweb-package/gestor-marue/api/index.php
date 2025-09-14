<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/db.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$basePath = rtrim($scriptName, '/');
$path = $uri;
if ($basePath !== '' && $basePath !== '/') {
  if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
  }
}
$path = '/' . ltrim($path, '/');

switch (true) {
  case $path === '/' || $path === '/health':
    require __DIR__ . '/endpoints/health.php';
    break;
  case preg_match('#^/items(?:/(\d+))?$#', $path, $m):
    require __DIR__ . '/endpoints/items.php';
    break;
  default:
    json_response(['error' => 'Not found', 'path' => $path], 404);
}