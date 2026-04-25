<div align="center">

<img src="https://img.shields.io/badge/IntervueAI-AI%20Interview%20Platform-6C63FF?style=for-the-badge&logo=artificial-intelligence&logoColor=white" alt="IntervueAI" />

# 🎯 IntervueAI

### AI-Powered Interview Practice Platform

**Practice interviews with real-time facial expression analysis, speech evaluation, and AI-generated feedback — all in your browser.**

<br/>

[![Made by Sajad](https://img.shields.io/badge/Built%20by-Mir%20Sajad%20Bashir-4ECDC4?style=flat-square)](https://github.com/sajad-bashir-mir)
[![Tech](https://img.shields.io/badge/Stack-MERN%20%2B%20AI-6C63FF?style=flat-square)]()
[![Model](https://img.shields.io/badge/Model-MobileNetV2%20on%20FER2013-orange?style=flat-square)](https://huggingface.co/spaces/mir-sajad-01/facial-expression-recognition)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)]()

<br/>

[🚀 Live Demo](#-live-demo) •
[✨ Features](#-features) •
[🏗️ Architecture](#-architecture) •
[⚙️ Setup](#-setup) •
[📡 API Docs](#-api-documentation) •
[🤖 AI Models](#-ai-models) •
[👨‍💻 Author](#-author)

<br/>

> *"Most people fail interviews not because they lack knowledge — but because they don't know how they come across. IntervueAI fixes that."*

</div>

---

## 📌 Table of Contents

- [Live Demo](#-live-demo)
- [What is IntervueAI](#-what-is-intervueai)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [AI Models](#-ai-models)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [How It Works](#-how-it-works)
- [Scoring System](#-scoring-system)
- [Deployment](#-deployment)
- [Author](#-author)

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| 🌐 Frontend | `https://intervueai.vercel.app` *(coming soon)* |
| ⚙️ Backend API | `https://intervueai-api.onrender.com` *(coming soon)* |
| 🤗 HuggingFace Model | [mir-sajad-01/facial-expression-recognition](https://huggingface.co/spaces/mir-sajad-01/facial-expression-recognition) |

---

## 💡 What is IntervueAI

IntervueAI is a full-stack web application built by **Mir Sajad Bashir** (B.Tech CSE, IUST Srinagar) that helps job seekers practice interviews with real AI feedback — not just generic tips.

Most interview prep tools tell you *what* to say. IntervueAI tells you *how* you say it — by analyzing your facial expressions, speech fluency, and answer quality simultaneously, then generating a detailed performance report with actionable improvement tips.

**The problem it solves:** Candidates often practice answers in their head but never see how nervous, confident, or unclear they actually appear. IntervueAI acts as an always-available AI interview coach.

---

## ✨ Features

### 🔐 Authentication
- Secure registration and login with bcrypt password hashing
- JWT access tokens (15 min) + refresh tokens (7 days)
- Silent token refresh — users stay logged in seamlessly
- Protected routes on both frontend and backend
- Profile editing, password change, account deletion

### 🎬 Interview Session
- Choose interview type: **HR / Technical / Behavioural / Mixed**
- Choose difficulty: **Easy / Medium / Hard**
- Choose question count: **5 / 10 / 15 questions**
- 3-second countdown before session starts
- Per-question countdown timer (60s / 90s / 120s based on difficulty)
- Auto-submit when timer expires

### 🎭 Real-Time Facial Expression Analysis
- Webcam captures a frame **every 3 seconds** during the session
- Frame converted to base64 and sent to a self-trained MobileNetV2 model on Hugging Face
- Detects **7 emotions**: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise
- Live emotion badge shown on screen (color-coded: green / yellow / red)
- Confidence percentage displayed per emotion
- All snapshots stored with timestamps for post-session analysis

### 🎙️ Speech Transcription & Live Feedback
- Browser-native **Web Speech API** — no external dependency
- Live transcript appears as you speak
- Real-time filler word counter (umm, uh, like, basically, you know)
- Speaking pace indicator: Too Slow / Good Pace / Too Fast
- Graceful error if browser does not support speech recognition

### 🤖 AI Answer Evaluation (Gemini)
- After each answer, transcript sent to **Google Gemini API**
- Evaluates: relevance score, fluency score, clarity score (each 0–10)
- Returns 3 specific improvement tips
- Generates a sample better answer for the same question
- Structured JSON response — no hallucination risk

### 📊 Composite Scoring
- **Expression Score (30%)** — average positive emotion confidence
- **Speech Score (35%)** — average fluency from Gemini
- **Content Score (35%)** — average relevance + clarity from Gemini
- Letter grade: A / B / C / D / F
- Strongest and weakest answer highlighted

### 📈 Session Result Page
- Animated score ring with letter grade
- Bar chart: Expression vs Speech vs Content breakdown
- Emotion timeline: dominant emotion per snapshot over entire session
- Per-question accordion: transcript, scores, tips, sample answer
- Aggregated improvement tips from all answers

### 🏠 Dashboard
- Total sessions, average score, best score, streak (consecutive days)
- Score trend line chart (last 10 sessions)
- Emotion distribution pie chart across all sessions
- Recent sessions list with quick-view cards
- Quick Start button — jumps straight to interview setup

### 📋 Session History
- Paginated list of all past sessions
- Filter by type, difficulty, date range
- Sort by date or score
- Click any session to view full result

### 👤 Profile
- Edit name and email
- Change password (verifies old password first)
- Account stats: member since, total sessions, average score
- Delete account with confirmation

### 🎨 UI/UX
- Dark / Light mode toggle saved to localStorage
- Fully responsive (mobile + desktop)
- Loading skeletons while data fetches
- Toast notifications for success and error
- Smooth page fade-in animations
- Empty states with helpful CTAs
- Custom purple scrollbar

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI framework |
| Tailwind CSS | Styling and responsive design |
| Recharts | Score trend, emotion timeline, bar charts |
| React Router | Client-side routing |
| Axios | HTTP requests with interceptors |
| React Hot Toast | Notifications |
| Web Speech API | Browser-native speech transcription |
| MediaDevices API | Webcam access and frame capture |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| MongoDB + Mongoose | Database and ODM |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| express-rate-limit | API rate limiting |
| cors | Cross-origin control |
| dotenv | Environment config |

### AI & ML
| Technology | Purpose |
|---|---|
| PyTorch + MobileNetV2 | Facial expression model (self-trained) |
| FER2013 Dataset | Training data (35,887 images, 7 classes) |
| Hugging Face Spaces | Model deployment and inference API |
| Gradio | Model serving interface |
| Google Gemini API | Answer evaluation and feedback generation |

---

## 🤖 AI Models

### Facial Expression Recognition Model

This model was **trained from scratch** by Mir Sajad Bashir as part of this project.

| Property | Detail |
|---|---|
| Architecture | MobileNetV2 with custom classifier head |
| Dataset | FER2013 (35,887 grayscale face images) |
| Classes | 7 emotions: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise |
| Input size | 48×48 grayscale |
| Test accuracy | 59.03% |
| Deployment | Hugging Face Spaces (Gradio) |
| Inference | REST API via `/run/predict_emotion` |

> FER2013 is a notoriously difficult dataset. Human-level accuracy on it is approximately 65%. The model performs within the expected range for this architecture.

**HuggingFace Space:** [mir-sajad-01/facial-expression-recognition](https://huggingface.co/spaces/mir-sajad-01/facial-expression-recognition)

### Answer Evaluation — Google Gemini

Each spoken answer is evaluated by Gemini using a structured prompt that returns:

```json
{
  "relevanceScore": 8,
  "fluencyScore": 7,
  "clarityScore": 6,
  "tips": [
    "Use the STAR method to structure your answer",
    "Reduce filler words — 'basically' appeared 4 times",
    "Add a concrete outcome or result to your example"
  ],
  "sampleAnswer": "A concise, well-structured 3-4 sentence model answer"
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                    │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Webcam Frame │  │ Web Speech   │  │   Pages &  │ │
│  │ Capture      │  │ Transcription│  │ Components │ │
│  │ (every 3s)   │  │ (live)       │  │            │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │         │
└─────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              Express.js REST API (Node)              │
│                                                       │
│  /api/auth  /api/sessions  /api/emotion               │
│  /api/feedback  /api/questions  /api/dashboard        │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │   JWT    │  │   Rate    │  │  Input Validation │  │
│  │  Auth    │  │  Limiter  │  │  (express-valid.) │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
└──────────┬──────────────┬───────────────┬────────────┘
           │              │               │
           ▼              ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │ Hugging Face │  │   Google     │
│   Atlas      │  │   Spaces     │  │   Gemini     │
│              │  │              │  │   API        │
│ Users        │  │ MobileNetV2  │  │              │
│ Sessions     │  │ FER2013      │  │ Answer eval  │
│ Questions    │  │ 7 emotions   │  │ JSON output  │
│ Snapshots    │  │ 59% accuracy │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📁 Project Structure

```
interview-platform/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── WebcamCapture.jsx    # Captures frame every 3s
│   │   │   ├── SpeechRecorder.jsx   # Web Speech API wrapper
│   │   │   ├── EmotionDisplay.jsx   # Live emotion badge + bars
│   │   │   ├── FeedbackPanel.jsx    # Post-answer Gemini feedback
│   │   │   ├── ScoreCard.jsx        # Composite score display
│   │   │   ├── QuestionCard.jsx     # Question + timer UI
│   │   │   ├── Timer.jsx            # Circular countdown ring
│   │   │   └── Loader.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Home / marketing page
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx        # Stats + charts + recent sessions
│   │   │   ├── Interview.jsx        # Core session page
│   │   │   ├── SessionResult.jsx    # Post-session analysis
│   │   │   ├── History.jsx          # Paginated session list
│   │   │   └── Profile.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── hooks/
│   │   │   ├── useWebcam.js
│   │   │   ├── useSpeech.js
│   │   │   └── useTimer.js
│   │   └── utils/
│   │       ├── api.js               # Axios instance + interceptors
│   │       └── helpers.js
│   └── package.json
│
├── server/                          # Node.js backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   ├── questionController.js
│   │   ├── emotionController.js     # Calls HF Space API
│   │   └── feedbackController.js   # Calls Gemini API
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── errorMiddleware.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Question.js
│   │   └── SessionSnapshot.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── emotionRoutes.js
│   │   └── feedbackRoutes.js
│   ├── utils/
│   │   ├── gemini.js               # Gemini API helper
│   │   └── huggingface.js          # HF inference helper
│   ├── data/
│   │   └── questions.js            # 60+ question seed data
│   ├── .env.example
│   └── server.js
│
├── package.json                     # Root scripts
└── README.md
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Google Gemini API key ([get here](https://aistudio.google.com))
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sajad-bashir-mir/intervue-ai.git
cd intervue-ai
```

### 2. Install all dependencies

```bash
npm run install:all
```

This installs dependencies for both `client/` and `server/` in one command.

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` — see [Environment Variables](#-environment-variables) below.

### 4. Seed the question bank

```bash
cd server
node data/seed.js
```

### 5. Run the development server

```bash
# From root directory
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |

---

## 🔑 Environment Variables

### server/.env

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/intervueai
JWT_SECRET=your_64_character_random_secret
JWT_REFRESH_SECRET=your_64_character_random_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
HF_SPACE_URL=https://mir-sajad-01-facial-expression-recognition.hf.space
HF_API_URL=https://mir-sajad-01-facial-expression-recognition.hf.space/run/predict_emotion
CLIENT_URL=http://localhost:5173
```

### client/.env

```dotenv
VITE_API_URL=http://localhost:5000
```

> **Generate JWT secrets:** Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` in your terminal.

> ⚠️ Never commit `.env` files. They are in `.gitignore` by default.

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns tokens |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Get new access token |
| POST | `/api/auth/logout` | `{ refreshToken }` | Invalidate refresh token |
| GET | `/api/auth/profile` | — | Get current user |
| PUT | `/api/auth/profile` | `{ name, email }` | Update profile |
| PUT | `/api/auth/password` | `{ oldPassword, newPassword }` | Change password |
| DELETE | `/api/auth/account` | — | Delete account |

### Sessions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start new session `{ type, difficulty, totalQuestions }` |
| POST | `/api/sessions/:id/answer` | Submit answer `{ questionId, transcript }` |
| POST | `/api/sessions/:id/end` | End session `{ duration }` |
| GET | `/api/sessions` | Get sessions (paginated, filterable, sortable) |
| GET | `/api/sessions/:id` | Get single session with full details |

**Query params for GET /api/sessions:**
```
?page=1&limit=10&type=HR&difficulty=Medium&sortBy=date&order=desc
```

### Emotion Analysis

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/emotion/analyze` | `{ imageBase64, sessionId? }` | Analyze facial expression |

**How it works internally:**
```
Client sends base64 webcam frame
  → Backend calls HF Space /run/predict_emotion
  → Returns { emotion, confidence, allEmotions[] }
  → Saved as SessionSnapshot in MongoDB
```

### Answer Feedback

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/feedback/evaluate` | `{ question, transcript }` | Gemini evaluation |

**Response:**
```json
{
  "relevanceScore": 8,
  "fluencyScore": 7,
  "clarityScore": 6,
  "tips": ["tip1", "tip2", "tip3"],
  "sampleAnswer": "..."
}
```

### Questions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions` | Get questions `?type=HR&difficulty=Medium&limit=10` |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | All dashboard metrics for logged-in user |

---

## 🔄 How It Works

### During an Interview Session

```
1. User selects type + difficulty + question count
2. Session created in MongoDB with status "active"
3. For each question:
   a. Question displayed with countdown timer
   b. Webcam starts capturing frames every 3 seconds
      → Each frame → base64 → POST /api/emotion/analyze
      → HF Space returns emotion + confidence
      → Badge updates live on screen
   c. User clicks "Start Answering" → Web Speech API begins
      → Live transcript appears on screen
      → Filler words counted in real time
      → Speaking pace calculated from WPM
   d. User submits or timer expires
      → Transcript → POST /api/feedback/evaluate
      → Gemini returns scores + tips + sample answer
4. After all questions:
   → Composite score calculated
   → Session status set to "completed"
   → Redirect to SessionResult page
```

### Composite Score Formula

```
Expression Score  = avg(happy_confidence + neutral_confidence) across all snapshots
Speech Score      = avg(fluencyScore) across all Gemini evaluations
Content Score     = avg((relevanceScore + clarityScore) / 2) across all answers

Final Score = (Expression × 0.30) + (Speech × 0.35) + (Content × 0.35)

Grade: A = 85+, B = 70–84, C = 55–69, D = 40–54, F = below 40
```

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd client
npm run build
```

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set root directory to `client`
4. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`

### Backend → Render

1. Create new **Web Service** on [render.com](https://render.com)
2. Connect GitHub repo, set root directory to `server`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all server environment variables in Render dashboard
6. Set `CLIENT_URL` to your Vercel frontend URL

---

## 👨‍💻 Author

<div align="center">

### Mir Sajad Bashir

**B.Tech Computer Science Engineering**
Islamic University of Science and Technology (IUST), Srinagar, Kashmir

*GATE CSE 2026 Qualified · Hackathon Finalist · Full Stack Developer*

| | |
|---|---|
| 📧 Email | mirsajad00011@gmail.com |
| 💼 LinkedIn | [linkedin.com/in/sajad-bashir-mir](https://linkedin.com/in/sajad-bashir-mir) |
| 🐙 GitHub | [github.com/sajad-bashir-mir](https://github.com/sajad-bashir-mir) |
| 📍 Location | Srinagar, Kashmir, India |

</div>

---

<div align="center">

**IntervueAI** — Built with ❤️ by Mir Sajad Bashir

*If this project helped you, consider giving it a ⭐ on GitHub*

</div>