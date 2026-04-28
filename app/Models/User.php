<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Support\Facades\URL;
use App\Services\MailService;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'display_name',
        'avatar',
        'email',
        'password',
        'is_active',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'preferences' => 'array',
        ];
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function labels()
    {
        return $this->hasMany(Label::class);
    }

    /**
     * Những ghi chú được người khác chia sẻ với người dùng này.
     */
    public function sharedNotes()
    {
        return $this->belongsToMany(Note::class, 'note_user')
                    ->withPivot('permission')
                    ->withTimestamps();
    }

    /**
     * Gửi thông báo xác thực email sử dụng PHPMailer.
     */
    public function sendEmailVerificationNotification()
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $this->id, 'hash' => sha1($this->email)]
        );

        $emailContent = view('emails.verify-account', [
            'url' => $verificationUrl,
            'displayName' => $this->display_name
        ])->render();

        MailService::sendEmail(
            $this->email,
            'Kích hoạt tài khoản của bạn - PJWEB',
            $emailContent
        );
    }
}

