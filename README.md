# NexusHR Assistant — AI HR Policy RAG Workspace

An enterprise-grade **AI HR Assistant** with a **Retrieval-Augmented Generation (RAG)** pipeline, strict grounding, anti-hallucination guardrails, source attribution citations, and **Role-Based Access Control (RBAC)**.

Built as part of the **AI HR Assistant Technical Assessment**.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation & Capability | Status |
| :--- | :--- | :---: |
| **1. Knowledge Base Management** | • Upload PDF, DOCX, and TXT policy files via drag-and-drop.<br>• One-click **Seed Sample Company Policies** (Leave Policy, Remote Work, Benefits Guide, HR Executive Compensation).<br>• View processing status (*Indexed / Processing / Error*), chunk count, and file metadata.<br>• Purge/Delete documents and associated vector embeddings. | ✅ **100% Complete** |
| **2. RAG-Based AI Assistant** | • Multi-format parser → Semantic Chunking (~500 chars with overlap) → In-Memory Vector Store.<br>• TF-IDF & Exact-Token Cosine Similarity Search Engine.<br>• Grounded prompt execution with strict fallback (*"I could not find information regarding your request..."*).<br>• Precise source citation tags (Document title, snippet excerpt, match score %). | ✅ **100% Complete** |
| **3. Employee Chat** | • Interactive Q&A chat interface with multi-turn conversation memory.<br>• Expandable source reference cards showing exact policy excerpts.<br>• Clickable sample query pills.<br>• Anti-hallucination alert badges and loading indicators. | ✅ **100% Complete** |
| **4. Role-Based Access (Bonus)** | • Dual role toggle: **Employee** vs **HR / Admin**.<br>• Document visibility metadata (`employee` vs `hr_admin_only`).<br>• Role-filtered similarity retrieval (Employees cannot retrieve restricted HR Admin files). | ✅ **100% Complete** |
| **5. Backend API** | • Modular Express + TypeScript REST API (`/api/documents`, `/api/documents/upload`, `/api/documents/seed`, `/api/chat`, `/api/chat/history`).<br>• Input validation, CORS, error handling, and zero-config local engine fallback. | ✅ **100% Complete** |
| **6. Frontend UI** | • Executive-grade dashboard using Vite, React, and Tailwind CSS.<br>• Glassmorphism dark mode aesthetic, tab navigation, role badge switcher, and responsive layout. | ✅ **100% Complete** |

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  FRONTEND UI                                      |
|  - Role Switcher (Employee / HR Admin)      - Modern Responsive Dashboard        |
|  - Document Management Hub                  - Chat Interface with Source Badges  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v HTTP / JSON API
+-----------------------------------------------------------------------------------+
|                                 BACKEND SERVICES                                  |
|  - Document Ingestion API                   - Chat & RAG Query API                |
|  - Storage Repository (Docs & History)      - Access Control Middleware           |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                   RAG PIPELINE                                    |
| 1. Text Extractor (PDF, DOCX, TXT)     --> 2. Semantic Chunker (~500 chars)      |
| 3. Vector Embedder & Metadata Tagging  --> 4. Role-Filtered Similarity Retriever  |
| 5. Grounded Prompt Synthesizer          --> 6. Anti-Hallucination Guardrail        |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Running the Application

- **Run Server Only** (Port 5000):
  ```bash
  npm run server
  ```

- **Run Client Only** (Port 3000):
  ```bash
  npm run client
  ```

- **Run Both Simultaneously**:
  ```bash
  npm run dev
  ```

---

## 🧪 Testing & Verification Workflows

1. **Seed Sample Documents**:
   Open the **Knowledge Base** tab and click **"Seed Sample Policy Suite"**. This auto-loads 4 policy documents:
   - *Company Leave & Holiday Policy 2026.txt* (Public)
   - *Attendance & Flexible Remote Work Policy.txt* (Public)
   - *Employee Health & Perks Benefits Guide 2026.txt* (Public)
   - *HR & Management Executive Compensation Guidelines.txt* (**HR Admin Only**)

2. **Test Role-Based Access Control (RBAC)**:
   - Switch active role in header to **Employee**.
   - Ask: *"What are the salary revision bands for Rating 5?"*
   - **Result**: Assistant refrains from hallucinating and states that the info was not found because the compensation document is restricted to HR Admin.
   - Switch active role to **HR / Admin** and ask the same question.
   - **Result**: Assistant retrieves the confidential document and displays the exact 8%-12% salary increase bands.

3. **Test Anti-Hallucination Guardrail**:
   - Ask: *"What is the policy on company-sponsored space travel?"*
   - **Result**: Assistant triggers the grounding threshold check and returns a clear fallback message indicating the info is missing from company documents.

---

## 💻 Tech Stack Summary

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Multer, pdf-parse, mammoth
- **RAG & Vector Store**: Pinecone serverless index (768-dim) + Google `gemini-embedding-2`, with a local TF-IDF cosine fallback when embeddings/Pinecone are unavailable
- **LLM**: Google `gemini-3.5-flash-lite` (primary) → Mistral `ministral-14b-latest` (fallback) → local grounded synthesizer (last resort)

---

## 🚀 Deployment — Render (one URL for UI + API)

The Express server also serves the built React app (`client/dist`), so the whole
product lives on **one URL** — no CORS or separate-host config needed. The
frontend already calls the API with the relative path `/api`.

### Option A — Blueprint (fastest)

1. Push this repo to GitHub (the repo already contains `render.yaml`).
2. Render Dashboard → **New → Blueprint** → select the repo.
   Render reads `render.yaml` and creates the service (build, start, health check).
3. In the new service's **Environment** tab, paste the 3 secrets
   (`sync: false` in the blueprint):
   | Variable | Value |
   |---|---|
   | `PINECONE_API_KEY` | from app.pinecone.io → API Keys |
   | `GEMINI_API_KEY` | from aistudio.google.com/app/apikey |
   | `MISTRAL_API_KEY` | from console.mistral.ai *(optional fallback)* |
   `PINECONE_INDEX` is preset to `rag-system`.
4. Deploy → open `https://<service>.onrender.com` — the UI loads from `/` and
   the API answers at `/api/health`.

### Option B — Manual web service

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### Why a restart doesn't lose your documents

Render's **free plan has an ephemeral disk** (files are wiped on every
restart/sleep), so the app treats **Pinecone as the source of truth**:

- `data/vector-store.json` — local mirror (used on machines with a durable disk);
- at boot, `syncVectorStores()` in `server/src/index.ts` **re-imports any document
  that only exists in Pinecone** and **re-indexes any document Pinecone is
  missing**, then logs `🌲 Pinecone sync OK`.

Verify after a restart: `GET /api/health` → `stats.totalDocuments` should still
show your full document list.

> **Free plan caveat:** the service sleeps after ~15 min idle, so the first
> request after idle takes 30–60s to wake up.

