<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
            'type' => 'required|in:sertifikat,ktp,foto-bangunan',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $type = $request->type;

        if ($type === 'sertifikat') {
            $allowedPdf = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($file->getMimeType(), $allowedPdf) && $ext !== 'pdf') {
                return response()->json(['error' => 'File sertifikat harus berformat PDF'], 422);
            }
        } elseif (in_array($type, ['ktp', 'foto-bangunan'])) {
            $allowedImg = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];
            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($file->getMimeType(), $allowedImg) && !in_array($ext, ['jpg', 'jpeg', 'png'])) {
                return response()->json(['error' => 'File harus berformat JPG/JPEG/PNG'], 422);
            }
        }

        $timestamp = time();
        $ext = $file->getClientOriginalExtension();
        $path = $user->id . '/' . $type . '/' . $timestamp . '.' . $ext;

        try {
            $stored = Storage::disk('public')->putFileAs('', $file, $path);
            if (!$stored) {
                return response()->json(['error' => 'Gagal menyimpan file ke storage. Periksa izin direktori server.'], 500);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menyimpan file: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    public function download(Request $request, $path)
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return Storage::disk('public')->download($fullPath);
    }

    public function getUrl(Request $request, $path)
    {
        $fullPath = urldecode($path);

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        $url = Storage::disk('public')->url($fullPath);

        return response()->json(['url' => $url]);
    }

    public function destroy(Request $request, $path)
    {
        $fullPath = urldecode($path);

        if (Storage::disk('public')->exists($fullPath)) {
            Storage::disk('public')->delete($fullPath);
        }

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
