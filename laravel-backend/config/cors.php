<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://dev-alihmedia.kantahkabbogor.id'),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://dev-alihmedia.kantahkabbogor.id',
        'https://dev-alihmedia.kantahkabbogor.id',
        'https://alih-media.lovable.app',
        'https://alihmedia.kantahkabbogor.id',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
