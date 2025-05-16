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
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const HomeScreen = ({ navigation }) => {
  const [diaryEntry, setDiaryEntry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [userName, setUserName] = useState('User');
  const [date, setDate] = useState('');
  const [savedDiaries, setSavedDiaries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [routes] = useState([
    { key: 'write', title: 'Write' },
    { key: 'history', title: 'History' },
  ]);

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
    loadDiaryEntries();
  }, []);

  // Load saved diary entries
  const loadDiaryEntries = async () => {
    try {
      setIsLoading(true);
      const directory = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(directory);
      
      // Filter for diary files
      const diaryFiles = files.filter(file => file.startsWith('diary-'));
      
      // Get details for each diary entry
      const diaryDetails = await Promise.all(diaryFiles.map(async (file) => {
        const filePath = `${directory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        // Extract date from filename (diary-YYYY-MM-DD.txt)
        const datePart = file.replace('diary-', '').replace('.txt', '');
        
        // Format the date for display
        const [year, month, day] = datePart.split('-');
        const entryDate = new Date(year, month - 1, day);
        const formattedDate = entryDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        
        return {
          name: file,
          path: filePath,
          date: datePart,
          displayDate: formattedDate,
          size: fileInfo.size,
        };
      }));
      
      // Sort by date (most recent first)
      diaryDetails.sort((a, b) => b.date.localeCompare(a.date));
      
      setSavedDiaries(diaryDetails);
    } catch (err) {
      console.error('Failed to list saved diaries:', err);
      setSavedDiaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // View a saved diary entry
  const viewDiaryEntry = async (entryPath) => {
    try {
      const entryContent = await FileSystem.readAsStringAsync(entryPath);
      setSelectedEntry(entryContent);
    } catch (error) {
      console.error('Failed to load diary entry:', error);
      Alert.alert("Error", "Failed to load the selected diary entry");
    }
  };

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
      
      // Reload diary entries to show the new one
      loadDiaryEntries();
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      Alert.alert("Error", "Failed to save your diary entry");
    }
  };

  // Tab for writing new entries
  const WriteTab = () => (
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
  );

  // Tab for viewing diary history
  const HistoryTab = () => (
    <View style={styles.historyContainer}>
      {selectedEntry ? (
        <ScrollView style={styles.entryDetailContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedEntry(null)}
          >
            <Text style={styles.backButtonText}>← Back to all entries</Text>
          </TouchableOpacity>
          <Text style={styles.entryText}>{selectedEntry}</Text>
          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading diary entries...</Text>
            </View>
          ) : (
            <ScrollView style={styles.entriesListContainer}>
              {savedDiaries.length > 0 ? (
                savedDiaries.map((diary, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.diaryItem}
                    onPress={() => viewDiaryEntry(diary.path)}
                  >
                    <Text style={styles.diaryDate}>{diary.displayDate}</Text>
                    <Text style={styles.diarySize}>{Math.round(diary.size / 1024)} KB</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noContentContainer}>
                  <Text style={styles.noContentText}>No diary entries found. Start writing to create your first entry!</Text>
                </View>
              )}
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}
        </>
      )}
    </View>
  );

  const renderScene = SceneMap({
    write: WriteTab,
    history: HistoryTab,
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: 300 }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              indicatorStyle={styles.tabIndicator}
              style={styles.tabBar}
              labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              renderLabel={({ route }) => (
                <Text style={styles.tabLabel}>
                  {route.title}
                </Text>
              )}
            />
          )}
        />
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
  },
  // Styles for history tab
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  entriesListContainer: {
    flex: 1,
    padding: 16,
  },
  diaryItem: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaryDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  diarySize: {
    fontSize: 14,
    color: '#666',
  },
  entryDetailContainer: {
    flex: 1,
    padding: 16,
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
    padding: 10,
  },
  tabBar: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabIndicator: {
    backgroundColor: '#007bff',
    height: 3,
  },
  tabLabel: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  noContentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noContentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  }
});

export default HomeScreen;