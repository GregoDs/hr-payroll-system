const configuredBaseUrl = document.querySelector('meta[name="api-base-url"]')?.content;
export const API_BASE_URL = configuredBaseUrl || "http://localhost:3000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = new Error(body?.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return body?.data;
}
