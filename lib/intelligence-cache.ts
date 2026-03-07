// Server-side cache for cross-site API calls
// Prevents re-fetching on every page load
// TTL-based: data refreshes after expiry

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
}

class IntelligenceCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private hits = 0;
  private misses = 0;

  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const existing = this.store.get(key) as CacheEntry<T> | undefined;
    if (existing && Date.now() < existing.expiresAt) {
      this.hits++;
      return existing.data;
    }

    // Deduplicate concurrent requests for the same key
    const pending = this.inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    this.misses++;
    const promise = fetcher()
      .then((data) => {
        this.store.set(key, {
          data,
          fetchedAt: Date.now(),
          expiresAt: Date.now() + (ttl ?? this.defaultTTL),
        });
        this.inflight.delete(key);
        return data;
      })
      .catch((error) => {
        this.store.delete(key);
        this.inflight.delete(key);
        throw error;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }

  getStats(): { entries: number; hits: number; misses: number } {
    return { entries: this.store.size, hits: this.hits, misses: this.misses };
  }
}

export const intelligenceCache = new IntelligenceCache();
