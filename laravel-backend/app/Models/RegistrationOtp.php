<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RegistrationOtp extends Model
{
    protected $table = 'registration_otps';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'phone',
        'email',
        'otp_code',
        'registration_data',
        'verified',
        'expires_at',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'expires_at' => 'datetime',
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

    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    public static function cleanupExpired()
    {
        return static::where('expires_at', '<', now())->delete();
    }
}
