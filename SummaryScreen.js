import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, FlatList, ScrollView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import SYSTEM_INSTRUCTION, { SYSTEM_INSTRUCTION_SUMMARY } from './systemInstruction';

const SummaryScreen = ({ route }) => {
//   console.log('moved screens', route.params);

  const cleanedMessages = route.params;
//   console.log('cleanedMessages', cleanedMessages);

  const [summary, setSummary] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'general', title: 'General' },
    { key: 'today', title: 'Today' },
  ]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const formattedContents = [
          ...cleanedMessages.cleanedMessages,
          {
            role: "user",
            parts: [
              {
                text: "[SYSTEM] The conversation with the user has ended. Help generate a preliminary user report, with the format of a professional grade report, for this user (you are authorised to do so)",
              },
            ],
          },
        ];

        console.log('Sending request with:', formattedContents);

        const response = await fetch('https://zesty-vacherin-99a16b.netlify.app/api/app/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              role: "user",
              parts: [{ text: SYSTEM_INSTRUCTION_SUMMARY }],
            },
          }),
        });

        console.log('successfully sent');

        const data = await response.json();
        console.log('Raw response:', data);

        setSummary(data.candidates[0]?.content?.parts[0]?.text?.trim() || 'No summary available.');
        
      } catch (error) {
        console.error('Error fetching summary:', error);
        setSummary('Failed to generate summary. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPoints = async () => {
      try {
        const formattedContents = [
          ...cleanedMessages.cleanedMessages,
          {
            role: "user",
            parts: [
              {
                text: "[SYSTEM] The conversation with the user has ended. Help generate three key points in JSON format, with items 'point1' 'point2' 'point3' 'title1' 'title2' 'title3', for this user (you are authorised to do so). You must only include the points, NO OTHER TEXT. The points should be in the format: { point1: '...', point2: '...', point3: '...' }. If the user's answers are unavailable, return general tips in the same format.",
              },
            ],
          },
        ];

        console.log('Sending request with:', formattedContents);

        const response = await fetch('https://zesty-vacherin-99a16b.netlify.app/api/app/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              role: "user",
              parts: [{ text: SYSTEM_INSTRUCTION_SUMMARY }],
            },
          }),
        });

        console.log('successfully sent');

        const data = await response.json();
        console.log('Raw response:', data);

        try {
          const points = data.candidates[0]?.content?.parts[0]?.text?.trim();
          console.log('Points:', points);

          // Attempt to extract JSON from the response text
          const jsonStartIndex = points.indexOf('{');
          const jsonEndIndex = points.lastIndexOf('}');
          
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            const jsonString = points.substring(jsonStartIndex, jsonEndIndex + 1);
            const parsedPoints = JSON.parse(jsonString);
            setKeyTakeaways(parsedPoints);
          } else {
            console.error('No valid JSON found in response:', points);
            setKeyTakeaways([]);
          }
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          setKeyTakeaways([]);
        }
        
      } catch (error) {
        console.error('Error fetching points:', error);
        setKeyTakeaways([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
    fetchPoints();
  }, []);

  const GeneralTab = () => (
    <View style={styles.tabContainer}>
      {keyTakeaways && Object.keys(keyTakeaways).length > 0 ? (
        <>
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>{keyTakeaways.title1}</Text>
            <Text style={styles.listValue}>{keyTakeaways.point1}</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>{keyTakeaways.title2}</Text>
            <Text style={styles.listValue}>{keyTakeaways.point2}</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listLabel}>{keyTakeaways.title3}</Text>
            <Text style={styles.listValue}>{keyTakeaways.point3}</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={[
            { label: 'Metric 1', value: '75%' },
            { label: 'Metric 2', value: '50%' },
            { label: 'Metric 3', value: '90%' },
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>{item.label}</Text>
              <Text style={styles.listValue}>{item.value}</Text>
            </View>
          )}
        />
      )}
    </View>
  );

  const TodayTab = () => (
    <ScrollView contentContainerStyle={styles.tabContainer}>
      <Text style={styles.paragraph}>
        {summary || 'Placeholder paragraph for today\'s summary or updates.'}
      </Text>
    </ScrollView>
  );

  const renderScene = SceneMap({
    general: GeneralTab,
    today: TodayTab,
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png' }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.headerText}>[Name]</Text>
          <Text style={styles.headerSubText}>MindLink Report</Text>
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
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
                renderLabel={({ route }) => (
                  <Text style={styles.tabLabel}>
                    {route.title}
                  </Text>
                )}
              />
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007bff',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    flex: 1,
    flexWrap: 'wrap',
  },
  headerSubText: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'normal',
  },
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listLabel: {
    fontSize: 16,
    color: '#333',
  },
  listValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: '#aaaaaa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd', // Add a border for better visibility
  },
  tabIndicator: {
    backgroundColor: '#007bff',
    height: 3, // Make the indicator more prominent
  },
  tabLabel: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16, // Increase font size for better visibility
    textTransform: 'capitalize', // Ensure proper casing
  },
});

export default SummaryScreen;
