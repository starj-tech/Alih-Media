<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $userRole = $request->user() ? $request->user()->getRole() : null;

        if (!$userRole || !in_array($userRole, $roles)) {
            return response()->json([
                'error' => 'Forbidden: insufficient role',
            ], 403);
        }

        return $next($request);
    }
}
