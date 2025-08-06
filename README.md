# AskStan! - AI Social Media Growth Platform

A modern SaaS platform that helps users grow their social media presence with AI-powered coaching and strategies.

## 🌟 Features :

- **Complete Authentication System**: Sign up, sign in, email confirmation, password reset
- **Subscription Plans**: Monthly ($4.99) and Yearly ($49.99) plans with Stripe integration
- **AI Chatbot Dashboard**: Configurable chatbot interface for social media coaching
- **Modern UI**: Blue-to-gold gradient theme with glass morphism effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Protected Routes**: Role-based access control based on authentication and subscription status

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Payments**: Stripe (integration ready)
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Chatbot Integration

Edit `src/config/chatbot.js` to integrate your chatbot:

```javascript
export const chatbotConfig = {
  // Replace with your actual chatbot embed code
  embedCode: `
    <!-- Your chatbot HTML/JavaScript code here -->
  `,
  
  // Voiceflow integration (alternative)
  voiceflowProjectID: 'YOUR_PROJECT_ID',
  
  // Custom API endpoint (alternative)
  apiEndpoint: 'YOUR_API_ENDPOINT',
  
  settings: {
    theme: 'custom',
    primaryColor: '#3B82F6',
    accentColor: '#F59E0B'
  }
};
```

### Email Configuration (SendGrid)

Set up environment variables:

```env
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
```

### Stripe Configuration

Set up environment variables:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Update price IDs in `src/config/chatbot.js`:

```javascript
export const stripeConfig = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  prices: {
    monthly: 'price_your_monthly_price_id',
    yearly: 'price_your_yearly_price_id'
  }
};
```

## 📁 Image Assets

Replace placeholder images in `src/assets/images/`:

- `hero-image.jpg`: Main hero section background (1920x1080 recommended)
- `chatbot-avatar.png`: Chatbot avatar for chat interface (256x256 recommended)
- `logo.svg`: AskStan! logo (vector format preferred)

## 🎨 Design System

### Colors
- **Primary Blue**: #3B82F6
- **Accent Gold**: #F59E0B
- **Gradients**: `from-blue-500 to-yellow-500`

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Components
All UI components are located in `src/components/ui/`:
- `Button.tsx`: Customizable button with variants and loading states
- `Input.tsx`: Form input with label, error states, and icons
- `LoadingSpinner.tsx`: Animated loading indicator

## 🔐 Authentication Flow

1. **Sign Up**: Email confirmation required before account activation
2. **Email Confirmation**: Users must confirm email before accessing features
3. **Subscription**: Users must subscribe to access the dashboard
4. **Dashboard**: Full access to AI chatbot and features

## 💳 Subscription Tiers

### Monthly Plan - $4.99/month
- AI-powered social media coaching
- Multi-platform support
- Growth analytics dashboard
- 24/7 AI chat support

### Yearly Plan - $49.99/year (17% savings)
- All monthly features
- Priority AI responses
- Advanced analytics
- Custom growth strategies

## 🛡️ Security Features

- Protected routes with authentication checks
- Subscription status validation
- Secure form validation
- Error handling and user feedback

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

Optimized layouts and interactions for all screen sizes.

## 🔄 State Management

- **React Context**: Authentication and user state
- **Local Storage**: Session persistence
- **Protected Routes**: Automatic redirects based on auth/subscription status

## 📈 Features to Implement

### Backend Integration
- Replace mock authentication with real API calls
- Implement SendGrid email service
- Set up Stripe webhook handling
- Add database for user data persistence

### Additional Features
- User profile management
- Billing history
- Usage analytics
- Advanced chatbot features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

Built with ❤️ using React, TypeScript, and modern web technologies.