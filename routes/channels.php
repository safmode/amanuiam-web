<?php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;

// Public channel - no authentication needed
// This is just here for reference, public channels don't need to be defined
// But if you want to keep it for clarity:
Broadcast::channel('admin-notifications', function ($user) {
    // Any authenticated admin can listen
    return $user !== null;
});
