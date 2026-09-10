const { MongoClient, ObjectId } = require('mongodb');

let client;
let db;

/**
 * Construit l'URI de connexion en y injectant les identifiants
 * MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD (variables
 * standard des images Docker MongoDB) s'ils sont definis. Sans ces deux
 * variables, l'URI est utilisee telle quelle (connexion sans authentification,
 * usage developpement local).
 */
function buildConnectionUri() {
  const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const username = process.env.MONGO_INITDB_ROOT_USERNAME;
  const password = process.env.MONGO_INITDB_ROOT_PASSWORD;

  if (!username || !password) return rawUri;

  const url = new URL(rawUri);
  url.username = username;
  url.password = password;
  // authSource=admin : les utilisateurs crees par MONGO_INITDB_ROOT_* sont
  // toujours enregistres dans la base "admin" par l'image MongoDB officielle.
  if (!url.searchParams.has('authSource')) {
    url.searchParams.set('authSource', 'admin');
  }
  return url.toString();
}

/**
 * Ouvre la connexion MongoDB (driver officiel natif, sans ODM).
 * Seul ce module + la couche Repository sont autorises a importer 'mongodb'
 * (cf. contrainte N-Tier du cahier des charges).
 */
async function connectDatabase() {
  const uri = buildConnectionUri();
  const dbName = process.env.MONGODB_DB || 'logichain';

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log(`[MongoDB] Connecte a la base "${dbName}"`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Base de donnees non initialisee : appelez connectDatabase() au demarrage du serveur.');
  }
  return db;
}

async function closeDatabase() {
  if (client) await client.close();
}

module.exports = { connectDatabase, getDb, closeDatabase, buildConnectionUri, ObjectId };
