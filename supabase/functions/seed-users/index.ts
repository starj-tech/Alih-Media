import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const users = [
    { email: 'abdurrohmanmuthi@gmail.com', password: '27oktober', name: 'Abdurrohman Muthi', role: 'super_admin' },
    { email: 'koorsub@gmail.com', password: '12345678', name: 'Koorsub', role: 'super_admin' },
    { email: 'Ergi@atrbpn.go.id', password: '12345678', name: 'Ergi', role: 'admin_arsip' },
    { email: 'ikhsan@atrbpn.go.id', password: '12345678', name: 'Ikhsan', role: 'admin_validasi_su' },
    { email: 'putri@atrbpn.go.id', password: '12345678', name: 'Putri', role: 'admin_validasi_su' },
    { email: 'farhan@atrbpn.go.id', password: '12345678', name: 'Farhan', role: 'admin_validasi_bt' },
    { email: 'asep@atrbpn.go.id', password: '12345678', name: 'Asep', role: 'admin_validasi_bt' },
    {
      email: 'lestari@atrbpn.go.id',
      password: '12345678',
      name: 'Lestari Kurnia',
      role: 'super_user',
      extra: { no_telepon: '081290218262', pengguna: 'PT/Badan Hukum', nama_instansi: 'PT. PENDAFTARAN, Tbk' },
    },
  ];

  const results = [];

  for (const u of users) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((eu: any) => eu.email?.toLowerCase() === u.email.toLowerCase());
    if (found) {
      // Update role if user exists
      await supabase.from('user_roles').update({ role: u.role }).eq('user_id', found.id);
      results.push({ email: u.email, status: 'exists_updated_role', id: found.id });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, ...(u.extra || {}) },
    });

    if (error) {
      results.push({ email: u.email, error: error.message });
      continue;
    }

    // Wait for trigger to create profile and default role
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update role to the correct one
    if (u.role !== 'user') {
      await supabase.from('user_roles').update({ role: u.role }).eq('user_id', data.user.id);
    }

    results.push({ email: u.email, success: true, id: data.user.id });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
