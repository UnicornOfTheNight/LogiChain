/**
 * Declarations d'ambiance minimales pour les modules React Native / Expo.
 * Objectif : permettre a `tsc --noEmit` de verifier la coherence interne du
 * code applicatif (services/hooks/DTOs) sans avoir a telecharger et
 * compiler l'integralite de la toolchain native React Native, ce qui
 * n'est pas executable dans cet environnement. Une fois le projet ouvert
 * dans un vrai environnement Expo (`npm install`), ces shims sont
 * automatiquement ignores au profit des vraies definitions de types
 * fournies par chaque paquet.
 */

declare module 'react-native' {
  import * as React from 'react';
  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const Pressable: React.ComponentType<any>;
  export const FlatList: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any>;
  export const StyleSheet: { create: <T>(styles: T) => T };
  export const Alert: { alert: (title: string, message?: string) => void };
  export const AppState: {
    addEventListener: (event: string, cb: (state: string) => void) => { remove: () => void };
  };
}

declare module 'expo-sqlite' {
  export interface SQLiteRunResult {
    lastInsertRowId: number;
    changes: number;
  }
  export interface SQLiteDatabase {
    execAsync: (sql: string) => Promise<void>;
    runAsync: (sql: string, params?: unknown[]) => Promise<SQLiteRunResult>;
    getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
    getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'expo-camera' {
  import * as React from 'react';
  export const CameraView: React.ComponentType<any>;
  export function useCameraPermissions(): [
    { granted: boolean } | null,
    () => Promise<{ granted: boolean }>
  ];
}

declare module 'expo-location' {
  export interface LocationCoords {
    latitude: number;
    longitude: number;
  }
  export function requestForegroundPermissionsAsync(): Promise<{ status: 'granted' | 'denied' }>;
  export function getCurrentPositionAsync(options?: unknown): Promise<{ coords: LocationCoords }>;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }
  const NetInfo: {
    addEventListener: (listener: (state: NetInfoState) => void) => () => void;
    fetch: () => Promise<NetInfoState>;
  };
  export default NetInfo;
}

declare module '@react-navigation/native' {
  import * as React from 'react';
  export const NavigationContainer: React.ComponentType<any>;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
}

declare module 'react-native-sse' {
  export default class EventSource {
    constructor(url: string, options?: { headers?: Record<string, string> });
    addEventListener(type: string, listener: (event: any) => void): void;
    removeAllEventListeners(): void;
    close(): void;
  }
}

declare module 'expo-haptics' {
  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error'
  }
  export function notificationAsync(type: NotificationFeedbackType): Promise<void>;
  export function impactAsync(style?: string): Promise<void>;
}

declare module 'expo-constants' {
  interface ExpoConfig {
    hostUri?: string;
  }
  interface Constants {
    expoConfig: ExpoConfig | null;
  }
  const Constants: Constants;
  export default Constants;
}

// Injecte par Babel dans tout projet React Native/Expo (vrai en dev, false en build production)
declare const __DEV__: boolean;

declare module 'expo-notifications' {
  export interface NotificationHandlerResult {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
  }
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function scheduleNotificationAsync(request: {
    content: { title?: string; body?: string; sound?: string | boolean };
    trigger: null;
  }): Promise<string>;
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<NotificationHandlerResult>;
  }): void;
}

declare module 'react-native-webview' {
  import * as React from 'react';
  export interface WebViewMessageEvent {
    nativeEvent: { data: string };
  }
  export class WebView extends React.Component<{
    source: { html: string } | { uri: string };
    originWhitelist?: string[];
    onMessage?: (event: WebViewMessageEvent) => void;
    style?: any;
    javaScriptEnabled?: boolean;
  }> {}
}
