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
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return [
                    'message' => 'Ukuran file melebihi batas upload server. Sistem dapat memakai upload bertahap sebagai cadangan.',
                    'status' => 413,
                    'code' => 'upload_transport_failed',
                ];

            case UPLOAD_ERR_PARTIAL:
                return [
                    'message' => 'Upload file terputus di tengah proses. Sistem dapat memakai upload bertahap sebagai cadangan.',
                    'status' => 422,
                    'code' => 'upload_transport_failed',
                ];

            case UPLOAD_ERR_NO_FILE:
                return [
                    'message' => 'File wajib diunggah',
                    'status' => 422,
                    'code' => 'file_required',
                ];

            case UPLOAD_ERR_NO_TMP_DIR:
            case UPLOAD_ERR_CANT_WRITE:
            case UPLOAD_ERR_EXTENSION:
                return [
                    'message' => 'Server gagal memproses upload file biasa. Sistem dapat memakai upload bertahap sebagai cadangan.',
                    'status' => 500,
                    'code' => 'upload_transport_failed',
                ];

            default:
                return [
                    'message' => 'Upload file gagal di server. Sistem dapat memakai upload bertahap sebagai cadangan.',
                    'status' => 422,
                    'code' => 'upload_transport_failed',
                ];
        }
    }

    private function getChunkRequestValue(Request $request, string $inputKey, string $headerKey): string
    {
        $value = $request->input($inputKey, $request->query($inputKey));

        if ($value === null || $value === '') {
            $value = $request->header($headerKey, '');
        }

        return is_string($value) ? trim($value) : '';
    }

    private function validateChunkRequest(Request $request): ?array
    {
        $type = $this->getChunkRequestValue($request, 'type', 'X-Upload-Type');
        $uploadId = preg_replace('/[^a-zA-Z0-9\-_]/', '', $this->getChunkRequestValue($request, 'upload_id', 'X-Upload-Id'));
        $chunkIndex = filter_var($this->getChunkRequestValue($request, 'chunk_index', 'X-Chunk-Index'), FILTER_VALIDATE_INT);
        $totalChunks = filter_var($this->getChunkRequestValue($request, 'total_chunks', 'X-Total-Chunks'), FILTER_VALIDATE_INT);
        $fileName = basename($this->getChunkRequestValue($request, 'file_name', 'X-File-Name'));

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

    private function readChunkBinaryContent(Request $request): ?string
    {
        $chunkBase64 = $request->input('chunk_base64', $request->input('chunkBase64'));
        if (is_string($chunkBase64) && trim($chunkBase64) !== '') {
            $normalizedBase64 = preg_replace('/^data:[^;]+;base64,/', '', trim($chunkBase64));
            $decoded = base64_decode(str_replace(' ', '+', $normalizedBase64), true);

            if (is_string($decoded) && $decoded !== '') {
                return $decoded;
            }

            return null;
        }

        if ($request->hasFile('chunk')) {
            $chunkFile = $request->file('chunk');
            if ($chunkFile && $chunkFile->isValid()) {
                $binaryContent = @file_get_contents($chunkFile->getRealPath());
                if (is_string($binaryContent) && $binaryContent !== '') {
                    return $binaryContent;
                }
            }
        }

        $binaryContent = $request->getContent();
        if (is_string($binaryContent) && $binaryContent !== '') {
            return $binaryContent;
        }

        $rawInput = @file_get_contents('php://input');
        if (is_string($rawInput) && $rawInput !== '') {
            return $rawInput;
        }

        return null;
    }

    private function validateAssembledFile(string $assembledPath, string $type, string $ext): ?string
    {
        if (!file_exists($assembledPath)) {
            return 'File sementara tidak ditemukan';
        }

        if ($type === 'sertifikat') {
            $header = @file_get_contents($assembledPath, false, null, 0, 5);
            if (!is_string($header) || strpos($header, '%PDF-') !== 0 || $ext !== 'pdf') {
                return 'File sertifikat hasil upload tidak valid. Silakan ulangi upload PDF.';
            }

            return null;
        }

        $imageInfo = @getimagesize($assembledPath);
        $allowedMimes = ['image/jpeg', 'image/png'];
        if (!is_array($imageInfo) || !isset($imageInfo['mime']) || !in_array($imageInfo['mime'], $allowedMimes, true)) {
            return 'File gambar hasil upload tidak valid. Silakan ulangi upload JPG/PNG.';
        }

        if (!in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
            return 'Ekstensi file gambar tidak valid. Silakan ulangi upload JPG/PNG.';
        }

        return null;
    }

    private function ensureDirectory(string $dirPath): bool
    {
        return is_dir($dirPath) || (@mkdir($dirPath, 0775, true) && is_dir($dirPath));
    }

    private function normalizeStoredPath(string $path): string
    {
        $fullPath = trim(urldecode($path));

        if ($fullPath === '') {
            return '';
        }

        if (preg_match('/^https?:\/\//i', $fullPath)) {
            $parsedPath = parse_url($fullPath, PHP_URL_PATH);
            if (is_string($parsedPath) && $parsedPath !== '') {
                $fullPath = $parsedPath;
            }
        }

        $storagePosition = stripos($fullPath, '/storage/');
        if ($storagePosition !== false) {
            $fullPath = substr($fullPath, $storagePosition + 9);
        }

        return ltrim(preg_replace('/^public\//i', '', $fullPath), '/');
    }

    private function cleanupChunkDirectory(string $dirPath): void
    {
        if (!is_dir($dirPath)) {
            return;
        }

        $files = @scandir($dirPath);
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }

                $fullPath = $dirPath . DIRECTORY_SEPARATOR . $file;
                if (is_dir($fullPath)) {
                    $this->cleanupChunkDirectory($fullPath);
                } elseif (file_exists($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        @rmdir($dirPath);
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

        $binaryContent = $this->readChunkBinaryContent($request);
        if (!is_string($binaryContent) || $binaryContent === '') {
            return response()->json(['error' => 'Chunk kosong atau tidak valid'], 422);
        }

        if (strlen($binaryContent) > self::MAX_CHUNK_SIZE_BYTES) {
            return response()->json(['error' => 'Ukuran chunk melebihi 1MB'], 422);
        }

        $chunkDir = storage_path('app/chunks/' . $user->id . '/' . $uploadId);
        if (!$this->ensureDirectory($chunkDir)) {
            return response()->json(['error' => 'Gagal menyiapkan direktori chunk'], 500);
        }

        $chunkFilePath = $chunkDir . '/' . str_pad((string) $chunkIndex, 5, '0', STR_PAD_LEFT) . '.chunk';
        $storedChunk = @file_put_contents($chunkFilePath, $binaryContent, LOCK_EX);
        if ($storedChunk === false) {
            return response()->json(['error' => 'Gagal menyimpan chunk file sementara'], 500);
        }

        if ($chunkIndex < ($totalChunks - 1)) {
            return response()->json([
                'uploaded' => true,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
            ]);
        }

        $assembledPath = $chunkDir . '/assembled.part';
        $writeHandle = @fopen($assembledPath, 'wb');
        if ($writeHandle === false) {
            $this->cleanupChunkDirectory($chunkDir);
            return response()->json(['error' => 'Gagal menyiapkan file sementara'], 500);
        }

        $finalSize = 0;

        try {
            for ($index = 0; $index < $totalChunks; $index++) {
                $partPath = $chunkDir . '/' . str_pad((string) $index, 5, '0', STR_PAD_LEFT) . '.chunk';
                if (!file_exists($partPath)) {
                    fclose($writeHandle);
                    $this->cleanupChunkDirectory($chunkDir);
                    return response()->json(['error' => 'Chunk upload belum lengkap. Silakan ulangi upload file.'], 422);
                }

                $readHandle = @fopen($partPath, 'rb');
                if ($readHandle === false) {
                    fclose($writeHandle);
                    $this->cleanupChunkDirectory($chunkDir);
                    return response()->json(['error' => 'Gagal membaca potongan file sementara'], 500);
                }

                while (!feof($readHandle)) {
                    $buffer = fread($readHandle, 8192);
                    if ($buffer === false) {
                        fclose($readHandle);
                        fclose($writeHandle);
                        $this->cleanupChunkDirectory($chunkDir);
                        return response()->json(['error' => 'Gagal merakit potongan file'], 500);
                    }

                    if ($buffer === '') {
                        continue;
                    }

                    $finalSize += strlen($buffer);
                    if ($finalSize > self::MAX_FILE_SIZE_BYTES) {
                        fclose($readHandle);
                        fclose($writeHandle);
                        $this->cleanupChunkDirectory($chunkDir);
                        return response()->json(['error' => 'Ukuran file maksimal 5MB'], 422);
                    }

                    if (fwrite($writeHandle, $buffer) === false) {
                        fclose($readHandle);
                        fclose($writeHandle);
                        $this->cleanupChunkDirectory($chunkDir);
                        return response()->json(['error' => 'Gagal merakit file sementara'], 500);
                    }
                }

                fclose($readHandle);
            }

            fclose($writeHandle);

            $assembledValidationError = $this->validateAssembledFile($assembledPath, $type, $ext);
            if ($assembledValidationError) {
                $this->cleanupChunkDirectory($chunkDir);
                return response()->json(['error' => $assembledValidationError], 422);
            }

            $finalPath = $user->id . '/' . $type . '/' . now()->format('YmdHis') . '-' . uniqid('', true) . '.' . $ext;
            Storage::disk('public')->makeDirectory($user->id . '/' . $type);

            $stream = fopen($assembledPath, 'rb');
            if ($stream === false) {
                $this->cleanupChunkDirectory($chunkDir);
                return response()->json(['error' => 'Gagal membaca file sementara'], 500);
            }

            $stored = Storage::disk('public')->put($finalPath, $stream);
            fclose($stream);
            $this->cleanupChunkDirectory($chunkDir);

            if (!$stored) {
                return response()->json(['error' => 'Gagal menyimpan file akhir ke storage'], 500);
            }

            return response()->json([
                'path' => $finalPath,
                'url' => Storage::disk('public')->url($finalPath),
            ]);
        } catch (\Throwable $e) {
            if (is_resource($writeHandle)) {
                fclose($writeHandle);
            }
            $this->cleanupChunkDirectory($chunkDir);
            return response()->json(['error' => 'Gagal menyelesaikan upload bertahap: ' . $e->getMessage()], 500);
        }
    }

    public function download(Request $request, $path)
    {
        $fullPath = $this->normalizeStoredPath($path);

        if ($fullPath === '' || !Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return Storage::disk('public')->download($fullPath);
    }

    public function getUrl(Request $request, $path)
    {
        $fullPath = $this->normalizeStoredPath($path);

        if ($fullPath === '' || !Storage::disk('public')->exists($fullPath)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        $url = Storage::disk('public')->url($fullPath);

        return response()->json(['url' => $url]);
    }

    public function destroy(Request $request, $path)
    {
        $fullPath = $this->normalizeStoredPath($path);

        if ($fullPath !== '' && Storage::disk('public')->exists($fullPath)) {
            Storage::disk('public')->delete($fullPath);
        }

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
