<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ValidationLog extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'berkas_id',
        'admin_id',
        'action',
        'ip_address',
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

    public function berkas()
    {
        return $this->belongsTo(Berkas::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
