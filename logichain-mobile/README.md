# LogiChain Mobile — Application terrain (React Native + Expo + TypeScript)

Application mobile offline-first pour les agents de terrain et prestataires
de la plateforme LogiChain, conforme à la Partie 2 du cahier des charges
(architecture N-Tier côté client, Optimistic UI, mode dégradé).

## Choix technique

Conformément à la spécification technique explicite du document (section 3,
Partie 2) : **React Native**, stockage local **SQLite** (via `expo-sqlite`),
consommation de l'API REST LogiChain avec **JWT** et **Server-Sent Events**
pour les alertes temps réel.

> Le schéma d'architecture du document 1 (Partie 1) mentionnait une PWA
> (Workbox/IndexedDB) ; le document 2, plus détaillé et dédié au front-end,
> impose explicitement React Native + SQLite. C'est ce dernier qui a été
> suivi ici.

## Architecture (N-Tier appliqué au client)

```
src/
├── types/dtos.ts          # Typage fort, aligné sur les schémas de l'API
├── types/shims.d.ts        # Déclarations minimales pour tsc (voir note plus bas)
├── config/env.ts
├── db/
│   ├── db.ts                # Connexion SQLite (singleton)
│   └── schema.ts             # Tables locales (items, queued_actions)
├── services/                 # Logique métier + accès données (API / SQLite)
│   ├── ApiClient.ts           # fetch + JWT + intercepteur de rafraîchissement
│   ├── SecureStorage.ts        # Stockage sécurisé des tokens (Keychain/Keystore)
│   ├── AuthService.ts
│   ├── ItemService.ts          # Cache local + Optimistic UI (agents)
│   ├── SyncQueueService.ts     # File d'attente offline + rejeu à la reconnexion
│   ├── AlertsService.ts        # Client SSE (alertes critiques)
│   ├── EventAdminService.ts    # Config événement + zones (admin)
│   └── RouteAdminService.ts    # Supervision feuilles de route (admin)
├── hooks/                     # Pont entre Services et Views
│   ├── AuthContext.tsx / useAuth.ts
│   ├── useItems.ts, useScan.ts, useAnomaly.ts          (agents)
│   ├── useSyncQueue.ts, useNetworkStatus.ts, useAlerts.ts
│   ├── useEvents.ts, useEventDashboard.ts               (admin)
│   ├── useZones.ts, useRoutesAdmin.ts                    (admin)
├── screens/                    # Views : rendu + capture d'événements UNIQUEMENT
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx      # Agent : tâches, alertes, statut de synchro
│   ├── ScanScreen.tsx            # Agent : module de scan (caméra + haptique)
│   ├── ItemDetailScreen.tsx      # Agent : déclaration d'anomalie
│   ├── SyncCenterScreen.tsx       # Agent : file d'attente, conflits, sync manuelle
│   ├── AdminEventListScreen.tsx     # Admin : liste des événements
│   ├── AdminEventFormScreen.tsx      # Admin : configuration globale (création)
│   ├── AdminEventHubScreen.tsx        # Admin : point d'entrée par événement
│   ├── AdminDashboardScreen.tsx        # Admin : KPI (stock, carbone, goulots)
│   ├── AdminZonesScreen.tsx             # Admin : découpage cartographique
│   └── AdminRoutesScreen.tsx             # Admin : supervision feuilles de route
├── components/                  # Composants réutilisables, purement présentationnels
└── navigation/RootNavigator.tsx   # Bascule Terrain/Admin selon le rôle connecté
```

**Règle strictement appliquée** : aucun écran (`screens/`) n'appelle `fetch`,
`expo-sqlite` ou `expo-location` directement — tout passe par `services/` ou
`hooks/`. C'est vérifiable fichier par fichier : les seuls `import` d'API
natives (SQLite, camera, location, secure-store, netinfo) se trouvent dans
`db/`, `services/` et `hooks/`.

## Fonctionnalités implémentées (Agents de terrain & Prestataires)

- **Authentification et onboarding** : connexion JWT, tokens en stockage
  sécurisé, téléchargement initial du référentiel d'items assignés
  (`ItemService.refreshFromApi`).
- **Dashboard opérationnel** (`DashboardScreen`) : visualisation immédiate
  des tâches prioritaires (`useMyTasks`, à faire/en cours), de
  l'itinéraire (`ItineraryMapView` — carte Leaflet/OpenStreetMap affichant
  les zones et arrêts de feuille de route, données GeoJSON), des alertes,
  puis des équipements assignés.
