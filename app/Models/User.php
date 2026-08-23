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

    public const int SOLO_ACCOUNT_LIMIT = 3;

    public const int SOLO_BOT_LIMIT = 1;

    public const int PRO_ACCOUNT_LIMIT = 11;

    public const int PRO_BOT_LIMIT = 5;

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

    public function ConnectedAccount(): HasMany
    {
        return $this->hasMany(ConnectedAccount::class);
    }

    public function UserPosts(): HasMany
    {
        return $this->hasMany(UserPost::class);
    }

    public function BotPosts(): HasMany
    {
        return $this->hasMany(BotPost::class);
    }

    public function getTimezone()
    {
        return $this->timezone;
    }

    public function isProMember(): bool
    {
        return $this->subscribed('pro');
    }

    public function canSchedulePosts(): bool
    {
        return $this->isProMember();
    }

    public function isSoloMember(): bool
    {
        return $this->subscribed('solo');
    }

    public function hasActiveSubscription(): bool
    {
        return $this->isProMember() || $this->isSoloMember();
    }

    public function isOnProGracePeriod(): bool
    {
        return (bool) $this->subscription('pro')?->onGracePeriod();
    }

    public function isOnSoloGracePeriod(): bool
    {
        return (bool) $this->subscription('solo')?->onGracePeriod();
    }

    public function connectedAccountCount(): int
    {
        return $this->ConnectedAccount()->count();
    }

    public function botCount(): int
    {
        return $this->BotPosts()->count();
    }

    public function hasReachedProAccountLimit(): bool
    {
        return $this->connectedAccountCount() >= self::PRO_ACCOUNT_LIMIT;
    }

    public function hasReachedSoloAccountLimit(): bool
    {
        return $this->connectedAccountCount() >= self::SOLO_ACCOUNT_LIMIT;
    }

    public function hasReachedProBotLimit(): bool
    {
        return $this->botCount() >= self::PRO_BOT_LIMIT;
    }

    public function hasReachedSoloBotLimit(): bool
    {
        return $this->botCount() >= self::SOLO_BOT_LIMIT;
    }

    public function isOverSoloAccountLimit(): bool
    {
        return $this->connectedAccountCount() > self::SOLO_ACCOUNT_LIMIT;
    }

    public function isOverSoloBotLimit(): bool
    {
        return $this->botCount() > self::SOLO_BOT_LIMIT;
    }

    public function isOverSoloLimit(): bool
    {
        return $this->isOverSoloAccountLimit() || $this->isOverSoloBotLimit();
    }

    public function cancelSubscriptionNow(string $type): void
    {
        $subscription = $this->subscription($type);

        if ($subscription && ! $subscription->ended()) {
            $subscription->cancelNow();
        }
    }

    public function cancelAllSubscriptionsNow(): void
    {
        foreach ($this->subscriptions as $subscription) {
            if (! $subscription->ended()) {
                $subscription->cancelNow();
            }
        }
    }

    public function keepLatestActiveSubscription(): void
    {
        $active = $this->subscriptions->filter(fn ($subscription) => $subscription->valid());

        if ($active->count() < 2) {
            return;
        }

        $latest = $active->sortByDesc(fn ($subscription) => $subscription->updated_at)->first();

        foreach ($active as $subscription) {
            if ($subscription->id !== $latest->id) {
                $subscription->cancelNow();
            }
        }
    }
}
