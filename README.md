# Interview Guide Generator

AI-powered post-simulation interview question generator that analyzes candidate performance from Skillfully simulations and creates personalized, evidence-based interview guides for recruiters.

![Interview Guide Generator](https://img.shields.io/badge/Hackathon-Skillfully%202024-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-purple)

## 🎯 What It Does

1. **Connects to Skillfully Database** - Reads real evaluation data from existing PostgreSQL database
2. **Displays Campaigns & Candidates** - Browse campaigns and view candidates with their evaluation scores
3. **Analyzes Skill Performance** - Classifies skills into verified (≥4/5) and gaps (<4/5)
4. **Generates AI Interview Guides** - Uses GPT-4o with chain-of-thought reasoning
5. **Supports Customization** - Job description, global instructions, and per-candidate instructions
6. **Allows Question Editing** - Manual editing and AI-powered regeneration

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND (Next.js 14)                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  Campaigns  │───▶│ Campaign Detail │───▶│  Generate Page  │───▶│ Guide Output │  │
│  │   Page (/)  │    │ /campaign/[id]  │    │    /generate    │    │   (Print)    │  │
│  └─────────────┘    └─────────────────┘    └─────────────────┘    └──────────────┘  │
│         │                   │                      │                      │         │
│         │         ┌─────────┴─────────┐           │                      │         │
│         │         │  localStorage     │           │                      │         │
│         │         │  (JD & Instructions│          │                      │         │
│         │         │   per campaign)   │           │                      │         │
│         │         └───────────────────┘           │                      │         │
└─────────┼─────────────────────────────────────────┼──────────────────────┼─────────┘
          │                                         │                      │
          ▼                                         ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API (FastAPI)                                   │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                         /api/evaluations/*                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  /campaigns     │  │ /campaigns/{id}/    │  │ /generate-agentic-guide     │ │ │
│  │  │  /sessions      │  │    candidates       │  │ /generate-guide/{session}   │ │ │
│  │  │  /candidates    │  │ /session/{id}       │  │ /regenerate-question        │ │ │
│  │  └─────────────────┘  └─────────────────────┘  └─────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                            │
│                                         ▼                                            │
│                            ┌─────────────────────────┐                              │
│                            │     LLM Service         │                              │
│                            │  (llm_service.py)       │                              │
│                            │                         │                              │
│                            │  • Iterative generation │                              │
│                            │  • Chain-of-thought     │                              │
│                            │  • Question regeneration│                              │
│                            └───────────┬─────────────┘                              │
│                                        │                                            │
└────────────────────────────────────────┼────────────────────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │    OpenAI GPT-4o    │
                              │                     │
                              │  • JSON mode output │
                              │  • 6000 max tokens  │
                              │  • temp: 0.7        │
                              └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SKILLFULLY DATABASE (PostgreSQL)                             │
│                                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │     evaluation      │  │ evaluation_feedback │  │   evaluation_voice_elsa    │  │
│  │                     │  │       _table        │  │                             │  │
│  │  • session_id       │  │                     │  │  • elsa_score (CEFR)       │  │
│  │  • email            │  │  • evaluation_      │  │  • pronunciation           │  │
│  │  • campaign_id/name │  │    results          │  │  • fluency                 │  │
│  │  • scenario_type    │  │  • feedback         │  │  • grammar                 │  │
│  │  • skill            │  │                     │  │                             │  │
│  │  • result (score)   │  │                     │  │                             │  │
│  │  • transcript       │  │                     │  │                             │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────┐                                                            │
│  │     skills_map      │                                                            │
│  │                     │                                                            │
│  │  • skill_id         │                                                            │
│  │  • skill_name       │                                                            │
│  │  • skill_prompt     │                                                            │
│  └─────────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Application Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              USER WORKFLOW                                            │
└──────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │   Step 1    │         │       Step 2        │         │       Step 3        │
    │             │         │                     │         │                     │
    │  Campaigns  │────────▶│  Campaign Details   │────────▶│   Generate Page     │
    │   Page      │         │                     │         │                     │
    └─────────────┘         └─────────────────────┘         └─────────────────────┘
          │                          │                               │
          │                          │                               │
          ▼                          ▼                               ▼
    ┌─────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │ • View all  │         │ CAMPAIGN LEVEL:     │         │ CANDIDATE LEVEL:    │
    │   campaigns │         │                     │         │                     │
    │ • See stats │         │ • Job Description   │         │ • View eval results │
    │   (count,   │         │   (required)        │         │ • Per-candidate     │
    │   sessions) │         │ • Global            │         │   instructions      │
    │             │         │   Instructions      │         │ • Set # of questions│
    │             │         │   (optional)        │         │                     │
    │             │         │                     │         │                     │
    │             │         │ • Select candidates │         │ • Generate button   │
    │             │         │ • View skill scores │         │                     │
    └─────────────┘         └─────────────────────┘         └─────────────────────┘
                                     │                               │
                                     │      ┌────────────────────────┘
                                     │      │
                                     ▼      ▼
                            ┌─────────────────────┐
                            │       Step 4        │
                            │                     │
                            │   Generated Guide   │
                            │                     │
                            │ • Executive Summary │
                            │ • Verified Skills   │
                            │ • Skill Gaps +      │
                            │   AI Reasoning      │
                            │ • Skills Not Tested │
                            │ • Edit/Regenerate   │
                            │   Questions         │
                            │ • Print             │
                            └─────────────────────┘
```

---

## 🔄 Data Flow for Guide Generation

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           GUIDE GENERATION PIPELINE                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

  INPUT                         PROCESSING                           OUTPUT
  ─────                         ──────────                           ──────

┌─────────────────┐
│ Job Description │─────┐
└─────────────────┘     │
                        │
┌─────────────────┐     │    ┌─────────────────────────────────────────────────────┐
│ Global          │─────┼───▶│              SKILL CLASSIFICATION                    │
│ Instructions    │     │    │                                                      │
└─────────────────┘     │    │  For each skill evaluated:                           │
                        │    │                                                      │
┌─────────────────┐     │    │  Score ≥ 4 ──▶ Verified Skills (brief acknowledgment)│
│ Per-Candidate   │─────┤    │  Score < 4 ──▶ Skill Gaps (deep probing needed)     │
│ Instructions    │     │    │  Not in eval ─▶ Skills Not Tested (assess fresh)    │
└─────────────────┘     │    │                                                      │
                        │    └───────────────────────────┬─────────────────────────┘
┌─────────────────┐     │                                │
│ Evaluation Data │─────┤                                ▼
│ • Skills tested │     │    ┌─────────────────────────────────────────────────────┐
│ • Scores        │     │    │            LLM PROCESSING (GPT-4o)                   │
│ • Transcripts   │     │    │                                                      │
│ • Feedback      │     │    │  1. Initial generation with full context            │
└─────────────────┘     │    │  2. Count questions generated                        │
                        │    │  3. If < target: Call LLM again for more            │
┌─────────────────┐     │    │  4. If > target: Trim to exact count                │
│ # Questions     │─────┘    │  5. Return structured JSON                          │
│ (3-15)          │          │                                                      │
└─────────────────┘          └───────────────────────────┬─────────────────────────┘
                                                         │
                                                         ▼
                             ┌─────────────────────────────────────────────────────┐
                             │              GENERATED GUIDE                         │
                             │                                                      │
                             │  {                                                   │
                             │    "executive_summary": "...",                       │
                             │    "interview_duration_estimate": "30-45 min",       │
                             │    "sections": {                                     │
                             │      "verified_skills": [...],                       │
                             │      "skill_gaps": [                                 │
                             │        {                                             │
                             │          "skill_name": "...",                        │
                             │          "reasoning": {                              │
                             │            "data_observation": "...",                │
                             │            "evidence_from_evaluation": "...",        │
                             │            "gap_significance": "...",                │
                             │            "interview_strategy": "...",              │
                             │            "question_rationale": "..."               │
                             │          },                                          │
                             │          "questions": [...]                          │
                             │        }                                             │
                             │      ],                                              │
                             │      "skills_not_tested": [...]                      │
                             │    },                                                │
                             │    "overall_red_flags": [...],                       │
                             │    "overall_strengths": [...],                       │
                             │    "interview_tips": [...]                           │
                             │  }                                                   │
                             └─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL database (Skillfully database access)
- OpenAI API key

### 1. Backend Setup

```bash
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

# Create .env file with credentials
cat > .env << EOF
OPENAI_API_KEY=sk-your-openai-key
PG_HOST=your-postgres-host
PG_PORT=5432
PG_DBNAME=your-database-name
PG_USERNAME=your-username
PG_PASSWORD=your-password
EOF

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
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

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Environment configuration
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── models_existing.py   # SQLAlchemy models (Skillfully tables)
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── llm_service.py       # OpenAI GPT-4o integration
│   │   └── routes/
│   │       └── evaluations.py   # All API endpoints
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Campaigns list page
│   │   │   ├── campaign/[id]/
│   │   │   │   └── page.tsx          # Campaign candidates page
│   │   │   ├── generate/
│   │   │   │   └── page.tsx          # Guide generation page
│   │   │   └── session/[id]/
│   │   │       └── page.tsx          # Session detail page
│   │   └── lib/
│   │       └── api.ts                # API client & types
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## 🔌 API Endpoints

### Campaigns & Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/evaluations/campaigns` | List all campaigns with counts |
| GET | `/api/evaluations/campaigns/{id}/candidates` | Get candidates with skill scores |
| GET | `/api/evaluations/session/{session_id}` | Get session evaluation details |
| GET | `/api/evaluations/sessions` | List unique sessions |
| GET | `/api/evaluations/candidates` | List all candidates |

### Guide Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/evaluations/generate-agentic-guide` | Generate guides for multiple candidates |
| POST | `/api/evaluations/generate-guide/{session_id}` | Generate guide for single session |
| POST | `/api/evaluations/regenerate-question` | Regenerate a single question with AI |

### Request Body for Agentic Guide
```json
{
  "session_ids": ["session-1", "session-2"],
  "job_description": "Full job description text...",
  "required_skills": [],
  "custom_instructions": "Global instructions for all candidates",
  "per_candidate_instructions": {
    "session-1": "Focus on leadership for this candidate"
  },
  "num_questions": 8
}
```

---

## 🎨 Features

### Campaign Level
- **Job Description** - Required, cached per campaign in localStorage
- **Global Instructions** - Optional, applies to all candidates
- **Candidate Selection** - Multi-select with bulk actions
- **Skill Score Display** - Color-coded evaluation results

### Candidate Level  
- **Evaluation Results** - View all skill scores from simulation
- **Per-Candidate Instructions** - Custom context for each candidate
- **Question Count** - Adjustable 3-15 questions per candidate

### Generated Guide
- **Executive Summary** - AI-synthesized candidate overview
- **Verified Skills Section** - Brief acknowledgment questions (score ≥4)
- **Skill Gaps Section** - Deep probing questions with AI reasoning
- **Skills Not Tested** - Questions for skills required but not evaluated
- **Question Editing** - Manual edit or AI regeneration
- **Print Support** - Clean printable format

---

## 🧠 How Question Generation Works

### Iterative Generation Process
1. **Initial Call** - Request exact number of questions from GPT-4o
2. **Count Check** - Verify if target count is met
3. **Additional Generation** - If fewer, call LLM again for remaining
4. **Trim if Needed** - If more, trim to exact count
5. **Max 3 Iterations** - Ensures completion within reasonable time

### Chain-of-Thought Reasoning
Each skill gap includes full AI reasoning:
- **Data Observation** - What the score shows
- **Evidence from Evaluation** - Specific transcript/feedback citations
- **Gap Significance** - Why this matters for the role
- **Interview Strategy** - Recommended approach
- **Question Rationale** - Why this specific question

---

## 🔧 Configuration

### Environment Variables

```env
# Backend (.env)
OPENAI_API_KEY=sk-...           # Required for AI generation
PG_HOST=your-postgres-host       # Skillfully database host
PG_PORT=5432                     # PostgreSQL port
PG_DBNAME=your-database          # Database name
PG_USERNAME=your-username        # Database user
PG_PASSWORD=your-password        # Database password
```

### Frontend Configuration
```env
# frontend/.env.local (optional)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 📊 Database Tables Used

| Table | Purpose |
|-------|---------|
| `evaluation` | Main skill evaluation results with scores |
| `evaluation_feedback_table` | Overall feedback and evaluation summaries |
| `evaluation_voice_elsa` | Voice/pronunciation assessments (CEFR scores) |
| `skills_map` | Skill definitions and prompts |

---

## 🤝 Team

Built for Skillfully Hackathon

## 📄 License

MIT
