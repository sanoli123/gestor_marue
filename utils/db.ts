// src/utils/db.ts

const API_BASE_URL = '/gestor-marue/api';

type Json = Record<string, unknown> | unknown[];

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData
      ? {} // FormData deixa o browser setar boundary
      : { 'Content-Type': 'application/json' }),
    ...(options.headers ?? {}),
  };

  const resp = await fetch(url, { ...options, headers });

  // tenta decodificar JSON mesmo em erro
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    // ignora
  }

  if (!resp.ok) {
    throw new Error(
      `API ${resp.status} – ${JSON.stringify(
        data ?? { error: 'Unknown error' }
      )}`
    );
  }

  return data as T;
}

// GET collection
export async function getAll<T>(resource: string): Promise<T[]> {
  return request<T[]>(`${resource}`);
}

// GET by id
export async function getById<T>(
  resource: string,
  id: string | number
): Promise<T> {
  return request<T>(`${resource}/${id}`);
}

// POST create
export async function add<T extends Json>(
  resource: string,
  payload: unknown
): Promise<any> {
  return request<any>(`${resource}`, {
    method: 'POST',
    body:
      payload instanceof FormData ? (payload as FormData) : JSON.stringify(payload),
  });
}

// PUT update (EXIGE id → /resource/:id)
export async function update<T extends { id: string | number }>(
  resource: string,
  payload: T
): Promise<T> {
  const id = payload.id;
  if (id === undefined || id === null) {
    throw new Error(`update("${resource}") requer payload com "id"`);
  }
  return request<T>(`${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// PUT/POST em massa (quando o backend tiver uma rota apropriada)
export async function updateAll<T>(resource: string, payload: T): Promise<void> {
  await request<void>(`${resource}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// DELETE /resource/:id
export async function remove(resource: string, id: string | number): Promise<void> {
  await request<void>(`${resource}/${id}`, { method: 'DELETE' });
}

// Upload de imagem → POST /upload (retorna { id: string })
export async function uploadImage(file: File): Promise<{ id: string }> {
  const form = new FormData();
  form.append('file', file);
  return request<{ id: string }>('upload', {
    method: 'POST',
    body: form,
  });
}
