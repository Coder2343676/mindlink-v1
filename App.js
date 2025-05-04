import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ImageBackground, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreen from './ChatScreen'; // Import the ChatScreen component
import SummaryScreen from './SummaryScreen'; // Import the SummaryScreen component

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    const loadName = async () => {
      try {
        const storedName = await AsyncStorage.getItem('@user_name');
        if (storedName) {
          setName(storedName);
        }
      } catch (error) {
        console.error('Failed to load name from storage:', error);
      }
    };

    loadName();
  }, []);

  const handleNavigate = async () => {
    try {
      await AsyncStorage.setItem('@user_name', name);
    } catch (error) {
      console.error('Failed to save name to storage:', error);
    }
    navigation.navigate('Chat');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://thumbs.dreamstime.com/b/mental-health-assessment-blurred-background-copy-space-concept-path-psychology-choice-future-defocused-motion-minimalistic-296432156.jpg' }} // Replace with your image URL or local asset
          style={styles.imageBackground}
        >
          <Text style={styles.welcomeText}>  Welcome to MindLink  </Text>
        </ImageBackground>
        <View style={styles.bottomContainer}>
          <Text style={styles.label}>How do you want us to call you?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity
              onPress={handleNavigate}
              style={[styles.button, name.trim() === '' && styles.buttonDisabled]}
              disabled={name.trim() === ''}
            >
              <Text style={styles.buttonText}>Go to Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
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
