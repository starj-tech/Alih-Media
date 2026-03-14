<?php

namespace App\Http\Controllers;

use App\Models\Berkas;
use App\Models\ValidationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BerkasController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Berkas::query()->orderBy('created_at', 'desc');

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        // Status filter (supports comma-separated for multiple statuses)
        if ($request->has('status') && $request->status !== '' && $request->status !== 'all') {
            $statuses = explode(',', $request->status);
            if (count($statuses) === 1) {
                $query->where('status', $statuses[0]);
            } else {
                $query->whereIn('status', $statuses);
            }
        }

        if ($request->has('kecamatan') && $request->kecamatan !== '') {
            $query->where('kecamatan', $request->kecamatan);
        }
        if ($request->has('jenis_hak') && $request->jenis_hak !== '') {
            $query->where('jenis_hak', $request->jenis_hak);
        }

        // Pagination: default 50 per page, max 200
        $perPage = min((int) ($request->per_page ?? 50), 200);
        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($berkas);
    }

    public function store(Request $request)
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

        $noSuNumber = preg_replace('/\D/', '', explode('/', $request->no_su_tahun)[0]);
        if (strlen($noSuNumber) < 5) {
            return response()->json(['error' => 'No SU harus minimal 5 digit'], 422);
        }

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
            'no_telepon' => $request->no_telepon ? $request->no_telepon : '',
            'no_wa_pemohon' => $request->no_wa_pemohon,
            'link_shareloc' => $request->link_shareloc,
            'file_sertifikat_url' => $request->file_sertifikat_url,
            'file_ktp_url' => $request->file_ktp_url,
            'file_foto_bangunan_url' => $request->file_foto_bangunan_url,
        ]);

        return response()->json($berkas, 201);
    }

    public function update(Request $request, $id)
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

    public function updateStatus(Request $request, $id)
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

        if ($request->status !== 'Ditolak') {
            $updates['catatan_penolakan'] = null;
            $updates['rejected_from_status'] = null;
        }

        $berkas->update($updates);

        ValidationLog::create([
            'berkas_id' => $id,
            'admin_id' => $user->id,
            'action' => $request->status,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($berkas->fresh());
    }

    public function destroy(Request $request, $id)
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

        $berkas->delete();

        return response()->json(['message' => 'Berkas berhasil dihapus']);
    }

    /**
     * Optimized stats: uses COUNT(id) per status directly in DB, no ->get() all
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = Berkas::query();

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        // Single query with conditional counts per status
        $counts = $query->select(
            DB::raw("COUNT(id) as total"),
            DB::raw("COUNT(CASE WHEN status = 'Proses' THEN id END) as proses"),
            DB::raw("COUNT(CASE WHEN status = 'Validasi SU & Bidang' THEN id END) as validasi_su"),
            DB::raw("COUNT(CASE WHEN status = 'Validasi BT' THEN id END) as validasi_bt"),
            DB::raw("COUNT(CASE WHEN status = 'Selesai' THEN id END) as selesai"),
            DB::raw("COUNT(CASE WHEN status = 'Ditolak' THEN id END) as ditolak")
        )->first();

        $stats = [
            'total' => (int) $counts->total,
            'proses' => (int) $counts->proses,
            'validasi_su' => (int) $counts->validasi_su,
            'validasi_bt' => (int) $counts->validasi_bt,
            'selesai' => (int) $counts->selesai,
            'ditolak' => (int) $counts->ditolak,
        ];

        if ($user->isAdmin()) {
            $adminCounts = ValidationLog::selectRaw('admin_id, count(id) as total')
                ->groupBy('admin_id')
                ->pluck('total', 'admin_id');

            $stats['admin_counts'] = $adminCounts;
        }

        return response()->json($stats);
    }

    public function todayCount(Request $request)
    {
        $count = Berkas::byUser($request->user()->id)
            ->createdToday()
            ->count();

        return response()->json(['count' => $count]);
    }

    public function timeline($id)
    {
        $logs = ValidationLog::where('berkas_id', $id)
            ->with('admin.profile')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                $admin = $log->admin;
                $profile = $admin ? $admin->profile : null;
                return [
                    'action' => $log->action,
                    'admin_name' => $profile ? $profile->name : 'Unknown',
                    'admin_email' => $admin ? $admin->email : '',
                    'timestamp' => $log->created_at->toISOString(),
                    'ip_address' => $log->ip_address ? $log->ip_address : '',
                ];
            });

        return response()->json($logs);
    }

    public function deleteFiles(Request $request, $id)
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
