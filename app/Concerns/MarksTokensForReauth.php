<?php

namespace App\Concerns;

use App\Models\UserToken;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;

trait MarksTokensForReauth
{
    /**
     * A rejected refresh means the grant is gone for good, so flag the account
     * and stop the scheduled sweep from retrying it forever. Server-side
     * failures are left to throw, letting the next sweep pick them back up.
     *
     * @throws RequestException
     */
    protected function requiresReauth(UserToken $userToken, Response $response): bool
    {
        if ($response->clientError()) {
            $userToken->update(['needs_reauthed' => true]);

            return true;
        }

        $response->throw();

        return false;
    }
}
