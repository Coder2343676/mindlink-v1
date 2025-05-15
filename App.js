import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import WelcomeScreen from './WelcomeScreen';
import ChatScreen from './ChatScreen';
import DailyChatScreen from './DailyChatScreen';
import HomeScreen from './HomeScreen';
import SummaryScreen from './SummaryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app with bottom tab navigation
const MainAppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Diary') {
            iconName = focused ? 'journal' : 'journal-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Diary" component={HomeScreen} />
      <Tab.Screen name="Chat" component={DailyChatScreen} />
      <Tab.Screen 
        name="Reports" 
        component={SummaryScreen} 
        initialParams={{ cleanedMessages: [] }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        const storedName = await AsyncStorage.getItem('@user_name');
        
        if (hasLaunched === 'true' && storedName) {
          setIsFirstLaunch(false);
        } else {
          setIsFirstLaunch(true);
        }
      } catch (error) {
        console.error('Failed to check app launch status:', error);
        setIsFirstLaunch(true);
      }
    };

    checkFirstLaunch();
  }, []);

  // Show loading until we check if this is first launch
  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isFirstLaunch ? "Welcome" : "MainApp"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ headerShown: true }} />
        <Stack.Screen name="MainApp" component={MainAppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
