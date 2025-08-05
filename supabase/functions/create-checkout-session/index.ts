import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting checkout session creation...');
    
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const body = await req.json();
    const { planType, userId, couponCode } = body; // Added couponCode parameter
    
    console.log('Request data:', { planType, userId, couponCode });
    
    if (!planType || !userId) {
      throw new Error('Missing required fields: planType and userId');
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get price ID
    const priceId = planType === 'monthly' 
      ? Deno.env.get('VITE_STRIPE_PRICE_MONTHLY')
      : Deno.env.get('VITE_STRIPE_PRICE_YEARLY');
      
    if (!priceId) {
      throw new Error(`Price ID not found for plan type: ${planType}`);
    }

    // Get user info
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw new Error(`User not found: ${userError.message}`);
    }

    // Handle existing customer
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customer;
    if (existingSubscription?.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
      } catch {
        customer = null;
      }
    }
    
    if (!customer) {
      customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: { 
          supabase_user_id: userId,
          created_from: 'askstan_app'
        }
      });
    }

    // Validate coupon if provided
    let validCoupon = null;
    if (couponCode) {
      try {
        console.log('🎫 Validating coupon:', couponCode);
        validCoupon = await stripe.coupons.retrieve(couponCode);
        console.log('✅ Coupon valid:', validCoupon.id, `${validCoupon.percent_off}% off`);
      } catch (couponError) {
        console.log('❌ Invalid coupon:', couponError.message);
        throw new Error(`Invalid coupon code: ${couponCode}`);
      }
    }

    // Check if coupon provides 100% off
    const is100PercentOff = validCoupon && validCoupon.percent_off === 100;
    console.log('💯 Is 100% off coupon:', is100PercentOff);

    // Create checkout session configuration
    const appUrl = Deno.env.get('VITE_APP_URL');
    const successUrl = `${appUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}&coupon=${couponCode || ''}`;
    const cancelUrl = `${appUrl}/plans`;
    
    const sessionConfig = {
      customer: customer.id,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription' as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_type: planType,
        coupon_code: couponCode || '',
        source: 'askstan_app'
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_type: planType,
          coupon_applied: couponCode || 'none'
        }
      },
      // Allow promotion codes in checkout UI
      allow_promotion_codes: true,
    };

    // Add coupon if provided
    if (validCoupon) {
      sessionConfig.discounts = [{
        coupon: validCoupon.id
      }];
    }

    // If 100% off coupon, configure for no payment collection
    if (is100PercentOff) {
      console.log('🆓 Configuring free checkout (no payment required)');
      
      // For 100% off coupons, we need to create a subscription directly
      // instead of going through checkout
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId,
        }],
        coupon: validCoupon.id,
        metadata: {
          user_id: userId,
          plan_type: planType,
          coupon_applied: couponCode
        }
      });
      
      // Create subscription record in database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          plan_type: planType,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
        });
        
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to create subscription record');
      }
      
      // Return success without checkout session
      return new Response(
        JSON.stringify({ 
          success: true,
          paymentRequired: false,
          couponApplied: true,
          subscriptionId: subscription.id,
          redirectUrl: `${appUrl}/dashboard?coupon_success=true&plan=${planType}`
        }), 
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200
        }
      );
    } else {
      // Normal payment collection
      sessionConfig.payment_method_types = ['card'];
    }
    
    console.log('🛒 Creating checkout session with config:', {
      customer: customer.id,
      priceId,
      hasCoupon: !!validCoupon,
      is100PercentOff,
      paymentRequired: !is100PercentOff
    });
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      url: session.url,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total
    });
    
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        paymentRequired: !is100PercentOff,
        couponApplied: !!validCoupon,
        discount: validCoupon ? `${validCoupon.percent_off}%` : null
      }), 
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});