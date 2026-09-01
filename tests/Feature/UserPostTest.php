<?php

use App\Models\UserPost;
use App\Services\ZernioClient;

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

test('Test creating a post for the selected account and posting immediately', function (string $slug) {
    $user = makeScheduledPostProUser();
    $connectedAccount = makeScheduledPostAccountWithSystem($user, 'z-keep', $slug);

    $this->mock(ZernioClient::class, function ($mock) {
        $mock->shouldReceive('sendPost')->once()->andReturn('ok');
    });

    $this->actingAs($user)
        ->post(route('userPost.store'), postPayload($connectedAccount))
        ->assertRedirect(route('create'));

    $post = UserPost::query()->with('UserPostSystems')->first();

    expect($post)->not->toBeNull()
        ->and($post->is_draft)->toBeFalsy()
        ->and($post->has_posted)->toBe(1)
        ->and($post->UserPostSystems->first()->created_post_Id)->toBe('ok')
        ->and($post->dispatched_at)->not->toBeNull();

})->with(['twitter', 'linkedin', 'facebook', 'instagram', 'reddit']);

test('Test creating a post as a draft and then updating it to post immediately.', function (string $slug) {
    $user = makeScheduledPostProUser();
    $connectedAccount = makeScheduledPostAccountWithSystem($user, 'z-keep', $slug);

    $this->mock(ZernioClient::class, function ($mock) {
        $mock->shouldReceive('sendPost')->once()->andReturn('ok');
    });

    $this->actingAs($user)
        ->post(route('userPost.store'), postPayloadDraft($connectedAccount))
        ->assertRedirect(route('create'));

    $post = UserPost::query()->first();

    expect($post)->not->toBeNull()
        ->and($post->is_draft)->toBe(1)
        ->and($post->dispatched_at)->toBeNull();

    $this->actingAs($user)
        ->put(route('userPost.update', $post), postPayloadUpdate($connectedAccount))
        ->assertRedirect(route('userPost.index'));

    $post = UserPost::query()->with('UserPostSystems')->first();

    expect($post)->not->toBeNull()
        ->and($post->is_draft)->toBeFalsy()
        ->and($post->has_posted)->toBe(1)
        ->and($post->UserPostSystems->first()->created_post_Id)->toBe('ok')
        ->and($post->dispatched_at)->not->toBeNull();

})->with(['twitter', 'linkedin', 'facebook', 'instagram', 'reddit']);

test('Test Zernio Client Directly', function (string $slug) {

    $client = app(ZernioClient::class);
    $client->sendPost($slug, 'acct_1', 'hello', null, [], []);

})->with(['twitter', 'linkedin', 'facebook', 'instagram', 'reddit'])->throwsNoExceptions();
