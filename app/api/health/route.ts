import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const HEALTH_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const DATABASE_ERROR_MESSAGE = "Database connectivity check failed";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("chat_messages")
      .select("id", { head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          checks: { database: "error" },
          error: DATABASE_ERROR_MESSAGE,
          timestamp,
        },
        {
          status: 503,
          headers: HEALTH_HEADERS,
        }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        checks: { database: "ok" },
        timestamp,
      },
      {
        headers: HEALTH_HEADERS,
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        checks: { database: "error" },
        error: DATABASE_ERROR_MESSAGE,
        timestamp,
      },
      {
        status: 503,
        headers: HEALTH_HEADERS,
      }
    );
  }
}
