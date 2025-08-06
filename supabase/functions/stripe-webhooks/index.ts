import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🎯 Webhook received:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔧 Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey
    });

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    console.log('🔐 Stripe signature present:', !!signature);
    
    if (!signature) {
      console.error('❌ No stripe-signature header found');
      throw new Error('No stripe-signature header value was provided');
    }

    // Get raw body for signature verification
    const body = await req.text();
    console.log('📝 Webhook body length:', body.length);

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase with SERVICE ROLE (no user auth needed for webhooks)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🎪 Processing webhook event:', event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('💳 Processing checkout completion...');
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Checkout session data:', {
          id: session.id,
          customer: session.customer,
          mode: session.mode,
          payment_status: session.payment_status,
          subscription: session.subscription,
          metadata: session.metadata
        });

        if (session.mode === 'subscription' && session.subscription) {
          // Get the subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          console.log('Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end
          });

          // Extract user info from metadata
          const userId = session.metadata?.user_id;
          const planType = session.metadata?.plan_type;

          if (!userId) {
            console.error('❌ No user_id in session metadata');
            throw new Error('No user_id found in session metadata');
          }

          // Create or update subscription record
          console.log('💾 Upserting subscription record...');
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              plan_type: planType || 'monthly',
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
              onConflict: 'user_id'
            });

          if (upsertError) {
            console.error('❌ Database upsert error:', upsertError);
            throw upsertError;
          }

          console.log('✅ Subscription record created/updated successfully');

          // Optional: Send welcome email
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'subscription_success',
                email: session.customer_details?.email,
                data: {
                  planType: planType || 'monthly',
                  subscriptionId: subscription.id
                }
              }
            });
            console.log('📧 Welcome email sent');
          } catch (emailError) {
            console.log('⚠️ Email sending failed (non-critical):', emailError);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        console.log('🔄 Processing subscription update...');
        const subscription = event.data.object as Stripe.Subscription;

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('❌ Subscription update error:', updateError);
          throw updateError;
        }

        console.log('✅ Subscription updated successfully');
        break;
      }

      case 'customer.subscription.deleted': {
        console.log('🗑️ Processing subscription cancellation...');
        const subscription = event.data.object as Stripe.Subscription;

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);

        if (deleteError) {
          console.error('❌ Subscription cancellation error:', deleteError);
          throw deleteError;
        }

        console.log('✅ Subscription cancelled successfully');
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('💰 Processing successful payment...');
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const { error: paymentError } = await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription);

          if (paymentError) {
            console.error('❌ Payment success update error:', paymentError);
            throw paymentError;
          }

          console.log('✅ Payment success recorded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        console.log('💸 Processing failed payment...');
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const { error: failureError } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription);

          if (failureError) {
            console.error('❌ Payment failure update error:', failureError);
            throw failureError;
          }

          console.log('✅ Payment failure recorded');

          // Optional: Send payment failed email
          try {
            if (invoice.customer_email) {
              await supabase.functions.invoke('send-email', {
                body: {
                  type: 'payment_failed',
                  email: invoice.customer_email,
                  data: {
                    retryUrl: `${Deno.env.get('VITE_APP_URL')}/settings`,
                    amount: invoice.amount_due / 100
                  }
                }
              });
              console.log('📧 Payment failure email sent');
            }
          } catch (emailError) {
            console.log('⚠️ Payment failure email failed (non-critical):', emailError);
          }
        }
        break;
      }

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return new Response(
      JSON.stringify({ received: true, processed: event.type }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});