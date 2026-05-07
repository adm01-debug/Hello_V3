 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { buildCorsHeaders } from "../_shared/cors.ts";
 
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
     const { record } = await req.json(); // Webhook trigger: record contendo o artigo
     if (!record || !record.id || !record.title || !record.content) {
       return new Response('Invalid record', { status: 400 });
     }
 
     // 1. Gerar embedding via Lovable AI Gateway (usando text-embedding-004 do Gemini como exemplo compatível)
     const textToEmbed = `${record.title}\n\n${record.excerpt || ''}\n\n${record.content}`;
     
     const embedResp = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
       method: 'POST',
       headers: { 
         'Authorization': `Bearer ${LOVABLE_API_KEY}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({
         model: 'text-embedding-004',
         input: textToEmbed
       })
     });
 
     if (!embedResp.ok) throw new Error(`Gateway error: ${await embedResp.text()}`);
     const { data } = await embedResp.json();
     const embedding = data[0].embedding;
 
     // 2. Atualizar artigo com o vetor
     const { error: updateError } = await supabase
       .from('kb_articles')
       .update({ embedding })
       .eq('id', record.id);
 
     if (updateError) throw updateError;
 
     return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
   } catch (error) {
     console.error('embed-kb-article error:', error);
     return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
   }
 });