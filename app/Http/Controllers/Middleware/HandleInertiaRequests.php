<?php

namespace App\Http\Controllers\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'is_pro_member' => (bool) $request->user()?->isProMember(),
                'is_solo_member' => (bool) $request->user()?->isSoloMember(),
                'solo_account_limit' => User::SOLO_ACCOUNT_LIMIT,
                'pro_account_limit' => User::PRO_ACCOUNT_LIMIT,
                'solo_bot_limit' => User::SOLO_BOT_LIMIT,
                'pro_bot_limit' => User::PRO_BOT_LIMIT,
                'is_in_pro_grace_period' => (bool) $request->user()?->isOnProGracePeriod(),
                'is_in_solo_grace_period' => (bool) $request->user()?->isOnSoloGracePeriod(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
