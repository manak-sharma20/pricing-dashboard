# 📋 DECISIONS.md — Architectural Decision Records

Key decisions made during the design and development of the Pricing Dashboard, with context and rationale.

---

## ADR-001 — Multi-Agent Pipeline for Pricing Logic

**Status:** Accepted

### Context
Pricing decisions depend on several independent data sources: competitor prices, demand signals, inventory levels, and cost constraints. Bundling all of this into a single function would make the logic hard to test, extend, or swap out.

### Decision
Split pricing logic into **five dedicated agents**, each with a single responsibility, run sequentially by `run_pricing_pipeline()`:

1. Market Intelligence
2. Demand Forecasting
3. Inventory & Cost
4. Pricing Strategy
5. Execution & Compliance

Each agent receives only the data it needs and returns a typed dict. The pipeline aggregates their outputs into a single `Recommendation` record.

### Consequences
- Each agent can be unit-tested independently.
- New signals (e.g. seasonality, promotions) can be added as a new agent without touching others.
- The sequential design means agents later in the chain depend on outputs from earlier ones — failure in Agent 1 propagates forward.

---

## ADR-002 — Confidence Score + Auto-Execute Threshold

**Status:** Accepted

### Context
Not every pricing recommendation should be applied automatically. High-confidence, clear-cut cases (e.g. overstocked + low demand) should execute immediately; ambiguous cases should wait for human review.

### Decision
Agent 4 emits a `confidence_score` (0.0–1.0) alongside each recommendation. Agent 5 compares it against `OrgConfig.auto_execute_threshold`.

- `confidence >= threshold` → `auto_executed`: price updated, `AuditLog` written immediately.
- `confidence < threshold` → `pending`: stored for manual approval.

The threshold is **per-organisation**, stored in `OrgConfig`, so different teams can tune their own risk tolerance.

### Consequences
- Creates a clear, auditable boundary between automated and human decisions.
- Organisations with more conservative risk profiles set a higher threshold.
- Confidence values are currently rule-derived; when the LLM is fully integrated via Groq, scores will need calibration.

---

## ADR-003 — Enforce Margin Floor Inside the Pricing Agent

**Status:** Accepted

### Context
Market and demand signals can sometimes push a recommended price below a profitable level. Profitability constraints must be non-negotiable regardless of what other signals suggest.

### Decision
After Agent 4 determines a `recommended_price`, it checks whether the resulting gross margin meets `Category.margin_floor`. If not, the price is clamped to `cost_of_goods / (1 - margin_floor)` and the rationale string is annotated to reflect the adjustment.

### Consequences
- Margin protection is enforced at the computation layer, not the UI layer — it cannot be bypassed by a frontend call.
- The confidence score is reduced by 0.2 when a margin-floor clamp occurs, signalling that the recommendation is constrained rather than optimal.

---

## ADR-004 — FastAPI + SQLAlchemy for the Backend

**Status:** Accepted

### Context
The backend needs to handle async HTTP requests, validate complex request/response shapes, and interact with a relational database.

### Options Considered
- **Flask + SQLAlchemy** — mature and simple, but synchronous by default and lacks built-in schema validation.
- **FastAPI + SQLAlchemy + Pydantic** — async-first, automatic OpenAPI docs, Pydantic v2 for validation with excellent performance.
- **Django REST Framework** — full-featured but heavyweight for this use case.

### Decision
**FastAPI** with **SQLAlchemy 2.0** and **Pydantic v2**. Alembic handles schema migrations.

### Consequences
- Swagger UI available at `/docs` automatically — useful for frontend development and debugging.
- Pydantic v2 `pydantic-settings` manages environment variable parsing cleanly.
- SQLAlchemy's async session support can be introduced later without restructuring models.

---

## ADR-005 — Groq for LLM Integration

**Status:** Accepted (partially implemented)

### Context
The Pricing Strategy agent (Agent 4) is currently rule-based but is designed to delegate complex or ambiguous pricing decisions to an LLM.

### Options Considered
- **OpenAI API** — most capable, but higher cost and latency.
- **Anthropic Claude API** — strong reasoning, but also higher cost.
- **Groq** — extremely fast inference (LPU hardware), low latency, cost-effective for high-volume pricing runs.

### Decision
**Groq** (`groq==0.4.2`) is included as the LLM provider. Given that the pipeline runs per-product and potentially at scale, low-latency inference is critical.

### Consequences
- Current Agent 4 uses rule-based logic with the Groq integration as a stub — to be wired in fully.
- Groq's speed makes it practical to call the LLM synchronously within the pipeline without significantly impacting response time.
- API key managed via `GROQ_API_KEY` environment variable.

---

## ADR-006 — JWT Authentication with bcrypt Password Hashing

**Status:** Accepted

### Context
The platform is multi-tenant (multiple orgs) and needs to ensure users only access their own org's data.

### Decision
- Passwords are hashed with **bcrypt** via `passlib`.
- Authentication issues a **JWT** signed with a `SECRET_KEY` using `python-jose`.
- All protected endpoints validate the token and extract `org_id` to scope database queries.

### Consequences
- Stateless auth — no server-side session storage required.
- Token expiry must be managed on the frontend; a refresh token strategy can be added later.

---

## ADR-007 — Immutable AuditLog for All Price Changes

**Status:** Accepted

### Context
Automated price changes carry regulatory and business risk. There must be a clear, tamper-evident record of every price change, who (or what) triggered it, and what recommendation it was based on.

### Decision
Every auto-executed price change writes an `AuditLog` record containing `old_price`, `new_price`, `product_id`, `recommendation_id`, and `executed_by` (null for automatic executions). The log is append-only — no update or delete routes are exposed.

### Consequences
- Full traceability from a recommendation back to the agent outputs that produced it (stored as JSON on `Recommendation`).
- Manual approvals will also write to `AuditLog` with the approving user's ID.

---

## ADR-008 — Next.js 16 + React 19 + Tailwind CSS v4 for the Frontend

**Status:** Accepted

### Context
The dashboard needs a modern, responsive UI with fast navigation. The team is TypeScript-first.

### Decision
- **Next.js 16** (App Router) for file-based routing, server components, and Vercel-native deployment.
- **React 19** — latest stable, ships with improved async rendering primitives.
- **Tailwind CSS v4** — configured via the `@tailwindcss/postcss` plugin (no `tailwind.config.js` required).

### Consequences
- Vercel auto-detects Next.js and deploys with zero configuration.
- Tailwind v4's PostCSS-based setup differs from v3 — contributors should note there is no `tailwind.config.js` file; configuration lives in CSS.
- React 19 is still newly released; some third-party component libraries may lag behind.