# MindFulCheck

## Overview

MindFulCheck is a full-stack web application for monitoring mental wellness. It integrates data visualization, client-side machine learning, and cloud-based services to provide insights and interactive user experiences.

---

## Features

* Mental wellness tracking interface
* Data visualization using charts
* Client-side processing using TensorFlow.js
* Firebase integration for data/storage
* Responsive UI with Tailwind CSS
* API communication using Axios

---

## Tech Stack

### Frontend

* React (Vite)
* TypeScript
* Tailwind CSS

### Libraries

* TensorFlow.js
* Recharts
* Framer Motion
* Firebase
* Axios

### Backend

* Located in `/backend`

---

## Project Structure

```
```
MindFulCheck-main
├─ backend
│  ├─ assessment-phq9-server.js
│  ├─ firebase-auth-server.js
│  └─ ml-backend-server.js
├─ eslint.config.js
├─ index.html
├─ netlify
│  └─ functions
│     └─ fetch-openai.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  └─ mindful-icon.svg
├─ README.md
├─ src
│  ├─ App.tsx
│  ├─ components
│  │  ├─ auth
│  │  │  ├─ PasswordStrengthMeter.tsx
│  │  │  └─ ProtectedRoute.tsx
│  │  ├─ chatbot
│  │  │  ├─ Chatbot.tsx
│  │  │  └─ InteractiveChatbot.tsx
│  │  ├─ layout
│  │  │  ├─ Footer.tsx
│  │  │  ├─ Header.tsx
│  │  │  ├─ Layout.tsx
│  │  │  └─ Logo.tsx
│  │  └─ WellnessZone.tsx
│  ├─ contexts
│  │  ├─ AuthContext.tsx
│  │  └─ ChatbotContext.tsx
│  ├─ data
│  │  ├─ children.html
│  │  └─ exercises.html
│  ├─ index.css
│  ├─ main.tsx
│  ├─ models
│  │  ├─ assessmentTypes.ts
│  │  └─ exersiceTypes.ts
│  ├─ pages
│  │  ├─ AssessmentPage.tsx
│  │  ├─ auth
│  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  └─ VerifyEmailPage.tsx
│  │  ├─ DashboardPage.tsx
│  │  ├─ FindHelpPage.tsx
│  │  ├─ HomePage.tsx
│  │  ├─ MoodTrackerPage.tsx
│  │  ├─ ProfilePage.tsx
│  │  ├─ RecordTodayModal.tsx
│  │  ├─ ResourcesPage.tsx
│  │  └─ WellnessZonePage.tsx
│  ├─ services
│  │  ├─ chatbotService.ts
│  │  ├─ firebase.ts
│  │  ├─ locationService.ts
│  │  ├─ mlChatbotService.ts
│  │  └─ moodAnalysisService.ts
│  ├─ utils
│  │  └─ uuid.ts
│  └─ vite-env.d.ts
├─ tailwind.config.js
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ vite.config.ts.timestamp-1757793762168-8f5121750bdb6.mjs

```
---

## Installation

```bash
git clone https://github.com/Letitbe098/MindFulCheck.git
cd MindFulCheck
npm install
```

---

## Run Application

### Frontend

```bash
npm run dev
```

### Backend

```bash
cd backend
# run backend based on implementation
```

---

## Build

```bash
npm run build
```

---

## Notes

* Uses Vite for fast development
* ML runs in browser using TensorFlow.js
* Firebase used for backend/cloud services

---

## Future Improvements

* Add authentication
* Improve ML model performance
* Enhance analytics features

---

## Author

B.Poojitha

```

