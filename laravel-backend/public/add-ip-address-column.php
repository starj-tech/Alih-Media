<?php
/**
 * Add ip_address column to berkas table
 * Run via browser: https://api-alihmedia.kantahkabbogor.id/add-ip-address-column.php
 * DELETE THIS FILE AFTER RUNNING!
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "<pre>\n";

if (Schema::hasColumn('berkas', 'ip_address')) {
    echo "✅ Column 'ip_address' already exists in 'berkas' table.\n";
} else {
    Schema::table('berkas', function (Blueprint $table) {
        $table->string('ip_address', 45)->nullable()->after('rejected_from_status');
    });
    echo "✅ Column 'ip_address' added successfully to 'berkas' table.\n";
}

echo "\n⚠️ DELETE THIS FILE AFTER RUNNING!\n";
echo "</pre>";
