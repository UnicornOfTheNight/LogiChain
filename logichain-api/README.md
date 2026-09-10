# LogiChain API

Implémentation de la partie **base de données MongoDB** et **API REST** du projet
LogiChain (LA MANU), en respectant les contraintes du cahier des charges :
POO obligatoire, architecture N-Tier stricte (Entity → Repository → Service →
Controller), REST niveau 2 de Richardson, verrouillage optimiste pour le mode
déconnecté.

## Choix technique : une seule dépendance npm

Ce projet n'utilise **aucun framework** (pas d'Express, pas de Mongoose, pas de
cors/helmet). La seule dépendance externe est `mongodb`, le **driver officiel**
publié et maintenu directement par MongoDB Inc. — il n'existe pas d'alternative
sans dépendance pour parler au protocole binaire MongoDB depuis Node.js.

Tout le reste est réécrit en JavaScript natif :
- Serveur HTTP : module `http` intégré à Node.js (pas d'Express)
- Routing : petit routeur maison (`src/lib/Router.js`)
- Variables d'environnement : mini-chargeur `.env` maison (`src/lib/loadEnv.js`, pas de `dotenv`)
- En-têtes de sécurité et CORS : appliqués à la main (pas de `helmet`/`cors`)
- Entités : classes JS pures avec validation manuelle (pas de Mongoose)

**Réduction de la surface d'attaque** : ~12 paquets installés au total (le driver
`mongodb` + ses dépendances transitives), contre plusieurs dizaines avec la stack
Express/Mongoose/cors/helmet/dotenv.

### Installer la dépendance en limitant les risques

Un `package-lock.json` figé est fourni dans ce projet, avec le hash d'intégrité
SHA de chacun des 12 paquets de l'arbre de dépendances (`mongodb` + ses
dépendances transitives). Pour une installation qui vérifie strictement ces
empreintes plutôt que de re-résoudre les versions :

```bash
npm ci --ignore-scripts   # installe EXACTEMENT les versions du lockfile, verifie leur integrite, sans scripts postinstall
```

Autres bonnes pratiques recommandées :
- Committer `package-lock.json` et utiliser `npm ci` (jamais `npm install`) en CI/déploiement, pour installer exactement les versions verrouillées.
- Garder la version de `mongodb` épinglée en dur dans `package.json` (`"6.8.0"`, sans `^`) plutôt qu'une plage de versions — évite une mise à jour automatique vers une version compromise.
- Lancer `npm audit` avant toute mise à jour manuelle de la dépendance.
- Ne jamais lancer `npm install` avec des privilèges root/administrateur.

## Structure du projet

```
logichain-api/
├── src/
│   ├── config/database.js        # Connexion MongoDB (driver natif)
│   ├── lib/
│   │   ├── Router.js              # Routeur maison (remplace express.Router)
│   │   ├── http.js                # Lecture JSON + réponses (remplace express/helmet)
│   │   └── loadEnv.js             # Chargeur .env maison (remplace dotenv)
│   ├── models/                    # Couche Entity (classes POO, validation manuelle)
│   │   ├── Event.js
│   │   ├── Item.js
│   │   ├── Route.js
│   │   └── Monitoring.js          # Collection Time Series
│   ├── repositories/              # Couche Repository (SEULE à importer 'mongodb')
│   │   ├── BaseRepository.js      # Classe abstraite (CRUD générique)
│   │   ├── EventRepository.js
│   │   ├── ItemRepository.js      # + agrégations KPI, empreinte carbone, goulots
│   │   ├── RouteRepository.js
│   │   └── MonitoringRepository.js
│   ├── services/                  # Couche Service (logique métier, indépendante d'HTTP)
│   │   ├── EventService.js
│   │   ├── ItemService.js
│   │   ├── RouteService.js
│   │   ├── CarbonFootprintService.js
│   │   └── DashboardService.js
│   ├── controllers/                # Couche Controller (reçoit ctx: {params, body, query})
│   ├── routes/index.js             # Toutes les routes REST (URLs basées ressources)
│   ├── middlewares/errorHandler.js
│   ├── app.js                      # Serveur http natif + routing
│   └── server.js
└── scripts/
    ├── createCollections.js       # Création des collections + validation + index
    └── seedData.js                 # Insertion d'un jeu de données de démonstration
```

Un dossier `tests/` (à la racine) contient la suite de tests natifs (`node --test`).

## Installation

