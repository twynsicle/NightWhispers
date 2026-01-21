// Deno Edge Function for sending push notifications
// Uses @negrel/webpush library for VAPID signing and encryption
// Supports server-side subscription lookup (bypasses RLS)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  roomId?: string
}

interface RequestBody {
  // Direct mode: pass subscription directly
  subscription?: PushSubscription
  // Lookup mode: pass recipientId for 1-to-1
  recipientId?: string
  // Lookup mode: pass roomId for broadcast (sends to all in room)
  roomId?: string
  // Exclude sender from broadcast notifications
  excludeSenderId?: string
  // Notification payload
  payload: PushPayload
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { subscription, recipientId, roomId, excludeSenderId, payload } = body

    // Validate payload
    if (!payload?.title || !payload?.body) {
      return new Response(
        JSON.stringify({ error: 'Payload must include title and body' }),
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

    // Determine subscriptions to send to
    let subscriptions: PushSubscription[] = []

    if (subscription) {
      // Direct mode: use provided subscription
      if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return new Response(
          JSON.stringify({ error: 'Invalid subscription format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      subscriptions = [subscription]
    } else if (recipientId || roomId) {
      // Lookup mode: query subscriptions from database
      // Create Supabase client with service_role key (bypasses RLS)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      if (recipientId) {
        // 1-to-1 message: get subscription for specific recipient
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('participant_id', recipientId)
          .single()

        if (error) {
          // No subscription found - not an error, recipient just hasn't subscribed
          if (error.code === 'PGRST116') {
            return new Response(
              JSON.stringify({ success: true, sent: 0, reason: 'no_subscription' }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }
          throw error
        }

        subscriptions = [{
          endpoint: data.endpoint,
          keys: { p256dh: data.p256dh, auth: data.auth },
        }]
      } else if (roomId) {
        // Broadcast: get all subscriptions for active participants in room
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select(`
            participant_id,
            endpoint,
            p256dh,
            auth,
            participants!inner(room_id, is_active)
          `)
          .eq('participants.room_id', roomId)
          .eq('participants.is_active', true)

        if (error) {
          throw error
        }

        // Filter out sender and map to subscription format
        subscriptions = (data || [])
          .filter(sub => !excludeSenderId || sub.participant_id !== excludeSenderId)
          .map(sub => ({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }))

        if (subscriptions.length === 0) {
          return new Response(
            JSON.stringify({ success: true, sent: 0, reason: 'no_subscriptions' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide subscription, recipientId, or roomId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create application server with VAPID keys
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: 'mailto:admin@nightwhispers.app',
      vapidKeys: {
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      },
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: sub.keys,
        })
        await subscriber.pushTextMessage(JSON.stringify(payload), {})
        return { endpoint: sub.endpoint, success: true }
      })
    )

    // Count successes and failures
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const expired = results.filter(
      r => r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410
    ).length

    return new Response(
      JSON.stringify({ success: true, sent, failed, expired }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Push error:', error)

    // Handle expired subscription (410 Gone) for direct mode
    if ((error as { statusCode?: number }).statusCode === 410) {
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
