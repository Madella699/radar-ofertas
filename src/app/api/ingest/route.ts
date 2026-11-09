import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

type IncomingOffer = {
  source_key: string;
  title: string;
  category: string;
  store: string;
  seller: string;
  product_url: string;
  price_card: number;
  price_cash?: number | null;
  installments?: number | null;
  installment_value?: number | null;
  shipping?: number | null;
  image_url?: string | null;
  condition?: "new" | "used" | "refurbished";
};

function isText(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isOptionalNonNegativeNumber(value: unknown): value is number | null | undefined {
  return value == null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function isHttpUrl(value: unknown): value is string {
  if (!isText(value, 2048)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateOffer(value: unknown): value is IncomingOffer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const offer = value as Record<string, unknown>;
  return (
    isText(offer.source_key, 200) &&
    isText(offer.title) &&
    isText(offer.category, 80) &&
    isText(offer.store, 120) &&
    isText(offer.seller, 160) &&
    isHttpUrl(offer.product_url) &&
    isPositiveNumber(offer.price_card) &&
    isOptionalNonNegativeNumber(offer.price_cash) &&
    (offer.price_cash == null || isPositiveNumber(offer.price_cash)) &&
    (offer.installments == null || (Number.isInteger(offer.installments) && Number(offer.installments) > 0)) &&
    isOptionalNonNegativeNumber(offer.installment_value) &&
    isOptionalNonNegativeNumber(offer.shipping) &&
    (offer.image_url == null || isHttpUrl(offer.image_url)) &&
    (offer.condition == null || ["new", "used", "refurbished"].includes(String(offer.condition)))
  );
}

export async function POST(request: Request) {
  const expected = process.env.INGESTION_API_KEY;
  const provided = request.headers.get("x-ingestion-key");

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as { offers?: unknown }).offers)) {
    return NextResponse.json({ error: "Expected { offers: [] }" }, { status: 400 });
  }

  const offers = (body as { offers: unknown[] }).offers;
  if (offers.length === 0 || offers.length > 50) {
    return NextResponse.json({ error: "Send between 1 and 50 offers per request" }, { status: 400 });
  }

  const invalidIndex = offers.findIndex((offer) => !validateOffer(offer));
  if (invalidIndex !== -1) {
    return NextResponse.json(
      { error: "Invalid offer data", offer_index: invalidIndex },
      { status: 400 }
    );
  }

  const db = createServerSupabase();
  if (!db) {
    return NextResponse.json({ error: "Supabase server credentials not configured" }, { status: 503 });
  }

  let insertedOrUpdated = 0;
  let historyEntries = 0;
  const verifiedAt = new Date().toISOString();

  for (const rawOffer of offers as IncomingOffer[]) {
    const offer = {
      source_key: rawOffer.source_key.trim(),
      title: rawOffer.title.trim(),
      category: rawOffer.category.trim(),
      image_url: rawOffer.image_url ?? null,
      store: rawOffer.store.trim(),
      seller: rawOffer.seller.trim(),
      price_cash: rawOffer.price_cash ?? null,
      price_card: rawOffer.price_card,
      installments: rawOffer.installments ?? null,
      installment_value: rawOffer.installment_value ?? null,
      shipping: rawOffer.shipping ?? null,
      condition: rawOffer.condition ?? "new",
      product_url: rawOffer.product_url,
      verified_at: verifiedAt,
    };

    const { data: previous, error: lookupError } = await db
      .from("offers")
      .select("id, price_card")
      .eq("source_key", offer.source_key)
      .maybeSingle();

    if (lookupError) {
      console.error("Offer lookup failed:", lookupError.message);
      return NextResponse.json({ error: "Could not check existing offer" }, { status: 500 });
    }

    const { data: saved, error: upsertError } = await db
      .from("offers")
      .upsert(offer, { onConflict: "source_key" })
      .select("id, price_card")
      .single();

    if (upsertError || !saved) {
      console.error("Offer upsert failed:", upsertError?.message);
      return NextResponse.json({ error: "Could not save offer" }, { status: 500 });
    }

    insertedOrUpdated += 1;

    if (!previous || Number(previous.price_card) !== Number(saved.price_card)) {
      const { error: historyError } = await db.from("price_history").insert({
        offer_id: saved.id,
        price_card: saved.price_card,
        captured_at: verifiedAt,
      });

      if (historyError) {
        console.error("Price history insert failed:", historyError.message);
        return NextResponse.json(
          { error: "Offer saved, but price history could not be recorded" },
          { status: 500 }
        );
      }
      historyEntries += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    inserted_or_updated: insertedOrUpdated,
    history_entries_created: historyEntries,
  });
}
