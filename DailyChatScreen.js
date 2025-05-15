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
  
  // Set up the header with a button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          title="View Report"
          onPress={() => {
            const cleanedMessages = messages.map(({ id, ...rest }) => rest);
            navigation.navigate('Summary', { cleanedMessages });
          }}
        />
      ),
    });
  }, [navigation, messages]);

  // Fetch user name
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
          setTimeout(() => {
            const botMessage = {
              id: Date.now().toString() + '-bot',
              role: "model",
              parts: [{ text: `Welcome back, ${userName || 'there'}! How are you feeling today? I'm here to listen and support you.` }]
            };
            setMessages((prev) => [...prev, botMessage]);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    
    loadMessages();
  }, [userName]);

  const API_URL_CHAT = 'https://zesty-vacherin-99a16b.netlify.app/api/app/';

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ text: inputMessage.trim() }]
    };

    setMessages(prev => {
      const messagesForApi = [...prev, newMessage].map(({ id, ...rest }) => rest);
      sendToApi(messagesForApi);
      return [...prev, newMessage];
    });
    
    setInputMessage('');
  };

  const sendToApi = async (cleanedMessages) => {
    try {
      setIsLoading(true);

      const response = await fetch(API_URL_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contents: cleanedMessages,
          systemInstruction: {
            role: "user",
            parts: [{ 
              text: DAILY_SYSTEM_INSTRUCTION
            }]
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now().toString() + '-bot',
        role: "model",
        parts: [{ text: data.candidates[0].content.parts[0].text.trim() }]
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, botMessage];
        // Save messages to AsyncStorage
        AsyncStorage.setItem('@daily_chat_messages', JSON.stringify(updatedMessages))
          .catch(error => console.error('Failed to save messages:', error));
        return updatedMessages;
      });
    } catch (error) {
      console.error('API Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-error',
          role: "model",
          parts: [{ text: 'Sorry, I encountered an error. Please try again.' }]
        },
      ]);
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

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <Text style={item.role === 'user' ? styles.userMessageText : styles.botMessageText}>
        {renderFormattedText(item.parts[0].text)}
      </Text>
    </View>
  );

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
          keyExtractor={(item) => item.id}
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
            onPress={handleSend}
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