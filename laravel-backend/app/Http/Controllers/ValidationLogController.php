<?php

namespace App\Http\Controllers;

use App\Models\ValidationLog;
use Illuminate\Http\Request;

class ValidationLogController extends Controller
{
    // GET /api/validation-logs
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $logs = ValidationLog::with('admin.profile')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'berkas_id' => $log->berkas_id,
                    'admin_id' => $log->admin_id,
                    'admin_name' => $log->admin?->profile?->name ?? 'Unknown',
                    'action' => $log->action,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json($logs);
    }

    // GET /api/validation-logs/my-count
    public function myCount(Request $request)
    {
        $count = ValidationLog::where('admin_id', $request->user()->id)->count();
        return response()->json(['count' => $count]);
    }

    // GET /api/validation-logs/admin-counts
    public function adminCounts(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $counts = ValidationLog::selectRaw('admin_id, count(*) as total')
            ->groupBy('admin_id')
            ->pluck('total', 'admin_id');

        return response()->json($counts);
    }
}
