<?php

test('zernio webhook url probe succeeds', function () {
    $this->get('/webhooks/zernio')->assertNoContent();
});

test('zernio webhook rejects a bad signature', function () {
    $this->postJson('/webhooks/zernio', ['event' => 'webhook.test'], [
        'X-Zernio-Signature' => 'invalid',
    ])->assertForbidden();
});

test('zernio webhook accepts a signed payload', function () {
    config(['services.zernio.webhook_secret' => 'test-secret']);

    $payload = ['event' => 'webhook.test'];
    $signature = hash_hmac('sha256', json_encode($payload), 'test-secret');

    $this->call('POST', '/webhooks/zernio', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_X_ZERNIO_SIGNATURE' => $signature,
    ], json_encode($payload))->assertNoContent();
});
