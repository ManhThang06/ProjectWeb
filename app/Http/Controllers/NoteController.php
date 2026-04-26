<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->notes()->with(['labels', 'images']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->has('label_id')) {
            $query->whereHas('labels', function($q) use ($request) {
                $q->where('labels.id', $request->label_id);
            });
        }

        $notes = $query->orderBy('is_pinned', 'desc')
                      ->orderBy('updated_at', 'desc')
                      ->get();

        return Inertia::render('Dashboard', [
            'notes' => $notes,
            'labels' => Auth::user()->labels()->get(),
            'filters' => $request->only(['search', 'label_id'])
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
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'is_pinned' => 'boolean',
        ]);

        $note->update($validated);

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
