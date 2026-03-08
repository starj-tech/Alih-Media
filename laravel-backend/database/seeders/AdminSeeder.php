<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@bpn.go.id',
            'password' => 'admin123', // GANTI PASSWORD INI!
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

        $this->command->info('Super Admin created: admin@bpn.go.id / admin123');
        $this->command->warn('⚠️ GANTI PASSWORD SEGERA setelah login pertama!');
    }
}
