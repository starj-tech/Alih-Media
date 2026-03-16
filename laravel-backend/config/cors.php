<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'https://alihmedia.kantahkabbogor.id'),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://alihmedia.kantahkabbogor.id',
        'https://alihmedia.kantahkabbogor.id',
        'http://dev-alihmedia.kantahkabbogor.id',
        'https://dev-alihmedia.kantahkabbogor.id',
        'https://alih-media.lovable.app',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
