import Constants from 'expo-constants';

/**
 * URL de l'API en production (build standalone, pas de serveur de
 * developpement Metro) : a adapter avant publication.
 */
const PRODUCTION_API_URL = 'https://api.logichain.example.com/api/v1';

/** Port d'ecoute de l'API (voir PORT dans le .env du backend). */
const API_PORT = 3000;

/**
 * Secours manuel : renseigner ici l'IP locale de la machine de
 * developpement (celle affichee par `ipconfig`, ex. '192.168.1.23') si la
 * detection automatique ci-dessous echoue (frequent en mode tunnel Expo,
 * ou selon la version d'Expo Go). Laisser a null pour la detection auto.
 */
const MANUAL_DEV_HOST_OVERRIDE: string | null = null;

/**
 * Sur un appareil physique, "localhost" designe le telephone lui-meme, pas
 * la machine de developpement qui fait tourner l'API : c'est la cause la
 * plus frequente d'erreur "Network request failed". On deduit donc l'IP a
 * utiliser depuis l'adresse que le telephone utilise deja pour parler au
 * bundler Metro (hostUri, du type "192.168.1.23:8081"), plutot que de la
 * coder en dur. En mode tunnel (Expo utilise un domaine *.exp.direct au
 * lieu d'une IP locale), cette detection ne peut pas fonctionner pour un
 * port personnalise comme le 3000 : utiliser MANUAL_DEV_HOST_OVERRIDE.
 */
function resolveDevApiBaseUrl(): string | null {
  if (MANUAL_DEV_HOST_OVERRIDE) {
    return `http://${MANUAL_DEV_HOST_OVERRIDE}:${API_PORT}/api/v1`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;

  const host = hostUri.split(':')[0];
  if (!host || host.includes('exp.direct') || host.includes('ngrok')) {
    // Domaine de tunnel detecte : la detection auto ne peut pas donner une
    // IP locale valide pour notre port 3000, inutile de continuer.
    return null;
  }

  return `http://${host}:${API_PORT}/api/v1`;
}

export const API_BASE_URL = __DEV__
  ? resolveDevApiBaseUrl() ?? `http://localhost:${API_PORT}/api/v1`
  : PRODUCTION_API_URL;

if (__DEV__) {
  // Verifiable dans les logs Metro/Expo au demarrage de l'app : si cette
  // valeur ne correspond pas a l'IP de la machine de developpement,
  // renseigner MANUAL_DEV_HOST_OVERRIDE ci-dessus.
  console.log('[LogiChain] API_BASE_URL =', API_BASE_URL);
}
