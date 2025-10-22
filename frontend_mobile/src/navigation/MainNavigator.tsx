import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Home/HomeScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import MyPostsScreen from '../screens/MyPosts/MyPostsScreen';
import MyRentalsScreen from '../screens/MyRentals/MyRentalsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { darkMode } = useAppStore();
  const theme = useTheme();

  // Mapa de iconos para evitar errores de tipo
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home-outline',
    Favorites: 'heart-outline',
    MyPosts: 'add-circle-outline',
    MyRentals: 'business-outline',
    Profile: 'person-outline',
  };

  return (
    <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: darkMode ? '#aaa' : '#888',
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 0.5,
            borderTopColor: darkMode ? '#333' : '#ccc',
          },
          tabBarIcon: ({ color, size }) => {
            // Usa ícono por defecto si el nombre no existe
            const iconName = icons[route.name] || 'help-circle-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: 'Favorites' }}
        />
        <Tab.Screen
          name="MyPosts"
          component={MyPostsScreen}
          options={{ title: 'My Posts' }}
        />
        <Tab.Screen
          name="MyRentals"
          component={MyRentalsScreen}
          options={{ title: 'My Rentals' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
