# 💡 IdeaFlow — AI-Assisted Idea & Task Tracker

IdeaFlow is a lightweight, distraction-free Kanban board and personal sprint planner built with FastAPI, SQLite, and Google Gemini AI. 

Rather than relying on bloated frontend frameworks, it demonstrates end-to-end full-stack fundamentals: parameterized SQL persistence, RESTful API validation, client-side debouncing, and secure LLM integration.

---

## 🏛️ System Architecture

```text
[ Browser (Vanilla JS) ]
       │
       ├── (1) Direct CRUD Actions (Fetch API) 
       │         │
       │         ▼
       │   [ FastAPI REST Server ]
       │         │
       │         ├── (2) Pydantic Validation & SQL (Parameterized)
       │         │         │
       │         │         ▼
       │         │   [ SQLite (ideas.db) ]
       │         │
       │         └── (3) Secure LLM Proxy (python-dotenv)
       │                   │
       │                   ▼
       │             [ Google Gemini API ]
       │
       └── (4) Micro-Interactions (Native Dialogs & Input Shake, No Native Alerts)
```

## 🧠 Engineering Decisions & Trade-offs (Decision Log)

| Decision / Trade-off | Alternative Considered | Why I Chose It (Engineering Rationale) |
| :--- | :--- | :--- |
| **FastAPI Backend** | Flask, Django | Needed async request handling, automatic Swagger/OpenAPI docs, and native Pydantic validation. |
| **SQLite Standard Library** | PostgreSQL, MongoDB | Single-user prototype requiring zero database management overhead. Built-in `sqlite3` provides fast, local persistence with zero latency. |
| **Backend AI Proxy** | Client-side API calls | **Security:** Calling Gemini from the browser exposes the API key in DevTools. Routing through `/api/ai/fix` keeps `GEMINI_API_KEY` safe on the server. |
| **Vanilla HTML/CSS/JS** | React, Next.js | No complex build steps or node_modules bloat. Delivers instant load times and direct DOM manipulation via native Web APIs (`<dialog>`, Fetch). |
| **Debounced Autocomplete (600ms)** | Keystroke-triggered API calls | Avoids firing 10+ unnecessary LLM calls per sentence. Saves quota and prevents race conditions. |
| **Defense-in-Depth Validation** | Frontend-only limits | Applied constraints on the client (`maxlength="60"`) AND enforced them on the backend via Pydantic `Field(max_length=60)` to reject malformed API calls. |
| **Parameterized Queries (`?`)** | String formatting / f-strings | Eliminates SQL Injection risks by treating user input strictly as parameters, never executable SQL. |

## 🛠️ Tech Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, Python-dotenv
- **Database:** SQLite3 (Embedded Relational)
- **AI:** Google Gemini (via google-genai SDK)
- **Frontend:** Semantic HTML5, Modern CSS (Variables & Animations), Vanilla JavaScript (ES6+)

## 🚀 Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/lidyademerw/ideaflow.git
cd ideaflow
```

### 2. Set up the virtual environment
```bash
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Start the application
```bash
uvicorn main:app --reload
```
