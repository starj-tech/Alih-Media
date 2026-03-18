<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    private function validateTypeAndExtension(string $type, string $ext): ?string
    {
        $ext = strtolower($ext);

        if ($type === 'sertifikat' && $ext !== 'pdf') {
            return 'File sertifikat harus berformat PDF';
        }

        if (in_array($type, ['ktp', 'foto-bangunan']) && !in_array($ext, ['jpg', 'jpeg', 'png'])) {
            return 'File harus berformat JPG/JPEG/PNG';
        }

        return null;
    }

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
        $ext = strtolower($file->getClientOriginalExtension());
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

    public function uploadChunk(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sertifikat,ktp,foto-bangunan',
            'upload_id' => 'required|string|max:100',
            'chunk_index' => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1|max:200',
            'file_name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $type = (string) $request->query('type');
        $uploadId = preg_replace('/[^a-zA-Z0-9\-_]/', '', (string) $request->query('upload_id'));
        $chunkIndex = (int) $request->query('chunk_index');
        $totalChunks = (int) $request->query('total_chunks');
        $fileName = basename((string) $request->query('file_name'));
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if (!$uploadId) {
            return response()->json(['error' => 'upload_id tidak valid'], 422);
        }

        $typeError = $this->validateTypeAndExtension($type, $ext);
        if ($typeError) {
            return response()->json(['error' => $typeError], 422);
        }

        $binaryContent = $request->getContent();
        if (!is_string($binaryContent) || $binaryContent === '') {
            return response()->json(['error' => 'Chunk kosong atau tidak valid'], 422);
        }

        if (strlen($binaryContent) > 1024 * 1024) {
            return response()->json(['error' => 'Ukuran chunk melebihi 1MB'], 422);
        }

        $chunkDir = storage_path('app/chunks/' . $user->id);
        if (!is_dir($chunkDir)) {
            @mkdir($chunkDir, 0775, true);
        }

        $tempFile = $chunkDir . '/' . $uploadId . '.part';
        if ($chunkIndex === 0 && file_exists($tempFile)) {
            @unlink($tempFile);
        }

        $appendResult = @file_put_contents($tempFile, $binaryContent, FILE_APPEND | LOCK_EX);
        if ($appendResult === false) {
            return response()->json(['error' => 'Gagal menyimpan chunk file sementara'], 500);
        }

        if ($chunkIndex < ($totalChunks - 1)) {
            return response()->json([
                'uploaded' => true,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
            ]);
        }

        if (!file_exists($tempFile)) {
            return response()->json(['error' => 'File sementara tidak ditemukan'], 500);
        }

        $finalSize = filesize($tempFile);
        if ($finalSize === false || $finalSize > 5 * 1024 * 1024) {
            @unlink($tempFile);
            return response()->json(['error' => 'Ukuran file maksimal 5MB'], 422);
        }

        $timestamp = time();
        $finalPath = $user->id . '/' . $type . '/' . $timestamp . '.' . $ext;

        try {
            $stream = fopen($tempFile, 'rb');
            if ($stream === false) {
                @unlink($tempFile);
                return response()->json(['error' => 'Gagal membaca file sementara'], 500);
            }

            $stored = Storage::disk('public')->put($finalPath, $stream);
            fclose($stream);
            @unlink($tempFile);

            if (!$stored) {
                return response()->json(['error' => 'Gagal menyimpan file akhir ke storage'], 500);
            }

            return response()->json([
                'path' => $finalPath,
                'url' => Storage::disk('public')->url($finalPath),
            ]);
        } catch (\Exception $e) {
            @unlink($tempFile);
            return response()->json(['error' => 'Gagal menyelesaikan upload bertahap: ' . $e->getMessage()], 500);
        }
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
