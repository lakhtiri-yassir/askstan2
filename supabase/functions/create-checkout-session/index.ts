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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { planType } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    let customer;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (subscription?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
    }
    
    // Create checkout session
    const priceId = planType === 'monthly' 
      ? Deno.env.get('VITE_STRIPE_PRICE_MONTHLY')
      : Deno.env.get('VITE_STRIPE_PRICE_YEARLY');
    
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${Deno.env.get('VITE_APP_URL')}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${Deno.env.get('VITE_APP_URL')}/plans`,
      metadata: {
        user_id: user.id,
        plan_type: planType
      }
    });
    
    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});