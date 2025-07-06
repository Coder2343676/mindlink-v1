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

// =================================================================================================
// **MindLink Insight Engine**
//
// This screen implements the core "WOW factor" of the MindLink application: the Insight Engine.
// It functions as a clinical intelligence platform, transforming raw, unstructured user diary
// entries into a structured, scannable "Session Brief" for mental health professionals.
//
// The process follows a multi-step pipeline, as outlined in the product strategy, to ensure
// that the final output is not just a simple summary, but a clinical synthesis. This avoids
// the pitfalls of a simple "GPT wrapper" and provides tangible, actionable insights.
// =================================================================================================

const InsightScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    generateInsights();
  }, []);

  /**
   * @description Orchestrates the generation of the "Session Brief" by executing the Insight Engine pipeline.
   * This function follows the multi-step process of data retrieval, quantitative analysis,
   * targeted AI-driven thematic analysis, and final synthesis.
   */
  const generateInsights = async () => {
    setIsLoading(true);
    try {
      // =================================================================
      // **Step 1: Data Retrieval**
      //
      // Gather all diary entries from the user's device. This is the
      // raw data source for the entire Insight Engine.
      // =================================================================
      const allEntries = await getAllDiaryEntries();

      if (allEntries.length === 0) {
        setInsights({
          error: "Not enough data to generate insights. Keep journaling!",
        });
        setIsLoading(false);
        return;
      }

      // =================================================================
      // **Step 2: Quantitative Analysis (The "Easy Wins")**
      //
      // Perform non-AI-based analysis on structured data points. This
      // provides an objective, quantitative anchor for the report.
      // =================================================================
      const moodTrajectory = getMoodTrajectory(allEntries);
      const tagFrequency = getTagFrequency(allEntries);

      // =================================================================
      // **Step 3: Thematic Analysis (Targeted AI Task #1)**
      //
      // Use a targeted LLM call to extract recurring emotional themes
      // from the user's journal entries.
      // =================================================================
      const allText = allEntries.map((e) => e.response).join("\n\n");
      const themes = await getThemes(allText);

      // =================================================================
      // **Step 4: Correlation Heuristics (Targeted AI Task #2)**
      //
      // Identify days with low mood scores and use a targeted LLM call
      // to find the primary stressors or topics mentioned on ONLY those days.
      // This provides a powerful, achievable clinical heuristic.
      // =================================================================
      const lowMoodDays = allEntries.filter((e) => e.mood < 4);
      const lowMoodText = lowMoodDays.map((e) => e.response).join("\n\n");
      const correlations = await getCorrelations(lowMoodText);

      // =================================================================
      // **Step 5: Critical Quote Extraction (Targeted AI Task #3)**
      //
      // Use a targeted LLM call to find the single most poignant and
      // emotionally resonant sentence from all entries. This serves as
      // the "emotional hook" for the brief.
      // =================================================================
      const criticalQuote = await getCriticalQuote(allText);

      // =================================================================
      // **Step 6: Final Synthesis (The Final AI Task)**
      //
      // Combine all the structured data gathered in the previous steps
      // into a single object. This object is then sent to the LLM with a
      // final prompt to generate a well-written, empathetic, and
      // professional "Session Brief". This ensures the AI is acting as a
      // skilled writer, not an analyst, which is a more reliable task.
      // =================================================================
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

  /**
   * @description Retrieves all diary entries stored locally on the device.
   * Supports both web (localStorage) and native (FileSystem) platforms.
   * @returns {Promise<Array>} A promise that resolves to an array of diary entry objects.
   */
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

  /**
   * @description Extracts mood scores and dates to create the Mood Trajectory data.
   * @param {Array} entries - The array of all diary entries.
   * @returns {Array} An array of objects, each containing a date and a mood score.
   */
  const getMoodTrajectory = (entries) => {
    return entries.map((e) => ({ date: e.date, mood: e.mood }));
  };

  /**
   * @description Calculates the frequency of each user-selected tag.
   * @param {Array} entries - The array of all diary entries.
   * @returns {Object} An object where keys are tags and values are their counts.
   */
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

  /**
   * @description A wrapper for calling the Gemini API with a specific prompt and system instruction.
   * @param {string} prompt - The user prompt for the AI.
   * @param {string} systemInstruction - The system instruction to guide the AI's role.
   * @returns {Promise<string>} The processed text reply from the AI.
   */
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

  /**
   * @description AI Task #1: Extracts the top 3-5 recurring emotional themes from journal text.
   * @param {string} text - A concatenation of all journal entries.
   * @returns {Promise<Array<string>>} A promise that resolves to an array of theme strings.
   */
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

  /**
   * @description AI Task #2: Identifies primary stressors from entries on low-mood days.
   * @param {string} text - A concatenation of journal entries from low-mood days.
   * @returns {Promise<string>} A promise that resolves to a string listing the stressors.
   */
  const getCorrelations = async (text) => {
    if (!text) return "No low mood days recorded.";
    const prompt = `The user reported feeling very low on these days. Based ONLY on the following text from those days, what are the primary stressors or topics mentioned? Respond with a short list.\n\nText:\n${text}`;
    return await callGemini(
      prompt,
      "You are an expert in identifying stressors."
    );
  };

  /**
   * @description AI Task #3: Extracts the single most poignant and representative quote.
   * @param {string} text - A concatenation of all journal entries.
   * @returns {Promise<string>} A promise that resolves to the extracted quote.
   */
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

  /**
   * @description Final AI Task: Synthesizes all structured data into a final, professional brief.
   * @param {Object} data - The structured data object containing all prior analysis.
   * @returns {Promise<string>} A promise that resolves to the final Session Brief markdown string.
   */
  const getSessionBrief = async (data) => {
    const prompt = `You are a clinical assistant writing a summary for a busy psychiatrist. Based on the following structured data, write a concise, professional, and empathetic 'Session Brief'. Start with the mood trajectory, then highlight the key correlations and themes, include the critical quote to humanize the data, and conclude with two suggested opening questions for the psychiatrist to use in their session. Be brief and scannable.\n\nData:\n${JSON.stringify(
      data,
      null,
      2
    )}`;
    return await callGemini(prompt, "You are a helpful clinical assistant.");
  };

  /**
   * @description Renders the UI based on the current state (loading, error, or success).
   * When successful, it displays the full "Session Brief".
   */
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
