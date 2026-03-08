<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserRole extends Model
{
    use HasUuids;

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
