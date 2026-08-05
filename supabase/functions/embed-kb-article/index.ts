 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { resilientFetch } from "../_shared/resilience.ts";
 
 serve(async (req) => {
   const cors = buildCorsHeaders(req);
   if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
 
   const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
   if (!LOVABLE_API_KEY) return new Response('LOVABLE_API_KEY missing', { status: 500 });
 
   const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   );
 
   try {
     const body = await req.json();
     const { record, text } = body;
 
     // Suporte a dois modos: trigger (record) ou busca direta (text)
     const textToEmbed = text || (record ? `${record.title}\n\n${record.excerpt || ''}\n\n${record.content}` : null);
 
     if (!textToEmbed) {
       return new Response('Missing input', { status: 400 });
     }
 
     // 1. Gerar embedding via Lovable AI Gateway
    const embedResp = await resilientFetch(
      'lovable-ai:embeddings',
      'https://ai.gateway.lovable.dev/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-004',
          input: textToEmbed
        })
      },
      { retry: { retries: 2, baseMs: 400 }, breaker: { failureThreshold: 5, openDurationMs: 30_000 } },
    );

    if (!embedResp.ok) throw new Error(`Gateway error: ${await embedResp.text()}`);
     const { data } = await embedResp.json();
     const embedding = data[0].embedding;
 
     // 2. Se for trigger, atualizar o banco. Se for busca, apenas retornar.
     if (record?.id) {
       const { error: updateError } = await supabase
         .from('kb_articles')
         .update({ embedding })
         .eq('id', record.id);
       if (updateError) throw updateError;
     }
 
     return new Response(JSON.stringify({ success: true, embedding }), { 
       headers: { ...cors, 'Content-Type': 'application/json' } 
     });
   } catch (error) {
     console.error('embed-kb-article error:', error);
     return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
   }
 });