<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    private const MAX_FILE_SIZE_BYTES = 5242880;
    private const MAX_CHUNK_SIZE_BYTES = 1048576;

    private function validateTypeAndExtension(string $type, string $ext): ?string
    {
        $ext = strtolower($ext);

        if ($type === 'sertifikat' && $ext !== 'pdf') {
            return 'File sertifikat harus berformat PDF';
        }

        if (in_array($type, ['ktp', 'foto-bangunan'], true) && !in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
            return 'File harus berformat JPG/JPEG/PNG';
        }

        return null;
    }

    private function uploadErrorResponse(string $message, int $status = 422, ?string $code = null)
    {
        $payload = ['error' => $message];

        if ($code) {
            $payload['code'] = $code;
        }

        return response()->json($payload, $status);
    }

    private function resolvePhpUploadError(?int $errorCode): array
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => [
                'message' => 'Ukuran file melebihi batas upload server. Sistem dapat memakai upload bertahap sebagai cadangan.',
                'status' => 413,
                'code' => 'upload_transport_failed',
            ],
            UPLOAD_ERR_PARTIAL => [
                'message' => 'Upload file terputus di tengah proses. Sistem dapat memakai upload bertahap sebagai cadangan.',
                'status' => 422,
                'code' => 'upload_transport_failed',
            ],
            UPLOAD_ERR_NO_FILE => [
                'message' => 'File wajib diunggah',
                'status' => 422,
                'code' => 'file_required',
            ],
            UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION => [
                'message' => 'Server gagal memproses upload file biasa. Sistem dapat memakai upload bertahap sebagai cadangan.',
                'status' => 500,
                'code' => 'upload_transport_failed',
            ],
            default => [
                'message' => 'Upload file gagal di server. Sistem dapat memakai upload bertahap sebagai cadangan.',
                'status' => 422,
                'code' => 'upload_transport_failed',
            ],
        };
    }

    private function validateChunkRequest(Request $request): ?array
    {
        $type = (string) $request->query('type');
        $uploadId = preg_replace('/[^a-zA-Z0-9\-_]/', '', (string) $request->query('upload_id'));
        $chunkIndex = filter_var($request->query('chunk_index'), FILTER_VALIDATE_INT);
        $totalChunks = filter_var($request->query('total_chunks'), FILTER_VALIDATE_INT);
        $fileName = basename((string) $request->query('file_name'));

        if (!in_array($type, ['sertifikat', 'ktp', 'foto-bangunan'], true)) {
            return ['error' => 'Tipe file tidak valid', 'status' => 422];
        }

        if (!$uploadId || strlen($uploadId) > 100) {
            return ['error' => 'upload_id tidak valid', 'status' => 422];
        }

        if ($chunkIndex === false || $chunkIndex < 0) {
            return ['error' => 'chunk_index tidak valid', 'status' => 422];
        }

        if ($totalChunks === false || $totalChunks < 1 || $totalChunks > 200) {
            return ['error' => 'total_chunks tidak valid', 'status' => 422];
        }

        if ($fileName === '' || strlen($fileName) > 255) {
            return ['error' => 'file_name tidak valid', 'status' => 422];
        }

        return [
            'type' => $type,
            'upload_id' => $uploadId,
            'chunk_index' => $chunkIndex,
            'total_chunks' => $totalChunks,
            'file_name' => $fileName,
        ];
    }

    public function upload(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sertifikat,ktp,foto-bangunan',
        ]);

        $user = $request->user();
        $type = (string) $request->input('type');

        if (!$request->hasFile('file')) {
            $errorMeta = $this->resolvePhpUploadError($_FILES['file']['error'] ?? null);
            return $this->uploadErrorResponse($errorMeta['message'], $errorMeta['status'], $errorMeta['code']);
        }

        $file = $request->file('file');
        if (!$file || !$file->isValid()) {
            $errorMeta = $this->resolvePhpUploadError($file ? $file->getError() : ($_FILES['file']['error'] ?? null));
            return $this->uploadErrorResponse($errorMeta['message'], $errorMeta['status'], $errorMeta['code']);
        }

        if (($file->getSize() ?? 0) > self::MAX_FILE_SIZE_BYTES) {
            return $this->uploadErrorResponse('Ukuran file maksimal 5MB', 422, 'file_too_large');
        }

        $ext = strtolower($file->getClientOriginalExtension());
        $typeError = $this->validateTypeAndExtension($type, $ext);
        if ($typeError) {
            return $this->uploadErrorResponse($typeError, 422, 'invalid_file_type');
        }

        if ($type === 'sertifikat') {
            $allowedPdf = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
            if (!in_array($file->getMimeType(), $allowedPdf, true) && $ext !== 'pdf') {
                return $this->uploadErrorResponse('File sertifikat harus berformat PDF', 422, 'invalid_file_type');
            }
        } else {
            $allowedImg = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];
            if (!in_array($file->getMimeType(), $allowedImg, true) && !in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
                return $this->uploadErrorResponse('File harus berformat JPG/JPEG/PNG', 422, 'invalid_file_type');
            }
        }

        $timestamp = now()->format('YmdHis');
        $path = $user->id . '/' . $type . '/' . $timestamp . '-' . uniqid('', true) . '.' . $ext;

        try {
            Storage::disk('public')->makeDirectory($user->id . '/' . $type);
            $stored = Storage::disk('public')->putFileAs('', $file, $path);
            if (!$stored) {
                return $this->uploadErrorResponse('Gagal menyimpan file ke storage. Periksa izin direktori server.', 500, 'storage_write_failed');
            }
        } catch (\Throwable $e) {
            return $this->uploadErrorResponse('Gagal menyimpan file: ' . $e->getMessage(), 500, 'storage_write_failed');
        }

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    public function uploadChunk(Request $request)
    {
        $validated = $this->validateChunkRequest($request);
        if (isset($validated['error'])) {
            return response()->json(['error' => $validated['error']], $validated['status']);
        }

        $user = $request->user();
        $type = $validated['type'];
        $uploadId = $validated['upload_id'];
        $chunkIndex = $validated['chunk_index'];
        $totalChunks = $validated['total_chunks'];
        $fileName = $validated['file_name'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $typeError = $this->validateTypeAndExtension($type, $ext);
        if ($typeError) {
            return response()->json(['error' => $typeError], 422);
        }

        $binaryContent = $request->getContent();
        if (!is_string($binaryContent) || $binaryContent === '') {
            return response()->json(['error' => 'Chunk kosong atau tidak valid'], 422);
        }

        if (strlen($binaryContent) > self::MAX_CHUNK_SIZE_BYTES) {
            return response()->json(['error' => 'Ukuran chunk melebihi 1MB'], 422);
        }

        $chunkDir = storage_path('app/chunks/' . $user->id);
        if (!is_dir($chunkDir) && !@mkdir($chunkDir, 0775, true) && !is_dir($chunkDir)) {
            return response()->json(['error' => 'Gagal menyiapkan direktori chunk'], 500);
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
        if ($finalSize === false || $finalSize > self::MAX_FILE_SIZE_BYTES) {
            @unlink($tempFile);
            return response()->json(['error' => 'Ukuran file maksimal 5MB'], 422);
        }

        $finalPath = $user->id . '/' . $type . '/' . now()->format('YmdHis') . '-' . uniqid('', true) . '.' . $ext;

        try {
            Storage::disk('public')->makeDirectory($user->id . '/' . $type);
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
        } catch (\Throwable $e) {
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
