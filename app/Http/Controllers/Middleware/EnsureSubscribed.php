<?php

namespace App\Http\Controllers\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscribed
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect(route('login'));
        }

        $user->keepLatestActiveSubscription();

        if (! $user->hasActiveSubscription()) {
            return redirect(route('solo-subscription.checkout'));
        }

        return $next($request);
    }
}
