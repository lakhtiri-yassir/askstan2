// Chatbot configuration for AskStan!
export const chatbotConfig = {
  // Replace this with your actual chatbot embed code
  embedCode: `
    <script type="text/javascript">
  (function(d, t) {
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        window.voiceflow.chat.load({
          verify: { projectID: '688d150bdb7293eb99bdbe16' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'production',
          voice: {
            url: "https://runtime-api.voiceflow.com"
          }
        });
      }
      v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
  })(document, 'script');
</script>
  `,
  
  // Alternative configurations for different chatbot platforms
  voiceflowProjectID: 'YOUR_VOICEFLOW_PROJECT_ID_HERE',
  
  // Custom API endpoint for chatbot
  apiEndpoint: 'YOUR_CHATBOT_API_ENDPOINT',
  
  // Chatbot UI settings
  settings: {
    theme: 'custom',
    primaryColor: '#3B82F6',
    accentColor: '#F59E0B',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '12px'
  }
};

// Email service configuration (replace with your SendGrid details)
export const emailConfig = {
  apiKey: import.meta.env.VITE_SENDGRID_API_KEY,
  fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@askstan.com',
  templates: {
    emailConfirmation: 'd-your-template-id',
    passwordReset: 'd-your-template-id',
    welcome: 'd-your-template-id'
  }
};

// Stripe configuration (replace with your actual keys and price IDs)
export const stripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  prices: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_yearly_placeholder'
  }
};