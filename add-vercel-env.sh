#!/bin/bash

# This script adds environment variables to Vercel
# You need to update these values with your actual credentials

echo "Adding environment variables to Vercel..."

# Add each environment variable
vercel env add DATABASE_URL production < /dev/null << EOF
postgresql://your_database_url_here
EOF

vercel env add NEXTAUTH_URL production < /dev/null << EOF
https://shopier-saas.vercel.app
EOF

vercel env add NEXTAUTH_SECRET production < /dev/null << EOF
$(openssl rand -base64 32)
EOF

vercel env add STRIPE_PUBLIC_KEY production < /dev/null << EOF
pk_test_your_stripe_public_key
EOF

vercel env add STRIPE_SECRET_KEY production < /dev/null << EOF
sk_test_your_stripe_secret_key
EOF

vercel env add STRIPE_WEBHOOK_SECRET production < /dev/null << EOF
whsec_your_stripe_webhook_secret
EOF

vercel env add STRIPE_CONNECT_CLIENT_ID production < /dev/null << EOF
ca_your_stripe_connect_client_id
EOF

vercel env add RESEND_API_KEY production < /dev/null << EOF
re_your_resend_api_key
EOF

vercel env add BLOB_READ_WRITE_TOKEN production < /dev/null << EOF
vercel_blob_your_token
EOF

vercel env add NEXT_PUBLIC_POSTHOG_KEY production < /dev/null << EOF
phc_your_posthog_key
EOF

vercel env add NEXT_PUBLIC_POSTHOG_HOST production < /dev/null << EOF
https://app.posthog.com
EOF

vercel env add NEXT_PUBLIC_ROOT_DOMAIN production < /dev/null << EOF
shopier-saas.vercel.app
EOF

echo "Environment variables added successfully!"
echo "Please update the values in Vercel dashboard with your actual credentials."