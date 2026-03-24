<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    private const MAX_FILE_SIZE_BYTES = 5242880;
    private const MAX_CHUNK_SIZE_BYTES = 1048576;

    private function buildPublicFileUrl($path)
    {
        $normalized = $this->normalizeStoredPath($path);
        $baseUrl = rtrim((string) config('app.url'), '/');
        $encodedSegments = array_map('rawurlencode', array_values(array_filter(explode('/', $normalized), function ($segment) {
            return $segment !== null && $segment !== '';
        })));

        return $baseUrl . '/storage/' . implode('/', $encodedSegments);
    }

    // ==========================================
    // STORAGE HEALTH DIAGNOSTIC
    // ==========================================

    public function storageHealth(Request $request)
    {
        $results = [];
        $results['timestamp'] = now()->toIso8601String();
        $results['app_url'] = config('app.url');
        $results['filesystem_disk'] = config('filesystems.default');
        $results['public_disk_root'] = config('filesystems.disks.public.root');
        $results['public_disk_url'] = config('filesystems.disks.public.url');

        // Auth check
        $user = $request->user();
        $results['auth'] = $user ? ['id' => $user->id, 'email' => $user->email] : 'not_authenticated';

        // Directory checks
        $dirs = [
            'storage/app' => storage_path('app'),
            'storage/app/public' => storage_path('app/public'),
            'storage/app/chunks' => storage_path('app/chunks'),
            'storage/logs' => storage_path('logs'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        foreach ($dirs as $label => $path) {
            $exists = is_dir($path);
            $writable = $exists && is_writable($path);
            $results['directories'][$label] = [
                'exists' => $exists,
                'writable' => $writable,
                'path' => $path,
            ];
        }

        // Symlink check
        $publicStorageLink = public_path('storage');
        if (is_link($publicStorageLink)) {
            $target = readlink($publicStorageLink);
            $results['public_storage_symlink'] = [
                'type' => 'symlink',
                'target' => $target,
                'target_exists' => is_dir($target),
            ];
        } elseif (is_dir($publicStorageLink)) {
            $results['public_storage_symlink'] = ['type' => 'directory'];
        } else {
            $results['public_storage_symlink'] = ['type' => 'missing'];
        }

        // Write test
        $testFile = 'write-test-' . time() . '.tmp';
        try {
            Storage::disk('public')->put($testFile, 'test');
            $writeOk = Storage::disk('public')->exists($testFile);
            Storage::disk('public')->delete($testFile);
            $results['write_test'] = $writeOk ? 'pass' : 'fail_not_found_after_write';
        } catch (\Throwable $e) {
            $results['write_test'] = 'fail: ' . $e->getMessage();
        }

        // Chunk dir write test
        $chunkTestDir = storage_path('app/chunks/test-' . time());
        try {
            if (!is_dir($chunkTestDir)) {
                @mkdir($chunkTestDir, 0775, true);
            }
            $chunkTestFile = $chunkTestDir . '/test.tmp';
            @file_put_contents($chunkTestFile, 'test');
            $chunkOk = file_exists($chunkTestFile);
            @unlink($chunkTestFile);
            @rmdir($chunkTestDir);
            $results['chunk_write_test'] = $chunkOk ? 'pass' : 'fail';
        } catch (\Throwable $e) {
            $results['chunk_write_test'] = 'fail: ' . $e->getMessage();
        }

        // Sample file lookup
        $sampleFiles = [];
        $publicRoot = storage_path('app/public');
        if (is_dir($publicRoot)) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($publicRoot, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );
            $count = 0;
            foreach ($iterator as $file) {
                if ($count >= 5) break;
                $relativePath = str_replace($publicRoot . '/', '', $file->getPathname());
                $sampleFiles[] = [
                    'path' => $relativePath,
                    'size' => $file->getSize(),
                    'exists_via_storage' => Storage::disk('public')->exists($relativePath),
                ];
                $count++;
            }
        }
        $results['sample_files'] = $sampleFiles;

        // PHP limits (crucial for upload debugging)
        $results['php_limits'] = [
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
        ];

        return response()->json($results);
    }

    // ==========================================
    // VALIDATION HELPERS
    // ==========================================

    private function validateTypeAndExtension($type, $ext)
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

    private function errorResponse($message, $status = 422, $code = null)
    {
        $payload = ['error' => $message];
        if ($code) $payload['code'] = $code;
        Log::warning("[FileController] Error: {$code} - {$message}");
        return response()->json($payload, $status);
    }

    // ==========================================
    // PATH RESOLUTION (LEGACY SUPPORT)
    // ==========================================

    /**
     * Normalize a stored path: strip absolute URLs, /storage/, public/ prefixes
     */
    private function normalizeStoredPath($path)
    {
        $fullPath = trim(urldecode($path));
        if ($fullPath === '') return '';

        // Strip full URL to just path
        if (preg_match('/^https?:\/\//i', $fullPath)) {
            $parsed = parse_url($fullPath, PHP_URL_PATH);
            if (is_string($parsed) && $parsed !== '') {
                $fullPath = $parsed;
            }
        }

        // Strip /storage/ prefix
        $pos = stripos($fullPath, '/storage/');
        if ($pos !== false) {
            $fullPath = substr($fullPath, $pos + 9);
        }

        return ltrim(preg_replace('/^public\//i', '', $fullPath), '/');
    }

    /**
     * Try multiple path candidates to find a file that actually exists on disk.
     * This handles legacy data where paths were stored inconsistently.
     */
    private function resolveFilePath($rawPath)
    {
        $normalized = $this->normalizeStoredPath($rawPath);
        if ($normalized === '') return null;

        // Candidate 1: exact normalized path
        if (Storage::disk('public')->exists($normalized)) {
            Log::info("[FileController] Resolved: exact match '{$normalized}'");
            return $normalized;
        }

        $basename = basename($normalized);

        // Candidate 2: try common subfolder patterns
        // e.g. if stored as "sertifikat/file.pdf", try "{uuid}/sertifikat/file.pdf"
        $folders = ['sertifikat', 'ktp', 'foto-bangunan'];
        foreach ($folders as $folder) {
            // Direct in folder
            $candidate = $folder . '/' . $basename;
            if (Storage::disk('public')->exists($candidate)) {
                Log::info("[FileController] Resolved: folder match '{$candidate}'");
                return $candidate;
            }
        }

        // Candidate 3: scan top-level user/user-id directories for the basename
        $publicRoot = storage_path('app/public');
        if (is_dir($publicRoot)) {
            $topDirs = @scandir($publicRoot);
            if (is_array($topDirs)) {
                foreach ($topDirs as $dir) {
                    if ($dir === '.' || $dir === '..') continue;
                    if (!is_dir($publicRoot . '/' . $dir)) continue;

                    foreach ($folders as $folder) {
                        $candidate = $dir . '/' . $folder . '/' . $basename;
                        if (Storage::disk('public')->exists($candidate)) {
                            Log::info("[FileController] Resolved: deep scan '{$candidate}'");
                            return $candidate;
                        }
                    }
                }
            }
        }

        // Candidate 4: suffix match anywhere in public storage
        if (is_dir($publicRoot)) {
            try {
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($publicRoot, \RecursiveDirectoryIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::LEAVES_ONLY
                );

                $normalizedLower = strtolower(str_replace('\\', '/', $normalized));
                $basenameLower = strtolower($basename);

                foreach ($iterator as $file) {
                    if (!$file->isFile()) continue;

                    $full = str_replace('\\', '/', $file->getPathname());
                    $relative = ltrim(str_replace(str_replace('\\', '/', $publicRoot), '', $full), '/');
                    $relativeLower = strtolower($relative);

                    if (
                        $relativeLower === $normalizedLower
                        || substr($relativeLower, -strlen($normalizedLower)) === $normalizedLower
                        || basename($relativeLower) === $basenameLower
                    ) {
                        Log::info("[FileController] Resolved: recursive match '{$relative}'");
                        return $relative;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('[FileController] Recursive resolver failed: ' . $e->getMessage());
            }
        }

        Log::warning("[FileController] Unresolved: '{$rawPath}' (normalized: '{$normalized}', basename: '{$basename}')");
        return null;
    }

    // ==========================================
    // CHUNK HELPERS
    // ==========================================

    private function ensureDirectory($dirPath)
    {
        return is_dir($dirPath) || (@mkdir($dirPath, 0775, true) && is_dir($dirPath));
    }

    private function cleanupChunkDirectory($dirPath)
    {
        if (!is_dir($dirPath)) return;
        $files = @scandir($dirPath);
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                $full = $dirPath . DIRECTORY_SEPARATOR . $file;
                if (is_dir($full)) {
                    $this->cleanupChunkDirectory($full);
                } elseif (file_exists($full)) {
                    @unlink($full);
                }
            }
        }
        @rmdir($dirPath);
    }

    private function getChunkValue(Request $request, $inputKey, $headerKey)
    {
        $value = $request->input($inputKey, $request->query($inputKey));
        if ($value === null || $value === '') {
            $value = $request->header($headerKey, '');
        }
        return is_string($value) ? trim($value) : '';
    }

    private function readChunkBinary(Request $request)
    {
        // Priority 0: text/plain body → treat as raw base64 string
        // This is the most reliable method because text/plain does NOT trigger CORS preflight
        $contentType = strtolower((string) $request->header('Content-Type', ''));

        if (strpos($contentType, 'text/plain') !== false) {
            $raw = $request->getContent();
            if (!is_string($raw) || trim($raw) === '') {
                $raw = @file_get_contents('php://input');
            }
            if (is_string($raw) && trim($raw) !== '') {
                $clean = preg_replace('/^data:[^;]+;base64,/', '', trim($raw));
                $decoded = base64_decode(str_replace([' ', "\n", "\r"], ['+', '', ''], $clean), true);
                if (is_string($decoded) && $decoded !== '') {
                    Log::info('[FileController] Chunk read via text/plain base64 (' . strlen($decoded) . ' bytes)');
                    return $decoded;
                }
                Log::warning('[FileController] text/plain body present but base64 decode failed, len=' . strlen($raw));
            }
        }

        // Priority 1: Base64 in body (JSON or form-encoded)
        $b64 = $request->input('chunk_base64', $request->input('chunkBase64'));
        if (is_string($b64) && trim($b64) !== '') {
            $clean = preg_replace('/^data:[^;]+;base64,/', '', trim($b64));
            $decoded = base64_decode(str_replace(' ', '+', $clean), true);
            if (is_string($decoded) && $decoded !== '') return $decoded;
            Log::warning('[FileController] chunk_base64 provided but decode failed');
            return null;
        }

        // Priority 1b: raw octet-stream body
        if (strpos($contentType, 'application/octet-stream') !== false) {
            $raw = $request->getContent();
            if (is_string($raw) && $raw !== '') return $raw;

            $input = @file_get_contents('php://input');
            if (is_string($input) && $input !== '') return $input;
        }

        // Priority 2: multipart file
        if ($request->hasFile('chunk')) {
            $chunk = $request->file('chunk');
            if ($chunk && $chunk->isValid()) {
                $content = @file_get_contents($chunk->getRealPath());
                if (is_string($content) && $content !== '') return $content;
            }
        }

        // Priority 3: raw body
        $raw = $request->getContent();
        if (is_string($raw) && $raw !== '') return $raw;

        // Priority 4: php://input
        $input = @file_get_contents('php://input');
        if (is_string($input) && $input !== '') return $input;

        return null;
    }

    private function validateAssembledFile($path, $type, $ext)
    {
        if (!file_exists($path)) return 'File sementara tidak ditemukan';

        if ($type === 'sertifikat') {
            $header = @file_get_contents($path, false, null, 0, 5);
            if (!is_string($header) || strpos($header, '%PDF-') !== 0 || $ext !== 'pdf') {
                return 'File sertifikat hasil upload tidak valid (bukan PDF).';
            }
            return null;
        }

        $info = @getimagesize($path);
        if (!is_array($info) || !isset($info['mime']) || !in_array($info['mime'], ['image/jpeg', 'image/png'], true)) {
            return 'File gambar hasil upload tidak valid (bukan JPG/PNG).';
        }
        if (!in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
            return 'Ekstensi file gambar tidak valid.';
        }
        return null;
    }

    private function storeBinaryToPublicDisk($userId, $type, $ext, $binary)
    {
        $timestamp = now()->format('YmdHis');
        $finalPath = $userId . '/' . $type . '/' . $timestamp . '-' . uniqid('', true) . '.' . $ext;

        Storage::disk('public')->makeDirectory($userId . '/' . $type);
        $stored = Storage::disk('public')->put($finalPath, $binary);

        if (!$stored) {
            return [
                'ok' => false,
                'response' => $this->errorResponse('Gagal menyimpan file ke storage.', 500, 'storage_write_failed'),
            ];
        }

        Log::info("[FileController] Upload success: {$finalPath}");

        return [
            'ok' => true,
            'path' => $finalPath,
            'response' => response()->json([
                'path' => $finalPath,
                'url' => $this->buildPublicFileUrl($finalPath),
            ]),
        ];
    }

    // ==========================================
    // UPLOAD: STANDARD (SINGLE FILE)
    // ==========================================

    public function upload(Request $request)
    {
        $request->validate(['type' => 'required|in:sertifikat,ktp,foto-bangunan']);

        $user = $request->user();
        if (!$user) return $this->errorResponse('Unauthorized', 401, 'auth_missing');

        $type = (string) $request->input('type');

        $fileBase64 = $request->input('file_base64');
        $fileNameFromBody = basename((string) $request->input('file_name', 'upload.bin'));

        if (is_string($fileBase64) && trim($fileBase64) !== '') {
            $clean = preg_replace('/^data:[^;]+;base64,/', '', trim($fileBase64));
            $binary = base64_decode(str_replace(' ', '+', $clean), true);

            if (!is_string($binary) || $binary === '') {
                return $this->errorResponse('Isi file base64 tidak valid.', 422, 'invalid_base64');
            }

            if (strlen($binary) > self::MAX_FILE_SIZE_BYTES) {
                return $this->errorResponse('Ukuran file maksimal 5MB', 422, 'file_too_large');
            }

            $ext = strtolower(pathinfo($fileNameFromBody, PATHINFO_EXTENSION));
            $typeErr = $this->validateTypeAndExtension($type, $ext);
            if ($typeErr) return $this->errorResponse($typeErr, 422, 'invalid_file_type');

            $tmpPath = storage_path('app/chunks/upload-single-' . uniqid('', true) . '.tmp');
            @file_put_contents($tmpPath, $binary);

            $valErr = $this->validateAssembledFile($tmpPath, $type, $ext);
            @unlink($tmpPath);
            if ($valErr) {
                return $this->errorResponse($valErr, 422, 'assembled_validation_failed');
            }

            try {
                $stored = $this->storeBinaryToPublicDisk($user->id, $type, $ext, $binary);
                return $stored['response'];
            } catch (\Throwable $e) {
                Log::error('[FileController] upload base64 error: ' . $e->getMessage());
                return $this->errorResponse('Gagal menyimpan file: ' . $e->getMessage(), 500, 'storage_write_failed');
            }
        }

        if (!$request->hasFile('file')) {
            Log::warning('[FileController] file field missing on standard upload', [
                'content_type' => $request->header('Content-Type'),
                'content_length' => $request->header('Content-Length'),
                'keys' => array_keys($request->all()),
            ]);
            return $this->errorResponse('File wajib diunggah', 422, 'file_required');
        }

        $file = $request->file('file');
        if (!$file || !$file->isValid()) {
            return $this->errorResponse('Upload gagal di server. Gunakan upload bertahap.', 500, 'upload_transport_failed');
        }

        if (($file->getSize() ?: 0) > self::MAX_FILE_SIZE_BYTES) {
            return $this->errorResponse('Ukuran file maksimal 5MB', 422, 'file_too_large');
        }

        $ext = strtolower($file->getClientOriginalExtension());
        $typeErr = $this->validateTypeAndExtension($type, $ext);
        if ($typeErr) return $this->errorResponse($typeErr, 422, 'invalid_file_type');

        try {
            $content = @file_get_contents($file->getRealPath());
            if (!is_string($content) || $content === '') {
                return $this->errorResponse('Upload gagal di server. File tidak dapat dibaca.', 500, 'upload_transport_failed');
            }

            $stored = $this->storeBinaryToPublicDisk($user->id, $type, $ext, $content);
            return $stored['response'];
        } catch (\Throwable $e) {
            Log::error('[FileController] upload error: ' . $e->getMessage());
            return $this->errorResponse('Gagal menyimpan file: ' . $e->getMessage(), 500, 'storage_write_failed');
        }
    }

    // ==========================================
    // UPLOAD: CHUNKED
    // ==========================================

    public function uploadChunk(Request $request)
    {
        $user = $request->user();
        if (!$user) return $this->errorResponse('Unauthorized', 401, 'auth_missing');

        // Validate parameters
        $type = $this->getChunkValue($request, 'type', 'X-Upload-Type');
        $uploadId = preg_replace('/[^a-zA-Z0-9\-_]/', '', $this->getChunkValue($request, 'upload_id', 'X-Upload-Id'));
        $chunkIndex = filter_var($this->getChunkValue($request, 'chunk_index', 'X-Chunk-Index'), FILTER_VALIDATE_INT);
        $totalChunks = filter_var($this->getChunkValue($request, 'total_chunks', 'X-Total-Chunks'), FILTER_VALIDATE_INT);
        $fileName = basename($this->getChunkValue($request, 'file_name', 'X-File-Name'));
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if (!in_array($type, ['sertifikat', 'ktp', 'foto-bangunan'], true)) {
            return $this->errorResponse('Tipe file tidak valid', 422, 'invalid_type');
        }
        if (!$uploadId || strlen($uploadId) > 100) {
            return $this->errorResponse('upload_id tidak valid', 422, 'invalid_upload_id');
        }
        if ($chunkIndex === false || $chunkIndex < 0) {
            return $this->errorResponse('chunk_index tidak valid', 422, 'invalid_chunk_index');
        }
        if ($totalChunks === false || $totalChunks < 1 || $totalChunks > 200) {
            return $this->errorResponse('total_chunks tidak valid', 422, 'invalid_total_chunks');
        }
        if ($fileName === '' || strlen($fileName) > 255) {
            return $this->errorResponse('file_name tidak valid', 422, 'invalid_file_name');
        }

        $typeErr = $this->validateTypeAndExtension($type, $ext);
        if ($typeErr) return $this->errorResponse($typeErr, 422, 'invalid_file_type');

        // Read chunk binary
        $binary = $this->readChunkBinary($request);
        if (!is_string($binary) || $binary === '') {
            Log::warning('[FileController] Empty chunk payload', [
                'content_type' => $request->header('Content-Type'),
                'content_length' => $request->header('Content-Length'),
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'has_chunk_base64' => $request->filled('chunk_base64') || $request->filled('chunkBase64'),
            ]);
            return $this->errorResponse('Chunk kosong atau tidak valid', 422, 'empty_chunk');
        }
        if (strlen($binary) > self::MAX_CHUNK_SIZE_BYTES) {
            return $this->errorResponse('Ukuran chunk melebihi 1MB', 422, 'chunk_too_large');
        }

        // Ensure chunk directory
        $chunkDir = storage_path('app/chunks/' . $user->id . '/' . $uploadId);
        if (!$this->ensureDirectory($chunkDir)) {
            return $this->errorResponse('Gagal menyiapkan direktori chunk. Periksa izin storage.', 500, 'chunk_dir_not_writable');
        }

        // Write chunk
        $chunkFile = $chunkDir . '/' . str_pad((string) $chunkIndex, 5, '0', STR_PAD_LEFT) . '.chunk';
        $written = @file_put_contents($chunkFile, $binary, LOCK_EX);
        if ($written === false) {
            return $this->errorResponse('Gagal menyimpan chunk.', 500, 'chunk_write_failed');
        }

        Log::info("[FileController] Chunk {$chunkIndex}/{$totalChunks} saved for upload {$uploadId}");

        // Not last chunk yet
        if ($chunkIndex < ($totalChunks - 1)) {
            return response()->json([
                'uploaded' => true,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
            ]);
        }

        // === ASSEMBLE FINAL FILE ===
        $assembledPath = $chunkDir . '/assembled.part';
        $wh = @fopen($assembledPath, 'wb');
        if ($wh === false) {
            $this->cleanupChunkDirectory($chunkDir);
            return $this->errorResponse('Gagal menyiapkan file sementara.', 500, 'assemble_open_failed');
        }

        $finalSize = 0;
        try {
            for ($i = 0; $i < $totalChunks; $i++) {
                $partPath = $chunkDir . '/' . str_pad((string) $i, 5, '0', STR_PAD_LEFT) . '.chunk';
                if (!file_exists($partPath)) {
                    fclose($wh);
                    $this->cleanupChunkDirectory($chunkDir);
                    return $this->errorResponse("Chunk {$i} tidak ditemukan. Ulangi upload.", 422, 'chunk_missing');
                }

                $rh = @fopen($partPath, 'rb');
                if ($rh === false) {
                    fclose($wh);
                    $this->cleanupChunkDirectory($chunkDir);
                    return $this->errorResponse('Gagal membaca chunk.', 500, 'chunk_read_failed');
                }

                while (!feof($rh)) {
                    $buf = fread($rh, 8192);
                    if ($buf === false || $buf === '') continue;
                    $finalSize += strlen($buf);
                    if ($finalSize > self::MAX_FILE_SIZE_BYTES) {
                        fclose($rh);
                        fclose($wh);
                        $this->cleanupChunkDirectory($chunkDir);
                        return $this->errorResponse('Ukuran file melebihi 5MB', 422, 'file_too_large');
                    }
                    fwrite($wh, $buf);
                }
                fclose($rh);
            }
            fclose($wh);

            // Validate assembled file
            $valErr = $this->validateAssembledFile($assembledPath, $type, $ext);
            if ($valErr) {
                $this->cleanupChunkDirectory($chunkDir);
                return $this->errorResponse($valErr, 422, 'assembled_validation_failed');
            }

            // Move to final storage
            $stream = fopen($assembledPath, 'rb');
            if ($stream === false) {
                $this->cleanupChunkDirectory($chunkDir);
                return $this->errorResponse('Gagal membaca file yang dirakit.', 500, 'assemble_read_failed');
            }

            $stored = $this->storeBinaryToPublicDisk($user->id, $type, $ext, $stream);
            fclose($stream);
            $this->cleanupChunkDirectory($chunkDir);

            if (!$stored['ok']) {
                return $stored['response'];
            }

            Log::info("[FileController] Chunked upload complete: {$stored['path']} ({$finalSize} bytes)");
            return $stored['response'];

        } catch (\Throwable $e) {
            if (is_resource($wh)) fclose($wh);
            $this->cleanupChunkDirectory($chunkDir);
            Log::error('[FileController] Chunked upload error: ' . $e->getMessage());
            return $this->errorResponse('Upload bertahap gagal: ' . $e->getMessage(), 500, 'assemble_error');
        }
    }

    // ==========================================
    // DOWNLOAD / URL / DELETE (with legacy resolver)
    // ==========================================

    public function download(Request $request, $path)
    {
        Log::info("[FileController] Download requested: '{$path}'");
        $resolved = $this->resolveFilePath($path);

        if (!$resolved) {
            return $this->errorResponse('File tidak ditemukan', 404, 'file_not_found');
        }

        return Storage::disk('public')->download($resolved);
    }

    public function getUrl(Request $request, $path)
    {
        Log::info("[FileController] URL requested: '{$path}'");
        $resolved = $this->resolveFilePath($path);

        if (!$resolved) {
            return $this->errorResponse('File tidak ditemukan', 404, 'file_not_found');
        }

        return response()->json(['url' => $this->buildPublicFileUrl($resolved)]);
    }

    public function destroy(Request $request, $path)
    {
        $resolved = $this->resolveFilePath($path);
        if ($resolved) {
            Storage::disk('public')->delete($resolved);
            Log::info("[FileController] Deleted: {$resolved}");
        }
        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
