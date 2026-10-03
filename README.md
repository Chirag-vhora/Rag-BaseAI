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
- **RAG & Vector Store**: Custom TF-IDF/BM25 Vector Similarity Engine with Role-Access Metadata filtering
