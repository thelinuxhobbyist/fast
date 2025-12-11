<?php
// Configuration helper for server-side scripts.
// Prefer using environment variables in production. You can set these in Apache/Nginx or your system.

// Example (bash):
// export STRIPE_SECRET="sk_live_..."
// export FORMSPREE_ENDPOINT="https://formspree.io/f/xldkyoqz"

// Use environment variables if present, otherwise fallback to these placeholders.
define('STRIPE_SECRET', getenv('STRIPE_SECRET') ?: 'sk_test_YOUR_KEY_HERE');
define('FORMSPREE_ENDPOINT', getenv('FORMSPREE_ENDPOINT') ?: 'https://formspree.io/f/xldkyoqz');

// Optional - if you want to store webhook-received payments locally, set a writable path.
define('PAYMENTS_STORE', __DIR__ . '/data/payments.json');

?>
