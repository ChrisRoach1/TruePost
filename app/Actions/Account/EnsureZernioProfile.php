<?php

namespace App\Actions\Account;

use App\Models\User;
use App\Services\ZernioClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class EnsureZernioProfile
{
    public function __construct(private readonly ZernioClient $zernio) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function handle(User $user): string
    {
        if ($user->zernio_profile_id !== null) {
            return $user->zernio_profile_id;
        }

        $profile = $this->zernio->createProfile(
            name: 'truepost_user_'.$user->id,
            description: $user->email,
        );

        $user->forceFill(['zernio_profile_id' => $profile['_id']])->save();

        return $profile['_id'];
    }
}
