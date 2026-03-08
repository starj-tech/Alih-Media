<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Berkas extends Model
{
    use HasUuids;

    protected $table = 'berkas';

    protected $fillable = [
        'user_id',
        'tanggal_pengajuan',
        'nama_pemegang_hak',
        'nama_pemilik_sertifikat',
        'no_hak',
        'no_su_tahun',
        'jenis_hak',
        'kecamatan',
        'desa',
        'no_telepon',
        'no_wa_pemohon',
        'link_shareloc',
        'status',
        'file_sertifikat_url',
        'file_ktp_url',
        'file_foto_bangunan_url',
        'validated_by',
        'validated_at',
        'catatan_penolakan',
        'rejected_from_status',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'validated_at' => 'datetime',
    ];

    /**
     * Valid jenis hak values
     */
    public const JENIS_HAK = ['HM', 'HGB', 'HP', 'HGU', 'HMSRS', 'HPL', 'HW'];

    /**
     * Valid status values
     */
    public const STATUSES = [
        'Proses',
        'Validasi SU & Bidang',
        'Validasi BT',
        'Selesai',
        'Ditolak',
    ];

    /**
     * Daily submission limit for regular users
     */
    public const DAILY_LIMIT = 5;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function validationLogs()
    {
        return $this->hasMany(ValidationLog::class);
    }

    // ==========================================
    // SCOPES
    // ==========================================

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeCreatedToday($query)
    {
        return $query->whereDate('created_at', today());
    }
}
