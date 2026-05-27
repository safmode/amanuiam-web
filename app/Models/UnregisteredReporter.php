<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UnregisteredReporter extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'unregistered_reporters';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'matric_number',
        'reports_count',
        'first_report_date',
        'last_report_date',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'first_report_date' => 'datetime',
        'last_report_date' => 'datetime',
    ];
}
