<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * POST /api/files/upload
     * Upload file ke storage lokal
     * 
     * Request: multipart/form-data
     * - file: File (max 5MB)
     * - type: sertifikat | ktp | foto-bangunan
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:5120', // 5MB
            'type' => 'required|in:sertifikat,ktp,foto-bangunan',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $type = $request->type;

        // Validate file type based on type
        if ($type === 'sertifikat') {
            if ($file->getMimeType() !== 'application/pdf') {
                return response()->json(['error' => 'File sertifikat harus berformat PDF'], 422);
            }
        } elseif (in_array($type, ['ktp', 'foto-bangunan'])) {
            if (!in_array($file->getMimeType(), ['image/jpeg', 'image/jpg', 'image/pjpeg'])) {
                return response()->json(['error' => 'File harus berformat JPG/JPEG'], 422);
            }
        }

        $timestamp = time();
        $ext = $file->getClientOriginalExtension();
        $path = "{$user->id}/{$type}/{$timestamp}.{$ext}";

        Storage::disk('public')->putFileAs('', $file, $path);

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    /**
     * GET /api/files/download/{path}
     * Download file langsung (binary response)
     */
    public function download(Request $request, string $path)
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return Storage::disk('public')->download($fullPath);
    }

    /**
     * GET /api/files/url/{path}
     * Dapatkan URL file untuk preview/download
     */
    public function getUrl(Request $request, string $path): JsonResponse
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        $url = Storage::disk('public')->url($fullPath);

        return response()->json(['url' => $url]);
    }

    /**
     * DELETE /api/files/{path}
     * Hapus file dari storage
     */
    public function destroy(Request $request, string $path): JsonResponse
    {
        $fullPath = urldecode($path);

        if (Storage::disk('public')->exists($fullPath)) {
            Storage::disk('public')->delete($fullPath);
        }

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
