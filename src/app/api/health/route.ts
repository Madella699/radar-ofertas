import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = createServerSupabase();

  if (!db) {
    return NextResponse.json(
      { ok: false, database: "not_configured" },
      { status: 503 }
    );
  }

  const { error } = await db.from("offers").select("id").limit(1);

  if (error) {
    console.error("Supabase health check failed:", error.message);
    return NextResponse.json(
      { ok: false, database: "unavailable" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    database: "connected"
  });
}
