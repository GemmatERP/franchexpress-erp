// Module-level stats cache to avoid excessive Firestore reads
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedStats() {
  const now = Date.now();
  if (_cache && now - _cacheTs < CACHE_TTL_MS) {
    return _cache;
  }
  return null;
}

export function setCachedStats(data) {
  _cache = data;
  _cacheTs = Date.now();
}

export function invalidateStatsCache() {
  _cache = null;
  _cacheTs = 0;
}
