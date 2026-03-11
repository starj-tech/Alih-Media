<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TrustAuthorizationHeader
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->headers->has('Authorization')) {
            $candidates = [
                $request->server('HTTP_AUTHORIZATION'),
                $request->server('REDIRECT_HTTP_AUTHORIZATION'),
                $request->server('Authorization'),
                getenv('HTTP_AUTHORIZATION') ?: null,
                getenv('REDIRECT_HTTP_AUTHORIZATION') ?: null,
            ];

            foreach ($candidates as $value) {
                if (is_string($value) && trim($value) !== '') {
                    $request->headers->set('Authorization', trim($value));
                    break;
                }
            }
        }

        return $next($request);
    }
}
