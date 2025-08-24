// supabase/functions/validate-coupon/index.ts
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const { couponCode } = await req.json();
    
    if (!couponCode) {
      throw new Error('Coupon code is required');
    }

    console.log('🎫 Validating coupon:', couponCode);

    // Validate coupon with Stripe
    const coupon = await stripe.coupons.retrieve(couponCode);
    
    console.log('✅ Coupon details:', {
      id: coupon.id,
      percent_off: coupon.percent_off,
      amount_off: coupon.amount_off,
      valid: coupon.valid
    });

    const discount = coupon.percent_off 
      ? `${coupon.percent_off}%` 
      : `$${(coupon.amount_off || 0) / 100}`;

    return new Response(
      JSON.stringify({ 
        valid: true,
        discount: discount,
        couponId: coupon.id,
        is100Percent: coupon.percent_off === 100
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.log('❌ Coupon validation failed:', error.message);
    
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: error.message.includes('No such coupon') ? 'Invalid coupon code' : 'Coupon validation failed'
      }), 
      { 
        status: 200, // Return 200 so frontend can handle the validation result
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});