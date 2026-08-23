<?php

namespace App\Http\Controllers;

use App\Actions\Subscription\ApplySoloKeepList;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Laravel\Cashier\Checkout;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionController extends Controller
{
    /**
     * @throws \Exception
     */
    public function checkoutSolo(Request $request, ApplySoloKeepList $applySoloKeepList)
    {
        $user = $request->user();

        if ($user->isSoloMember() && ! $user->isProMember()) {
            return to_route('create');
        }

        if ($user->isProMember()) {
            if ($request->isMethod('post')) {
                $this->storeDowngradeKeepList($request, $user);
            } elseif ($user->isOverSoloLimit() && ! $this->hasStoredKeepList()) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => __('Choose which accounts and bots to keep before switching to Solo.'),
                ]);

                return to_route('profile.edit');
            }

            if ($this->resumeSoloAndCancelPro($user)) {
                $this->applyStoredKeepList($user, $applySoloKeepList);

                Inertia::flash('toast', [
                    'type' => 'success',
                    'message' => __('You are back on Solo.'),
                ]);

                return to_route('create');
            }
        }

        $builder = $user->newSubscription('solo', env('SOLO_STRIPE_PRICE_ID'));

        if (! $user->subscriptions()->exists()) {
            $builder->trialDays(7);
        }

        return $this->toCheckoutResponse($builder->checkout([
            'success_url' => route('solo-subscription.success'),
            'cancel_url' => route('profile.edit'),
        ]), $request);
    }

    public function soloSuccess(Request $request, ApplySoloKeepList $applySoloKeepList): RedirectResponse
    {
        $user = $request->user();

        if ($user->subscribed('solo')) {
            $user->cancelSubscriptionNow('pro');
            $this->applyStoredKeepList($user, $applySoloKeepList);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('You are on the Solo plan now!'),
            ]);

            return to_route('create');
        }

        return to_route('profile.edit');
    }

    public function checkoutPro(Request $request)
    {
        $user = $request->user();

        if (! $user->hasActiveSubscription()) {
            return to_route('solo-subscription.checkout');
        }

        if ($user->isProMember()) {
            return to_route('create');
        }

        return $this->toCheckoutResponse(
            $user
                ->newSubscription('pro', env('PRO_STRIPE_PRICE_ID'))
                ->checkout([
                    'success_url' => route('pro-subscription.success'),
                    'cancel_url' => route('profile.edit'),
                ]),
            $request,
        );
    }

    public function proSuccess(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->subscribed('pro')) {
            $user->cancelSubscriptionNow('solo');

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('You are on the Pro plan now!'),
            ]);

            return to_route('create');
        }

        return to_route('profile.edit');
    }

    private function storeDowngradeKeepList(Request $request, User $user): void
    {
        $rules = [];

        if ($user->isOverSoloAccountLimit()) {
            $rules['keep_account_ids'] = ['present', 'array', 'max:'.User::SOLO_ACCOUNT_LIMIT];
            $rules['keep_account_ids.*'] = [
                'integer',
                Rule::exists('connected_accounts', 'id')->where('user_id', $user->id),
            ];
        }

        if ($user->isOverSoloBotLimit()) {
            $rules['keep_bot_ids'] = ['present', 'array', 'max:'.User::SOLO_BOT_LIMIT];
            $rules['keep_bot_ids.*'] = [
                'integer',
                Rule::exists('bot_posts', 'id')->where('user_id', $user->id),
            ];
        }

        $validated = $rules === [] ? [] : $request->validate($rules);

        $request->session()->put(
            ApplySoloKeepList::SESSION_ACCOUNT_IDS,
            array_key_exists('keep_account_ids', $validated)
                ? array_map(intval(...), $validated['keep_account_ids'])
                : null,
        );
        $request->session()->put(
            ApplySoloKeepList::SESSION_BOT_IDS,
            array_key_exists('keep_bot_ids', $validated)
                ? array_map(intval(...), $validated['keep_bot_ids'])
                : null,
        );
    }

    private function hasStoredKeepList(): bool
    {
        return session()->exists(ApplySoloKeepList::SESSION_ACCOUNT_IDS)
            || session()->exists(ApplySoloKeepList::SESSION_BOT_IDS);
    }

    private function applyStoredKeepList(User $user, ApplySoloKeepList $applySoloKeepList): void
    {
        $applySoloKeepList->handle(
            $user,
            session()->exists(ApplySoloKeepList::SESSION_ACCOUNT_IDS)
                ? session(ApplySoloKeepList::SESSION_ACCOUNT_IDS)
                : null,
            session()->exists(ApplySoloKeepList::SESSION_BOT_IDS)
                ? session(ApplySoloKeepList::SESSION_BOT_IDS)
                : null,
        );

        session()->forget([
            ApplySoloKeepList::SESSION_ACCOUNT_IDS,
            ApplySoloKeepList::SESSION_BOT_IDS,
        ]);
    }

    private function resumeSoloAndCancelPro(User $user): bool
    {
        $solo = $user->subscription('solo');

        if ($solo === null || ! $solo->onGracePeriod()) {
            return false;
        }

        $solo->resume();
        $user->cancelSubscriptionNow('pro');

        return true;
    }

    private function toCheckoutResponse(Checkout $checkout, Request $request): Checkout|Response
    {
        if ($request->header('X-Inertia')) {
            return Inertia::location($checkout->asStripeCheckoutSession()->url);
        }

        return $checkout;
    }
}
