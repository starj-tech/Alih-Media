<?php
/**
 * ⚠️ ONE-TIME USE ONLY — HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!
 * 
 * Reset password admin via browser.
 * Akses: https://api-alihmedia.kantahkabbogor.id/reset-admin-password.php?key=bogor2reset
 */

if (($_GET['key'] ?? '') !== 'bogor2reset') {
    http_response_code(404);
    echo '404 Not Found';
    exit;
}

echo "<pre>\n=== Admin Password Reset ===\n\n";

$baseDir = dirname(__DIR__);

try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $email = 'admin@bpn.go.id';
    $newPassword = 'admin123';

    $user = App\Models\User::where('email', $email)->first();
    
    if (!$user) {
        echo "❌ User {$email} tidak ditemukan di database.\n";
        echo "\nMencoba membuat user admin baru...\n";
        
        $user = new App\Models\User();
        $user->name = 'Super Admin';
        $user->email = $email;
        $user->password = $newPassword; // auto-hashed via mutator
        $user->email_verified_at = now();
        $user->save();
        
        App\Models\Profile::create([
            'user_id' => $user->id,
            'name' => 'Super Admin',
            'email' => $email,
            'no_telepon' => '',
            'pengguna' => 'Perorangan',
        ]);
        
        App\Models\UserRole::create([
            'user_id' => $user->id,
            'role' => 'super_admin',
        ]);
        
        echo "✅ User admin baru dibuat!\n";
    } else {
        // Force update password - bypass mutator to avoid double-hashing
        $user->forceFill([
            'password' => Illuminate\Support\Facades\Hash::make($newPassword),
        ])->save();
        
        echo "✅ Password di-reset untuk: {$email}\n";
        
        // Ensure role exists
        $role = App\Models\UserRole::where('user_id', $user->id)->first();
        if (!$role) {
            App\Models\UserRole::create(['user_id' => $user->id, 'role' => 'super_admin']);
            echo "✅ Role super_admin ditambahkan\n";
        } else {
            echo "ℹ️  Role saat ini: {$role->role}\n";
        }
    }
    
    echo "\n--- Kredensial ---\n";
    echo "Email: {$email}\n";
    echo "Password: {$newPassword}\n";
    
    // Test login verification
    $testUser = App\Models\User::where('email', $email)->first();
    if (Illuminate\Support\Facades\Hash::check($newPassword, $testUser->password)) {
        echo "\n✅ Verifikasi hash: PASSWORD COCOK\n";
    } else {
        echo "\n❌ Verifikasi hash: PASSWORD TIDAK COCOK — kemungkinan double-hash!\n";
        // Fix: write raw hash directly
        $raw = Illuminate\Support\Facades\Hash::make($newPassword);
        \DB::table('users')->where('id', $testUser->id)->update(['password' => $raw]);
        echo "🔧 Diperbaiki dengan direct DB update\n";
        
        $testUser2 = App\Models\User::where('email', $email)->first();
        if (Illuminate\Support\Facades\Hash::check($newPassword, $testUser2->password)) {
            echo "✅ Verifikasi ulang: PASSWORD SEKARANG COCOK\n";
        }
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "❌ Fatal: " . $e->getMessage() . "\n";
}

echo "\n⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!\n";
echo "</pre>";
