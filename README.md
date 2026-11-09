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
Este é um starter: interface e dados demonstrativos estão no repositório, mas hospedagem, banco Supabase, coleta real, painel administrativo e notificações ainda precisam ser configurados e implementados.
