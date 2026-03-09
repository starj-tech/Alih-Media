<?php

namespace App\Http\Controllers;

use App\Models\ValidationLog;
use Illuminate\Http\Request;

class ValidationLogController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $logs = ValidationLog::with('admin.profile')
            ->orderBy('created_at', 'desc')
            ->limit(1000)
            ->get()
            ->map(function ($log) {
                $admin = $log->admin;
                $profile = $admin ? $admin->profile : null;
                return [
                    'id' => $log->id,
                    'berkas_id' => $log->berkas_id,
                    'admin_id' => $log->admin_id,
                    'admin_name' => $profile ? $profile->name : 'Unknown',
                    'admin_email' => $admin ? $admin->email : '',
                    'action' => $log->action,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toISOString(),
                ];
            });

        return response()->json($logs);
    }

    public function myCount(Request $request)
    {
        $count = ValidationLog::where('admin_id', $request->user()->id)->count();
        return response()->json(['count' => $count]);
    }

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

    public function byBerkas(Request $request, $berkasId)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $logs = ValidationLog::where('berkas_id', $berkasId)
            ->with('admin.profile')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                $admin = $log->admin;
                $profile = $admin ? $admin->profile : null;
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'admin_name' => $profile ? $profile->name : 'Unknown',
                    'admin_email' => $admin ? $admin->email : '',
                    'timestamp' => $log->created_at->toISOString(),
                    'ip_address' => $log->ip_address ? $log->ip_address : '',
                ];
            });

        return response()->json($logs);
    }
}
