 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const TRACE_HEADER = 'x-request-id';
 const TRACE_OP_HEADER = 'x-trace-operation';
import { buildCorsHeaders } from "../_shared/cors.ts";


 export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

   const start = performance.now();
   const traceId = req.headers.get(TRACE_HEADER);
   const operation = req.headers.get(TRACE_OP_HEADER);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey, {
       auth: { persistSession: false, autoRefreshToken: false }
     });

    // DB check
     // DB check com timeout agressivo de 3s
     const dbController = new AbortController();
     const dbTimeout = setTimeout(() => dbController.abort(), 3000);
 
     const { error: dbError } = await supabase
       .from("agents")
       .select("id")
       .limit(1)
       .abortSignal(dbController.signal);
     
     clearTimeout(dbTimeout);

    const dbHealthy = !dbError;

     const latency = Math.round(performance.now() - start);
     const response = {
       status: dbHealthy ? "healthy" : "degraded",
       timestamp: new Date().toISOString(),
       trace_id: traceId,
       operation: operation,
       checks: {
         database: { status: dbHealthy ? "ok" : "error", error: dbError?.message },
         runtime: { status: "ok", version: Deno.version.deno },
       },
       latency_ms: latency,
     };

     return new Response(JSON.stringify(response), {
       status: dbHealthy ? 200 : 503,
       headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
     });
   } catch (err) {
     const latency = Math.round(performance.now() - start);
     return new Response(
       JSON.stringify({
         status: "error",
         timestamp: new Date().toISOString(),
         trace_id: traceId,
         error: err instanceof Error ? err.message : String(err),
         latency_ms: latency,
       }),
       {
         status: 500,
         headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
       }
     );
   }
 };
 
 if (import.meta.main) {
   Deno.serve(handler);
 }
