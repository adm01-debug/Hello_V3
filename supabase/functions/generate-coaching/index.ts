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
    const { agentId } = await req.json();
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    console.log('Generating coaching recommendations for agent:', agentId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    console.log('Found agent:', agent.name);

    // Fetch agent's call sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('agent_name', agent.name)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Fetch call summaries
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: summaries } = await supabase
      .from('call_summaries')
      .select('*')
      .in('call_session_id', sessionIds);

    // Fetch agent goals
    const { data: goals } = await supabase
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

    console.log('Calculated metrics:', metrics);

    // Use Lovable AI (Gemini) for analysis
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
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
}

Baseie as recomendações nas áreas que precisam de melhoria. Se as métricas estiverem boas, sugira formas de manter ou melhorar ainda mais.`;

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate AI recommendations');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let recommendations;
    try {
      const content = aiData.choices[0].message.content;
      recommendations = JSON.parse(content).recommendations;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback recommendations
      recommendations = [
        {
          category: 'efficiency',
          priority: 'medium',
          title: 'Otimizar tempo de atendimento',
          description: 'Baseado nas métricas atuais, há oportunidade de melhorar a eficiência no atendimento.',
          action_items: ['Revisar scripts de atendimento', 'Praticar resoluções rápidas', 'Usar templates de resposta']
        }
      ];
    }

    // Save recommendations to database
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const { data: saved, error: saveError } = await supabase
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

      if (saveError) {
        console.error('Error saving recommendation:', saveError);
      } else {
        savedRecommendations.push(saved);
      }
    }

    console.log('Saved', savedRecommendations.length, 'recommendations');

    return new Response(JSON.stringify({ 
      success: true, 
      recommendations: savedRecommendations,
      metrics 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-coaching function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
