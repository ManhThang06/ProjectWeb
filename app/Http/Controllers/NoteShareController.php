<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class NoteShareController extends Controller
{
    /**
     * Hiển thị danh sách ghi chú được chia sẻ với tôi.
     */
    public function sharedWithMe(Request $request)
    {
        $user = Auth::user();
        $query = $user->sharedNotes()
            ->with(['user:id,display_name,email', 'labels', 'images']);

        if ($request->filled('search')) {
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

        $notes = $query->get()
            ->map(function ($note) {
                return [
                    'id' => $note->id,
                    'title' => $note->title,
                    'content' => $note->content,
                    'owner_name' => $note->user->display_name,
                    'owner_email' => $note->user->email,
                    'permission' => $note->pivot->permission,
                    'shared_at' => $note->pivot->created_at,
                    'is_pinned' => $note->is_pinned,
                    'labels' => $note->labels,
                    'images' => $note->images,
                    'has_password' => !empty($note->password),
                ];
            });

        $openedNote = null;
        if ($request->filled('open')) {
            $openedNote = Note::with(['labels', 'images', 'sharedWith:id,display_name,email', 'user:id,display_name,email'])
                ->whereHas('sharedWith', function($sq) use ($user) {
                    $sq->where('users.id', $user->id);
                })
                ->find($request->open);
            
            if ($openedNote) {
                $openedNote->has_password = !empty($openedNote->password);
                // Gán permission cho openedNote
                $pivot = $openedNote->sharedWith()->where('users.id', $user->id)->first()->pivot;
                $openedNote->permission = $pivot->permission;
            }
        }

        return Inertia::render('SharedNotes', [
            'notes' => $notes,
            'openedNote' => $openedNote,
            'labels' => \App\Models\Label::whereHas('notes', function($q) use ($user) {
                $q->whereHas('sharedWith', function($sq) use ($user) {
                    $sq->where('users.id', $user->id);
                });
            })->distinct()->get(),
            'filters' => $request->only(['search', 'label_ids']),
            'auth' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Chia sẻ ghi chú cho người dùng khác.
     */
    public function share(Request $request, Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'permission' => 'required|in:read,edit',
        ]);

        $userToShare = User::where('email', $validated['email'])->first();

        if ($userToShare->id === Auth::id()) {
            return back()->withErrors(['email' => 'Bạn không thể chia sẻ ghi chú cho chính mình.']);
        }

        $note->sharedWith()->syncWithoutDetaching([
            $userToShare->id => ['permission' => $validated['permission']]
        ]);

        return back();
    }

    /**
     * Cập nhật quyền hoặc thu hồi quyền truy cập.
     */
    public function updatePermission(Request $request, Note $note, User $user)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }

        if ($request->has('revoke')) {
            $note->sharedWith()->detach($user->id);
        } else {
            $validated = $request->validate([
                'permission' => 'required|in:read,edit',
            ]);
            $note->sharedWith()->updateExistingPivot($user->id, [
                'permission' => $validated['permission']
            ]);
        }

        return back();
    }

    /**
     * Xác thực mật khẩu ghi chú để truy cập.
     */
    public function verifyPassword(Request $request, Note $note)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        if (Hash::check($request->password, $note->password)) {
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Mật khẩu không chính xác.'], 403);
    }

    /**
     * Cài đặt hoặc đổi mật khẩu ghi chú.
     */
    public function setPassword(Request $request, Note $note)
    {
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }

        // Nếu ghi chú đã có mật khẩu, yêu cầu nhập mật khẩu hiện tại trước
        if ($note->password) {
            $request->validate([
                'current_password' => 'required|string',
            ]);

            if (!Hash::check($request->current_password, $note->password)) {
                return back()->withErrors(['current_password' => 'Mật khẩu hiện tại không chính xác.']);
            }
        }

        // Nếu tắt tính năng khóa (disable)
        if ($request->has('disable')) {
            $note->update(['password' => null]);
            return back();
        }

        $request->validate([
            'password' => 'required|string|confirmed|min:4',
        ]);

        $note->update(['password' => $request->password]);

        return back();
    }
}
