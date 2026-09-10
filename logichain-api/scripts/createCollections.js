/**
 * Script d'initialisation de la base MongoDB "logichain".
 * Cree les collections avec validation native des schemas ($jsonSchema),
 * la collection Time Series pour le monitoring, et les index
 * (composes, geospatiaux, uniques) demandes par le cahier des charges.
 *
 * Usage : npm run db:create
 */
require('../src/lib/loadEnv')();
const { MongoClient } = require('mongodb');
const { buildConnectionUri } = require('../src/config/database');

const uri = buildConnectionUri();
const dbName = process.env.MONGODB_DB || 'logichain';

async function createCollections() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // --- Collection Events ---
  await db
    .createCollection('events', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'type', 'startDate', 'endDate', 'status'],
          properties: {
            name: { bsonType: 'string' },
            type: { enum: ['festival', 'salon', 'rassemblement'] },
            startDate: { bsonType: 'date' },
            endDate: { bsonType: 'date' },
            status: { enum: ['planifie', 'montage', 'en_cours', 'demontage', 'termine'] },
            zones: { bsonType: 'array' },
            version: { bsonType: 'int' }
          }
        }
      },
      validationLevel: 'strict'
    })
    .catch((e) => console.log('Collection "events" deja existante ou erreur :', e.message));

  // --- Collection Items ---
  await db
    .createCollection('items', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['eventId', 'label', 'category', 'qrCode', 'status'],
          properties: {
            eventId: { bsonType: 'objectId' },
            label: { bsonType: 'string' },
            category: { enum: ['scenique', 'electrique', 'mobilier', 'signaletique', 'vehicule'] },
            qrCode: { bsonType: 'string' },
            status: { enum: ['en_stock', 'en_transit', 'livre', 'en_maintenance', 'perdu'] },
            location: { bsonType: 'object' },
            carbonFootprintKg: { bsonType: ['double', 'int'] },
            history: { bsonType: 'array' },
            assignedToUserId: { bsonType: ['objectId', 'null'] },
            version: { bsonType: 'int' }
          }
        }
      },
      validationLevel: 'strict'
    })
    .catch((e) => console.log('Collection "items" deja existante ou erreur :', e.message));

  // --- Collection Routes ---
  await db
    .createCollection('routes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['eventId', 'transporterId', 'status'],
          properties: {
            eventId: { bsonType: 'objectId' },
            transporterId: { bsonType: 'objectId' },
            stops: { bsonType: 'array' },
            status: { enum: ['planifiee', 'en_cours', 'validee', 'annulee'] },
            version: { bsonType: 'int' }
          }
        }
      },
      validationLevel: 'strict'
    })
    .catch((e) => console.log('Collection "routes" deja existante ou erreur :', e.message));

  // --- Collection Monitoring (Time Series) ---
  await db
    .createCollection('monitoring', {
      timeseries: { timeField: 'timestamp', metaField: 'eventId', granularity: 'minutes' }
    })
    .catch((e) => console.log('Collection "monitoring" deja existante ou erreur :', e.message));

  // --- Collection Users (authentification) ---
  await db
    .createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'passwordHash', 'role'],
          properties: {
            email: { bsonType: 'string' },
            passwordHash: { bsonType: 'string' },
            role: { enum: ['admin', 'responsable_logistique', 'agent_terrain', 'transporteur'] },
            name: { bsonType: 'string' }
          }
        }
      },
      validationLevel: 'strict'
    })
    .catch((e) => console.log('Collection "users" deja existante ou erreur :', e.message));

  // --- Collection Tasks (taches assignees aux agents/transporteurs) ---
  await db
    .createCollection('tasks', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['eventId', 'assignedToUserId', 'title', 'status'],
          properties: {
            eventId: { bsonType: 'objectId' },
            assignedToUserId: { bsonType: 'objectId' },
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            status: { enum: ['a_faire', 'en_cours', 'terminee', 'annulee'] },
            version: { bsonType: 'int' }
          }
        }
      },
      validationLevel: 'strict'
    })
    .catch((e) => console.log('Collection "tasks" deja existante ou erreur :', e.message));

  // --- Index ---
  await db.collection('items').createIndex({ location: '2dsphere' });
  await db.collection('items').createIndex({ qrCode: 1 }, { unique: true });
  await db.collection('items').createIndex({ eventId: 1, status: 1 }); // index compose
  await db.collection('items').createIndex({ assignedToUserId: 1 });
  await db.collection('events').createIndex({ 'zones.area': '2dsphere' });
  await db.collection('routes').createIndex({ eventId: 1, transporterId: 1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('tasks').createIndex({ eventId: 1, assignedToUserId: 1 });
  await db.collection('tasks').createIndex({ assignedToUserId: 1, status: 1 });

  console.log('Collections et index crees avec succes.');
  await client.close();
}

createCollections().catch((err) => {
  console.error('Erreur lors de la creation des collections :', err);
  process.exit(1);
});