- **Module de scan** : caméra (QR/Code-barres), **sélecteur d'étape**
  (livraison / déplacement / maintenance / retour — chaque scan envoie
  désormais l'action réellement choisie, plus une action figée), anti-rebond
  pour le scan en rafale, retour haptique de validation, raccourci direct
  vers la déclaration d'anomalie depuis l'écran de scan.
- **Mon planning** (`MyPlanningScreen`) : consultation des étapes de
  livraison assignées (feuille de route dont l'agent/transporteur est le
  destinataire), ordonnées, avec horaires prévus et statut de validation
  — `GET /routes/mine`, plus une carte de l'itinéraire.
- **Mes scans** (`MyScanHistoryScreen`) : historique de tous les scans
  réalisés par l'agent (livraison, déplacement, maintenance, retour,
  anomalie), filtrable par type, avec **possibilité d'annuler un scan
  erroné** — l'entrée reste visible (marquée « annulé », traçabilité
  conservée), le statut de l'équipement est automatiquement recalculé à
  partir des actions valides restantes.
- **Mode dégradé transparent** : `SyncQueueService` empile scans et
  anomalies en SQLite quand le réseau est indisponible ; l'UI reflète
  immédiatement le résultat (Optimistic UI).
- **Centre de synchronisation** : file d'attente visible, déclenchement
  manuel, distinction conflit (409, verrouillage optimiste API) / échec
  réseau / échec définitif.
- **Alertes temps réel + notifications locales** : abonnement SSE par
  événement (`/api/v1/events/:eventId/alerts/stream`), affichées en
  bannière ; une notification locale avec sonnerie système par défaut est
  déclenchée à l'affectation d'une tâche ou d'un équipement
  (`NotificationService`, voir limitation ci-dessous).
- **Mes tâches** (`MyTasksScreen`) : consultation des tâches assignées par
  l'administrateur/responsable logistique, mise à jour rapide du statut
  (« Démarrer », « Marquer terminée »), protégée contre le double-tap —
  `GET /tasks/mine`, `PATCH /tasks/:id/status`.

## Fonctionnalités implémentées (Administrateurs & Responsables logistiques)

L'app détecte le rôle de l'utilisateur connecté (`admin` /
`responsable_logistique`) et bascule automatiquement vers une navigation
dédiée (`RootNavigator`, pas de branche offline-first ici : ce profil
suppose une connectivité réseau, contrairement aux agents de terrain).

- **Tableau de bord KPI** (`AdminDashboardScreen`) : état des stocks par
  statut, empreinte carbone consolidée, détection des goulots
  d'étranglement — consomme `GET /events/:eventId/dashboard`.
- **Configuration globale de l'événement** (`AdminEventListScreen` +
  `AdminEventFormScreen`) : liste et création d'événements (nom, type,
  dates).
- **Découpage cartographique des zones** (`AdminZonesScreen`) : carte
  interactive (`ZoneMapPicker`, Leaflet + tuiles OpenStreetMap dans une
  WebView — **aucune clé API Google/Apple requise**, contrairement à
  `react-native-maps`). Un tap sur la carte place un sommet du polygone ;
  les zones existantes de l'événement s'affichent en superposition —
  `POST /events/:eventId/zones`.
- **Supervision des transferts de responsabilité et validation des
  feuilles de route** (`AdminRoutesScreen`) : validation par arrêt
  (transfert de responsabilité) et validation de la feuille de route
  entière.
- **Attribution de tâches** (`AdminTasksScreen`) : créer et assigner une
  tâche (titre, description) à un agent de terrain ou un transporteur,
  suivi du statut par tâche — `POST /events/:eventId/tasks`,
  `GET /events/:eventId/tasks`.
- **Affectation d'équipements** (`AdminItemsScreen`) : lier un équipement
  à un agent de terrain ou un transporteur (ou le désaffecter) —
  `PATCH /items/:id/assign`. L'agent reçoit une notification locale à
  l'affectation (même mécanisme que pour les tâches).
