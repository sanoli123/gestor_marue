<?php
// desabilita cache do HTML
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// tenta servir os assets de /dist
$assetBase = __DIR__ . '/assets';
$indexHtml = __DIR__ . '/index.html';
if (!file_exists($indexHtml)) {
  http_response_code(500);
  echo "index.html não encontrado. Publique a pasta dist dentro de /gestor-marue.";
  exit;
}
$html = file_get_contents($indexHtml);

// injeta a BASE da API
$inject = <<<HTML
  <script>
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.API_BASE_URL = '/gestor-marue/api';
  </script>
HTML;
$html = preg_replace('/(<head[^>]*>)/i', '$1' . "\n" . $inject, $html, 1);

// força caminhos relativos a apontarem para /gestor-marue/
$html = str_replace(' href="/', ' href="/gestor-marue/', $html);
$html = str_replace(' src="/',  ' src="/gestor-marue/',  $html);

echo $html;