```bash
npm install --ignore-scripts
cp .env.example .env   # puis adapter MONGODB_URI si besoin
```

## Initialisation de la base de données

```bash
npm run db:create   # crée les collections avec $jsonSchema + index (2dsphere, composés, uniques)
npm run db:seed      # insère un événement, des items, une feuille de route, du monitoring, 10 utilisateurs de démo
```

### Comptes de démonstration créés par `npm run db:seed`

Mot de passe commun : `MotDePasse123`

| Rôle | Emails |
|---|---|
| `admin` | `admin1@logichain.test`, `admin2@logichain.test` |
| `responsable_logistique` | `respo1@logichain.test`, `respo2@logichain.test`, `respo3@logichain.test` |
| `agent_terrain` | `agent1@logichain.test`, `agent2@logichain.test`, `agent3@logichain.test` |
| `transporteur` | `transporteur1@logichain.test`, `transporteur2@logichain.test` |

⚠️ Mot de passe partagé et identifiants prévisibles : uniquement pour du
développement local, jamais pour un environnement partagé ou déployé.

## Lancement de l'API

```bash
npm run dev          # ou npm start
```

L'API écoute par défaut sur `http://localhost:3000/api/v1`.

## Tests

```bash
npm test   # node --test : test runner natif de Node.js, zero dependance
```

23 tests couvrent le routeur maison, les utilitaires HTTP (parsing JSON, envoi de
reponses), le chargeur `.env` et la validation des entites (`Event`, `Item`, `Route`,
`Monitoring`). Ces tests ne necessitent pas de connexion MongoDB — ils ciblent la
logique qui remplace Express/Mongoose/dotenv. La couche Repository (qui, elle,
depend reellement de MongoDB) n'est pas couverte ici faute d'instance disponible ;
elle peut etre testee manuellement une fois connectee a une base via
`npm run db:create && npm run db:seed`.

## Endpoints principaux

| Méthode | URL                                                          | Description                                  |
|---------|-----------------------------------------------------------------|-----------------------------------------------|
| POST    | `/api/v1/events`                                                  | Créer un événement                            |
| GET     | `/api/v1/events`                                                   | Lister les événements                         |
| GET     | `/api/v1/events/:id`                                               | Détail d'un événement                         |
| PATCH   | `/api/v1/events/:id/status`                                        | Changer le statut (verrouillage optimiste)    |
| POST    | `/api/v1/events/:eventId/items`                                   | Créer un item rattaché à l'événement          |
| GET     | `/api/v1/events/:eventId/items?status=en_stock`                  | Lister/filtrer les items d'un événement       |
| GET     | `/api/v1/items/:id`                                                | Détail d'un item                              |
| POST    | `/api/v1/items/scan`                                               | Scan QR/Barcode par un agent                  |
| PATCH   | `/api/v1/items/:id/anomalie`                                       | Déclarer une anomalie géolocalisée            |
| PATCH   | `/api/v1/items/:id/assign`                                         | Affecter un équipement à un agent/transporteur (admin, `userId: null` pour désaffecter) |
| GET     | `/api/v1/events/:eventId/scan-history?agentId=&itemId=&action=&zoneId=` | Historique des scans, filtres combinables (admin) |
| GET     | `/api/v1/scan-history/mine?action=`                                | Mon historique de scans (agent/transporteur) |
| PATCH   | `/api/v1/items/:id/scan-history/cancel`                            | Annuler un scan (identifié par `action`+`timestamp`), statut recalculé automatiquement |
| GET     | `/api/v1/events/:eventId/items?assignedTo=<userId>`                | Filtrer les items par utilisateur assigné     |
| POST    | `/api/v1/events/:eventId/routes`                                   | Créer une feuille de route                    |
| GET     | `/api/v1/events/:eventId/routes`                                   | Lister les feuilles de route                  |
| PATCH   | `/api/v1/events/:eventId/routes/:id/stops/:stopId/validate`      | Valider un arrêt (transfert de responsabilité) |
| PATCH   | `/api/v1/events/:eventId/routes/:id/status`                        | Valider/clôturer la feuille de route entière |
| POST    | `/api/v1/events/:eventId/zones`                                    | Ajouter une zone (découpage cartographique, polygone GeoJSON) |
| GET     | `/api/v1/users?role=agent_terrain`                                  | Lister les utilisateurs assignables (admin) |
| POST    | `/api/v1/events/:eventId/tasks`                                     | Créer/assigner une tâche à un agent ou transporteur (admin) |
| GET     | `/api/v1/events/:eventId/tasks`                                     | Lister les tâches d'un événement (admin) |
| GET     | `/api/v1/tasks/mine`                                                | Lister mes tâches assignées (agent/transporteur) |
| GET     | `/api/v1/routes/mine`                                               | Lister mon planning de livraison (agent/transporteur) |
| PATCH   | `/api/v1/tasks/:id/status`                                          | Changer le statut d'une tâche (verrouillage optimiste) |
| GET     | `/api/v1/events/:eventId/dashboard`                                | Tableau de bord KPI (stock, carbone, goulots) |

