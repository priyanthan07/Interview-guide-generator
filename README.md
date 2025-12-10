# Interview Guide Generator

AI-powered post-simulation interview question generator that analyzes candidate performance and creates personalized interview guides for recruiters.

![Interview Guide Generator](https://img.shields.io/badge/Hackathon-Skillfully%202024-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🎯 What It Does

1. **Analyzes Simulation Results** - Parses evaluation data (skills tested, scores, gaps)
2. **Identifies Key Areas** - Distinguishes verified skills (skip) from gaps (probe deeper)
3. **Generates Interview Questions** - Uses Claude AI to create 5-15 targeted questions per candidate
4. **Provides Recruiter Guidance** - Includes what to listen for, red flags, and follow-ups

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Claude AI     │
│   (Next.js)     │     │   (FastAPI)     │     │   (Anthropic)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   SQLite DB     │
                        │   (Candidates,  │
                        │   Simulations,  │
                        │   Guides)       │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key (optional - works with mock data without it)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
# Add your OPENAI_API_KEY if you have one
echo "OPENAI_API_KEY=your_key_here" > .env
echo "DATABASE_URL=sqlite:///./interview_guide.db" >> .env

# Seed the database with sample data
python seed_data.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # Database connection
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── llm_service.py    # Claude AI integration
│   │   └── routes/
│   │       ├── candidates.py # Candidate endpoints
│   │       ├── simulations.py# Simulation endpoints
│   │       ├── guides.py     # Interview guide endpoints
│   │       └── jobs.py       # Job description endpoints
│   ├── seed_data.py          # Sample data seeder
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── page.tsx      # Dashboard page
│   │   │   ├── globals.css   # Global styles
│   │   │   └── candidate/
│   │   │       └── [id]/
│   │   │           └── page.tsx  # Candidate detail page
│   │   └── lib/
│   │       └── api.ts        # API client
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

## 🔌 API Endpoints

### Candidates
- `GET /api/candidates` - List all candidates
- `GET /api/candidates/{id}` - Get candidate details
- `GET /api/candidates/{id}/dashboard` - Get full candidate dashboard
- `POST /api/candidates` - Create new candidate

### Simulations
- `GET /api/simulations` - List all simulations
- `GET /api/simulations/candidate/{id}` - Get candidate's simulations
- `POST /api/simulations` - Create simulation result

### Interview Guides
- `GET /api/guides` - List all guides
- `GET /api/guides/{id}` - Get specific guide
- `POST /api/guides/generate` - **Generate new interview guide**

### Jobs
- `GET /api/jobs` - List job descriptions
- `POST /api/jobs` - Create job description

## 🧠 How Question Generation Works

1. **Input Collection**:
   - Simulation results (scores, skills tested)
   - Skill gaps with severity ratings
   - Job description context (optional)
   - Evaluation rationale from simulation

2. **AI Processing**:
   - GPT-4o analyzes the skill gaps
   - Prioritizes gaps by importance to role
   - Generates targeted questions for each gap
   - Adds context about what good/bad answers look like

3. **Output Structure**:
   ```json
   {
     "summary": "Executive summary of candidate fit",
     "strengths": ["strength1", "strength2"],
     "red_flags": ["concern1", "concern2"],
     "questions": [
       {
         "question": "Can you walk me through...",
         "skill_targeted": "System Design",
         "difficulty": "medium",
         "what_to_listen_for": ["point1", "point2"],
         "red_flags": ["warning1", "warning2"],
         "follow_up_questions": ["follow1", "follow2"],
         "time_estimate": "4-6 minutes"
       }
     ]
   }
   ```

## 🎨 Features

- **Modern Dark UI** - Beautiful recruiter dashboard
- **Real-time Generation** - Generate guides with loading states
- **Printable Guides** - Clean print-friendly format
- **Expandable Questions** - Collapsible question details
- **Score Visualization** - Color-coded skill assessments
- **Job Context Integration** - Customize questions based on role

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
OPENAI_API_KEY=sk-...  # Optional: works without it using mock data
DATABASE_URL=sqlite:///./interview_guide.db
```

**Frontend (.env.local)** (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📝 Sample Data

The seed script creates:
- **4 candidates** with different profiles
- **2 job descriptions** (Senior Software Engineer, Customer Success Manager)
- **4 simulation results** with realistic skill scores and gaps

Run `python seed_data.py` from the backend folder to populate.

## 🚢 Deployment

### Backend (Railway/Render)
1. Push to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy

## 🤝 Team

Built for Skillfully Hackathon 2024 by **Gayaani & Team**

## 📄 License

MIT
