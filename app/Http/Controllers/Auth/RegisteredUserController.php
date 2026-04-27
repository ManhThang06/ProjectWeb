<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\VerifyAccountMail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'display_name' => $request->display_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => false,
            'preferences' => [
                'font_size' => 'medium',
                'color_scheme' => 'blue',
                'theme' => 'light',
            ],
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Tạo link kích hoạt có thời hạn 60 phút
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        // Gửi email vào hàng đợi (Queue) để tránh treo web và rate-limit
        Mail::to($user->email)->queue(new VerifyAccountMail($verificationUrl, $user->display_name));

        return redirect(route('dashboard', absolute: false));
    }
}
