<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'is_pinned',
        'password',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'password' => 'hashed', // Tự động hash khi set, nhưng ta sẽ quản lý logic kỹ hơn ở controller theo yêu cầu
    ];

    protected $hidden = [
        'password',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function labels()
    {
        return $this->belongsToMany(Label::class);
    }

    public function images()
    {
        return $this->hasMany(NoteImage::class);
    }

    /**
     * Những người dùng được chia sẻ ghi chú này.
     */
    public function sharedWith()
    {
        return $this->belongsToMany(User::class, 'note_user')
                    ->withPivot('permission')
                    ->withTimestamps();
    }
}
