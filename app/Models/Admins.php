<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class Admins extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'admins';
    protected $primaryKey = '_id';

    protected $fillable = [
        'adminId',
        'name',
        'email',
        'phone',
        'password',
        'rank',
        'department',
        'status', // 'pending', 'approved', 'rejected'
        'rejection_reason',
        'password_reset_code',
        'password_reset_code_expires_at',
        'notification_preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'notification_preferences' => 'array',
        ];
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'name'       => $this->name,
            'email'      => $this->email,
            'rank'       => $this->rank,
            'department' => $this->department,
            'status'     => $this->status,
        ];
    }
}