- **Historique des scans** (`AdminScanHistoryScreen`) : historique complet
  des scans de l'événement (livraison, déplacement, maintenance, retour,
  anomalie), filtrable par **agent**, **équipement**, **zone
  géographique** (test point-dans-polygone contre les zones GeoJSON de
  l'événement) et **type de scan**, filtres combinables, avec
  possibilité d'annuler un scan (même mécanisme que côté agent) —
  `GET /events/:eventId/scan-history`, `PATCH /items/:id/scan-history/cancel`.

## Résolution des conflits de synchronisation

Le badge de statut de synchro (Dashboard) est cliquable et ouvre le Centre
de synchronisation. Une action en conflit (409, la donnée d'origine a
changé entretemps) ne peut pas se re-synchroniser automatiquement telle
quelle : elle reste visible avec son message d'erreur, et un bouton
**« Abandonner cette action »** permet de la retirer définitivement de la
file locale — c'est la résolution manuelle attendue pour ce type de
conflit (`SyncQueueService.remove`, exposé via `useSyncQueue.discardAction`).

L'état de la file de synchronisation est partagé entre tous les écrans via
`SyncQueueContext` (`SyncQueueProvider` enveloppe le `TerrainStack`) :
résoudre un conflit depuis le Centre de synchronisation met immédiatement
à jour le compteur affiché sur le Dashboard — chaque écran n'a plus sa
propre instance isolée de `useSyncQueue`.

Un nouveau scan ou une nouvelle anomalie déclenche aussi une tentative de
synchronisation immédiate (`requestSync()`, `src/lib/syncBus.ts`) si le
réseau est disponible, plutôt que d'attendre un changement d'état réseau
ou une synchronisation manuelle — sans quoi une action pouvait rester
invisible dans l'historique jusqu'à un appui explicite sur « Forcer la
synchronisation ».

## Optimistic UI et rollback

`ItemService.scanOptimistic` et `useAnomaly.declareAnomaly` appliquent le
changement d'état **localement et immédiatement**, avant toute réponse
serveur. La mise à jour réelle est empilée dans `SyncQueueService`. Si la
synchronisation renvoie un conflit de version (409), l'action reste visible
dans le centre de synchronisation avec le message d'erreur — `ItemService.
rollbackLocalStatus()` est disponible pour annuler visuellement l'état
optimiste si l'agent choisit d'abandonner l'action plutôt que de la
retenter.

## Typage fort de bout en bout

`src/types/dtos.ts` reprend exactement les schémas exposés par l'API
Node.js (`ItemDTO`, `EventDTO`, `AuthTokens`, `AlertDTO`...). Toute
modification du schéma back-end (ex. nouveau statut d'item) doit être
répercutée ici — le compilateur TypeScript (`npm run typecheck`) fait
alors apparaître tous les points d'incohérence dans l'app.

## Note sur `src/types/shims.d.ts`

Ce projet a été développé et vérifié dans un environnement sans simulateur
mobile ni toolchain native complète. `shims.d.ts` fournit des déclarations
de types minimales pour `react-native`, `expo-*`, `@react-navigation/*`,
etc., afin que `tsc --noEmit` puisse vérifier la cohérence interne du code
applicatif (services, hooks, DTOs) sans télécharger/compiler l'intégralité
de la toolchain native. **Une fois `npm install` exécuté dans un vrai
environnement Expo, ces shims sont automatiquement supplantés par les
véritables définitions de types fournies par chaque paquet** (TypeScript
donne toujours la priorité aux types réels du paquet installé). Le
typecheck a été validé avec succès (`npx tsc --noEmit` → 0 erreur) contre
ces shims comme premier filet de sécurité.

## QR codes de simulation

`npm run db:seed` (côté backend) insère 10 items dont les `qrCode` valent
`QR-ITEM-0001` à `QR-ITEM-0010`. Les images correspondantes (PNG + page
HTML imprimable `qrcodes-simulation.html`) sont fournies séparément :
imprime la page ou affiche-la sur un second écran, puis scanne-les avec
`ScanScreen` pour simuler des livraisons/déplacements sans matériel réel.

## Assets (icône, splash screen)

Le dossier `assets/` contient actuellement des **PNG transparents 1x1 en
placeholder** (`icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png`),
uniquement pour qu'Expo/Metro trouve un dossier `assets/` valide au
démarrage (son absence provoque une erreur `ENOENT scandir`). À remplacer
par les vrais visuels de LogiChain avant toute publication (recommandations
Expo : icône 1024×1024, splash 1284×2778 environ).

## Dépannage : "Network request failed"

Cette erreur signifie que le téléphone n'arrive pas à joindre l'API, presque
toujours pour l'une de ces raisons :

1. **Téléphone physique** : `src/config/env.ts` déduit automatiquement
   l'adresse IP de la machine de développement à partir de celle utilisée
   par Expo Go pour se connecter au bundler Metro (`Constants.expoConfig.
   hostUri`). Si ça échoue quand même, vérifie que :
   - le téléphone et le PC sont sur le **même réseau Wi-Fi** (pas de VLAN
     invité avec isolation client) ;
   - le pare-feu Windows autorise les connexions entrantes sur le port
     `3000` (Node.js) — sinon, ajoute une règle entrante pour `node.exe`
     ou pour le port 3000 dans le Pare-feu Windows Defender ;
   - le backend (`logichain-api`) tourne bien (`npm start`) au moment du test.
   - test rapide : ouvre `http://<IP-de-ton-PC>:3000/health` dans le
     navigateur du téléphone — si ça ne répond pas, le problème est réseau
     (pas dans l'app).
2. **Simulateur/émulateur** : `localhost` fonctionne pour iOS Simulator ;
   pour l'émulateur Android, `localhost` depuis l'app pointe vers
   l'émulateur lui-même — utiliser `10.0.2.2` à la place, ou laisser la
   détection automatique faire son travail (elle fonctionne aussi en
   émulateur).
3. **Build de production** (hors Expo Go/serveur de dev) : `Constants.
   expoConfig.hostUri` est alors `undefined` par construction (pas de
   bundler Metro) — modifier `PRODUCTION_API_URL` dans `src/config/env.ts`
   avec la vraie URL du backend deploye.

## Notifications : ce qui est couvert, et ce qui ne l'est pas

`NotificationService` déclenche une **notification locale avec le son
système par défaut** dès que le flux SSE (`useAlerts`) reçoit une alerte
`nouvelle_tache` ou `equipement_affecte`. Cela fonctionne tant que
l'application est active (premier plan, ou récemment mise en arrière-plan
avec la connexion SSE encore ouverte).

Ce n'est **pas** une vraie notification push délivrée par l'OS quand
l'application est totalement fermée — cela nécessiterait :
- un token Expo Push par appareil (`expo-notifications` en mode remote),
- un projet EAS (nécessite un compte Expo propre au projet, non
  disponible dans cet environnement de développement),
- un appel serveur à l'API Expo Push lors de la création de la tâche
  (`TaskService.createTask` publie déjà l'événement sur le hub temps
  réel : il suffirait d'y ajouter cet appel une fois le projet EAS
  configuré).

## Installation

```bash
npm install
npm run typecheck   # verification TypeScript
npm start            # lance Expo (necessite Expo Go ou un simulateur)
```

Modifier `src/config/env.ts` pour pointer vers l'URL de l'API backend
(`API_BASE_URL`).

## Non implémenté / simplifications assumées pour cette démonstration

- `ASSIGNED_EVENT_ID` est une constante en dur dans `DashboardScreen` (côté
  agent) ; en production, l'événement assigné à l'agent viendrait du
  payload JWT ou d'un écran de sélection après connexion.
- **Carte des zones sans tuiles hors-ligne** : `ZoneMapPicker` charge
  Leaflet et les tuiles depuis `unpkg.com`/`tile.openstreetmap.org` — un
  accès réseau est nécessaire pour afficher la carte (acceptable pour cet
  écran, réservé aux administrateurs qui disposent déjà d'une connexion
  pour appeler l'API). Pas de cache de tuiles pour un usage hors-ligne.
- Les feuilles de route sont créées côté API uniquement (pas d'écran de
  création dans l'app — `AdminRoutesScreen` couvre la supervision et la
  validation, pas la création initiale d'une feuille de route).
- Les taches n'ont pas de rappel/notification programmée (deadline
  `dueAt` stockée et affichable, mais pas de notification push liée à
  l'échéance dans cette itération).
- Les tests automatisés (Jest + React Native Testing Library) ne sont pas
  inclus dans cette itération, faute d'environnement d'exécution React
  Native disponible ici pour les faire tourner réellement. La cohérence
  TypeScript de l'ensemble (agents + admin) est en revanche vérifiée par
  `npm run typecheck` (0 erreur).
