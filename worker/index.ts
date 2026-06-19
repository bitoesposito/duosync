import { handleAppointments } from "./appointments";
import { handleUsers } from "./users";
import type { Env } from "./env";

/**
 * Worker entry. `run_worker_first = ["/api/*"]` (wrangler.toml) means this only
 * runs for /api/* — everything else is served from static assets with SPA fallback.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/users") return handleUsers(request, env);
    if (pathname === "/api/appointments") return handleAppointments(request, env);
    return new Response(JSON.stringify({ error: "not-found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;
