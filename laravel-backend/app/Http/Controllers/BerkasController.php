<?php

namespace App\Http\Controllers;

use App\Models\Berkas;
use App\Models\ValidationLog;
use Illuminate\Http\Request;

class BerkasController extends Controller
{
    // GET /api/berkas
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $berkas = Berkas::orderBy('created_at', 'desc')->get();
        } else {
            $berkas = Berkas::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($berkas);
    }

    // GET /api/berkas/{id}
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        // Check access
        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($berkas);
    }

    // POST /api/berkas
    public function store(Request $request)
    {
        $request->validate([
            'nama_pemegang_hak' => 'required|string',
            'no_hak' => 'required|string|min:5',
            'no_su_tahun' => 'required|string',
            'jenis_hak' => 'required|in:HM,HGB,HP,HGU,HMSRS,HPL,HW',
            'kecamatan' => 'required|string',
            'desa' => 'required|string',
            'no_telepon' => 'nullable|string',
            'nama_pemilik_sertifikat' => 'nullable|string',
            'no_wa_pemohon' => 'nullable|string',
            'link_shareloc' => 'nullable|string',
        ]);

        // Check daily limit (5 per day for non-super_user)
        $user = $request->user();
        $role = $user->getRole();

        if ($role !== 'super_user') {
            $todayCount = Berkas::where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->count();

            if ($todayCount >= 5) {
                return response()->json(['error' => 'Kuota harian sudah habis (maks 5)'], 429);
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

    // PUT /api/berkas/{id}
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $berkas->update($request->only([
            'no_hak', 'no_su_tahun', 'link_shareloc', 'status',
            'catatan_penolakan', 'rejected_from_status',
            'file_sertifikat_url', 'file_ktp_url', 'file_foto_bangunan_url',
        ]));

        return response()->json($berkas);
    }

    // PUT /api/berkas/{id}/status
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:Proses,Validasi SU & Bidang,Validasi BT,Selesai,Ditolak',
            'catatan_penolakan' => 'nullable|string',
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

        $berkas->update($updates);

        // Log validation action
        ValidationLog::create([
            'berkas_id' => $id,
            'admin_id' => $user->id,
            'action' => $request->status,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($berkas);
    }

    // DELETE /api/berkas/{id}
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $berkas = Berkas::findOrFail($id);

        if (!$user->isAdmin() && $berkas->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Delete associated files from storage
        foreach (['file_sertifikat_url', 'file_ktp_url', 'file_foto_bangunan_url'] as $field) {
            if ($berkas->$field) {
                \Storage::disk('public')->delete($berkas->$field);
            }
        }

        $berkas->delete();
        return response()->json(['message' => 'Berkas dihapus']);
    }

    // GET /api/berkas/stats
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $all = Berkas::all();
        } else {
            $all = Berkas::where('user_id', $user->id)->get();
        }

        return response()->json([
            'total' => $all->count(),
            'proses' => $all->where('status', 'Proses')->count(),
            'validasi_su' => $all->where('status', 'Validasi SU & Bidang')->count(),
            'validasi_bt' => $all->where('status', 'Validasi BT')->count(),
            'selesai' => $all->where('status', 'Selesai')->count(),
            'ditolak' => $all->where('status', 'Ditolak')->count(),
        ]);
    }

    // GET /api/berkas/today-count
    public function todayCount(Request $request)
    {
        $count = Berkas::where('user_id', $request->user()->id)
            ->whereDate('created_at', today())
            ->count();

        return response()->json(['count' => $count]);
    }

    // GET /api/berkas/{id}/timeline
    public function timeline(string $id)
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
                    'timestamp' => $log->created_at,
                    'ip_address' => $log->ip_address ?? '',
                ];
            });

        return response()->json($logs);
    }
}
