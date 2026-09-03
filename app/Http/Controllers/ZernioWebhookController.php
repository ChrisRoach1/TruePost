<?php

namespace App\Http\Controllers;

use App\Actions\Account\SyncAccounts;
use App\Models\User;
use Illuminate\Http\Request;

class ZernioWebhookController extends Controller
{
    public function __invoke(Request $request, SyncAccounts $syncAccounts)
    {
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return response()->noContent();
        }

        $receivedSignature = $request->header('X-Zernio-Signature') ?? $request->header('X-Late-Signature');
        $expectedSignature = hash_hmac('sha256', $request->getContent(), (string) config('services.zernio.webhook_secret'));

        abort_if(! hash_equals($expectedSignature, (string) $receivedSignature), 403);

        $user = User::query()
            ->where('zernio_profile_id', $request->input('account.profileId'))
            ->first();

        if ($user === null) {
            return response()->noContent();
        }

        if (in_array($request->input('event'), ['account.connected', 'account.disconnected'], true)) {
            $syncAccounts->handle($user);
        }

        return response()->noContent();
    }
}
