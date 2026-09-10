import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/hooks/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initSchema } from './src/db/schema';
import { NotificationService } from './src/services/NotificationService';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initSchema().then(() => setDbReady(true));
    NotificationService.requestPermissions();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
