<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * GET /api/users
     * List semua user (admin/super_admin only)
     */
    public function index(Request $request): JsonResponse
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

    /**
     * POST /api/users
     * Buat user baru (oleh admin)
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|max:128',
            'role' => 'nullable|in:' . implode(',', UserRole::ROLES),
            'no_telepon' => 'nullable|string|max:20',
            'pengguna' => 'nullable|in:' . implode(',', Profile::PENGGUNA_TYPES),
            'nama_instansi' => 'nullable|string|max:200',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'email_verified_at' => now(),
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

    /**
     * PUT /api/users/{id}
     * Update user (profil, role, password)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'nullable|string|min:2|max:100',
            'role' => 'nullable|in:' . implode(',', UserRole::ROLES),
            'no_telepon' => 'nullable|string|max:20',
            'pengguna' => 'nullable|in:' . implode(',', Profile::PENGGUNA_TYPES),
            'nama_instansi' => 'nullable|string|max:200',
            'password' => 'nullable|string|min:6|max:128',
        ]);

        // Update profile
        $profile = $user->profile;
        if ($profile) {
            $profileUpdates = [];
            if ($request->has('name')) $profileUpdates['name'] = $request->name;
            if ($request->has('no_telepon')) $profileUpdates['no_telepon'] = $request->no_telepon;
            if ($request->has('pengguna')) $profileUpdates['pengguna'] = $request->pengguna;
            if ($request->has('nama_instansi')) $profileUpdates['nama_instansi'] = $request->nama_instansi;

            if (!empty($profileUpdates)) {
                $profile->update($profileUpdates);
            }
        }

        // Update role
        if ($request->has('role') && $request->role) {
            $userRole = $user->userRole;
            if ($userRole) {
                $userRole->update(['role' => $request->role]);
            } else {
                UserRole::create([
                    'user_id' => $user->id,
                    'role' => $request->role,
                ]);
            }
        }

        // Update password
        if ($request->has('password') && $request->password) {
            $user->update(['password' => $request->password]);
        }

        // Update user name
        if ($request->has('name')) {
            $user->update(['name' => $request->name]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * DELETE /api/users/{id}
     * Hapus user (cascade: profile, role, berkas)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Tidak bisa menghapus akun sendiri'], 400);
        }

        $user->delete(); // Cascade deletes profile, role, berkas

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/users/{id}
     * Detail satu user
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::with(['profile', 'userRole'])->findOrFail($id);

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->profile?->name ?? $user->name,
            'no_telepon' => $user->profile?->no_telepon ?? '',
            'pengguna' => $user->profile?->pengguna ?? 'Perorangan',
            'nama_instansi' => $user->profile?->nama_instansi,
            'role' => $user->getRole(),
            'created_at' => $user->created_at,
        ]);
    }
}
