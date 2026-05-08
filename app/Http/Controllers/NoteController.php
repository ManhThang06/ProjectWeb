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
        $query = $user->notes()->with(['labels' => function($q) use ($user) {
            $q->where('user_id', $user->id);
        }, 'images', 'sharedWith:id,display_name,email']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->filled('label_ids')) {
            $labelIds = is_array($request->label_ids) ? $request->label_ids : explode(',', $request->label_ids);
            $query->whereHas('labels', function($q) use ($labelIds) {
                $q->whereIn('labels.id', $labelIds);
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
            $openedNote = Note::with(['labels' => function($q) use ($user) {
                    $q->where('user_id', $user->id);
                }, 'images', 'sharedWith:id,display_name,email', 'user:id,display_name,email'])
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
            'labels' => $user->labels()->whereHas('notes', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->get(),
            'filters' => $request->only(['search', 'label_ids', 'from']),
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

        $note->load(['labels', 'images']);
        
        // Phát sự kiện WebSocket để cập nhật Real-time
        broadcast(new NoteUpdated($note, Auth::id()))->toOthers();

        return response()->json($note);
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
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
            abort(403);
        }
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('notes', 'public');
        $note->images()->create(['path' => $path]);

        // Broadcast to others
        broadcast(new NoteUpdated($note->load('images'), Auth::id()))->toOthers();

        return back();
    }

    public function deleteImage(NoteImage $image)
    {
        $note = $image->note;
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
            abort(403);
        }

        Storage::disk('public')->delete($image->path);
        $image->delete();

        // Broadcast to others
        broadcast(new NoteUpdated($note->load('images'), Auth::id()))->toOthers();

        return back();
    }

    public function replaceImage(Request $request, NoteImage $image)
    {
        $note = $image->note;
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
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

        // Broadcast to others
        broadcast(new NoteUpdated($note->load('images'), Auth::id()))->toOthers();

        return back();
    }

    public function syncLabels(Request $request, Note $note)
    {
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
            abort(403);
        }
        $request->validate([
            'label_ids' => 'array',
            'label_ids.*' => 'exists:labels,id',
        ]);

        $requestedLabelIds = $request->label_ids ?: [];
        $currentUser = Auth::user();
        $owner = $note->user;
        
        $requestedLabels = \App\Models\Label::whereIn('id', $requestedLabelIds)->get();
        $labelNames = $requestedLabels->pluck('name')->toArray();

        // 1. Nếu người đang sửa là cộng tác viên, tạo gương cho chủ sở hữu
        if ($currentUser->id !== $owner->id) {
            foreach ($labelNames as $name) {
                $ownerLabel = $owner->labels()->firstOrCreate(['name' => $name]);
                $requestedLabelIds[] = $ownerLabel->id;
            }
        } 
        // 2. Nếu người đang sửa là chủ sở hữu, tạo gương cho TẤT CẢ cộng tác viên
        else {
            foreach ($note->sharedWith as $collaborator) {
                foreach ($labelNames as $name) {
                    $collabLabel = $collaborator->labels()->firstOrCreate(['name' => $name]);
                    $requestedLabelIds[] = $collabLabel->id;
                }
            }
        }

        $note->labels()->sync(array_unique($requestedLabelIds));

        // Phát sự kiện Real-time
        broadcast(new NoteUpdated($note->load(['labels', 'images']), Auth::id()))->toOthers();

        return back();
    }

    public function addLabel(Request $request, Note $note)
    {
        $isOwner = $note->user_id === Auth::id();
        $isSharedEditor = $note->sharedWith()
                               ->where('users.id', Auth::id())
                               ->where('permission', 'edit')
                               ->exists();

        if (!$isOwner && !$isSharedEditor) {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $currentUser = Auth::user();
        $owner = $note->user;
        $labelName = $request->name;

        // 1. Tìm hoặc tạo nhãn cho người dùng hiện tại
        $currentLabel = $currentUser->labels()->firstOrCreate(['name' => $labelName]);
        
        // 2. Gán vào ghi chú (không xóa các nhãn khác)
        $note->labels()->syncWithoutDetaching([$currentLabel->id]);

        // 3. Nếu là cộng tác viên thêm nhãn, tạo gương cho chủ sở hữu
        if ($currentUser->id !== $owner->id) {
            $ownerLabel = $owner->labels()->firstOrCreate(['name' => $labelName]);
            $note->labels()->syncWithoutDetaching([$ownerLabel->id]);
        }
        // 4. Nếu là chủ sở hữu thêm nhãn, tạo gương cho tất cả cộng tác viên hiện tại
        else {
            foreach ($note->sharedWith as $collaborator) {
                $collabLabel = $collaborator->labels()->firstOrCreate(['name' => $labelName]);
                $note->labels()->syncWithoutDetaching([$collabLabel->id]);
            }
        }

        // Phát sự kiện Real-time
        broadcast(new NoteUpdated($note->load(['labels', 'images']), Auth::id()))->toOthers();

        return back();
    }
}
