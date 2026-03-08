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
        return ['password' => 'hashed'];
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function userRole()
    {
        return $this->hasOne(UserRole::class);
    }

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

    public function berkas()
    {
        return $this->hasMany(Berkas::class);
    }
}
