````md id="e9t3xv"
# MindfulCheck

A web application for mental wellness self-assessment and support. Users can screen themselves for depression and anxiety using clinically validated tools, track their mood over time, get personalized recommendations, and chat with an AI wellness companion.

---

# Features

## PHQ-9 & GAD-7 Assessments
- Clinically validated depression and anxiety screening
- Age-specific questions
- Personalized recommendations

## Mood Tracker
- Daily mood, sleep, energy, and anxiety logging
- 14-day history charts

## AI Chatbot
- Groq-powered wellness companion
- LLaMA 3.3 70B model
- Crisis detection
- Contextual quick replies

## Dashboard
- Visual summary of assessments and mood trends
- Built using Recharts

## Find Help
- Mental health professional directory
- Specialty and city filters

## Recharge Zone
- Breathing exercises
- Games
- Jokes
- Stretch routines
- Music

## Resources
- Articles
- Videos
- Podcasts
- Emergency support links

## Firebase Authentication
- Email/password login
- Email verification
- Password strength validation

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Authentication & Database | Firebase (Auth + Firestore) |
| ML (Client-side) | TensorFlow.js |
| AI Chatbot | Groq API (LLaMA 3.3 70B) |
| Deployment | Vercel |

---

# Project Structure

```text
MindFulCheck
├── api
│   └── chat.js
├── public
│   └── mindful-icon.svg
├── src
│   ├── components
│   ├── contexts
│   ├── models
│   ├── pages
│   ├── services
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
````

---

# Installation

```bash
git clone https://github.com/Letitbe098/MindFulCheck.git
cd MindFulCheck
npm install
```

---

# Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

For Vercel deployment:

* Open Vercel Dashboard
* Go to Project Settings
* Add the environment variable

Get a free API key from:
https://console.groq.com

---

# Run Locally

```bash
npm run dev
```

---

# Build

```bash
npm run build
```

---

# Deployment

This project is deployed on Vercel.

The `api/chat.js` file is automatically treated as a serverless function and handles chatbot requests.

Every push to GitHub triggers automatic deployment.

---

# Key Design Decisions

* Assessment scoring runs fully client-side
* Firestore stores mood and assessment history
* Dashboard caching prevents unnecessary re-fetching
* Chatbot includes regex-based crisis detection
* Automatic crisis resources are appended when needed
* Groq API provides free AI inference with generous limits

---

# Future Improvements

* Multilingual support
* Wearable device integration
* Community peer support
* Voice input support
* Gamification features

---

# Author

**B. Poojitha**
Mini Project
Bhoj Reddy Engineering College for Women
Department of Information Technology
AY 2024–25

```
```

```
MindFulCheck
├─ api
│  └─ chat.js
├─ eslint.config.js
├─ index.html
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
│  │  │  └─ InteractiveChatbot.tsx
│  │  ├─ layout
│  │  │  ├─ Footer.tsx
│  │  │  ├─ Header.tsx
│  │  │  ├─ Layout.tsx
│  │  │  └─ Logo.tsx
│  │  ├─ Toast.tsx
│  │  └─ WellnessZone.tsx
│  ├─ contexts
│  │  ├─ AuthContext.tsx
│  │  └─ ChatbotContext.tsx
│  ├─ index.css
│  ├─ main.tsx
│  ├─ models
│  │  └─ assessmentTypes.ts
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
│  │  ├─ firebase.ts
│  │  └─ moodAnalysisService.ts
│  └─ vite-env.d.ts
├─ tailwind.config.js
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts

```