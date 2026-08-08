<?php

namespace App\Exceptions;

use App\Models\User;
use RuntimeException;

class AccountLimitReached extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Free plans are limited to '.User::FREE_ACCOUNT_LIMIT.' connected accounts.');
    }
}
