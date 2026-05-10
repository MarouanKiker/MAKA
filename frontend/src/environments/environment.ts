/**
 * Dev : URLs relatives + proxy (`proxy.conf.json` → gateway :8000).
 * Évite les erreurs Http « status 0 » dues au CORS navigateur (4200 → 8000).
 * Prérequis : `docker compose up` dans `services/` pour que la gateway réponde.
 */
export const environment = {
  production: false,
  apiUrl: '',
  authApiUrl: '/api/auth',
};
