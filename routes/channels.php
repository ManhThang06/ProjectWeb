<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('note.{noteId}', function ($user, $noteId) {
    $note = \App\Models\Note::find($noteId);
    
    if (!$note) return false;

    // Chủ sở hữu
    if ($note->user_id === $user->id) return true;

    // Người được chia sẻ (cả View và Edit)
    return $note->sharedWith()
                ->where('users.id', $user->id)
                ->exists();
});
