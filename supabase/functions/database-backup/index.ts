import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;

    // Export data
    const tables = ['profiles', 'contacts', 'calls', 'transcriptions'];
    const backup: any = {};

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`Error backing up ${table}:`, error);
        continue;
      }
      
      backup[table] = data;
    }

    // Store backup
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(`${backupName}.json`, JSON.stringify(backup, null, 2), {
        contentType: 'application/json',
      });

    if (uploadError) throw uploadError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        backup: backupName,
        tables: Object.keys(backup),
        records: Object.values(backup).reduce((sum: number, arr: any) => sum + arr.length, 0)
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
