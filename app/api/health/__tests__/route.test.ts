import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { createSupabaseServerClient } from "@/utils/supabase/server";

vi.mock("@/utils/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const createSupabaseServerClientMock = vi.mocked(createSupabaseServerClient);

function createSupabaseStub(error: unknown) {
  const rpc = vi.fn().mockResolvedValue({ error });

  return {
    client: { rpc },
    rpc,
  };
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when database is reachable", async () => {
    const supabase = createSupabaseStub(null);
    createSupabaseServerClientMock.mockReturnValueOnce(supabase.client as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body.error).toBeUndefined();
    expect(supabase.rpc).toHaveBeenCalledWith("app_health");
  });

  it("returns degraded when query fails", async () => {
    const supabase = createSupabaseStub({ message: "query failed" });
    createSupabaseServerClientMock.mockReturnValueOnce(supabase.client as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
    expect(body.error).toBe("Database connectivity check failed");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("returns degraded when client creation throws", async () => {
    createSupabaseServerClientMock.mockRejectedValueOnce(new Error("missing env"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
    expect(body.error).toBe("Database connectivity check failed");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("returns degraded when query execution throws", async () => {
    const rpc = vi.fn().mockRejectedValueOnce(new Error("boom"));
    createSupabaseServerClientMock.mockReturnValueOnce({ rpc } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
    expect(body.error).toBe("Database connectivity check failed");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });
});
