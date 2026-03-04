// MySQL-backed version: browser no longer runs a local database.
// This file just signals "ready" so existing pages can bootstrap.

(function markDbReady() {
  window.dbReady = true;
  if (typeof window.onDbReady === 'function') {
    window.onDbReady();
  }
})();

