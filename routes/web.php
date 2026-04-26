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
    Route::post('/notes/{note}/labels', [\App\Http\Controllers\NoteController::class, 'syncLabels'])->name('notes.labels');

    Route::post('/labels', [\App\Http\Controllers\LabelController::class, 'store'])->name('labels.store');
    Route::patch('/labels/{label}', [\App\Http\Controllers\LabelController::class, 'update'])->name('labels.update');
    Route::delete('/labels/{label}', [\App\Http\Controllers\LabelController::class, 'destroy'])->name('labels.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::get('/preferences', function () {
        return Inertia::render('Preferences');
    })->name('preferences');
    Route::patch('/preferences', [\App\Http\Controllers\UserPreferenceController::class, 'update'])->name('preferences.update');
});

require __DIR__.'/auth.php';
