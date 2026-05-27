<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Student extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'students';

    protected $fillable = [
        'name', 'email', 'password', 'matrixNumber', 'mahallah', 'phone', 'lastLogin'
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'createdAt' => 'datetime',
        'lastLogin' => 'datetime',
    ];

    // Relationship with reports
    public function reports()
    {
        return $this->hasMany(Report::class, 'studentId', 'matrixNumber');
    }
}
