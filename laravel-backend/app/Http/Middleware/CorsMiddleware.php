<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->method() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigin($request));
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

        return $response;
    }

    private function getAllowedOrigin(Request $request)
    {
        $allowed = [
            config('app.frontend_url', 'http://localhost:5173'),
            'http://localhost:3000',
            'http://localhost:5173',
        ];

        $origin = $request->header('Origin');

        if ($origin && in_array($origin, $allowed)) {
            return $origin;
        }

        return $allowed[0];
    }
}
