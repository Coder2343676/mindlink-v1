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
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        const storedName = await AsyncStorage.getItem('@user_name');
        
        if (hasLaunched === 'true' && storedName) {
          setIsFirstLaunch(false);
          setName(storedName);
        }
      } catch (error) {
        console.error('Failed to check app launch status:', error);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleNavigate = async () => {
    try {
      await AsyncStorage.setItem('@user_name', name);
      await AsyncStorage.setItem('@has_launched', 'true');
      
      if (isFirstLaunch) {
        // First time users go to onboarding chat
        navigation.navigate('Chat');
      } else {
        // Returning users go straight to the main app
        navigation.navigate('MainApp');
      }
    } catch (error) {
      console.error('Failed to save name to storage:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://thumbs.dreamstime.com/b/mental-health-assessment-blurred-background-copy-space-concept-path-psychology-choice-future-defocused-motion-minimalistic-296432156.jpg' }}
          style={styles.imageBackground}
        >
          <Text style={styles.welcomeText}>Welcome to MindLink</Text>
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
              <Text style={styles.buttonText}>
                {isFirstLaunch ? 'Get Started' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
          {!isFirstLaunch && (
            <Text style={styles.welcomeBack}>
              Welcome back, {name}!
            </Text>
          )}
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
    fontSize: 28,
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
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  welcomeBack: {
    marginTop: 16,
    fontSize: 16,
    color: '#007bff',
    textAlign: 'center',
  },
});

export default WelcomeScreen;