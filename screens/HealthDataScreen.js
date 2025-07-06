// fully vibe coded for deadline fighting, pls dont blame me for bugs

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const HealthDataScreen = () => {
  const [sleepData, setSleepData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sleep'); // 'sleep' or 'weight'
  const [lastSyncDate, setLastSyncDate] = useState(null);

  useEffect(() => {
    // Load previously saved data
    loadSavedHealthData();
  }, []);

  const loadSavedHealthData = async () => {
    try {
      const savedSleepData = await AsyncStorage.getItem('@sleep_data');
      const savedWeightData = await AsyncStorage.getItem('@weight_data');
      const savedLastSync = await AsyncStorage.getItem('@last_health_sync');
      
      if (savedSleepData) {
        setSleepData(JSON.parse(savedSleepData));
      }
      
      if (savedWeightData) {
        setWeightData(JSON.parse(savedWeightData));
      }
      
      if (savedLastSync) {
        setLastSyncDate(savedLastSync);
      }
    } catch (error) {
      console.error('Failed to load health data:', error);
      Alert.alert('Error', 'Failed to load saved health data');
    }
  };

  const syncHealthData = async () => {
    // In a real app, this would connect to HealthKit or Google Fit
    // For this demo, we'll simulate data import
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock data for demonstration
      const currentDate = new Date();
      const mockSleepData = [];
      const mockWeightData = [];
      
      // Generate last 7 days of data
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(currentDate.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Random sleep hours between 5-9 hours
        const sleepHours = (5 + Math.random() * 4).toFixed(1);
        mockSleepData.push({
          date: dateString,
          value: parseFloat(sleepHours),
          quality: Math.floor(Math.random() * 5) + 1, // 1-5 star rating
        });
        
        // Random weight between 140-180 pounds (or adjust as needed)
        const weight = (140 + Math.random() * 40).toFixed(1);
        mockWeightData.push({
          date: dateString,
          value: parseFloat(weight),
        });
      }
      
      // Save to state
      setSleepData(mockSleepData);
      setWeightData(mockWeightData);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('@sleep_data', JSON.stringify(mockSleepData));
      await AsyncStorage.setItem('@weight_data', JSON.stringify(mockWeightData));
      
      // Save sync date
      const syncDate = new Date().toLocaleString();
      await AsyncStorage.setItem('@last_health_sync', syncDate);
      setLastSyncDate(syncDate);
      
      Alert.alert('Success', 'Health data successfully imported');
    } catch (error) {
      console.error('Failed to sync health data:', error);
      Alert.alert('Error', 'Failed to import health data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSleepData = () => {
    if (sleepData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No sleep data available</Text>
        </View>
      );
    }

    // Prepare data for the chart
    const chartData = {
      labels: sleepData.map(item => item.date.substring(5)), // MM-DD format
      datasets: [
        {
          data: sleepData.map(item => item.value),
          color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`, // Royal blue
          strokeWidth: 2,
        },
      ],
      legend: ['Sleep Hours'],
    };

    return (
      <View style={styles.dataContainer}>
        <Text style={styles.chartTitle}>Sleep Duration (Hours)</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#007bff',
            },
          }}
          bezier
          style={styles.chart}
        />
        
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Daily Sleep Log</Text>
          {sleepData.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataItemHeader}>
                <Text style={styles.dataItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.quality ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.dataItemValue}>{item.value} hours</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWeightData = () => {
    if (weightData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No weight data available</Text>
        </View>
      );
    }

    // Prepare data for the chart
    const chartData = {
      labels: weightData.map(item => item.date.substring(5)), // MM-DD format
      datasets: [
        {
          data: weightData.map(item => item.value),
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Teal
          strokeWidth: 2,
        },
      ],
      legend: ['Weight (lbs)'],
    };

    return (
      <View style={styles.dataContainer}>
        <Text style={styles.chartTitle}>Weight Tracking (lbs)</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#4BC0C0',
            },
          }}
          bezier
          style={styles.chart}
        />
        
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Weight History</Text>
          {weightData.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <Text style={styles.dataItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.dataItemValue}>{item.value} lbs</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Add a special style for web platforms to fix scrolling
  const webSpecificStyle = Platform.OS === 'web' ? { height: '75vh', overflow: 'auto' } : {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Data</Text>
        {lastSyncDate && (
          <Text style={styles.syncDate}>Last synced: {lastSyncDate}</Text>
        )}
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={syncHealthData}
          disabled={isLoading}
        >
          <Ionicons name="sync-outline" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            {isLoading ? 'Syncing...' : 'Sync Health Data'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sleep' && styles.activeTab]}
          onPress={() => setActiveTab('sleep')}
        >
          <Ionicons
            name="moon"
            size={20}
            color={activeTab === 'sleep' ? '#007bff' : '#666'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'sleep' && styles.activeTabText
          ]}>
            Sleep
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weight' && styles.activeTab]}
          onPress={() => setActiveTab('weight')}
        >
          <Ionicons
            name="fitness"
            size={20}
            color={activeTab === 'weight' ? '#007bff' : '#666'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'weight' && styles.activeTabText
          ]}>
            Weight
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Importing health data...</Text>
        </View>
      ) : (
        <ScrollView 
          style={[styles.contentContainer, webSpecificStyle]}
          contentContainerStyle={styles.scrollViewContent}
        >
          {activeTab === 'sleep' ? renderSleepData() : renderWeightData()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  syncDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  syncButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  noDataContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dataContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dataItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataItemDate: {
    fontSize: 14,
    color: '#666',
  },
  dataItemValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  starContainer: {
    flexDirection: 'row',
  },
});

export default HealthDataScreen;
