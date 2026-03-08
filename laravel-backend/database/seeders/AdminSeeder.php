<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Seed Super Admin pertama
     * 
     * Jalankan: php artisan db:seed --class=AdminSeeder
     * 
     * ⚠️ GANTI PASSWORD SEGERA setelah login pertama!
     */
    public function run(): void
    {
        // Cek apakah admin sudah ada
        $existing = User::where('email', 'admin@bpn.go.id')->first();
        if ($existing) {
            $this->command->warn('Admin sudah ada, skip.');
            return;
        }

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@bpn.go.id',
            'password' => 'admin123', // ⚠️ GANTI SEGERA!
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $admin->id,
            'name' => 'Super Admin',
            'email' => 'admin@bpn.go.id',
            'no_telepon' => '',
            'pengguna' => 'Perorangan',
        ]);

        UserRole::create([
            'user_id' => $admin->id,
            'role' => 'super_admin',
        ]);

        $this->command->info('✅ Super Admin created:');
        $this->command->info('   Email: admin@bpn.go.id');
        $this->command->info('   Password: admin123');
        $this->command->warn('⚠️  GANTI PASSWORD SEGERA setelah login pertama!');
    }
}
