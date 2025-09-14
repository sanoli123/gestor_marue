import { RawMaterial, FinishedProduct, Sale, Cost, DREItem, DREData, SKUConfig, StoredImage } from '../types.ts';

// --- REAL API CLIENT ---
// This file contains functions to communicate with a real backend API.
// It uses the Fetch API to make network requests to standard REST endpoints.

// The base URL for the API should be provided via an environment variable.
// In a real deployment (e.g., on Vercel, Netlify), you would set this variable.
const API_BASE_URL = (window as any).process?.env?.API_BASE_URL || '/api';

/**
 * A wrapper around the fetch API to handle common tasks like setting headers,
 * handling JSON, and consistent error handling.
 * @param endpoint The API endpoint to call (e.g., '/products').
 * @param options The standard RequestInit options for fetch.
 * @returns The JSON response from the API.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Try to parse a JSON error message from the backend, otherwise use a generic message.
    const errorInfo = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
    throw new Error(errorInfo.message || `API request failed with status ${response.status}`);
  }

  // Handle responses with no content (e.g., a successful DELETE request)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}


// --- EXPORTED API FUNCTIONS ---

export const getAll = <T>(resource: string): Promise<T[]> => {
    return apiFetch(`/${resource}`);
};

export const getById = <T>(resource: string, id: string): Promise<T | undefined> => {
    return apiFetch(`/${resource}/${id}`);
};

export const add = <T extends { id?: string }>(resource: string, item: Omit<T, 'id'>): Promise<T> => {
    return apiFetch(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(item),
    });
};

export const update = <T extends { id?: string }>(resource: string, item: T): Promise<T> => {
     // For a singleton resource like skuConfig, the ID is known.
    const id = item.id || 'singleton';
    return apiFetch(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(item),
    });
};

export const remove = (resource: string, id: string): Promise<void> => {
    return apiFetch(`/${resource}/${id}`, {
        method: 'DELETE',
    }).then(() => {}); // Ensure it resolves to void
};

export const updateAll = <T>(resource: string, items: T[]): Promise<T[]> => {
    return apiFetch(`/${resource}`, {
        method: 'PUT', // Using PUT to replace the entire collection
        body: JSON.stringify(items),
    });
}

// --- Image specific functions ---
export const uploadImage = async (file: File): Promise<{ id: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorInfo = await response.json().catch(() => ({ message: 'Image upload failed.' }));
        throw new Error(errorInfo.message);
    }
    return response.json(); // Expects a response like { id: 'new-image-id' }
};

export const getImageBlob = async(id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/images/${id}`);
     if (!response.ok) {
        throw new Error('Image not found or failed to load.');
    }
    return response.blob();
}