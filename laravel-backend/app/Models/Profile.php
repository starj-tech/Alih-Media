<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Profile extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

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
        'Notaris/PPAT',
        'Bank',
        'PT/Badan Hukum',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
