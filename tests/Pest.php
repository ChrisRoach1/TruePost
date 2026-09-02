<?php

use App\Models\BotPost;
use App\Models\ConnectedAccount;
use App\Models\System;
use App\Models\User;
use Database\Seeders\SystemSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use function Pest\Laravel\seed;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        seed(SystemSeeder::class);
    })
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function makeProUser(): User
{
    $user = User::factory()->create(['timezone' => 'UTC']);

    $user->subscriptions()->create([
        'type' => 'pro',
        'stripe_id' => 'sub_pro_'.$user->id,
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro',
        'quantity' => 1,
    ]);

    return $user->fresh();
}

function makeConnectedAccount(User $user, string $zernioAccountId): ConnectedAccount
{
    return ConnectedAccount::create([
        'user_id' => $user->id,
        'system_id' => System::query()->value('id'),
        'zernio_account_id' => $zernioAccountId,
        'username' => $zernioAccountId,
        'display_name' => $zernioAccountId,
    ]);
}

function makeBot(User $user, string $description): BotPost
{
    return BotPost::create([
        'user_id' => $user->id,
        'bot_description' => $description,
        'post_times' => ['09:00'],
    ]);
}

function makeScheduledPostProUser(): User
{
    $user = User::factory()->create(['timezone' => 'UTC']);

    $user->subscriptions()->create([
        'type' => 'pro',
        'stripe_id' => 'sub_pro_'.$user->id,
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro',
        'quantity' => 1,
    ]);

    return $user->fresh();
}

function makeScheduledPostSoloUser(): User
{
    $user = User::factory()->create(['timezone' => 'UTC']);

    $user->subscriptions()->create([
        'type' => 'solo',
        'stripe_id' => 'sub_solo_'.$user->id,
        'stripe_status' => 'active',
        'stripe_price' => 'price_solo',
        'quantity' => 1,
    ]);

    return $user->fresh();
}

function makeScheduledPostAccount(User $user): ConnectedAccount
{
    return ConnectedAccount::create([
        'user_id' => $user->id,
        'system_id' => System::query()->value('id'),
        'zernio_account_id' => 'z-'.$user->id,
        'username' => 'tester',
        'display_name' => 'Tester',
    ]);
}

function makeScheduledPostAccountWithSystem(User $user, string $zernioId, string $url_slug): ConnectedAccount
{
    return ConnectedAccount::create([
        'user_id' => $user->id,
        'system_id' => System::query()->where('url_slug', $url_slug)->first()->value('id'),
        'zernio_account_id' => $zernioId,
        'username' => 'tester',
        'display_name' => 'Tester',
    ]);
}

function postPayload(ConnectedAccount $account, array $overrides = []): array
{
    return array_merge([
        'content' => 'Hello from TruePost',
        'is_draft' => false,
        'connectedAccountIds' => [$account->id],
        'is_scheduled' => false,
        'aiCustomize' => false,
    ], $overrides);
}

function postPayloadDraft(ConnectedAccount $account, array $overrides = []): array
{
    return array_merge([
        'content' => 'Hello from TruePost',
        'is_draft' => true,
        'connectedAccountIds' => [$account->id],
        'is_scheduled' => false,
        'aiCustomize' => false,
    ], $overrides);
}

function postPayloadUpdate(ConnectedAccount $account, array $overrides = []): array
{
    return array_merge([
        'content' => 'Hello from TruePost update',
        'is_draft' => false,
        'connectedAccountIds' => [$account->id],
        'is_scheduled' => false,
        'aiCustomize' => false,
    ], $overrides);
}