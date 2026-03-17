<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

class SmtpConfigResolver
{
    /**
     * Sinkronkan konfigurasi SMTP dari runtime config + fallback env lintas lokasi.
     *
     * @return array{missing: array<int,string>, source: array<string,string>}
     */
    public static function apply(): array
    {
        self::primeRuntimeEnvironment();

        $definitions = [
            'MAIL_MAILER' => [
                'path' => 'mail.default',
                'required' => true,
                'invalid' => ['', null],
                'default' => 'smtp',
            ],
            'MAIL_HOST' => [
                'path' => 'mail.mailers.smtp.host',
                'required' => true,
                'invalid' => ['', null, 'smtp.mailgun.org', 'smtp.gmail.com'],
                'default' => 'smtp.titan.email',
            ],
            'MAIL_PORT' => [
                'path' => 'mail.mailers.smtp.port',
                'required' => true,
                'invalid' => ['', null],
                'default' => 465,
            ],
            'MAIL_USERNAME' => [
                'path' => 'mail.mailers.smtp.username',
                'required' => true,
                'invalid' => ['', null],
                'default' => null,
            ],
            'MAIL_PASSWORD' => [
                'path' => 'mail.mailers.smtp.password',
                'required' => true,
                'invalid' => ['', null],
                'default' => null,
            ],
            'MAIL_ENCRYPTION' => [
                'path' => 'mail.mailers.smtp.encryption',
                'required' => true,
                'invalid' => ['', null],
                'default' => 'ssl',
            ],
            'MAIL_FROM_ADDRESS' => [
                'path' => 'mail.from.address',
                'required' => true,
                'invalid' => ['', null, 'hello@example.com', 'amaze.onway@gmail.com'],
                'default' => 'admin@kantahkabbogor.id',
            ],
            'MAIL_FROM_NAME' => [
                'path' => 'mail.from.name',
                'required' => false,
                'invalid' => ['', null],
                'default' => 'Validasi Alihmedia BPN.Kab.BogorII',
            ],
        ];

        $missing = [];
        $sourceMap = [];

        foreach ($definitions as $envKey => $definition) {
            $currentValue = Config::get($definition['path']);
            $finalValue = $currentValue;
            $source = 'config';

            if (self::isInvalid($finalValue, $definition['invalid'])) {
                list($resolvedValue, $resolvedSource) = self::lookupEnvValue($envKey);

                if (!self::isInvalid($resolvedValue, ['', null])) {
                    $finalValue = $envKey === 'MAIL_PORT' ? (int) $resolvedValue : $resolvedValue;
                    Config::set($definition['path'], $finalValue);
                    $source = $resolvedSource;
                } elseif (!self::isInvalid($definition['default'], ['', null])) {
                    $finalValue = $definition['default'];
                    Config::set($definition['path'], $finalValue);
                    $source = 'default';
                }
            }

            $sourceMap[$envKey] = $source;

            if (!empty($definition['required']) && self::isInvalid($finalValue, $definition['invalid'])) {
                $missing[] = $envKey;
            }
        }

        return [
            'missing' => $missing,
            'source' => $sourceMap,
        ];
    }

    private static function primeRuntimeEnvironment(): void
    {
        foreach (self::getCandidateEnvFiles() as $candidate) {
            if (empty($candidate['readable'])) {
                continue;
            }

            try {
                $dotenv = \Dotenv\Dotenv::createMutable($candidate['dir'], $candidate['file']);
                $dotenv->safeLoad();
            } catch (\Throwable $e) {
                // Lanjut ke candidate berikutnya.
            }
        }
    }

    private static function lookupEnvValue(string $key): array
    {
        $runtimeValue = self::readRuntimeValue($key);
        if (!self::isInvalid($runtimeValue, ['', null])) {
            return [$runtimeValue, 'runtime'];
        }

        foreach (self::getCandidateEnvFiles() as $candidate) {
            if (empty($candidate['readable'])) {
                continue;
            }

            $value = self::readFromFile($candidate['path'], $key);
            if (!self::isInvalid($value, ['', null])) {
                return [$value, $candidate['label']];
            }
        }

        return [null, 'none'];
    }

