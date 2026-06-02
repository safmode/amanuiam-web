<?php
// app/Models/Emergency.php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Emergencies extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'emergencies';

    protected $fillable = [
        'studentId',
        'studentName',
        'studentMatrix',
        'studentPhone',
        'latitude',
        'longitude',
        'status',
        'address',
        'triggeredAt',
        'resolvedAt',
        'location',
        'assigned_officer_id',
        'assigned_officer_name',
        'dispatch_notes',
        'dispatched_at'
    ];

    protected $casts = [
        'triggeredAt' => 'datetime',
        'resolvedAt' => 'datetime',
        'dispatched_at' => 'datetime',
        'location' => 'array'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentId', '_id');
    }
}
