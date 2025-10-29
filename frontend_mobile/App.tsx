import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/useAppStore';
import { useTheme } from './src/hooks/useTheme';

export default function App() {
  const { darkMode } = useAppStore();
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      {/* StatusBar adaptativa según el tema */}
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Navegación principal */}
      <RootNavigator />
    </SafeAreaProvider>
  );
}
