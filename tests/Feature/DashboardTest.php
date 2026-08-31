<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('create'));
    $response->assertRedirect(route('login'));
});

test('authenticated users cant visit the dashboard', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);
    $this->actingAs($user);

    $this->get(route('create'))->assertStatus(302)->assertRedirect(route('solo-subscription.checkout'));
});


test('authenticated users with solo subscription cant visit the dashboard', function () {
    $user = makeScheduledPostSoloUser();
    $this->actingAs($user);


    $response = $this->get(route('create'));

    $response->assertOk();
});
