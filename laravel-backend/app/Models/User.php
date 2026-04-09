<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'email_verified_at'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Hash password automatically on set
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function userRole()
    {
        return $this->hasOne(UserRole::class);
    }

    public function berkas()
    {
        return $this->hasMany(Berkas::class);
    }

    public function validationLogs()
    {
        return $this->hasMany(ValidationLog::class, 'admin_id');
    }

    // ==========================================
    // ROLE HELPERS
    // ==========================================

    public function getRole()
    {
        $role = $this->userRole;
        return $role ? $role->role : 'user';
    }

    public function isAdmin()
    {
        return in_array($this->getRole(), [
            'admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt', 'admin_pengguna'
        ]);
    }

    public function isSuperAdmin()
    {
        return in_array($this->getRole(), ['super_admin', 'admin']);
    }

    public function isSuperUser()
    {
        return $this->getRole() === 'super_user';
    }

    public function hasRole($role)
    {
        return $this->getRole() === $role;
    }

    /**
     * Get role label in Indonesian
     */
    public function getRoleLabel()
    {
        $labels = [
            'super_admin' => 'Super Admin',
            'admin' => 'Admin',
            'admin_arsip' => 'Admin Arsip BT/SU',
            'admin_validasi_su' => 'Admin Validasi SU & Bidang',
            'admin_validasi_bt' => 'Admin Validasi BT',
            'admin_pengguna' => 'Admin Pengguna',
            'super_user' => 'Super User',
            'user' => 'User',
        ];

        $role = $this->getRole();
        return isset($labels[$role]) ? $labels[$role] : 'User';
    }
}
