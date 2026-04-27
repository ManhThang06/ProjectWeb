<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteImage;
use App\Events\NoteUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Ghi chú của tôi
        $query = $user->notes()->with(['labels', 'images', 'sharedWith:id,display_name,email']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->filled('label_id')) {
            $query->whereHas('labels', function($q) use ($request) {
                $q->where('labels.id', $request->label_id);
            });
        }

        $notes = $query->orderBy('is_pinned', 'desc')
                      ->orderBy('updated_at', 'desc')
                      ->get()
                      ->map(function ($note) {
                          $note->has_password = !empty($note->password);
                          return $note;
                      });

        $openedNote = null;
        if ($request->filled('open')) {
            $openedNote = Note::with(['labels', 'images', 'sharedWith:id,display_name,email', 'user:id,display_name,email'])
                ->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('sharedWith', function($sq) use ($user) {
                          $sq->where('users.id', $user->id);
                      });
                })
                ->find($request->open);
            
            if ($openedNote) {
                $openedNote->has_password = !empty($openedNote->password);
            }
        }

        return Inertia::render('Dashboard', [
            'notes' => $notes,
            'labels' => $user->labels()->get(),
            'filters' => $request->only(['search', 'label_id']),
            'openedNote' => $openedNote
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'is_pinned' => 'boolean',
        ]);

        $note = Auth::user()->notes()->create($validated);

        return response()->json($note->load(['labels', 'images']));
    }

    public function update(Request $request, Note $note)
    {
        // Kiểm tra quyền: Owner hoặc được Share với quyền Edit
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'is_pinned' => 'boolean',
        ]);

        $note->update($validated);

        // Phát sự kiện WebSocket để cập nhật Real-time
        broadcast(new NoteUpdated($note, Auth::id()))->toOthers();

        return response()->json($note->load(['labels', 'images']));
    }

    public function destroy(Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }
        $note->delete();
        return back();
    }

    public function togglePin(Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }
        $note->update(['is_pinned' => !$note->is_pinned]);
        return back();
    }

    public function uploadImage(Request $request, Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('notes', 'public');
        $note->images()->create(['path' => $path]);

        return back();
    }

    public function deleteImage(NoteImage $image)
    {
        if ($image->note->user_id !== Auth::id()) {
            abort(403);
        }

        Storage::disk('public')->delete($image->path);
        $image->delete();

        return back();
    }

    public function replaceImage(Request $request, NoteImage $image)
    {
        if ($image->note->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        // Delete old physical file
        Storage::disk('public')->delete($image->path);

        // Store new file
        $path = $request->file('image')->store('notes', 'public');
        
        // Update DB record
        $image->update(['path' => $path]);

        return back();
    }

    public function syncLabels(Request $request, Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }
        $request->validate([
            'label_ids' => 'array',
            'label_ids.*' => 'exists:labels,id',
        ]);

        $note->labels()->sync($request->label_ids);

        return back();
    }
}
