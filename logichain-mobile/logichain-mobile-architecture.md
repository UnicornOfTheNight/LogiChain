# Arborescence du projet `logichain-mobile`

Ce document explique le rôle de chaque fichier du front React Native. Il
suit l'architecture en couches imposée par le cahier des charges :
**Views/Components** (rendu uniquement) → **Hooks** (pont React) →
**Services** (logique métier, accès API/SQLite). Aucun écran n'appelle
`fetch()` ou SQLite directement — c'est vérifiable fichier par fichier :
les seuls imports d'API natives (SQLite, caméra, localisation, stockage
sécurisé, réseau) se trouvent dans `db/`, `services/` et `hooks/`.

```
logichain-mobile/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    ├── config/
    ├── db/
    ├── services/
    ├── hooks/
    ├── components/
    ├── screens/
    └── navigation/
```

---

## Racine du projet

### `App.tsx`
Point d'entrée de l'application. Initialise le schéma SQLite
(`initSchema()`), demande la permission de notifications
(`NotificationService.requestPermissions()`), affiche un indicateur de
chargement tant que la base locale n'est pas prête, puis monte
`AuthProvider` (contexte d'authentification) et `RootNavigator`
(navigation). C'est le seul fichier qui orchestre le démarrage — il ne
contient aucune logique métier propre.

### `app.json`
Configuration Expo : nom de l'app, icône, splash screen, permissions
déclarées (caméra pour `expo-camera`, localisation pour
`expo-location`), plugins Expo actifs.

### `package.json`
Dépendances du projet et scripts (`npm start`, `npm run typecheck`).
Versions épinglées pour rester compatibles avec le SDK Expo utilisé.

### `tsconfig.json`
Configuration TypeScript en mode strict (`strict: true`,
`noImplicitAny: true`) : toute variable ou paramètre non typé fait
échouer la vérification (`npm run typecheck`).

---

## `src/types/` — Contrats de données

### `dtos.ts`
Tous les types TypeScript qui décrivent les données échangées avec
l'API : `ItemDTO`, `EventDTO`, `TaskDTO`, `RouteDTO`, `ScanHistoryEntryDTO`,
`AuthUser`, `AuthTokens`, etc. C'est le contrat de typage fort entre le
front et le back — toute évolution d'un schéma côté API doit être
répercutée ici. Contient aussi les types internes au mode hors-ligne
(`QueuedAction`, `SyncStatus`).

### `shims.d.ts`
Déclarations de types minimales pour les modules React Native/Expo
(`react-native`, `expo-sqlite`, `expo-camera`, `react-native-webview`,
etc.), utilisées uniquement pour que `tsc --noEmit` puisse vérifier la
cohérence du code applicatif sans télécharger toute la toolchain native.
Une fois `npm install` exécuté dans un vrai environnement Expo, les
vraies définitions de types des paquets prennent le dessus sur ces
shims automatiquement.

---

## `src/config/` — Configuration d'environnement

### `env.ts`
Détermine l'URL de l'API backend (`API_BASE_URL`). En développement,
déduit automatiquement l'adresse IP de la machine de développement à
partir de celle utilisée par Expo Go pour se connecter au bundler Metro
(`Constants.expoConfig.hostUri`), plutôt qu'une IP codée en dur —
évite l'erreur classique "Network request failed" sur un téléphone
physique où `localhost` désigne le téléphone lui-même. Prévoit un
secours manuel (`MANUAL_DEV_HOST_OVERRIDE`) et une URL de production
distincte.

---

## `src/db/` — Base de données locale (SQLite)

### `db.ts`
Point d'accès unique à la connexion SQLite (singleton). Aucun autre
fichier n'appelle `expo-sqlite` directement en dehors de `db.ts` et des
services qui en ont besoin.

### `schema.ts`
Crée les tables locales au démarrage si elles n'existent pas :
- `items` : cache local du référentiel matériel (pour le scan hors ligne)
- `queued_actions` : file d'attente des actions réalisées hors réseau
  (scan, déclaration d'anomalie), rejouées à la reconnexion

---

## `src/services/` — Logique métier et accès aux données

Chaque service encapsule un domaine fonctionnel. C'est la seule couche
autorisée à appeler `fetch` (via `ApiClient`) ou SQLite (via `db.ts`).

| Fichier | Rôle |
|---|---|
| `ApiClient.ts` | Client HTTP centralisé : ajoute automatiquement le token JWT à chaque requête, rafraîchit la session via le refresh token en cas de 401 (intercepteur). **Seul** point de contact avec `fetch()` dans toute l'app. |
| `SecureStorage.ts` | Wrapper autour d'`expo-secure-store` : stockage des tokens JWT dans le Keychain (iOS) / Keystore (Android). |
| `AuthService.ts` | Connexion, déconnexion, vérification de l'état de connexion. |
| `ItemService.ts` | Cache local des équipements (SQLite), téléchargement du référentiel depuis l'API, scan optimiste (met à jour le statut localement avant confirmation serveur), rollback en cas d'échec. |
| `SyncQueueService.ts` | File d'attente locale des actions hors ligne : empile, liste, synchronise vers l'API, gère les conflits de version. Verrou anti-concurrence (`syncing`) pour empêcher deux synchronisations simultanées. |
| `AlertsService.ts` | Client Server-Sent Events (SSE) : écoute le flux d'alertes temps réel de l'événement en cours. |
| `NotificationService.ts` | Déclenche une notification locale (avec son système) quand une alerte SSE de type "nouvelle tâche" ou "équipement affecté" arrive. |
| `TaskService.ts` | Consultation et mise à jour du statut de mes propres tâches (profil agent). |
| `RouteService.ts` | Consultation de mon planning de livraison assigné (profil agent/transporteur). |
| `ScanHistoryService.ts` | Historique de mes propres scans, annulation d'un scan (profil agent). |
| `EventAdminService.ts` | Gestion des événements côté admin : liste, création, zones, tableau de bord KPI. |
| `RouteAdminService.ts` | Supervision des feuilles de route côté admin : liste, validation d'arrêt, validation globale. |
| `TaskAdminService.ts` | Attribution de tâches côté admin : liste des utilisateurs assignables, création/liste des tâches d'un événement. |
| `ItemAdminService.ts` | Affectation d'équipements aux agents/transporteurs côté admin. |
| `ScanHistoryAdminService.ts` | Historique complet des scans d'un événement côté admin, avec filtres (agent/équipement/zone/type), annulation. |

---

## `src/hooks/` — Pont entre Services et Views

Chaque hook expose l'état et les actions dont un écran a besoin, sans
jamais exposer directement les détails d'implémentation (SQL, HTTP) —
ça reste dans les services.

| Fichier | Rôle |
|---|---|
| `useAuth.ts` / `AuthContext.tsx` | État d'authentification (utilisateur connecté, connexion, déconnexion). `AuthContext` partage une instance unique entre tous les écrans. |
| `useSyncQueue.ts` / `SyncQueueContext.tsx` | État de la file de synchronisation (actions en attente, statut, résolution de conflit). `SyncQueueContext` partage une instance unique entre le Dashboard et le Centre de synchronisation — sans lui, chaque écran avait son propre état isolé. |
| `useCurrentEvent.ts` | Détermine l'événement actif de l'agent en interrogeant l'API (au lieu d'un identifiant fictif codé en dur). |
| `useItems.ts` | Liste des équipements (cache local + synchronisation API au montage de l'écran). |
| `useScan.ts` | Logique du scan : géolocalisation, mise à jour optimiste locale, mise en file d'attente. |
| `useAnomaly.ts` | Déclaration d'anomalie : géolocalisation, mise à jour optimiste, mise en file. |
| `useNetworkStatus.ts` | Détecte si l'appareil est en ligne ou hors ligne (`@react-native-community/netinfo`). |
| `useAlerts.ts` | Abonnement au flux SSE + déclenchement des notifications locales. |
| `useMyTasks.ts` | Mes tâches assignées, mise à jour du statut, protection anti double-tap. |
| `useMyPlanning.ts` | Mon planning de livraison assigné. |
| `useMyScanHistory.ts` | Mon historique de scans, scans en attente de synchronisation, annulation. |
| `useEvents.ts` | Liste et création d'événements (profil admin). |
| `useEventDashboard.ts` | Tableau de bord KPI d'un événement (profil admin). |
| `useZones.ts` | Zones d'un événement, ajout d'une zone (profil admin). |
| `useAssignableUsers.ts` | Liste des agents/transporteurs assignables (profil admin). |
| `useAdminTasks.ts` | Tâches d'un événement, création/attribution (profil admin). |
| `useAdminItems.ts` | Équipements d'un événement, affectation à un utilisateur (profil admin). |
| `useRoutesAdmin.ts` | Feuilles de route d'un événement, validation d'arrêt/globale (profil admin). |
| `useScanHistoryAdmin.ts` | Historique de scans avec filtres combinables, annulation (profil admin). |
| `useItinerary.ts` | Zones + arrêts de feuilles de route d'un événement, pour la carte du Dashboard. |

---

## `src/lib/` — Utilitaires transverses

### `syncBus.ts`
Petit bus d'événements en mémoire : permet à n'importe quel service
(`ItemService`, `useAnomaly`) de demander une synchronisation immédiate
de la file d'attente sans dépendre directement du hook `useSyncQueue`.
Corrige un bug où une nouvelle action ajoutée à la file pendant que le
réseau était déjà disponible n'était jamais rejouée automatiquement.

---

## `src/components/` — Composants réutilisables (purement présentationnels)

Aucun composant n'appelle l'API ou SQLite : ils reçoivent leurs données
en props et remontent les interactions via des callbacks.

| Fichier | Rôle |
|---|---|
| `ItemCard.tsx` | Carte d'affichage d'un équipement dans une liste. |
| `SyncStatusBadge.tsx` | Badge de statut de synchronisation, cliquable (ouvre le Centre de synchronisation). |
| `AlertBanner.tsx` | Bannière d'alerte affichée en haut du Dashboard. |
| `ZoneMapPicker.tsx` | Carte interactive (Leaflet + OpenStreetMap dans une WebView) pour dessiner une zone en tapant ses sommets — sans clé API cartographique. |
| `ItineraryMapView.tsx` | Carte en lecture seule affichant zones et arrêts de feuille de route (Leaflet, même moteur que `ZoneMapPicker` sans l'interactivité de dessin). |

---

## `src/screens/` — Vues (rendu + capture d'événements uniquement)

### Profil Agents de terrain & Prestataires

| Fichier | Rôle |
|---|---|
| `LoginScreen.tsx` | Connexion (email/mot de passe). |
| `DashboardScreen.tsx` | Dashboard opérationnel : tâches prioritaires, itinéraire cartographique, alertes, équipements assignés. |
| `ScanScreen.tsx` | Module de scan : caméra QR/code-barres, sélecteur d'étape logistique. |
| `ItemDetailScreen.tsx` | Détail d'un équipement, déclaration d'anomalie. |
| `SyncCenterScreen.tsx` | Centre de synchronisation : file d'attente, résolution de conflits. |
| `MyTasksScreen.tsx` | Mes tâches assignées. |
| `MyPlanningScreen.tsx` | Mon planning de livraison. |
| `MyScanHistoryScreen.tsx` | Mon historique de scans, scans en attente, annulation. |

### Profil Administrateurs & Responsables logistiques

| Fichier | Rôle |
|---|---|
| `AdminEventListScreen.tsx` | Liste des événements, point d'entrée du profil admin. |
| `AdminEventFormScreen.tsx` | Création d'un événement (configuration globale). |
| `AdminEventHubScreen.tsx` | Point d'entrée des espaces de gestion d'un événement (menu). |
| `AdminDashboardScreen.tsx` | Tableau de bord KPI (stocks, empreinte carbone, goulots). |
| `AdminZonesScreen.tsx` | Découpage cartographique des zones (carte interactive). |
| `AdminRoutesScreen.tsx` | Supervision des feuilles de route, validation des transferts. |
| `AdminTasksScreen.tsx` | Attribution de tâches aux agents/transporteurs. |
| `AdminItemsScreen.tsx` | Affectation d'équipements aux agents/transporteurs. |
| `AdminScanHistoryScreen.tsx` | Historique des scans avec les 4 filtres (agent, équipement, zone, type). |

---

## `src/navigation/` — Routage

### `RootNavigator.tsx`
Point d'entrée de la navigation. Bascule automatiquement entre trois
états selon le profil connecté :
- non connecté → `LoginScreen`
- `admin` / `responsable_logistique` → `AdminStack` (navigation admin)
- `agent_terrain` / `transporteur` → `TerrainStack` (navigation terrain),
  enveloppée dans `SyncQueueProvider` pour partager l'état de
  synchronisation entre tous les écrans de ce profil

Définit aussi les types de paramètres de navigation
(`TerrainStackParamList`, `AdminStackParamList`) pour un typage fort des
routes et de leurs paramètres.

---

## Résumé du flux de données

```
Écran (screens/)
   │  appelle un hook, jamais un service directement
   ▼
Hook (hooks/)
   │  appelle un ou plusieurs services, expose état + actions
   ▼
Service (services/)
   │  seul point de contact avec fetch()/SQLite/expo-*
   ▼
API backend  ◄──────────────►  SQLite local (db/)
```

Cette séparation stricte est ce qui permet, par exemple, à
`ItemService.scanOptimistic()` de fonctionner identiquement que le
réseau soit disponible ou non : le hook `useScan` qui l'appelle n'a
aucune idée de la façon dont la donnée est finalement persistée ou
synchronisée.
