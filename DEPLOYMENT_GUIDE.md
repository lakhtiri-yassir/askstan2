# AskStan! Deployment Guide

## 🚀 Quick Deployment Checklist

### Prerequisites
- [ ] Node.js 20+ installed locally
- [ ] Supabase project created
- [ ] Stripe account with test/live keys
- [ ] SendGrid account with API key
- [ ] Netlify account (or preferred hosting)

### 1. Environment Setup

#### Local Development (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_STRIPE_PRICE_MONTHLY=price_monthly_id_from_stripe
VITE_STRIPE_PRICE_YEARLY=price_yearly_id_from_stripe

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_FROM_EMAIL=noreply@askstan.com
```

#### Production Environment Variables
Set these in your hosting provider (Netlify, Vercel, etc.):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key
VITE_STRIPE_PRICE_MONTHLY=price_live_monthly_id
VITE_STRIPE_PRICE_YEARLY=price_live_yearly_id
VITE_APP_URL=https://your-domain.com
VITE_FROM_EMAIL=noreply@your-domain.com
```

### 2. Supabase Setup

#### Database Migration
1. Go to Supabase SQL Editor
2. Run the migration: `supabase/migrations/create_initial_schema.sql`
3. Verify tables are created with RLS enabled

#### Edge Functions Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session  
supabase functions deploy stripe-webhooks
supabase functions deploy send-email
```

#### Edge Function Environment Variables
Set in Supabase Dashboard > Settings > Edge Functions:
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=SG.your_sendgrid_api_key
VITE_APP_URL=https://your-domain.com
VITE_FROM_EMAIL=noreply@your-domain.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Stripe Configuration

#### Create Products
1. Go to Stripe Dashboard > Products
2. Create "Monthly Plan" - $4.99/month recurring
3. Create "Yearly Plan" - $49.99/year recurring
4. Copy price IDs to environment variables

#### Webhook Setup
1. Go to Webhooks section
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to environment variables

### 4. SendGrid Setup

#### API Key
1. Create API key with full access
2. Add to Supabase environment variables

#### Domain Authentication (Recommended)
1. Authenticate your domain in SendGrid
2. Update `VITE_FROM_EMAIL` to use authenticated domain

### 5. Chatbot Integration

#### Add Your Chatbot
1. Open `src/config/chatbot.config.ts`
2. Replace `embedCode` with your chatbot's embed code:

```typescript
embedCode: `
  <!-- PASTE YOUR CHATBOT EMBED CODE HERE -->
  <div id="my-chatbot"></div>
  <script>
    MyChatbot.init({
      apiKey: 'your-api-key',
      userId: '${user?.id || 'anonymous'}',
      userEmail: '${user?.email || ''}'
    });
  </script>
`
```

### 6. Build & Deploy

#### Local Testing
```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Netlify Deployment
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy!

#### Performance Verification
```bash
# Analyze bundle size
npm run build:analyze

# Check build output
ls -la dist/

# Verify gzip compression
gzip -9 < dist/assets/index-*.js | wc -c
```

## 🔧 Performance Optimizations Implemented

### Bundle Splitting
- Vendor chunks (React, React DOM)
- Router chunk (React Router)
- UI chunk (Framer Motion, Lucide)
- Auth chunk (Supabase)
- Payments chunk (Stripe)

### Code Optimizations
- Lazy loading for all routes
- Memoized components
- Debounced/throttled functions
- Image lazy loading
- Tree shaking enabled

### Caching Strategy
- Static assets cached for 1 year
- Service worker for offline support
- Font optimization with swap display

## 📊 Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Size Targets
- **Initial bundle**: < 200KB gzipped
- **Total JavaScript**: < 500KB gzipped
- **CSS**: < 50KB gzipped

### Lighthouse Scores
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

## 🐛 Troubleshooting

### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 20+

# Verify terser installation
npm list terser
```

### Performance Issues
```bash
# Analyze bundle
npm run build:analyze

# Check memory usage
npm run dev
# Open DevTools > Performance tab
```

### Deployment Issues
```bash
# Test production build locally
npm run build && npm run preview

# Check environment variables
echo $VITE_SUPABASE_URL

# Verify Supabase functions
curl https://your-project.supabase.co/functions/v1/health
```

## 🎯 Post-Deployment Testing

1. **Functionality Testing**
   - [ ] User registration works
   - [ ] Email verification received
   - [ ] Stripe checkout completes
   - [ ] Dashboard loads with chatbot
   - [ ] Settings page functions

2. **Performance Testing**
   - [ ] Run Lighthouse audit
   - [ ] Test on slow 3G connection
   - [ ] Verify mobile performance
   - [ ] Check bundle sizes

3. **Security Testing**
   - [ ] HTTPS enabled
   - [ ] Environment variables secure
   - [ ] API endpoints protected
   - [ ] RLS policies working

Your AskStan! platform is now optimized for production deployment with real backend services!