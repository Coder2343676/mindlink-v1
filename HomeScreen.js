import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const HomeScreen = ({ navigation }) => {
  const [diaryEntry, setDiaryEntry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [userName, setUserName] = useState('User');
  const [date, setDate] = useState('');

  useEffect(() => {
    // Get current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    setDate(formattedDate);

    // Fetch user name
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem('@user_name');
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error('Failed to fetch user name:', error);
      }
    };

    // Generate daily prompt
    const getDailyPrompt = () => {
      const prompts = [
        "How are you feeling today? Share your thoughts and emotions.",
        "What's one thing that made you smile today?",
        "What are you grateful for today?",
        "Is there anything that's bothering you that you'd like to talk about?",
        "What are your goals for today?",
        "How did you sleep last night? How is your energy level today?",
        "Describe your mood today using three words.",
        "What's something you're looking forward to today or this week?",
        "If you could change one thing about today, what would it be?",
        "What's something you did today that you're proud of?",
      ];
      
      // Get a semi-random prompt based on the date
      const dayOfMonth = currentDate.getDate();
      const promptIndex = dayOfMonth % prompts.length;
      return prompts[promptIndex];
    };

    fetchUserName();
    setPrompt(getDailyPrompt());
  }, []);

  const saveDiaryEntry = async () => {
    if (!diaryEntry.trim()) {
      Alert.alert("Empty Entry", "Please write something before saving.");
      return;
    }

    try {
      // Format date for filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Create diary entry with header
      const entryWithHeader = `# Diary Entry - ${formattedDate}\n\n## Prompt:\n${prompt}\n\n## Response:\n${diaryEntry}\n`;
      
      // Save to file system
      const fileName = `diary-${formattedDate}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, entryWithHeader);
      
      // Save reference in AsyncStorage for easy access
      await AsyncStorage.setItem('@last_diary_entry', diaryEntry);
      await AsyncStorage.setItem('@last_diary_date', formattedDate);
      
      Alert.alert(
        "Entry Saved",
        "Your diary entry has been saved successfully.",
        [{ text: "OK" }]
      );
      
      setDiaryEntry(''); // Clear the input after saving
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      Alert.alert("Error", "Failed to save your diary entry");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {userName}!</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
          
          <View style={styles.diaryContainer}>
            <TextInput
              style={styles.diaryInput}
              multiline={true}
              placeholder="Write your thoughts here..."
              value={diaryEntry}
              onChangeText={setDiaryEntry}
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveDiaryEntry}
          >
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e4057',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  promptContainer: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  promptText: {
    fontSize: 18,
    color: '#2e4057',
    lineHeight: 24,
  },
  diaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 250,
  },
  diaryInput: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    padding: 10,
    minHeight: 230,
  },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default HomeScreen;