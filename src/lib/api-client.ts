// Simple REST API client for Cloudflare Pages Functions
const API_BASE = '/api';

function getToken() {
  try { return localStorage.getItem('private-desktop-token'); } catch { return null; }
}

function setToken(token: string | null) {
  try { if (token) localStorage.setItem('private-desktop-token', token); else localStorage.removeItem('private-desktop-token'); } catch { /* ignore */ }
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ====== AUTH ======
export async function register(username: string, password: string, name?: string) {
  return fetchApi('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) });
}

export async function login(username: string, password: string) {
  const data = await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data?.token) setToken(data.token);
  return data;
}

export async function getMe() {
  return fetchApi('/auth/me');
}

export function logoutApi() {
  setToken(null);
}

// ====== NOTES ======
export async function listNotes() {
  return fetchApi('/notes');
}

export async function createNote(note: any) {
  return fetchApi('/notes', { method: 'POST', body: JSON.stringify(note) });
}

export async function updateNote(itemId: string, updates: any) {
  return fetchApi(`/notes/${itemId}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteNote(itemId: string) {
  return fetchApi(`/notes/${itemId}`, { method: 'DELETE' });
}

// ====== RECIPES ======
export async function listRecipes() {
  return fetchApi('/recipes');
}

export async function createRecipe(recipe: any) {
  return fetchApi('/recipes', { method: 'POST', body: JSON.stringify(recipe) });
}

export async function updateRecipe(recipeId: string, updates: any) {
  return fetchApi(`/recipes/${recipeId}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteRecipe(recipeId: string) {
  return fetchApi(`/recipes/${recipeId}`, { method: 'DELETE' });
}

// ====== DESKTOP ITEMS ======
export async function listDesktopItems() {
  return fetchApi('/desktop-items');
}

export async function createDesktopItem(item: any) {
  return fetchApi('/desktop-items', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateDesktopItem(itemId: string, updates: any) {
  return fetchApi(`/desktop-items/${itemId}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteDesktopItem(itemId: string) {
  return fetchApi(`/desktop-items/${itemId}`, { method: 'DELETE' });
}

// Export token utilities
export { getToken, setToken };
