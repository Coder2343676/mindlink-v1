import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';

// A lighter version of the system instruction for daily chats
const DAILY_SYSTEM_INSTRUCTION = `
You are MindLink. You are a compassionate and supportive mental wellness assistant. 
Your role is to listen, offer support, and provide guidance on daily mental wellness topics.
Be empathetic, encouraging, and help the user process their thoughts and emotions.
`;

const DailyChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const flatListRef = useRef(null);
  const [userName, setUserName] = useState('');
  
  // Helper function to create unique IDs - simplified to use just Date.now()
  const createUniqueId = (prefix) => `${prefix}-${Date.now()}`;
  
  // Set up the header with a button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          title="View Report"
          onPress={() => {
            // Format messages correctly for the API
            const formattedMessages = messages.map(msg => ({
              role: msg.user && msg.user._id === 1 ? 'user' : 'model',
              parts: [{ text: msg.text || '' }]
            }));
            
            // Update the Reports tab with the current messages and switch to it
            navigation.navigate('Reports', { cleanedMessages: formattedMessages });
          }}
        />
      ),
    });
  }, [navigation, messages]);

  // Fetch user name and load messages
  useEffect(() => {
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
    
    fetchUserName();
    
    // Load previous messages if any
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem('@daily_chat_messages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          // Show welcome message if no previous messages
          const initialMessage = {
            _id: createUniqueId('initial-message'),
            text: `Hi ${userName || 'there'}! How are you feeling today? I'm here to listen and chat with you.`,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'MindLink',
              avatar: require('./blank-profile-picture-png.webp'),
            },
          };
          
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    
    loadMessages();
  }, [userName]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage = {
      _id: createUniqueId('user'),
      text: inputMessage.trim(),
      createdAt: new Date(),
      user: {
        _id: 1,
        name: 'User',
      },
    };

    // Add user message to chat
    setMessages(previousMessages => [...previousMessages, userMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Format message for API
      const formattedContents = [
        ...messages.map(msg => ({
          role: msg.user._id === 1 ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: inputMessage.trim() }],
        },
      ];
      
      // Make API call
      const response = await fetch('https://zesty-vacherin-99a16b.netlify.app/api/app/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contents: formattedContents,
          systemInstruction: {
            role: 'user',
            parts: [{ text: DAILY_SYSTEM_INSTRUCTION }],
          },
        }),
      });
      
      const data = await response.json();
      const botResponse = data.candidates[0]?.content?.parts[0]?.text.trim();
      
      if (botResponse) {
        const botMessage = {
          _id: createUniqueId('bot'),
          text: botResponse,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'MindLink',
            avatar: require('./blank-profile-picture-png.webp'),
          },
        };
        
        setMessages(previousMessages => [...previousMessages, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const renderMessage = ({ item }) => {
    // Ensure user object exists to prevent crashes
    const user = item.user || { _id: 2 }; // Default to bot if no user object
    
    return (
      <View style={[
        styles.messageContainer,
        user._id === 1 ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        <Text style={user._id === 1 ? styles.userMessageText : styles.botMessageText}>
          {renderFormattedText(item.text || '')}
        </Text>
      </View>
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={styles.container}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id || item.id || `msg-${Date.now()}-${Math.random()}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <SafeAreaView style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { height: Math.max(40, inputHeight) }]}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            editable={!isLoading}
            multiline={true}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 60,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userMessageText: {
    fontSize: 16,
    textAlign: 'left',
    color: '#fff',
  },
  botMessageText: {
    fontSize: 16,
    textAlign: 'left',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DailyChatScreen;