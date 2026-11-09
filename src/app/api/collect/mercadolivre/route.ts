import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type MercadoLivreItem = {
  id?: string;
  title?: string;
  category_id?: string;
  price?: number;
  currency_id?: string;
  permalink?: string;
  thumbnail?: string;
  condition?: string;
  seller?: { id?: number; nickname?: string };
};

const MAX_QUERIES = 5;
const MAX_RESULTS_PER_QUERY = 20;

export async function POST(request: Request) {
  const expectedKey = process.env.INGESTION_API_KEY;
  const providedKey = request.headers.get("x-ingestion-key");
  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.MELI_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Mercado Livre não configurado. Defina MELI_ACCESS_TOKEN na Vercel." },
      { status: 503 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const queries = body && typeof body === "object"
    ? (body as { queries?: unknown }).queries
    : null;

  if (!Array.isArray(queries) || queries.length < 1 || queries.length > MAX_QUERIES ||
      !queries.every((q) => typeof q === "string" && q.trim().length >= 2 && q.trim().length <= 80)) {
    return NextResponse.json(
      { error: "Envie queries com 1 a 5 termos, cada um entre 2 e 80 caracteres." },
      { status: 400 }
    );
  }

  const db = createServerSupabase();
  if (!db) {
    return NextResponse.json({ error: "Supabase server credentials not configured" }, { status: 503 });
  }

  const collected = new Map<string, MercadoLivreItem>();
  for (const rawQuery of queries as string[]) {
    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", rawQuery.trim());
    url.searchParams.set("limit", String(MAX_RESULTS_PER_QUERY));
    url.searchParams.set("sort", "relevance");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // Não registra o token nem o corpo completo da resposta nos logs.
      console.error("Mercado Livre search failed:", response.status);
      return NextResponse.json(
        { error: "A API do Mercado Livre recusou a consulta.", upstream_status: response.status },
        { status: response.status === 401 || response.status === 403 ? 502 : 503 }
      );
    }

    const payload = await response.json() as { results?: MercadoLivreItem[] };
    for (const item of payload.results ?? []) {
      if (item.id && item.title && typeof item.price === "number" &&
          item.price > 0 && item.currency_id === "BRL" &&
          item.permalink?.startsWith("https://") &&
          (item.condition === "new" || item.condition === "used")) {
        collected.set(item.id, item);
      }
    }
  }

  if (collected.size === 0) {
    return NextResponse.json({
      ok: true,
      source: "mercado_livre",
      collected: 0,
      saved: 0,
      message: "A consulta não retornou anúncios válidos em BRL.",
    });
  }

  const timestamp = new Date().toISOString();
  let savedCount = 0;
  let historyCount = 0;

  for (const item of collected.values()) {
    const sourceKey = `mercadolivre:${item.id}`;
    const seller = item.seller?.nickname?.trim() ||
      (item.seller?.id ? `Vendedor ML #${item.seller.id}` : "Vendedor não informado");

    const { data: previous, error: lookupError } = await db
      .from("offers")
      .select("id, price_card")
      .eq("source_key", sourceKey)
      .maybeSingle();

    if (lookupError) {
      console.error("Mercado Livre existing-offer lookup failed:", lookupError.message);
      return NextResponse.json({ error: "Não foi possível consultar ofertas existentes." }, { status: 500 });
    }

    const row = {
      source_key: sourceKey,
      title: item.title,
      category: item.category_id ?? "Mercado Livre",
      image_url: item.thumbnail?.replace(/^http:/, "https:") ?? null,
      store: "Mercado Livre",
      seller,
      // A API fornece o preço anunciado do item; não presume preço parcelado/cartão.
      price_cash: null,
      price_card: item.price,
      installments: null,
      installment_value: null,
      shipping: null,
      condition: item.condition as "new" | "used",
      product_url: item.permalink,
      verified_at: timestamp,
    };

    const { data: saved, error: upsertError } = await db
      .from("offers")
      .upsert(row, { onConflict: "source_key" })
      .select("id, price_card")
      .single();

    if (upsertError || !saved) {
      console.error("Mercado Livre offer save failed:", upsertError?.message);
      return NextResponse.json({ error: "Não foi possível salvar uma oferta." }, { status: 500 });
    }

    savedCount += 1;
    if (!previous || Number(previous.price_card) !== Number(saved.price_card)) {
      const { error: historyError } = await db.from("price_history").insert({
        offer_id: saved.id,
        price_card: saved.price_card,
        captured_at: timestamp,
      });
      if (historyError) {
        console.error("Mercado Livre price history failed:", historyError.message);
        return NextResponse.json({ error: "Oferta salva, mas falhou ao registrar o histórico." }, { status: 500 });
      }
      historyCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    source: "mercado_livre",
    collected: collected.size,
    saved: savedCount,
    history_entries_created: historyCount,
  });
}
