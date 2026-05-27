<?php
// app/Mail/DigestMail.php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DigestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $admin;
    public $type;
    public $data;

    public function __construct($admin, $type, $data = null)
    {
        $this->admin = $admin;
        $this->type = $type; // 'weekly' or 'monthly'
        $this->data = $data;
    }

    public function envelope(): Envelope
    {
        $subject = $this->type === 'weekly'
            ? '📊 Weekly Activity Digest - ' . now()->format('F j, Y')
            : '📈 Monthly Performance Report - ' . now()->format('F Y');

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.digest',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
