import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { daysOld = 30 } = await req.json();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    // Delete old transcriptions
    const { data: transcriptions, error: transError } = await supabase
      .from('transcriptions')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (transError) throw transError;
    deletedCount += transcriptions?.length || 0;

    // Delete old calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .delete()
      .lt('ended_at', cutoffDate.toISOString())
      .eq('status', 'completed')
      .select();

    if (callsError) throw callsError;
    deletedCount += calls?.length || 0;

    // Vacuum database (admin only)
    // This would require direct database connection

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedRecords: deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        message: `Cleaned up ${deletedCount} old records`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
