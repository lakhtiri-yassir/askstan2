// Chatbot configuration for AskStan!
export const chatbotConfig = {
  // Replace this with your actual chatbot embed code
  embedCode: `
    <!-- REPLACE THIS WITH YOUR CHATBOT EMBED CODE -->
    <!-- Example: Voiceflow, Intercom, or custom chatbot -->
    <div id="chatbot-placeholder" style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
      background: linear-gradient(135deg, #3B82F6 0%, #F59E0B 100%);
      border-radius: 12px;
      color: white;
      font-size: 18px;
      font-weight: 600;
    ">
      🤖 Your Chatbot Will Appear Here
      <br><br>
      Replace the embedCode in src/config/chatbot.js
    </div>
    <script>
      // Your chatbot initialization code goes here
      console.log('Chatbot loaded - replace with actual embed code');
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
  apiKey: process.env.REACT_APP_SENDGRID_API_KEY,
  fromEmail: 'noreply@askstan.com',
  templates: {
    emailConfirmation: 'd-your-template-id',
    passwordReset: 'd-your-template-id',
    welcome: 'd-your-template-id'
  }
};

// Stripe configuration (replace with your actual keys and price IDs)
export const stripeConfig = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  prices: {
    monthly: 'price_your_monthly_price_id', // $4.99/month
    yearly: 'price_your_yearly_price_id'    // $49.99/year
  }
};