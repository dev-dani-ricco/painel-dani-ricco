This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Central de Inteligência / Dani Knowledge

A rota `/inteligencia` é a interface privada de entrada de conhecimento do ecossistema Dani Ricco.

Fluxos disponíveis:
- notas textuais por projeto;
- upload privado de arquivos;
- captura/upload de áudio;
- upload de imagens;
- busca full-text por projeto;
- chat aterrado nas fontes autorizadas do projeto.

Persistência:
- Neon: projetos, fontes, mensagens e texto extraído;
- Vercel Private Blob: arquivo original em produção;
- `.data/dani-knowledge`: fallback apenas em desenvolvimento local.

Processamento multimodal:
- texto simples é extraído nativamente;
- áudio é transcrito com `gpt-4o-transcribe` quando `OPENAI_API_KEY` está configurada;
- imagens são analisadas via Responses API;
- binários sem extrator configurado ficam preservados com status `stored`, sem simular processamento.

Segurança arquitetural:
- o domínio Dani não consulta a memória do TI Broker CORE;
- arquivos e resultados permanecem vinculados ao projeto escolhido;
- chaves de IA e storage são exclusivamente server-side;
- respostas de IA usam `store: false`.

Veja `.env.example` para as variáveis necessárias.
