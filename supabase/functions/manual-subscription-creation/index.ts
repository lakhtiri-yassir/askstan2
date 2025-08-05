import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId, userId } = await req.json();
    
    console.log('🔧 Manual subscription creation for:', { sessionId, userId });
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('📋 Session retrieved:', session.id, session.payment_status);
    
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    console.log('📊 Subscription details:', subscription.id, subscription.status);
    
    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      plan_type: session.metadata?.plan_type || 'monthly',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };
    
    console.log('💾 Creating subscription record:', subscriptionData);
    
    const { data: createdSub, error: createError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Manual subscription creation error:', createError);
      throw createError;
    }
    
    console.log('✅ Manual subscription created successfully:', createdSub);
    
    return new Response(JSON.stringify({ 
      success: true,
      subscription: createdSub
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Manual subscription creation failed:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});