<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

class SmtpConfigResolver
{
    /**
     * Sinkronkan konfigurasi SMTP dari runtime config + fallback .env/.env.example.
     *
     * @return array{missing: array<int,string>, source: array<string,string>}
     */
    public static function apply(): array
    {
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
                'invalid' => ['', null, 'smtp.mailgun.org'],
                'default' => null,
            ],
            'MAIL_PORT' => [
                'path' => 'mail.mailers.smtp.port',
                'required' => true,
                'invalid' => ['', null],
                'default' => 587,
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
                'default' => 'tls',
            ],
            'MAIL_FROM_ADDRESS' => [
                'path' => 'mail.from.address',
                'required' => true,
                'invalid' => ['', null, 'hello@example.com'],
                'default' => null,
            ],
            'MAIL_FROM_NAME' => [
                'path' => 'mail.from.name',
                'required' => false,
                'invalid' => ['', null],
                'default' => config('app.name', 'Alihmedia BPN'),
            ],
        ];

        $missing = [];
        $sourceMap = [];

        foreach ($definitions as $envKey => $definition) {
            $currentValue = Config::get($definition['path']);
            $finalValue = $currentValue;
            $source = 'config';

            if (self::isInvalid($finalValue, $definition['invalid'])) {
                list($fileValue, $sourceFile) = self::lookupEnvValue($envKey);

                if (!self::isInvalid($fileValue, ['', null])) {
                    $finalValue = $envKey === 'MAIL_PORT' ? (int) $fileValue : $fileValue;
                    Config::set($definition['path'], $finalValue);
                    $source = $sourceFile;
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

    private static function lookupEnvValue(string $key): array
    {
        $envFiles = ['.env', '.env.example'];

        foreach ($envFiles as $file) {
            $path = base_path($file);
            if (!is_file($path) || !is_readable($path)) {
                continue;
            }

            $value = self::readFromFile($path, $key);
            if (!self::isInvalid($value, ['', null])) {
                return [$value, $file];
            }
        }

        return [null, 'none'];
    }

    private static function readFromFile(string $path, string $key)
    {
        $lines = @file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return null;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || strpos($trimmed, '#') === 0) {
                continue;
            }

            if (strpos($trimmed, $key . '=') !== 0) {
                continue;
            }

            $value = substr($trimmed, strlen($key) + 1);
            return self::normalizeValue($value);
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

        if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
            $value = substr($value, 1, -1);
        }

        if (preg_match('/^\$\{([A-Z0-9_]+)\}$/', $value, $match)) {
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
