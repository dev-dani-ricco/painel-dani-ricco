# Dani IA — Memory Foundation Cycle

## Objective

Prepare the Dani IA knowledge base for governed, high-volume questionnaire ingestion before real answers are submitted.

Acceptance path:
`input -> extraction -> question/answer segmentation -> analysis -> classification -> chunks -> embeddings -> review -> approval -> clone retrieval`.

Questionnaire sources are never clone-eligible before approval.

## PO / Project Lead

- Scope is limited to Dani IA private knowledge inside `painel-dani-ricco`.
- Existing operational panel, Outfit and TI Broker CORE boundaries remain intact.
- Long questionnaire is treated as high-authority evidence only when its declared source is actually Dani.
- Derived analysis never replaces the original answer.
- No automatic activation of questionnaire content.
## Tech Lead / Architecture

- Source is the auditable origin; chunks are retrieval units.
- `clone_scope` separates global clone memory from product-specific knowledge.
- Lifecycle: `active | review_required | superseded | rejected`.
- Authority is explicit and weighted independently from uploader identity.
- Hybrid retrieval combines PostgreSQL FTS + pgvector cosine similarity + authority weight.
- No-match behavior returns insufficient evidence; it does not inject recent unrelated memories.
- Legacy unchunked sources retain lexical compatibility until reindexed.

## UX / Product Design

- Intelligence panel exposes `Memória comum` vs `Questionário · revisar antes`.
- Source authority can be declared explicitly.
- Questionnaire mode explains that content remains in review.
- Recent memory cards expose indexing/review state.
- Authorized reviewers can activate reviewed memory from the UI.

## Mobile

- Controls use responsive two-column-to-stack layout.
- Review warning, selectors and approval controls must remain usable on narrow viewports.
- Browser/mobile validation remains a release gate.
## Backend / Data

- Migration: `db/migrations/20260928_dani_ai_memory_foundation.sql`.
- Tables added: `dani_knowledge_chunks`, `dani_knowledge_ingestion_events`.
- Governance/versioning columns added to `dani_knowledge_sources`.
- pgvector 1536-dimensional embeddings enabled.
- HNSW cosine index and full-text chunk index created.
- Ingestion stages are persisted and also logged as `[DANI_KNOWLEDGE]` events.
- Questionnaire analysis stores interpretation beside the original question/answer evidence.

## 3D

- N/A for this cycle.
- No Outfit 3D model, asset, avatar, garment or rendering path is modified.
- `impar-outfit` remains project-scoped and is not automatically absorbed into Dani global memory.

## Security

- `/api/knowledge/*` and `/api/clone/*` share the Intelligence permission boundary.
- Questionnaire content is excluded from clone retrieval while `review_required`.
- Approval requires owner/admin/system role.
- Delete flow remains separately audited.
- Model calls use `store: false`.
- Private uploaded originals keep existing private-storage behavior.

## QA / Release

- TypeScript: PASS.
- ESLint: PASS.
- Production build: PASS.
- Database connectivity: PASS.
- pgvector availability: PASS.
- Database migration: PASS 21/21.
- Preview browser QA: PENDING.
- Production promotion: PENDING.
- First real questionnaire ingestion: PENDING and must be observed end-to-end before approval.
