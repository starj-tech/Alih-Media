<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Berkas extends Model
{
    use HasUuids;

    protected $table = 'berkas';

    protected $fillable = [
        'user_id', 'tanggal_pengajuan', 'nama_pemegang_hak', 'nama_pemilik_sertifikat',
        'no_hak', 'no_su_tahun', 'jenis_hak', 'kecamatan', 'desa', 'no_telepon',
        'no_wa_pemohon', 'link_shareloc', 'status', 'file_sertifikat_url',
        'file_ktp_url', 'file_foto_bangunan_url', 'validated_by', 'validated_at',
        'catatan_penolakan', 'rejected_from_status',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'validated_at' => 'datetime',
    ];

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
}
