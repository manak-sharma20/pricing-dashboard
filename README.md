# 📊 Pricing Dashboard

An AI-powered dynamic pricing platform that uses a **multi-agent pipeline** to automatically analyse market conditions, demand signals, and inventory levels — then recommend or auto-execute price changes for products.

🔗 **Live Demo:** [pricing-dashboard-sooty.vercel.app](https://pricing-dashboard-sooty.vercel.app)

---

## 🧰 Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS v4       |
| Backend    | Python, FastAPI, SQLAlchemy, Alembic                    |
| Auth       | JWT (`python-jose`), bcrypt / passlib                   |
| Database   | PostgreSQL (`psycopg2`)                                 |
| AI / LLM   | Groq API                                                |
| Deployment | Vercel (frontend)                                       |

---

## 🤖 How the Pricing Pipeline Works

When triggered for a product, five agents run in sequence:

```
Product ID
    │
    ▼
[Agent 1] Market Intelligence    → Avg / min / max competitor prices
    │
    ▼
[Agent 2] Demand Forecasting     → Demand level from page views & cart adds (30d)
    │
    ▼
[Agent 3] Inventory & Cost       → Margin health, stock status vs thresholds
    │
    ▼
[Agent 4] Pricing Strategy       → Recommended price + rationale + confidence score
    │
    ▼
[Agent 5] Execution & Compliance → Auto-execute if confidence ≥ org threshold, else pending
    │
    ▼
Recommendation saved to DB → AuditLog written (if auto-executed)
```

---

## 📁 Project Structure

```
pricing-dashboard/
├── frontend/                  # Next.js 16 + TypeScript app
│   ├── app/                   # App Router pages & layouts
│   ├── components/            # UI components
│   ├── package.json
│   └── tsconfig.json
├── backend/                   # FastAPI application
│   ├── main.py                # App entry point, route registration
│   ├── models.py              # SQLAlchemy ORM models
│   ├── agents.py              # 5-agent pricing pipeline
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── database.py            # DB session & engine setup
│   ├── auth.py                # JWT auth helpers
│   ├── alembic/               # DB migration scripts
│   └── requirements.txt
├── DEPLOYMENT.md
├── ARCHITECTURE.md
├── DECISIONS.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/manak-sharma20/pricing-dashboard.git
cd pricing-dashboard
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your values
alembic upgrade head            # Run DB migrations
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local      # Fill in your values
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pricing_db
SECRET_KEY=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧩 Key Concepts

**Recommendation statuses:**
- `auto_executed` — confidence score ≥ org-level threshold; price updated immediately and logged to audit trail
- `pending` — confidence below threshold; awaits manual approval

**Margin floor enforcement:** Even if market or demand signals push toward a lower price, Agent 4 ensures the final recommended price never violates the category-level margin floor.

**Org-level configuration:** Each organisation has its own `auto_execute_threshold` in `OrgConfig`, allowing different teams to set their own risk tolerance.

---

## 📦 Available Scripts

### Frontend

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Lint with ESLint
```

### Backend

```bash
uvicorn main:app --reload        # Development server
alembic upgrade head             # Apply migrations
alembic revision --autogenerate  # Generate new migration
```