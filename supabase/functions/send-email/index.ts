import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();
    
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('VITE_FROM_EMAIL') || 'noreply@askstan.com';
    
    let subject = '';
    let htmlContent = '';
    
    switch (type) {
      case 'email_verification':
        subject = 'Verify your AskStan! account';
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(to right, #3B82F6, #F59E0B); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AskStan!</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Verify your email address</h2>
              <p style="color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
                Please verify your email address by clicking the button below to get started with your AI social media coach.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}" style="background: linear-gradient(to right, #3B82F6, #F59E0B); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Verify Email</a>
              </div>
              <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;
        break;
        
      case 'password_reset':
        subject = 'Reset your AskStan! password';
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(to right, #3B82F6, #F59E0B); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Reset your password</h2>
              <p style="color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
                Click the button below to reset your password. This link will expire in 1 hour.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" style="background: linear-gradient(to right, #3B82F6, #F59E0B); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Password</a>
              </div>
              <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;
        break;
        
      case 'subscription_success':
        subject = 'Welcome to AskStan! Pro 🎉';
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(to right, #3B82F6, #F59E0B); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Confirmed!</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome to AskStan! Pro</h2>
              <p style="color: #6B7280; line-height: 1.6; margin-bottom: 20px;">
                Thank you for subscribing to AskStan! ${data.planType} plan. You now have access to:
              </p>
              <ul style="color: #6B7280; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
                <li>Unlimited AI coaching sessions</li>
                <li>Advanced growth strategies</li>
                <li>Priority support</li>
                <li>Exclusive content tips</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('VITE_APP_URL')}/dashboard" style="background: linear-gradient(to right, #3B82F6, #F59E0B); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Start Growing Now</a>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'payment_failed':
        subject = 'Payment Failed - Action Required';
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #EF4444; padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Payment Failed</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Update your payment method</h2>
              <p style="color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
                We were unable to process your payment. Please update your payment method to continue enjoying AskStan! Pro features.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.retryUrl}" style="background: #EF4444; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Update Payment Method</a>
              </div>
            </div>
          </div>
        `;
        break;
    }
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject
        }],
        from: { email: fromEmail, name: 'AskStan!' },
        content: [{
          type: 'text/html',
          value: htmlContent
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});