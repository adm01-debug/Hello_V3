import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildCorsHeaders } from "../_shared/cors.ts";


 export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const start = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // DB check
    const { error: dbError } = await supabase
      .from("agents")
      .select("id")
      .limit(1);

    const dbHealthy = !dbError;

    const response = {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Deno.osUptime?.() ?? null,
      checks: {
        database: { status: dbHealthy ? "ok" : "error", error: dbError?.message },
        runtime: { status: "ok", version: Deno.version.deno },
      },
      latency_ms: Date.now() - start,
    };

     return new Response(JSON.stringify(response), {
       status: dbHealthy ? 200 : 503,
       headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
     });
   } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: "error",
        timestamp: new Date().toISOString(),
        error: err.message,
        latency_ms: Date.now() - start,
      }),
      {
        status: 500,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
   }
 };
 
 Deno.serve(handler);
