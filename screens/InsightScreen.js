import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import Markdown from "react-native-markdown-display";

const InsightScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      // Step 1: Data Retrieval
      const allEntries = await getAllDiaryEntries();

      if (allEntries.length === 0) {
        setInsights({
          error: "Not enough data to generate insights. Keep journaling!",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Quantitative Analysis
      const moodTrajectory = getMoodTrajectory(allEntries);
      const tagFrequency = getTagFrequency(allEntries);

      // Step 3: Thematic Analysis (AI Task #1)
      const allText = allEntries.map((e) => e.response).join("\n\n");
      const themes = await getThemes(allText);

      // Step 4: Correlation Heuristics (AI Task #2)
      const lowMoodDays = allEntries.filter((e) => e.mood < 4);
      const lowMoodText = lowMoodDays.map((e) => e.response).join("\n\n");
      const correlations = await getCorrelations(lowMoodText);

      // Step 5: Critical Quote Extraction (AI Task #3)
      const criticalQuote = await getCriticalQuote(allText);

      // Step 6: Final Synthesis (AI Task #4)
      const sessionBrief = await getSessionBrief({
        mood_data: moodTrajectory,
        tag_counts: tagFrequency,
        themes: themes,
        correlations: correlations,
        critical_quote: criticalQuote,
      });

      setInsights({
        moodTrajectory,
        tagFrequency,
        themes,
        correlations,
        criticalQuote,
        sessionBrief,
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights({ error: "Failed to generate insights." });
    } finally {
      setIsLoading(false);
    }
  };

  const getAllDiaryEntries = async () => {
    let diaryDetails = [];
    if (Platform.OS === "web") {
      const keys = Object.keys(window.localStorage).filter(
        (key) => key.startsWith("diary-") && key.endsWith(".json")
      );
      for (const key of keys) {
        const content = window.localStorage.getItem(key);
        if (content) {
          diaryDetails.push(JSON.parse(content));
        }
      }
    } else {
      const directory = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(directory);
      const diaryFiles = files.filter(
        (file) => file.startsWith("diary-") && file.endsWith(".json")
      );
      for (const file of diaryFiles) {
        const filePath = `${directory}${file}`;
        const content = await FileSystem.readAsStringAsync(filePath);
        if (content) {
          diaryDetails.push(JSON.parse(content));
        }
      }
    }
    return diaryDetails;
  };

  const getMoodTrajectory = (entries) => {
    return entries.map((e) => ({ date: e.date, mood: e.mood }));
  };

  const getTagFrequency = (entries) => {
    const tagCounts = {};
    entries.forEach((e) => {
      if (e.tags) {
        e.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return tagCounts;
  };

  const callGemini = async (prompt, systemInstruction) => {
    const response = await fetch(
      "https://gemini-middleman-zeta.vercel.app/api/chat/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: {
            role: "user",
            parts: [{ text: systemInstruction }],
          },
        }),
      }
    );
    const data = await response.json();
    return (data.reply || "").trim();
  };

  const getThemes = async (text) => {
    const prompt = `Analyze the following journal entries. Identify and extract the top 3-5 recurring emotional themes. Respond ONLY with a JSON array. Example: ["Exam-related stress", "Conflict with mother", "Feelings of social isolation"]\n\nEntries:\n${text}`;
    const result = await callGemini(
      prompt,
      "You are an expert in thematic analysis."
    );
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse themes:", result);
      return ["Could not determine themes."];
    }
  };

  const getCorrelations = async (text) => {
    if (!text) return "No low mood days recorded.";
    const prompt = `The user reported feeling very low on these days. Based ONLY on the following text from those days, what are the primary stressors or topics mentioned? Respond with a short list.\n\nText:\n${text}`;
    return await callGemini(
      prompt,
      "You are an expert in identifying stressors."
    );
  };

  const getCriticalQuote = async (text) => {
    const prompt = `Review the following personal journal entries. Extract the single most poignant, emotionally resonant, and representative sentence that encapsulates the writer's core struggle. It should be a direct quote. Respond with ONLY the sentence in a JSON object: {"quote": "The chosen sentence."}\n\nEntries:\n${text}`;
    const result = await callGemini(
      prompt,
      "You are an expert in identifying emotionally significant quotes."
    );
    // Cleanse the result: remove code block markers and trim whitespace
    let cleansed = result.replace(/```[a-zA-Z]*|```/g, "").trim();
    try {
      const parsed = JSON.parse(cleansed);
      return parsed.quote;
    } catch (e) {
      console.error("Failed to parse quote:", result);
      return "Could not extract a critical quote.";
    }
  };

  const getSessionBrief = async (data) => {
    const prompt = `You are a clinical assistant writing a summary for a busy psychiatrist. Based on the following structured data, write a concise, professional, and empathetic 'Session Brief'. Start with the mood trajectory, then highlight the key correlations and themes, include the critical quote to humanize the data, and conclude with two suggested opening questions for the psychiatrist to use in their session. Be brief and scannable.\n\nData:\n${JSON.stringify(
      data,
      null,
      2
    )}`;
    return await callGemini(prompt, "You are a helpful clinical assistant.");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Generating Insights...</Text>
        </View>
      );
    }

    if (insights?.error) {
      return (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>{insights.error}</Text>
        </View>
      );
    }

    if (!insights) {
      return (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>No insights available.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.header}>Session Brief</Text>
        <Text style={styles.sectionContent}>
          Meant to be read by a psychiatrist, placed here for demo purposes.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Final Summary</Text>
          <Markdown style={styles.sectionContent}>
            {insights.sessionBrief}
          </Markdown>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Quote</Text>
          <Text style={styles.quote}>"{insights.criticalQuote}"</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Trajectory</Text>
          {insights.moodTrajectory.map((mood, index) => (
            <Text key={index} style={styles.sectionContent}>
              {mood.date}: {mood.mood}/10
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tag Frequency</Text>
          {Object.entries(insights.tagFrequency).map(([tag, count]) => (
            <Text key={tag} style={styles.sectionContent}>
              #{tag}: {count} times
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring Themes</Text>
          {insights.themes.map((theme, index) => (
            <Text key={index} style={styles.sectionContent}>
              - {theme}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low Mood Stressors</Text>
          <Text style={styles.sectionContent}>{insights.correlations}</Text>
        </View>
      </ScrollView>
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8fa",
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
  noContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noContentText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e4057",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  quote: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#555",
    lineHeight: 24,
    textAlign: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
  },
});

export default InsightScreen;
