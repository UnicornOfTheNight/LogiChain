/**
 * Insere un jeu de donnees de demonstration : un evenement, des
 * utilisateurs, des items (avec historisation et GeoJSON), des feuilles
 * de route assignees a de vrais comptes agent/transporteur, des taches et
 * des mesures de monitoring (serie temporelle).
 *
 * Usage : npm run db:seed
 */
require('../src/lib/loadEnv')();
const { MongoClient, ObjectId } = require('mongodb');
const { buildConnectionUri } = require('../src/config/database');
const { hashPassword } = require('../src/lib/password');

const uri = buildConnectionUri();
const dbName = process.env.MONGODB_DB || 'logichain';

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await Promise.all([
    db.collection('events').deleteMany({}),
    db.collection('items').deleteMany({}),
    db.collection('routes').deleteMany({}),
    db.collection('monitoring').deleteMany({}),
    db.collection('users').deleteMany({}),
    db.collection('tasks').deleteMany({})
  ]);

  const now = new Date();

  const { insertedId: eventId } = await db.collection('events').insertOne({
    name: 'Festival Eco-Responsable 2026',
    type: 'festival',
    startDate: new Date('2026-08-10'),
    endDate: new Date('2026-08-13'),
    status: 'montage',
    zones: [
      {
        _id: new ObjectId(),
        name: 'Scene principale',
        type: 'scene',
        area: {
          type: 'Polygon',
          coordinates: [
            [
              [1.15, 49.025],
              [1.152, 49.025],
              [1.152, 49.027],
              [1.15, 49.027],
              [1.15, 49.025]
            ]
          ]
        }
      },
      {
        _id: new ObjectId(),
        name: 'Zone de stockage',
        type: 'stock',
        area: {
          type: 'Polygon',
          coordinates: [
            [
              [1.148, 49.023],
              [1.15, 49.023],
              [1.15, 49.025],
              [1.148, 49.025],
              [1.148, 49.023]
            ]
          ]
        }
      }
    ],
    version: 0,
    createdAt: now,
    updatedAt: now
  });

  // --- Utilisateurs de demonstration (10, repartis sur les 4 roles) ---
  // Crees en premier : les feuilles de route et affectations d'equipements
  // ci-dessous ont besoin de vrais identifiants de compte.
  // Mot de passe identique pour tous, uniquement a des fins de demo locale :
  // a ne jamais faire dans un jeu de donnees destine a un environnement partage.
  const DEMO_PASSWORD = 'MotDePasse123';
  const demoUsersSpec = [
    { email: 'admin1@logichain.test', role: 'admin', name: 'Admin Un' },
    { email: 'admin2@logichain.test', role: 'admin', name: 'Admin Deux' },
    { email: 'respo1@logichain.test', role: 'responsable_logistique', name: 'Responsable Un' },
    { email: 'respo2@logichain.test', role: 'responsable_logistique', name: 'Responsable Deux' },
    { email: 'respo3@logichain.test', role: 'responsable_logistique', name: 'Responsable Trois' },
    { email: 'agent1@logichain.test', role: 'agent_terrain', name: 'Agent Un' },
    { email: 'agent2@logichain.test', role: 'agent_terrain', name: 'Agent Deux' },
    { email: 'agent3@logichain.test', role: 'agent_terrain', name: 'Agent Trois' },
    { email: 'transporteur1@logichain.test', role: 'transporteur', name: 'Transporteur Un' },
    { email: 'transporteur2@logichain.test', role: 'transporteur', name: 'Transporteur Deux' }
  ];

  const passwordHash = hashPassword(DEMO_PASSWORD);
  const { insertedIds: userIds } = await db.collection('users').insertMany(
    demoUsersSpec.map((spec) => ({
      email: spec.email,
      passwordHash,
      role: spec.role,
      name: spec.name,
      createdAt: now
    }))
  );

  const agent1Id = userIds[5]; // agent1@logichain.test
  const agent2Id = userIds[6]; // agent2@logichain.test
  const transporteur1Id = userIds[8]; // transporteur1@logichain.test

  const { insertedIds: itemIds } = await db.collection('items').insertMany([
    {
      eventId,
      label: 'Groupe electrogene 20kVA',
      category: 'electrique',
      qrCode: 'QR-ITEM-0001',
      status: 'en_stock',
      location: { type: 'Point', coordinates: [1.149, 49.024] },
      carbonFootprintKg: 12.4,
      history: [{ action: 'creation', agentId: agent1Id, timestamp: new Date('2026-07-01T08:00:00Z') }],
      assignedToUserId: agent1Id,
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Barrieres de securite (lot de 10)',
      category: 'signaletique',
      qrCode: 'QR-ITEM-0002',
      status: 'en_transit',
      location: { type: 'Point', coordinates: [1.1495, 49.0245] },
      carbonFootprintKg: 5.1,
      history: [
        { action: 'creation', agentId: agent1Id, timestamp: new Date('2026-07-01T08:05:00Z') },
        {
          action: 'deplacement',
          agentId: agent1Id,
          location: { type: 'Point', coordinates: [1.1495, 49.0245] },
          timestamp: new Date('2026-07-02T09:00:00Z')
        }
      ],
      assignedToUserId: agent1Id,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Structure scenique modulaire',
      category: 'scenique',
      qrCode: 'QR-ITEM-0003',
      status: 'livre',
      location: { type: 'Point', coordinates: [1.151, 49.026] },
      carbonFootprintKg: 34.7,
      history: [
        { action: 'creation', agentId: agent1Id, timestamp: new Date('2026-06-28T08:00:00Z') },
        {
          action: 'livraison',
          agentId: agent1Id,
          location: { type: 'Point', coordinates: [1.151, 49.026] },
          timestamp: new Date('2026-07-01T14:00:00Z')
        }
      ],
      assignedToUserId: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Table de mixage',
      category: 'electrique',
      qrCode: 'QR-ITEM-0004',
      status: 'en_stock',
      location: { type: 'Point', coordinates: [1.1502, 49.0258] },
      carbonFootprintKg: 8.2,
      history: [{ action: 'creation', agentId: agent1Id, timestamp: new Date('2026-07-01T08:10:00Z') }],
      assignedToUserId: null,
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Chariot elevateur',
      category: 'vehicule',
      qrCode: 'QR-ITEM-0005',
      status: 'en_stock',
      location: { type: 'Point', coordinates: [1.1485, 49.0235] },
      carbonFootprintKg: 22.9,
      history: [{ action: 'creation', agentId: agent1Id, timestamp: new Date('2026-07-01T08:12:00Z') }],
      assignedToUserId: null,
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Panneaux signaletique zone VIP',
      category: 'signaletique',
      qrCode: 'QR-ITEM-0006',
      status: 'en_stock',
      location: { type: 'Point', coordinates: [1.1492, 49.0242] },
      carbonFootprintKg: 3.4,
      history: [{ action: 'creation', agentId: agent2Id, timestamp: new Date('2026-07-01T08:14:00Z') }],
      assignedToUserId: agent2Id,
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Praticables scene B',
      category: 'scenique',
      qrCode: 'QR-ITEM-0007',
      status: 'en_transit',
      location: { type: 'Point', coordinates: [1.1508, 49.0262] },
      carbonFootprintKg: 18.6,
      history: [
        { action: 'creation', agentId: agent2Id, timestamp: new Date('2026-07-01T08:16:00Z') },
        {
          action: 'deplacement',
          agentId: agent2Id,
          location: { type: 'Point', coordinates: [1.1508, 49.0262] },
          timestamp: new Date('2026-07-02T09:30:00Z')
        }
      ],
      assignedToUserId: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Groupe electrogene 10kVA',
      category: 'electrique',
      qrCode: 'QR-ITEM-0008',
      status: 'en_maintenance',
      location: { type: 'Point', coordinates: [1.1488, 49.0238] },
      carbonFootprintKg: 9.7,
      history: [
        { action: 'creation', agentId: agent2Id, timestamp: new Date('2026-06-30T08:00:00Z') },
        {
          action: 'anomalie',
          agentId: agent2Id,
          location: { type: 'Point', coordinates: [1.1488, 49.0238] },
          note: "Fuite d'huile constatee au demarrage",
          timestamp: new Date('2026-07-02T10:00:00Z')
        }
      ],
      assignedToUserId: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Mobilier loge artistes',
      category: 'mobilier',
      qrCode: 'QR-ITEM-0009',
      status: 'en_stock',
      location: { type: 'Point', coordinates: [1.1497, 49.0247] },
      carbonFootprintKg: 6.1,
      history: [{ action: 'creation', agentId: agent1Id, timestamp: new Date('2026-07-01T08:20:00Z') }],
      assignedToUserId: null,
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      label: 'Camion frigorifique',
      category: 'vehicule',
      qrCode: 'QR-ITEM-0010',
      status: 'livre',
      location: { type: 'Point', coordinates: [1.1515, 49.0265] },
      carbonFootprintKg: 41.3,
      history: [
        { action: 'creation', agentId: transporteur1Id, timestamp: new Date('2026-06-27T08:00:00Z') },
        {
          action: 'livraison',
          agentId: transporteur1Id,
          location: { type: 'Point', coordinates: [1.1515, 49.0265] },
          timestamp: new Date('2026-07-01T15:00:00Z')
        }
      ],
      assignedToUserId: transporteur1Id,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // --- Feuilles de route / plannings de livraison assignes a de vrais comptes ---
  await db.collection('routes').insertMany([
    {
      eventId,
      transporterId: transporteur1Id,
      status: 'en_cours',
      stops: [
        {
          _id: new ObjectId(),
          label: 'Depot central',
          location: { type: 'Point', coordinates: [1.14, 49.02] },
          plannedTime: new Date('2026-08-08T07:00:00Z'),
          itemIds: [itemIds[9]],
          validated: true
        },
        {
          _id: new ObjectId(),
          label: 'Zone technique',
          location: { type: 'Point', coordinates: [1.1488, 49.0238] },
          plannedTime: new Date('2026-08-08T09:00:00Z'),
          itemIds: [itemIds[9]],
          validated: false
        }
      ],
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      transporterId: agent1Id,
      status: 'planifiee',
      stops: [
        {
          _id: new ObjectId(),
          label: 'Zone de stockage',
          location: { type: 'Point', coordinates: [1.149, 49.024] },
          plannedTime: new Date('2026-08-09T08:00:00Z'),
          itemIds: [itemIds[0], itemIds[1]],
          validated: false
        },
        {
          _id: new ObjectId(),
          label: 'Scene principale',
          location: { type: 'Point', coordinates: [1.151, 49.026] },
          plannedTime: new Date('2026-08-09T10:00:00Z'),
          itemIds: [itemIds[0]],
          validated: false
        }
      ],
      version: 0,
      createdAt: now,
      updatedAt: now
    }
  ]);

  await db.collection('monitoring').insertMany([
    { timestamp: new Date('2026-07-01T08:00:00Z'), eventId, metricType: 'carbon_footprint', value: 40.1 },
    { timestamp: new Date('2026-07-01T12:00:00Z'), eventId, metricType: 'carbon_footprint', value: 45.6 },
    { timestamp: new Date('2026-07-02T08:00:00Z'), eventId, metricType: 'carbon_footprint', value: 52.2 }
  ]);

  await db.collection('tasks').insertMany([
    {
      eventId,
      assignedToUserId: agent1Id,
      title: 'Verifier le montage de la scene principale',
      description: 'Controler la stabilite de la structure avant ouverture des portes.',
      dueAt: new Date('2026-08-09T18:00:00Z'),
      status: 'a_faire',
      version: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      assignedToUserId: agent2Id,
      title: 'Installer la signaletique zone VIP',
      description: "Poser les panneaux QR-ITEM-0006 aux points d'acces prevus.",
      dueAt: new Date('2026-08-09T14:00:00Z'),
      status: 'en_cours',
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      eventId,
      assignedToUserId: transporteur1Id,
      title: 'Livrer le groupe electrogene 20kVA en zone technique',
      description: "Coordonner avec l'agent sur place pour le dechargement.",
      dueAt: new Date('2026-08-08T09:00:00Z'),
      status: 'a_faire',
      version: 0,
      createdAt: now,
      updatedAt: now
    }
  ]);

  console.log('Jeu de donnees insere avec succes.');
  console.log(`Evenement cree : ${eventId}`);
  console.log('');
  console.log('--- Utilisateurs de demonstration (mot de passe commun : ' + DEMO_PASSWORD + ') ---');
  demoUsersSpec.forEach((u) => console.log(`  ${u.role.padEnd(24)} ${u.email}`));
  console.log('');
  console.log('3 taches de demonstration assignees (agent1, agent2, transporteur1).');
  console.log('2 feuilles de route assignees (transporteur1 : 1 planning, agent1 : 1 planning).');
  await client.close();
}

seed().catch((err) => {
  console.error('Erreur lors du seed :', err);
  process.exit(1);
});
