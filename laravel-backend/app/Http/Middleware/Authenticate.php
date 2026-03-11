<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * Untuk request API atau yang mengharapkan JSON, kembalikan null
     * agar Laravel melempar AuthenticationException (ditangkap Handler)
     * alih-alih mencoba redirect ke route('login') yang tidak ada.
     */
    protected function redirectTo($request)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return null; // akan trigger AuthenticationException -> Handler -> JSON 401
        }

        return '/';
    }
}
