# Dani Ricco Panel — Operating Contract

## Product identity

This repository is the **Dani Ricco management and marketing operations hub**.
It is not the Presença de Alto Valor product, and it is not a single-launch dashboard.

The global home must remain transversal: ecosystem links, projects, calendar, intelligence and team operations.
Project-specific product, offer, production and launch data only appear after a project context is opened.

## Ownership model

- Product/Project Lead: **DANI PANEL PROJECT LEAD**
- Orchestrator: **TI BROKER MAESTRO**
- UX gate: **UX UI REVIEWER**
- QA gate: **QA GATE**
- Security gate: **SECURITY REVIEWER** when auth, permissions, data, integrations or public access change
- Release gate: **RELEASE MANAGER**
- Browser/runtime verification: **BROWSER INFRA OPERATOR**

## Domain boundaries

- Dani Panel owns marketing/project coordination and ecosystem visibility.
- ALVIN owns marketing/content intelligence, campaign learning and content workflows.
- TI BROKER HUB owns commercial CRM and relationship operations.
- CORE owns reusable internal TI Broker context/memory; it must not absorb Dani private memory.
- DECISOR owns diagnosis, analysis and governed decision/execution logic.
- Dani private knowledge stays inside the Dani Ricco ecosystem boundary.

## Default delivery workflow

1. Project Lead confirms scope, identity, owner domain and acceptance criteria.
2. Load project context and relevant skills before implementation.
3. Implement the smallest coherent change without crossing product boundaries.
4. Run static gates: diff check, lint, TypeScript and build.
5. Run browser verification on the real flow, including responsive behavior and console/error overlays.
6. Run UX/QA review; add Security review for sensitive changes.
7. Deploy a preview and verify the exact deployed artifact.
8. Release Manager promotes the validated artifact to production.
9. Check production health/logs and record the release result.

## UI invariants

- The top operations bar remains visible while the user scrolls.
- The global home never auto-opens a project's detailed launch structure.
- Project creation lives on the Projects page, not inside the current-project dropdown.
- Selecting a project opens its project workspace.
- Ecosystem cards are living references and should expose useful visual/context previews.
- Dani Ricco and IMPAR® identity must remain visible without inventing unofficial brand assets.
