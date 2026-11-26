/**
 * Frontend runtime configuration.
 *
 * Keep apiBaseUrl empty when the frontend and API share the same origin.
 * For a separately hosted API, set the absolute HTTPS API origin here, e.g.
 * https://api.example.com. A value injected by the hosting page is preserved.
 */
(function configureBenamFrontend(window) {
  if (!window) return;
  window.APP_CONFIG = window.APP_CONFIG || {};
  if (typeof window.APP_CONFIG.apiBaseUrl !== "string") {
    window.APP_CONFIG.apiBaseUrl = "";
  }
  // Static preview stays fast and does not issue requests to nonexistent API
  // routes. Enable this explicitly when the backend endpoints are deployed.
  if (typeof window.APP_CONFIG.apiEnabled !== "boolean") {
    window.APP_CONFIG.apiEnabled = false;
  }
})(typeof window !== "undefined" ? window : null);
