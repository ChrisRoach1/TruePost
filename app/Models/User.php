<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'timezone'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasFactory, Notifiable, TwoFactorAuthenticatable;

    public const PRO_PRICE_ID = 'price_1U1ZyiEVZMTNj66C3nrUFHKa';

    public const FREE_ACCOUNT_LIMIT = 3;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function UserToken(): HasMany
    {
        return $this->hasMany(UserToken::class);
    }

    public function UserPosts(): HasMany
    {
        return $this->hasMany(UserPost::class);
    }

    public function getTimezone()
    {
        return $this->timezone;
    }

    public function isProMember(): bool
    {
        return $this->subscribedToPrice(self::PRO_PRICE_ID);
    }

    public function isOnGracePeriod(): bool
    {
        return (bool) $this->subscription('default')?->onGracePeriod();
    }

    public function connectedAccountCount(): int
    {
        return $this->UserToken()->where('needs_reauthed', false)->count();
    }

    public function hasReachedAccountLimit(): bool
    {
        return ! $this->isProMember()
            && $this->connectedAccountCount() >= self::FREE_ACCOUNT_LIMIT;
    }
}
