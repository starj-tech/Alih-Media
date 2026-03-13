<?php
/**
 * ⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!
 * 
 * Membuat tabel registration_otps untuk fitur OTP registrasi.
 * Akses: https://api-alihmedia.kantahkabbogor.id/create-registration-otps-table.php?key=bogor2seed
 */

if (($_GET['key'] ?? '') !== 'bogor2seed') {
    http_response_code(404);
    echo '404 Not Found';
    exit;
}

echo "<pre>\n=== Create registration_otps Table ===\n\n";

$baseDir = dirname(__DIR__);

try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $schema = Illuminate\Support\Facades\Schema::class;

    if ($schema::hasTable('registration_otps')) {
        echo "✅ Tabel registration_otps sudah ada.\n";
    } else {
        $schema::create('registration_otps', function (Illuminate\Database\Schema\Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone', 20);
            $table->string('email')->unique();
            $table->string('otp_code');
            $table->text('registration_data');
            $table->boolean('verified')->default(false);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
        echo "✅ Tabel registration_otps berhasil dibuat!\n";
    }

    // Record migration
    \DB::table('migrations')->updateOrInsert(
        ['migration' => '0006_create_registration_otps_table'],
        ['batch' => 2]
    );
    echo "✅ Migration record ditambahkan.\n";

    echo "\n⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "❌ Fatal: " . $e->getMessage() . "\n";
}

echo "</pre>";
