<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserRole extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'role'];

    /**
     * Valid role values
     */
    public const ROLES = [
        'admin',
        'user',
        'super_admin',
        'super_user',
        'admin_arsip',
        'admin_validasi_su',
        'admin_validasi_bt',
    ];

    /**
     * Admin roles
     */
    public const ADMIN_ROLES = [
        'admin',
        'super_admin',
        'admin_arsip',
        'admin_validasi_su',
        'admin_validasi_bt',
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
