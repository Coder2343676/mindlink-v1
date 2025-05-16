import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ImageBackground, 
  SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WelcomeScreen = ({ navigation }) => {
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

  useEffect(() => {
    const skipScreen = async () => {
      try {
        const initialChatCompleted = await AsyncStorage.getItem('@initial_chat_completed');
        if (initialChatCompleted === 'true') {
          // If initial chat is completed, go to MainApp (HomeScreen)
          navigation.navigate('MainApp');
        }  
      } catch (error) {
        console.error('Failed to check chat status:', error);
      }
    };

    skipScreen();
  }, []);

  const handleNavigate = async () => {
    try {
      // Save the user name
      await AsyncStorage.setItem('@user_name', name);
      
      // redundancy check to ensure not complete initial chat
      // Check if the initial chat is completed
      const initialChatCompleted = await AsyncStorage.getItem('@initial_chat_completed');
      
      if (initialChatCompleted === 'true') {
        // If initial chat is completed, go to MainApp (HomeScreen)
        navigation.navigate('MainApp');
      } else {
        // If initial chat is not completed, go to ChatScreen
        navigation.navigate('Chat');
      }
    } catch (error) {
      console.error('Failed to save data or check chat status:', error);
      // Default to ChatScreen if there's an error
      navigation.navigate('Chat');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://thumbs.dreamstime.com/b/mental-health-assessment-blurred-background-copy-space-concept-path-psychology-choice-future-defocused-motion-minimalistic-296432156.jpg' }}
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
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

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

export default WelcomeScreen;