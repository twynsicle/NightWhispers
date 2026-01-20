// Deno Edge Function for sending push notifications
// Uses @negrel/webpush library for VAPID signing and encryption

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import * as webpush from 'jsr:@negrel/webpush'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscription, payload } = await req.json()

    // Validate required fields
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return new Response(JSON.stringify({ error: 'Push not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create application server with VAPID keys
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: 'mailto:admin@nightwhispers.app',
      vapidKeys: {
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      },
    })

    // Subscribe to push service
    const subscriber = appServer.subscribe({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    // Send notification
    await subscriber.pushTextMessage(JSON.stringify(payload), {})

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push error:', error)

    // Handle expired subscription (410 Gone)
    if (error.statusCode === 410) {
      return new Response(
        JSON.stringify({ success: false, expired: true }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
