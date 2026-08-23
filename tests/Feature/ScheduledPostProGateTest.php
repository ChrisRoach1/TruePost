<?php

use App\Jobs\SendDuePosts;
use App\Jobs\SendPosts;
use App\Models\ConnectedAccount;
use App\Models\System;
use App\Models\User;
use App\Models\UserPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

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

test('solo members can post immediately', function () {
    Queue::fake();

    $user = makeScheduledPostSoloUser();
    $account = makeScheduledPostAccount($user);

    $this->actingAs($user)
        ->post(route('userPost.store'), postPayload($account))
        ->assertRedirect(route('create'));

    $post = UserPost::query()->first();

    expect($post)->not->toBeNull()
        ->and($post->is_draft)->toBeFalsy()
        ->and($post->dispatched_at)->not->toBeNull();

    Queue::assertPushed(SendPosts::class);
});

test('solo members cannot schedule posts', function () {
    Queue::fake();

    $user = makeScheduledPostSoloUser();
    $account = makeScheduledPostAccount($user);

    $this->actingAs($user)
        ->from(route('create'))
        ->post(route('userPost.store'), postPayload($account, [
            'is_scheduled' => true,
            'scheduled_date_string' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:00',
        ]))
        ->assertRedirect(route('create'))
        ->assertSessionHasErrors('is_scheduled');

    expect(UserPost::query()->count())->toBe(0);
    Queue::assertNothingPushed();
});

test('pro members can schedule posts', function () {
    Queue::fake();

    $user = makeScheduledPostProUser();
    $account = makeScheduledPostAccount($user);

    $this->actingAs($user)
        ->post(route('userPost.store'), postPayload($account, [
            'is_scheduled' => true,
            'scheduled_date_string' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:00',
        ]))
        ->assertRedirect(route('create'));

    $post = UserPost::query()->first();

    expect($post)->not->toBeNull()
        ->and($post->is_draft)->toBeFalsy()
        ->and($post->post_at)->not->toBeNull()
        ->and($post->dispatched_at)->toBeNull();

    Queue::assertNothingPushed();
});

test('send due posts still fires grandfathered solo schedules', function () {
    Queue::fake();

    $user = makeScheduledPostSoloUser();

    $post = UserPost::create([
        'user_id' => $user->id,
        'original_content' => 'Queued while on Pro',
        'media_url' => 'https://example.test/image.jpg',
        'is_draft' => false,
        'has_posted' => false,
        'post_at' => now()->subMinute(),
        'dispatched_at' => null,
    ]);

    (new SendDuePosts)->handle();

    expect($post->fresh()->dispatched_at)->not->toBeNull();

    Queue::assertPushed(SendPosts::class, fn (SendPosts $job) => $job->userPost->id === $post->id);
});
