function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyOffset(seed: string, limit: number, maxPages = 30) {
  const dayKey = getLocalDayKey();
  const windowSize = Math.max(1, limit * maxPages);
  const hash = hashString(`${seed}:${dayKey}`);
  const base = hash % windowSize;
  return Math.floor(base / limit) * limit;
}

export function getPagedOffset(baseOffset: number, page: number, limit: number, maxPages = 30) {
  const windowSize = Math.max(1, limit * maxPages);
  const next = baseOffset + page * limit;
  return ((next % windowSize) + windowSize) % windowSize;
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function createSalt() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    return `${bytes[0].toString(16)}${bytes[1].toString(16)}`;
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

export function getMixSalt(feedKey: string) {
  const storage = getStorage();
  if (!storage) return createSalt();
  const key = `pulsefy_mix_salt_${feedKey}`;
  const current = storage.getItem(key);
  if (current) return current;
  const next = createSalt();
  storage.setItem(key, next);
  return next;
}

export function refreshMixSalt(feedKey: string) {
  const storage = getStorage();
  const next = createSalt();
  if (storage) {
    storage.setItem(`pulsefy_mix_salt_${feedKey}`, next);
  }
  return next;
}
