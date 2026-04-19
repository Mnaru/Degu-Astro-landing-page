interface CleanupEntry {
  fn: () => void;
  persistent: boolean;
}

const cleanups: CleanupEntry[] = [];

export function registerCleanup(
  fn: () => void,
  options?: { persistent?: boolean }
) {
  cleanups.push({ fn, persistent: options?.persistent ?? false });
}

// Runs cleanups. By default, runs ALL.
// With { keepPersistent: true }, runs only non-persistent ones — persistent
// cleanups stay registered so animations on persisted DOM keep working.
export function runAllCleanups(options?: { keepPersistent?: boolean }) {
  const keepPersistent = options?.keepPersistent ?? false;
  const remaining: CleanupEntry[] = [];
  while (cleanups.length) {
    const entry = cleanups.pop()!;
    if (keepPersistent && entry.persistent) {
      remaining.push(entry);
      continue;
    }
    try { entry.fn(); } catch (e) { console.warn('Cleanup error:', e); }
  }
  cleanups.push(...remaining);
}
