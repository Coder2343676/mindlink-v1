import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import SYSTEM_INSTRUCTION, { SYSTEM_INSTRUCTION_SUMMARY } from './systemInstruction';

const SummaryScreen = ({ route }) => {
  console.log('moved screens', route.params);

  const cleanedMessages = route.params;
  console.log('cleanedMessages', cleanedMessages);

  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        console.log('Sending request with:', {
          contents: cleanedMessages.cleanedMessages,
          systemInstruction: {
            role: "user",
            parts: [{ text: "..." }]
          }
        });

        const response = await fetch('https://zesty-vacherin-99a16b.netlify.app/api/app/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            contents: [...cleanedMessages.cleanedMessages + [{ "role": "user", "parts": [ { "text": "how do i use RAG in gemini? i'm making a mental health AI chatbot assessment tool, and i have a manual for psychiatrists for reference " },]}]],
            systemInstruction: {
              role: "user",
              parts: [{ 
                text: SYSTEM_INSTRUCTION_SUMMARY
              }]
            },
          })
        });

        console.log('successfully sent');

        const data = await response.json();
        console.log('Raw response:', data); // debug log for payload inbound

        setSummary(data.candidates[0].content.parts[0].text.trim());
      } catch (error) {
        console.error('Error fetching summary:', error);
        setSummary('Failed to generate summary. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [cleanedMessages]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <Text style={styles.titleText}>Chat Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007bff',
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});

export default SummaryScreen;
