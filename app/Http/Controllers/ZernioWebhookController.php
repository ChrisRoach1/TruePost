<?php

namespace App\Http\Controllers;

use App\Actions\Account\SyncAccounts;
use App\Models\User;
use Illuminate\Http\Request;

class ZernioWebhookController extends Controller
{
    public function __invoke(Request $request, SyncAccounts $syncAccounts)
    {
        $receivedSignature = $request->header('X-Zernio-Signature');
        $expectedSignature = hash_hmac('sha256', $request->getContent(), config('services.zernio.webhook_secret'));

        abort_if($receivedSignature !== $expectedSignature, 403);

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
