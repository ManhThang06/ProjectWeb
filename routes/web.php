<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\NoteController::class, 'index'])->name('dashboard');
    
    Route::post('/notes', [\App\Http\Controllers\NoteController::class, 'store'])->name('notes.store');
    Route::patch('/notes/{note}', [\App\Http\Controllers\NoteController::class, 'update'])->name('notes.update');
    Route::delete('/notes/{note}', [\App\Http\Controllers\NoteController::class, 'destroy'])->name('notes.destroy');
    Route::post('/notes/{note}/pin', [\App\Http\Controllers\NoteController::class, 'togglePin'])->name('notes.pin');
    Route::post('/notes/{note}/image', [\App\Http\Controllers\NoteController::class, 'uploadImage'])->name('notes.image');
    Route::post('/notes/image/{image}/replace', [\App\Http\Controllers\NoteController::class, 'replaceImage'])->name('notes.image.replace');
    Route::delete('/notes/image/{image}', [\App\Http\Controllers\NoteController::class, 'deleteImage'])->name('notes.image.destroy');
    Route::post('/notes/{note}/labels', [\App\Http\Controllers\NoteController::class, 'syncLabels'])->name('notes.labels');

    Route::post('/labels', [\App\Http\Controllers\LabelController::class, 'store'])->name('labels.store');
    Route::patch('/labels/{label}', [\App\Http\Controllers\LabelController::class, 'update'])->name('labels.update');
    Route::delete('/labels/{label}', [\App\Http\Controllers\LabelController::class, 'destroy'])->name('labels.destroy');

    // Settings & Profile
    Route::get('/settings', [ProfileController::class, 'edit'])->name('settings.edit');
    Route::post('/settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/settings/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');
    Route::patch('/settings/preferences', [\App\Http\Controllers\UserPreferenceController::class, 'update'])->name('preferences.update');

    // Advanced Note Management Routes
    Route::get('/shared-notes', [\App\Http\Controllers\NoteShareController::class, 'sharedWithMe'])->name('notes.shared-with-me');
    Route::post('/notes/{note}/share', [\App\Http\Controllers\NoteShareController::class, 'share'])->name('notes.share');
    Route::patch('/notes/{note}/share/{user}', [\App\Http\Controllers\NoteShareController::class, 'updatePermission'])->name('notes.share.update');
    Route::post('/notes/{note}/verify-password', [\App\Http\Controllers\NoteShareController::class, 'verifyPassword'])->name('notes.verify-password');
    Route::post('/notes/{note}/password', [\App\Http\Controllers\NoteShareController::class, 'setPassword'])->name('notes.set-password');
});

require __DIR__.'/auth.php';
