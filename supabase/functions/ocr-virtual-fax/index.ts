import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: buildCorsHeaders(req) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const faxId = typeof body.fax_id === 'string' ? body.fax_id : null;
    if (!faxId) return new Response(JSON.stringify({ error: 'fax_id obrigatório' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    // Busca fax
    const { data: fax } = await admin.from('virtual_fax').select('id, file_path, subject').eq('id', faxId).single();
    if (!fax || !fax.file_path) {
      return new Response(JSON.stringify({ error: 'Fax ou arquivo não encontrado' }), { status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Baixa arquivo
    const { data: file, error: dlErr } = await admin.storage.from('virtual-fax-docs').download(fax.file_path);
    if (dlErr || !file) {
      return new Response(JSON.stringify({ error: 'Falha ao baixar arquivo', details: dlErr?.message }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Converte para base64
    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const mime = file.type || 'application/pdf';

    // Chama Lovable AI Gateway (Gemini vision)
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Extraia TODO o texto do documento fornecido em português. Preserve quebras de linha. Sem comentários.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Extraia texto integral. Assunto: ${fax.subject ?? 'sem assunto'}` },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      return new Response(JSON.stringify({ error: 'AI Gateway falhou', status: aiResp.status, details: err }), { status: aiResp.status, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const aiJson = await aiResp.json();
    const text: string = aiJson?.choices?.[0]?.message?.content ?? '';

    await admin.from('virtual_fax').update({
      ocr_text: text,
      ocr_confidence: text.length > 100 ? 0.92 : 0.55,
      ocr_completed_at: new Date().toISOString(),
    }).eq('id', faxId);

    return new Response(JSON.stringify({ fax_id: faxId, chars: text.length }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
