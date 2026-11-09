import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Fonte comunitária pública do Pelando. Não exige credenciais; respeita robots.txt
// e consulta apenas o feed público de promoções, sem acessar áreas autenticadas.
type PelandoDeal = {
  id?: string;
  uuid?: string;
  title?: string;
  name?: string;
  price?: number | string | null;
  store?: { name?: string } | string | null;
  sourceUrl?: string;
  url?: string;
  image?: string;
  imageUrl?: string;
  category?: { name?: string } | string;
  publishedAt?: string;
  kind?: string;
};

const API = "https://api-web.pelando.com.br";
const MAX_RESULTS = 30;

function asPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(".", "").replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function storeName(value: PelandoDeal["store"]): string {
  if (typeof value === "string") return value;
  return text(value?.name) ?? "Loja não informada";
}

function categoryName(value: PelandoDeal["category"]): string {
  if (typeof value === "string") return value;
  return text(value?.name) ?? "Ofertas";
}

export async function POST(request: Request) {
  const expectedKey = process.env.INGESTION_API_KEY;
  if (!expectedKey || request.headers.get("x-ingestion-key") !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const robotsResponse = await fetch("https://api-web.pelando.com.br/robots.txt", {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!robotsResponse?.ok) {
    return NextResponse.json({ error: "Não foi possível verificar robots.txt do Pelando; coleta cancelada." }, { status: 503 });
  }
  const robots = await robotsResponse.text();
  const disallowApi = robots.split(/\r?\n/).some((line) => /^\s*Disallow:\s*\/api-web/i.test(line));
  if (disallowApi) {
    return NextResponse.json({ error: "O robots.txt não permite consultar esta rota; coleta cancelada." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const query = body && typeof body === "object" ? text((body as { query?: unknown }).query) : null;
  const limitInput = body && typeof body === "object" ? (body as { limit?: unknown }).limit : null;
  const limit = typeof limitInput === "number" && Number.isInteger(limitInput)
    ? Math.max(1, Math.min(MAX_RESULTS, limitInput)) : 20;
  if (query && (query.length < 2 || query.length > 80)) {
    return NextResponse.json({ error: "A busca deve ter entre 2 e 80 caracteres." }, { status: 400 });
  }

  const url = new URL(query ? "/feed/search" : "/feed/v2/recents", API);
  url.searchParams.set("size", String(limit));
  url.searchParams.set("hideExpired", "true");
  if (query) {
    url.searchParams.set("term", query);
    url.searchParams.set("kind", "promotion");
  }

  const upstream = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "RadarOfertas/1.0 (public deal feed)" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: "A fonte pública do Pelando não respondeu.", upstream_status: upstream.status }, { status: 502 });
  }

  const payload = await upstream.json() as { data?: { deals?: PelandoDeal[] } };
  const deals = payload.data?.deals ?? [];
  const db = createServerSupabase();
  if (!db) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });

  let savedCount = 0;
  let historyCount = 0;
  let skippedCount = 0;
  const checkedAt = new Date().toISOString();

  for (const deal of deals) {
    const id = text(deal.uuid) ?? text(deal.id);
    const title = text(deal.title) ?? text(deal.name);
    const price = asPrice(deal.price);
    const productUrl = text(deal.sourceUrl) ?? text(deal.url);
    if (!id || !title || !price || !productUrl || !productUrl.startsWith("https://")) {
      skippedCount++;
      continue;
    }

    const sourceKey = `pelando:${id}`;
    const { data: previous, error: lookupError } = await db.from("offers")
      .select("id, price_card").eq("source_key", sourceKey).maybeSingle();
    if (lookupError) {
      console.error("Pelando lookup failed:", lookupError.message);
      return NextResponse.json({ error: "Falha ao consultar ofertas existentes." }, { status: 500 });
    }

    const imageUrl = text(deal.imageUrl) ?? text(deal.image);
    const row = {
      source_key: sourceKey,
      title,
      category: categoryName(deal.category),
      image_url: imageUrl?.startsWith("https://") ? imageUrl : null,
      store: storeName(deal.store),
      seller: "Oferta publicada no Pelando",
      price_cash: null,
      price_card: price,
      installments: null,
      installment_value: null,
      shipping: null,
      condition: "new" as const,
      product_url: productUrl,
      verified_at: checkedAt,
    };

    const { data: saved, error: saveError } = await db.from("offers")
      .upsert(row, { onConflict: "source_key" }).select("id, price_card").single();
    if (saveError || !saved) {
      console.error("Pelando save failed:", saveError?.message);
      return NextResponse.json({ error: "Falha ao salvar oferta." }, { status: 500 });
    }
    savedCount++;
    if (!previous || Number(previous.price_card) !== Number(saved.price_card)) {
      const { error } = await db.from("price_history").insert({
        offer_id: saved.id, price_card: saved.price_card, captured_at: checkedAt,
      });
      if (error) {
        console.error("Pelando history failed:", error.message);
        return NextResponse.json({ error: "Oferta salva, mas falhou o histórico." }, { status: 500 });
      }
      historyCount++;
    }
  }

  return NextResponse.json({
    ok: true, source: "pelando_public_feed", received: deals.length,
    saved: savedCount, skipped: skippedCount, history_entries_created: historyCount,
    note: "Preços são os publicados pela comunidade no Pelando; confirme no site da loja antes de comprar.",
  });
}
