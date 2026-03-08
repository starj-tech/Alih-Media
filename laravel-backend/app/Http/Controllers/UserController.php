<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $users = User::with(['profile', 'userRole'])->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->profile?->name ?? $user->name,
                'no_telepon' => $user->profile?->no_telepon ?? '',
                'pengguna' => $user->profile?->pengguna ?? 'Perorangan',
                'nama_instansi' => $user->profile?->nama_instansi,
                'role' => $user->getRole(),
            ];
        });

        return response()->json($users);
    }

    // POST /api/users
    public function store(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'nullable|in:admin,user,super_admin,super_user,admin_arsip,admin_validasi_su,admin_validasi_bt',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        Profile::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'email' => $request->email,
            'no_telepon' => $request->no_telepon ?? '',
            'pengguna' => $request->pengguna ?? 'Perorangan',
            'nama_instansi' => $request->nama_instansi,
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role' => $request->role ?? 'user',
        ]);

        return response()->json(['success' => true, 'id' => $user->id], 201);
    }

    // PUT /api/users/{id}
    public function update(Request $request, int $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        // Update profile
        $profile = $user->profile;
        if ($profile) {
            $profileUpdates = array_filter([
                'name' => $request->name,
                'no_telepon' => $request->no_telepon,
                'pengguna' => $request->pengguna,
                'nama_instansi' => $request->nama_instansi,
            ], fn($v) => $v !== null);

            if (!empty($profileUpdates)) {
                $profile->update($profileUpdates);
            }
        }

        // Update role
        if ($request->role) {
            $user->userRole?->update(['role' => $request->role]);
        }

        // Update password
        if ($request->password) {
            $user->update(['password' => $request->password]);
        }

        return response()->json(['success' => true]);
    }

    // DELETE /api/users/{id}
    public function destroy(Request $request, int $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete(); // Cascade deletes profile & role

        return response()->json(['success' => true]);
    }
}
