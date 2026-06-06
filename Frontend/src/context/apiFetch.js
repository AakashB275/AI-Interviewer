const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Attach the stored token to every fetch call automatically.
// apiFetch('/api/auth/me') identical to fetch() but with auth header.
export function apiFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // If the caller didn't set Content-Type and isn't sending FormData,
  // default to JSON so we don't have to repeat it everywhere.
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // still send cookies when same-origin or sameSite=none
    headers
  });
}
