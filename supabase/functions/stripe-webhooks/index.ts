import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  let event;
  
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed.`, { status: 400 });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription') {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
          apiVersion: '2023-10-16',
        });
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Create subscription record
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.metadata?.user_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan_type: session.metadata?.plan_type || 'monthly',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          });
        
        // Send welcome email
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'subscription_success',
            email: session.customer_details?.email,
            data: {
              planType: session.metadata?.plan_type || 'monthly'
            }
          }
        });
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);
      
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id);
      
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', invoice.subscription);
      }
      
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);
        
        // Send payment failed email
        if (invoice.customer_email) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'payment_failed',
              email: invoice.customer_email,
              data: {
                retryUrl: `${Deno.env.get('VITE_APP_URL')}/settings`
              }
            }
          });
        }
      }
      
      break;
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});