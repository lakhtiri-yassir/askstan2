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
    const { planType, userId, userEmail, couponCode } = body;
    
    console.log('Request data:', { planType, userId, userEmail, couponCode });
    
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

    // CRITICAL FIX: Get or create user profile with fallback
    let userProfile;
    let userError;
    
    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('email, id')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records gracefully
    
    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    
    if (existingProfile) {
      // Profile exists, use it
      console.log('✅ Found existing user profile:', existingProfile.email);
      userProfile = existingProfile;
    } else {
      // Profile doesn't exist, create it
      console.log('📝 User profile not found, creating new profile...');
      
      if (!userEmail) {
        throw new Error('userEmail is required when profile does not exist');
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('email, id')
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }
      
      console.log('✅ Created new user profile:', newProfile.email);
      userProfile = newProfile;
    }

    // Handle existing customer
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() for consistency

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
    
    const sessionConfig: any = {
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

    // ENHANCED: If 100% off coupon, create subscription directly without payment
    if (is100PercentOff) {
      console.log('🆓 Creating free subscription (100% off coupon - no payment required)');
      
      try {
        // Create the subscription directly without checkout
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: priceId,
          }],
          coupon: validCoupon.id,
          metadata: {
            user_id: userId,
            plan_type: planType,
            coupon_applied: couponCode,
            source: 'free_coupon_subscription'
          }
        });
        
        console.log('✅ Free Stripe subscription created:', subscription.id);
        
        // Create subscription record in database
        const { error: dbError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_type: planType,
            price_id: priceId,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            metadata: {
              coupon_applied: couponCode,
              discount: '100%',
              source: 'free_coupon_subscription'
            }
          });
        
        if (dbError) {
          console.error('❌ Failed to create subscription record:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }
        
        console.log('✅ Free subscription created successfully in database');
        
        // Return direct success - no checkout needed
        const directSuccessUrl = successUrl.replace('{CHECKOUT_SESSION_ID}', `free_${subscription.id}`);
        
        return new Response(
          JSON.stringify({ 
            url: directSuccessUrl,
            sessionId: `free_${subscription.id}`,
            subscriptionId: subscription.id,
            paymentRequired: false,
            couponApplied: true,
            discount: '100%',
            status: 'active',
            message: 'Subscription activated with 100% discount - no payment required!'
          }), 
          {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            },
            status: 200
          }
        );
        
      } catch (subscriptionError) {
        console.error('❌ Failed to create free subscription:', subscriptionError);
        throw new Error(`Failed to create free subscription: ${subscriptionError.message}`);
      }
    }

    console.log('💳 Creating standard checkout session:', {
      customerId: customer.id,
      priceId,
      hasValidCoupon: !!validCoupon,
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