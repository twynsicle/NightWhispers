import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Cleanup Expired Rooms Edge Function
 *
 * Automatically deletes rooms where expires_at < now().
 * Cascading deletes remove all participants and messages.
 *
 * Invocation:
 * - Manual: npx supabase functions invoke cleanup-expired-rooms
 * - Scheduled: pg_cron or external scheduler (Vercel Cron, GitHub Actions)
 *
 * Expected schedule: Hourly (every hour at :00)
 *
 * Returns:
 * - success: true if deletion completed
 * - deletedCount: number of rooms deleted
 * - deletedRooms: array of room codes that were deleted
 */
serve(async (_req) => {
  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete rooms where expires_at is in the past
    const { data, error } = await supabase
      .from('rooms')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id, code')

    if (error) {
      console.error('Error deleting expired rooms:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Deleted ${data?.length || 0} expired rooms:`, data?.map(r => r.code).join(', '))

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: data?.length || 0,
        deletedRooms: data?.map(r => r.code) || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
