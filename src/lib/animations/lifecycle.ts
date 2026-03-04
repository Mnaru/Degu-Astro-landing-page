const cleanups: (() => void)[] = [];

export function registerCleanup(fn: () => void) {
  cleanups.push(fn);
}

export function runAllCleanups() {
  while (cleanups.length) {
    try { cleanups.pop()!(); } catch (e) { console.warn('Cleanup error:', e); }
  }
}
