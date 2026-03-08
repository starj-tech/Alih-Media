<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $profile = $user->profile;
        $role = $user->getRole();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $profile?->name ?? $user->name,
                'role' => $role,
            ],
        ]);
    }

    // POST /api/auth/register
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'no_telepon' => 'nullable|string',
            'pengguna' => 'nullable|in:Perorangan,Staf PPAT,Notaris/PPAT,Bank,PT/Badan Hukum',
            'nama_instansi' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // Create profile
        Profile::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'email' => $request->email,
            'no_telepon' => $request->no_telepon ?? '',
            'pengguna' => $request->pengguna ?? 'Perorangan',
            'nama_instansi' => $request->nama_instansi,
        ]);

        // Assign default role
        UserRole::create([
            'user_id' => $user->id,
            'role' => 'user',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $request->name,
                'role' => 'user',
            ],
        ], 201);
    }

    // GET /api/auth/me
    public function me(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $profile?->name ?? $user->name,
            'role' => $user->getRole(),
        ]);
    }

    // POST /api/auth/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // POST /api/auth/change-password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password berhasil diubah']);
    }
}
