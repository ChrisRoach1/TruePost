<?php

use App\Models\User;

test('unsubscribed users are redirected from app routes to solo checkout', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('create'))
        ->assertRedirect(route('solo-subscription.checkout'));

    $this->actingAs($user)
        ->get(route('accounts'))
        ->assertRedirect(route('solo-subscription.checkout'));

    $this->actingAs($user)
        ->get(route('bots.list'))
        ->assertRedirect(route('solo-subscription.checkout'));
});

test('unsubscribed users can still visit profile settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk();
});
