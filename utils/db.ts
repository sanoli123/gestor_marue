// src/utils/db.ts
// Único ponto de acesso à API (GET/POST/PUT/DELETE + upload).
// Em produção (Vercel) aponte VITE_API_BASE_URL para "/api".
// Na hospedagem atual, o fallback usa "/gestor-marue/api".

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/gestor-marue/api';

/** Helper de fetch que já monta a URL base e trata erros. */
async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  // Não setar Content-Type manualmente se o body for FormData
  const isFormData = opts.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers || {}),
  };

  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    // Tenta extrair uma mensagem útil
    let reason = res.statusText;
    try {
      const txt = await res.text();
      if (txt) reason = txt;
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status} - ${reason}`);
  }

  // Alguns endpoints (DELETE) podem não ter body
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  // @ts-expect-error – chamador sabe o que esperar
  return undefined as T;
}

/** Lista todos de uma coleção */
export function getAll<T>(collection: string) {
  return apiFetch<T[]>(`/${collection}`);
}

/** Busca item por id (ex.: getById('sku-config','singleton')) */
export function getById<T>(collection: string, id: string | number) {
  return apiFetch<T>(`/${collection}/${id}`);
}

/** Cria */
export function add<T>(
  collection: string,
  data: Record<string, any>
) {
  return apiFetch<T>(`/${collection}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza.
 * Se o objeto tiver `id`, manda em `/${collection}/{id}` (PUT REST clássico).
 * Se NÃO tiver `id`, faz PUT no collection root (útil para recursos "singleton", ex.: sku-config).
 */
export function update<T>(
  collection: string,
  data: Record<string, any>
) {
  const hasId = data && (data.id !== undefined && data.id !== null && data.id !== '');
  const path = hasId ? `/${collection}/${encodeURIComponent(String(data.id))}` : `/${collection}`;

  return apiFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Atualiza em lote (coleção inteira) – backend deve aceitar PUT no root da coleção */
export function updateAll<T>(
  collection: string,
  items: T[]
) {
  return apiFetch<T[]>(`/${collection}`, {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

/** Remove por id */
export function remove(
  collection: string,
  id: string | number
) {
  return apiFetch<void>(`/${collection}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
}

/** Upload de imagem – espera que o backend aceite POST /upload e responda { id: string } */
export async function uploadImage(file: File): Promise<{ id: string }> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ id: string }>(`/upload`, {
    method: 'POST',
    body: form,
  });
}

// Exporta a base (útil para debugar no console se quiser)
export { API_BASE_URL };
