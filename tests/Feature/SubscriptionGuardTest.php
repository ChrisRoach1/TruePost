¡<?php

use App\Models\User;

test('unsubscribed users are redirected from app routes to solo checkout', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);

    $this->actingAs($user)
        ->get(route('create'))
        ->assertStatus(302)
        ->assertRedirect(route('solo-subscription.checkout'));

    $this->actingAs($user)
        ->get(route('accounts'))
        ->assertStatus(302)
        ->assertRedirect(route('solo-subscription.checkout'));

    $this->actingAs($user)
        ->get(route('bots.list'))
        ->assertStatus(302)
        ->assertRedirect(route('solo-subscription.checkout'));
});

test('unsubscribed users can still visit profile settings', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk();
});