    private static function readRuntimeValue(string $key)
    {
        $candidates = [
            getenv($key),
            $_ENV[$key] ?? null,
            $_SERVER[$key] ?? null,
            env($key),
        ];

        foreach ($candidates as $candidate) {
            $normalized = self::normalizeValue($candidate);
            if (!self::isInvalid($normalized, ['', null])) {
                return $normalized;
            }
        }

        return null;
    }

    /**
     * @return array<int, array{path:string,dir:string,file:string,label:string,readable:bool}>
     */
    private static function getCandidateEnvFiles(): array
    {
        static $candidates = null;

        if ($candidates !== null) {
            return $candidates;
        }

        $basePath = base_path();
        $parentPath = dirname($basePath);

        $pairs = [
            ['dir' => $basePath, 'file' => '.env', 'label' => '.env'],
            ['dir' => $basePath, 'file' => '.env.example', 'label' => '.env.example'],
            ['dir' => $parentPath, 'file' => '.env', 'label' => '../.env'],
            ['dir' => $parentPath, 'file' => '.env.example', 'label' => '../.env.example'],
        ];

        $result = [];
        $seen = [];

        foreach ($pairs as $pair) {
            $path = rtrim($pair['dir'], '/\\') . DIRECTORY_SEPARATOR . $pair['file'];
            if (isset($seen[$path])) {
                continue;
            }

            $seen[$path] = true;
            $isAccessible = self::isPathWithinOpenBaseDir($path);

            $result[] = [
                'path' => $path,
                'dir' => $pair['dir'],
                'file' => $pair['file'],
                'label' => $pair['label'],
                'readable' => $isAccessible && @is_file($path) && @is_readable($path),
            ];
        }

        $candidates = $result;

        return $candidates;
    }

    private static function isPathWithinOpenBaseDir(string $path): bool
    {
        $openBaseDir = ini_get('open_basedir');
        if (!is_string($openBaseDir) || trim($openBaseDir) === '') {
            return true;
        }

        $normalizedPath = self::normalizePath($path);
        $allowedPaths = array_filter(array_map('trim', explode(PATH_SEPARATOR, $openBaseDir)));

        foreach ($allowedPaths as $allowedPath) {
            $normalizedAllowed = rtrim(self::normalizePath($allowedPath), '/');
            if ($normalizedAllowed === '') {
                continue;
            }

            if ($normalizedPath === $normalizedAllowed || strpos($normalizedPath, $normalizedAllowed . '/') === 0) {
                return true;
            }
        }

        return false;
    }

    private static function normalizePath(string $path): string
    {
        return str_replace('\\', '/', rtrim($path, '/\\'));
    }

    private static function readFromFile(string $path, string $key)
    {
        $lines = @file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return null;
        }

        $pattern = '/^(?:export\s+)?' . preg_quote($key, '/') . '\s*=\s*(.*)$/';

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || strpos($trimmed, '#') === 0) {
                continue;
            }

            if (!preg_match($pattern, $trimmed, $matches)) {
                continue;
            }

            return self::normalizeValue($matches[1] ?? null);
        }

        return null;
    }

    private static function normalizeValue($value)
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        $first = substr($value, 0, 1);
        $last = substr($value, -1);

        $isWrappedInDoubleQuote = $first === '"' && $last === '"';
        $isWrappedInSingleQuote = $first === "'" && $last === "'";

        if ($isWrappedInDoubleQuote || $isWrappedInSingleQuote) {
            $value = substr($value, 1, -1);
        } else {
            $commentPos = strpos($value, ' #');
            if ($commentPos !== false) {
                $value = trim(substr($value, 0, $commentPos));
            }
        }

        if (preg_match('/^\$\{([A-Z0-9_]+)\}$/', $value, $match)) {
            list($resolved, ) = self::lookupEnvValue($match[1]);
            return $resolved;
        }

        if (preg_match('/^\$([A-Z0-9_]+)$/', $value, $match)) {
            list($resolved, ) = self::lookupEnvValue($match[1]);
            return $resolved;
        }

        return $value;
    }

    private static function isInvalid($value, array $invalidValues): bool
    {
        foreach ($invalidValues as $invalidValue) {
            if ($value === $invalidValue) {
                return true;
            }
        }

        return false;
    }
}
