<?php

namespace App\Http\Controllers;

use App\Models\Label;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LabelController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        Auth::user()->labels()->create($validated);

        return back();
    }

    public function update(Request $request, Label $label)
    {
        if ($label->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $label->update($validated);

        return back();
    }

    public function destroy(Label $label)
    {
        if ($label->user_id !== Auth::id()) {
            abort(403);
        }
        $label->delete();
        return back();
    }
}
