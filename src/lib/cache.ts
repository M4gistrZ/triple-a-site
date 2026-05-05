const cache: Record<string, { data: unknown; timestamp: number }> = {};
const TTL = 30_000;

export async function cachedFetch<T>(url: string): Promise<T | null> {
  const entry = cache[url];
  if (entry && Date.now() - entry.timestamp < TTL) {
    return entry.data as T;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    cache[url] = { data, timestamp: Date.now() };
    return data as T;
  } catch {
    return null;
  }
}

export function invalidateCache(url: string) {
  delete cache[url];
}

export function clearCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
