# MindLink - Mental Wellness Assistant

Created by Mak Yiu Man Raymond (麥耀文) for the HKU InnoHealth project

## Overview

MindLink is a mobile application designed to serve as a compassionate and supportive mental wellness assistant specifically for Hong Kong teenagers. The app provides a safe space for users to express their thoughts and emotions, tracks mental wellness metrics, and generates personalized reports and insights.

## Features

- **Personalized Chat Experience**: Interactive conversations with an AI assistant that adapts to user responses
- **Initial Assessment**: Discreet mental health screening based on PHQ-9 framework
- **Daily Journal**: Space for users to record their thoughts and feelings
- **Regular Check-ins**: Daily conversations with the AI assistant
- **Progress Reports**: Generation of wellness reports with key insights
- **Diary Entries**: Built-in diary feature with daily prompts
- **Report History**: Archive of past reports for tracking progress over time
- **Private and Secure**: All data stored locally on the user's device

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI
- Yarn or npm

### Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd app1
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Start the Expo development server:

```bash
yarn start
# or
npm start
```

4. Run on a device or emulator:
   - Scan the QR code with the Expo Go app on your device
   - Press 'i' in the terminal to open in iOS simulator
   - Press 'a' in the terminal to open in Android emulator

## Usage

1. **First Launch**: Enter your name to begin the initial assessment
2. **Initial Chat**: Complete the introductory conversation to establish baseline mental health metrics
3. **Home Screen**: Access your diary, chat with MindLink, or view reports
4. **Diary**: Record daily thoughts with guided prompts
5. **Chat**: Have regular check-in conversations with the AI assistant
6. **Reports**: View insights generated from your conversations and track progress

## Screens and Navigation

- **WelcomeScreen**: Onboarding screen where users enter their name
- **InitChatScreen**: Initial assessment through conversational interface
- **SummaryScreen**: Displays reports and insights from conversations
- **JourneyContinuesScreen**: Transition screen after initial assessment
- **HomeScreen**: Main screen with diary functionality
- **DailyChatScreen**: Regular check-in conversations with the assistant
- **SummaryScreen**: View reports and wellness insights

## Main Tab Navigation

The app features three main tabs:

1. **Diary**: Record daily thoughts and feelings
2. **Chat**: Have conversations with the MindLink assistant
3. **Reports**: View wellness reports and insights

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **React Navigation**: Navigation library for screen management
- **AsyncStorage**: Local data persistence
- **Expo FileSystem**: File management
- **React Native Elements**: UI component library
- **React Native Tab View**: Tab navigation component

## API Integration

MindLink integrates with a backend AI service (Gemini API) to provide:

- Natural language conversations
- Mental health assessment
- Report generation
- Key insights extraction

## Development

### File Structure

- `App.js`: Main application component and navigation setup
- `WelcomeScreen.js`: Initial onboarding screen
- `InitChatScreen.js`: Initial assessment conversation
- `DailyChatScreen.js`: Regular check-in conversations
- `HomeScreen.js`: Main screen with diary functionality
- `SummaryScreen.js`: Reports and insights screen
- `JourneyContinuesScreen.js`: Transition screen
- `systemInstruction.js`: AI system prompts and instructions

### Data Flow

1. User information is collected in WelcomeScreen
2. Initial assessment data is gathered through InitChatScreen
3. Ongoing data collection through DailyChatScreen and HomeScreen
4. Reports generated in SummaryScreen based on collected data

## Contributing

For contributions to this project, please contact Mak Yiu Man Raymond at [LinkedIn](https://www.linkedin.com/in/raymondymmak).

## License

This project is created for the HKU InnoHealth project. All rights reserved.
