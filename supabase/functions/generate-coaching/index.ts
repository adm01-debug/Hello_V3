import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is supervisor or admin
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { agentId } = body;
    
    if (!agentId || typeof agentId !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating coaching for agent:', agentId, 'by user:', user.id);

    // Fetch agent info
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agente não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch agent's call sessions
    const { data: sessions } = await supabaseAdmin
      .from('call_sessions')
      .select('*')
      .eq('agent_name', agent.name)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch call summaries
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: summaries } = await supabaseAdmin
      .from('call_summaries')
      .select('*')
      .in('call_session_id', sessionIds);

    // Fetch agent goals
    const { data: goals } = await supabaseAdmin
      .from('agent_goals')
      .select('*')
      .eq('agent_name', agent.name)
      .maybeSingle();

    // Calculate metrics
    const totalCalls = sessions?.length || 0;
    const completedCalls = sessions?.filter(s => s.status === 'completed').length || 0;
    const avgDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / (totalCalls || 1);
    const avgSatisfaction = summaries?.reduce((sum, s) => sum + (s.customer_satisfaction || 0), 0) / (summaries?.length || 1);
    const avgPerformance = summaries?.reduce((sum, s) => sum + (s.agent_performance_score || 0), 0) / (summaries?.length || 1);
    const holdTime = sessions?.reduce((sum, s) => sum + (s.hold_time_seconds || 0), 0) || 0;
    const avgHoldPerCall = holdTime / (totalCalls || 1);

    const metrics = {
      totalCalls,
      completedCalls,
      avgDuration: Math.round(avgDuration),
      avgSatisfaction: avgSatisfaction.toFixed(1),
      avgPerformance: avgPerformance.toFixed(1),
      avgHoldPerCall: Math.round(avgHoldPerCall),
      goals: goals || { calls_target: 50, satisfaction_target: 8, performance_target: 8 }
    };

    // Use Lovable AI for analysis
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const prompt = `Você é um coach de call center especializado. Analise as métricas deste agente e gere recomendações de coaching personalizadas em português.

AGENTE: ${agent.name}
DEPARTAMENTO: ${agent.department || 'Geral'}

MÉTRICAS:
- Total de chamadas: ${metrics.totalCalls}
- Chamadas completadas: ${metrics.completedCalls}
- Duração média: ${metrics.avgDuration} segundos
- Satisfação do cliente (0-10): ${metrics.avgSatisfaction}
- Score de performance (0-10): ${metrics.avgPerformance}
- Tempo médio em espera por chamada: ${metrics.avgHoldPerCall} segundos

METAS:
- Meta de chamadas: ${metrics.goals.calls_target}
- Meta de satisfação: ${metrics.goals.satisfaction_target}
- Meta de performance: ${metrics.goals.performance_target}

Gere exatamente 3 recomendações de coaching no formato JSON:
{
  "recommendations": [
    {
      "category": "communication|efficiency|satisfaction|skills|goals",
      "priority": "high|medium|low",
      "title": "título curto e objetivo",
      "description": "explicação detalhada da recomendação",
      "action_items": ["ação 1", "ação 2", "ação 3"]
    }
  ]
}`;

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status);
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let recommendations;
    try {
      const content = aiData.choices[0].message.content;
      recommendations = JSON.parse(content).recommendations;
    } catch {
      recommendations = [{
        category: 'efficiency',
        priority: 'medium',
        title: 'Otimizar tempo de atendimento',
        description: 'Há oportunidade de melhorar a eficiência no atendimento.',
        action_items: ['Revisar scripts', 'Praticar resoluções rápidas', 'Usar templates']
      }];
    }

    // Save recommendations
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const { data: saved, error: saveError } = await supabaseAdmin
        .from('coaching_recommendations')
        .insert({
          agent_id: agentId,
          category: rec.category,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          action_items: rec.action_items,
          metrics_snapshot: metrics,
          status: 'pending'
        })
        .select()
        .single();

      if (!saveError && saved) {
        savedRecommendations.push(saved);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      recommendations: savedRecommendations,
      metrics 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-coaching function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
