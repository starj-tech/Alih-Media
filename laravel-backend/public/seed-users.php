<?php
/**
 * ⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!
 * 
 * Seed/sync semua akun pengguna via browser.
 * Akses: https://api-alihmedia.kantahkabbogor.id/seed-users.php?key=bogor2seed
 */

if (($_GET['key'] ?? '') !== 'bogor2seed') {
    http_response_code(404);
    echo '404 Not Found';
    exit;
}

echo "<pre>\n=== Seed All Users ===\n\n";

$baseDir = dirname(__DIR__);

try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $users = [
        ['name' => 'Abdurrohman Muthi', 'email' => 'abdurrohmanmuthi@gmail.com', 'password' => '27oktober', 'role' => 'super_admin', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Koordinator Sub', 'email' => 'koorsub@gmail.com', 'password' => '12345678', 'role' => 'super_admin', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Lestari Kurnia', 'email' => 'lestari@atrbpn.go.id', 'password' => '12345678', 'role' => 'super_user', 'no_telepon' => '081290218262', 'pengguna' => 'PT/Badan Hukum', 'nama_instansi' => 'PT. PENDAFTARAN, Tbk'],
        ['name' => 'Ergi', 'email' => 'Ergi@atrbpn.go.id', 'password' => '12345678', 'role' => 'admin_arsip', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Ikhsan', 'email' => 'ikhsan@atrbpn.go.id', 'password' => '12345678', 'role' => 'admin_validasi_su', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Putri', 'email' => 'putri@atrbpn.go.id', 'password' => '12345678', 'role' => 'admin_validasi_su', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Farhan', 'email' => 'farhan@atrbpn.go.id', 'password' => '12345678', 'role' => 'admin_validasi_bt', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
        ['name' => 'Asep', 'email' => 'asep@atrbpn.go.id', 'password' => '12345678', 'role' => 'admin_validasi_bt', 'no_telepon' => '', 'pengguna' => 'Perorangan', 'nama_instansi' => null],
    ];

    foreach ($users as $data) {
        $user = App\Models\User::where('email', $data['email'])->first();

        if ($user) {
            // Direct DB update to avoid double-hashing via mutator
            \DB::table('users')->where('id', $user->id)->update([
                'password' => Illuminate\Support\Facades\Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            echo "🔄 Updated: {$data['email']}\n";
        } else {
            // Create user - use direct DB insert to control password hashing
            $userId = \DB::table('users')->insertGetId([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Illuminate\Support\Facades\Hash::make($data['password']),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $user = App\Models\User::find($userId);
            echo "✅ Created: {$data['email']}\n";
        }

        // Upsert profile
        App\Models\Profile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $data['name'],
                'email' => $data['email'],
                'no_telepon' => $data['no_telepon'],
                'pengguna' => $data['pengguna'],
                'nama_instansi' => $data['nama_instansi'],
            ]
        );

        // Upsert role
        App\Models\UserRole::updateOrCreate(
            ['user_id' => $user->id],
            ['role' => $data['role']]
        );

        // Verify password works
        $freshUser = App\Models\User::where('email', $data['email'])->first();
        if (Illuminate\Support\Facades\Hash::check($data['password'], $freshUser->password)) {
            echo "   ✅ Password verified OK\n";
        } else {
            echo "   ❌ Password verification FAILED — fixing...\n";
            \DB::table('users')->where('id', $freshUser->id)->update([
                'password' => Illuminate\Support\Facades\Hash::make($data['password']),
            ]);
            $freshUser2 = App\Models\User::where('email', $data['email'])->first();
            if (Illuminate\Support\Facades\Hash::check($data['password'], $freshUser2->password)) {
                echo "   ✅ Fixed! Password now verified OK\n";
            } else {
                echo "   ❌ STILL FAILED — possible double-hash issue in User model\n";
            }
        }
    }

    echo "\n✅ Semua akun berhasil disinkronkan!\n";
    echo "\n⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "❌ Fatal: " . $e->getMessage() . "\n";
}

echo "</pre>";
