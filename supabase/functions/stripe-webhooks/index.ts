import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🎣 Webhook received:', req.method);
  console.log('📋 Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Get the raw body and signature
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  console.log('📝 Webhook body length:', body.length);
  console.log('🔐 Stripe signature present:', !!signature);
  
  if (!signature) {
    console.error('❌ No stripe-signature header found');
    console.log('Available headers:', Object.fromEntries(req.headers.entries()));
    return new Response(JSON.stringify({ 
      error: 'Missing stripe-signature header',
      received_headers: Object.fromEntries(req.headers.entries())
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let event;
  
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log('🔑 Webhook secret configured:', !!webhookSecret);
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ 
        error: 'Webhook secret not configured' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    
    console.log('✅ Webhook event verified:', event.type);
    console.log('📋 Event data preview:', {
      id: event.id,
      type: event.type,
      created: event.created
    });
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ 
      error: 'Webhook signature verification failed',
      details: err.message,
      signature_present: !!signature,
      body_length: body.length
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Initialize Supabase with service role key (no auth headers needed)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  console.log('🔄 Processing event:', event.type);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Checkout session completed:', {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          payment_status: session.payment_status,
          metadata: session.metadata
        });
        
        if (session.mode === 'subscription' && session.subscription) {
          const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
          });
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          console.log('📊 Subscription retrieved:', {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end
          });
          
          const userId = session.metadata?.user_id;
          if (!userId) {
            console.error('❌ No user_id in session metadata');
            throw new Error('No user_id found in session metadata');
          }
          
          // Create subscription record in database
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan_type: (session.metadata?.plan_type || 'monthly') as 'monthly' | 'yearly',
            status: subscription.status as 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          };
          
          console.log('💾 Creating subscription record:', subscriptionData);
          
          // Try to update existing subscription first, then insert if not found
          const { data: existingData, error: selectError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
            
          let upsertData, upsertError;
          
          if (existingData) {
            // Update existing subscription
            console.log('🔄 Updating existing subscription for user:', userId);
            const { data, error } = await supabase
              .from('subscriptions')
              .update({
                ...subscriptionData,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .select()
              .single();
            upsertData = data;
            upsertError = error;
          } else {
            // Insert new subscription
            console.log('➕ Creating new subscription for user:', userId);
            const { data, error } = await supabase
              .from('subscriptions')
              .insert(subscriptionData)
              .select()
              .single();
            upsertData = data;
            upsertError = error;
          }
          
          if (upsertError) {
            console.error('❌ Subscription database error:', upsertError);
            throw upsertError;
          }
          
          console.log('✅ Subscription created/updated successfully:', upsertData);
          
          // Send welcome email
          try {
            const customerEmail = session.customer_details?.email;
            if (customerEmail) {
              await supabase.functions.invoke('send-email', {
                body: {
                  type: 'subscription_success',
                  email: customerEmail,
                  data: {
                    planType: session.metadata?.plan_type || 'monthly'
                  }
                }
              });
              console.log('📧 Welcome email sent to:', customerEmail);
            }
          } catch (emailError) {
            console.error('📧 Email sending failed:', emailError);
            // Don't fail the webhook for email errors
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end
        });
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('❌ Subscription update error:', error);
          throw error;
        }
        
        console.log('✅ Subscription updated in database');
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Subscription deleted:', subscription.id);
        
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('❌ Subscription deletion error:', error);
          throw error;
        }
        
        console.log('✅ Subscription marked as cancelled');
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💰 Payment succeeded for invoice:', invoice.id);
        
        if (invoice.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);
          
          if (error) {
            console.error('❌ Payment success update error:', error);
            throw error;
          }
          
          console.log('✅ Subscription activated after payment');
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💸 Payment failed for invoice:', invoice.id);
        
        if (invoice.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);
          
          if (error) {
            console.error('❌ Payment failure update error:', error);
            throw error;
          }
          
          console.log('✅ Subscription marked as past_due');
          
          // Send payment failed email
          if (invoice.customer_email) {
            try {
              await supabase.functions.invoke('send-email', {
                body: {
                  type: 'payment_failed',
                  email: invoice.customer_email,
                  data: {
                    retryUrl: `${Deno.env.get('VITE_APP_URL')}/settings`
                  }
                }
              });
              console.log('📧 Payment failure email sent');
            } catch (emailError) {
              console.error('📧 Payment failure email error:', emailError);
            }
          }
        }
        break;
      }
      
      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }
    
    console.log('✅ Webhook processed successfully');
    
    return new Response(JSON.stringify({ 
      received: true,
      event_type: event.type,
      event_id: event.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      event_type: event?.type || 'unknown',
      event_id: event?.id || 'unknown',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});