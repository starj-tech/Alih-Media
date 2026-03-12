<?php
/**
 * ⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!
 * 
 * Seed data berkas sesuai data produksi.
 * Akses: https://api-alihmedia.kantahkabbogor.id/seed-berkas.php?key=bogor2seed
 * 
 * PENTING: Jalankan seed-users.php TERLEBIH DAHULU!
 */

if (($_GET['key'] ?? '') !== 'bogor2seed') {
    http_response_code(404);
    echo '404 Not Found';
    exit;
}

echo "<pre>\n=== Seed Berkas Data (dari Produksi) ===\n\n";

$baseDir = dirname(__DIR__);

try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    // Helper: get user ID by email
    function getUserId($email) {
        $user = App\Models\User::where('email', $email)->first();
        if (!$user) {
            echo "⚠️ User {$email} tidak ditemukan! Jalankan seed-users.php dulu.\n";
            return null;
        }
        return $user->id;
    }

    // Data berkas dari produksi (berdasarkan screenshot)
    $berkasData = [
        [
            'user_email' => 'loket3@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-06',
            'nama_pemegang_hak' => 'LOKET 3',
            'no_su_tahun' => '00012/2002',
            'no_hak' => '05541',
            'jenis_hak' => 'HM',
            'desa' => 'Gunung Putri',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '',
            'status' => 'Selesai',
        ],
        [
            'user_email' => 'userppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-04',
            'nama_pemegang_hak' => 'USER PPAT',
            'no_su_tahun' => '00000/2022',
            'no_hak' => '11222',
            'jenis_hak' => 'HGB',
            'desa' => 'Cibodas',
            'kecamatan' => 'Jonggol',
            'no_telepon' => '',
            'status' => 'Validasi SU & Bidang',
        ],
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-03',
            'nama_pemegang_hak' => 'Lestari Kurnia',
            'no_su_tahun' => '00011/2000',
            'no_hak' => '00042',
            'jenis_hak' => 'HGB',
            'desa' => 'Cileungsi Kidul',
            'kecamatan' => 'Cileungsi',
            'no_telepon' => '081290218262',
            'status' => 'Selesai',
        ],
        [
            'user_email' => 'ppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-02',
            'nama_pemegang_hak' => 'PPAT',
            'no_su_tahun' => '02000/2000',
            'no_hak' => '12345',
            'jenis_hak' => 'HGB',
            'desa' => 'Singajaya',
            'kecamatan' => 'Jonggol',
            'no_telepon' => '',
            'status' => 'Ditolak',
            'catatan_penolakan' => 'Photo KTP tidak jelas',
            'rejected_from_status' => 'Validasi SU & Bidang',
        ],
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-01',
            'nama_pemegang_hak' => 'Lestari Kurnia',
            'no_su_tahun' => '00110/2001',
            'no_hak' => '00011',
            'jenis_hak' => 'HGU',
            'desa' => 'Klapanunggal',
            'kecamatan' => 'Klapanunggal',
            'no_telepon' => '081290218262',
            'status' => 'Selesai',
        ],
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-02-28',
            'nama_pemegang_hak' => 'Lestari Kurnia',
            'no_su_tahun' => '12345/2009',
            'no_hak' => '22331',
            'jenis_hak' => 'HM',
            'desa' => 'Ciangsana',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '081290218262',
            'status' => 'Validasi BT',
        ],
    ];

    $created = 0;
    $skipped = 0;

    foreach ($berkasData as $data) {
        $userId = getUserId($data['user_email']);
        if (!$userId) {
            $skipped++;
            continue;
        }

        // Check if berkas already exists (by no_hak + no_su_tahun)
        $exists = App\Models\Berkas::where('no_hak', $data['no_hak'])
            ->where('no_su_tahun', $data['no_su_tahun'])
            ->first();

        if ($exists) {
            // Update status to match production
            $exists->update([
                'status' => $data['status'],
                'catatan_penolakan' => $data['catatan_penolakan'] ?? null,
                'rejected_from_status' => $data['rejected_from_status'] ?? null,
            ]);
            echo "🔄 Updated: {$data['nama_pemegang_hak']} - {$data['no_hak']} → {$data['status']}\n";
            continue;
        }

        $berkas = App\Models\Berkas::create([
            'user_id' => $userId,
            'tanggal_pengajuan' => $data['tanggal_pengajuan'],
            'nama_pemegang_hak' => $data['nama_pemegang_hak'],
            'no_su_tahun' => $data['no_su_tahun'],
            'no_hak' => $data['no_hak'],
            'jenis_hak' => $data['jenis_hak'],
            'desa' => $data['desa'],
            'kecamatan' => $data['kecamatan'],
            'no_telepon' => $data['no_telepon'] ?? '',
            'status' => $data['status'],
            'catatan_penolakan' => $data['catatan_penolakan'] ?? null,
            'rejected_from_status' => $data['rejected_from_status'] ?? null,
        ]);

        echo "✅ Created: {$data['nama_pemegang_hak']} - No.Hak {$data['no_hak']} ({$data['status']})\n";
        $created++;
    }

    // Seed validation logs for completed berkas
    echo "\n--- Seeding Validation Logs ---\n";
    
    $ergiId = getUserId('Ergi@atrbpn.go.id');
    $putriId = getUserId('putri@atrbpn.go.id');
    $ikhsanId = getUserId('ikhsan@atrbpn.go.id');
    $farhanId = getUserId('farhan@atrbpn.go.id');
    $asepId = getUserId('asep@atrbpn.go.id');
    $dzakiId = getUserId('dzaki@atrbpn.go.id');
    $gustiyawanId = getUserId('gustiyawan022@gmail.com');

    // Get all berkas and create appropriate validation logs
    $allBerkas = App\Models\Berkas::all();
    foreach ($allBerkas as $berkas) {
        $existingLogs = App\Models\ValidationLog::where('berkas_id', $berkas->id)->count();
        if ($existingLogs > 0) {
            echo "⏭️ Logs exist for: {$berkas->nama_pemegang_hak}\n";
            continue;
        }

        $baseTime = \Carbon\Carbon::parse($berkas->tanggal_pengajuan);

        // Proses → always has arsip verification
        if (in_array($berkas->status, ['Validasi SU & Bidang', 'Validasi BT', 'Selesai', 'Ditolak'])) {
            $arsipAdmin = $ergiId ?: $gustiyawanId;
            if ($arsipAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $arsipAdmin,
                    'action' => 'Validasi SU & Bidang',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(2),
                ]);
                echo "   📝 Arsip log for: {$berkas->nama_pemegang_hak}\n";
            }
        }

        // Validasi SU & Bidang
        if (in_array($berkas->status, ['Validasi BT', 'Selesai'])) {
            $suAdmin = $putriId ?: $ikhsanId;
            if ($suAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $suAdmin,
                    'action' => 'Validasi BT',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(4),
                ]);
                echo "   📝 Validasi SU log for: {$berkas->nama_pemegang_hak}\n";
            }
        }

        // Validasi BT → Selesai
        if ($berkas->status === 'Selesai') {
            $btAdmin = $asepId ?: $farhanId ?: $dzakiId;
            if ($btAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $btAdmin,
                    'action' => 'Selesai',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(6),
                ]);
                echo "   📝 Selesai log for: {$berkas->nama_pemegang_hak}\n";
            }
        }

        // Ditolak
        if ($berkas->status === 'Ditolak') {
            $rejectAdmin = $putriId ?: $ikhsanId;
            if ($rejectAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $rejectAdmin,
                    'action' => 'Ditolak',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(3),
                ]);
                echo "   📝 Ditolak log for: {$berkas->nama_pemegang_hak}\n";
            }
        }
    }

    echo "\n✅ Berkas seed selesai! Created: {$created}, Skipped: {$skipped}\n";
    echo "\n⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "❌ Fatal: " . $e->getMessage() . "\n";
}

echo "</pre>";
