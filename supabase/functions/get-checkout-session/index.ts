import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    console.log('🔍 Getting checkout session details...');
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log('📋 Retrieving session:', sessionId);
    
    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    
    console.log('✅ Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      subscription_id: session.subscription,
      customer_id: session.customer,
      metadata: session.metadata
    });
    
    let subscriptionDetails = null;
    if (session.subscription) {
      subscriptionDetails = await stripe.subscriptions.retrieve(session.subscription as string);
      console.log('📊 Subscription details:', {
        id: subscriptionDetails.id,
        status: subscriptionDetails.status,
        current_period_start: subscriptionDetails.current_period_start,
        current_period_end: subscriptionDetails.current_period_end
      });
    }
    
    return new Response(
      JSON.stringify({ 
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer_id: session.customer,
          subscription_id: session.subscription,
          metadata: session.metadata,
          amount_total: session.amount_total,
          currency: session.currency
        },
        subscription: subscriptionDetails ? {
          id: subscriptionDetails.id,
          status: subscriptionDetails.status,
          current_period_start: subscriptionDetails.current_period_start,
          current_period_end: subscriptionDetails.current_period_end,
          plan_type: session.metadata?.plan_type || 'monthly'
        } : null
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
    console.error('❌ Get checkout session error:', error);
    
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