// npm start
// npx expo export --platform web => eas deploy => eas deploy --prod
// npx expo start --tunnel

import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { HelmetProvider } from "react-helmet-async";

// Apply global style to prevent zoom on iOS
if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = `
    input, textarea, select, button {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(style);

  // Override default TextInput behavior
  const originalRender = TextInput.render;
  TextInput.render = function (...args) {
    const oldProps = args[0] || {};
    const newProps = {
      ...oldProps,
      style: [{ fontSize: 16 }, oldProps.style],
    };
    args[0] = newProps;
    return originalRender.apply(this, args);
  };
}

// Import screens
import WelcomeScreen from "./screens/WelcomeScreen";
import InitChatScreen from "./screens/InitChatScreen";
import DailyChatScreen from "./screens/DailyChatScreen";
import HomeScreen from "./screens/HomeScreen";
import SummaryScreen from "./screens/SummaryScreen";
import JourneyContinuesScreen from "./screens/JourneyContinuesScreen";
import HealthDataScreen from "./screens/HealthDataScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app with bottom tab navigation
function MainAppTabs({ navigation }) {
  // Add reset button for debugging
  const resetToWelcome = async () => {
    try {
      //clear asyncstorage
      await AsyncStorage.clear();
      navigation.navigate("Welcome");
    } catch (error) {
      console.error("Failed to reset app:", error);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Diary") {
            iconName = focused ? "journal" : "journal-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Reports") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Health") {
            iconName = focused ? "fitness" : "fitness-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={resetToWelcome} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Diary" component={HomeScreen} />
      <Tab.Screen name="Chat" component={DailyChatScreen} />
      <Tab.Screen
        name="Reports"
        component={SummaryScreen}
        initialParams={{ cleanedMessages: [] }}
      />
      <Tab.Screen name="Health" component={HealthDataScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Chat"
            component={InitChatScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Summary"
            component={SummaryScreen}
            options={{
              headerShown: true,
              headerLeft: null, // Remove back button
              gestureEnabled: false, // Disable swipe back gesture
            }}
          />
          <Stack.Screen
            name="JourneyContinues"
            component={JourneyContinuesScreen}
          />
          <Stack.Screen name="MainApp" component={MainAppTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </HelmetProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  resetButton: {
    marginRight: 10,
    padding: 5,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
