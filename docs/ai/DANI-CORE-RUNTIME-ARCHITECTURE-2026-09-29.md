# Dani Core — Runtime Architecture 2026-09-29

## Decision

The Dani domain owns Dani Ricco memory and knowledge.

The browser/panel is an interface. Vercel is an application hosting layer. Neither Vercel AI Gateway nor TI Broker CORE is allowed to become the owner of Dani memory.

The current Dani Core data plane is the server-side Dani knowledge runtime implemented by the Dani domain and its Dani-owned Postgres/Neon schema.

## Boundary

- Dani knowledge stays inside the Dani Ricco domain.
- TI Broker CORE stays a separate TI Broker memory domain.
- Cross-domain memory and RAG sharing remain disabled.
- MAESTRO/OmniRoute may orchestrate stateless model execution without becoming a memory owner.
- Original evidence remains authoritative; model output is derived enrichment.
## Ingestion contract

Questionnaire ingestion has zero mandatory model dependency.

Required path:

1. receive source;
2. preserve original text;
3. split question/answer units;
4. deterministic classification;
5. chunk persistence;
6. PostgreSQL full-text indexing;
7. review quarantine;
8. explicit human approval;
9. only then allow clone retrieval.

Optional enrichment:

- model-assisted classification;
- embeddings/vector search;
- audio transcription;
- image/binary extraction.

If an optional runtime is unavailable, the source remains valid and the deterministic/lexical path continues.

## Retrieval

PostgreSQL FTS is the mandatory baseline.

Vector retrieval is additive. Missing embeddings must never block memory creation or questionnaire review.

Approved sources only are eligible for clone retrieval. `review_required` sources remain invisible to the clone until explicit approval.

## Inference plane

Preferred model route:

Painel / Dani Core -> OmniRoute or another TI Broker-controlled OpenAI-compatible runtime -> selected provider/model.

Supported configuration:

- DANI_AI_BASE_URL
- DANI_AI_API_KEY
- DANI_AI_MODEL
- DANI_AI_FAST_MODEL
- OMNIROUTE_BASE_URL / OMNIROUTE_API_KEY as compatible aliases

Alternative explicit runtime:

- DANI_OPENAI_COMPAT_BASE_URL
- DANI_OPENAI_COMPAT_API_KEY

Direct provider access remains optional for capabilities that are not yet available in the owned runtime.

There is no automatic Vercel AI Gateway fallback.

## Embeddings

The default embedding path is owned and local: `ti-broker-local-hash-v1`, generated inside Dani Core with 1536 dimensions and stored in Dani-owned pgvector.

It requires no external API, billing account or Vercel AI Gateway. PostgreSQL FTS remains the lexical baseline and is combined with the local vector signal.

An external embedding runtime can be selected explicitly with `DANI_EMBEDDING_MODE=external`. If that optional runtime fails, Dani Core falls back to the local embedding instead of blocking ingestion.

## Operational roles

### PO / Project Lead
Memory intake must never be blocked by model-provider availability.

### Tech Lead / Architecture
Keep the memory plane independent from the inference plane and preserve domain isolation.

### UX / Product Design
Show review and runtime states clearly without presenting provider billing as a product dependency.

### Mobile
Preserve the same ingestion and review contract on narrow viewports.

### Backend / Data
Preserve original evidence, deterministic metadata, chunks, FTS, authority, lifecycle and audit.

### 3D
No change. IMPAR Outfit remains its own product runtime and project-scoped knowledge consumer.

### Security
No cross-domain Dani/TI Broker memory sharing. Model runtimes are replaceable and receive only the context required for the current execution.

### QA / Release
Every release must prove that questionnaire ingestion succeeds with no model configured and stays in review until explicit approval.

