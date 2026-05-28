# MindfulCheck

A web application for mental wellness self-assessment and support. Users can screen themselves for depression and anxiety using clinically validated tools, track their mood over time, get personalized recommendations, and chat with an AI wellness companion.

---

## Features

- **PHQ-9 & GAD-7 Assessments** — clinically validated depression and anxiety screening with age-specific questions and personalized recommendations
- **Mood Tracker** — daily mood, sleep, energy, and anxiety logging with 14-day history charts
- **AI Chatbot** — Gemini-powered wellness companion with crisis detection and contextual quick replies
- **Dashboard** — visual summary of recent assessments and mood trends using Recharts
- **Find Help** — curated list of mental health professionals with specialty and city filters
- **Recharge Zone** — interactive breathing exercises, games, jokes, stretches, and music
- **Resources** — articles, videos, podcasts, and emergency support links
- **Firebase Auth** — email/password login with email verification and password strength validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Auth & DB | Firebase (Auth + Firestore) |
| ML (client) | TensorFlow.js (mood analysis) |
| AI Chatbot | Google Gemini 1.5 Flash via Vercel API route |
| Deployment | Vercel |

---

## Project Structure

```
MindFulCheck
├─ api
│  └─ chat.js                  # Vercel serverless function — Gemini chatbot API
├─ eslint.config.js
├─ index.html
├─ package.json
├─ postcss.config.js
├─ public
│  └─ mindful-icon.svg
├─ src
│  ├─ App.tsx                  # Routes and providers
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
│  │  ├─ AuthContext.tsx        # Firebase auth logic, validators
│  │  └─ ChatbotContext.tsx     # Chatbot state management
│  ├─ index.css
│  ├─ main.tsx
│  ├─ models
│  │  └─ assessmentTypes.ts    # PHQ-9 / GAD-7 questions, scoring, recommendations
│  ├─ pages
│  │  ├─ auth
│  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  └─ VerifyEmailPage.tsx
│  │  ├─ AssessmentPage.tsx
│  │  ├─ DashboardPage.tsx
│  │  ├─ FindHelpPage.tsx
│  │  ├─ HomePage.tsx
│  │  ├─ MoodTrackerPage.tsx
│  │  ├─ ProfilePage.tsx
│  │  ├─ RecordTodayModal.tsx
│  │  ├─ ResourcesPage.tsx
│  │  └─ WellnessZonePage.tsx
│  ├─ services
│  │  ├─ firebase.ts           # Firebase app initialization
│  │  └─ moodAnalysisService.ts # TensorFlow.js mood pattern analysis
│  └─ vite-env.d.ts
├─ tailwind.config.js
├─ tsconfig.json
└─ vite.config.ts
```

---

## Installation

```bash
git clone https://github.com/Letitbe098/MindFulCheck.git
cd MindFulCheck
npm install
```

---

## Environment Variables

Create a `.env` file in the project root for local development:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

For Vercel deployment, add this in **Vercel Dashboard → Settings → Environment Variables**.

Get your Gemini API key from [aistudio.google.com](https://aistudio.google.com).

---

## Run Locally

```bash
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Deployment

This project is deployed on **Vercel**. The `api/chat.js` file is automatically treated as a serverless function by Vercel and handles all Gemini chatbot requests.

Push to your GitHub repo and Vercel will auto-deploy on every commit.

---

## Key Design Decisions

- All assessment scoring and recommendations run entirely client-side — no backend needed
- Firestore stores mood entries (30-day retention with auto-cleanup) and assessment history per user
- The dashboard uses a module-level cache with midnight-reset logic so data never re-fetches unnecessarily on navigation
- The chatbot includes crisis detection using whole-word regex matching to avoid false positives, with automatic 988/crisis line resources appended

---

## Future Improvements

- Multilingual support
- Wearable device integration for continuous health monitoring
- Community peer support feature
- Voice-based input for accessibility
- Gamification for consistent user engagement

---

## Author

**B. Poojitha**  
Mini Project — Bhoj Reddy Engineering College for Women, Department of Information Technology (AY 2024–25)
