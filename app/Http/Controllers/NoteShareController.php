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
    public function sharedWithMe()
    {
        $notes = Auth::user()->sharedNotes()
            ->with(['user:id,display_name,email'])
            ->get()
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
                ];
            });

        return Inertia::render('SharedNotes', [
            'notes' => $notes
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
