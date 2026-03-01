import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  // Check caller is super_admin or admin
  const { data: callerRole } = await supabase.from('user_roles').select('role').eq('user_id', caller.id).single();
  if (!callerRole || !['super_admin', 'admin'].includes(callerRole.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'create') {
      const { email, password, name, role } = body;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (error) throw error;

      // Wait for trigger
      await new Promise(r => setTimeout(r, 500));

      if (role && role !== 'user') {
        await supabase.from('user_roles').update({ role }).eq('user_id', data.user.id);
      }

      return new Response(JSON.stringify({ success: true, id: data.user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const { userId, name, role, noTelepon, pengguna, namaInstansi, password } = body;

      // Update profile fields
      const profileUpdates: Record<string, any> = {};
      if (name !== undefined) profileUpdates.name = name;
      if (noTelepon !== undefined) profileUpdates.no_telepon = noTelepon;
      if (pengguna !== undefined) profileUpdates.pengguna = pengguna;
      if (namaInstansi !== undefined) profileUpdates.nama_instansi = namaInstansi;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('profiles').update(profileUpdates).eq('user_id', userId);
      }

      if (role) {
        await supabase.from('user_roles').update({ role }).eq('user_id', userId);
      }

      // Reset password if provided
      if (password) {
        const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password });
        if (pwError) throw pwError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { userId } = body;
      
      if (userId === caller.id) {
        throw new Error('Tidak dapat menghapus akun sendiri');
      }

      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
