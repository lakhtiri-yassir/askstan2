import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const { couponCode } = await req.json();
    
    if (!couponCode) {
      throw new Error('Coupon code is required');
    }

    const coupon = await stripe.coupons.retrieve(couponCode);
    
    return new Response(
      JSON.stringify({ 
        valid: true,
        discount: coupon.percent_off ? `${coupon.percent_off}%` : `$${coupon.amount_off / 100}`,
        couponId: coupon.id
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: error.message
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});