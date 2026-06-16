// Module-level stats cache to avoid excessive Firestore reads.
// TTL set to 30 minutes — data only changes during nightly sync.
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

// ── Role cache ────────────────────────────────────────────────────────────────
// Caches uid → role mappings for 60 seconds to avoid an extra Firestore read
// on every API request (getUserRole is called in multiple routes).
const _roleCache = new Map(); // uid → { role, ts }
const ROLE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function getCachedRole(uid) {
  const entry = _roleCache.get(uid);
  if (entry && Date.now() - entry.ts < ROLE_CACHE_TTL_MS) {
    return entry.role;
  }
  return null;
}

export function setCachedRole(uid, role) {
  _roleCache.set(uid, { role, ts: Date.now() });
}

// ── Revenue stats cache ───────────────────────────────────────────────────────
// Keyed by "fromDate|toDate" string. 10-minute TTL.
const _revenueCache = new Map();
const REVENUE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCachedRevenue(key) {
  const entry = _revenueCache.get(key);
  if (entry && Date.now() - entry.ts < REVENUE_CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

export function setCachedRevenue(key, data) {
  _revenueCache.set(key, { data, ts: Date.now() });
}

