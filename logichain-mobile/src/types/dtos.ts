/**
 * Types partages avec les schemas de l'API Node.js (typage fort de bout en
 * bout, cf. cahier des charges). Toute evolution du schema back-end doit
 * etre repercutee ici.
 */

export type ItemCategory = 'scenique' | 'electrique' | 'mobilier' | 'signaletique' | 'vehicule';
export type ItemStatus = 'en_stock' | 'en_transit' | 'livre' | 'en_maintenance' | 'perdu';
export type ItemAction = 'creation' | 'livraison' | 'deplacement' | 'maintenance' | 'anomalie' | 'retour';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ItemHistoryEntry {
  action: ItemAction;
  agentId?: string;
  location?: GeoPoint;
  note?: string;
  timestamp: string;
}

export interface ItemDTO {
  _id: string;
  eventId: string;
  label: string;
  category: ItemCategory;
  qrCode: string;
  status: ItemStatus;
  location: GeoPoint;
  carbonFootprintKg: number;
  history: ItemHistoryEntry[];
  assignedToUserId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ZoneType = 'scene' | 'stock' | 'entree' | 'securite' | 'technique';

export interface ZoneDTO {
  _id: string;
  name: string;
  type: ZoneType;
  area: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng,lat], [lng,lat], ... ] ]
  };
}

export type EventStatus = 'planifie' | 'montage' | 'en_cours' | 'demontage' | 'termine';

export interface EventDTO {
  _id: string;
  name: string;
  type: 'festival' | 'salon' | 'rassemblement';
  startDate: string;
  endDate: string;
  status: EventStatus;
  zones: ZoneDTO[];
  version: number;
}

export type RouteStatus = 'planifiee' | 'en_cours' | 'validee' | 'annulee';

export interface StopDTO {
  _id: string;
  label: string;
  location: GeoPoint;
  plannedTime?: string;
  itemIds: string[];
  validated: boolean;
}

export interface RouteDTO {
  _id: string;
  eventId: string;
  transporterId: string;
  stops: StopDTO[];
  status: RouteStatus;
  version: number;
}

export interface StockKpiEntry {
  _id: ItemStatus;
  count: number;
}

export interface BottleneckEntry {
  _id: { lng: number; lat: number };
  count: number;
}

export interface EventDashboardDTO {
  event: { id: string; name: string; status: EventStatus };
  stock: StockKpiEntry[];
  carbonFootprintKg: number;
  bottlenecks: BottleneckEntry[];
}

export type TaskStatus = 'a_faire' | 'en_cours' | 'terminee' | 'annulee';

export interface TaskDTO {
  _id: string;
  eventId: string;
  assignedToUserId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignableUserDTO {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface ScanHistoryEntryDTO {
  itemId: string;
  label: string;
  category: ItemCategory;
  qrCode: string;
  action: ItemAction;
  agentId?: string;
  location?: GeoPoint;
  note?: string;
  timestamp: string;
  cancelled?: boolean;
  version: number;
}

export type UserRole = 'admin' | 'responsable_logistique' | 'agent_terrain' | 'transporteur';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AlertDTO {
  type: string;
  itemId: string;
  label: string;
  note?: string;
  coordinates?: [number, number];
  timestamp: string;
}

// --- Mode degrade : file d'attente locale d'actions non synchronisees ---
export type QueuedActionType = 'scan' | 'anomalie';

export interface ScanActionPayload {
  qrCode: string;
  action: ItemAction;
  coordinates?: [number, number];
  note?: string;
}

export interface AnomalyActionPayload {
  itemId: string;
  version: number;
  coordinates?: [number, number];
  note?: string;
}

export interface QueuedAction {
  localId: string;
  type: QueuedActionType;
  payload: ScanActionPayload | AnomalyActionPayload;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';
