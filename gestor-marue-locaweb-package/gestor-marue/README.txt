Gestor Maruê – pacote pronto para Locaweb (PHP 8.3 + MySQL)
Data: 2025-09-13T19:27:53

1) Upload
- Envie a pasta "gestor-marue" inteira para dentro de public_html/ do seu domínio (www.brquest.com.br).
  Fica assim:
  public_html/
    gestor-marue/
      .htaccess      (SPA routing)
      schema.sql
      api/
        .htaccess
        bootstrap.php
        config.php
        db.php
        index.php
        endpoints/
          health.php
          items.php

2) Banco MySQL
- No phpMyAdmin do DB "gestormarue", execute o conteúdo de schema.sql para criar a tabela items.

3) Configurar senha
- Edite gestor-marue/api/config.php no servidor e coloque a sua senha no $DB_PASS.

4) Testes
- Health: https://www.brquest.com.br/gestor-marue/api/health
- Itens:  https://www.brquest.com.br/gestor-marue/api/items
- Criar item (exemplo):
  curl -X POST "https://www.brquest.com.br/gestor-marue/api/items" -H "Content-Type: application/json" -d '{"name":"Café Maruê","qty":10}'

5) Front-end (Vite/React)
- Faça o build do seu app com base "/gestor-marue/":
  no vite.config.ts:
    export default defineConfig({ base: '/gestor-marue/' });
- Publique os arquivos do build (dist/*) dentro de public_html/gestor-marue/
- O .htaccess já cuida do SPA routing.
- API base: https://www.brquest.com.br/gestor-marue/api

6) Segurança
- O .htaccess da API protege config.php e db.php contra acesso direto.
- Em produção, ajuste o CORS em api/bootstrap.php para permitir só https://www.brquest.com.br

Bom deploy!