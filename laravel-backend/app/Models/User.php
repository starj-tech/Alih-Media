<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
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

    public function getRole(): string
    {
        return $this->userRole?->role ?? 'user';
    }

    public function isAdmin(): bool
    {
        return in_array($this->getRole(), [
            'admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt'
        ]);
    }

    public function isSuperAdmin(): bool
    {
        return in_array($this->getRole(), ['super_admin', 'admin']);
    }

    public function isSuperUser(): bool
    {
        return $this->getRole() === 'super_user';
    }

    public function hasRole(string $role): bool
    {
        return $this->getRole() === $role;
    }

    /**
     * Get role label in Indonesian
     */
    public function getRoleLabel(): string
    {
        return match ($this->getRole()) {
            'super_admin' => 'Super Admin',
            'admin' => 'Admin',
            'admin_arsip' => 'Admin Arsip BT/SU',
            'admin_validasi_su' => 'Admin Validasi SU & Bidang',
            'admin_validasi_bt' => 'Admin Validasi BT',
            'super_user' => 'Super User',
            default => 'User',
        };
    }
}
