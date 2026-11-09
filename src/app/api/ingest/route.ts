import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const expected = process.env.INGESTION_API_KEY;
  const provided = request.headers.get("x-ingestion-key");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.offers)) {
    return NextResponse.json({ error: "Expected { offers: [] }" }, { status: 400 });
  }
  const db = createServerSupabase();
  if (!db) return NextResponse.json({ error: "Supabase server credentials not configured" }, { status: 503 });
  const rows = body.offers.map((o: Record<string, unknown>) => ({
    title: o.title, category: o.category, image_url: o.image_url ?? null,
    store: o.store, seller: o.seller, price_cash: o.price_cash ?? null,
    price_card: o.price_card, installments: o.installments ?? null,
    installment_value: o.installment_value ?? null, shipping: o.shipping ?? null,
    condition: o.condition ?? "new", product_url: o.product_url,
    verified_at: new Date().toISOString(), source_key: o.source_key
  }));
  const { data, error } = await db.from("offers").upsert(rows, { onConflict: "source_key" }).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ inserted_or_updated: data?.length ?? 0 });
}
