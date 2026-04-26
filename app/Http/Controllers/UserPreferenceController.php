<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserPreferenceController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'font_size' => 'required|string|in:small,medium,large',
            'color_scheme' => 'required|string',
            'theme' => 'required|string|in:light,dark',
        ]);

        $user = Auth::user();
        $user->preferences = $validated;
        $user->save();

        return back();
    }
}
