# Radar Ofertas

Plataforma pública de descoberta e monitoramento de ofertas. Visitantes consultam o catálogo sem cadastro ou login; alertas personalizados podem ser opcionais e sem conta.

## Stack inicial
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Manifesto PWA
- API interna para ingestão de ofertas (MVP)
- Worker de coleta desacoplado (a implementar por fonte, respeitando APIs/termos)

## Requisitos
- Node.js 20+
- npm
- Projeto Supabase

## Rodar localmente
```bash
npm install
cp .env.example .env.local
npm run dev
```
Abra http://localhost:3000.

Sem credenciais Supabase, o app usa dados demonstrativos locais. Para habilitar persistência, configure as variáveis no `.env.local` e aplique `supabase/schema.sql` no SQL Editor do Supabase.

## Variáveis
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor; nunca exponha ao navegador)
- `INGESTION_API_KEY` (proteger ingestão de ofertas)

## Importante sobre coleta
O projeto não faz scraping indiscriminado. Cada integração deve usar API/feed oficial ou coleta permitida pela loja, respeitar limites, identificar vendedor/variante, validar preço no cartão, frete, estoque e condição do produto. Preço em snippet não é confirmação.

## Estado atual
- Aplicação publicada na Vercel e conexão com o Supabase validada pelo endpoint `/api/health`.
- A API `POST /api/ingest` valida os campos recebidos, exige `x-ingestion-key`, limita lotes a 50 ofertas e registra no histórico quando o preço no cartão muda.
- A ingestão ainda depende de configurar `INGESTION_API_KEY` na Vercel e de conectar uma fonte real (API/feed autorizado ou integração permitida pela loja).
- A interface ainda pode exibir dados demonstrativos quando não houver ofertas reais; eles estão marcados como exemplos.
- Painel administrativo, alertas e coletores por loja ainda não foram implementados.
