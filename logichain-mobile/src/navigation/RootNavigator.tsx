import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthContext } from '../hooks/AuthContext';
import { SyncQueueProvider } from '../hooks/SyncQueueContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScanScreen from '../screens/ScanScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import SyncCenterScreen from '../screens/SyncCenterScreen';
import MyTasksScreen from '../screens/MyTasksScreen';
import MyPlanningScreen from '../screens/MyPlanningScreen';
import MyScanHistoryScreen from '../screens/MyScanHistoryScreen';
import AdminEventListScreen from '../screens/AdminEventListScreen';
import AdminEventFormScreen from '../screens/AdminEventFormScreen';
import AdminEventHubScreen from '../screens/AdminEventHubScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminZonesScreen from '../screens/AdminZonesScreen';
import AdminRoutesScreen from '../screens/AdminRoutesScreen';
import AdminTasksScreen from '../screens/AdminTasksScreen';
import AdminItemsScreen from '../screens/AdminItemsScreen';
import AdminScanHistoryScreen from '../screens/AdminScanHistoryScreen';

// --- Profil Agents de terrain & Prestataires ---
export type TerrainStackParamList = {
  Dashboard: undefined;
  Scan: undefined;
  ItemDetail: { itemId: string };
  SyncCenter: undefined;
  MyTasks: undefined;
  MyPlanning: undefined;
  MyScanHistory: undefined;
};

// --- Profil Administrateurs & Responsables logistiques ---
export type AdminStackParamList = {
  EventList: undefined;
  EventForm: undefined;
  EventHub: { eventId: string; eventName: string };
  AdminDashboard: { eventId: string; eventName: string };
  AdminZones: { eventId: string; eventName: string };
  AdminRoutes: { eventId: string; eventName: string };
  AdminTasks: { eventId: string; eventName: string };
  AdminItems: { eventId: string; eventName: string };
  AdminScanHistory: { eventId: string; eventName: string };
};

const TerrainStack = createNativeStackNavigator<TerrainStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

const ADMIN_ROLES = ['admin', 'responsable_logistique'];

export default function RootNavigator() {
  const { user, loading } = useAuthContext();

  if (loading) return null; // écran de chargement géré par App.tsx

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : ADMIN_ROLES.includes(user.role) ? (
        <AdminStack.Navigator>
          <AdminStack.Screen name="EventList" component={AdminEventListScreen} options={{ title: 'Événements' }} />
          <AdminStack.Screen
            name="EventForm"
            component={AdminEventFormScreen}
            options={{ title: 'Nouvel événement' }}
          />
          <AdminStack.Screen name="EventHub" component={AdminEventHubScreen} options={{ title: 'Événement' }} />
          <AdminStack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ title: 'Tableau de bord' }}
          />
          <AdminStack.Screen name="AdminZones" component={AdminZonesScreen} options={{ title: 'Zones' }} />
          <AdminStack.Screen
            name="AdminRoutes"
            component={AdminRoutesScreen}
            options={{ title: 'Feuilles de route' }}
          />
          <AdminStack.Screen name="AdminTasks" component={AdminTasksScreen} options={{ title: 'Tâches' }} />
          <AdminStack.Screen name="AdminItems" component={AdminItemsScreen} options={{ title: 'Équipements' }} />
          <AdminStack.Screen
            name="AdminScanHistory"
            component={AdminScanHistoryScreen}
            options={{ title: 'Historique des scans' }}
          />
        </AdminStack.Navigator>
      ) : (
        <SyncQueueProvider>
          <TerrainStack.Navigator>
            <TerrainStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
            <TerrainStack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scanner' }} />
            <TerrainStack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ title: 'Détail équipement' }}
            />
            <TerrainStack.Screen
              name="SyncCenter"
              component={SyncCenterScreen}
              options={{ title: 'Synchronisation' }}
            />
            <TerrainStack.Screen name="MyTasks" component={MyTasksScreen} options={{ title: 'Mes tâches' }} />
            <TerrainStack.Screen name="MyPlanning" component={MyPlanningScreen} options={{ title: 'Mon planning' }} />
            <TerrainStack.Screen
              name="MyScanHistory"
              component={MyScanHistoryScreen}
              options={{ title: 'Mes scans' }}
            />
          </TerrainStack.Navigator>
        </SyncQueueProvider>
      )}
    </NavigationContainer>
  );
}