## Points clés d'implémentation

- **Verrouillage optimiste** : chaque document (`Event`, `Item`, `Route`) possède un
  champ `version`, incrémenté à chaque `findOneAndUpdate` filtré sur la version
  courante. En cas de conflit, l'API renvoie `409` — indispensable pour la
  robustesse du mode déconnecté.
- **Historisation** : les mouvements d'un item (scan, livraison, anomalie...) sont
  stockés en documents imbriqués dans `Item.history`.
- **GeoJSON** : `location` (items, arrêts) et `zones.area` (événements) utilisent des
  types GeoJSON avec index `2dsphere` pour les requêtes spatiales.
- **Time Series** : la collection `monitoring` est déclarée avec l'option native
  MongoDB `timeseries` pour stocker efficacement l'empreinte carbone consolidée.
- **N-Tier strict** : seuls les fichiers de `src/repositories/` et `src/config/`
  importent `mongodb`. Les services orchestrent les repositories sans connaître
  HTTP ; les controllers ne contiennent aucune logique métier.
- **POO** : chaque entité (`Event`, `Item`, `Route`, `Monitoring`) est une classe
  avec constructeur, validation statique et encapsulation des règles de mise en
  forme. `BaseRepository` est une classe abstraite dont héritent tous les
  repositories (héritage/polymorphisme visibles).

## Authentification JWT

- `POST /api/v1/auth/register` — creation de compte (email, password, role optionnel)
- `POST /api/v1/auth/login` — renvoie `accessToken` (15 min), `refreshToken` (7 jours)
- `POST /api/v1/auth/refresh` — renouvelle l'access token
- `GET /api/v1/auth/me` — profil de l'utilisateur authentifie

Toutes les routes metier (sauf `/health` et `/auth/*`) exigent un header
`Authorization: Bearer <accessToken>`. Le controle d'acces est base sur le
role (`admin`, `responsable_logistique`, `agent_terrain`, `transporteur`) via
le middleware `authorize(...roles)` — voir `src/routes/index.js`.

JWT (HS256) et hachage de mot de passe (scrypt) sont implementes en JavaScript
natif dans `src/lib/jwt.js` et `src/lib/password.js`, sans dependance externe
(pas de `jsonwebtoken` ni `bcrypt`), dans la continuite du choix "une seule
dependance npm" du projet.

## Temps reel (Server-Sent Events)

`GET /api/v1/events/:eventId/alerts/stream` (authentifie) ouvre un flux SSE.
Le hub `src/lib/realtime.js` (EventEmitter en memoire process) publie une
alerte a chaque declaration d'anomalie (`ItemService.declareAnomaly`). Cote
client, consommer avec `EventSource` (web) ou une librairie SSE pour mobile
(voir le projet `logichain-mobile`).

## Chiffrement des communications (TLS)

`server.js` demarre en HTTPS natif (module `https`, aucune dependance) si
`TLS_KEY_PATH` et `TLS_CERT_PATH` sont definis dans `.env`. Sinon, HTTP
simple pour le developpement local (a placer alors derriere un reverse
proxy TLS en production).

## Tests de charge

```bash
npm run load-test
# ou, sur une route protegee, avec un token recupere via /auth/login :
LOAD_TEST_PATH=/api/v1/events LOAD_TEST_TOKEN=<accessToken> LOAD_TEST_REQUESTS=1000 LOAD_TEST_CONCURRENCY=50 npm run load-test
```

Script natif (`scripts/loadTest.js`, `fetch` + `performance.now()`, aucune
dependance type autocannon/k6) : mesure debit, taux d'erreur et latences
p50/p95/p99 sur une cible configurable.

## Non couvert ici (hors perimetre backend)

Le PWA offline-first et l'application mobile front-end sont traites dans le
projet separe `logichain-mobile` (React Native + Expo + TypeScript, voir son
propre README).
