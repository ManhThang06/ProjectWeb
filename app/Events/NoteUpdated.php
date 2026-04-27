<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $noteId;
    public $title;
    public $content;
    public $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(Note $note, $userId)
    {
        $this->noteId = $note->id;
        $this->title = $note->title;
        $this->content = $note->content;
        $this->userId = $userId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('note.' . $this->noteId),
        ];
    }

    /**
     * Tên sự kiện khi gửi qua websocket.
     */
    public function broadcastAs(): string
    {
        return 'note.updated';
    }
}
