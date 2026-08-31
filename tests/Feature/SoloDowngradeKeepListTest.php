<?php

use App\Actions\Subscription\ApplySoloKeepList;
use App\Models\BotPost;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Models\UserPost;
use App\Models\UserPostSystem;
use App\Services\ZernioClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('apply solo keep list disconnects extra accounts and deletes extra bots without wiping posts', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);
    $keepAccount = makeConnectedAccount($user, 'z-keep');
    $dropAccount = makeConnectedAccount($user, 'z-drop');
    $keepBot = makeBot($user, 'Keep this bot');
    $dropBot = makeBot($user, 'Drop this bot');

    $post = UserPost::create([
        'user_id' => $user->id,
        'original_content' => 'A post on the extra account',
        'media_url' => 'https://example.test/image.jpg',
    ]);
    UserPostSystem::create([
        'user_post_id' => $post->id,
        'connected_account_id' => $dropAccount->id,
    ]);

    $zernio = Mockery::mock(ZernioClient::class);
    $zernio->shouldReceive('disconnectAccount')->once()->with('z-drop');

    (new ApplySoloKeepList($zernio))->handle($user, [$keepAccount->id], [$keepBot->id]);

    expect(ConnectedAccount::query()->pluck('id')->all())->toBe([$keepAccount->id])
        ->and(BotPost::query()->pluck('id')->all())->toBe([$keepBot->id])
        ->and(UserPost::query()->find($post->id))->not->toBeNull()
        ->and(BotPost::query()->find($dropBot->id))->toBeNull();
});

test('apply solo keep list leaves resources alone when keep lists are omitted', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);
    $account = makeConnectedAccount($user, 'z-keep-all');
    $bot = makeBot($user, 'Keep all bots');

    $zernio = Mockery::mock(ZernioClient::class);
    $zernio->shouldNotReceive('disconnectAccount');

    (new ApplySoloKeepList($zernio))->handle($user, null, null);

    expect(ConnectedAccount::query()->find($account->id))->not->toBeNull()
        ->and(BotPost::query()->find($bot->id))->not->toBeNull();
});

test('profile settings include connected accounts and bots', function () {
    $user = makeProUser();
    makeConnectedAccount($user, 'z-one');
    makeBot($user, 'A bot');

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('connectedAccounts', 1)
            ->has('bots', 1)
        );
});

test('pro members over solo limits cannot skip the keep list via get checkout', function () {
    $user = makeProUser();
    makeConnectedAccount($user, 'z-1');
    makeConnectedAccount($user, 'z-2');
    makeConnectedAccount($user, 'z-3');
    makeConnectedAccount($user, 'z-4');

    $this->actingAs($user)
        ->get(route('solo-subscription.checkout'))
        ->assertRedirect(route('profile.edit'));
});

test('over-limit downgrade without keep ids is rejected', function () {
    $user = makeProUser();
    $accounts = collect([
        makeConnectedAccount($user, 'z-1'),
        makeConnectedAccount($user, 'z-2'),
        makeConnectedAccount($user, 'z-3'),
        makeConnectedAccount($user, 'z-4'),
    ]);
    makeBot($user, 'Bot one');
    makeBot($user, 'Bot two');

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('solo-subscription.downgrade'))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHasErrors(['keep_account_ids', 'keep_bot_ids']);

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('solo-subscription.downgrade'), [
            'keep_account_ids' => $accounts->pluck('id')->all(),
            'keep_bot_ids' => BotPost::query()->pluck('id')->all(),
        ])
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHasErrors(['keep_account_ids', 'keep_bot_ids']);
});

test('keep list ids must belong to the current user', function () {
    $user = makeProUser();
    $own = collect([
        makeConnectedAccount($user, 'z-1'),
        makeConnectedAccount($user, 'z-2'),
        makeConnectedAccount($user, 'z-3'),
        makeConnectedAccount($user, 'z-4'),
    ]);

    $other = User::factory()->create(['timezone' => 'UTC']);
    $foreign = makeConnectedAccount($other, 'z-foreign');

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('solo-subscription.downgrade'), [
            'keep_account_ids' => [$own[0]->id, $own[1]->id, $foreign->id],
        ])
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHasErrors(['keep_account_ids.2']);
});
