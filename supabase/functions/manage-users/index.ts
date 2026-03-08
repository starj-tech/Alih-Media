import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify the caller is an admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const callerId = claimsData.claims.sub;

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if caller is admin
    const { data: isAdmin } = await adminClient.rpc('is_admin', { _user_id: callerId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result: any = {};

    switch (action) {
      case 'create': {
        const { name, email, password, role } = params;
        if (!name || !email || !password) {
          return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Create auth user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Update role if not default 'user'
        if (role && role !== 'user' && newUser.user) {
          await adminClient.from('user_roles').update({ role }).eq('user_id', newUser.user.id);
        }

        result = { success: true, id: newUser.user?.id };
        break;
      }

      case 'update': {
        const { userId, name, role, noTelepon, pengguna, namaInstansi, password: newPassword } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Update profile
        const profileUpdates: Record<string, any> = {};
        if (name !== undefined) profileUpdates.name = name;
        if (noTelepon !== undefined) profileUpdates.no_telepon = noTelepon;
        if (pengguna !== undefined) profileUpdates.pengguna = pengguna;
        if (namaInstansi !== undefined) profileUpdates.nama_instansi = namaInstansi;

        if (Object.keys(profileUpdates).length > 0) {
          await adminClient.from('profiles').update(profileUpdates).eq('user_id', userId);
        }

        // Update role
        if (role) {
          await adminClient.from('user_roles').update({ role }).eq('user_id', userId);
        }

        // Update password
        if (newPassword) {
          await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
        }

        result = { success: true };
        break;
      }

      case 'delete': {
        const { userId } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Delete auth user (cascade will handle profiles and roles)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        result = { success: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
