<?php

namespace App\Http\Controllers;

use App\Models\Berkas;
use App\Models\ValidationLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class BerkasController extends Controller
{
    /**
     * GET /api/berkas
     * Ambil semua berkas. Admin = semua, User = milik sendiri.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Berkas::query()->orderBy('created_at', 'desc');

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('kecamatan')) {
            $query->where('kecamatan', $request->kecamatan);
        }
        if ($request->has('jenis_hak')) {
            $query->where('jenis_hak', $request->jenis_hak);
        }

        $berkas = $query->get();

        return response()->json($berkas);
    }

    /**
     * GET /api/berkas/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($berkas);
    }

    /**
     * POST /api/berkas
     * Buat berkas baru
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_pemegang_hak' => 'required|string|max:255',
            'no_hak' => 'required|string|min:5|max:50',
            'no_su_tahun' => 'required|string|max:50',
            'jenis_hak' => 'required|in:' . implode(',', Berkas::JENIS_HAK),
            'kecamatan' => 'required|string|max:100',
            'desa' => 'required|string|max:100',
            'no_telepon' => 'nullable|string|max:20',
            'nama_pemilik_sertifikat' => 'nullable|string|max:255',
            'no_wa_pemohon' => 'nullable|string|max:20',
            'link_shareloc' => 'nullable|string|max:500',
            'file_sertifikat_url' => 'nullable|string',
            'file_ktp_url' => 'nullable|string',
            'file_foto_bangunan_url' => 'nullable|string',
        ]);

        $user = $request->user();

        // Validate no_su_tahun: first part must have at least 5 digits
        $noSuNumber = preg_replace('/\D/', '', explode('/', $request->no_su_tahun)[0] ?? '');
        if (strlen($noSuNumber) < 5) {
            return response()->json(['error' => 'No SU harus minimal 5 digit'], 422);
        }

        // Check daily limit (5/day for regular users)
        if (!$user->isSuperUser()) {
            $todayCount = Berkas::byUser($user->id)->createdToday()->count();

            if ($todayCount >= Berkas::DAILY_LIMIT) {
                return response()->json([
                    'error' => 'Kuota harian sudah habis (maks ' . Berkas::DAILY_LIMIT . ')',
                ], 429);
            }
        }

        $berkas = Berkas::create([
            'user_id' => $user->id,
            'tanggal_pengajuan' => now()->toDateString(),
            'nama_pemegang_hak' => $request->nama_pemegang_hak,
            'nama_pemilik_sertifikat' => $request->nama_pemilik_sertifikat,
            'no_hak' => $request->no_hak,
            'no_su_tahun' => $request->no_su_tahun,
            'jenis_hak' => $request->jenis_hak,
            'kecamatan' => $request->kecamatan,
            'desa' => $request->desa,
            'no_telepon' => $request->no_telepon ?? '',
            'no_wa_pemohon' => $request->no_wa_pemohon,
            'link_shareloc' => $request->link_shareloc,
            'file_sertifikat_url' => $request->file_sertifikat_url,
            'file_ktp_url' => $request->file_ktp_url,
            'file_foto_bangunan_url' => $request->file_foto_bangunan_url,
        ]);

        return response()->json($berkas, 201);
    }

    /**
     * PUT /api/berkas/{id}
     * Update data berkas
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $allowed = [
            'no_hak', 'no_su_tahun', 'link_shareloc', 'status',
            'catatan_penolakan', 'rejected_from_status',
            'file_sertifikat_url', 'file_ktp_url', 'file_foto_bangunan_url',
        ];

        $berkas->update($request->only($allowed));

        return response()->json($berkas);
    }

    /**
     * PUT /api/berkas/{id}/status
     * Update status berkas (admin only)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', Berkas::STATUSES),
            'catatan_penolakan' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $berkas = Berkas::findOrFail($id);

        $updates = [
            'status' => $request->status,
            'validated_by' => $user->id,
            'validated_at' => now(),
        ];

        if ($request->catatan_penolakan) {
            $updates['catatan_penolakan'] = $request->catatan_penolakan;
        }

        if ($request->status === 'Ditolak') {
            $updates['rejected_from_status'] = $berkas->status;
        }

        // Clear rejection notes when moving to non-rejected status
        if ($request->status !== 'Ditolak') {
            $updates['catatan_penolakan'] = null;
            $updates['rejected_from_status'] = null;
        }

        $berkas->update($updates);

        // Log validation action
        ValidationLog::create([
            'berkas_id' => $id,
            'admin_id' => $user->id,
            'action' => $request->status,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($berkas->fresh());
    }

    /**
     * DELETE /api/berkas/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Delete associated files from storage
        foreach (['file_sertifikat_url', 'file_ktp_url', 'file_foto_bangunan_url'] as $field) {
            if ($berkas->$field && Storage::disk('public')->exists($berkas->$field)) {
                Storage::disk('public')->delete($berkas->$field);
            }
        }

        $berkas->delete();

        return response()->json(['message' => 'Berkas berhasil dihapus']);
    }

    /**
     * GET /api/berkas/stats
     * Statistik berkas
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Berkas::query();
        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $all = $query->get();

        $stats = [
            'total' => $all->count(),
            'proses' => $all->where('status', 'Proses')->count(),
            'validasi_su' => $all->where('status', 'Validasi SU & Bidang')->count(),
            'validasi_bt' => $all->where('status', 'Validasi BT')->count(),
            'selesai' => $all->where('status', 'Selesai')->count(),
            'ditolak' => $all->where('status', 'Ditolak')->count(),
        ];

        // Admin stats: include admin validation counts
        if ($user->isAdmin()) {
            $adminCounts = ValidationLog::selectRaw('admin_id, count(*) as total')
                ->groupBy('admin_id')
                ->pluck('total', 'admin_id');

            $stats['admin_counts'] = $adminCounts;
        }

        return response()->json($stats);
    }

    /**
     * GET /api/berkas/today-count
     * Jumlah berkas yang disubmit hari ini oleh user yang login
     */
    public function todayCount(Request $request): JsonResponse
    {
        $count = Berkas::byUser($request->user()->id)
            ->createdToday()
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * GET /api/berkas/{id}/timeline
     * Timeline validasi berkas
     */
    public function timeline(string $id): JsonResponse
    {
        $logs = ValidationLog::where('berkas_id', $id)
            ->with('admin.profile')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                return [
                    'action' => $log->action,
                    'admin_name' => $log->admin?->profile?->name ?? 'Unknown',
                    'admin_email' => $log->admin?->email ?? '',
                    'timestamp' => $log->created_at->toISOString(),
                    'ip_address' => $log->ip_address ?? '',
                ];
            });

        return response()->json($logs);
    }

    /**
     * DELETE /api/berkas/{id}/files
     * Hapus semua file terkait berkas
     */
    public function deleteFiles(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        foreach (['file_sertifikat_url', 'file_ktp_url', 'file_foto_bangunan_url'] as $field) {
            if ($berkas->$field && Storage::disk('public')->exists($berkas->$field)) {
                Storage::disk('public')->delete($berkas->$field);
            }
        }

        $berkas->update([
            'file_sertifikat_url' => null,
            'file_ktp_url' => null,
            'file_foto_bangunan_url' => null,
        ]);

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
