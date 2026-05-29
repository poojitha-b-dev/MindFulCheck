# 🌿 MindfulCheck

A full-stack mental wellness web application for self-assessment and support. Users can screen themselves for depression and anxiety using clinically validated tools, track their mood over time, get personalized recommendations, receive daily email reminders, and chat with an AI wellness companion.

🔗 **Live Demo:** [mind-ful-check.vercel.app](https://mind-ful-check.vercel.app)

---

## ✨ Features

### 🧠 PHQ-9 & GAD-7 Assessments
- Clinically validated depression and anxiety screening
- Age-specific questions
- Personalized score-based recommendations
- Assessment history stored in Firestore

### 📊 Mood Tracker
- Daily mood, sleep, energy, and anxiety logging
- 14-day history charts built with Recharts

### 🤖 AI Chatbot
- Groq-powered wellness companion (LLaMA 3.3 70B)
- Crisis detection with automatic resource suggestions
- Contextual quick replies

### 📈 Dashboard
- Visual summary of assessments and mood trends
- Smart caching to prevent unnecessary re-fetching

### 🔔 Daily Email Reminders
- EmailJS-powered notification system
- User-configurable reminder time
- Assessment reminders, mood check-ins, and resource notifications
- Sends once per day when app is opened at or after chosen time

### 🗺️ Find Help
- Mental health professional directory
- Filter by specialty and city

### 🎮 Recharge Zone
- Guided breathing exercises
- Games, jokes, and stretch routines
- Music for relaxation

### 📚 Resources
- Articles, videos, and podcasts
- Emergency support links

### 🔐 Firebase Authentication
- Email/password login with email verification
- Password strength validation
- Password reset with redirect back to app
- Secure protected routes

---

## 🛠️ Tech Stack

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
| Email Reminders | EmailJS |
| Deployment | Vercel |

---

## 📁 Project Structure

```text
MindFulCheck
├── api
│   └── chat.js                  # Serverless function for chatbot
├── public
│   └── mindful-icon.svg
├── src
│   ├── components
│   │   ├── auth
│   │   │   ├── PasswordStrengthMeter.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── chatbot
│   │   │   └── InteractiveChatbot.tsx
│   │   ├── layout
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Logo.tsx
│   │   ├── Toast.tsx
│   │   └── WellnessZone.tsx
│   ├── contexts
│   │   ├── AuthContext.tsx
│   │   └── ChatbotContext.tsx
│   ├── pages
│   │   ├── auth
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── VerifyEmailPage.tsx
│   │   ├── AssessmentPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FindHelpPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── MoodTrackerPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ResourcesPage.tsx
│   │   └── WellnessZonePage.tsx
│   ├── services
│   │   ├── firebase.ts
│   │   └── moodAnalysisService.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Installation

```bash
git clone https://github.com/Letitbe098/MindFulCheck.git
cd MindFulCheck
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### Getting API Keys

| Service | Link |
|---|---|
| Groq API | https://console.groq.com |
| EmailJS | https://emailjs.com |
| Firebase | https://console.firebase.google.com |

### Vercel Deployment
- Go to **Vercel Dashboard → Project → Settings → Environment Variables**
- Add all 4 variables above

---

## 💻 Run Locally

```bash
npm run dev
```

---

## 🏗️ Build

```bash
npm run build
```

---

## 🌐 Deployment

This project is deployed on Vercel with the following setup:

- `api/chat.js` is automatically treated as a serverless function for chatbot requests
- `vercel.json` configures SPA routing so all paths serve `index.html`
- Every push to GitHub triggers automatic redeployment

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## ⚙️ Key Design Decisions

- Assessment scoring runs fully client-side for privacy
- Firestore stores mood logs, assessment history, and notification preferences
- Dashboard caching prevents unnecessary Firestore re-fetching
- Chatbot uses regex-based crisis detection with automatic resource appending
- Email reminders use browser-triggered EmailJS — no backend required
- `lastReminderSent` field in Firestore ensures only one email per day
- Firebase password reset and email verification redirect back to `/login`
- Email Enumeration Protection disabled in Firebase for precise error messages

---

## 🔮 Future Improvements

- Multilingual support
- Wearable device integration (heart rate, sleep tracking)
- Community peer support forum
- Voice input for mood logging
- Gamification and streak rewards
- Push notifications (PWA)
- Therapist booking integration

---

## 👩‍💻 Author

**B. Poojitha**  
Mini Project — Bhoj Reddy Engineering College for Women  
Department of Information Technology  
AY 2024–25