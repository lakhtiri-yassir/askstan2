# AskStan! Backend Setup Instructions

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Stripe Account**: Create an account at [stripe.com](https://stripe.com)
3. **SendGrid Account**: Create an account at [sendgrid.com](https://sendgrid.com)

## 1. Supabase Setup

### Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/create_initial_schema.sql`

### Environment Variables
1. Go to Settings > API
2. Copy your project URL and anon key
3. Update your `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Edge Functions
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   supabase functions deploy stripe-webhooks
   supabase functions deploy send-email
   ```

### Edge Function Environment Variables
Set these in your Supabase dashboard (Settings > Edge Functions):
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VITE_STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
VITE_STRIPE_PRICE_YEARLY=price_your_yearly_price_id
SENDGRID_API_KEY=SG.your_sendgrid_api_key
VITE_FROM_EMAIL=noreply@askstan.com
VITE_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2. Stripe Setup

### Create Products and Prices
1. Go to Stripe Dashboard > Products
2. Create two products:
   - **Monthly Plan**: $4.99/month recurring
   - **Yearly Plan**: $49.99/year recurring
3. Copy the price IDs and add them to your environment variables

### Webhook Setup
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhooks`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret and add to Supabase environment variables

## 3. SendGrid Setup

### API Key
1. Go to SendGrid Dashboard > Settings > API Keys
2. Create a new API key with full access
3. Add to Supabase environment variables: `SENDGRID_API_KEY=SG.your_key`

### Domain Authentication (Optional but recommended)
1. Go to Settings > Sender Authentication
2. Authenticate your domain
3. Update `VITE_FROM_EMAIL` to use your authenticated domain

## 4. Local Development

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_STRIPE_PRICE_MONTHLY=price_monthly_id
VITE_STRIPE_PRICE_YEARLY=price_yearly_id
VITE_FROM_EMAIL=noreply@askstan.com
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=AskStan!
```

### Start Development Server
```bash
npm run dev
```

## 5. Testing

### Test User Registration
1. Sign up with a real email address
2. Check email for verification link
3. Verify email and complete onboarding

### Test Stripe Integration
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

### Test Chatbot Integration
1. Follow instructions in `CHATBOT_SETUP.md`
2. Replace the placeholder embed code with your actual chatbot

## 6. Production Deployment

### Environment Variables for Production
Update all URLs to production values:
```
VITE_APP_URL=https://your-production-domain.com
```

### Stripe Webhook URL
Update webhook endpoint to production URL:
```
https://your-project.supabase.co/functions/v1/stripe-webhooks
```

### Domain Configuration
- Update CORS settings in Supabase
- Configure custom domain if needed
- Update SendGrid domain authentication

## Troubleshooting

### Common Issues

1. **Email not sending**: Check SendGrid API key and domain authentication
2. **Stripe webhook failing**: Verify webhook secret and endpoint URL
3. **Database errors**: Check RLS policies and user permissions
4. **Chatbot not loading**: Verify embed code syntax and external script URLs

### Debug Mode
Enable debug logging by adding to your environment:
```
NODE_ENV=development
```

### Support
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- Stripe: [stripe.com/docs](https://stripe.com/docs)
- SendGrid: [docs.sendgrid.com](https://docs.sendgrid.com)