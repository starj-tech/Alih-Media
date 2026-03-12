<?php
/**
 * ⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!
 * 
 * Seed data berkas lengkap dengan semua status.
 * Akses: https://api-alihmedia.kantahkabbogor.id/seed-berkas.php?key=bogor2seed
 * 
 * PENTING: Jalankan seed-users.php TERLEBIH DAHULU!
 */

if (($_GET['key'] ?? '') !== 'bogor2seed') {
    http_response_code(404);
    echo '404 Not Found';
    exit;
}

echo "<pre>\n=== Seed Berkas Data (Lengkap) ===\n\n";

$baseDir = dirname(__DIR__);

try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    function getUserId($email) {
        $user = App\Models\User::where('email', $email)->first();
        if (!$user) {
            echo "⚠️ User {$email} tidak ditemukan! Jalankan seed-users.php dulu.\n";
            return null;
        }
        return $user->id;
    }

    // === DATA BERKAS LENGKAP ===
    $berkasData = [
        // --- Status: Proses (baru masuk, belum diverifikasi arsip) ---
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-12',
            'nama_pemegang_hak' => 'Suherman Wijaya',
            'no_su_tahun' => '00234/2015',
            'no_hak' => '08821',
            'jenis_hak' => 'HM',
            'desa' => 'Bojong Kulur',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '081290218262',
            'status' => 'Proses',
        ],
        [
            'user_email' => 'ppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-11',
            'nama_pemegang_hak' => 'Ahmad Fauzi',
            'no_su_tahun' => '00078/2018',
            'no_hak' => '03345',
            'jenis_hak' => 'HGB',
            'desa' => 'Cileungsi',
            'kecamatan' => 'Cileungsi',
            'no_telepon' => '081234567890',
            'status' => 'Proses',
        ],
        [
            'user_email' => 'loket3@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-11',
            'nama_pemegang_hak' => 'Dewi Sartika',
            'no_su_tahun' => '00456/2020',
            'no_hak' => '07712',
            'jenis_hak' => 'HM',
            'desa' => 'Ciangsana',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '085678901234',
            'status' => 'Proses',
        ],
        [
            'user_email' => 'userppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-10',
            'nama_pemegang_hak' => 'Budi Santoso',
            'no_su_tahun' => '00912/2016',
            'no_hak' => '04456',
            'jenis_hak' => 'HP',
            'desa' => 'Nambo',
            'kecamatan' => 'Klapanunggal',
            'no_telepon' => '087812345678',
            'status' => 'Proses',
        ],
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-10',
            'nama_pemegang_hak' => 'Rina Marlina',
            'no_su_tahun' => '00567/2019',
            'no_hak' => '09901',
            'jenis_hak' => 'HM',
            'desa' => 'Tlajung Udik',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '081290218262',
            'status' => 'Proses',
        ],

        // --- Status: Validasi SU & Bidang ---
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
            'user_email' => 'ppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-08',
            'nama_pemegang_hak' => 'Hendra Gunawan',
            'no_su_tahun' => '00321/2017',
            'no_hak' => '06678',
            'jenis_hak' => 'HM',
            'desa' => 'Jonggol',
            'kecamatan' => 'Jonggol',
            'no_telepon' => '081345678901',
            'status' => 'Validasi SU & Bidang',
        ],
        [
            'user_email' => 'lestari@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-07',
            'nama_pemegang_hak' => 'Sri Mulyani',
            'no_su_tahun' => '00189/2014',
            'no_hak' => '05523',
            'jenis_hak' => 'HGB',
            'desa' => 'Sukamanah',
            'kecamatan' => 'Jonggol',
            'no_telepon' => '081290218262',
            'status' => 'Validasi SU & Bidang',
        ],

        // --- Status: Validasi BT ---
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
        [
            'user_email' => 'loket3@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-03-05',
            'nama_pemegang_hak' => 'Agus Prasetyo',
            'no_su_tahun' => '00654/2013',
            'no_hak' => '03891',
            'jenis_hak' => 'HM',
            'desa' => 'Cileungsi Kidul',
            'kecamatan' => 'Cileungsi',
            'no_telepon' => '089876543210',
            'status' => 'Validasi BT',
        ],

        // --- Status: Selesai ---
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
            'user_email' => 'ppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-02-25',
            'nama_pemegang_hak' => 'Yusuf Hidayat',
            'no_su_tahun' => '00890/2010',
            'no_hak' => '01234',
            'jenis_hak' => 'HM',
            'desa' => 'Sukamanah',
            'kecamatan' => 'Jonggol',
            'no_telepon' => '082345678901',
            'status' => 'Selesai',
        ],
        [
            'user_email' => 'userppat@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-02-20',
            'nama_pemegang_hak' => 'Ratna Dewi',
            'no_su_tahun' => '00445/2012',
            'no_hak' => '07890',
            'jenis_hak' => 'HGB',
            'desa' => 'Bojong Kulur',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '083456789012',
            'status' => 'Selesai',
        ],

        // --- Status: Ditolak ---
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
            'user_email' => 'loket3@atrbpn.go.id',
            'tanggal_pengajuan' => '2026-02-27',
            'nama_pemegang_hak' => 'Bambang Suryadi',
            'no_su_tahun' => '00333/2011',
            'no_hak' => '02567',
            'jenis_hak' => 'HP',
            'desa' => 'Tlajung Udik',
            'kecamatan' => 'Gunung Putri',
            'no_telepon' => '084567890123',
            'status' => 'Ditolak',
            'catatan_penolakan' => 'Dokumen sertifikat tidak lengkap, mohon upload ulang',
            'rejected_from_status' => 'Proses',
        ],
    ];

    $created = 0;
    $updated = 0;
    $skipped = 0;

    foreach ($berkasData as $data) {
        $userId = getUserId($data['user_email']);
        if (!$userId) {
            $skipped++;
            continue;
        }

        $exists = App\Models\Berkas::where('no_hak', $data['no_hak'])
            ->where('no_su_tahun', $data['no_su_tahun'])
            ->first();

        if ($exists) {
            $exists->update([
                'status' => $data['status'],
                'catatan_penolakan' => $data['catatan_penolakan'] ?? null,
                'rejected_from_status' => $data['rejected_from_status'] ?? null,
            ]);
            echo "🔄 Updated: {$data['nama_pemegang_hak']} - {$data['no_hak']} → {$data['status']}\n";
            $updated++;
            continue;
        }

        App\Models\Berkas::create([
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

    // === VALIDATION LOGS ===
    echo "\n--- Seeding Validation Logs ---\n";
    
    $ergiId = getUserId('Ergi@atrbpn.go.id');
    $putriId = getUserId('putri@atrbpn.go.id');
    $ikhsanId = getUserId('ikhsan@atrbpn.go.id');
    $farhanId = getUserId('farhan@atrbpn.go.id');
    $asepId = getUserId('asep@atrbpn.go.id');
    $dzakiId = getUserId('dzaki@atrbpn.go.id');
    $gustiyawanId = getUserId('gustiyawan022@gmail.com');

    $allBerkas = App\Models\Berkas::all();
    $logCreated = 0;

    foreach ($allBerkas as $berkas) {
        $existingLogs = App\Models\ValidationLog::where('berkas_id', $berkas->id)->count();
        if ($existingLogs > 0) {
            echo "⏭️ Logs exist for: {$berkas->nama_pemegang_hak} ({$berkas->no_hak})\n";
            continue;
        }

        // Status "Proses" = no logs needed (belum diproses)
        if ($berkas->status === 'Proses') {
            echo "⏭️ Proses (no logs): {$berkas->nama_pemegang_hak}\n";
            continue;
        }

        $baseTime = \Carbon\Carbon::parse($berkas->tanggal_pengajuan);
        $arsipAdmin = $ergiId ?: $gustiyawanId;
        $suAdmin = $putriId ?: $ikhsanId;
        $btAdmin = $asepId ?: $farhanId ?: $dzakiId;

        // Arsip verification (semua status non-Proses pasti sudah melewati arsip)
        if ($arsipAdmin) {
            App\Models\ValidationLog::create([
                'berkas_id' => $berkas->id,
                'admin_id' => $arsipAdmin,
                'action' => 'Validasi SU & Bidang',
                'ip_address' => '156.67.221.195',
                'created_at' => $baseTime->copy()->addHours(2),
            ]);
            $logCreated++;
        }

        // Validasi SU → BT
        if (in_array($berkas->status, ['Validasi BT', 'Selesai'])) {
            if ($suAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $suAdmin,
                    'action' => 'Validasi BT',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(4),
                ]);
                $logCreated++;
            }
        }

        // Validasi BT → Selesai
        if ($berkas->status === 'Selesai') {
            if ($btAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $btAdmin,
                    'action' => 'Selesai',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(6),
                ]);
                $logCreated++;
            }
        }

        // Ditolak
        if ($berkas->status === 'Ditolak') {
            $rejectAdmin = $suAdmin ?: $arsipAdmin;
            if ($rejectAdmin) {
                App\Models\ValidationLog::create([
                    'berkas_id' => $berkas->id,
                    'admin_id' => $rejectAdmin,
                    'action' => 'Ditolak',
                    'ip_address' => '156.67.221.195',
                    'created_at' => $baseTime->copy()->addHours(3),
                ]);
                $logCreated++;
            }
        }

        echo "   📝 Logs created for: {$berkas->nama_pemegang_hak} ({$berkas->status})\n";
    }

    echo "\n========================================\n";
    echo "✅ Berkas: Created={$created}, Updated={$updated}, Skipped={$skipped}\n";
    echo "✅ Validation Logs: Created={$logCreated}\n";
    echo "\nRingkasan status:\n";
    foreach (['Proses', 'Validasi SU & Bidang', 'Validasi BT', 'Selesai', 'Ditolak'] as $s) {
        $count = App\Models\Berkas::where('status', $s)->count();
        echo "  {$s}: {$count}\n";
    }
    echo "\n⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "❌ Fatal: " . $e->getMessage() . "\n";
}

echo "</pre>";
