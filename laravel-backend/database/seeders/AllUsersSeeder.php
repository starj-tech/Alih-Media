<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AllUsersSeeder extends Seeder
{
    /**
     * Seed semua akun pengguna sistem.
     * 
     * Jalankan: php artisan db:seed --class=AllUsersSeeder
     * Atau via browser: https://domain.com/seed-users.php?key=bogor2seed
     */
    public function run()
    {
        $users = [
            // Super Admin
            [
                'name' => 'Abdurrohman Muthi',
                'email' => 'abdurrohmanmuthi@gmail.com',
                'password' => '27oktober',
                'role' => 'super_admin',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            [
                'name' => 'Koordinator Sub',
                'email' => 'koorsub@gmail.com',
                'password' => '12345678',
                'role' => 'super_admin',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            // Super User
            [
                'name' => 'Lestari Kurnia',
                'email' => 'lestari@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'super_user',
                'no_telepon' => '081290218262',
                'pengguna' => 'PT/Badan Hukum',
                'nama_instansi' => 'PT. PENDAFTARAN, Tbk',
            ],
            // Admin Arsip BT/SU
            [
                'name' => 'Ergi',
                'email' => 'Ergi@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'admin_arsip',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            // Admin Validasi SU & Bidang
            [
                'name' => 'Ikhsan',
                'email' => 'ikhsan@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'admin_validasi_su',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            [
                'name' => 'Putri',
                'email' => 'putri@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'admin_validasi_su',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            // Admin Validasi BT
            [
                'name' => 'Farhan',
                'email' => 'farhan@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'admin_validasi_bt',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
            [
                'name' => 'Asep',
                'email' => 'asep@atrbpn.go.id',
                'password' => '12345678',
                'role' => 'admin_validasi_bt',
                'no_telepon' => '',
                'pengguna' => 'Perorangan',
                'nama_instansi' => null,
            ],
        ];

        foreach ($users as $userData) {
            $this->createOrUpdateUser($userData);
        }

        $this->command->info('✅ Semua akun berhasil disinkronkan!');
    }

    private function createOrUpdateUser(array $data)
    {
        $user = User::where('email', $data['email'])->first();

        if ($user) {
            // Update password - use direct DB to avoid double-hashing via mutator
            DB::table('users')->where('id', $user->id)->update([
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $this->command->info("🔄 Updated: {$data['email']}");
        } else {
            // Create new - mutator will hash password
            $user = new User();
            $user->name = $data['name'];
            $user->email = $data['email'];
            $user->email_verified_at = now();
            // Use direct DB insert to control hashing
            $user->save();
            DB::table('users')->where('id', $user->id)->update([
                'password' => Hash::make($data['password']),
            ]);
            $this->command->info("✅ Created: {$data['email']}");
        }

        // Upsert profile
        Profile::updateOrCreate(
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
        UserRole::updateOrCreate(
            ['user_id' => $user->id],
            ['role' => $data['role']]
        );
    }
}
