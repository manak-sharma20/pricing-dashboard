# 🏗️ Architecture — Pricing Dashboard

## Overview

Pricing Dashboard is a decoupled full-stack application. The **Next.js frontend** provides the dashboard UI; the **FastAPI backend** owns all business logic, the multi-agent pricing pipeline, authentication, and the PostgreSQL database.

---

## System Diagram

```
┌───────────────────────────────────────────────┐
│              Browser (Client)                 │
│    Next.js 16 · React 19 · Tailwind CSS v4    │
│                                               │
│  Dashboard pages, recommendation views,       │
│  product tables, audit log UI                 │
└───────────────────┬───────────────────────────┘
                    │ HTTPS REST (JSON)
                    │ Bearer JWT
                    ▼
┌───────────────────────────────────────────────┐
│              FastAPI Backend                  │
│                                               │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Auth   │  │  Routes  │  │   Agents    │  │
│  │  JWT /  │  │  REST    │  │  Pipeline   │  │
│  │  bcrypt │  │  API     │  │  (5 agents) │  │
│  └─────────┘  └──────────┘  └──────┬──────┘  │
│                                    │          │
│  ┌─────────────────────────────────▼───────┐  │
│  │         SQLAlchemy ORM Layer            │  │
│  └─────────────────────────────────┬───────┘  │
│                                    │          │
│  ┌─────────────────────────────────▼───────┐  │
│  │           PostgreSQL Database           │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │           Groq API (LLM)                │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Stack

- **Next.js 16** with the App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (PostCSS plugin-based)

### Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (providers, global styles)
│   ├── page.tsx            # Entry / redirect
│   └── dashboard/          # Dashboard route(s)
├── components/             # Reusable UI components
├── lib/
│   └── api.ts              # Centralised fetch wrapper (reads NEXT_PUBLIC_API_URL)
├── package.json
└── tsconfig.json
```

### Authentication Flow

- User logs in via `/auth/login` on the backend → receives a JWT.
- The token is stored client-side and attached as a `Bearer` header on every subsequent API call.

---

## Backend Architecture

### Stack

- **FastAPI** — async REST API framework
- **SQLAlchemy 2.0** — ORM with declarative models
- **Alembic** — database migration management
- **Pydantic v2** — request/response validation and settings management
- **python-jose + passlib/bcrypt** — JWT creation & password hashing
- **psycopg2** — PostgreSQL driver
- **Groq SDK** — LLM integration for the pricing strategy agent

### Structure

```
backend/
├── main.py           # FastAPI app, middleware, router registration
├── models.py         # SQLAlchemy ORM models (see below)
├── agents.py         # Multi-agent pricing pipeline
├── schemas.py        # Pydantic schemas for API I/O
├── database.py       # Engine creation, SessionLocal, Base
├── auth.py           # JWT encode/decode, password hashing
├── alembic/          # Migration scripts
│   └── versions/
└── requirements.txt
```

### Database Models

| Model             | Purpose                                              |
|-------------------|------------------------------------------------------|
| `Product`         | Core product record: price, COGS, stock thresholds   |
| `Category`        | Product category with `margin_floor`                 |
| `CompetitorPrice` | Competitor price observations per product            |
| `DemandSignal`    | Time-series demand events (`PAGE_VIEWS`, `CART_ADDS`)|
| `Recommendation`  | Output of the pricing pipeline per product run       |
| `AuditLog`        | Immutable log of every executed price change         |
| `OrgConfig`       | Per-org settings, including `auto_execute_threshold` |

---

## The Multi-Agent Pricing Pipeline

`agents.py` implements `run_pricing_pipeline(product_id, db, user_id)` which orchestrates five sequential agents:

### Agent 1 — Market Intelligence
Queries `CompetitorPrice` for the product and returns average, min, and max competitor prices.

### Agent 2 — Demand Forecasting
Aggregates `DemandSignal` records over 30 days. Classifies demand as `High`, `Medium`, or `Low` based on page view and cart-add thresholds.

### Agent 3 — Inventory & Cost
Calculates current gross margin and compares `stock_level` against `low_stock_threshold` / `high_stock_threshold` to determine `Optimal`, `Understocked`, or `Overstocked` status.

### Agent 4 — Pricing Strategy
Applies rule-based logic (with Groq LLM integration) to produce:
- `recommended_price`
- `confidence_score` (0.0–1.0)
- `rationale` (human-readable explanation)

Core pricing rules:
| Condition | Action |
|---|---|
| Overstocked + Low demand | −10% price |
| Understocked + High demand | +15% price |
| Current price > 120% of market avg | Align to market avg + 5% |
| Any recommendation violates margin floor | Clamp to `cost / (1 − margin_floor)` |

### Agent 5 — Execution & Compliance
Compares `confidence_score` against the org's `auto_execute_threshold`.
- **≥ threshold** → status `auto_executed`: price updated on `Product`, `AuditLog` entry written.
- **< threshold** → status `pending`: recommendation saved for manual review.

### Pipeline Output

Every run persists a `Recommendation` record with the full `agent_outputs` JSON blob, enabling full traceability of each agent's reasoning.

---

## API Design

All endpoints are prefixed and JWT-protected (except `/auth`):

| Method | Path                              | Description                         |
|--------|-----------------------------------|-------------------------------------|
| POST   | `/auth/login`                     | Authenticate, receive JWT           |
| GET    | `/products`                       | List products for org               |
| POST   | `/products/{id}/run-pipeline`     | Trigger pricing pipeline            |
| GET    | `/recommendations`                | List recommendations                |
| PATCH  | `/recommendations/{id}/approve`   | Manually approve a pending rec      |
| GET    | `/audit-logs`                     | View price change audit trail       |

---

## Deployment

```
GitHub (main branch)
    │
    ▼ auto-deploy
Vercel                          ← Next.js frontend
    │
    │ HTTPS API calls
    ▼
Python backend host             ← FastAPI + uvicorn
(Render / Railway / EC2)
    │
    ▼
PostgreSQL (managed DB)
```

- Frontend env var `NEXT_PUBLIC_API_URL` points to the deployed backend.
- Backend reads `DATABASE_URL`, `SECRET_KEY`, and `GROQ_API_KEY` from environment.
- Alembic migrations are run as part of the backend deployment step.