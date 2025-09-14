<?php
// Evita cache agressivo enquanto ajustamos
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$indexHtml = __DIR__ . '/index.html';
if (!file_exists($indexHtml)) {
  http_response_code(500);
  echo "index.html não encontrado em /gestor-marue/. Publique a pasta dist.";
  exit;
}

$html = file_get_contents($indexHtml);

// Injeta a base da API que o app vai usar
$inject = <<<HTML
  <script>
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.API_BASE_URL = '/gestor-marue/api';
  </script>
HTML;

// injeta logo após a abertura do <head>
$html = preg_replace('/(<head[^>]*>)/i', '$1' . "\n" . $inject, $html, 1);

// garante que caminhos absolutos virem /gestor-marue/...
$html = str_replace(' href="/', ' href="/gestor-marue/', $html);
$html = str_replace(' src="/',  ' src="/gestor-marue/',  $html);

echo $html;
