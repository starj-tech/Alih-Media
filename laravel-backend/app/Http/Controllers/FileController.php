<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    // POST /api/files/upload
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120', // 5MB
            'type' => 'required|in:sertifikat,ktp,foto-bangunan',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $type = $request->type;

        // Validate file type
        if ($type === 'sertifikat' && $file->getMimeType() !== 'application/pdf') {
            return response()->json(['error' => 'Sertifikat harus berformat PDF'], 422);
        }

        if (in_array($type, ['ktp', 'foto-bangunan']) && !in_array($file->getMimeType(), ['image/jpeg', 'image/jpg'])) {
            return response()->json(['error' => 'File harus berformat JPG/JPEG'], 422);
        }

        $timestamp = time();
        $ext = $file->getClientOriginalExtension();
        $path = "{$user->id}/{$type}/{$timestamp}.{$ext}";

        Storage::disk('public')->putFileAs('', $file, $path);

        return response()->json(['path' => $path]);
    }

    // GET /api/files/{path}
    public function download(Request $request, string $path)
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return Storage::disk('public')->download($fullPath);
    }

    // GET /api/files/url/{path}
    public function getUrl(Request $request, string $path)
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        $url = Storage::disk('public')->url($fullPath);
        return response()->json(['url' => $url]);
    }

    // DELETE /api/files/{path}
    public function destroy(string $path)
    {
        $fullPath = urldecode($path);
        Storage::disk('public')->delete($fullPath);
        return response()->json(['message' => 'File dihapus']);
    }
}
