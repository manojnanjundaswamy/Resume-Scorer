# ResumeScore AI 🚀

An AI-powered resume analyzer that scores your resume, highlights strengths and weaknesses, recommends matching jobs, and generates tailored interview questions.

## Features

- **AI Resume Scoring** — 0–100 score with letter grade (powered by GPT-4o)
- **6 Category Scores** — Format, Content, ATS Optimization, Skills, Experience, Education
- **Strengths & Weaknesses** — Specific, actionable feedback
- **Keyword Analysis** — Found keywords + missing keywords for ATS
- **Job Recommendations** — Matched roles with LinkedIn, Indeed, Glassdoor, Google Jobs links
- **Interview Questions** — Technical, behavioral, and HR questions tailored to your resume
- **Improvement Action Plan** — Prioritized suggestions (High / Medium / Low)
- **Mobile Responsive** — Works on phones, tablets, and desktops

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- An [OpenAI API key](https://platform.openai.com/api-keys) (GPT-4o access required)

---

## Setup & Installation

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure your OpenAI API key

```bash
# In the backend folder:
copy .env.example .env        # Windows
# OR
cp .env.example .env          # Mac/Linux
```

Then open `backend/.env` and replace the placeholder with your actual key:
```
OPENAI_API_KEY=sk-your-real-key-here
PORT=3001
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the App

You need **two terminal windows** running simultaneously.

**Terminal 1 — Start the backend:**
```bash
cd backend
npm run dev
```
You should see: `✅ Resume Scorer backend running on http://localhost:3001`

**Terminal 2 — Start the frontend:**
```bash
cd frontend
npm run dev
```
You should see the app URL, usually `http://localhost:5173`

**Open your browser** at `http://localhost:5173` and you're ready to go!

---

## Project Structure

```
Resume Scorer/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   ├── .env.example       # Copy to .env and add your API key
│   └── .env               # Your secrets (never commit this!)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Root component & stage management
│   │   ├── components/
│   │   │   ├── UploadZone.jsx             # Drag & drop file upload
│   │   │   ├── AnalyzingScreen.jsx        # Loading/progress screen
│   │   │   ├── Dashboard.jsx             # Main results dashboard
│   │   │   ├── ScoreGauge.jsx            # Animated circular score
│   │   │   ├── CategoryScores.jsx        # 6-category bar charts
│   │   │   ├── StrengthsWeaknesses.jsx   # Strengths, gaps & keywords
│   │   │   ├── JobRecommendations.jsx    # Job matches with apply links
│   │   │   ├── InterviewQuestions.jsx    # Technical/behavioral/HR questions
│   │   │   └── ImprovementTips.jsx       # Prioritized action plan
│   │   └── index.css
│   ├── vite.config.js     # Proxies /api → localhost:3001
│   └── package.json
│
└── README.md
```

---

## Supported File Types

| Format | Extension |
|--------|-----------|
| PDF    | .pdf      |
| Word   | .docx     |
| Word (legacy) | .doc |
| Plain text | .txt  |

Max file size: **10MB**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| AI | OpenAI GPT-4o |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |
| Icons | lucide-react |

---

## Common Issues

**"OpenAI API key not configured"**
→ Make sure you created `backend/.env` from `.env.example` and added your real key.

**"Could not read file"**
→ Try saving your resume as a standard PDF (not scanned/image-based).

**Backend won't start**
→ Run `npm install` inside the `backend/` folder first.

**Frontend can't connect to backend**
→ Make sure the backend is running on port 3001. Check `backend/.env` PORT setting.

---

## Cost Estimate

Each resume analysis uses ~1,000–2,000 tokens with GPT-4o.
At current pricing (~$0.005/1K input tokens), each analysis costs roughly **$0.01–$0.02**.
