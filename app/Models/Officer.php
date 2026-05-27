<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;
use MongoDB\Laravel\Eloquent\Model;

class Officer extends Model
{
    use Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'officers';

    protected $fillable = [
        'officerId',
        'officerName',
        'rank',
        'department',
        'phone',
        'email',
        'casesHandled',
        'responseRate',
        'telegram_chat_id',
        'receive_emergency',
        'receive_daily_digest',
    ];

    protected $casts = [
        'casesHandled' => 'integer',
        'responseRate' => 'integer',
    ];

    protected $attributes = [
        'receive_emergency' => true,
        'receive_daily_digest' => false,
    ];

    //relationship with report model
    public function reports()
    {
        return $this->hasMany(Report::class, 'assignedOfficer', 'officerId');
    }

    public function routeNotificationForTelegram()
    {
        return $this->telegram_chat_id;
    }
}
