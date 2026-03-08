<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $userRole = $request->user()?->getRole();

        if (!in_array($userRole, $roles)) {
            return response()->json(['error' => 'Forbidden: insufficient role'], 403);
        }

        return $next($request);
    }
}
