<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timestamp = \Illuminate\Support\now();

        $systems = [
            [
                'id' => 1,
                'name' => 'X',
                'icon' => 'FaXTwitter',
                'order' => 1,
                'max_post_length' => 280,
                'background_color' => '#000000',
                'image_required' => false,
                'icon_color' => '#000000',
                'url_slug' => 'twitter',
                'can_collaborate' => false,
                'can_tag' => false,
                'scopes' => ['tweet.write', 'offline.access', 'media.write'],
            ],
            [
                'id' => 2,
                'name' => 'Instagram',
                'icon' => 'FaInstagram',
                'order' => 2,
                'max_post_length' => 3000,
                'background_color' => '#E4405F',
                'image_required' => true,
                'icon_color' => '#E4405F',
                'url_slug' => 'instagram',
                'can_collaborate' => true,
                'can_tag' => false,
                'scopes' => [],
            ],
            [
                'id' => 3,
                'name' => 'LinkedIn',
                'icon' => 'FaLinkedinIn',
                'order' => 3,
                'max_post_length' => 3000,
                'background_color' => '#0A66C2',
                'image_required' => false,
                'icon_color' => '#0A66C2',
                'url_slug' => 'linkedin',
                'can_collaborate' => false,
                'can_tag' => false,
                'scopes' => ['w_member_social', 'openid', 'profile', 'email'],
            ],
            [
                'id' => 4,
                'name' => 'Facebook',
                'icon' => 'FaFacebookF',
                'order' => 5,
                'max_post_length' => 3000,
                'background_color' => '#1877F2',
                'image_required' => false,
                'icon_color' => '#1877F2',
                'url_slug' => 'facebook',
                'can_collaborate' => false,
                'can_tag' => false,
                'scopes' => ['pages_manage_posts', 'email', 'pages_read_user_content'],
            ],
        ];

        $rows = array_map(fn (array $system) => [
            ...$system,
            'scopes' => json_encode($system['scopes']),
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ], $systems);

        DB::table('systems')->upsert($rows, ['id']);
    }
}
