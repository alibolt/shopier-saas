# Shopier SaaS - Multi-tenant E-commerce Platform

A modern multi-tenant e-commerce SaaS platform built with Next.js 15, Stripe Connect, and Prisma. Create your own online store in minutes with custom domain support.

## Features

- 🏪 **Multi-tenant Architecture** - Each merchant gets their own store
- 💳 **Stripe Connect Integration** - Accept payments with platform fees
- 🌐 **Custom Domain Support** - Use your own domain or subdomain
- 🛍️ **Product Management** - Full CRUD operations for products
- 🔐 **Authentication** - Secure login with NextAuth.js
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Performance** - Built with Next.js 15 and Turbopack

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe Connect Express
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account with Connect enabled
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopier-saas.git
cd shopier-saas
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Database URL
- NextAuth secret
- Stripe API keys
- Other required variables

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth pages (login/register)
│   ├── (dashboard)/     # Merchant dashboard
│   ├── [domain]/        # Dynamic storefront routing
│   ├── api/             # API routes
│   └── page.tsx         # Homepage
├── components/          # Reusable components
├── lib/                 # Utilities and configurations
├── middleware.ts        # Custom domain routing
└── types/              # TypeScript types
```

## Key Features Implementation

### Custom Domain Routing
The middleware handles subdomain and custom domain routing, directing traffic to the appropriate store.

### Stripe Connect
Merchants can onboard with Stripe Connect Express to accept payments. Platform fees are automatically collected.

### Multi-tenant Data Isolation
Each store's data is isolated using Prisma relations and proper access control.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Configure Custom Domains

1. Add domain to Vercel project settings
2. Configure DNS records
3. Update store domain in database

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret"

# Stripe
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."

# Other
NEXT_PUBLIC_ROOT_DOMAIN="yourdomain.com"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License