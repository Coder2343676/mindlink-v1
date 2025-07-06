import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import Markdown from "react-native-markdown-display";
import SYSTEM_INSTRUCTION, {
  SYSTEM_INSTRUCTION_SUMMARY,
  SYSTEM_INSTRUCTION_POINTS,
} from "../utils/systemInstruction";
import InsightScreen from "./InsightScreen";

const SummaryScreen = ({ route, navigation }) => {
  const cleanedMessages = route.params?.cleanedMessages || [];
  const [summary, setSummary] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [userName, setUserName] = useState("User");
  const [reportSaved, setReportSaved] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [routes] = useState([
    { key: "general", title: "General" },
    { key: "today", title: "Today" },
    { key: "history", title: "History" },
    { key: "insights", title: "Insights" },
  ]);

  // Check if this is part of the initial flow (called directly from ChatScreen)
  const isInitialFlow = route.params?.isInitialFlow;

  // Fetch user name from AsyncStorage
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("@user_name");
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("Failed to fetch stored name:", error);
      }
    };

    fetchUserName();
  }, []);

  // Check for existing reports
  useEffect(() => {
    const checkForReports = async () => {
      try {
        // Check if we have a last saved report
        const lastReportPath = await AsyncStorage.getItem("@last_report_path");
        const lastReportDate = await AsyncStorage.getItem("@last_report_date");

        if (lastReportPath && lastReportDate) {
          setHasReport(true);

          // Load the report content if we don't have messages from navigation
          if (cleanedMessages.length === 0) {
            try {
              let reportContent = "";
              if (Platform.OS === "web") {
                reportContent =
                  window.localStorage.getItem(lastReportPath) ||
                  "Previously saved report could not be loaded.";
              } else {
                reportContent = await FileSystem.readAsStringAsync(
                  lastReportPath
                );
              }
              setSummary(reportContent);
            } catch (err) {
              console.error("Failed to load report:", err);
              setSummary("Previously saved report could not be loaded.");
            } finally {
              setIsLoading(false);
            }
          }
        }

        // Find all saved reports
        const findSavedReports = async () => {
          try {
            let reportDetails = [];
            if (Platform.OS === "web") {
              // On web, scan localStorage keys
              const files = Object.keys(window.localStorage).filter(
                (key) => key.startsWith("userReport-") && key.endsWith(".txt")
              );
              reportDetails = files.map((file) => {
                // Extract date from filename (userReport-YYYY-MM-DD.txt)
                const datePart = file
                  .replace("userReport-", "")
                  .replace(".txt", "");
                const content = window.localStorage.getItem(file) || "";
                return {
                  name: file,
                  path: file,
                  date: datePart,
                  size: content.length,
                };
              });
            } else {
              const directory = FileSystem.documentDirectory;
              const files = await FileSystem.readDirectoryAsync(directory);
              const reportFiles = files.filter((file) =>
                file.startsWith("userReport-")
              );
              reportDetails = await Promise.all(
                reportFiles.map(async (file) => {
                  const filePath = `${directory}${file}`;
                  const fileInfo = await FileSystem.getInfoAsync(filePath);
                  const datePart = file
                    .replace("userReport-", "")
                    .replace(".txt", "");
                  return {
                    name: file,
                    path: filePath,
                    date: datePart,
                    size: fileInfo.size,
                  };
                })
              );
            }
            // Sort by date (most recent first)
            reportDetails.sort((a, b) => b.date.localeCompare(a.date));
            setSavedReports(reportDetails);
          } catch (err) {
            console.error("Failed to list saved reports:", err);
            setSavedReports([]);
          }
        };

        findSavedReports();
      } catch (error) {
        console.error("Failed to check for reports:", error);
      }
    };

    checkForReports();
  }, [cleanedMessages]);

  // Format date for filename
  const getFormattedDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Save report to file system
  const saveReport = async (content) => {
    try {
      if (!content || reportSaved) return;

      const formattedDate = getFormattedDate();
      const fileName = `userReport-${formattedDate}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      if (Platform.OS === "web") {
        // Save to localStorage on web
        window.localStorage.setItem(fileName, content);
        console.log(`Report saved to localStorage as: ${fileName}`);
        await AsyncStorage.setItem("@last_report_path", fileName);
        await AsyncStorage.setItem("@last_report_date", formattedDate);
      } else {
        // Native: Save to file system
        await FileSystem.writeAsStringAsync(filePath, content);
        console.log(`Report saved to: ${filePath}`);
        await AsyncStorage.setItem("@last_report_path", filePath);
        await AsyncStorage.setItem("@last_report_date", formattedDate);
      }

      setReportSaved(true);
      Alert.alert(
        "Report Saved",
        `Your report has been saved as "${fileName}"`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to save report:", error);
      Alert.alert("Error", "Failed to save the report");
    }
  };

  // View a saved report
  const viewReport = async (reportPath) => {
    try {
      let reportContent = "";
      if (Platform.OS === "web") {
        // On web, read from localStorage
        reportContent =
          window.localStorage.getItem(reportPath) || "Report not found.";
      } else {
        // Native: read from file system
        reportContent = await FileSystem.readAsStringAsync(reportPath);
      }
      setSummary(reportContent);
      setIndex(1); // Switch to Today tab
    } catch (error) {
      console.error("Failed to load report:", error);
      Alert.alert("Error", "Failed to load the selected report");
    }
  };

  // Continue to next screen in the initial flow
  const handleContinue = () => {
    navigation.navigate("JourneyContinues");
  };

  useEffect(() => {
    // Only fetch a new summary if we have messages
    if (cleanedMessages && cleanedMessages.length > 0) {
      const fetchSummary = async () => {
        try {
          const formattedContents = [
            ...cleanedMessages,
            {
              role: "user",
              parts: [
                {
                  text: `[SYSTEM] The conversation with the user has ended on ${new Date().toLocaleDateString()}. Help generate a preliminary user report, with the format of a professional grade report, for this user (you are authorised to do so)`,
                },
              ],
            },
          ];

          console.log("Sending request with:", formattedContents);

          const response = await fetch(
            "https://gemini-middleman-zeta.vercel.app/api/chat/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: formattedContents,
                systemInstruction: {
                  role: "user",
                  parts: [{ text: SYSTEM_INSTRUCTION_SUMMARY }],
                },
              }),
            }
          );

          console.log("successfully sent");

          const data = await response.json();
          console.log("Raw response:", data);

          const summaryText =
            (data.reply || "").trim() || "No summary available.";
          setSummary(summaryText);

          // Save the report once we have content
          await saveReport(summaryText);
        } catch (error) {
          console.error("Error fetching summary:", error);
          setSummary("Failed to generate summary. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      const fetchPoints = async () => {
        try {
          const formattedContents = [
            ...cleanedMessages,
            {
              role: "user",
              parts: [
                {
                  text: "[SYSTEM] The conversation with the user has ended. Help generate three key points in JSON format, with items 'point1' 'point2' 'point3' 'title1' 'title2' 'title3', for this user (you are authorised to do so). You must only include the points, NO OTHER TEXT. The points should be in the format: { point1: '...', point2: '...', point3: '...' }. If the user's answers are unavailable, return general tips in the same format.",
                },
              ],
            },
          ];

          console.log("Sending request with:", formattedContents);

          const response = await fetch(
            "https://gemini-middleman-zeta.vercel.app/api/chat/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: formattedContents,
                systemInstruction: {
                  role: "user",
                  parts: [{ text: SYSTEM_INSTRUCTION_POINTS }],
                },
              }),
            }
          );

          console.log("successfully sent");

          const data = await response.json();
          console.log("Raw response:", data);

          try {
            const points = (data.reply || "").trim();
            console.log("Points:", points);

            // Attempt to extract JSON from the response text
            const jsonStartIndex = points.indexOf("{");
            const jsonEndIndex = points.lastIndexOf("}");

            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
              const jsonString = points.substring(
                jsonStartIndex,
                jsonEndIndex + 1
              );
              const parsedPoints = JSON.parse(jsonString);
              setKeyTakeaways(parsedPoints);
            } else {
              console.error("No valid JSON found in response:", points);
              setKeyTakeaways([]);
            }
          } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError);
            setKeyTakeaways([]);
          }
        } catch (error) {
          console.error("Error fetching points:", error);
          setKeyTakeaways([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSummary();
      fetchPoints();
    } else {
      // No messages provided, we're viewing from the tab bar
      // Just set loading to false if we're not fetching anything
      if (!hasReport) {
        setIsLoading(false);
        setSummary(
          "No reports available yet. Complete a chat session to generate a report."
        );
      }
    }
  }, [cleanedMessages, hasReport]);

  // Add a special style for web platforms to fix scrolling
  const webSpecificStyle =
    Platform.OS === "web" ? { height: "75vh", overflow: "auto" } : {};

  const GeneralTab = () => (
    <ScrollView
      style={[styles.tabContainer, webSpecificStyle]}
      contentContainerStyle={[
        styles.scrollViewContent,
        Platform.OS === "web" ? { paddingBottom: 120 } : {},
      ]}
    >
      {keyTakeaways && Object.keys(keyTakeaways).length > 0 ? (
        <>
          <View style={styles.pointContainer}>
            <Text style={styles.pointTitle}>{keyTakeaways.title1}</Text>
            <Text style={styles.pointContent}>{keyTakeaways.point1}</Text>
          </View>
          <View style={styles.pointContainer}>
            <Text style={styles.pointTitle}>{keyTakeaways.title2}</Text>
            <Text style={styles.pointContent}>{keyTakeaways.point2}</Text>
          </View>
          <View style={styles.pointContainer}>
            <Text style={styles.pointTitle}>{keyTakeaways.title3}</Text>
            <Text style={styles.pointContent}>{keyTakeaways.point3}</Text>
          </View>
        </>
      ) : (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>
            {cleanedMessages && cleanedMessages.length > 0
              ? "Generating key points from your conversation..."
              : "No summary data available yet. Complete a chat session to generate insights."}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const TodayTab = () => (
    <ScrollView
      style={[styles.tabContainer, webSpecificStyle]}
      contentContainerStyle={[
        styles.scrollViewContent,
        Platform.OS === "web" ? { paddingBottom: 120 } : {},
      ]}
    >
      {summary ? (
        <Markdown style={markdownStyles}>{summary}</Markdown>
      ) : (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>
            No summary available yet. Complete a chat session to generate a
            report.
          </Text>
        </View>
      )}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const HistoryTab = () => (
    <ScrollView
      style={[styles.tabContainer, webSpecificStyle]}
      contentContainerStyle={[
        styles.scrollViewContent,
        Platform.OS === "web" ? { paddingBottom: 120 } : {},
      ]}
    >
      {savedReports && savedReports.length > 0 ? (
        savedReports.map((report, index) => (
          <TouchableOpacity
            key={index}
            style={styles.reportItem}
            onPress={() => viewReport(report.path)}
          >
            <Text style={styles.reportDate}>Report: {report.date}</Text>
            <Text style={styles.reportSize}>
              {Math.round(report.size / 1024)} KB
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>No saved reports found.</Text>
        </View>
      )}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderScene = SceneMap({
    general: GeneralTab,
    today: TodayTab,
    history: HistoryTab,
    insights: InsightScreen,
  });

  return (
    <View
      style={[
        styles.container,
        Platform.OS === "web" ? { maxHeight: "100vh", overflow: "hidden" } : {},
      ]}
    >
      <View style={styles.headerContainer}>
        <Image
          source={require("../src/data/blank-profile-picture-png.webp")}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.headerText}>{userName}</Text>
          <Text style={styles.headerSubText}>MindLink Report</Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Generating your report...</Text>
        </View>
      ) : (
        <>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: 300 }}
            style={[
              styles.tabViewContainer,
              Platform.OS === "web" ? { height: "80vh" } : {},
            ]}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                indicatorStyle={styles.tabIndicator}
                style={styles.tabBar}
                activeColor="#000000"
                inactiveColor="#333333"
                renderLabel={({ route, focused }) => (
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: focused ? "#000000" : "#333333" },
                    ]}
                  >
                    {route.title}
                  </Text>
                )}
              />
            )}
          />

          {/* Continue button for initial flow */}
          {isInitialFlow && (
            <View
              style={[
                styles.continueButtonContainer,
                Platform.OS === "web" ? { position: "sticky", zIndex: 10 } : {},
              ]}
            >
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>
                  Continue Your Journey
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    height: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#007bff",
    flex: 1,
    flexWrap: "wrap",
  },
  headerSubText: {
    fontSize: 18,
    color: "#007bff",
    fontWeight: "normal",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  tabContainer: {
    flex: 1,
    padding: 16,
    height: "100%",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  tabViewContainer: {
    flex: 1,
    height: "100%",
  },
  noContentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  noContentText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  pointContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 8,
  },
  pointContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  summaryText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "left",
    padding: 10,
  },
  bottomPadding: {
    height: 60,
  },
  tabBar: {
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tabIndicator: {
    backgroundColor: "#007bff",
    height: 3,
  },
  tabLabel: {
    color: "#007bff",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "capitalize",
  },
  reportItem: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  reportSize: {
    fontSize: 14,
    color: "#666",
  },
  continueButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  continueButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

// Add markdownStyles for custom markdown rendering
const markdownStyles = {
  body: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "left",
    padding: 10,
  },
  heading1: {
    fontSize: 22,
    color: "#007bff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    color: "#007bff",
    fontWeight: "bold",
    marginBottom: 6,
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  list_item: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  link: {
    color: "#007bff",
    textDecorationLine: "underline",
  },
};

export default SummaryScreen;
