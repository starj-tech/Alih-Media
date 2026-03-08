<?php

namespace App\Http\Controllers;

use App\Models\ValidationLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ValidationLogController extends Controller
{
    /**
     * GET /api/validation-logs
     * Semua log validasi (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $logs = ValidationLog::with('admin.profile')
            ->orderBy('created_at', 'desc')
            ->limit(1000)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'berkas_id' => $log->berkas_id,
                    'admin_id' => $log->admin_id,
                    'admin_name' => $log->admin?->profile?->name ?? 'Unknown',
                    'admin_email' => $log->admin?->email ?? '',
                    'action' => $log->action,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toISOString(),
                ];
            });

        return response()->json($logs);
    }

    /**
     * GET /api/validation-logs/my-count
     * Jumlah validasi oleh admin yang login
     */
    public function myCount(Request $request): JsonResponse
    {
        $count = ValidationLog::where('admin_id', $request->user()->id)->count();

        return response()->json(['count' => $count]);
    }

    /**
     * GET /api/validation-logs/admin-counts
     * Jumlah validasi per admin
     */
    public function adminCounts(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $counts = ValidationLog::selectRaw('admin_id, count(*) as total')
            ->groupBy('admin_id')
            ->pluck('total', 'admin_id');

        return response()->json($counts);
    }

    /**
     * GET /api/validation-logs/berkas/{berkasId}
     * Log validasi untuk satu berkas tertentu
     */
    public function byBerkas(Request $request, string $berkasId): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $logs = ValidationLog::where('berkas_id', $berkasId)
            ->with('admin.profile')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'admin_name' => $log->admin?->profile?->name ?? 'Unknown',
                    'admin_email' => $log->admin?->email ?? '',
                    'timestamp' => $log->created_at->toISOString(),
                    'ip_address' => $log->ip_address ?? '',
                ];
            });

        return response()->json($logs);
    }
}
