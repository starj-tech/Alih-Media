import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify caller is admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: caller } } = await supabase.auth.getUser(token);
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Check caller is admin
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', caller.id).single();
  if (!roleData || !['super_admin', 'admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt'].includes(roleData.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const body = await req.json();
  const { berkas_id, action } = body;

  if (!berkas_id || !action) {
    return new Response(JSON.stringify({ error: 'Missing berkas_id or action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Get IP server-side
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  // Prevent duplicate logs (same berkas, admin, action within 10 seconds)
  const { data: recentLog } = await supabase
    .from('validation_logs')
    .select('id')
    .eq('berkas_id', berkas_id)
    .eq('admin_id', caller.id)
    .eq('action', action)
    .gte('created_at', new Date(Date.now() - 10000).toISOString())
    .limit(1);

  if (recentLog && recentLog.length > 0) {
    return new Response(JSON.stringify({ success: true, deduplicated: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase.from('validation_logs').insert({
    berkas_id,
    admin_id: caller.id,
    action,
    ip_address: ip,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
