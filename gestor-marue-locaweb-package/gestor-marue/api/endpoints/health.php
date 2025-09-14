<?php
json_response([
  'ok' => true,
  'driver' => 'pdo_mysql',
  'php' => PHP_VERSION,
  'time' => date('c')
]);