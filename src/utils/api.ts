/**
 * Resilient API fetching utilities that safely handle warmup HTML,
 * 502/503 proxies, and non-JSON content-type responses without throwing.
 */

export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data as T;
    }
  } catch {
    // Network or warmup retry handled gracefully
  }
  return null;
}

export async function safeFetchText(url: string, options?: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, options);
    if (res.ok) {
      const text = await res.text();
      return text;
    }
  } catch {
    // Network or warmup retry handled gracefully
  }
  return null;
}
