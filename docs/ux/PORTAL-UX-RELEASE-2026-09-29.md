# Portal Dani Ricco — UX/UI Release 2026-09-29

## Objetivo

Elevar o portal interno a um padrão consistente de clareza, legibilidade, hierarquia visual, responsividade e acessibilidade, preservando regras de negócio, dados e o comportamento das integrações existentes.

Escopo: portal autenticado (`portal-ui`). O site público e as experiências públicas IMPAR® permanecem fora do escopo visual desta release.

## PO / Project Lead

- Prioridade: reduzir carga cognitiva e tornar ações, contexto e estados operacionais imediatamente compreensíveis.
- A Visão Geral continua transversal; nenhum lançamento é aberto automaticamente.
- A Central de Inteligência mantém memória, questionário e aprovação como capacidades distintas.
- Projetos preservam Kanban, Lista e Calendário sem alterar os dados subjacentes.
- Nenhuma regra de negócio foi removida para simplificar a interface.
## Tech Lead / Arquitetura

- Foi criado um baseline visual interno escopado por `.portal-ui`.
- O design system interno não vaza para o site público.
- Sidebar desktop: 288 px em telas `xl+`; tablet e mobile usam drawer.
- Header interno: 72 px; conteúdo principal possui offset seguro e largura máxima de 1720 px.
- Componentes compartilhados receberam ajustes centrais de legibilidade e acessibilidade.
- Tabelas, calendário mensal e Kanban preservam scroll local quando necessário, evitando overflow global.

## UX / Product Design

- Tipografia interna abaixo de 11 px foi eliminada visualmente.
- Metadados de 10–11 px passam a renderizar em 12 px no portal.
- Contraste de textos secundários foi elevado.
- Hierarquia de títulos, cards, métricas, filtros e ações foi reforçada.
- Botões, inputs, selects, tabs, badges, dialogs e sheets receberam áreas de interação maiores.
- Home, Inteligência, Projetos, Calendário, Tarefas, Materiais, Configurações e editores foram revisados.
- Estados vazios, indicadores e ações secundárias mantêm presença visual sem competir com a ação principal.
## Mobile

- Sidebar fixa só aparece em `xl+`; tablet/mobile usam navegação lateral em drawer.
- Alvos de toque foram ampliados e controles críticos mantêm legibilidade em 390 px.
- Calendário mensal usa scroll interno controlado.
- Kanban mantém navegação horizontal dentro do fluxo, sem expandir o documento.
- Central de Inteligência reduz densidade no mobile e separa a área de conversa da área de ensino/memórias.
- Filtros e ações reorganizam-se sem sobreposição.

## Backend / Data

- Não houve alteração de schema, migração ou conteúdo de negócio nesta release de UX.
- Persistência e sincronização Neon permanecem inalteradas.
- Dados existentes não foram transformados ou copiados.
- Artefatos de QA visual ficam apenas no PC NewBio e são ignorados pelo Git.

## 3D

- N/A nesta release.
- Nenhum fluxo, modelo, asset ou renderização do IMPAR Outfit foi alterado.
## Segurança

- Autenticação, proxy e permissões permanecem preservados.
- Controles sem nome acessível receberam `aria-label`, `aria-labelledby`, `label/for` ou título apropriado.
- QA confirmou que rotas autenticadas continuam protegidas.
- Nenhum dado da aplicação foi copiado para o PC-ILUMEN-DELL.

## QA / Release

- TypeScript (`tsc --noEmit`): PASS.
- ESLint: PASS.
- Invariantes do painel: PASS.
- Build Next.js de produção: PASS.
- QA visual automatizado: 15 rotas × 3 viewports = 45 verificações, 0 erros, 0 alertas.
- QA funcional crítico: PASS em tarefas, proxy, permissões, home, ecossistema, topbar, mobile, troca de projeto e adição de etapa.
- Capturas visuais: 8 telas críticas (4 desktop + 4 mobile), armazenadas somente em `qa-artifacts/` local.
- Preview Vercel: PASS no commit `d41e124`; `qa:portal-ux` = 45/45, 0 erros, 0 alertas.
- QA funcional no preview: PASS em todos os fluxos críticos.
- Capturas do preview: PASS, 8 telas críticas.
- Produção Vercel: deployment `dpl_HhKyoZRqF4Z2GmzUrbT25moUCg4c` READY.
- Domínio validado: `painel.daniricco.com.br`.
- QA visual em produção: 45/45, 0 erros, 0 alertas.
- QA funcional em produção: PASS em todos os fluxos críticos.
- Segurança pós-deploy: `/api/knowledge/sources`, `/api/clone/pulse` e `/api/dashboard` retornam 401 sem sessão.
- Runtime Vercel após promoção: 0 erros no período de validação.

## Critério de promoção

Atendido. O artefato validado em preview foi promovido e revalidado no domínio real. Esta release pode ser tratada como baseline visual e responsivo do portal autenticado.
