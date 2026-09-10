const Router = require('../lib/Router');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const authController = require('../controllers/AuthController');
const eventController = require('../controllers/EventController');
const itemController = require('../controllers/ItemController');
const routeController = require('../controllers/RouteController');
const dashboardController = require('../controllers/DashboardController');
const alertsController = require('../controllers/AlertsController');
const taskController = require('../controllers/TaskController');
const userController = require('../controllers/UserController');

const router = new Router();

const ADMIN = ['admin', 'responsable_logistique'];
const TERRAIN = ['agent_terrain', 'transporteur', 'admin', 'responsable_logistique'];

// --- Authentification ---
router.post('/api/v1/auth/register', authController.register.bind(authController));
router.post('/api/v1/auth/login', authController.login.bind(authController));
router.post('/api/v1/auth/refresh', authController.refresh.bind(authController));
router.get('/api/v1/auth/me', authenticate, authController.me.bind(authController));

// --- Evenements (reserve aux administrateurs / responsables logistiques) ---
router.post('/api/v1/events', authenticate, authorize(...ADMIN), eventController.create.bind(eventController));
router.get('/api/v1/events', authenticate, eventController.list.bind(eventController));
router.get('/api/v1/events/:id', authenticate, eventController.getOne.bind(eventController));
router.patch(
  '/api/v1/events/:id/status',
  authenticate,
  authorize(...ADMIN),
  eventController.updateStatus.bind(eventController)
);
router.post(
  '/api/v1/events/:eventId/zones',
  authenticate,
  authorize(...ADMIN),
  eventController.addZone.bind(eventController)
);

// --- Items imbriques sous un evenement ---
router.post(
  '/api/v1/events/:eventId/items',
  authenticate,
  authorize(...ADMIN),
  itemController.create.bind(itemController)
);
router.get('/api/v1/events/:eventId/items', authenticate, itemController.list.bind(itemController));

// --- Items (acces direct : agents de terrain) ---
router.post('/api/v1/items/scan', authenticate, authorize(...TERRAIN), itemController.scan.bind(itemController));
router.get('/api/v1/items/:id', authenticate, itemController.getOne.bind(itemController));
router.patch(
  '/api/v1/items/:id/anomalie',
  authenticate,
  authorize(...TERRAIN),
  itemController.declareAnomaly.bind(itemController)
);
router.patch(
  '/api/v1/items/:id/assign',
  authenticate,
  authorize(...ADMIN),
  itemController.assign.bind(itemController)
);
router.get(
  '/api/v1/events/:eventId/scan-history',
  authenticate,
  authorize(...ADMIN),
  itemController.scanHistory.bind(itemController)
);
router.get('/api/v1/scan-history/mine', authenticate, itemController.myScanHistory.bind(itemController));
router.patch(
  '/api/v1/items/:id/scan-history/cancel',
  authenticate,
  authorize(...TERRAIN),
  itemController.cancelScan.bind(itemController)
);

// --- Feuilles de route ---
router.post(
  '/api/v1/events/:eventId/routes',
  authenticate,
  authorize(...ADMIN),
  routeController.create.bind(routeController)
);
router.get('/api/v1/events/:eventId/routes', authenticate, routeController.list.bind(routeController));
router.patch(
  '/api/v1/events/:eventId/routes/:id/stops/:stopId/validate',
  authenticate,
  authorize(...ADMIN),
  routeController.validateStop.bind(routeController)
);
router.patch(
  '/api/v1/events/:eventId/routes/:id/status',
  authenticate,
  authorize(...ADMIN),
  routeController.updateStatus.bind(routeController)
);

// --- Tableau de bord ---
router.get(
  '/api/v1/events/:eventId/dashboard',
  authenticate,
  authorize(...ADMIN),
  dashboardController.getEventDashboard.bind(dashboardController)
);

// --- Alertes temps reel (Server-Sent Events) ---
router.get(
  '/api/v1/events/:eventId/alerts/stream',
  authenticate,
  alertsController.stream.bind(alertsController)
);

// --- Utilisateurs (liste pour assignation de taches, admin uniquement) ---
router.get('/api/v1/users', authenticate, authorize(...ADMIN), userController.list.bind(userController));

// --- Taches assignees aux agents de terrain / transporteurs ---
router.post(
  '/api/v1/events/:eventId/tasks',
  authenticate,
  authorize(...ADMIN),
  taskController.create.bind(taskController)
);
router.get(
  '/api/v1/events/:eventId/tasks',
  authenticate,
  authorize(...ADMIN),
  taskController.listByEvent.bind(taskController)
);
router.get('/api/v1/tasks/mine', authenticate, taskController.listMine.bind(taskController));
router.get('/api/v1/routes/mine', authenticate, routeController.listMine.bind(routeController));
router.patch('/api/v1/tasks/:id/status', authenticate, taskController.updateStatus.bind(taskController));

module.exports = router;
