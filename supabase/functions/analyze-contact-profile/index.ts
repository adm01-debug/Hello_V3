import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactInteraction {
  interaction_type: string;
  direction: string | null;
  summary: string | null;
  transcript: string | null;
  sentiment: string | null;
  topics: string[] | null;
  duration_seconds: number | null;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
  position: string | null;
  notes: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactId } = await req.json();
    
    if (!contactId) {
      return new Response(
        JSON.stringify({ error: 'contactId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, company, position, notes')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      console.error('Error fetching contact:', contactError);
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all interactions for this contact
    const { data: interactions, error: interactionsError } = await supabase
      .from('contact_interactions')
      .select('interaction_type, direction, summary, transcript, sentiment, topics, duration_seconds, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      throw new Error('Erro ao buscar interações');
    }

    if (!interactions || interactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Sem histórico suficiente',
          message: 'O contato precisa ter pelo menos uma interação registrada para análise.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI analysis
    const interactionsSummary = interactions.map((i: ContactInteraction, idx: number) => {
      const parts = [];
      parts.push(`Interação ${idx + 1} (${new Date(i.created_at).toLocaleDateString('pt-BR')}):`);
      parts.push(`- Tipo: ${i.interaction_type}`);
      if (i.direction) parts.push(`- Direção: ${i.direction === 'inbound' ? 'Entrada' : 'Saída'}`);
      if (i.sentiment) parts.push(`- Sentimento: ${i.sentiment}`);
      if (i.topics && i.topics.length > 0) parts.push(`- Tópicos: ${i.topics.join(', ')}`);
      if (i.duration_seconds) parts.push(`- Duração: ${Math.floor(i.duration_seconds / 60)} minutos`);
      if (i.summary) parts.push(`- Resumo: ${i.summary}`);
      if (i.transcript) parts.push(`- Transcrição (resumida): ${i.transcript.substring(0, 500)}...`);
      return parts.join('\n');
    }).join('\n\n');

    const systemPrompt = `Você é um especialista em análise comportamental e perfil de clientes. Sua tarefa é analisar o histórico de interações de um cliente e gerar insights acionáveis sobre sua personalidade, preferências e padrões de comunicação.

Você deve retornar um JSON estruturado com a seguinte estrutura:
{
  "personality_traits": ["trait1", "trait2", "trait3"],
  "communication_style": "descrição do estilo de comunicação preferido",
  "preferred_contact_time": "melhor horário/momento para contato",
  "interests": ["interesse1", "interesse2"],
  "pain_points": ["problema1", "problema2"],
  "buying_signals": ["sinal1", "sinal2"],
  "relationship_status": "novo|em_desenvolvimento|estabelecido|vip",
  "engagement_level": "baixo|médio|alto",
  "sentiment_trend": "positivo|neutro|negativo|melhorando|piorando",
  "recommendations": ["recomendação1", "recomendação2", "recomendação3"],
  "summary": "resumo geral do perfil do cliente em 2-3 frases"
}

Seja específico e baseie suas conclusões nos dados fornecidos. Se não houver informação suficiente para algum campo, use "não identificado" ou deixe como array vazio.`;

    const userPrompt = `Analise o perfil do cliente abaixo:

**Cliente:** ${contact.name}
${contact.company ? `**Empresa:** ${contact.company}` : ''}
${contact.position ? `**Cargo:** ${contact.position}` : ''}
${contact.notes ? `**Notas:** ${contact.notes}` : ''}

**Histórico de Interações (${interactions.length} total):**
${interactionsSummary}

Gere uma análise completa do perfil deste cliente.`;

    console.log(`Analyzing contact ${contactId} with ${interactions.length} interactions`);

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Erro ao chamar API de IA');
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    // Parse JSON from response
    let profile;
    try {
      // Extract JSON from response (may be wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, content);
      // Create a basic profile from the text
      profile = {
        personality_traits: [],
        communication_style: 'não identificado',
        preferred_contact_time: 'não identificado',
        interests: [],
        pain_points: [],
        buying_signals: [],
        relationship_status: 'em_desenvolvimento',
        engagement_level: 'médio',
        sentiment_trend: 'neutro',
        recommendations: [],
        summary: content.substring(0, 500)
      };
    }

    // Update contact with personality insights
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        personality_insights: profile,
        preferences: {
          communication_style: profile.communication_style,
          preferred_contact_time: profile.preferred_contact_time,
          interests: profile.interests
        }
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      // Still return the profile even if update fails
    }

    console.log(`Profile analysis completed for contact ${contactId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile,
        interactions_analyzed: interactions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-contact-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
