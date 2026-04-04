<?php

namespace App\Support;

use Illuminate\Http\Request;

class ClientIpResolver
{
    public const SERVER_IP = '202.10.48.17';

    public static function serverIp()
    {
        return self::SERVER_IP;
    }

    public static function resolve(?Request $request)
    {
        if (!$request) {
            return null;
        }

        $candidates = [
            $request->headers->get('CF-Connecting-IP'),
            $request->headers->get('X-Real-IP'),
            $request->headers->get('X-Forwarded-For'),
            $request->server('HTTP_CF_CONNECTING_IP'),
            $request->server('HTTP_X_REAL_IP'),
            $request->server('HTTP_X_FORWARDED_FOR'),
            $request->server('REMOTE_ADDR'),
        ];

        foreach ($candidates as $candidate) {
            foreach (self::splitCandidates($candidate) as $possibleIp) {
                $normalized = self::normalizeIp($possibleIp);

                if ($normalized) {
                    return $normalized;
                }
            }
        }

        return null;
    }

    private static function splitCandidates($value)
    {
        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        return array_map('trim', explode(',', $value));
    }

    private static function normalizeIp($value)
    {
        if (!is_string($value)) {
            return null;
        }

        $ip = trim($value);

        if ($ip === '' || strtolower($ip) === 'unknown') {
            return null;
        }

        $ipv6Candidate = trim($ip, '[]');
        if (filter_var($ipv6Candidate, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $ipv6Candidate;
        }

        $ipWithoutPort = preg_replace('/:\d+$/', '', $ip);

        return filter_var($ipWithoutPort, FILTER_VALIDATE_IP) ? $ipWithoutPort : null;
    }
}