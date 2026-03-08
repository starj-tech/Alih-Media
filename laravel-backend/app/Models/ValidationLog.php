<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ValidationLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'berkas_id',
        'admin_id',
        'action',
        'ip_address',
    ];

    public function berkas()
    {
        return $this->belongsTo(Berkas::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
