# MindLink - Mental Wellness Assistant

Created by Mak Yiu Man Raymond (麥耀文)

## Overview

MindLink is a mobile application designed to serve as a compassionate and supportive mental wellness assistant specifically for Hong Kong teenagers. It helps teenagers articulate symptoms and helps psychiatrists understand them.

## Features

- Personalized AI chat for mental health support and regular check-ins.
  - Discreet initial mental health assessment based on the PHQ-9 framework, with RAG used for professional procedures.
  - Regular check-ins with short conversations.
  - Crisis modal to provide self-help resources when the user is in distress.
  - Auto-generation of reports which are archived to track progress over time.
- Daily journaling with guided prompts, as well as tracking of mood and topic.
- Local storage of all user data for privacy.
- Generation of wellness reports and insights, including:
  - Mood trajectory tracking.
  - Tag frequency analysis.
  - Extraction of recurring emotional themes.
  - Identification of primary stressors on low-mood days.
  - Extraction of a critical, emotionally resonant quote.
  - Synthesis of all data into a professional "Session Brief" for mental health professionals.

## Tech Stack

- **Frontend**: React Native (with Expo)
- **Backend**: Node.js server deployed on Vercel (connects to Gemini API)

## Contributing

For contributions to this project, please contact Mak Yiu Man Raymond at [LinkedIn](https://www.linkedin.com/in/raymondymmak).
