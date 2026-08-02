<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class GenerateBasePost implements Agent, Conversational, HasTools
{
    use Promptable;

    public function __construct(public string $agentDescription, public ?array $pastPosts) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'You are to model yourself given the following instruction/prompt/guidelines: '.$this->agentDescription.
            '. Your primary goal is to generate a social media post within the realm of what was previously given. It should be engaging but not too long winded.'.
            'it should be unique against the following array of past posts: ['.implode(', ', $this->pastPosts).']';
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [];
    }
}
