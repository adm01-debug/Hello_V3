 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { buildCorsHeaders } from "../_shared/cors.ts";
 
 serve(async (req) => {
   const cors = buildCorsHeaders(req);
   if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
 
   const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   );
 
   try {
     // 1. Buscar itens pendentes ou falhos na fila
     const { data: queueItems, error: fetchError } = await supabase
       .from('crm_sync_queue')
       .select('*')
       .in('status', ['pending', 'failed'])
       .lte('next_retry_at', new Date().toISOString())
       .lt('attempts', 5)
       .order('created_at', { ascending: true })
       .limit(10);
 
     if (fetchError) throw fetchError;
     if (!queueItems || queueItems.length === 0) {
       return new Response(JSON.stringify({ message: 'Nada para sincronizar' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
     }
 
     const results = [];
 
     for (const item of queueItems) {
       // Marcar como processando
       await supabase.from('crm_sync_queue').update({ status: 'processing', attempts: item.attempts + 1 }).eq('id', item.id);
 
       try {
         // Tentar chamar a função do bitrix
         const { data, error: bitrixError } = await supabase.functions.invoke('bitrix-api', {
           body: { action: item.action, params: item.payload }
         });
 
         if (bitrixError || (data && !data.success)) {
           throw new Error(bitrixError?.message || data?.error || 'Erro desconhecido no Bitrix');
         }
 
         // Sucesso!
         await supabase.from('crm_sync_queue').update({ status: 'completed', last_error: null }).eq('id', item.id);
         results.push({ id: item.id, status: 'completed' });
       } catch (error) {
         // Falha - agendar retentativa com backoff exponencial
         const delay = Math.pow(2, item.attempts) * 60; // 2, 4, 8, 16, 32 minutos
         const nextRetry = new Date(Date.now() + delay * 1000).toISOString();
         
         await supabase.from('crm_sync_queue').update({
           status: 'failed',
           last_error: error.message,
           next_retry_at: nextRetry
         }).eq('id', item.id);
         
         results.push({ id: item.id, status: 'failed', error: error.message });
       }
     }
 
     return new Response(JSON.stringify({ results }), { headers: { ...cors, 'Content-Type': 'application/json' } });
   } catch (error) {
     console.error('sync-crm-queue error:', error);
     return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
   }
 });