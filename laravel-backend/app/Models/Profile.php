<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Profile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'no_telepon',
        'pengguna',
        'nama_instansi',
    ];

    /**
     * Valid pengguna types
     */
    public const PENGGUNA_TYPES = [
        'Perorangan',
        'Staf PPAT',
        'Notaris/PPAT',
        'Bank',
        'PT/Badan Hukum',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
