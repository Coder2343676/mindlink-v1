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
import SYSTEM_INSTRUCTION from './systemInstruction';



const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40); // New state for input height
  const flatListRef = useRef(null);


  
  const API_URL = 'https://zesty-vacherin-99a16b.netlify.app/api/app/';

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ text: inputMessage }]
    };

    setMessages(prev => {
      // Create cleaned messages FROM THE PREV STATE + NEW MESSAGE
      const messagesForApi = [...prev, newMessage].map(({ id, ...rest }) => rest);
        
      // Fire API call INSIDE the state updater
      // This ensures we use the latest state
      sendToApi(messagesForApi); 
        
      // Return the updated state for UI
      return [...prev, newMessage];
    });
    console.log(messages);

    setInputMessage('');
  }

    const sendToApi = async (cleanedMessages) => {
        try {
        setIsLoading(true);

        // debug log for payload outbound
        console.log('Sending request with:', {
            contents: cleanedMessages,
            systemInstruction: {
            role: "user",
            parts: [{ text: "..." }]
            }
        });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              contents: cleanedMessages,
              systemInstruction: {
                role: "user",
                parts: [{ 
                  text: SYSTEM_INSTRUCTION
                }]
              }
            }),
        });

        console.log('successfully sent');

        const data = await response.json();
        console.log('Raw response:', data); // debug log for payload inbound

        const botMessage = {
            id: Date.now().toString() + '-bot',
            role: "model",
            parts: [{ text: data.candidates[0].content.parts[0].text }]
        };

        setMessages((prev) => [...prev, botMessage]);
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



  const storeChat = async () => {
    try {
      const chatId = '@chat_' + Date.now(); // Generate a unique ID for the chat
      await AsyncStorage.setItem(chatId, JSON.stringify(messages));
    } catch (e) {
      console.error('Storage error:', e);
    }
  };
  
  useEffect(() => {
    const saveChatOnExit = () => {
      storeChat();
    };

    // Add event listener for screen exit
    const subscription = Keyboard.addListener('keyboardDidHide', saveChatOnExit);

    return () => {
      // Cleanup event listener
      subscription.remove();
      saveChatOnExit(); // Ensure chat is saved when component unmounts
    };
  }, [messages]);



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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // Dynamically set offset
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current.scrollToEnd()}
      />

      <SafeAreaView style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { height: Math.max(40, inputHeight) }]} // Adjust height dynamically
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          editable={!isLoading}
          multiline={true} // Enable multiline
          onContentSizeChange={(event) => {
            setInputHeight(event.nativeEvent.contentSize.height); // Dynamically adjust height
          }}
          textAlignVertical="top" // Ensure text starts at the top
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
  );
};



// Styles for ChatScreen 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 16,
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
    color: '#000',
  },
  botMessageText: {
    fontSize: 16,
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

export default ChatScreen;
