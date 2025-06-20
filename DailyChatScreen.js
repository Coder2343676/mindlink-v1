import React, { useState, useRef, useEffect } from "react";
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
  Linking,
  Dimensions,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SYSTEM_INSTRUCTION from "./systemInstruction";
import { Button } from "react-native-elements";
import * as FileSystem from "expo-file-system";

const DailyChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const flatListRef = useRef(null);
  const [userName, setUserName] = useState("");
  const [crisisModalVisible, setCrisisModalVisible] = useState(false);
  const [crisisModalShown, setCrisisModalShown] = useState(false);
  const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

  // Crisis keywords that trigger the modal
  const crisisKeywords = [
    "suicide",
    "kill myself",
    "end my life",
    "can't go on",
    "want to die",
    "hopeless",
    "worthless",
    "no way out",
    "give up",
    "self-harm",
    "cut myself",
    "hurt myself",
    "overdose",
    "jump off",
    "hang myself",
    "take my life",
    "死", // Chinese for 'die'
    "自殺", // Chinese for 'suicide'
  ];

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
            const formattedMessages = messages.map((msg) => ({
              role: msg.user && msg.user._id === 1 ? "user" : "model",
              parts: [{ text: msg.text || "" }],
            }));

            // Update the Reports tab with the current messages and switch to it
            navigation.navigate("Reports", {
              cleanedMessages: formattedMessages,
            });
          }}
        />
      ),
    });
  }, [navigation, messages]);

  // Fetch user name and load messages
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("@user_name");
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    fetchUserName();

    // Load previous messages if any
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(
          "@daily_chat_messages"
        );
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          // Show welcome message if no previous messages
          const initialMessage = {
            _id: createUniqueId("initial-message"),
            text: `Hi ${
              userName || "there"
            }! How are you feeling today? I'm here to listen and chat with you.`,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: "MindLink",
              avatar: require("./blank-profile-picture-png.webp"),
            },
          };

          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [userName]);

  const checkCrisis = (text) => {
    const lower = text.toLowerCase();
    return crisisKeywords.some((keyword) => lower.includes(keyword));
  };

  const showCrisisModal = () => setCrisisModalVisible(true);
  const hideCrisisModal = () => setCrisisModalVisible(false);

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Crisis detection
    if (checkCrisis(inputMessage) && !crisisModalShown) {
      showCrisisModal();
      setCrisisModalShown(true);
    }

    const userMessage = {
      _id: createUniqueId("user"),
      text: inputMessage.trim(),
      createdAt: new Date(),
      user: {
        _id: 1,
        name: "User",
      },
    };

    // Add user message to chat
    setMessages((previousMessages) => [...previousMessages, userMessage]);

    // Clear input
    setInputMessage("");

    // Show loading state
    setIsLoading(true);

    try {
      // Format message for API
      const formattedContents = [
        ...messages.map((msg) => ({
          role: msg.user._id === 1 ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        {
          role: "user",
          parts: [{ text: inputMessage.trim() }],
        },
      ];

      // Fetch the latest report to include in the system instruction
      let latestReport = "";
      try {
        const lastReportPath = await AsyncStorage.getItem("@last_report_path");
        if (lastReportPath) {
          const reportContent = await FileSystem.readAsStringAsync(
            lastReportPath
          );
          if (reportContent) {
            latestReport = `\n\nLatest User Report:\n${reportContent}`;
          }
        }
      } catch (err) {
        console.error("Failed to load latest report:", err);
      }

      // Make API call
      const response = await fetch(
        "https://zesty-vacherin-99a16b.netlify.app/api/app/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              role: "user",
              parts: [
                {
                  text: SYSTEM_INSTRUCTION + "\n\n\n" + userName + latestReport,
                },
              ],
            },
          }),
        }
      );

      const data = await response.json();
      const botResponse = data.candidates[0]?.content?.parts[0]?.text.trim();

      if (botResponse) {
        const botMessage = {
          _id: createUniqueId("bot"),
          text: botResponse,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "MindLink",
            avatar: require("./blank-profile-picture-png.webp"),
          },
        };

        setMessages((previousMessages) => [...previousMessages, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    // First split text by bold markers
    const boldSplit = text.split(/(\*\*.*?\*\*)/g);

    return boldSplit.map((part, boldIndex) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Handle bold text
        return (
          <Text key={`bold-${boldIndex}`} style={{ fontWeight: "bold" }}>
            {part.slice(2, -2)}
          </Text>
        );
      }

      // For non-bold text, check for phone numbers 2896 0000 and 2382 0000
      const phoneRegex = /(2896\s*0000|2382\s*0000)/g;
      const phoneParts = part.split(phoneRegex);

      if (phoneParts.length === 1) {
        // No phone numbers found
        return <Text key={`text-${boldIndex}`}>{part}</Text>;
      }

      // Process parts with phone numbers
      return (
        <Text key={`text-${boldIndex}`}>
          {phoneParts.map((subPart, phoneIndex) => {
            // If this part matches our target phone numbers
            if (subPart === "2896 0000" || subPart === "2382 0000") {
              return (
                <Text
                  key={`phone-${boldIndex}-${phoneIndex}`}
                  style={{ color: "#007bff", textDecorationLine: "underline" }}
                  onPress={() =>
                    Linking.openURL(`tel:${subPart.replace(/\s/g, "")}`)
                  }
                >
                  {subPart}
                </Text>
              );
            }
            return (
              <Text key={`text-${boldIndex}-${phoneIndex}`}>{subPart}</Text>
            );
          })}
        </Text>
      );
    });
  };

  const renderMessage = ({ item }) => {
    // Ensure user object exists to prevent crashes
    const user = item.user || { _id: 2 }; // Default to bot if no user object

    return (
      <View
        style={[
          styles.messageContainer,
          user._id === 1
            ? styles.userMessageContainer
            : styles.botMessageContainer,
        ]}
      >
        <Text
          style={
            user._id === 1 ? styles.userMessageText : styles.botMessageText
          }
        >
          {renderFormattedText(item.text || "")}
        </Text>
      </View>
    );
  };

  return (
    <>
      {/* Crisis Modal */}
      <Modal
        visible={crisisModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideCrisisModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "85%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 12,
                color: "#d32f2f",
                textAlign: "center",
              }}
            >
              If you are in crisis or need urgent help:
            </Text>
            <Text
              style={{ fontSize: 16, marginBottom: 16, textAlign: "center" }}
            >
              Please reach out immediately to a trusted adult or one of these
              24/7 hotlines:
            </Text>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL("tel:28960000");
              }}
              style={{ marginBottom: 8 }}
            >
              <Text
                style={{
                  color: "#1976d2",
                  fontWeight: "bold",
                  fontSize: 16,
                  textDecorationLine: "underline",
                }}
              >
                Suicide Prevention Hotline: 2896 0000
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL("tel:23820000");
              }}
              style={{ marginBottom: 16 }}
            >
              <Text
                style={{
                  color: "#1976d2",
                  fontWeight: "bold",
                  fontSize: 16,
                  textDecorationLine: "underline",
                }}
              >
                Samaritans 24hr Hotline: 2382 0000
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 15,
                color: "#333",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              If you feel unsafe, please call emergency services (999) or go to
              the nearest hospital.
            </Text>
            <Button
              title="I Understand"
              onPress={hideCrisisModal}
              buttonStyle={{ backgroundColor: "#007bff", borderRadius: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Main UI */}
      {Platform.OS === "web" ? (
        // Web version - fixed height layout
        <View style={styles.absoluteContainer}>
          <View style={styles.fixedHeightContainer}>
            {/* Chat area with absolute positioning and fixed height */}
            <View style={styles.chatContainer}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) =>
                  item._id || item.id || `msg-${Date.now()}-${Math.random()}`
                }
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                style={styles.flatListStyle}
              />
            </View>

            {/* Input area with absolute positioning at bottom */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { height: Math.min(80, Math.max(40, inputHeight)) },
                ]}
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
            </View>
          </View>
        </View>
      ) : (
        // Mobile version - with keyboard avoiding view
        <SafeAreaView style={styles.safeAreaContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={85}
            style={styles.keyboardAvoidView}
          >
            <View style={styles.mobileContainer}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) =>
                  item._id || item.id || `msg-${Date.now()}-${Math.random()}`
                }
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
              />

              <View style={styles.mobileInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { height: Math.min(80, Math.max(40, inputHeight)) },
                  ]}
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
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Web-specific styles
  absoluteContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f5f5f5",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  fixedHeightContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    height: "100%",
  },
  chatContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 64, // Leave space for input container
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },

  // Mobile-specific styles
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    flexDirection: "column",
  },
  mobileInputContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  flatListStyle: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20, // Extra padding at bottom to see last message
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
  },
  botMessageContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  userMessageText: {
    fontSize: 16,
    textAlign: "left",
    color: "#fff",
  },
  botMessageText: {
    fontSize: 16,
    textAlign: "left",
    color: "#000",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    height: 64, // Fixed height for input container
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007bff",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DailyChatScreen;
