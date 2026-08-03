const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
