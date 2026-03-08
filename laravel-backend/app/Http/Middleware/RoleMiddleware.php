<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Check if user has one of the specified roles
     * 
     * Usage in routes: ->middleware('role:super_admin,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->getRole();

        if (!$userRole || !in_array($userRole, $roles)) {
            return response()->json([
                'error' => 'Forbidden: insufficient role',
            ], 403);
        }

        return $next($request);
    }
}
